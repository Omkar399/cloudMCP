// controllers/resumeController.js
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { summarizeResume, getResumeHighlights } = require('../services/anthropicService');
const { generateCatImage } = require('../services/replicateService');
const { generateCatAudio } = require('../services/audioService');

async function processResume(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded' });
    }

    // Extract text from PDF
    const pdfFile = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(pdfFile);
    const resumeText = pdfData.text;
    console.log("Extracted text length:", resumeText.length);

    // Get resume summary and highlights using Anthropic
    let summary = null;
    let highlights = null;
    
    try {
      summary = await summarizeResume(resumeText);
      console.log("Summary generated successfully");
    } catch (summaryError) {
      console.error("Error generating summary:", summaryError);
      summary = "Unable to generate summary. Please try again later.";
    }
    
    try {
      highlights = await getResumeHighlights(resumeText);
      console.log("Highlights extracted successfully:", highlights);
    } catch (highlightsError) {
      console.error("Error extracting highlights:", highlightsError);
      highlights = ["Key Experience", "Technical Skills", "Education", "Achievements", "Core Competencies"];
    }

    // Generate cat image using Replicate
    const imageUrl = await generateCatImage(summary, highlights);
    console.log("Cat image generated successfully:", imageUrl);
    
    // Generate cat audio using Replicate
    const audioUrl = await generateCatAudio(summary, highlights);
    console.log("Cat audio generated successfully:", audioUrl);

    // Delete the temporary file
    try {
      fs.unlinkSync(req.file.path);
    } catch (error) {
      console.error('Error deleting temporary file:', error);
    }

    // Return results
    res.status(200).json({
      summary,
      highlights,
      imageUrl,
      audioUrl
    });

  } catch (error) {
    console.error('Error processing resume:', error);
    res.status(500).json({ error: 'Error processing resume', details: error.message });
  }
}

module.exports = {
  processResume
};