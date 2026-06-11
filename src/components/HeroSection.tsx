import React from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  X, 
  Flame, 
  Shuffle,
  Sparkles,
  Globe
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
  selectedEdition?: 'java' | 'bedrock';
  changeEdition?: (edition: 'java' | 'bedrock') => void;
  isLoggedIn?: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = React.memo(({
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
  selectedEdition = 'bedrock',
  changeEdition,
  isLoggedIn = false,
}) => {
  const isRTL = language === 'ar';

  return (
    <section className="flex flex-col items-center justify-center text-center py-8 relative z-10 w-full max-w-4xl mx-auto px-4">
      {/* 1. Purple Capsule Upper Badge - "أكثر من 200+ مود متاح للتحميل" */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <span className="inline-flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-full bg-amber-950/40 border border-amber-500/20 text-amber-400 shadow-lg select-none">
          <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
          <span className="tracking-tight font-bold">
            {isRTL ? 'أكثر من 200+ مود متاح للتحميل' : 'Over 200+ Mods Available for Download'}
          </span>
        </span>
      </motion.div>

      {/* 2. Main High-Contrast Centered Title */}
      <div className="space-y-4 mb-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="inline-block"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-1 select-none leading-normal tracking-tight text-white font-sans">
            {isRTL ? (
              <>
                مودات ماين كرافت
                <span className="block mt-1 text-white font-black">{selectedEdition === 'java' ? 'جافا (Java Edition)' : 'بيدروك (Bedrock)'}</span>
              </>
            ) : (
              <>
                Minecraft Mods
                <span className="block mt-1 text-white font-black">{selectedEdition === 'java' ? 'Java Edition' : 'Bedrock'}</span>
              </>
            )}
          </h1>
        </motion.div>

        {/* 3. High-Contrast Centered Subtitle */}
        <p className="text-zinc-400 text-xs sm:text-sm md:text-base font-medium leading-relaxed max-w-xl mx-auto select-none">
          {isRTL 
            ? `حمّل أفضل المودات والإضافات لنسخة ${selectedEdition === 'java' ? 'Java' : 'Bedrock'} مجاناً. جميع المودات مفحوصة وتعمل بشكل كامل.`
            : `Download the best mods and add-ons for ${selectedEdition === 'java' ? 'Java' : 'Bedrock'} edition for free. All mods are fully tested and functional.`}
        </p>
      </div>

      {/* 4. Styled Search Input Box */}
      <div className="w-full max-w-2xl relative group mt-6 mb-4">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-amber-500 rounded-full blur opacity-10 group-focus-within:opacity-25 transition duration-300" />
        <div className="relative flex items-center bg-[#0d0d11]/85 backdrop-blur-md border border-zinc-800 rounded-full py-2.5 px-6 shadow-2xl">
          
          {/* Magnifying Glass (Positioned correctly based on language direction) */}
          {!isRTL && <Search className="w-5 h-5 text-zinc-500 shrink-0 mr-3" />}
          
          <input 
            type="text" 
            placeholder={isRTL ? 'ابحث عن مود...' : 'Search for a mod...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full bg-transparent border-none focus:outline-none focus:ring-0 text-white placeholder:text-zinc-500 text-sm sm:text-base font-medium py-1.5 ${isRTL ? 'text-right pr-2 pl-2' : 'text-left pl-2 pr-2'}`}
          />

          {isRTL && <Search className="w-5 h-5 text-zinc-500 shrink-0 ml-3" />}

          {/* Clear Search Input */}
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="p-1 px-1.5 text-zinc-500 hover:text-white rounded-full transition mx-1.5"
              title={isRTL ? 'مسح البحث' : 'Clear search'}
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Random suggestion helper block */}
          <button
            onClick={() => {
              const sampleTerms = isRTL ? ['أسلحة', 'سيارات', 'شيدر', 'بيوت', 'حيوانات'] : ['Weapons', 'Cars', 'Shaders', 'Houses', 'Animals'];
              const randomTerm = sampleTerms[Math.floor(Math.random() * sampleTerms.length)];
              setSearchTerm(randomTerm);
            }}
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-850 text-amber-500 px-4 py-2.5 rounded-full transition-all font-black text-xs select-none shrink-0"
            title={isRTL ? 'اقتراح عشوائي' : 'Random Suggestion'}
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline font-bold">{isRTL ? 'عشوائي' : 'Pick'}</span>
          </button>
        </div>
      </div>

      {/* Minecraft Edition Selector Toggle */}
      {!isLoggedIn && (
        <div className="flex items-center justify-center gap-1.5 p-1 rounded-full bg-zinc-950/80 border border-zinc-800 shadow-inner max-w-sm mx-auto mb-6 select-none relative z-20 animate-fadeIn">
          <button
            onClick={() => changeEdition?.('bedrock')}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer ${
              selectedEdition === 'bedrock'
                ? 'bg-gradient-to-r from-red-650 to-amber-500 text-white shadow-md shadow-red-500/10'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span>📱</span>
            <span>{isRTL ? 'نسخة البيدروك / الجوال' : 'Bedrock / Mobile'}</span>
          </button>
          <button
            onClick={() => changeEdition?.('java')}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer ${
              selectedEdition === 'java'
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md shadow-amber-500/10'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span>💻</span>
            <span>{isRTL ? 'نسخة الجافا / للكمبيوتر' : 'Java Edition / PC'}</span>
          </button>
        </div>
      )}

      {/* 5. Minimalist & Highly Styled Compact Categories Selection Bar (Directly below search) */}
      <div className="w-full max-w-2xl px-2 mb-6">
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto py-2 px-4 scrollbar-hide select-none w-full" dir={isRTL ? 'rtl' : 'ltr'}>
          {categories.map((cat, i) => {
            const isActive = selectedCategory === cat;
            return (
              <motion.button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className={`flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full whitespace-nowrap transition-all text-xs sm:text-sm font-extrabold relative overflow-hidden group border cursor-pointer shrink-0 ${
                  isActive 
                    ? 'bg-gradient-to-r from-red-650 to-amber-500 text-white shadow-lg shadow-red-500/30 border-transparent' 
                    : `${localTheme === 'light' 
                        ? 'bg-zinc-100 text-zinc-800 hover:text-black hover:bg-zinc-200 border-zinc-200/80 shadow-sm' 
                        : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white border-zinc-800'}`
                }`}
              >
                {isActive && (
                  <motion.span 
                    layoutId="activeCategoryIndicator"
                    className="absolute inset-0 bg-gradient-to-r from-red-600 to-amber-500 opacity-20 blur-sm"
                    transition={{ duration: 0.4 }}
                  />
                )}
                <span className="relative z-10">{cat}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

    </section>
  );
});
