import { GoogleGenAI } from "@google/genai";
import { OutfitType, Outfit } from "../types";

// 1. استخدام المفتاح الذي يبدأ بـ VITE (لأنه الوحيد الذي يعمل على الموبايل)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const generateOutfit = async (
  base64Image: string,
  type: OutfitType,
  occasion?: string
): Promise<Outfit> => {
  
  // فحص الأمان
  if (!API_KEY) {
    throw new Error("API Key is missing via VITE_GEMINI_API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const occasionContext = occasion ? `The occasion is: ${occasion}.` : "";

  // 2. استخدام الموديل المستقر (1.5 Flash) المتاح للجميع مجاناً
  // هذا الموديل سيقوم بتحليل الصورة واقتراح التنسيق كنص
  const prompt = `You are "Zad AI", a luxury fashion stylist.
  Analyze the uploaded fabric or garment image.
  
  Task:
  Suggest a complete outfit styling for a ${type} using this material.
  ${occasionContext}
  
  Output:
  Write a sophisticated, short paragraph in Arabic describing the final look, the cut, and how to style it. Do not ask for more info.`;

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
      throw new Error("فشل في الحصول على رد من الذكاء الاصطناعي");
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      type,
      // نعيد الصورة الأصلية لأن الموديلات المجانية المتاحة حالياً لا ترسم صوراً
      imageUrl: base64Image, 
      description: description,
      occasion
    };

  } catch (error: any) {
    console.error("Gemini Error:", error);
    // رسالة خطأ واضحة
    throw new Error("حدث خطأ. تأكد من إعدادات المفتاح في Vercel");
  }
};

export const editOutfitImage = async (
  currentImageUrl: string,
  editPrompt: string
): Promise<string> => {
  return currentImageUrl;
};
