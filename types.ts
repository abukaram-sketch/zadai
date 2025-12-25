
export enum OutfitType {
  SUDANESE_THOBE = 'Sudanese Thobe (ثوب سوداني)',
  ADENI_DIRA = 'Adeni Dir\'a (درع عدني)',
  LONG_DRESS = 'Long Dress (فستان طويل)',
  SHORT_DRESS = 'SHORT Dress (فستان قصير)',
  SHORT_SKIRT = 'Short Skirt (تنورة قصيرة)',
  LONG_SKIRT = 'Long Skirt (تنورة طويلة)',
  JALABIA = 'Jalabia (جلابية)',
  ABAYA = 'Abaya (عباية)',
  CASUAL = 'Casual (كاجوال)',
  NIGHT_OUT = 'Night Out (سهرة)'
}

export type Language = 'en' | 'ar';

export interface Outfit {
  id: string;
  type: OutfitType;
  imageUrl: string;
  description: string;
  occasion?: string;
}

export interface StylistState {
  originalImage: string | null;
  selectedStyles: OutfitType[];
  outfits: Outfit[];
  isAnalyzing: boolean;
  isGenerating: boolean;
  error: string | null;
  language: Language;
  occasion: string;
}
