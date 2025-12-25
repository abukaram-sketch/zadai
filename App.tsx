
import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { OutfitType, Outfit, StylistState } from './types';
import { generateOutfit, editOutfitImage } from './services/geminiService';
import OutfitCard from './components/OutfitCard';
import LoadingOverlay from './components/LoadingOverlay';

const ALL_STYLES = Object.values(OutfitType);

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

const TRANSLATIONS = {
  en: {
    title: 'Zad AI',
    subtitle: 'Luxury Styling, Reimagined.',
    description: 'Transform a single fabric or item into complete high-fashion looks.',
    uploadBtn: 'Upload Image',
    generateBtn: 'Create Outfit Now',
    startOver: 'Reset',
    selectStyles: 'Select Your Styles',
    pickCategories: 'Choose how you want to see this item styled.',
    poweredBy: 'Zad AI • Premium Virtual Stylist',
    formats: 'PNG, JPG, WEBP',
    loading: 'Zad AI is crafting your masterpiece...',
    error: 'Something went wrong. Please try again.',
    savedTitle: 'Your Collection',
    noSaved: 'No outfits saved yet.',
    saveBtn: 'Save',
    removeBtn: 'Remove',
    occasionLabel: 'Occasion (Optional)',
    occasionPlaceholder: 'e.g. Wedding, Work, Dinner...',
    suggestions: ['Wedding', 'Daily', 'Ramadan', 'Office']
  },
  ar: {
    title: 'زاد AI',
    subtitle: 'أناقة فاخرة، بلمسة ذكاء.',
    description: 'تحويل قطعة قماش أو ملابس إلى إطلالات كاملة بأسلوب راقٍ.',
    uploadBtn: 'رفع الصورة',
    generateBtn: 'إنشاء اللباس الآن',
    startOver: 'ابدأ من جديد',
    selectStyles: 'اختيار الستايلات',
    pickCategories: 'تحديد الأنماط المفضلة لتنسيق المظهر.',
    poweredBy: 'زاد AI • منسق المظهر الافتراضي',
    formats: 'يدعم PNG, JPG, WEBP',
    loading: 'زاد AI يعمل على تصميم إطلالات فريدة...',
    error: 'حدث خطأ ما، يرجى المحاولة مرة أخرى.',
    savedTitle: 'مجموعتي المحفوظة',
    noSaved: 'لا توجد تنسيقات محفوظة بعد.',
    saveBtn: 'حفظ',
    removeBtn: 'حذف',
    occasionLabel: 'المناسبة (اختياري)',
    occasionPlaceholder: 'مثلاً: زواج، عمل، حفل عشاء...',
    suggestions: ['زواج', 'يومي', 'رمضان', 'عمل']
  }
};

const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; // Reduced for speed
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // Balanced quality/speed
      };
    };
  });
};

