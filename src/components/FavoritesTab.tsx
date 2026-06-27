import React from 'react';
import { motion } from 'motion/react';
import { Heart, Download, Lock, Star, Coins, Crown } from 'lucide-react';

const calculatePointsPrice = (priceStr: string | undefined): number => {
  if (!priceStr) return 100;
  const cleaned = priceStr.trim();
  const minecoinMatch = cleaned.match(/(\d+)\s*Minecoins/i) || cleaned.match(/(\d+)\s*كوينز/i) || cleaned.match(/(\d+)\s*عملة/i);
  if (minecoinMatch) {
    const coins = parseInt(minecoinMatch[1], 10);
    if (coins <= 80) return 160;
    if (coins <= 160) return 200;
    if (coins <= 310) return 300;
    if (coins <= 490) return 400;
    if (coins <= 830) return 500;
    if (coins <= 990) return 600;
    return Math.round(coins * 1.5);
  }
  const usdMatch = cleaned.match(/\$\s*([0-9.]+)/) || cleaned.match(/([0-9.]+)\s*\$/);
  if (usdMatch) {
    const usd = parseFloat(usdMatch[1]);
    if (usd <= 0.99) return 160;
    if (usd <= 1.99) return 200;
    if (usd <= 2.99) return 300;
    if (usd <= 4.99) return 505;
    return Math.round(usd * 100);
  }
  const numMatch = cleaned.match(/(\d+)/);
  if (numMatch) {
    const val = parseInt(numMatch[1], 10);
    if (val <= 80) return 160;
    if (val <= 160) return 200;
    return Math.round(val * 1.5);
  }
  return 200;
};

interface FavoritesTabProps {
  language: 'ar' | 'en';
  user: any;
  userProfile: any;
  games: any[];
  toggleFavorite: (id: string) => void;
  setLoginMode: (mode: 'options' | 'email-signin' | 'email-signup') => void;
  setShowLoginModal: (show: boolean) => void;
  onDownload: (title: string, url: string, description?: string, category?: string, id?: string) => void;
  onBuyWithPoints?: (game: any) => void;
  isGamePurchased?: (id: string) => boolean;
}

