const fs = require('fs');
const readline = require('readline');
const db = require('../db/index.js');
const { validateLine } = require('../utils/validators.js');
const { createJob, updateJob, getJob } = require('../utils/jobStore.js');

async function ingestFile(filePath, jobId) {
  createJob(jobId);
  const job = getJob(jobId);

  try {
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const records = [];
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let lineNum = 0;

    for await (const line of rl) {
      lineNum++;
      job.totalLines++;

      const fields = line.split('|');
      const error = validateLine(fields);

      if (error) {
        job.errorLines++;
        job.errors.push(`Line ${lineNum}: ${error}: '${line}'`);
        continue;
      }

      const [eventId, name, start, end, parentId, res_value, desc] = fields;
      records.push({
        lineNum,
        eventId,
        name,
        start: new Date(start),
        end: new Date(end),
        parentId: parentId === 'NULL' ? null : parentId,
        res_value: res_value ? parseInt(res_value) : null,
        desc: desc || null,
      });
    }

    
    const eventIds = new Set(records.map(r => r.eventId));
    const invalidParentRecords = [];
    
    for (const record of records) {
      if (record.parentId && !eventIds.has(record.parentId)) {
        job.errorLines++;
        job.errors.push(`Line ${record.lineNum}: Parent event ${record.parentId} not found in dataset for event ${record.eventId}`);
        invalidParentRecords.push(record);
      }
    }

    
    const validRecords = records.filter(record => {
      if (record.parentId && !eventIds.has(record.parentId)) {
        return false; 
      }
      return true;
    });

    
    const seenIds = new Set();
    const duplicateRecords = [];
    const uniqueRecords = validRecords.filter(record => {
      if (seenIds.has(record.eventId)) {
        duplicateRecords.push(record);
        job.errorLines++;
        job.errors.push(`Line ${record.lineNum}: Duplicate event_id ${record.eventId}`);
        return false;
      }
      seenIds.add(record.eventId);
      return true;
    });

    
    function topologicalSort(records) {
      const sorted = [];
      const visited = new Set();
      const visiting = new Set();
      
      const recordMap = new Map();
      records.forEach(record => recordMap.set(record.eventId, record));
      
      function visit(record) {
        if (visiting.has(record.eventId)) {
          console.warn(`Circular dependency detected for event ${record.eventId}`);
          return;
        }
        
        if (visited.has(record.eventId)) return;
        
        visiting.add(record.eventId);
        
        if (record.parentId && recordMap.has(record.parentId)) {
          visit(recordMap.get(record.parentId));
        }
        
        visiting.delete(record.eventId);
        visited.add(record.eventId);
        sorted.push(record);
      }
      
      records.forEach(record => visit(record));
      
      return sorted;
    }
    
    const sortedRecords = topologicalSort(uniqueRecords);

    
    const insertionResults = {
      successful: [],
      failed: [],
      parentUpdates: { successful: 0, failed: 0 }
    };

    try {
      await db.query('BEGIN');

      
      for (const record of sortedRecords) {
        try {
          await db.query(
            `INSERT INTO public.historical_events_db 
             (event_id, event_name, start_date, end_date, parent_id, research_value, description)
             VALUES ($1, $2, $3, $4, NULL, $5, $6)`,
            [
              record.eventId,
              record.name,
              record.start,
              record.end,
              record.res_value,
              record.desc,
            ]
          );
          insertionResults.successful.push(record);
          job.processedLines++;
        } catch (err) {
          insertionResults.failed.push({ record, error: err.message });
          job.errorLines++;
          job.errors.push(`Line ${record.lineNum}: DB Error (Insert): ${err.message}`);
        }
      }

      
      for (const record of sortedRecords) {
        if (record.parentId) {
          const wasInserted = insertionResults.successful.some(r => r.eventId === record.eventId);
          const parentWasInserted = insertionResults.successful.some(r => r.eventId === record.parentId);
          
          if (wasInserted && parentWasInserted) {
            try {
              const result = await db.query(
                `UPDATE public.historical_events_db 
                 SET parent_id = $1 
                 WHERE event_id = $2`,
                [record.parentId, record.eventId]
              );
              
              if (result.rowCount === 0) {
                insertionResults.parentUpdates.failed++;
                job.errorLines++;
                job.errors.push(`Line ${record.lineNum}: Could not update parent_id for event_id ${record.eventId}`);
              } else {
                insertionResults.parentUpdates.successful++;
              }
            } catch (err) {
              insertionResults.parentUpdates.failed++;
              job.errorLines++;
              job.errors.push(`Line ${record.lineNum}: DB Error (Update): ${err.message}`);
            }
          } else {
            insertionResults.parentUpdates.failed++;
            job.errorLines++;
            if (!wasInserted) {
              job.errors.push(`Line ${record.lineNum}: Cannot update parent_id - event ${record.eventId} was not inserted`);
            }
            if (!parentWasInserted) {
              job.errors.push(`Line ${record.lineNum}: Cannot update parent_id - parent event ${record.parentId} was not inserted`);
            }
          }
        }
      }

      
      if (insertionResults.successful.length > 0) {
        await db.query('COMMIT');
      } else {
        await db.query('ROLLBACK');
        job.errors.push('No records were inserted successfully - all insertions failed');
      }

    } catch (err) {
      await db.query('ROLLBACK');
      job.errors.push(`Transaction error: ${err.message}`);
      throw err;
    }

    
    const summary = {
      totalRecords: records.length,
      validRecords: validRecords.length,
      duplicateRecords: duplicateRecords.length,
      successfulInsertions: insertionResults.successful.length,
      failedInsertions: insertionResults.failed.length,
      successfulParentUpdates: insertionResults.parentUpdates.successful,
      failedParentUpdates: insertionResults.parentUpdates.failed,
      invalidParentRecords: invalidParentRecords.length
    };
    
    updateJob(jobId, {
      status: 'COMPLETED',
      endTime: new Date().toISOString(),
      summary
    });


  } catch (err) {
    console.error('Fatal error during ingestion:', err.message);
    updateJob(jobId, {
      status: 'FAILED',
      endTime: new Date().toISOString(),
      errors: [...(job.errors || []), `Fatal error: ${err.message}`]
    });
    throw err;
  }
}

module.exports = { ingestFile };