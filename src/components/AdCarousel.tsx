import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, Sparkles, Navigation, Coins } from 'lucide-react';

interface Ad {
  id: string;
  imageUrl: string;
  link: string;
  title?: string;
}

interface AdCarouselProps {
  ads: Ad[];
  language: 'ar' | 'en';
  theme: 'dark' | 'light';
  onAdClick: (ad: Ad) => void;
  isAdmin: boolean;
  onOpenAdmin: () => void;
}

export const AdCarousel: React.FC<AdCarouselProps> = ({
  ads,
  language,
  theme,
  onAdClick,
  isAdmin,
  onOpenAdmin,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Default Fallback Ads if database is empty
  const defaultAds: Ad[] = [
    {
      id: 'default-join-discord',
      title: language === 'ar' 
        ? 'انضم إلى مجتمعنا الرسمي على ديسكورد للحصول على تحديثات المودات أولاً بأول! 💬🔥' 
        : 'Join our official Discord community to receive instant Minecraft mod updates! 💬🔥',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200',
      link: 'https://discord.gg/golden-gih',
    },
    {
      id: 'default-claim-points',
      title: language === 'ar'
        ? 'تصفح الإعلانات والروابط الشريكة اليوم للحصول على رصيد نقاط إضافي فوري! 🪙🎁'
        : 'Browse sponsored links and announcements today to earn instant bonus points! 🪙🎁',
      imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=1200',
      link: '#',
    },
    {
      id: 'default-pricing',
      title: language === 'ar'
        ? 'مساعد متجر ماين كرافت المدعوم بالذكاء الاصطناعي متوفر الآن لجميع الأعضاء! 🤖💎'
        : 'AI Minecraft Marketplace Assistant is now available for all registered users! 🤖💎',
      imageUrl: 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&q=80&w=1200',
      link: '#',
    }
  ];

  const activeAds = ads.length > 0 ? ads : defaultAds;

  // Auto slide every 5.5 seconds
  useEffect(() => {
    if (activeAds.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeAds.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [activeAds.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeAds.length) % activeAds.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeAds.length);
  };

  const currentAd = activeAds[currentIndex];

  if (!currentAd) return null;

  return (
    <div className="w-full space-y-5" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Label and Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
        <div className="space-y-1">
          <h3 className="text-xs font-black uppercase text-amber-500 tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
            {language === 'ar' ? 'لوحة الإعلانات والاستكشاف الذكي' : 'FEATURED ANNOUNCEMENTS & DISCOVERY'}
          </h3>
          <p className="text-[10px] sm:text-xs text-zinc-500 font-medium">
            {language === 'ar' 
              ? 'تفاعل وتصفح الإعلانات والأنشطة للحصول على نقاط شحن مجانية مجزية!' 
              : 'Interact with registered sponsors & activities to unlock bonus free download points!'}
          </p>
        </div>
        <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase font-black tracking-widest">
          {language === 'ar' ? 'نشط الآن' : 'LIVE OFFER'}
        </span>
      </div>

      {/* Slider Widget */}
      <div 
        id="ad-carousel-widget"
        className="relative bg-zinc-950 border border-zinc-900 rounded-[2rem] h-[220px] md:h-[280px] w-full overflow-hidden shadow-2xl group"
      >
        {/* Animated Background Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentAd.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Background Image with elegant overlay filter */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent z-[2]" />
            <img 
              src={currentAd.imageUrl} 
              alt={currentAd.title || 'Advertisement'} 
              className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
              referrerPolicy="no-referrer"
            />

            {/* Content Overlay */}
            <div className="absolute inset-0 z-[3] p-6 md:p-10 flex flex-col justify-end text-right space-y-3.5" dir="rtl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] font-black uppercase bg-amber-500 text-black px-2 py-0.5 rounded-lg select-none shadow-md">
                  {language === 'ar' ? '📢 إعلان ممول' : '📢 Sponsored Ad'}
                </span>
                <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1 select-none">
                  <Coins className="w-3 h-3 text-amber-500" />
                  {language === 'ar' ? '+3 نقاط عند التصفح' : '+3 Pts on Click'}
                </span>
              </div>

              <h4 className="text-base sm:text-xl lg:text-2xl font-black text-white leading-tight tracking-tight max-w-2xl text-right">
                {currentAd.title || (language === 'ar' ? 'إعلان غولدين غيح المميز' : 'Golden Gih Exclusive')}
              </h4>

              {/* Action Button container */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => onAdClick(currentAd)}
                  className="bg-amber-500 hover:bg-amber-400 text-black px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-lg flex items-center gap-1.5 active:scale-[0.98] select-none cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  {language === 'ar' ? 'انقر للتصفح وربح النقاط' : 'Visit & Claim Points'}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Left & Right Subtle Controls */}
        <button
          onClick={handlePrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-[10] bg-black/40 hover:bg-amber-500/20 text-zinc-400 hover:text-white p-2.5 rounded-full transition-all backdrop-blur-sm shadow-md border border-white/5 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100"
        >
          <Navigation className="w-4 h-4 -rotate-90 text-amber-500" />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-[10] bg-black/40 hover:bg-amber-500/20 text-zinc-400 hover:text-white p-2.5 rounded-full transition-all backdrop-blur-sm shadow-md border border-white/5 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100"
        >
          <Navigation className="w-4 h-4 rotate-90 text-amber-500" />
        </button>

        {/* 3 dots indicator ••• underneath but inside card footer strictly as requested */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[10] flex items-center gap-1.5 bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/5 select-none">
          {activeAds.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2.5 h-2.5 rounded-full cursor-pointer ${
                index === currentIndex 
                  ? 'bg-amber-500' 
                  : 'bg-zinc-650'
              }`}
              title={`Slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {isAdmin && (
        <div className="flex items-center justify-end">
          <button
            onClick={onOpenAdmin}
            className="text-[10px] font-bold text-zinc-500 hover:text-amber-500 transition-colors flex items-center gap-1.5 py-1 px-3 border border-zinc-900 rounded-lg hover:border-amber-500/20 cursor-pointer bg-zinc-950"
          >
            ⚙️ {language === 'ar' ? 'إضافة وتعديل الإعلانات من لوحة التحكم' : 'Manage Ads in Admin Panel'}
          </button>
        </div>
      )}
    </div>
  );
};
