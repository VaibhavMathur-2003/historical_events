const express = require('express');
const router = express.Router();

const { getOverlappingEvents, getTemporalGaps, getInfluencePath } = require('../controllers/insightsController');

router.get('/overlapping-events', getOverlappingEvents);
router.get('/temporal-gaps', getTemporalGaps);
router.get('/event-influence', getInfluencePath);

module.exports = router; 