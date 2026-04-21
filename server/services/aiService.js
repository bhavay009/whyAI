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

  if (messages[messages.length - 1]?.role !== 'user') {
    messages.push({ role: 'user', content: answer });
  }

  messages.unshift({
    role: 'system',
    content: `You are a technical interviewer conducting a project-based interview. 
Ask a focused follow-up question based on the candidate's last answer.
Keep your response to 1-2 sentences max — just the follow-up question.
Do not repeat previous questions.`
  });

  return await chat(messages);
};

/**
 * Adaptive follow-up: cycles through WHY / EDGE CASES / ALTERNATIVES
 * based on the follow-up depth (0 = why, 1 = edge cases, 2 = alternatives)
 * projectContext: { role, project } from the session
 */
const generateAdaptiveFollowUp = async ({ history, answer, followUpDepth = 0, projectContext = {} }) => {
  const { role = 'Software Engineer', project = '' } = projectContext;

  const focusAreas = [
    {
      label: 'why',
      instruction: `Ask specifically about the REASONING behind the decision mentioned in the candidate's last answer.
      Ground your question in the candidate's project: "${project}".
      Focus on: why they chose this specific approach for THIS project, what constraints or goals drove the decision.
      Keep it to one sharp, project-specific question.`
    },
    {
      label: 'edge_cases',
      instruction: `Ask about EDGE CASES or failure scenarios directly related to what the candidate built in: "${project}".
      Focus on: real-world failure modes for their specific stack or architecture — load spikes, bad user input, API failures, race conditions.
      Keep it to one sharp, project-specific question.`
    },
    {
      label: 'alternatives',
      instruction: `Ask about ALTERNATIVE APPROACHES the candidate could have used in their project: "${project}".
      Focus on: specific technologies, libraries, or architectural patterns that could have achieved the same goal differently,
      and what trade-offs they would introduce in THIS project's context.
      Keep it to one sharp, project-specific question.`
    }
  ];

  const focus = focusAreas[followUpDepth % focusAreas.length];

  if (!groq) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const mockResponses = {
      why: `Why specifically did you choose that approach for ${project || 'this project'} over the alternatives?`,
      edge_cases: `How does your ${project || 'project'} implementation handle edge cases like network failures or malformed input?`,
      alternatives: `What alternative technologies did you consider for ${project || 'this project'}, and why did you rule them out?`
    };
    return { question: mockResponses[focus.label], type: focus.label };
  }

  const messages = history.map(msg => ({
    role: msg.role === 'ai' ? 'assistant' : 'user',
    content: msg.content
  }));

  if (messages[messages.length - 1]?.role !== 'user') {
    messages.push({ role: 'user', content: answer });
  }

  messages.unshift({
    role: 'system',
    content: `You are a senior technical interviewer conducting a project-based interview for a ${role} role.
The candidate is being interviewed specifically about their project: "${project}".

Your task: ${focus.instruction}

CRITICAL RULES:
- Every question MUST be directly related to the candidate's described project: "${project}"
- Do NOT ask generic interview questions
- Reference specific technologies, decisions, or components from their answers
- Respond with ONLY the question — no preamble, no "Great answer!", no explanation.`
  });

  const question = await chat(messages);
  return { question: question.trim(), type: focus.label };
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

/**
 * Evaluate an interview answer: scores depth, clarity, reasoning
 * and returns strengths + weaknesses
 */
const evaluateAnswer = async ({ question, answer, projectContext = {} }) => {
  const { role = 'Software Engineer', project = '' } = projectContext;

  if (!groq) {
    return {
      scores: { depth: 7, clarity: 8, reasoning: 6, overall: 7 },
      strengths: ['Clear explanation of the approach', 'Good technical terminology'],
      weaknesses: ['Could mention specific trade-offs', 'Missing quantitative impact'],
      summary: 'A solid answer that demonstrates familiarity with the topic but could go deeper on reasoning.'
    };
  }

  const prompt = `You are evaluating a technical interview answer for a ${role} role about the project: "${project}".

QUESTION ASKED:
${question}

CANDIDATE'S ANSWER:
${answer}

Evaluate the answer strictly and return ONLY a valid JSON object with this exact structure:
{
  "scores": {
    "depth": <integer 1-10>,
    "clarity": <integer 1-10>,
    "reasoning": <integer 1-10>,
    "overall": <integer 1-10>
  },
  "strengths": ["<specific strength 1>", "<specific strength 2>"],
  "weaknesses": ["<specific weakness 1>", "<specific weakness 2>"],
  "summary": "<2 sentence overall assessment>"
}

Scoring guide:
- depth: How deeply did they explain the technical implementation? (1=surface level, 10=expert depth)
- clarity: How clearly and concisely was the answer structured? (1=confusing, 10=crystal clear)
- reasoning: Did they justify their decisions with solid reasoning? (1=no reasoning, 10=excellent reasoning)
- overall: Weighted average considering all factors

Be honest and specific. Reference the actual content of their answer.`;

  const text = await chat([{ role: 'user', content: prompt }]);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      throw new Error('Failed to parse evaluation JSON');
    }
  }
  throw new Error('No evaluation JSON in response');
};

/**
 * Rewrite a candidate's answer in a cleaner, more structured format
 */
const improveAnswer = async ({ question, answer, projectContext = {} }) => {
  const { role = 'Software Engineer', project = '' } = projectContext;

  if (!groq) {
    return {
      improvedAnswer: `Here's a more structured version of the answer:\n\n**Approach:** ${answer}\n\n**Technical reasoning:** This approach was chosen because it best fits the project's scalability requirements.\n\n**Impact:** This resulted in improved performance and maintainability of the codebase.`
    };
  }

  const prompt = `You are a technical writing coach helping a ${role} candidate improve their interview answer about the project: "${project}".

QUESTION:
${question}

ORIGINAL ANSWER:
${answer}

Rewrite this answer in a clear, well-structured format that:
1. Opens with a direct statement of the approach taken
2. Explains the technical reasoning behind the decision
3. Mentions specific technologies or patterns used
4. Quantifies impact or outcome where possible
5. Briefly acknowledges trade-offs or alternatives considered

Keep the same meaning and facts — just structure and articulate it better.
Write in first person. Be concise (4-6 sentences max).
Return ONLY the improved answer text — no preamble, no labels.`;

  const improved = await chat([{ role: 'user', content: prompt }]);
  return { improvedAnswer: improved.trim() };
};

module.exports = {
  generateInterviewQuestions,
  generateInitialQuestion,
  generateFollowUp,
  generateAdaptiveFollowUp,
  evaluateAnswer,
  improveAnswer,
  extractResumeData
};
