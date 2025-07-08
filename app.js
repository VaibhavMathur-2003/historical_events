const express = require('express');
const eventsRouter = require('./routes/events');
const timelineRouter = require('./routes/timeline');
const insightsRouter = require('./routes/insights');
const errorHandler = require('./middlewares/errorHandler');
const app = express();

app.use(express.json());
app.use('/api/events', eventsRouter);
app.use('/api/timeline', timelineRouter);
app.use('/api/insights', insightsRouter);


app.use(errorHandler);

module.exports = app;
