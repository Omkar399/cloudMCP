// services/openaiService.js
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function summarizeResume(resumeText) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert resume analyzer. Extract and summarize the most important information from this resume, focusing on skills, experience, education, and achievements. Format your response in a way that would be engaging when converted to a fun cat-themed video."
        },
        {
          role: "user",
          content: resumeText
        }
      ],
      max_tokens: 500
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error in OpenAI service:', error);
    throw new Error('Failed to summarize resume');
  }
}

module.exports = {
  summarizeResume
};