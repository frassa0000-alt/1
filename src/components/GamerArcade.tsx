import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Flame, 
  Coins, 
  Gamepad2, 
  Volume2, 
  ChevronRight, 
  ChevronLeft, 
  Trophy, 
  Play, 
  Shuffle, 
  RefreshCw,
  Gift,
  MousePointerClick,
  AlertOctagon
} from 'lucide-react';

interface GamerArcadeProps {
  language: 'ar' | 'en';
  user: any;
  userProfile: any;
  guestPoints: number;
  setGuestPoints: React.Dispatch<React.SetStateAction<number>>;
  setPointsNotification: (notif: { show: boolean; points: number; message: string } | null) => void;
  updateCloudPoints?: (points: number) => Promise<void>;
  localTheme: 'dark' | 'light';
}

// Minecraft Block Types
interface BlockType {
  id: string;
  nameAr: string;
  nameEn: string;
  emoji: string;
  color: string;
  maxHp: number;
  rewardPoints: number;
  particleColor: string;
}

const BLOCKS_POOL: BlockType[] = [
  { id: 'dirt', nameAr: 'بلوك العشب الأولي', nameEn: 'Grass Block', emoji: '🌱', color: 'from-emerald-800 to-amber-900', maxHp: 3, rewardPoints: 2, particleColor: '#10b981' },
  { id: 'coal', nameAr: 'خام الفحم المطوّر', nameEn: 'Coal Ore', emoji: '⬛', color: 'from-zinc-800 to-black', maxHp: 5, rewardPoints: 4, particleColor: '#4b5563' },
  { id: 'iron', nameAr: 'خام الحديد النادر', nameEn: 'Iron Ore', emoji: '🪙', color: 'from-zinc-500 to-amber-700', maxHp: 8, rewardPoints: 8, particleColor: '#d97706' },
  { id: 'gold', nameAr: 'خام الذهب اللامع', nameEn: 'Gold Ore', emoji: '✨', color: 'from-yellow-600 to-amber-600', maxHp: 12, rewardPoints: 15, particleColor: '#fbbf24' },
  { id: 'diamond', nameAr: 'بلوك الدايموند الأسطوري', nameEn: 'Diamond Ore', emoji: '💎', color: 'from-cyan-500 to-blue-700', maxHp: 18, rewardPoints: 30, particleColor: '#22d3ee' },
  { id: 'netherite', nameAr: 'حطام النذرايت الخارق', nameEn: 'Netherite Block', emoji: '🔥', color: 'from-purple-950 to-zinc-900', maxHp: 25, rewardPoints: 50, particleColor: '#a855f7' },
  { id: 'gih_golden', nameAr: 'بلوك الـ Golden Gih المشرق', nameEn: 'Golden Gih Core', emoji: '👑', color: 'from-red-600 via-amber-500 to-rose-650', maxHp: 35, rewardPoints: 100, particleColor: '#ef4444' }
];

// Synth sounds helper using Web Audio API
const playSynthAudio = (type: 'creeper' | 'level' | 'villager' | 'gem') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    if (type === 'gem') {
      // Clean high-pitched ding chime
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1); // A6
      
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } 
    else if (type === 'level') {
      // Classic ascending level up chord
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.08);
        
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.08 + 0.3);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.08);
        osc.stop(audioCtx.currentTime + idx * 0.08 + 0.4);
      });
    }
    else if (type === 'villager') {
      // Hum sound
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(110, audioCtx.currentTime + 0.3);
      
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    }
    else if (type === 'creeper') {
      // Hissing to deep rumble noise
      const bufferSize = audioCtx.sampleRate * 0.8;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noiseNode = audioCtx.createBufferSource();
      noiseNode.buffer = buffer;
      
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(8000, audioCtx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.6);
      
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      
      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      
      noiseNode.start();
      noiseNode.stop(audioCtx.currentTime + 0.8);
    }
  } catch (err) {
    console.error('Audio synthesizer error:', err);
  }
};

