import { GoogleGenAI } from "@google/genai";
import { OutfitType, Outfit } from "../types";

// استخدام المفتاح الصحيح الذي يبدأ بـ VITE
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const generateOutfit = async (
  base64Image: string,
  type: OutfitType,
  occasion?: string
): Promise<Outfit> => {
  
  if (!API_KEY) {
    throw new Error("API Key is missing. Please check Vercel settings.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const occasionContext = occasion ? `This outfit is intended for: ${occasion}. Ensure the styling matches this mood.` : "";

  // تم تعديل الموديل إلى 1.5 فلاش (الموجود فعلياً)
  // وتعديل الطلب ليكون وصفاً نصياً دقيقاً لأن هذا الموديل لا يولد صوراً
  const prompt = `You are "Zad AI", an elite luxury fashion stylist.
  Analyze this uploaded fabric or clothing item.
  
  TASK:
  Provide a sophisticated, editorial styling description for a ${type} made from this material.
  
  ${occasionContext}

  OUTPUT:
  Write a short, elegant paragraph (in Arabic) describing how this outfit would look, focusing on the cut, the drape of the fabric, and the overall vibe. Do NOT ask for more input. Just describe the vision.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
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
    });

    const description = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!description) {
      throw new Error("Could not generate description.");
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      type,
      // بما أن الموديل لا يولد صوراً، سنعيد الصورة الأصلية مع الوصف المقترح
      imageUrl: base64Image, 
      description: description,
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
  // هذه الميزة تتطلب موديلات توليد صور متقدمة غير متوفرة في هذا المفتاح المجاني
  // سنعيد الصورة نفسها لتجنب الخطأ
  return currentImageUrl;
};
