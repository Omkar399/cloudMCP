// services/replicateService.js
const Replicate = require('replicate');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
});

async function generateCatImage(summary, highlights = []) {
  try {
    console.log("Generating professional cat image for resume...");
    
    // Ensure highlights is an array
    if (!Array.isArray(highlights) || highlights.length === 0) {
      if (typeof summary === 'string') {
        // Try to extract some highlights from the summary
        const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 10).slice(0, 5);
        highlights = sentences.length >= 3 ? sentences : ["Experience", "Skills", "Education", "Achievements", "Strengths"];
      } else {
        highlights = ["Experience", "Skills", "Education", "Achievements", "Strengths"];
      }
    }
    
    // Ensure we have exactly 5 highlights
    while (highlights.length < 5) {
      highlights.push("Professional Skill");
    }
    
    if (highlights.length > 5) {
      highlights = highlights.slice(0, 5);
    }
    
    // Format highlights for the prompt
    const highlightsText = highlights.join(", ");
    console.log("Using highlights for image generation:", highlightsText);
    
    // Generate a professional cat image presenting resume highlights
    const imageOutput = await replicate.run(
      "stability-ai/sdxl:c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866bfb27c061316",
      {
        input: {
          prompt: `A cute professional cat in a business suit presenting a resume on a screen. The cat is pointing to a bullet-point list showing: ${highlightsText}. Corporate office setting, colorful, detailed, professional lighting.`,
          negative_prompt: "poor quality, blurry, distorted, disfigured, bad anatomy, text, watermark, signature, bad proportions",
          width: 768,
          height: 768,
          num_inference_steps: 40,
          seed: Math.floor(Math.random() * 1000000)
        }
      }
    );
    
    // Extract the image URL
    let imageUrl = "";
    if (Array.isArray(imageOutput) && imageOutput.length > 0) {
      imageUrl = imageOutput[0].toString();
    } else if (typeof imageOutput === 'string') {
      imageUrl = imageOutput;
    } else if (imageOutput && typeof imageOutput === 'object' && imageOutput.toString) {
      imageUrl = imageOutput.toString();
    }
    
    console.log("Generated cat image:", imageUrl);
    
    if (!imageUrl) {
      throw new Error("Failed to generate cat image");
    }
    
    return imageUrl;
  } catch (error) {
    console.error('Error generating cat image:', error);
    return "Error generating cat image: " + error.message;
  }
}

module.exports = {
  generateCatImage
};