import React from 'react';
import { motion } from 'motion/react';
import { Smartphone, Flame, TrendingUp, CheckCircle2 } from 'lucide-react';

interface Game {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  downloadUrl: string;
  category: string;
  rating: number;
}

interface GaugesSectionProps {
  language: 'ar' | 'en';
  localTheme: 'dark' | 'light';
  games: Game[];
}

export const GaugesSection: React.FC<GaugesSectionProps> = ({
  language,
  localTheme,
  games,
}) => {
  // Calculate real, accurate, non-simulated numbers from the database
  const modsCount = games.filter(
    (g) => g.category === 'مودات' || g.category === 'Mods'
  ).length;

  const mapsCount = games.filter(
    (g) => g.category === 'خرائط' || g.category === 'Maps'
  ).length;

  const otherCount = games.filter(
    (g) =>
      !['مودات', 'Mods', 'خرائط', 'Maps'].includes(g.category)
  ).length;

  // Real overall calculated average rating of the uploaded components
  const averageRating =
    games.length > 0
      ? (
          games.reduce((acc, g) => acc + (g.rating || 5), 0) / games.length
        ).toFixed(1)
      : '5.0';

  const stats = [
    { 
      icon: Smartphone, 
      label: language === 'ar' ? 'المودات النشطة بقاعدة البيانات' : 'Active Mods in Database', 
      value: `${modsCount}`,
      themeColor: 'border-red-500/20 hover:border-red-500 hover:shadow-red-500/5 text-red-500',
      bgColor: 'bg-zinc-950',
    },
    { 
      icon: Flame, 
      label: language === 'ar' ? 'الخرائط الجاهزة للتحميل' : 'Maps Ready to Load', 
      value: `${mapsCount}`,
      themeColor: 'border-yellow-500/20 hover:border-yellow-500 hover:shadow-yellow-500/5 text-yellow-500',
      bgColor: 'bg-zinc-950',
    },
    { 
      icon: CheckCircle2, 
      label: language === 'ar' ? 'متوسط تقييم المودات' : 'Average Mod Rating', 
      value: `${averageRating} / 5.0`,
      themeColor: 'border-purple-500/20 hover:border-purple-500 hover:shadow-purple-500/5 text-purple-400',
      bgColor: 'bg-zinc-950',
    },
  ];

  return (
    <section className="pt-6 pb-2 border-t border-dashed border-zinc-900 w-full relative">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ 
              y: -4,
              transition: { type: 'spring', stiffness: 200 }
            }}
            className={`relative overflow-hidden border p-5 rounded-2xl text-center group transition-all duration-300 ${stat.bgColor} ${stat.themeColor} shadow-2xl`}
          >
            {/* Corner index tag */}
            <div className="absolute top-0 right-0 px-2 py-0.5 bg-zinc-900 border-l border-b border-zinc-800 rounded-bl-lg text-[9px] text-zinc-500 font-mono">
              0{i+1}
            </div>

            {/* Glowing dot */}
            <div className={`absolute top-3 left-3 w-1.5 h-1.5 rounded-full animate-ping opacity-40 bg-current`} />

            <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-black/30 border border-zinc-900 flex items-center justify-center transition-transform group-hover:scale-105">
              <stat.icon className="w-5 h-5 transition-transform" />
            </div>

            <p className="text-2xl md:text-3xl font-black tracking-tighter text-white">
              {stat.value}
            </p>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-wider mt-1 block">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
