const db = require('../db/index');
const { findLargestGap } = require('../services/temporalGap');
const { findShortestPath, buildGraph } = require('../utils/eventGraph');


async function getOverlappingEvents(req, res, next) {
  try {
    const query = `
      SELECT
        e1.event_id AS event1_id,
        e1.event_name AS event1_name,
        e1.start_date AS event1_start,
        e1.end_date AS event1_end,
        e2.event_id AS event2_id,
        e2.event_name AS event2_name,
        e2.start_date AS event2_start,
        e2.end_date AS event2_end,
        LEAST(e1.end_date, e2.end_date) - GREATEST(e1.start_date, e2.start_date) AS overlap_interval
      FROM historical_events_db e1
      JOIN historical_events_db e2 ON
        e1.event_id < e2.event_id AND
        e1.start_date < e2.end_date AND
        e1.end_date > e2.start_date
    `;
    const result = await db.query(query);
    const overlaps = result.rows.map(row => {
      let overlapMinutes = 0;
      if (row.overlap_interval) {
        const interval = row.overlap_interval;
        overlapMinutes = 
          (interval.years || 0) * 365 * 24 * 60 +
          (interval.months || 0) * 30 * 24 * 60 +
          (interval.days || 0) * 24 * 60 +
          (interval.hours || 0) * 60 +
          (interval.minutes || 0) +
          Math.floor((interval.seconds || 0) / 60);
      }
      return {
        overlappingEventPairs: [
          {
            event_id: row.event1_id,
            event_name: row.event1_name,
            start_date: row.event1_start,
            end_date: row.event1_end,
          },
          {
            event_id: row.event2_id,
            event_name: row.event2_name,
            start_date: row.event2_start,
            end_date: row.event2_end,
          }
        ],
        overlap_duration_minutes: overlapMinutes
      };
    });
    return res.status(200).json(overlaps);
  } catch (err) {
    next(err);
  }
}


async function getTemporalGaps(req, res, next) {
  const { startDate, endDate } = req.query;
  try {
    const result = await findLargestGap(startDate, endDate);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}


const getInfluencePath = async (req, res, next) => {
  const { sourceEventId, targetEventId } = req.query;
  if (!sourceEventId || !targetEventId) {
    return next({ status: 400, message: 'SourceEventId and targetEventId are required.' });
  }
  try {
    const { rows: events } = await db.query(`
      SELECT event_id, event_name, duration_minutes, parent_id
      FROM historical_events_db
    `);
    const graph = buildGraph(events);
    const eventMap = new Map(events.map(e => [e.event_id, e]));
    const result = findShortestPath(graph, eventMap, sourceEventId, targetEventId);
    if (!result.path.length) {
      return res.status(200).json({
        sourceEventId,
        targetEventId,
        shortestPath: [],
        totalDurationMinutes: 0,
        message: 'No temporal path found from source to target event.',
      });
    }
    return res.status(200).json({
      sourceEventId,
      targetEventId,
      shortestPath: result.path.map(eventId => {
        const event = eventMap.get(eventId);
        return {
          event_id: event.event_id,
          event_name: event.event_name,
          duration_minutes: event.duration_minutes,
        };
      }),
      totalDurationMinutes: result.totalDuration,
      message: 'Shortest temporal path found from source to target event.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getOverlappingEvents, getTemporalGaps, getInfluencePath }; 