// services/replicateService.js
const Replicate = require('replicate');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * Normalizes various Replicate outputs to a single URL string or null
 * @param {*} output - The raw Replicate output
 * @returns {string|null}
 */
function extractUrl(output) {
  if (Array.isArray(output) && output.length > 0) return output[0].toString();
  if (typeof output === 'string') return output;
  if (output && typeof output.toString === 'function') return output.toString();
  return null;
}

/**
 * Generates a cat video with on-screen text overlays for given highlights
 * @param {string[]} highlights - Array of short, funny highlight strings
 * @returns {Promise<string>} - URL of generated video (or fallback image)
 */
async function generateVideo(highlights) {
  const highlightsOverlay = Array.isArray(highlights)
    ? highlights.join(' | ')
    : String(highlights);

  try {
    console.log("Generating cat video with provided highlights...");

    // Step 1: Generate initial cat image using SDXL
    console.log("Generating initial cat image...");
    const imageOutput = await replicate.run(
      "stability-ai/sdxl:c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866bfb27c061316",
      {
        input: {
          prompt: `A professional cat in a suit sitting at a desk, about to present a resume. Corporate office setting, professional lighting.`,
          negative_prompt: "poor quality, blurry, distorted, disfigured",
        },
      }
    );
    const imageUrl = extractUrl(imageOutput);
    if (!imageUrl) throw new Error("Failed to generate initial cat image");
    console.log("Generated initial cat image:", imageUrl);

    // Step 2: Generate video with highlights overlay
    console.log("Generating cat video with highlights overlay...");
    const videoPrompt = `A professional cat explaining resume highlights. The cat gestures at floating text: ${highlightsOverlay}. Make it funny, energetic, and expressive.`;

    const videoOutput = await replicate.run(
      "wavespeedai/wan-2.1-i2v-480p",
      {
        input: {
          image: imageUrl,
          prompt: videoPrompt,
          video_length: 15,
        },
      }
    );
    console.log("Video generation complete, output:", videoOutput);

    const videoUrl = extractUrl(videoOutput);
    if (videoUrl) return videoUrl;

    console.warn("Unexpected video output format, falling back to image URL");
    return imageUrl;

  } catch (error) {
    console.error('Error in Replicate service:', error);
    // Fallback: try an alternative text-to-video model
    try {
      console.log("Primary model failed, trying fallback model...");
      const fallbackPrompt = `A cute cat explaining resume highlights: ${highlightsOverlay}.`;
      const fallbackOutput = await replicate.run(
        "anotherjesse/zeroscope-v2-xl:9f747673945c62801b13b84701c783929c0ee5948e9a82ebe7cf05154c8851a3",
        {
          input: {
            prompt: fallbackPrompt,
            fps: 24,
            num_frames: 120,
          },
        }
      );
      const fallbackUrl = extractUrl(fallbackOutput);
      if (fallbackUrl) return fallbackUrl;
    } catch (fallbackError) {
      console.error('Fallback model also failed:', fallbackError);
    }

    // Last resort: generate a static image summarizing highlights
    try {
      console.log("Video models failed, generating a static image...");
      const slidePrompt = `A professional cat reviewing a resume with these highlights: ${highlightsOverlay}.`;
      const lastResortImageOutput = await replicate.run(
        "stability-ai/sdxl:c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866bfb27c061316",
        { input: { prompt: slidePrompt } }
      );
      const lastImageUrl = extractUrl(lastResortImageOutput);
      if (lastImageUrl) return lastImageUrl;
    } catch (imageError) {
      console.error('Image generation also failed:', imageError);
    }

    return `Error generating content: ${error.message}`;
  }
}

module.exports = {
  generateVideo,
};
