const db = require('../db');

async function findLargestGap(startDate, endDate) {
  if (!startDate || !endDate || isNaN(Date.parse(startDate)) || isNaN(Date.parse(endDate))) {
    throw { status: 400, message: 'Invalid or missing startDate or endDate' };
  }

  const { rows: events } = await db.query(
    `
    SELECT event_id, event_name, start_date, end_date
    FROM historical_events_db
    WHERE 
      start_date >= $1 AND end_date <= $2
    ORDER BY start_date ASC
    `,
    [startDate, endDate]
  );

  if (events.length < 2) {
    return {
      largestGap: null,
      message: 'No significant temporal gaps found within the specified range, or too few events.',
    };
  }

  let largestGap = null;

  for (let i = 0; i < events.length - 1; i++) {
    const curr = events[i];
    const next = events[i + 1];

    const gapStart = new Date(curr.end_date);
    const gapEnd = new Date(next.start_date);
    const gapMinutes = (gapEnd - gapStart) / (1000 * 60);

    if (gapMinutes > 0 && (!largestGap || gapMinutes > largestGap.durationMinutes)) {
      largestGap = {
        startOfGap: gapStart.toISOString(),
        endOfGap: gapEnd.toISOString(),
        durationMinutes: Math.floor(gapMinutes),
        precedingEvent: {
          event_id: curr.event_id,
          event_name: curr.event_name,
          end_date: curr.end_date,
        },
        succeedingEvent: {
          event_id: next.event_id,
          event_name: next.event_name,
          start_date: next.start_date,
        },
      };
    }
  }

  return {
    largestGap,
    message: largestGap
      ? 'Largest temporal gap identified.'
      : 'No significant temporal gaps found within the specified range.',
  };
}

module.exports = {
  findLargestGap,
};
