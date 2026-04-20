const express = require('express');
const cors = require('cors');
require('dotenv').config();

const interviewRoutes = require('./routes/interview');
const resumeRoutes = require('./routes/resume');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/interview', interviewRoutes);
app.use('/api/resume', resumeRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
