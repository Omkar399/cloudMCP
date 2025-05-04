// services/audioService.js
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateCatAudio(summary, highlights = []) {
  try {
    console.log("Generating cat audio for resume using OpenAI...");
    
    // Ensure we have highlights to work with
    if (!Array.isArray(highlights) || highlights.length === 0) {
      if (typeof summary === 'string') {
        // Try to extract some highlights from the summary
        const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 10).slice(0, 5);
        highlights = sentences.length >= 3 ? sentences : ["Experience", "Skills", "Education", "Achievements", "Strengths"];
      } else {
        highlights = ["Experience", "Skills", "Education", "Achievements", "Strengths"];
      }
    }
    
    // Limit to a reasonable number of highlights
    if (highlights.length > 5) {
      highlights = highlights.slice(0, 5);
    }
    
    // Create a script for the cat character
    const catScript = `
Meow! Hello there, I'm Professor Whiskers, and today I'm reviewing a very impressive resume! 
Let me share with you the top highlights of this candidate:

First, ${highlights[0]}! That's quite remarkable, isn't it? Meow!

Second, ${highlights[1]}! Very impressive skills indeed!

Third, ${highlights[2]}! Absolutely purrfect qualifications!

${highlights.length > 3 ? `Fourth, ${highlights[3]}! This candidate really stands out!` : ''}

${highlights.length > 4 ? `And finally, ${highlights[4]}! Simply amazing!` : ''}

Overall, this is one exceptional candidate that any company would be lucky to have! Meow meow!
    `.trim();
    
    console.log("Cat audio script:", catScript);
    
    // Make sure the uploads directory exists
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Generate a unique filename for this audio
    const filename = `cat_audio_${uuidv4()}.mp3`;
    const filepath = path.join(uploadDir, filename);
    
    // Use OpenAI's text-to-speech API
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",  // You can also try "tts-1-hd" for higher quality
      voice: "alloy",  // Other options: "echo", "fable", "onyx", "nova", "shimmer"
      input: catScript,
    });
    
    // Convert the response to buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    // Save to file
    fs.writeFileSync(filepath, buffer);
    
    // Create a URL to access the file - for development environment
    const audioUrl = `http://localhost:3000/audio/${filename}`;
    
    console.log("Generated audio file:", filepath);
    console.log("Audio URL:", audioUrl);
    
    return audioUrl;
  } catch (error) {
    console.error('Error generating cat audio with OpenAI:', error);
    
    // Return error message
    return "Error generating cat audio: " + error.message;
  }
}

module.exports = {
  generateCatAudio
};