export const FavoritesTab: React.FC<FavoritesTabProps> = React.memo(({
  language,
  user,
  userProfile,
  games,
  toggleFavorite,
  setLoginMode,
  setShowLoginModal,
  onDownload,
  onBuyWithPoints,
  isGamePurchased,
}) => {
  return (
    <div className="space-y-6 mt-4">
      <div className="flex flex-col space-y-2 border-b border-zinc-900 pb-5 text-right">
        <h2 className="text-2xl font-black text-white flex items-center gap-2 justify-start">
          <Heart className="w-6 h-6 text-red-500 fill-red-500" />
          <span>{language === 'ar' ? 'حقيبة مفضلاتي السحابية' : 'Cloud Saved Drawer'}</span>
        </h2>
        <p className="text-xs font-semibold text-zinc-500">
          {language === 'ar' ? 'جميع الإضافات والمودات التي قمت بحفظها للرجوع السهل والسريع في أي وقت' : 'Your personally bookmarked elite items, fully synced for offline lookup anywhere'}
        </p>
      </div>

      {user ? (
        <div className="space-y-4 text-right">
          {userProfile?.favorites && userProfile?.favorites.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.filter(g => userProfile?.favorites?.includes(g.id)).map((game) => {
                const getCategoryVibe = (category: string) => {
                  const norm = category.toUpperCase();
                  if (norm.includes('MOD') || norm.includes('مود')) {
                    return {
                      gradient: 'from-rose-650 to-red-650',
                      borderClass: 'border-red-900 hover:border-red-600',
                      badgeBg: 'bg-rose-500/10 text-rose-450 border-red-500/20',
                      btnBg: 'bg-red-650 hover:bg-red-600',
                      activeColor: 'text-rose-400',
                    };
                  }
                  if (norm.includes('MAP') || norm.includes('خرا') || norm.includes('خرط')) {
                    return {
                      gradient: 'from-emerald-500 to-teal-600',
                      borderClass: 'border-emerald-900 hover:border-emerald-600',
                      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                      btnBg: 'bg-emerald-600 hover:bg-emerald-500',
                      activeColor: 'text-emerald-400',
                    };
                  }
                  if (norm.includes('SHA') || norm.includes('شيد')) {
                    return {
                      gradient: 'from-cyan-500 to-sky-650',
                      borderClass: 'border-cyan-900 hover:border-cyan-600',
                      badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
                      btnBg: 'bg-cyan-600 hover:bg-cyan-500',
                      activeColor: 'text-cyan-400',
                    };
                  }
                  if (norm.includes('RES') || norm.includes('موا') || norm.includes('مور')) {
                    return {
                      gradient: 'from-amber-500 to-orange-600',
                      borderClass: 'border-amber-900 hover:border-amber-600',
                      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                      btnBg: 'bg-amber-550 hover:bg-amber-500',
                      activeColor: 'text-amber-400',
                    };
                  }
                  return {
                    gradient: 'from-fuchsia-500 via-pink-500 to-violet-500',
                    borderClass: 'border-zinc-900 hover:border-zinc-800',
                    badgeBg: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
                    btnBg: 'bg-zinc-800 hover:bg-zinc-750',
                    activeColor: 'text-fuchsia-400',
                  };
                };

                const cardVibe = getCategoryVibe(game.category);

                return (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className={`group bg-zinc-950 border ${cardVibe.borderClass} rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300`}
                  >
                    <div className="aspect-video relative overflow-hidden bg-zinc-900 border-b border-zinc-900">
                      <img 
                      src={game.thumbnail || 'https://images.unsplash.com/photo-1587573089734-09cb69c0f2b4?q=80&w=400'} 
                      alt="" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      referrerPolicy="no-referrer"
                    />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-85" />
                      <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 text-xs font-black text-white border border-zinc-800">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                        {game.rating}
                      </div>
                    </div>
                    <div className="p-5 space-y-3 text-right">
                      <div className="flex items-center justify-between">
                        {game.isPaid ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-lg border text-amber-500 bg-amber-500/10 border-amber-500/20 flex items-center gap-1">
                              <Coins className="w-3.5 h-3.5 inline text-amber-400 animate-pulse" />
                              {game.price || (language === 'ar' ? 'متميز' : 'Premium')}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-lg border text-emerald-400 bg-emerald-500/10 border-emerald-500/20 flex items-center gap-1">
                              {language === 'ar' ? 'الشراء عبر النقط' : 'Buy with points'}
                            </span>
                          </div>
                        ) : (
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-lg border ${cardVibe.badgeBg}`}>
                            {game.category}
                          </span>
                        )}
                        <button 
                        onClick={() => toggleFavorite(game.id)}
                        className={`p-2 rounded-xl transition-all bg-zinc-900 text-zinc-500 hover:text-white hover:bg-zinc-850`}
                      >
                          <Heart className="w-4 h-4 text-red-500 fill-current" />
                        </button>
                      </div>
                      <h4 className={`text-lg font-black leading-tight text-white transition-colors uppercase group-hover:${cardVibe.activeColor}`}>{game.title}</h4>
                      <p className="text-zinc-400 text-xs font-semibold leading-relaxed line-clamp-2">{game.description}</p>
                    </div>
                    <div className="p-5 pt-0 flex flex-col gap-2">
                      {game.isPaid ? (
                        isGamePurchased?.(game.id) ? (
                          <button 
                            onClick={() => onDownload(game.title, game.downloadUrl, game.description, game.category, game.id)}
                            className="w-full text-white text-xs font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-500/20 cursor-pointer shadow-emerald-950/15"
                          >
                            <Crown className="w-4 h-4 text-white" />
                            <span>
                              {(() => {
                                const cat = (game.category || '').toLowerCase();
                                const isAr = language === 'ar';
                                if (cat === 'سكنات' || cat === 'skins') return isAr ? 'تحميل السكن (مفتوح ✅)' : 'Download Skin (Unlocked ✅)';
                                if (cat === 'خرائط' || cat === 'maps') return isAr ? 'تحميل الخريطة (مفتوح ✅)' : 'Download Map (Unlocked ✅)';
                                if (cat === 'شيدرز' || cat === 'shaders' || cat === 'textures') return isAr ? 'تحميل الشيدر (مفتوح ✅)' : 'Download Shader (Unlocked ✅)';
                                if (cat === 'موارد' || cat === 'resources') return isAr ? 'تحميل المورد (مفتوح ✅)' : 'Download Resource (Unlocked ✅)';
                                return isAr ? 'تحميل المود (مفتوح ✅)' : 'Download Mod (Unlocked ✅)';
                              })()}
                            </span>
                          </button>
                        ) : (
                          <button 
                            onClick={() => onBuyWithPoints?.(game)}
                            className="w-full text-white text-xs font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-555 hover:to-yellow-500 border border-amber-550/20 cursor-pointer shadow-amber-950/15 animate-pulse"
                          >
                            <Coins className="w-4 h-4 text-white" />
                            {language === 'ar' 
                              ? `شراء بـ ${game.pointsPrice || calculatePointsPrice(game.price)} نقطة` 
                              : `Buy for ${game.pointsPrice || calculatePointsPrice(game.price)} Points`}
                          </button>
                        )
                      ) : (
                        <button 
                          onClick={() => onDownload(game.title, game.downloadUrl, game.description, game.category, game.id)}
                          className="w-full text-white text-xs font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md bg-gradient-to-r from-red-650 to-amber-600 hover:from-red-600 hover:to-amber-500 border border-red-500/10 cursor-pointer shadow-rose-950/20"
                        >
                          <Download className="w-4 h-4 text-white" />
                          <span>
                            {(() => {
                              const cat = (game.category || '').toLowerCase();
                              const isAr = language === 'ar';
                              if (cat === 'سكنات' || cat === 'skins') return isAr ? 'تنزيل السكن' : 'Download Skin';
                              if (cat === 'خرائط' || cat === 'maps') return isAr ? 'تنزيل الخريطة' : 'Download Map';
                              if (cat === 'شيدرز' || cat === 'shaders' || cat === 'textures') return isAr ? 'تنزيل الشيدر' : 'Download Shader';
                              if (cat === 'موارد' || cat === 'resources') return isAr ? 'تنزيل المورد' : 'Download Resource';
                              return isAr ? 'تنزيل المود' : 'Download Mod';
                            })()}
                          </span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-24 bg-zinc-950 border border-zinc-900 rounded-2xl border-dashed">
              <Heart className="w-16 h-16 text-zinc-900 mx-auto mb-4 opacity-50" />
              <h3 className="text-base font-black text-zinc-400">
                {language === 'ar' ? 'قائمة المفضلات فارغة حالياً' : 'Your Favorites list is currently empty'}
              </h3>
              <p className="text-xs text-zinc-650 mt-1">
                {language === 'ar' 
                  ? 'تصفح الرئيسية وانقر على أيقونة القلب على المودات التي تنال إعجابك لحفظها هنا' 
                  : 'Browse the catalog and click the heart icon on mods you like to bookmark them here'}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-zinc-950 border border-zinc-900 p-8 sm:p-12 rounded-2xl text-center space-y-6 max-w-xl mx-auto">
          <Lock className="w-16 h-16 text-red-500 mx-auto animate-pulse" />
          <div className="space-y-2">
            <h3 className="text-xl font-black text-white">
              {language === 'ar' ? 'يتطلب تسجيل الدخول' : 'Sign In Required'}
            </h3>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              {language === 'ar' 
                ? 'يرجى تسجيل الدخول أو الدخول كزائر لتفعيل ميزة الحفظ السحابي وحقيبة المفضلات لحفظ ومتابعة موداتك المفضلة باستمرار.' 
                : 'Please sign in or enter as a guest to enable automated bookmarks syncing across your devices.'}
            </p>
          </div>
          <button
            onClick={() => {
              setLoginMode('options');
              setShowLoginModal(true);
            }}
            className="bg-red-650 hover:bg-red-600 text-white font-black text-xs px-8 py-3.5 rounded-xl transition-all shadow-lg select-none hover:scale-105 animate-pulse"
          >
            {language === 'ar' ? 'تسجيل الدخول الآن' : 'Sign In Now'}
          </button>
        </div>
      )}
    </div>
  );
});
