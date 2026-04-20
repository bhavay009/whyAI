const aiService = require('../services/aiService');

const generateQuestions = async (req, res) => {
  try {
    const { role, project, experienceLevel } = req.body;

    if (!role || !project) {
      return res.status(400).json({ error: 'Role and project details are required.' });
    }

    const questions = await aiService.generateInterviewQuestions({ role, project, experienceLevel });
    res.json({ questions });
  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({ error: 'Failed to generate interview questions.' });
  }
};

const startInterview = async (req, res) => {
  try {
    const { role, project, experienceLevel } = req.body;
    
    if (!role || !project) {
      return res.status(400).json({ error: 'Role and project details are required.' });
    }

    const firstQuestion = await aiService.generateInitialQuestion({ role, project, experienceLevel });
    res.json({ message: firstQuestion });
  } catch (error) {
    console.error('Error starting interview:', error);
    res.status(500).json({ error: 'Failed to start interview.' });
  }
};

const chat = async (req, res) => {
  try {
    const { history, answer } = req.body;

    if (!history || !answer) {
      return res.status(400).json({ error: 'Interview history and user answer are required.' });
    }

    const nextResponse = await aiService.generateFollowUp({ history, answer });
    res.json({ message: nextResponse });
  } catch (error) {
    console.error('Error during chat:', error);
    res.status(500).json({ error: 'Failed to get follow-up question.' });
  }
};

module.exports = {
  generateQuestions,
  startInterview,
  chat
};
