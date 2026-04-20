const Groq = require('groq-sdk');

// Initialize Groq API
const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const MODEL = 'llama-3.1-8b-instant';

// Helper to call Groq chat completion
const chat = async (messages) => {
  const response = await groq.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0.7,
  });
  return response.choices[0].message.content;
};

const generateInterviewQuestions = async ({ role, project, experienceLevel }) => {
  if (!groq) {
    console.warn('GROQ_API_KEY not found. Using mock questions.');
    return [
      `How did you handle state management in your ${project}?`,
      `Can you explain the architectural decisions you made for ${project}?`,
      `What were the biggest technical challenges you faced while building ${project}?`,
      `How did you ensure the scalability of ${project}?`,
      `If you were to rebuild ${project} today, what would you change and why?`
    ];
  }

  const prompt = `You are an expert technical interviewer.
Generate exactly 5 specific interview questions for a ${role} position with ${experienceLevel} experience.
The questions MUST be based ONLY on the following project details:
"${project}"

Guidelines:
- Avoid generic questions like "What was your role?" or "What did you learn?"
- Focus on implementation details, technical decisions, and architecture choices
- Each question should be challenging and specific to the project's tech stack or domain
- Return ONLY a JSON array of 5 strings, no extra text

Example format: ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]`;

  const text = await chat([{ role: 'user', content: prompt }]);

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      // fall through to line split
    }
  }
  return text.split('\n').filter(q => q.trim().length > 5).slice(0, 5);
};

const generateInitialQuestion = async (opts) => {
  const questions = await generateInterviewQuestions(opts);
  return questions[0];
};

const generateFollowUp = async ({ history, answer }) => {
  if (!groq) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const depth = history.length;
    if (depth < 4) {
      return `Interesting! You mentioned "${answer.substring(0, 40)}...". What led you to that specific design choice?`;
    }
    return `Can you dive deeper into the trade-offs involved? How did it affect performance or maintainability?`;
  }

  const messages = history.map(msg => ({
    role: msg.role === 'ai' ? 'assistant' : 'user',
    content: msg.content
  }));

  // Ensure last message is the current user answer
  if (messages[messages.length - 1]?.role !== 'user') {
    messages.push({ role: 'user', content: answer });
  }

  // System instruction
  messages.unshift({
    role: 'system',
    content: `You are a technical interviewer conducting a project-based interview. 
Ask a focused follow-up question based on the candidate's last answer.
Keep your response to 1-2 sentences max — just the follow-up question.
Do not repeat previous questions.`
  });

  return await chat(messages);
};

const extractResumeData = async (text) => {
  if (!groq) {
    console.warn('GROQ_API_KEY not set. Returning mock resume data.');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      projects: [
        {
          name: 'E-Commerce Platform',
          description: 'Built a fully functional e-commerce platform using React, Node.js, and Stripe.',
          technologies: ['React', 'Stripe', 'Node.js']
        },
        {
          name: 'Task Management App',
          description: 'Developed a Kanban board with real-time updates.',
          technologies: ['Vue.js', 'Firebase']
        }
      ],
      technologies: ['React', 'Vue.js', 'Node.js', 'Firebase', 'Stripe'],
      skills: ['Frontend Development', 'Payment Integration', 'Real-time Databases']
    };
  }

  const prompt = `Extract structured information from the following resume text.
Return ONLY a valid JSON object with this exact structure (no extra text):
{
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief description of what it does and your role",
      "technologies": ["Tech1", "Tech2"]
    }
  ],
  "technologies": ["list", "of", "all", "technologies"],
  "skills": ["list", "of", "skills"]
}

Resume Text:
${text}`;

  const responseText = await chat([{ role: 'user', content: prompt }]);

  // Extract JSON from the response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('Failed to parse Groq JSON response:', e.message);
      throw new Error('AI returned malformed JSON');
    }
  }
  throw new Error('No JSON found in AI response');
};

module.exports = {
  generateInterviewQuestions,
  generateInitialQuestion,
  generateFollowUp,
  extractResumeData
};
