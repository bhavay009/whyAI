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
    const pdfData = await pdfParse(req.file.buffer);
    const rawText = pdfData.text;

    // Call the AI Service to process and return JSON
    const extractedData = await aiService.extractResumeData(rawText);

    res.json(extractedData);
  } catch (error) {
    console.error('Error extracting resume data:', error);
    res.status(500).json({ error: 'Failed to process the resume.' });
  }
};

module.exports = {
  uploadResume
};
