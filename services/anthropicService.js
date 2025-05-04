// services/anthropicService.js
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * Extracts the top 5 highlights from a resume for video overlays
 * @param {string} resumeText - The full resume text
 * @returns {Promise<string[]>} - Array of 5 concise highlight strings
 */
async function getResumeHighlights(resumeText) {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",  // ensure this model is available
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Here is a resume:
${resumeText}

Please extract the top 5 most important highlights from this resume. Focus on key skills, experience, education, or achievements. Format your response as a JSON array of 5 concise strings ONLY, suitable for on-screen text overlays in a funny cat-themed video.

IMPORTANT: Your entire response must be a valid JSON array and nothing else. For example:
["10 years experience in software development", "Masters in Computer Science", "Led team of 15 engineers", "Expert in Python and JavaScript", "Increased revenue by 30%"]`
        }
      ]
    });

    // Get the text response
    const text = response.content[0].text.trim();
    console.log("Claude response:", text);
    
    // Try to parse as JSON, but handle the case where it's not valid JSON
    try {
      // If response is valid JSON, parse it
      const highlights = JSON.parse(text);
      return highlights;
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      
      // If it's not valid JSON, try to extract the highlights manually
      // Look for patterns like numbered lists, bullet points, or lines
      let highlights = [];
      
      // Try to find an array-like structure in the text
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          highlights = JSON.parse(jsonMatch[0]);
        } catch (e) {
          // If that fails, split by common delimiters
          highlights = extractHighlightsFromText(text);
        }
      } else {
        // Split by common delimiters
        highlights = extractHighlightsFromText(text);
      }
      
      // Ensure we have exactly 5 highlights
      while (highlights.length < 5) {
        highlights.push("Resume highlight");
      }
      
      if (highlights.length > 5) {
        highlights = highlights.slice(0, 5);
      }
      
      return highlights;
    }
  } catch (error) {
    console.error('Error in Anthropic service:', error);
    // Return default highlights instead of throwing
    return [
      "Professional Experience",
      "Technical Skills",
      "Education",
      "Achievements",
      "Key Strengths"
    ];
  }
}

// Helper function to extract highlights from text
function extractHighlightsFromText(text) {
  // Try different patterns to extract highlights
  
  // Try numbered items (1., 2., etc.)
  let matches = text.match(/\d+\.\s*([^\n]+)/g);
  if (matches && matches.length >= 3) {
    return matches.map(match => match.replace(/^\d+\.\s*/, '').trim());
  }
  
  // Try bullet points
  matches = text.match(/[•\-\*]\s*([^\n]+)/g);
  if (matches && matches.length >= 3) {
    return matches.map(match => match.replace(/^[•\-\*]\s*/, '').trim());
  }
  
  // Try splitting by newlines and picking non-empty lines
  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('Here') && !line.startsWith('Top') && line.length > 10);
  
  if (lines.length >= 3) {
    return lines;
  }
  
  // If all else fails, create generic highlights with parts of the text
  const words = text.split(' ');
  return [
    words.slice(0, 5).join(' ') + '...',
    words.slice(5, 10).join(' ') + '...',
    words.slice(10, 15).join(' ') + '...',
    words.slice(15, 20).join(' ') + '...',
    words.slice(20, 25).join(' ') + '...'
  ];
}

/**
 * Summarizes a resume text
 * @param {string} resumeText - The full resume text
 * @returns {Promise<string>} - Summarized resume
 */
async function summarizeResume(resumeText) {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Here is a resume: ${resumeText}
          
          Extract and summarize the most important information from this resume, focusing on skills, experience, education, and achievements. Format your response in a way that would be engaging when converted to a fun cat-themed video.`
        }
      ]
    });

    return response.content[0].text;
  } catch (error) {
    console.error('Error in Anthropic service:', error);
    return "Failed to summarize resume due to an error. Please try again later.";
  }
}

module.exports = {
  getResumeHighlights,
  summarizeResume
};