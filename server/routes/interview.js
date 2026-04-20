const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');

router.post('/generate-questions', interviewController.generateQuestions);
router.post('/start', interviewController.startInterview);
router.post('/chat', interviewController.chat);
router.post('/follow-up', interviewController.followUp);

module.exports = router;