export const GamerArcade: React.FC<GamerArcadeProps> = ({
  language,
  user,
  userProfile,
  guestPoints,
  setGuestPoints,
  setPointsNotification,
  updateCloudPoints,
  localTheme
}) => {
  const isRTL = language === 'ar';

  // --- 1. MINER CLICKER GAME STATES ---
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [blockHp, setBlockHp] = useState(BLOCKS_POOL[0].maxHp);
  const [clickCount, setClickCount] = useState(0);
  const [totalMinedCount, setTotalMinedCount] = useState(() => {
    return Number(localStorage.getItem('gih_arcade_mined_count') || '0');
  });
  const [clickParticles, setClickParticles] = useState<{ id: number; x: number; y: number; text: string }[]>([]);
  const [blockJiggle, setBlockJiggle] = useState(false);

  // --- 2. LUCKY CHEST MINIGAME ---
  const [chestOpenState, setChestOpenState] = useState<'closed' | 'shaking' | 'opened'>('closed');
  const [chestCooldownTime, setChestCooldownTime] = useState<string | null>(() => {
    return localStorage.getItem('gih_chest_next_claim') || null;
  });
  const [cooldownRemainingStr, setCooldownRemainingStr] = useState('');
  const [isLootProcessing, setIsLootProcessing] = useState(false);
  const [unlockedLoot, setUnlockedLoot] = useState<{ name: string; icon: string; points: number } | null>(null);

  // Cooldown countdown effect
  useEffect(() => {
    const handleInterval = () => {
      if (!chestCooldownTime) return;
      const targetTime = new Date(chestCooldownTime).getTime();
      const now = new Date().getTime();
      const diff = targetTime - now;
      if (diff <= 0) {
        setChestCooldownTime(null);
        localStorage.removeItem('gih_chest_next_claim');
        setCooldownRemainingStr('');
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setCooldownRemainingStr(isRTL ? `${mins} دقيقة و ${secs} ثانية` : `${mins}m ${secs}s`);
      }
    };
    handleInterval();
    const interval = setInterval(handleInterval, 1000);
    return () => clearInterval(interval);
  }, [chestCooldownTime, isRTL]);

  const currentBlock = BLOCKS_POOL[currentBlockIndex];

  // Mine the block click handler
  const handleMineClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (blockHp <= 0) return;

    setBlockJiggle(true);
    setTimeout(() => setBlockJiggle(false), 90);

    // Dynamic sounds
    playSynthAudio('gem');

    // Visual particles at click coordinates (relative to stage)
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newParticle = {
      id: Date.now() + Math.random(),
      x,
      y,
      text: `-1 HP`
    };
    setClickParticles(prev => [...prev, newParticle].slice(-20));

    const nextHp = blockHp - 1;
    setBlockHp(nextHp);
    setClickCount(prev => prev + 1);

    if (nextHp <= 0) {
      // Block Broken! Give Points!
      playSynthAudio('level');
      const earned = currentBlock.rewardPoints;

      // Update local storage mined tally
      const nextTally = totalMinedCount + 1;
      setTotalMinedCount(nextTally);
      localStorage.setItem('gih_arcade_mined_count', String(nextTally));

      // Handle Points Addition
      if (user && updateCloudPoints && userProfile) {
        const newTotal = (userProfile.points || 0) + earned;
        await updateCloudPoints(newTotal);
      } else {
        const newTotal = guestPoints + earned;
        setGuestPoints(newTotal);
        localStorage.setItem('gih_guest_points', String(newTotal));
      }

      setPointsNotification({
        show: true,
        points: earned,
        message: isRTL 
          ? `🎉 رائع! تم تحطيم "${currentBlock.nameAr}" بالكامل وحصلت على +${earned} نقطة إضافية في رصيدك!`
          : `🎉 Block Broken! You fully obliterated "${currentBlock.nameEn}" and secured +${earned} points!`
      });

      // Shift to next random block in pool after brief freeze
      setTimeout(() => {
        const nextIndex = (currentBlockIndex + 1) % BLOCKS_POOL.length;
        setCurrentBlockIndex(nextIndex);
        setBlockHp(BLOCKS_POOL[nextIndex].maxHp);
      }, 1000);
    }
  };

  // Open daily lucky chest
  const handleOpenChest = async () => {
    if (chestCooldownTime || chestOpenState !== 'closed') return;

    setChestOpenState('shaking');
    playSynthAudio('creeper');

    // Simulate chest rumble
    setTimeout(async () => {
      // Calculate random rewards
      const lootedItems = [
        { nameAr: 'سيف النذرايت الخارق المشتعل', nameEn: 'Fiery Netherite Blade', icon: '⚔️', points: 40 },
        { nameAr: 'تاج المودات المطلي بالذهب والماس', nameEn: 'Golden Diamond Crown', icon: '👑', points: 80 },
        { nameAr: 'قلب الطاقة اللانهائي للمودات', nameEn: 'Infinity Energy Core', icon: '⚡', points: 120 },
        { nameAr: 'منجم دايموند كامل وسري', nameEn: 'Secret Diamond Cache', icon: '💎', points: 200 },
        { nameAr: 'حقيبة كنز المشرفين الذهبية السنوية', nameEn: 'Ultimate Golden Loot Sack', icon: '🎁', points: 300 }
      ];

      const item = lootedItems[Math.floor(Math.random() * lootedItems.length)];
      setUnlockedLoot({
        name: isRTL ? item.nameAr : item.nameEn,
        icon: item.icon,
        points: item.points
      });

      // Add points to wallet
      if (user && updateCloudPoints && userProfile) {
        const currentPts = userProfile.points || 0;
        await updateCloudPoints(currentPts + item.points);
      } else {
        const currentPts = guestPoints;
        const newTotal = currentPts + item.points;
        setGuestPoints(newTotal);
        localStorage.setItem('gih_guest_points', String(newTotal));
      }

      setChestOpenState('opened');
      playSynthAudio('level');

      // Set cooldown to 3 Hours
      const cooldownDate = new Date();
      cooldownDate.setHours(cooldownDate.getHours() + 3);
      const isoStr = cooldownDate.toISOString();
      setChestCooldownTime(isoStr);
      localStorage.setItem('gih_chest_next_claim', isoStr);

    }, 1500);
  };

  const handleResetChest = () => {
    setChestOpenState('closed');
    setUnlockedLoot(null);
  };

  return (
    <div className="space-y-8 w-full select-none text-right" dir="rtl">
      
      {/* HEADER STATEMENT OF GAMER CORNER */}
      <div className="bg-gradient-to-r from-red-600 via-amber-500 to-rose-650 p-6 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden transition-all">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="text-[10px] bg-black/40 text-yellow-300 font-black px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 border border-yellow-500/20">
              <Sparkles className="w-3 h-3 animate-spin" />
              أروق وأجمل إضافة تفاعلية بالشرق الأوسط
            </span>
            <h2 className="text-2xl md:text-3xl font-black">🕹️ حارة الألعاب والتحدي (Golden Arcade)</h2>
            <p className="text-xs font-semibold text-rose-100 max-w-xl">
              هل تمل من مجرد تصفح القوائم؟ العب كليكر، طقطق الأصوات، افتح حقائب الكنوز، واجمع نقاط حقيقية ومضمونة لاستبدالها فوراً بتحميل المودات والملفات المتميزة مجاناً!
            </p>
          </div>
          <div className="flex items-center gap-2 bg-black/30 p-3 rounded-2xl border border-white/5 shadow-inner">
            <div className="space-y-0.5 text-center">
              <span className="text-[9px] text-zinc-300 block font-bold">نقاطك القابلة للاستخدام</span>
              <span className="text-xl font-black text-amber-300 font-mono flex items-center gap-1 justify-center">
                <Coins className="w-5 h-5 text-amber-400" />
                {user ? (userProfile?.points || 0) : guestPoints}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* GAMES GRID IN ONE EXCITING LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* MODULE A: MINECRAFT CLICKER & BLOCK BRONK (COLUMN 12 ON MOBILE, 7 ON DESKTOP) */}
        <div className="lg:col-span-12 xl:col-span-7 bg-zinc-950/80 border border-zinc-900 rounded-[2.5rem] p-6 relative overflow-hidden shadow-2xl space-y-5">
          <div className="absolute top-0 right-0 w-32 h-31 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-900 pb-4 gap-2">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <MousePointerClick className="w-5 h-5 text-red-500 animate-pulse" />
                <span>⛏️ منجم الكليكر ماين كرافت (Mine Clicker)</span>
              </h3>
              <p className="text-xs text-zinc-500 font-semibold">
                طقطق على البلوك أدناه لتفتيته وجمع الجواهر والذهب في رصيدك تلقائياً!
              </p>
            </div>
            <div className="flex items-center gap-2 bg-zinc-900/60 pr-3 pl-3 py-1.5 rounded-xl border border-zinc-805 shrink-0">
              <span className="text-[10px] text-zinc-400 font-bold">البلوكات المحطمة:</span>
              <span className="text-xs font-black text-white font-mono bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-850">
                {totalMinedCount}
              </span>
            </div>
          </div>

          {/* BLOCK CLICK STAGE */}
          <div className="flex flex-col items-center justify-center py-6 bg-zinc-950 border border-zinc-900 rounded-3xl relative p-4 group">
            
            {/* Background floating particle effect placeholder */}
            <div className="absolute inset-0 bg-radial-gradient from-red-650/5 via-transparent to-transparent opacity-50 pointer-events-none" />

            {/* Hp Progress Line */}
            <div className="w-full max-w-xs mb-6 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-zinc-500 font-sans uppercase">HP: {blockHp} / {currentBlock.maxHp}</span>
                <span className="text-white font-bold">{isRTL ? currentBlock.nameAr : currentBlock.nameEn}</span>
              </div>
              <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 p-0.5 shadow-inner">
                <motion.div 
                  initial={{ width: '100%' }}
                  animate={{ width: `${(blockHp / currentBlock.maxHp) * 100}%` }}
                  transition={{ duration: 0.15 }}
                  className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 rounded-full"
                />
              </div>
            </div>

            {/* Dynamic Interactive Minecraft 3D Block Styled with pure Tailwind and Motion */}
            <div className="relative w-44 h-44 cursor-crosshair flex items-center justify-center my-4" style={{ perspective: '800px' }}>
              <AnimatePresence>
                {blockHp > 0 ? (
                  <motion.div
                    key={currentBlock.id}
                    onClick={handleMineClick}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={blockJiggle ? {
                      x: [0, -6, 6, -4, 4, 0],
                      y: [0, 4, -4, 2, -2, 0]
                    } : {}}
                    transition={{ duration: 0.08 }}
                    className={`w-32 h-32 rounded-3xl bg-gradient-to-br ${currentBlock.color} border-4 border-zinc-900 shadow-2xl relative flex flex-col items-center justify-center text-4xl select-none group-hover:shadow-3xl`}
                  >
                    {/* Retro inner shadow glow */}
                    <div className="absolute inset-1.5 rounded-[1.2rem] bg-black/10 border border-white/5 flex items-center justify-center">
                      <span className="filter drop-shadow-lg text-5xl transform group-hover:scale-110 duration-150 select-none">
                        {currentBlock.emoji}
                      </span>
                    </div>

                    {/* Floating rewards floating badge */}
                    <div className="absolute -top-3 bg-amber-500 text-black text-[9px] font-black px-2.5 py-0.5 rounded-full border border-black/10 shadow shadow-amber-500/20 leading-none">
                      +{currentBlock.rewardPoints} 🪙
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="flex flex-col items-center text-center space-y-2 py-4"
                  >
                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center text-2xl animate-bounce">
                      👑
                    </div>
                    <p className="text-xs font-black text-emerald-400 animate-pulse">تم الفوز بالمكافأة بنجاح! جاري تحضير البلوك التالي...</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Float Numbers Damage/Reward Click Effect */}
              {clickParticles.map(p => (
                <motion.span
                  key={p.id}
                  initial={{ opacity: 1, y: p.y - 12, x: p.x - 20, scale: 0.8 }}
                  animate={{ opacity: 0, y: p.y - 85, scale: 1.1 }}
                  transition={{ duration: 0.7 }}
                  className="absolute text-xs font-black text-rose-500 font-mono tracking-widest leading-none pointer-events-none filter drop-shadow"
                >
                  {p.text}
                </motion.span>
              ))}
            </div>

            {/* Game Instruction Hint */}
            <div className="mt-4 text-center">
              <span className="text-[10px] text-zinc-500 font-bold flex items-center gap-1 justify-center">
                <span>💡 نصيحة سريعة: كل ما كبرت صلابة البلوك، كبرت قيمته ونقاطه التي ستضاف فوراً!</span>
              </span>
            </div>
          </div>
        </div>

        {/* MODULE B: LUCKY CHEST & SYNTH EFFECT (COLUMN 12 ON MOBILE, 5 ON DESKTOP) */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-6">
          
          {/* DAILY LOOT BOX / CHEST OF FORTUNE */}
          <div className="bg-zinc-950/80 border border-zinc-900 rounded-[2.5rem] p-6 relative overflow-hidden shadow-2xl text-right">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-505/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between pb-3 border-b border-zinc-900 mb-4">
              <span className="text-[9px] text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20 uppercase font-black tracking-widest flex items-center gap-1.5 animate-pulse">
                <Gift className="w-3.5 h-3.5" />
                Loot Box
              </span>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5 justify-end">
                <span>📦 صندوق الحظ والجوائز الكبرى</span>
              </h3>
            </div>

            <p className="text-xs text-zinc-400 font-medium leading-relaxed mb-6">
              اضغط لتجربة حظك وفتح صندوق ماين كرافت المشع! يحتوي الصندوق تفاصيل نادرة جداً قد تمنحك حتى <strong className="text-amber-400">300 نقطة</strong>!
            </p>

            <div className="flex flex-col items-center justify-center py-4 bg-zinc-950/60 border border-zinc-900/40 rounded-3xl p-4">
              <AnimatePresence mode="wait">
                {chestOpenState === 'closed' || chestOpenState === 'shaking' ? (
                  <motion.div
                    key="chest"
                    onClick={handleOpenChest}
                    disabled={!!chestCooldownTime}
                    whileHover={!chestCooldownTime ? { scale: 1.05 } : {}}
                    whileTap={!chestCooldownTime ? { scale: 0.95 } : {}}
                    animate={chestOpenState === 'shaking' ? {
                      rotate: [-5, 5, -5, 5, -5, 0],
                      scale: [1, 1.1, 1, 1.1, 1]
                    } : {}}
                    transition={{ repeat: chestOpenState === 'shaking' ? Infinity : 0, duration: 0.25 }}
                    className={`w-28 h-28 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-4xl shadow-inner relative ${
                      chestCooldownTime ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-amber-500/50'
                    }`}
                  >
                    <span className={`text-5xl ${chestOpenState === 'shaking' ? 'animate-bounce' : ''}`}>📦</span>
                    {!chestCooldownTime && (
                      <span className="absolute -top-2 bg-gradient-to-r from-red-650 to-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-red-500/10 shadow animate-bounce">
                        متاح!
                      </span>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="unlocked-loot"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex flex-col items-center text-center space-y-4"
                  >
                    <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-5xl shadow-2xl relative animate-pulse">
                      <span>{unlockedLoot?.icon}</span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">لقد ربحت الآن:</p>
                      <h4 className="text-sm font-black text-white">{unlockedLoot?.name}</h4>
                      <div className="bg-emerald-500/10 text-emerald-400 font-extrabold px-3 py-1 rounded-xl border border-emerald-500/20 text-xs inline-flex items-center gap-1 mt-1 font-mono">
                        +{unlockedLoot?.points} نقطة ذهبية! 🪙
                      </div>
                    </div>

                    <button
                      onClick={handleResetChest}
                      className="text-[10px] font-black hover:text-white text-zinc-400 bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-xl transition duration-200"
                    >
                      إعادة لـ صندوق جديد
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* COOLDOWN DISCLOSURE */}
              {chestCooldownTime && (
                <div className="mt-5 text-center space-y-1 w-full border-t border-zinc-900/80 pt-4">
                  <span className="text-[10px] text-zinc-500 font-bold block">⏱️ يمكنك فتح صندوق آخر من جديد خلال:</span>
                  <span className="text-xs font-mono font-black text-amber-500 bg-amber-500/5 px-3 py-1.5 rounded-full block border border-amber-500/10">
                    {cooldownRemainingStr}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* RETRO SOUNDBOARD FROM HEAVEN */}
          <div className="bg-zinc-950/80 border border-zinc-900 rounded-[2.5rem] p-6 relative overflow-hidden shadow-2xl text-right">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-650/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between pb-3 border-b border-zinc-900 mb-4">
              <span className="text-[9px] text-red-400 bg-red-500/10 px-2.5 py-1 rounded-xl border border-red-500/10 uppercase font-black tracking-widest flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-red-500 shrink-0" />
                Sound Board
              </span>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5 justify-end">
                <span>🎵 لوحة أصوات ماين كرافت التفاعلية</span>
              </h3>
            </div>

            <p className="text-xs text-zinc-400 font-medium leading-relaxed mb-4">
              استمع للمؤثرات الصوتية للألعاب المصممة داخلياً عبر طقطقة الأزرار أدناه:
            </p>

            <div className="grid grid-cols-2 gap-3 text-right">
              {[
                { id: 'creeper', labelAr: 'صوت الكريبر 💣', labelEn: 'Creeper Sss-boom', type: 'creeper', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' },
                { id: 'level', labelAr: 'مستواك ارتفع! 🚀', labelEn: 'Level Up', type: 'level', color: 'bg-blue-500/10 text-blue-400 border-blue-500/15' },
                { id: 'villager', labelAr: 'صوت القروي 😐', labelEn: 'Villager Hmr', type: 'villager', color: 'bg-amber-500/10 text-amber-400 border-amber-500/15' },
                { id: 'gem', labelAr: 'صوت دبلجة الجوائز 💎', labelEn: 'Gem Claim Ding', type: 'gem', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/15' }
              ].map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => playSynthAudio(sound.type as any)}
                  className={`border p-3.5 rounded-2xl text-xs font-black transition duration-200 active:scale-95 text-center flex items-center justify-center gap-1 px-4 cursor-pointer hover:scale-[1.03] ${sound.color}`}
                >
                  <Play className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  <span>{language === 'ar' ? sound.labelAr : sound.labelEn}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
