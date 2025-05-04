// test-file-output.js
require('dotenv').config();
const Replicate = require('replicate');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
});

async function inspectOutput(output) {
  console.log("Output type:", typeof output);
  console.log("Is array:", Array.isArray(output));
  
  if (Array.isArray(output)) {
    for (let i = 0; i < output.length; i++) {
      const item = output[i];
      console.log(`\nItem ${i} type:`, typeof item);
      
      if (item && typeof item === 'object') {
        console.log(`Item ${i} constructor:`, item.constructor ? item.constructor.name : 'undefined');
        console.log(`Item ${i} properties:`, Object.keys(item).length > 0 ? Object.keys(item) : 'No enumerable properties');
        
        // Try to access common properties
        if (item.url) console.log(`Item ${i} url:`, item.url);
        if (item.path) console.log(`Item ${i} path:`, item.path);
        if (item.href) console.log(`Item ${i} href:`, item.href);
        
        // Check for prototype methods and properties
        const protoMethods = [];
        let proto = Object.getPrototypeOf(item);
        while (proto && proto !== Object.prototype) {
          protoMethods.push(...Object.getOwnPropertyNames(proto));
          proto = Object.getPrototypeOf(proto);
        }
        console.log(`Item ${i} prototype methods:`, protoMethods);
        
        // Try to get string representation
        try {
          console.log(`Item ${i} toString:`, item.toString());
        } catch (e) {
          console.log(`Item ${i} toString error:`, e.message);
        }
      } else {
        console.log(`Item ${i} value:`, item);
      }
    }
  } else if (output && typeof output === 'object') {
    console.log("Output properties:", Object.keys(output));
  } else {
    console.log("Output value:", output);
  }
}

async function testReplicate() {
  try {
    console.log("Starting Replicate test...");
    
    // Use a simple image generation model
    const output = await replicate.run(
      "stability-ai/sdxl:c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866bfb27c061316",
      {
        input: {
          prompt: "a cat wearing a suit"
        }
      }
    );
    
    console.log("\n--- DETAILED OUTPUT INSPECTION ---");
    await inspectOutput(output);
    
    // Try to access special FileOutput methods if available
    if (Array.isArray(output) && output.length > 0 && output[0] && typeof output[0] === 'object') {
      const fileOutput = output[0];
      console.log("\n--- TRYING FILE OUTPUT SPECIFIC METHODS ---");
      
      try {
        if (typeof fileOutput.get === 'function') {
          console.log("Trying fileOutput.get()...");
          const url = await fileOutput.get();
          console.log("Result of get():", url);
        }
      } catch (e) {
        console.log("Error calling get():", e.message);
      }
      
      try {
        if (typeof fileOutput.blob === 'function') {
          console.log("Trying fileOutput.blob()...");
          const blob = await fileOutput.blob();
          console.log("Result of blob():", blob);
        }
      } catch (e) {
        console.log("Error calling blob():", e.message);
      }
    }
    
  } catch (error) {
    console.error('Replicate test error:', error);
  }
}

testReplicate();