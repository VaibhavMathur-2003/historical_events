const db = require('../db/index.js');

async function getTimeline(req, res, next) {
  const rootId = req.params.rootEventId;
  try {
    const allEventsRes = await db.query(
      `WITH RECURSIVE event_tree AS (
        SELECT * FROM historical_events_db WHERE event_id = $1
        UNION
        SELECT e.* FROM historical_events_db e
        INNER JOIN event_tree et ON e.parent_id = et.event_id
      )
      SELECT * FROM event_tree;`,
      [rootId]
    );
    if (allEventsRes.rowCount === 0) {
      return next({ status: 404, message: 'Root event not found' });
    }
    const events = allEventsRes.rows;
    const nodeMap = new Map();
    for (const event of events) {
      nodeMap.set(event.event_id, {
        event_id: event.event_id,
        event_name: event.event_name,
        description: event.description,
        start_date: event.start_date,
        end_date: event.end_date,
        duration_minutes: event.duration_minutes,
        parent_id: event.parent_id,
        children: [],
      });
    }
    let root = null;
    for (const node of nodeMap.values()) {
      if (!node.parent_id || !nodeMap.has(node.parent_id)) {
        root = node;
      } else {
        nodeMap.get(node.parent_id).children.push(node);
      }
    }
    if (!root) {
      return next({ status: 500, message: 'Unable to resolve root hierarchy' });
    }
    return res.status(200).json(root);
  } catch (err) {
    next(err);
  }
}

module.exports = { getTimeline }; 