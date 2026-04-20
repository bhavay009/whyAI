const aiService = require('../services/aiService');
const sessionStore = require('../services/sessionStore');
const crypto = require('crypto');

const generateQuestions = async (req, res) => {
  try {
    const { role, project, experienceLevel } = req.body;

    if (!role || !project) {
      return res.status(400).json({ error: 'Role and project details are required.' });
    }

    const questions = await aiService.generateInterviewQuestions({ role, project, experienceLevel });
    
    // Create a new session
    const sessionId = crypto.randomUUID();
    await sessionStore.createSession(sessionId, {
      role,
      project,
      experienceLevel,
      questions,
      currentQuestionIndex: 0,
      followUpCount: 0
    });

    res.json({ questions, sessionId });
  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({ error: 'Failed to generate interview questions.' });
  }
};

const startInterview = async (req, res) => {
  // Keeping this for backward compatibility if needed, but generateQuestions is preferred
  try {
    const { role, project, experienceLevel } = req.body;
    const firstQuestion = await aiService.generateInitialQuestion({ role, project, experienceLevel });
    res.json({ message: firstQuestion });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start interview.' });
  }
};

const chat = async (req, res) => {
  try {
    const { history, answer, sessionId } = req.body;

    if (!sessionId || !answer) {
      return res.status(400).json({ error: 'Session ID and user answer are required.' });
    }

    const session = await sessionStore.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    // Save user message to transcript
    session.transcript.push({ role: 'user', content: answer, timestamp: new Date().toISOString() });

    let nextResponse;
    let isTransition = false;

    // Logic for "2-Deep" follow-up or transition
    if (session.followUpCount >= 2) {
      // Transition to next main question if available
      session.currentQuestionIndex += 1;
      session.followUpCount = 0;

      if (session.currentQuestionIndex < session.questions.length) {
        nextResponse = `Thanks for that detailed explanation. Let's move on to the next topic: ${session.questions[session.currentQuestionIndex]}`;
        isTransition = true;
      } else {
        nextResponse = "That concludes our interview session! Thank you for sharing your technical expertise. We'll review your transcript and get back to you.";
      }
    } else {
      // Generate dynamic follow-up
      nextResponse = await aiService.generateFollowUp({ history, answer });
      session.followUpCount += 1;
    }

    // Save AI response to transcript
    session.transcript.push({ role: 'ai', content: nextResponse, timestamp: new Date().toISOString() });
    
    await sessionStore.saveSession(sessionId, session);

    res.json({ 
      message: nextResponse, 
      currentQuestionIndex: session.currentQuestionIndex,
      isFinished: session.currentQuestionIndex >= session.questions.length,
      isTransition
    });
  } catch (error) {
    console.error('Error during chat:', error);
    res.status(500).json({ error: 'Failed to process chat message.' });
  }
};

module.exports = {
  generateQuestions,
  startInterview,
  chat
};
