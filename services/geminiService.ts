import { OutfitType, Outfit } from "../types";

// Get the API key from Vite environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const generateOutfit = async (
  base64Image: string,
  type: OutfitType,
  occasion?: string
): Promise<Outfit> => {
  
  // 1. Validation
  if (!API_KEY) {
    console.error("Error: VITE_GEMINI_API_KEY is missing in Vercel settings.");
    throw new Error("API Key is missing.");
  }

  const occasionText = occasion ? `The occasion is: ${occasion}` : "";

  // 2. Prepare the prompt
  const prompt = `You are a professional fashion stylist. 
  Analyze the uploaded fabric/garment image.
  Task: Suggest a styling for a ${type} using this material.
  ${occasionText}
  Output: Write a short, elegant description in Arabic describing the final look.`;

  // 3. Prepare the payload for REST API
  // We use REST API to avoid @google/genai library issues in the browser
  const requestBody = {
    contents: [{
      parts: [
        { text: prompt },
        {
          inline_data: {
            mime_type: "image/jpeg",
            data: base64Image.split(',')[1] // Remove the header part of base64
          }
        }
      ]
    }]
  };

  try {
    // 4. Call Google Gemini API directly
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API Error:", errorData);
      throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    // 5. Extract text from response
    let description = "Styling suggestion generated successfully.";
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      description = data.candidates[0].content.parts[0].text;
    }

    // 6. Return the result
    return {
      id: Math.random().toString(36).substr(2, 9),
      type,
      imageUrl: base64Image, // Return original image as 1.5-flash is text-only
      description: description,
      occasion
    };

  } catch (error: any) {
    console.error("Service Error:", error);
    throw new Error("Failed to generate styling. Please check the console for details.");
  }
};

export const editOutfitImage = async (
  currentImageUrl: string,
  editPrompt: string
): Promise<string> => {
  // Image editing is not supported in the free tier of this model
  return currentImageUrl;
};
