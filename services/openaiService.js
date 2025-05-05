// services/openaiService.js
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Hardcoded distributed systems job description
const DISTRIBUTED_SYSTEMS_JD = `
We are looking for a distributed systems engineer.
Responsibilities:
- Design, implement, and maintain large-scale distributed systems
- Ensure system reliability, scalability, and performance
- Work with microservices, message queues, and consensus protocols
- Collaborate with cross-functional teams to define production requirements
Required Skills:
- Strong proficiency in Go, Java, or C++
- Experience with Kubernetes, Docker, and cloud platforms (AWS/GCP/Azure)
- Deep understanding of distributed algorithms (e.g., Paxos, Raft)
- Familiarity with monitoring and observability tools (Prometheus, Grafana)
`;

/**
 * Extracts the top 5 highlights from a resume for image overlays
 * @param {string} resumeText
 * @returns {Promise<string[]>}
 */
async function getResumeHighlights(resumeText) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert resume analyzer. Extract the top 5 most important highlights from this resume."
        },
        {
          role: "user",
          content: `Here is a resume:
${resumeText}

Please extract the top 5 unique most important highlights from this resume. Focus on key skills, experience, education, or achievements. Format your response as a JSON array of 5 concise strings ONLY.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const text = response.choices[0].message.content.trim();
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.slice(0, 5);
    if (parsed.highlights && Array.isArray(parsed.highlights)) return parsed.highlights.slice(0, 5);
    if (typeof parsed === 'object') {
      const vals = Object.values(parsed).flat();
      if (Array.isArray(vals)) return vals.slice(0, 5);
    }
  } catch (error) {
    console.error("Error extracting highlights:", error);
  }
  // fallback
  return [
    "Professional Experience",
    "Technical Skills",
    "Education",
    "Achievements",
    "Key Strengths"
  ];
}

/**
 * Summarizes a resume text
 * @param {string} resumeText
 * @returns {Promise<string>}
 */
async function summarizeResume(resumeText) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert resume analyzer. Extract and summarize the most important information from this resume, focusing on skills, experience, education, and achievements. Format your response for a fun cat-themed video."
        },
        {
          role: "user",
          content: resumeText
        }
      ],
      max_tokens: 500
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error summarizing resume:', error);
    return "Failed to summarize resume due to an error.";
  }
}

/**
 * Scores a resume against the distributed systems job description on a scale of 1-5.
 * @param {string} resumeText
 * @returns {Promise<{score: number, justification: string}>}
 */
async function scoreResume(resumeText) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a senior distributed systems hiring manager. Evaluate how well this resume matches the job description on a scale from 1 (poor) to 5 (excellent)."
        },
        {
          role: "user",
          content: `Job Description:
${DISTRIBUTED_SYSTEMS_JD}

Resume:
${resumeText}

Please respond with a JSON object:
{ "score": <integer 1-5>, "justification": "<one-sentence justification>" }`
        }
      ],
      response_format: { type: "json_object" }
    });
    const result = response.choices[0].message.content.trim();
    return JSON.parse(result);
  } catch (error) {
    console.error('Error scoring resume:', error);
    return { score: 3, justification: 'Could not evaluate resume; defaulting to average fit.' };
  }
}

/**
 * Generates a short cat-themed audio story about the candidate, with tone based on resume fit.
 * @param {string} summary
 * @param {string[]} highlights
 * @returns {Promise<{audioUrl: string, score: number, justification: string}|{error: string}>}
 */
async function generateCatAudio(summary, highlights = []) {
  try {
    console.log("Generating cat audio for resume evaluation...");

    // Score the resume
    const { score, justification } = await scoreResume(summary);

    // Determine tone tag
    let toneTag;
    if (score >= 4) {
      toneTag = '(in an excited tone)';
    } else if (score <= 2) {
      toneTag = '(in a concerned tone)';
    } else {
      toneTag = '(in an encouraging tone)';
    }

    // Prepare highlights
    if (!Array.isArray(highlights) || highlights.length === 0) {
      highlights = ["Experience", "Skills", "Education", "Achievements", "Strengths"];
    }
    const topHighlights = highlights.slice(0, 3);

    // Generate script
    const catScriptResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a bad ass Cat add purring and meow be ruthlesss. Use the provided score at the start. If the score is low (<=2), mention the candidate might not be a great fit."
        },
        {
          role: "user",
          content: `The candidate scored ${score}/5 for a distributed systems role.
Justification: ${justification}
Top Highlights: ${topHighlights.join(", ")}

Write a short, 3-4 sentence story from the cat's perspective.`
        }
      ],
      max_tokens: 200
    });

    const catScript = catScriptResponse.choices[0].message.content.trim();
    console.log("Cat script:", catScript);

    // Save audio
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const filename = `cat_audio_${uuidv4()}.mp3`;
    const filepath = path.join(uploadDir, filename);

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "shimmer",
      input: catScript,
      speed: 1.1
    });
    const buffer = Buffer.from(await mp3.arrayBuffer());
    fs.writeFileSync(filepath, buffer);

    const audioUrl = `http://localhost:3000/audio/${filename}`;
    console.log("Generated audio file:", filepath);

    return { audioUrl, score, justification };
  } catch (error) {
    console.error('Error generating cat audio:', error);
    return { error: error.message };
  }
}

/**
 * Extracts the most relevant keywords from a resume that match the job description
 */
async function extractRelevantKeywords(resumeText) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert resume analyzer focusing on distributed systems engineering roles. Extract the most relevant technical keywords."
        },
        {
          role: "user",
          content: `Job Description:
${DISTRIBUTED_SYSTEMS_JD}

Resume:
${resumeText}

Extract exactly 5 keywords or phrases from this resume that are MOST RELEVANT to the distributed systems job description.
Focus on technical skills, technologies, or domain expertise that appear in the resume.
Order them by relevance (most relevant first).
Return ONLY a JSON array of 5 strings with no additional text.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const text = response.choices[0].message.content.trim();
    console.log("Keywords response:", text);
    
    try {
      const parsed = JSON.parse(text);
      
      // Handle different possible formats
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 5);
      }
      
      // Check for nested arrays in properties
      for (const key in parsed) {
        if (Array.isArray(parsed[key]) && parsed[key].length > 0) {
          return parsed[key].slice(0, 5);
        }
      }
      
      // If it's an object with numberic keys (like "1", "2", etc.), extract the values
      if (typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        // Check if keys are numeric-like strings
        const keys = Object.keys(parsed);
        const numericKeys = keys.every(key => !isNaN(key) || key.match(/^\d+$/));
        
        if (numericKeys) {
          // Get the values in order
          const sortedKeys = keys.sort((a, b) => parseInt(a) - parseInt(b));
          const values = sortedKeys.map(key => parsed[key]);
          return values.slice(0, 5);
        }
        
        // If keys are not numeric but appear to be the actual keywords, use them
        else if (keys.some(key => key.length > 3 && /[A-Za-z]/.test(key))) {
          return keys.slice(0, 5);
        }
        
        // Otherwise just use the values
        else {
          return Object.values(parsed).slice(0, 5);
        }
      }
      
      // If we couldn't extract keywords in any expected format, return empty array
      console.error("Unexpected keywords format:", parsed);
      return [];
    } catch (jsonError) {
      console.error("Error parsing keywords JSON:", jsonError);
      return [];
    }
  } catch (error) {
    console.error("Error extracting keywords:", error);
    return [];
  }
}

module.exports = {
  summarizeResume,
  getResumeHighlights,
  scoreResume,
  generateCatAudio,
  extractRelevantKeywords
};