const App: React.FC = () => {
  const [state, setState] = useState<StylistState>({
    originalImage: null,
    selectedStyles: [],
    outfits: [],
    isAnalyzing: false,
    isGenerating: false,
    error: null,
    language: 'ar',
    occasion: ''
  });

  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>(() => {
    try {
      const saved = localStorage.getItem('zad_ai_saved_outfits');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useMemo(() => TRANSLATIONS[state.language], [state.language]);
  const isRtl = state.language === 'ar';

  useEffect(() => {
    localStorage.setItem('zad_ai_saved_outfits', JSON.stringify(savedOutfits));
  }, [savedOutfits]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedImage = await resizeImage(file);
        setState(prev => ({ 
          ...prev, 
          originalImage: compressedImage,
          outfits: [],
          selectedStyles: [],
          error: null 
        }));
      } catch (err) {
        setState(prev => ({ ...prev, error: t.error }));
      }
    }
  };

  const toggleStyle = useCallback((style: OutfitType) => {
    setState(prev => {
      const isSelected = prev.selectedStyles.includes(style);
      const newStyles = isSelected 
        ? prev.selectedStyles.filter(styleName => styleName !== style)
        : [...prev.selectedStyles, style];
      return { ...prev, selectedStyles: newStyles };
    });
  }, []);

  const startStyling = useCallback(async () => {
    if (!state.originalImage || state.selectedStyles.length === 0) return;
    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const generatedOutfits = await Promise.all(
        state.selectedStyles.map(style => generateOutfit(state.originalImage!, style, state.occasion))
      );
      setState(prev => ({ ...prev, outfits: generatedOutfits, isGenerating: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isGenerating: false, error: t.error }));
    }
  }, [state.originalImage, state.selectedStyles, state.occasion, t.error]);

  const handleRefineOutfit = useCallback(async (outfitId: string, prompt: string) => {
    const target = state.outfits.find(o => o.id === outfitId);
    if (!target) return;

    try {
      const newImageUrl = await editOutfitImage(target.imageUrl, prompt);
      setState(prev => ({
        ...prev,
        outfits: prev.outfits.map(o => o.id === outfitId ? { ...o, imageUrl: newImageUrl } : o)
      }));
    } catch (err) {
      console.error("Refinement failed", err);
    }
  }, [state.outfits]);

  const resetApp = useCallback(() => {
    setState(s => ({...s, originalImage: null, outfits: [], selectedStyles: [], error: null, occasion: ''}));
    if (fileInputRef.current) fileInputRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const toggleLanguage = useCallback(() => {
    setState(prev => ({ ...prev, language: prev.language === 'ar' ? 'en' : 'ar' }));
  }, []);

  const getStyleLabel = useCallback((style: OutfitType) => {
    return STYLE_TRANSLATIONS[style]?.[state.language] || style;
  }, [state.language]);

  const toggleSaveOutfit = useCallback((outfit: Outfit) => {
    setSavedOutfits(prev => {
      const isAlreadySaved = prev.some(item => item.imageUrl === outfit.imageUrl);
      if (isAlreadySaved) {
        return prev.filter(item => item.imageUrl !== outfit.imageUrl);
      }
      return [outfit, ...prev];
    });
  }, []);

  const isSaved = useCallback((outfit: Outfit) => {
    return savedOutfits.some(item => item.imageUrl === outfit.imageUrl);
  }, [savedOutfits]);

  return (
    <div className={`min-h-screen bg-white pb-32 ${isRtl ? 'text-right' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {state.isGenerating && <LoadingOverlay message={t.loading} />}
      
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-50">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-10 w-auto flex items-center justify-center">
              <img 
                src="https://i.ibb.co/p6VjRF1g/Gemini-Generated-Image-km7795km7795km77-1.png" 
                alt="Zad AI Logo" 
                className="h-full w-auto object-contain mix-blend-multiply"
                width="120"
                height="40"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleLanguage} className="text-[10px] font-bold bg-slate-100 px-3 py-1.5 rounded-full text-slate-800 hover:bg-slate-200 transition-colors">
              {state.language === 'ar' ? 'English' : 'العربية'}
            </button>
            {state.originalImage && (
              <button onClick={resetApp} className="bg-red-500 text-white p-2 rounded-full active:scale-90 transition-transform shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-6">
        {!state.originalImage ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center mb-12">
            <div className="mb-8 space-y-3">
              <h2 className="serif text-4xl text-slate-900 leading-tight md:text-5xl">{t.subtitle}</h2>
              <p className="text-slate-500 text-sm md:text-base max-w-sm mx-auto">{t.description}</p>
            </div>
            
            <label className="w-full max-w-[260px] cursor-pointer rounded-2xl bg-slate-900 p-5 text-white shadow-2xl active:scale-95 transition-all text-center block hover:bg-slate-800">
              <span className="flex items-center justify-center gap-2 text-base font-semibold">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                </svg>
                <span>{t.uploadBtn}</span>
              </span>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            </label>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <img src={state.originalImage} className="w-16 h-16 rounded-xl object-cover border border-slate-100 shadow-sm" alt="Original" />
                <div>
                  <h3 className="serif text-base font-bold text-slate-900">{t.selectStyles}</h3>
                  <p className="text-slate-500 text-[11px]">{t.pickCategories}</p>
                </div>
              </div>

              {/* Styles Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-8">
                {ALL_STYLES.map(style => {
                  const isSelected = state.selectedStyles.includes(style);
                  return (
                    <button 
                      key={style} 
                      onClick={() => toggleStyle(style)} 
                      className={`px-3 py-3 rounded-xl border text-[11px] font-bold text-center transition-all duration-200 ${
                        isSelected 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-lg transform scale-[1.02]' 
                          : 'bg-slate-50 border-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {getStyleLabel(style)}
                    </button>
                  );
                })}
              </div>

              {/* Occasion Section - Fixed Visibility for Mobile */}
              <div className="space-y-4 mb-4">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-700 block px-1">
                  {t.occasionLabel}
                </label>
                <div className="relative group">
                  <input 
                    type="text"
                    value={state.occasion}
                    onChange={(e) => setState(prev => ({...prev, occasion: e.target.value}))}
                    placeholder={t.occasionPlaceholder}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:bg-white focus:border-slate-900 outline-none transition-all shadow-inner"
                  />
                </div>
                <div className="flex gap-2 flex-wrap px-1">
                  {t.suggestions.map(s => {
                    const isSelected = state.occasion === s;
                    return (
                      <button 
                        key={s} 
                        onClick={() => setState(prev => ({...prev, occasion: s}))}
                        className={`text-[10px] font-bold px-4 py-2 rounded-full transition-all border ${
                          isSelected 
                            ? 'bg-slate-900 border-slate-900 text-white shadow-md scale-105' 
                            : 'bg-slate-100 border-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {state.selectedStyles.length > 0 && (
                <button 
                  onClick={startStyling} 
                  disabled={state.isGenerating}
                  className="w-full mt-6 h-14 bg-slate-900 text-white rounded-2xl text-sm font-bold shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 hover:bg-slate-800"
                >
                  <span>{t.generateBtn}</span>
                  <span className="bg-white/10 px-2 py-1 rounded-lg text-[10px] border border-white/5">{state.selectedStyles.length}</span>
                </button>
              )}
            </div>

            {state.error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-center text-xs font-semibold border border-red-100 animate-shake">
                {state.error}
              </div>
            )}

            {state.outfits.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                {state.outfits.map(outfit => (
                  <OutfitCard 
                    key={outfit.id} 
                    outfit={outfit} 
                    language={state.language}
                    onSave={() => toggleSaveOutfit(outfit)}
                    onRefine={(prompt) => handleRefineOutfit(outfit.id, prompt)}
                    isSaved={isSaved(outfit)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Saved Outfits Section */}
        <div className="mt-24 border-t border-slate-100 pt-12">
          <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="serif text-3xl font-bold text-slate-900">{t.savedTitle}</h3>
            <span className="text-xs font-bold bg-slate-900 text-white px-3 py-1 rounded-full shadow-lg">
              {savedOutfits.length}
            </span>
          </div>
          
          {savedOutfits.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-6">
              {savedOutfits.map((outfit, index) => (
                <div key={`${outfit.id}-${index}`} className="relative group animate-fadeIn">
                  <OutfitCard 
                    outfit={outfit} 
                    language={state.language} 
                    onSave={() => toggleSaveOutfit(outfit)}
                    isSaved={true}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{t.noSaved}</p>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-20 py-12 text-center bg-white border-t border-slate-50">
        <div className="h-10 w-auto mx-auto mb-4 opacity-30 grayscale flex justify-center">
            <img 
              src="https://i.ibb.co/p6VjRF1g/Gemini-Generated-Image-km7795km7795km77-1.png" 
              alt="Footer Logo" 
              className="h-full w-auto object-contain mix-blend-multiply" 
              loading="lazy"
            />
        </div>
        <p className="text-slate-400 text-[10px] uppercase tracking-[0.3em] font-medium">{t.poweredBy}</p>
      </footer>
    </div>
  );
};

export default App;
