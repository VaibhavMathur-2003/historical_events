const express = require('express');
const router = express.Router();

const { startIngestion, getIngestionStatus } = require('../controllers/eventsController');
const { searchEvents } = require('../controllers/eventsController');

router.post('/ingest', startIngestion);
router.get('/ingestion-status/:jobId', getIngestionStatus);
router.get('/search', searchEvents);

module.exports = router; 