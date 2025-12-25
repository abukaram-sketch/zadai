
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { OutfitType, Outfit } from "../types";

export const generateOutfit = async (
  base64Image: string,
  type: OutfitType,
  occasion?: string
): Promise<Outfit> => {
  // استخدام مفتاح الـ API من بيئة العمل
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  
  const occasionContext = occasion ? `This outfit is intended for: ${occasion}. Ensure the styling matches this mood.` : "";

  const prompt = `You are "Zad AI", an elite luxury fashion stylist.
  Look at this uploaded fabric or clothing item.
  
  TASK:
  Create a professional, editorial high-fashion photograph of a woman wearing a ${type} designed specifically using the provided item as the primary material.
  
  ${occasionContext}

  STRICT CONSTRAINTS:
  - The woman MUST be wearing the garment.
  - DO NOT include any shoes (feet should be hidden or barefoot).
  - DO NOT include any bags, purses, or handbags.
  - DO NOT include any jewelry, gold, or accessories (no necklaces, bracelets, rings, earrings).
  - Focus purely on the garment's elegance, silhouette, and fabric texture.
  
  STYLE DIRECTION:
  - If Sudanese Thobe (ثوب سوداني), emphasize the traditional graceful drape.
  - If Abaya (عباية), Jalabia (جلابية), or Dir'a (درع), focus on modest luxury and flow.
  - For modern cuts (Dresses, Skirts), ensure a high-end runway aesthetic.
  
  BACKGROUND: Minimalist, soft natural lighting, high-end studio (beige, off-white, or light grey).
  OUTPUT: Provide a detailed styling description in BOTH Arabic and English.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image.split(',')[1],
            },
          },
          { text: prompt },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4"
        }
      }
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("Unable to generate this style. Please try another selection or image.");
    }

    let imageUrl = "";
    let description = "";

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      } else if (part.text) {
        description = part.text;
      }
    }

    if (!imageUrl) throw new Error("Image generation failed. Please try again.");

    return {
      id: Math.random().toString(36).substr(2, 9),
      type,
      imageUrl,
      description: description || `A curated ${type} look by Zad AI.`,
      occasion
    };
  } catch (error: any) {
    console.error("Gemini API Error details:", error);
    throw error;
  }
};

export const editOutfitImage = async (
  currentImageUrl: string,
  editPrompt: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: currentImageUrl.split(',')[1],
            },
          },
          { text: `As Zad AI, refine this outfit image based on this request: "${editPrompt}". IMPORTANT: maintain the model and the focus on the garment. NO bags, NO shoes, NO jewelry. Preserve the original fabric essence but apply the requested change.` },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4"
        }
      }
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("Refinement failed.");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("Edit failed.");
  } catch (error: any) {
    console.error("Gemini API Refinement Error:", error);
    throw error;
  }
};
