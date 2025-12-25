import { OutfitType, Outfit } from "../types";

// Get API Key from Vite environment
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const generateOutfit = async (
  base64Image: string,
  type: OutfitType,
  occasion?: string
): Promise<Outfit> => {
  
  // 1. Check if Key exists
  if (!API_KEY) {
    console.error("API Key is missing. Check Vercel Settings -> Environment Variables -> VITE_GEMINI_API_KEY");
    throw new Error("Configuration Error: API Key is missing.");
  }

  // 2. Clean the base64 string (Remove 'data:image/jpeg;base64,' prefix)
  const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  const occasionText = occasion ? `Occasion: ${occasion}` : "General use";

  // 3. Prepare the request payload for Gemini 1.5 Flash (Direct REST API)
  const payload = {
    contents: [{
      parts: [
        { text: `You are a fashion stylist. Analyze this image. Suggest a ${type} outfit using this fabric. ${occasionText}. Output: A short, elegant description in Arabic.` },
        {
          inline_data: {
            mime_type: "image/jpeg",
            data: cleanBase64
          }
        }
      ]
    }]
  };

  try {
    // 4. Send Request directly to Google (Bypassing the buggy library)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const errorDetails = await response.json();
      console.error("Google API Error:", errorDetails);
      throw new Error("Connection refused by Google AI.");
    }

    const data = await response.json();
    
    // 5. Extract the text response
    let description = "تم إنشاء التنسيق.";
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      description = data.candidates[0].content.parts[0].text;
    }

    // 6. Return result (Using original image as preview)
    return {
      id: Math.random().toString(36).substr(2, 9),
      type,
      imageUrl: base64Image,
      description: description,
      occasion
    };

  } catch (error) {
    console.error("Final Error:", error);
    throw new Error("System Error: Could not connect to AI service.");
  }
};

export const editOutfitImage = async (
  currentImageUrl: string,
  editPrompt: string
): Promise<string> => {
  return currentImageUrl;
};
