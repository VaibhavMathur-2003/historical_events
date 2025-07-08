const express = require('express');
const router = express.Router();

const { getTimeline } = require('../controllers/timelineController');

router.get('/:rootEventId', getTimeline);

module.exports = router; 