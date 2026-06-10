import React from 'react';
import { motion } from 'motion/react';
import { 
  Crown, 
  Search, 
  X, 
  Flame, 
  Download, 
  Star, 
  CheckCircle2, 
  Gamepad2, 
  Sparkles, 
  Sword, 
  Shield, 
  Zap, 
  Shuffle 
} from 'lucide-react';

interface HeroSectionProps {
  language: 'ar' | 'en';
  localTheme: 'dark' | 'light';
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  categories: string[];
  t: any;
  backgroundImage: string;
  currentVibe?: any;
  isAsymmetricalMode?: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  language,
  localTheme,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  t,
  backgroundImage,
  currentVibe,
  isAsymmetricalMode,
}) => {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mt-4 relative">
      
      {/* 1. Branding Hero, Search & Suggestions (Col Span 7) */}
      <div className="lg:col-span-12 xl:col-span-7 flex flex-col justify-center text-center lg:text-right space-y-6 relative z-10">
        
        {/* Symmetrical Glow Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.5, type: "spring" }}
          className={`inline-flex self-center lg:self-start items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black tracking-wide shadow-[0_0_20px_rgba(239,68,68,0.05)] cursor-pointer select-none border border-red-500/20 bg-red-950/20 text-yellow-500`}
        >
          <Crown className="w-4 h-4 text-yellow-400 animate-pulse" />
          <span className="font-extrabold uppercase">
            {language === 'ar' ? 'شبكة ماينكرافت والمودات الخارقة' : 'The Ultimate Minecraft Mods & Maps Grid'}
          </span>
          <Zap className="w-3.5 h-3.5 text-red-500" />
        </motion.div>

        {/* High-Contrast Beautiful Title (Perfectly Aligned) */}
        <div className="space-y-4 text-right">
          <motion.div 
            initial={{ scale: 0.98, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring" }}
            className="inline-block"
          >
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black mb-1 select-none leading-none tracking-tighter text-right">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-amber-400 to-rose-600 font-extrabold pb-2">
                Golden Gih Hub
              </span>
            </h1>
          </motion.div>

          <p className="text-zinc-300 text-xs sm:text-base font-medium leading-relaxed max-w-xl text-right bg-zinc-950/90 p-4.5 border border-zinc-900 rounded-2xl shadow-inner">
            {language === 'ar' 
              ? 'مرحباً بك في منصتك الشاملة لتحميل وتنزيل أفضل إضافات ماينكرافت والخرائط وسرعات السيرفرات الآمنة بنسبة 100%. ابدأ رحلتك الآن في تصفح مئات المودات المصنفة!' 
              : 'Your ultimate destination for lightning-fast mods, customized shaders, and immersive world maps. Completely safe, tested, and updated daily!'}
          </p>
        </div>

        {/* Clean Modern Search Box */}
        <div className="w-full max-w-lg relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-650 to-amber-500 rounded-[1.5rem] blur opacity-15 group-focus-within:opacity-30 transition duration-300" />
          <div className={`relative flex items-center ${localTheme === 'light' ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-90 w-full'} border border-zinc-900 rounded-[1.5rem] p-2 shadow-2xl`}>
            
            <div className={`flex items-center flex-1 ${language === 'ar' ? 'pr-4' : 'pl-4'}`}>
              <Search className="w-5 h-5 text-red-500 shrink-0" />
              <input 
                type="text" 
                placeholder={language === 'ar' ? 'اكتب كلمة البحث هنا...' : 'Search for mods or maps...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full bg-transparent border-none ${language === 'ar' ? 'pr-3 pl-3 text-right' : 'pl-3 pr-3 text-left'} focus:outline-none focus:ring-0 text-sm py-2 text-white placeholder:text-zinc-500 font-semibold`}
              />
            </div>
            
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="p-2 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-xl transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            
            {/* Quick random tag generator button */}
            <button
              onClick={() => {
                const sampleTerms = ['أسلحة', 'سيارات', 'شيدر', 'خرائط', 'سكنات', 'تنين', 'عملاق', 'بيوت'];
                const randomTerm = sampleTerms[Math.floor(Math.random() * sampleTerms.length)];
                setSearchTerm(randomTerm);
              }}
              className="bg-zinc-900 hover:bg-zinc-850 text-amber-500 p-2 rounded-xl transition-all font-black flex items-center gap-1 text-[11px]"
              title="بحث عشوائي"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Filter Tag Suggestion Row */}
        <div className="flex flex-wrap items-center gap-2 justify-start pt-2">
          <span className="text-[11px] text-zinc-500 font-bold bg-zinc-900/60 border border-zinc-900 px-3 py-1 rounded-xl flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            {language === 'ar' ? 'الأقسام المتاحة:' : 'Available categories:'}
          </span>
          {categories.filter(c => c !== 'الكل' && c !== 'All').map((cat) => {
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  const el = document.getElementById("available-mods-anchor");
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`text-[10px] font-black px-3.5 py-1.5 rounded-xl border transition-all duration-300 bg-zinc-950/70 border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800 select-none`}
              >
                #{cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Platform Feature Showcase Live Widget */}
      <div className="lg:col-span-12 xl:col-span-5 w-full flex justify-center lg:justify-end">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className={`w-full max-w-sm rounded-[1.5rem] p-6 relative overflow-hidden group bg-zinc-950 border border-zinc-905 shadow-[0_10px_40px_rgba(0,0,0,0.4)]`}
        >
          {/* Subtle gradient highlights */}
          <div className="absolute top-0 right-[-10%] w-48 h-48 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 bg-zinc-900/10 border border-zinc-900 px-3 py-1 rounded-xl">
              <span className="relative flex h-20 w-2 shrink-0 items-center justify-center">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] uppercase font-black text-emerald-400 tracking-wider">
                {language === 'ar' ? 'سيرفر نشط' : 'LIVE GRID'}
              </span>
            </div>
            
            <span className="text-[10px] bg-red-650/10 text-red-500 px-3 py-1 rounded-xl font-black flex items-center gap-1 border border-red-500/20">
              <Flame className="w-3 h-3 text-red-500 animate-pulse" />
              {language === 'ar' ? 'مود الأسبوع' : 'WEEKLY PICK'}
            </span>
          </div>

          {/* Image Preview Area */}
          <div className="relative aspect-video rounded-2xl bg-zinc-900 w-full overflow-hidden mb-5 border border-zinc-900">
            <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay" style={{ backgroundImage: `url(${backgroundImage})` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            
            <div className="absolute inset-0 flex flex-col justify-end p-4 text-right">
              <span className="text-[9px] bg-red-650/20 border border-red-500/35 text-red-400 font-extrabold px-2 py-0.5 rounded-md w-max mb-1 uppercase tracking-wider">
                EXTREME MCPE
              </span>
              <h4 className="text-sm md:text-base font-black text-white truncate">
                {language === 'ar' ? 'حزمة الأسلحة والسيارات الخارقة v5.4' : 'Cybernetic Weapons & Custom Cars V5.4'}
              </h4>
              <p className="text-[10px] text-zinc-400 font-bold">
                {language === 'ar' ? 'سرعة خارقة • آمن وموثق • تحديث فوري' : 'Ultra Performance • Tested Safe • Immediate Update'}
              </p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-3 text-right">
              <p className="text-[10px] text-zinc-500 font-extrabold">{language === 'ar' ? 'التحميلات' : 'Downloads'}</p>
              <p className="text-sm font-black text-white flex items-center gap-1 justify-end mt-0.5">
                <Download className="w-3.5 h-3.5 text-zinc-400" />
                14,208+
              </p>
            </div>
            
            <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-3 text-right">
              <p className="text-[10px] text-zinc-500 font-extrabold">{language === 'ar' ? 'التقييم العام' : 'Rating'}</p>
              <p className="text-sm font-black text-amber-400 flex items-center gap-1 justify-end mt-0.5">
                <Star className="w-3.5 h-3.5 fill-current" />
                4.9 / 5.0
              </p>
            </div>

            <div className="col-span-2 bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-xl p-3 text-right flex items-center justify-between">
              <span className="font-extrabold text-[10px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 animate-pulse" />
                {language === 'ar' ? 'مفحوص وموثق سحابياً 100%' : '100% Certified Safe'}
              </span>
              <span className="text-[9px] text-zinc-500 font-bold uppercase">{language === 'ar' ? 'الحماية' : 'Security'}</span>
            </div>
          </div>

          {/* Download Action */}
          <button 
            onClick={() => {
              setSearchTerm(language === 'ar' ? 'سيارات' : 'Cars');
              const el = document.getElementById("available-mods-anchor");
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full text-xs font-black py-4 px-4 rounded-xl transition-all duration-300 bg-red-650 hover:bg-red-550 text-white flex items-center justify-center gap-2 shadow-lg"
          >
            <Gamepad2 className="w-4 h-4 text-white" />
            <span className="font-black uppercase tracking-wider text-white">
              {language === 'ar' ? 'عرض وتحميل المود فوراً' : 'Instant Installation'}
            </span>
          </button>
        </motion.div>
      </div>
    </section>
  );
};
