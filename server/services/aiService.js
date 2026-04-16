// A mock AI service simulating follow-up adaptive questions
// If we hook this up to Gemini API, we will initialize @google/genai here

const generateInitialQuestion = async ({ role, project, experienceLevel }) => {
  // Simulate AI delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return `Welcome to the ${role} interview simulator. I see you've worked on ${project}. To start us off, could you walk me through the high-level architecture of that project and explain the primary technical challenges you faced?`;
};

const generateFollowUp = async ({ history, answer }) => {
  // Simulate AI delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // A mock adaptive response based on sequence depth
  const depth = history.length;
  
  if (depth < 4) {
    return `That's an interesting approach. You mentioned some specifics in your previous answer: "${answer.substring(0, 30)}...". What led you to make that specific design choice over other alternatives?`;
  } else if (depth < 8) {
    return `Can you dive a bit deeper into the trade-offs there? How did it impact the performance or scalability of the system?`;
  } else {
    return `Thank you for sharing that. I think I have a good grasp of your technical thinking. Let's move on to the next topic, or we can wrap up here. Do you have any questions for me?`;
  }
};

module.exports = {
  generateInitialQuestion,
  generateFollowUp
};
