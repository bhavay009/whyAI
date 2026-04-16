const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');

router.post('/start', interviewController.startInterview);
router.post('/chat', interviewController.chat);

module.exports = router;
