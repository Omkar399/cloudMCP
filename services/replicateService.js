// services/replicateService.js
const Replicate = require('replicate');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
});

async function generateCatImage(summary, keywords = []) {
  try {
    console.log("Generating professional cat image for resume...");
    
    // Ensure we have exactly 5 highlights
    while (keywords.length < 5) {
      keywords.push("Professional Skill");
    }
    
    if (keywords.length > 5) {
      keywords = keywords.slice(0, 5);
    }
    
    // Format highlights for the prompt
    const highlightsText = keywords.join(", ");
    console.log("Using highlights for image generation:", highlightsText);
    
    // Generate a professional cat image presenting resume highlights
    const imageOutput = await replicate.run(
      "black-forest-labs/flux-1.1-pro",
      {
        input: {
          prompt: `A shocked and funny cat image on a screen. The cat is pointing to a bullet-point list showing: ${highlightsText}, keep the text very sharp and clear. random environment, colorful, detailed, professional lighting.`,
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