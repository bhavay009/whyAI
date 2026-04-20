const { GoogleGenerativeAI } = require("@google/genai");

// Initialize Gemini API
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const generateInterviewQuestions = async ({ role, project, experienceLevel }) => {
  if (!genAI) {
    console.warn("GEMINI_API_KEY not found. Using mock questions.");
    return [
      `How did you handle the state management in your ${project}?`,
      `Can you explain the architectural decisions you made for the backend of ${project}?`,
      `What were the biggest technical challenges you faced while building ${project}?`,
      `How did you ensure the scalability of the ${project}?`,
      `If you were to rebuild ${project} today, what technologies would you choose and why?`
    ];
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an expert technical interviewer. 
      Generate 5 specific interview questions for a ${role} position with ${experienceLevel} experience.
      The questions MUST be based ONLY on the following project details provided by the candidate:
      "${project}"

      Guidelines:
      - Avoid generic questions (e.g., "What was your role?", "What did you learn?").
      - Focus on implementation details, technical decisions, and architecture.
      - Each question should be challenging and specific to the project's tech stack or domain.
      - Return ONLY the 5 questions as a JSON array of strings.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Attempt to parse JSON from the response
    const jsonMatch = text.match(/\[.*\]/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback split if JSON parsing fails
    return text.split('\n').filter(q => q.trim().length > 0).slice(0, 5);
  } catch (error) {
    console.error("Error generating questions with Gemini:", error);
    throw error;
  }
};

const generateInitialQuestion = async ({ role, project, experienceLevel }) => {
  // We'll now use generateInterviewQuestions and take the first one
  const questions = await generateInterviewQuestions({ role, project, experienceLevel });
  return questions[0];
};

const generateFollowUp = async ({ history, answer }) => {
  if (!genAI) {
    // Simulate AI delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const depth = history.length;
    if (depth < 4) {
      return `That's an interesting approach. You mentioned: "${answer.substring(0, 30)}...". What led you to make that specific design choice?`;
    } else {
      return `Can you dive a bit deeper into the trade-offs there? How did it impact the performance?`;
    }
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const chatHistory = history.map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({
      history: chatHistory.slice(0, -1), // History without the latest response
    });

    const result = await chat.sendMessage(answer);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating follow-up with Gemini:", error);
    return "I'm having trouble coming up with the next question. Could you tell me more about that?";
  }
};

const extractResumeData = async (text) => {
  if (!genAI) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      projects: [
        {
          name: "E-Commerce Platform",
          description: "Built a fully functional e-commerce platform using React, Node.js, and Stripe.",
          technologies: ["React", "Stripe", "Node.js"]
        },
        {
          name: "Task Management App",
          description: "Developed a Kanban board with real-time updates.",
          technologies: ["Vue.js", "Firebase"]
        }
      ],
      technologies: ["React", "Vue.js", "Node.js", "Firebase", "Stripe"],
      skills: ["Frontend Development", "Payment Integration", "Real-time Databases", "Agile methodologies"]
    };
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      Extract key information from the following resume text.
      Return a JSON object with:
      1. projects: An array of objects each with "name", "description", and "technologies" (array).
      2. technologies: A flat array of all mentioned technologies.
      3. skills: A flat array of mentioned soft and hard skills.

      Resume Text:
      ${text}
    `;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error("Error extracting resume data:", error);
    throw error;
  }
};

module.exports = {
  generateInterviewQuestions,
  generateInitialQuestion,
  generateFollowUp,
  extractResumeData
};
