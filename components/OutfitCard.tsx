
import React, { useMemo, useState } from 'react';
import { Outfit, OutfitType, Language } from '../types';

interface OutfitCardProps {
  outfit: Outfit;
  language: Language;
  onSave?: () => void;
  onRefine?: (prompt: string) => Promise<void>;
  isSaved?: boolean;
}

const STYLE_TRANSLATIONS: Record<string, { en: string; ar: string }> = {
  [OutfitType.SUDANESE_THOBE]: { en: 'Sudanese Thobe', ar: 'ثوب سوداني' },
  [OutfitType.ADENI_DIRA]: { en: "Adeni Dir'a", ar: 'درع عدني' },
  [OutfitType.LONG_DRESS]: { en: 'Long Dress', ar: 'فستان طويل' },
  [OutfitType.SHORT_DRESS]: { en: 'Short Dress', ar: 'فستان قصير' },
  [OutfitType.SHORT_SKIRT]: { en: 'Short Skirt', ar: 'تنورة قصيرة' },
  [OutfitType.LONG_SKIRT]: { en: 'Long Skirt', ar: 'تنورة طويلة' },
  [OutfitType.JALABIA]: { en: 'Jalabia', ar: 'جلابية' },
  [OutfitType.ABAYA]: { en: 'Abaya', ar: 'عباية' },
  [OutfitType.CASUAL]: { en: 'Casual', ar: 'كاجوال' },
  [OutfitType.NIGHT_OUT]: { en: 'Night Out', ar: 'سهرة' },
};

const LOGO_URL = "https://i.ibb.co/p6VjRF1g/Gemini-Generated-Image-km7795km7795km77-1.png";

const OutfitCard: React.FC<OutfitCardProps> = React.memo(({ outfit, language, onSave, onRefine, isSaved }) => {
  const [isRefining, setIsRefining] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [isLoadingRefine, setIsLoadingRefine] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const label = useMemo(() => {
    return STYLE_TRANSLATIONS[outfit.type]?.[language] || outfit.type;
  }, [outfit.type, language]);

  const downloadImageWithWatermark = async () => {
    setIsDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const mainImg = new Image();
      mainImg.crossOrigin = "anonymous";
      mainImg.src = outfit.imageUrl;

      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      logoImg.src = LOGO_URL;

      await Promise.all([
        new Promise(resolve => mainImg.onload = resolve),
        new Promise(resolve => logoImg.onload = resolve)
      ]);

      // ضبط الأبعاد
      canvas.width = mainImg.width;
      canvas.height = mainImg.height;

      // 1. رسم الصورة الأصلية
      ctx.drawImage(mainImg, 0, 0);

      // 2. إعدادات الشعار لتطابق مظهر الموقع (CSS Filters)
      const logoWidth = canvas.width * 0.12; // حجم أصغر قليلاً ليناسب مظهر الموقع
      const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
      const padding = canvas.width * 0.03; // هوامش متناسبة

      ctx.save();
      
      // تطبيق تأثير Grayscale (تدرج رمادي)
      ctx.filter = 'grayscale(100%)';
      
      // تطبيق تأثير الشفافية (Opacity 60%)
      ctx.globalAlpha = 0.6;
      
      // تطبيق تأثير الدمج (Multiply) كما في الموقع
      ctx.globalCompositeOperation = 'multiply';

      // رسم الشعار في الزاوية
      const x = canvas.width - logoWidth - padding;
      const y = canvas.height - logoHeight - padding;
      
      ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);
      
      ctx.restore();

      // التحميل
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `ZadAI-${label}-${outfit.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download failed", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRefineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refinePrompt.trim() || !onRefine) return;
    
    setIsLoadingRefine(true);
    try {
      await onRefine(refinePrompt);
      setRefinePrompt('');
      setIsRefining(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingRefine(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 group relative">
      <div className="relative aspect-[3/4] bg-slate-50">
        <img 
          src={outfit.imageUrl} 
          alt={label}
          loading="lazy"
          className={`w-full h-full object-cover transition-all duration-700 ${isLoadingRefine ? 'opacity-50 blur-sm scale-95' : 'group-hover:scale-105'}`} 
        />
        
        {/* Overlays */}
        {(isLoadingRefine || isDownloading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm z-10">
            <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Style Label */}
        <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3">
          <div className="px-2 py-0.5 bg-white/80 backdrop-blur-md text-[7px] font-bold tracking-widest uppercase text-slate-900 rounded-full shadow-sm">
            {label}
          </div>
        </div>

        {/* UI Watermark Logo (Preview Only) */}
        <div className="absolute bottom-3 right-3 rtl:right-auto rtl:left-3 flex flex-col items-end gap-2 pointer-events-none">
           <img 
             src={LOGO_URL} 
             alt="Zad AI" 
             className="h-5 w-auto object-contain mix-blend-multiply opacity-60 grayscale"
           />
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-10 right-3 rtl:right-auto rtl:left-3 flex flex-col gap-2 z-20">
          {onSave && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onSave();
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 ${
                isSaved 
                  ? 'bg-slate-900 text-white shadow-lg' 
                  : 'bg-white/80 text-slate-900 shadow-sm'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isSaved ? 'fill-current' : 'fill-none'}`} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          )}

          <button 
            onClick={downloadImageWithWatermark}
            disabled={isDownloading}
            className="w-8 h-8 bg-white/80 text-slate-900 rounded-full flex items-center justify-center backdrop-blur-md shadow-sm transition-all active:scale-90 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>

          {onRefine && (
            <button 
              onClick={() => setIsRefining(!isRefining)}
              className="w-8 h-8 bg-white/80 text-slate-900 rounded-full flex items-center justify-center backdrop-blur-md shadow-sm transition-all active:scale-90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Refinement Panel */}
      {isRefining && (
        <div className="p-3 border-t border-slate-50 bg-white">
          <form onSubmit={handleRefineSubmit} className="flex gap-2">
            <input 
              type="text" 
              value={refinePrompt}
              onChange={(e) => setRefinePrompt(e.target.value)}
              placeholder={language === 'ar' ? "مثلاً: اجعلي الأكمام أطول..." : "e.g. make sleeves longer..."}
              className="flex-1 text-[10px] bg-slate-50 border-none rounded-lg px-3 h-8 focus:ring-1 focus:ring-slate-900/10 outline-none"
            />
            <button 
              type="submit"
              disabled={isLoadingRefine || !refinePrompt.trim()}
              className="h-8 px-3 bg-slate-900 text-white text-[9px] font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {language === 'ar' ? 'تعديل' : 'Refine'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
});

export default OutfitCard;
