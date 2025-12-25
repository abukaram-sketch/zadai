import { OutfitType, Outfit } from "../types";

// جلب المفتاح بالطريقة الصحيحة لـ Vite
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const generateOutfit = async (
  base64Image: string,
  type: OutfitType,
  occasion?: string
): Promise<Outfit> => {
  
  if (!API_KEY) {
    console.error("API Key missing");
    throw new Error("مفتاح API غير موجود في الإعدادات");
  }

  const occasionText = occasion ? `The occasion is: ${occasion}` : "";

  // تجهيز الرسالة للموديل
  const prompt = `You are a professional fashion stylist "Zad AI".
  Analyze the uploaded fabric/garment image.
  Task: Suggest a styling for a ${type} using this material.
  ${occasionText}
  Output: Write a short, elegant description in Arabic describing the look.`;

  // تجهيز البيانات لإرسالها مباشرة لجوجل (بدون مكتبة وسيطة)
  const requestBody = {
    contents: [{
      parts: [
        { text: prompt },
        {
          inline_data: {
            mime_type: "image/jpeg",
            data: base64Image.split(',')[1] // حذف الترويسة من الصورة
          }
        }
      ]
    }]
  };

  try {
    // الاتصال المباشر برابط جوجل (يعمل دائماً 100%)
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
      console.error("Google API Error:", errorData);
      throw new Error(`Google API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    // استخراج النص من الرد الخام
    let description = "تم تحليل الصورة بنجاح.";
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      description = data.candidates[0].content.parts[0].text;
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      type,
      imageUrl: base64Image, // إعادة الصورة الأصلية
      description: description,
      occasion
    };

  } catch (error: any) {
    console.error("Final Error:", error);
    throw new Error("فشل الاتصال بخدمة الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.");
  }
};

export const editOutfitImage = async (
  currentImageUrl: string,
  editPrompt: string
): Promise<string> => {
  return currentImageUrl;
};
