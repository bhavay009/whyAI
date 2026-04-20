const fs = require('fs').promises;
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/sessions.json');

const ensureFile = async () => {
  try {
    await fs.access(DATA_PATH);
  } catch {
    await fs.writeFile(DATA_PATH, JSON.stringify({}));
  }
};

const getAllSessions = async () => {
  await ensureFile();
  const data = await fs.readFile(DATA_PATH, 'utf8');
  return JSON.parse(data);
};

const getSession = async (sessionId) => {
  const sessions = await getAllSessions();
  return sessions[sessionId];
};

const saveSession = async (sessionId, sessionData) => {
  const sessions = await getAllSessions();
  sessions[sessionId] = {
    ...sessions[sessionId],
    ...sessionData,
    updatedAt: new Date().toISOString()
  };
  await fs.writeFile(DATA_PATH, JSON.stringify(sessions, null, 2));
  return sessions[sessionId];
};

const createSession = async (sessionId, initialData) => {
  const sessions = await getAllSessions();
  sessions[sessionId] = {
    ...initialData,
    transcript: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await fs.writeFile(DATA_PATH, JSON.stringify(sessions, null, 2));
  return sessions[sessionId];
};

module.exports = {
  getSession,
  saveSession,
  createSession,
  getAllSessions
};
