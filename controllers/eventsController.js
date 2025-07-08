const { v4: uuidv4 } = require('uuid');
const { ingestFile } = require('../services/ingest.js');
const { getJob } = require('../utils/jobStore');
const db = require('../db/index.js');
const { parseISO, isValid } = require('date-fns');


async function startIngestion(req, res, next) {
  try {
    const filePath = req.body.filePath;
    if (!filePath) return next({ status: 400, message: 'Missing filePath' });
    const jobId = `ingest-job-${uuidv4()}`;
    ingestFile(filePath, jobId);
    return res.status(202).json({
      status: 'Ingestion initiated',
      jobId,
      message: `Check /api/events/ingestion-status/${jobId} for updates.`,
    });
  } catch (err) {
    next(err);
  }
}

async function getIngestionStatus(req, res, next) {
  try {
    const job = getJob(req.params.jobId);
    if (!job) return next({ status: 404, message: 'Job not found' });
    return res.status(200).json(job);
  } catch (err) {
    next(err);
  }
}


const allowedSortFields = ['event_name', 'start_date', 'end_date', 'duration_minutes'];
const allowedSortOrders = ['asc', 'desc'];

async function searchEvents(req, res, next) {
  try {
    const {
      name,
      start_date_after,
      end_date_before,
      sortBy = 'start_date',
      sortOrder = 'asc',
      page = 1,
      limit = 10,
    } = req.query;
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'start_date';
    const order = allowedSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : 'asc';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const values = [];
    let paramIndex = 1;
    if (name) {
      conditions.push(`event_name ILIKE $${paramIndex++}`);
      values.push(`%${name}%`);
    }
    if (start_date_after) {
      const parsed = parseISO(start_date_after);
      if (!isValid(parsed)) {
        return next({ status: 400, message: 'Invalid start_date_after format' });
      }
      conditions.push(`start_date >= $${paramIndex++}`);
      values.push(parsed.toISOString());
    }
    if (end_date_before) {
      const parsed = parseISO(end_date_before);
      if (!isValid(parsed)) {
        return next({ status: 400, message: 'Invalid end_date_before format' });
      }
      conditions.push(`end_date <= $${paramIndex++}`);
      values.push(parsed.toISOString());
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countQuery = `SELECT COUNT(*) FROM historical_events_db ${whereClause}`;
    const countResult = await db.query(countQuery, values);
    const totalEvents = parseInt(countResult.rows[0].count);
    const dataQuery = `
      SELECT event_id, event_name
      FROM historical_events_db
      ${whereClause}
      ORDER BY ${sortField} ${order}
      LIMIT $${paramIndex++}
      OFFSET $${paramIndex}
    `;
    values.push(parseInt(limit), parseInt(offset));
    const dataResult = await db.query(dataQuery, values);
    return res.status(200).json({
      totalEvents,
      page: parseInt(page),
      limit: parseInt(limit),
      events: dataResult.rows,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { startIngestion, getIngestionStatus, searchEvents }; 