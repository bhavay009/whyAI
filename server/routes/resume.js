const express = require('express');
const router = express.Router();
const multer = require('multer');
const resumeController = require('../controllers/resumeController');

// Multer config for in-memory storage
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('resume'), resumeController.uploadResume);

module.exports = router;
