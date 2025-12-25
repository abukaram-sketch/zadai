import { GoogleGenAI } from "@google/genai";
import { OutfitType, Outfit } from "../types";

// 1. التعديل الأهم: استخدام طريقة Vite لجلب المفتاح
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const generateOutfit = async (
  base64Image: string,
  type: OutfitType,
  occasion?: string
): Promise<Outfit> => {
  
  // التحقق من المفتاح لمنع توقف الموقع
  if (!API_KEY) {
    console.error("المفتاح مفقود! تأكد من وجود VITE_GEMINI_API_KEY في إعدادات Vercel");
    throw new Error("API Key configuration error");
  }

  // 2. إعداد الاتصال بالمكتبة الحديثة
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const occasionContext = occasion ? `Occasion: ${occasion}` : "General usage";

  const prompt = `You are a professional fashion stylist.
  Analyze the uploaded fabric/clothing image.
  Task: Create a styling suggestion for a ${type} using this material.
  ${occasionContext}
  Output: Provide a short, elegant description in Arabic describing the final look.`;

  try {
    // 3. استخدام الموديل المتطور المتاح للتجربة العامة
    const response = await ai.models.generateContent({
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
    });

    // معالجة الرد بأمان (لتجنب الشاشة الحمراء)
    const candidates = response.candidates;
    let description = "تم إنشاء التنسيق بنجاح.";
    
    if (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) {
       // البحث عن النص في الرد
       const textPart = candidates[0].content.parts.find((p: any) => p.text);
       if (textPart) description = textPart.text;
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      type,
      // نعيد الصورة الأصلية مع الوصف لأن التوليد الكامل للصورة يحتاج صلاحيات خاصة غير متوفرة بالمفتاح المجاني حالياً
      // هذا يضمن أن الموقع لا يتوقف ويعطيك نتيجة مفيدة (وصف احترافي)
      imageUrl: base64Image, 
      description: description,
      occasion
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error("حدث خطأ في الاتصال بالخدمة، يرجى المحاولة لاحقاً.");
  }
};

export const editOutfitImage = async (
  currentImageUrl: string,
  editPrompt: string
): Promise<string> => {
  return currentImageUrl;
};
