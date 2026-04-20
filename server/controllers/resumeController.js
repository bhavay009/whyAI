const pdfParse = require('pdf-parse');
const aiService = require('../services/aiService');

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are supported.' });
    }

    // Extract text from the PDF buffer
    console.log('Starting PDF extraction...');
    const pdfData = await pdfParse(req.file.buffer);
    const rawText = pdfData.text;
    console.log('PDF text extracted successfully, length:', rawText.length);

    // Call the AI Service to process and return JSON
    console.log('Calling AI service for extraction...');
    const extractedData = await aiService.extractResumeData(rawText);
    console.log('AI extraction complete.');

    res.json(extractedData);
  } catch (error) {
    console.error('RESUME_CONTROLLER_ERROR:', error);
    res.status(500).json({ error: 'Failed to process the resume.', details: error.message });
  }
};

module.exports = {
  uploadResume
};
