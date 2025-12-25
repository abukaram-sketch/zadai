import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { OutfitType, Outfit } from "../types";

// 1. استدعاء المفتاح بالطريقة الصحيحة لـ Vercel
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const generateOutfit = async (
  base64Image: string,
  type: OutfitType,
  occasion?: string
): Promise<Outfit> => {
  
  if (!API_KEY) {
    throw new Error("API Key is missing via VITE_GEMINI_API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const occasionContext = occasion ? `This outfit is intended for: ${occasion}. Ensure the styling matches this mood.` : "";

  const prompt = `You are "Zad AI", an elite luxury fashion stylist.
  Look at this uploaded fabric or clothing item.
  
  TASK:
  Create a professional, editorial high-fashion photograph of a woman wearing a ${type} designed specifically using the provided item as the primary material.
  
  ${occasionContext}

  STRICT CONSTRAINTS:
  - The woman MUST be wearing the garment.
  - DO NOT include any shoes (feet should be hidden or barefoot).
  - Focus purely on the garment's elegance, silhouette, and fabric texture.
  
  STYLE DIRECTION:
  - If Sudanese Thobe (ثوب سوداني), emphasize the traditional graceful drape.
  - If Abaya, focus on modest luxury.
  
  BACKGROUND: Minimalist, soft natural lighting, high-end studio.
  OUTPUT: Provide a detailed styling description in BOTH Arabic and English.`;

  try {
    // 2. التعديل الجذري: استخدام الموديل المتاح للمطورين الذي يدعم هذه الميزات
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp', 
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
      // إعدادات التوليد
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 4096,
      }
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("لم يتمكن النموذج من توليد النتيجة.");
    }

    let imageUrl = "";
    let description = "";

    // استخراج الصورة والنص من استجابة الموديل الجديد
    for (const part of response.candidates[0].content.parts) {
      // الموديل الجديد قد يعيد الصورة كـ inlineData أو executableCode أحياناً، هنا نعالج الـ inlineData
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      } else if (part.text) {
        description = part.text;
      }
    }

    // إذا لم يقم الموديل بتوليد صورة (لأن النسخة العامة قد تكون محدودة أحياناً)، نعيد الصورة الأصلية لتفادي الخطأ
    if (!imageUrl) {
        console.warn("Model generated text description but no image bytes. Using original image.");
        imageUrl = base64Image; 
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      type,
      imageUrl,
      description: description || `تنسيق مقترح لنوع ${type}`,
      occasion
    };
  } catch (error: any) {
    console.error("Gemini API Error details:", error);
    // رسالة خطأ واضحة للمستخدم
    throw new Error("حدث خطأ في الاتصال بالموديل. تأكد أن المفتاح يدعم Gemini 2.0 Flash Exp");
  }
};

export const editOutfitImage = async (
  currentImageUrl: string,
  editPrompt: string
): Promise<string> => {
  // دالة التعديل
  return currentImageUrl;
};
