import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Star, Download, Dices, Sparkles, Shuffle, ShieldCheck } from 'lucide-react';

interface SidebarSectionProps {
  language: 'ar' | 'en';
  presetGridMods: Array<{
    id: string;
    title: string;
    category: string;
    thumbnail: string;
    downloadUrl: string;
    rating: number;
  }>;
  onDownload: (url: string) => void;
}

export const SidebarSection: React.FC<SidebarSectionProps> = ({
  language,
  presetGridMods,
  onDownload,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rolledMod, setRolledMod] = useState<typeof presetGridMods[0] | null>(null);

  const startRoulette = () => {
    if (isSpinning || presetGridMods.length === 0) return;
    setIsSpinning(true);
    setRolledMod(null);

    let counter = 0;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * presetGridMods.length);
      setRolledMod(presetGridMods[randomIdx]);
      counter++;
      if (counter > 10) {
        clearInterval(interval);
        const finalIdx = Math.floor(Math.random() * presetGridMods.length);
        setRolledMod(presetGridMods[finalIdx]);
        setIsSpinning(false);
      }
    }, 120);
  };

  return (
    <div className="space-y-6 text-right">
      
      {/* 1. Lucky Mod Roulette (Straight and Elegant) */}
      <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-2xl relative overflow-hidden text-right shadow-2xl transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-red-650/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between pb-3 border-b border-zinc-900 mb-4">
          <span className="text-[9px] text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-xl border border-zinc-800 uppercase font-black tracking-widest flex items-center gap-1">
            <Shuffle className="w-3 h-3 text-red-500 animate-spin" />
            Randomizer
          </span>
          <h4 className="text-xs font-black text-white flex items-center gap-1.5 justify-end">
            <span>{language === 'ar' ? 'روليت الحظ السريع' : 'Lucky Mod Roulette'}</span>
          </h4>
        </div>

        <p className="text-[10px] text-zinc-400 font-medium leading-normal mb-4">
          {language === 'ar' 
            ? 'اضغط على الزر ليقوم الروليت باختيار مود عشوائي لك وتنزيله فوراً بنقرة واحدة!' 
            : 'Unsure what to download? Trigger our lucky selector to pick a premium game package instantly!'}
        </p>

        {/* Display Rolled Content */}
        <AnimatePresence mode="wait">
          {rolledMod ? (
            <motion.div
              key={rolledMod.id}
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-black/40 border border-zinc-900 rounded-xl p-3 mb-4 flex gap-3 text-right items-center select-none"
            >
              <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-zinc-900 bg-zinc-950 relative">
                <img src={rolledMod.thumbnail} alt="" className="w-full h-full object-cover" />
                {isSpinning && (
                  <div className="absolute inset-0 bg-zinc-950/80 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-yellow-400 animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[8px] bg-red-500/10 text-red-400 font-extrabold px-1.5 py-0.2 rounded border border-red-500/10">
                    {rolledMod.category}
                  </span>
                  {!isSpinning && (
                    <div className="text-[9px] text-yellow-405 font-black flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-current text-yellow-500" />
                      {rolledMod.rating}
                    </div>
                  )}
                </div>
                <h5 className="text-xs font-black text-white truncate mt-1">
                  {rolledMod.title}
                </h5>
                {!isSpinning && (
                  <p className="text-[9px] text-emerald-400 font-bold">
                    {language === 'ar' ? 'جاهز للتحميل مجاناً!' : 'Match Found!'}
                  </p>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="border border-zinc-900/80 bg-zinc-900/10 text-center py-7 rounded-xl mb-4 border-dashed">
              <Dices className="w-8 h-8 text-zinc-550 mx-auto mb-2" />
              <p className="text-[10px] text-zinc-500 font-bold">{language === 'ar' ? 'بانتظار تدوير الروليت...' : 'Awaiting spin trigger...'}</p>
            </div>
          )}
        </AnimatePresence>

        <button
          onClick={startRoulette}
          disabled={isSpinning}
          className="w-full bg-red-650 hover:bg-red-550 disabled:opacity-50 text-white text-xs font-black py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md"
        >
          <Dices className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
          <span>
            {isSpinning 
              ? (language === 'ar' ? 'يتم الاختيار الآن...' : 'Selecting randomized fit...') 
              : (language === 'ar' ? 'حدد لي موداً عشوائياً' : 'Spin Mod Roulette')}
          </span>
        </button>
      </div>

      {/* 2. Hand-picked Add-ons Sidebar Section */}
      <div className="flex items-center justify-between border-b border-dashed border-zinc-900 w-full pb-3 mt-4">
        <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-500" />
          {language === 'ar' ? 'إضافات ذهبية يدوية الاختيار' : 'EXCLUSIVE HAND-PICKED ADD-ONS'}
        </h3>
        <span className="text-[8px] text-yellow-405 bg-yellow-500/10 px-2.5 py-0.5 rounded-full border border-yellow-500/20 uppercase font-black tracking-wider">
          EXCLUSIVE
        </span>
      </div>

      {/* Symmetrical & Clean List */}
      <div className="space-y-4">
        {presetGridMods.map((mod) => {
          return (
            <motion.div 
              key={mod.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
              whileHover={{ 
                y: -2,
                transition: { duration: 0.2 } 
              }}
              className="bg-zinc-950 border border-zinc-900 rounded-2xl p-3.5 flex gap-3.5 items-center group transition text-right shadow-lg"
            >
              <div className="w-18 h-14 shrink-0 relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-900 shadow-inner">
                <img 
                  src={mod.thumbnail} 
                  alt={mod.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="flex-1 text-right w-full min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[8px] font-black text-red-500 uppercase bg-red-650/10 px-2 py-0.5 rounded-md border border-red-500/10">
                    {mod.category}
                  </span>
                  <div className="flex items-center gap-0.5 text-[9px] font-black text-amber-400">
                    <Star className="w-3 h-3 fill-current text-yellow-500" />
                    {mod.rating}
                  </div>
                </div>
                <h4 className="text-xs sm:text-sm font-black text-white truncate group-hover:text-amber-400 transition select-none">
                  {mod.title}
                </h4>
                
                <button 
                  onClick={() => onDownload(mod.downloadUrl)}
                  className="text-zinc-300 hover:text-white text-[9px] font-black flex items-center gap-1 transition-all bg-black/60 border border-zinc-900 hover:border-zinc-800 px-2.5 py-1 rounded-lg"
                >
                  <Download className="w-3 h-3 text-red-500" />
                  {language === 'ar' ? 'تحميل المود' : 'Get Mod'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Cyber-Security status (Straight & Aligned) */}
      <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 justify-end">
          <h4 className="text-xs font-black text-white uppercase">{language === 'ar' ? 'فحص خادم أمني سحابي' : 'Sec Cloud Protection'}</h4>
          <ShieldCheck className="w-5 h-5 text-emerald-400 animate-pulse" />
        </div>
        <p className="text-[10px] text-zinc-400 leading-relaxed font-black">
          {language === 'ar' 
            ? 'تخضع اللوحة والمودات للفحص الدقيق المتكرر لضمان ملفات موثوقة 100% وخالية من أي مشاكل.' 
            : 'Every file undergoes rigorous sandbox testing to keep your game safe and perfectly secure.'}
        </p>
      </div>
    </div>
  );
};
