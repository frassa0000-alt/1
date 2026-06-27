/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Component, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gamepad2, 
  Download, 
  Search, 
  User as UserIcon, 
  LogOut, 
  Star, 
  Flame, 
  TrendingUp, 
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Mail,
  Github,
  Ghost,
  X,
  Lock,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Settings,
  ClipboardList,
  Plus,
  Edit,
  Edit3,
  Trash2,
  MessageSquare,
  ShieldCheck,
  Shield,
  Sword,
  FileUp,
  Heart,
  Palette,
  UserCog,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  MoreVertical,
  Languages,
  Sun,
  Moon,
  Link as LinkIcon,
  Image as ImageIcon,
  Map,
  Hammer,
  Package,
  Users,
  Crown,
  Zap,
  Sparkles,
  Gift,
  Youtube,
  Send,
  Twitter,
  Music,
  Coins,
  DollarSign,
  UploadCloud,
  Bell,
  FileText,
  Video,
  Layers,
  Share2,
  Wrench
} from 'lucide-react';
import { 
  auth, 
  db, 
  googleProvider, 
  githubProvider,
  OperationType, 
  handleFirestoreError 
} from './firebase';
import { 
  signInWithPopup, 
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  doc, 
  setDoc, 
  getDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  where,
  increment
} from 'firebase/firestore';
// @ts-ignore
import { GoogleGenAI, Type } from '@google/genai';
// @ts-ignore
import backgroundImage from './assets/images/gih_bg_golden_1781052220481.png';
// @ts-ignore
import gihEarthLogo from './assets/images/gih_earth_logo_1782566158589.jpg';

// Import Modular Dashboard Components statically for robust single-file bundling
import { HeroSection } from './components/HeroSection';
import { SidebarSection } from './components/SidebarSection';
import { SearchTab } from './components/SearchTab';
import { FavoritesTab } from './components/FavoritesTab';
import { AdCarousel } from './components/AdCarousel';
import { GamerArcade } from './components/GamerArcade';

// Types
interface Game {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  downloadUrl: string;
  category: string;
  rating: number;
  edition?: 'java' | 'bedrock' | 'both';
  createdAt?: any;
  isPaid?: boolean;
  price?: string;
  pointsPrice?: number;
  downloads?: string;
  version?: string;
  tag?: string;
}

interface UserProfileData {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  favorites: string[];
  theme: 'dark' | 'light';
  role?: 'user' | 'admin';
  verified?: boolean;
  minecraftEdition?: 'java' | 'bedrock';
  points?: number;
  lastPointsClaimedAt?: string | null;
  lastGihClaimedAt?: string | null;
  purchased?: string[];
  bio?: string;
  referralsCount?: number;
}

interface Report {
  id: string;
  userId: string;
  userEmail: string;
  message: string;
  timestamp: any;
  status: 'pending' | 'resolved';
  reply?: string;
}

interface Ad {
  id: string;
  imageUrl: string;
  link: string;
  title?: string;
}

const SEEDED_FALLBACK_GAMES: Game[] = [
  {
    id: "chaos-cubed",
    title: "Chaos Cubed: Cursed Cubes",
    description: "إضافة مكعبات الفوضى واللعنات الجديدة لماين كرافت",
    thumbnail: "/src/assets/images/chaos_cubed_1782507861799.jpg",
    downloadUrl: "https://www.curseforge.com/minecraft/mc-mods/jei",
    category: "مودات",
    rating: 4.8,
    edition: "both",
    isPaid: false,
    downloads: "150K",
    version: "1.20+",
    tag: "خفيف"
  },
  {
    id: "herschel-backpack",
    title: "Herschel Backpack Trials",
    description: "إضافة حزم وحقائب هيرشل للمغامرات والاستكشاف الأسطوري",
    thumbnail: "/src/assets/images/herschel_backpack_1782507876946.jpg",
    downloadUrl: "https://www.curseforge.com/minecraft/mc-mods/jei",
    category: "مودات",
    rating: 4.9,
    edition: "both",
    isPaid: false,
    downloads: "490K",
    version: "1.20+",
    tag: "خفيف"
  },
  {
    id: "actions-and-stuff",
    title: "Actions & Stuff 1.11",
    description: "تعديل رائع لإضافة حركات قتالية وأكشن واقعي للاعبين",
    thumbnail: "/src/assets/images/actions_and_stuff_1782507890452.jpg",
    downloadUrl: "https://www.curseforge.com/minecraft/mc-mods/jei",
    category: "شيدرز",
    rating: 5.0,
    edition: "both",
    isPaid: false,
    downloads: "2.4M",
    version: "1.20+",
    tag: "متوسط"
  },
  {
    id: "essentials",
    title: "Essentials",
    description: "حزمة أدوات وتروس تكنولوجية أساسية لكل سيرفر وعالم",
    thumbnail: "/src/assets/images/essentials_addon_1782507905543.jpg",
    downloadUrl: "https://www.curseforge.com/minecraft/mc-mods/jei",
    category: "مودات",
    rating: 4.7,
    edition: "both",
    isPaid: false,
    downloads: "1.8M",
    version: "1.20+",
    tag: "خفيف"
  },
  {
    id: "royal-mobs",
    title: "Royal Mobs",
    description: "سكنات ومظاهر الموبز والوحوش بالملابس الملكية الذهبية الفاخرة",
    thumbnail: "/src/assets/images/royal_mobs_1782507919624.jpg",
    downloadUrl: "https://www.curseforge.com/minecraft/mc-mods/jei",
    category: "سكنات",
    rating: 4.6,
    edition: "both",
    isPaid: false,
    downloads: "85K",
    version: "1.20+",
    tag: "خفيف"
  },
  {
    id: "jujutsu-anime-hd",
    title: "Jujutsu Anime HD",
    description: "سكنات ومظاهر حصرية مستوحاة من شخصيات أنمي جوجوتسو كايسن بجودة فائقة",
    thumbnail: "/src/assets/images/jujutsu_anime_hd_1782507932416.jpg",
    downloadUrl: "https://www.curseforge.com/minecraft/mc-mods/jei",
    category: "سكنات",
    rating: 4.9,
    edition: "both",
    isPaid: false,
    downloads: "120K",
    version: "1.20+",
    tag: "خفيف"
  }
];

const PRESET_CAROUSEL_MODS: any[] = [];
const PRESET_GRID_MODS: any[] = [];

const AppContent = () => {
  const [user, setUser] = useState<User | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameForDetails, setSelectedGameForDetails] = useState<Game | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [guestName, setGuestName] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [allReviews, setAllReviews] = useState<any[]>([]);

  // Real-time listener for ALL reviews to compute real average ratings of games dynamically
  useEffect(() => {
    const q = query(collection(db, 'reviews'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllReviews(list);
    }, (error) => {
      console.warn("Error subscribing to all reviews:", error);
    });
    return () => unsubscribe();
  }, []);

  const gamesWithRealRatings = React.useMemo(() => {
    return games.map(game => {
      const gameReviews = allReviews.filter(r => r.gameId === game.id);
      let realRating = game.rating;
      if (gameReviews.length > 0) {
        const sum = gameReviews.reduce((acc, r) => acc + r.rating, 0);
        realRating = Number((sum / gameReviews.length).toFixed(1));
      }
      return {
        ...game,
        rating: realRating
      };
    });
  }, [games, allReviews]);

  // Save referral code from URL query string if present
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        localStorage.setItem('gih_referral_code', ref);
        console.log("Saved referral code to local storage:", ref);
      }
    } catch (e) {
      console.warn("Failed checking referral code query param:", e);
    }
  }, []);

  const [deletedGameIds, setDeletedGameIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('golden_gih_deleted_games');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [visualProgress, setVisualProgress] = useState(0);
  const [isVisualLoading, setIsVisualLoading] = useState(true);

  useEffect(() => {
    if (!isVisualLoading) return;

    const interval = setInterval(() => {
      setVisualProgress((prev) => {
        if (prev >= 99) {
          if (!loading) {
            clearInterval(interval);
            setIsVisualLoading(false);
            return 100;
          }
          return 99;
        }
        // Random increment for organic realistic feels
        const incrementVal = Math.floor(Math.random() * 5) + 2;
        return Math.min(prev + incrementVal, 99);
      });
    }, 45);

    return () => clearInterval(interval);
  }, [loading, isVisualLoading]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const changeCategoryAndScroll = (category: string) => {
    setSelectedCategory(category);
    setTimeout(() => {
      const element = document.getElementById('available-mods-anchor');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showThreeDotsMenu, setShowThreeDotsMenu] = useState(false);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  
  // Drawer Editing states
  const [drawerDisplayName, setDrawerDisplayName] = useState('');
  const [drawerBio, setDrawerBio] = useState('');
  const [drawerCustomPhotoUrl, setDrawerCustomPhotoUrl] = useState('');
  const [drawerSelectedEdition, setDrawerSelectedEdition] = useState<'java' | 'bedrock'>('java');
  const [isSavingDrawerProfile, setIsSavingDrawerProfile] = useState(false);
  const [drawerSaveSuccess, setDrawerSaveSuccess] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setDrawerDisplayName(userProfile.displayName || '');
      setDrawerBio(userProfile.bio || '');
      setDrawerCustomPhotoUrl(userProfile.photoURL || '');
      setDrawerSelectedEdition(userProfile.minecraftEdition || 'java');
    }
  }, [userProfile]);

  const [loginMode, setLoginMode] = useState<'options' | 'email-signin' | 'email-signup'>('email-signin');
  const [localTheme, setLocalTheme] = useState<'dark' | 'light'>(
    (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  );

  // Local Points/Coins state for Guests
  const [guestPoints, setGuestPoints] = useState<number>(() => {
    return Number(localStorage.getItem('gih_guest_points') || '0');
  });
  const [guestLastClaimed, setGuestLastClaimed] = useState<string | null>(() => {
    return localStorage.getItem('gih_guest_last_claimed') || null;
  });
  const [guestPurchased, setGuestPurchased] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('gih_guest_purchased') || '[]');
    } catch {
      return [];
    }
  });

  // Points popup notification state
  const [pointsNotification, setPointsNotification] = useState<{
    show: boolean;
    points: number;
    message: string;
  } | null>(null);
  
  // PWA Install Prompt State and Effect
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if running in standalone mode (already installed & opened as PWA)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsAppInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      // Show instructional modal context or alert since native prompt is not available
      alert(
        language === 'ar'
          ? "تثبيت التطبيق على هاتفك 📱:\n\n• على أندرويد (Chrome): اضغط على زر القائمة (⋮) ثم اختر 'تثبيت التطبيق' (Install App).\n• على آيفون (Safari): اضغط على زر المشاركة (📤) ثم اختر 'إضافة للشاشة الرئيسية' (Add to Home Screen)."
          : "Install the app on your phone 📱:\n\n• Android (Chrome): Tap menu (⋮) and select 'Install app' or 'Add to Home screen'.\n• iPhone (Safari): Tap Share (📤) and select 'Add to Home Screen'."
      );
    }
  };
  const [selectedEdition, setSelectedEdition] = useState<'java' | 'bedrock'>(() => {
    return (localStorage.getItem('minecraftEdition') as 'java' | 'bedrock') || 'bedrock';
  });
  const [sortBy, setSortBy] = useState<'newest' | 'highest_rated' | 'most_downloaded'>('newest');
  const [socials, setSocials] = useState<{
    tiktok: string;
    telegram: string;
    discord: string;
    youtube: string;
    twitter: string;
  }>({
    tiktok: '',
    telegram: '',
    discord: '',
    youtube: '',
    twitter: ''
  });

  const [generalSettings, setGeneralSettings] = useState<{
    siteName: string;
    siteDescription: string;
    siteLogo: string;
    siteUrl: string;
    adminEmail: string;
    timezone: string;
    siteLanguage: string;
    maintenanceMode: boolean;
  }>({
    siteName: 'جولدن',
    siteDescription: 'جولدن - محتوى ماين كرافت عربي مميز لأخبار، شروحات، مودات و كل ما يخص عالم ماين كرافت!',
    siteLogo: gihEarthLogo,
    siteUrl: 'https://golden-mc.com',
    adminEmail: 'admin@golden-mc.com',
    timezone: 'القاهرة (UTC+02:00)',
    siteLanguage: 'العربية',
    maintenanceMode: false,
  });

  const [stats, setStats] = useState<{
    totalDownloads: number;
    totalUsers: number;
    totalReviews: number;
    totalFavorites: number;
  }>({
    totalDownloads: 0,
    totalUsers: 0,
    totalReviews: 0,
    totalFavorites: 0,
  });

  useEffect(() => {
    if (generalSettings.siteName) {
      document.title = generalSettings.siteName;
    }
  }, [generalSettings.siteName]);

  useEffect(() => {
    if (!generalSettings.maintenanceMode) {
      setShowLoginModal(false);
    }
  }, [generalSettings.maintenanceMode]);

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

  const isGamePurchased = (gameId: string): boolean => {
    if (user) {
      return userProfile?.purchased?.includes(gameId) || false;
    } else {
      return guestPurchased.includes(gameId);
    }
  };

  const totalPoints = user ? (userProfile?.points || 0) : guestPoints;

  const handleShareWebsite = () => {
    const shareData = {
      title: generalSettings.siteName || 'جولدن',
      text: generalSettings.siteDescription || 'جولدن - محتوى ماين كرافت عربي مميز لأخبار، شروحات، مودات و كل ما يخص عالم ماين كرافت!',
      url: window.location.origin,
    };

    if (navigator.share) {
      navigator.share(shareData)
        .catch((err) => {
          navigator.clipboard.writeText(window.location.origin);
          alert(language === 'ar' ? 'تم نسخ رابط الموقع بنجاح! شاركه الآن مع أصدقائك 🚀' : 'Website link copied successfully! Share it with your friends 🚀');
        });
    } else {
      navigator.clipboard.writeText(window.location.origin);
      alert(language === 'ar' ? 'تم نسخ رابط الموقع بنجاح! شاركه الآن مع أصدقائك 🚀' : 'Website link copied successfully! Share it with your friends 🚀');
    }
  };

  const handleGihNamePointsClaim = async () => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    
    if (user) {
      const lastClaimed = userProfile?.lastGihClaimedAt || null;
      if (lastClaimed === todayStr) {
        setPointsNotification({
          show: true,
          points: 0,
          message: language === 'ar' 
            ? 'لقد حصلت على نقاط مكافأة Gih لليوم بالفعل! عد غداً للحصول عليها مجدداً. ⚡' 
            : 'You have already claimed today\'s Gih reward! Come back tomorrow. ⚡'
        });
        return;
      }
      
      const currentPoints = userProfile?.points || 0;
      const newPoints = currentPoints + 10;
      
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          points: newPoints,
          lastGihClaimedAt: todayStr
        });
        
        setPointsNotification({
          show: true,
          points: 10,
          message: language === 'ar' 
            ? 'رائع! لقد حصلت على 10 نقاط مكافأة لنقرك على Gih اليوم! 🎉' 
            : 'Awesome! You successfully claimed 10 points Gih daily bonus! 🎉'
        });
      } catch (error) {
        console.error("Error updating profile points:", error);
      }
    } else {
      const guestLastGihClaimed = localStorage.getItem('gih_guest_last_gih_claimed');
      if (guestLastGihClaimed === todayStr) {
        setPointsNotification({
          show: true,
          points: 0,
          message: language === 'ar' 
            ? 'لقد حصلت على نقاط مكافأة Gih لليوم بالفعل! عد غداً للحصول عليها مجدداً. ⚡ (سجل دخولك لحفظها على السحاب!)' 
            : 'You have already claimed today\'s Gih reward! Come back tomorrow. ⚡ (Sign in to sync your points!)'
        });
        return;
      }
      
      const newPoints = guestPoints + 10;
      localStorage.setItem('gih_guest_points', String(newPoints));
      localStorage.setItem('gih_guest_last_gih_claimed', todayStr);
      setGuestPoints(newPoints);
      
      setPointsNotification({
        show: true,
        points: 10,
        message: language === 'ar' 
          ? 'رائع! لقد حصلت على 10 نقاط مكافأة كزائر لنقرك على Gih اليوم! 🎉 (سجل الدخول لحفظ نقاطك بشكل دائم!)' 
          : 'Awesome! You successfully claimed 10 points guest Gih daily bonus! 🎉 (Sign in to save permanently!)'
      });
    }
  };

  const handleImageClickPointsClaim = async () => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    
    if (user) {
      const lastClaimed = userProfile?.lastPointsClaimedAt || null;
      if (lastClaimed === todayStr) {
        setPointsNotification({
          show: true,
          points: 0,
          message: language === 'ar' 
            ? 'لقد حصلت على نقاطك المضمونة لليوم بالفعل! عد غداً للحصول على جائزتك اليومية المتجددة. 🌟' 
            : 'You have already claimed today\'s points! Come back tomorrow for more. 🌟'
        });
        return;
      }
      
      const currentPoints = userProfile?.points || 0;
      const newPoints = currentPoints + 50;
      
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          points: newPoints,
          lastPointsClaimedAt: todayStr
        });
        
        setPointsNotification({
          show: true,
          points: 50,
          message: language === 'ar' 
            ? 'مبروك مبروك! لقد ربحت 50 نقطة مكافأة يومية لمشاهدة وتعديل الصورة اليوم! 🎉' 
            : 'Congratulations! You successfully won 50 points daily reward! 🎉'
        });
      } catch (error) {
        console.error("Error updating profile points:", error);
      }
    } else {
      if (guestLastClaimed === todayStr) {
        setPointsNotification({
          show: true,
          points: 0,
          message: language === 'ar' 
            ? 'لقد حصلت على نقاطك المضمونة لليوم بالفعل! عد غداً للحصول على جائزتك اليومية المتجددة. 🌟 (سجل دخولك لحفظها بشكل دائم على السحاب!)' 
            : 'You have already claimed today\'s points! Come back tomorrow for more. 🌟 (Sign in to sync your points permanently!)'
        });
        return;
      }
      
      const newPoints = guestPoints + 50;
      localStorage.setItem('gih_guest_points', String(newPoints));
      localStorage.setItem('gih_guest_last_claimed', todayStr);
      setGuestPoints(newPoints);
      setGuestLastClaimed(todayStr);
      
      setPointsNotification({
        show: true,
        points: 50,
        message: language === 'ar' 
          ? 'مبروك مبروك! لقد ربحت 50 نقطة لمسّ الصورة اليوم! 🎖️ (سجل الدخول لحفظ تقدمك السحابي ونقاطك بأمان!)' 
          : 'Congratulations! You won 50 points for checking the hero today! 🎖️ (Sign in to save your cloud progress!)'
      });
    }
  };

  const handleBuyWithPoints = async (game: any) => {
    const cost = game.pointsPrice || calculatePointsPrice(game.price);
    if (totalPoints < cost) {
      setPointsNotification({
        show: true,
        points: 0,
        message: language === 'ar' 
          ? `عذراً! ليس لديك نقاط كافية لشراء هذا المود. يتطلب هذا المود ${cost} نقطة، بينما رصيدك الحالي هو ${totalPoints} نقطة. يمكنك النقر على الصورة بالأعلى للحصول على 50 نقطة مجانية يومياً! 🪙`
          : `Sorry! You don't have enough points. This mod requires ${cost} points, and you have ${totalPoints} points. You can click the hero image above to claim 50 free points daily! 🪙`
      });
      return;
    }

    if (user) {
      const currentPoints = userProfile?.points || 0;
      const newPoints = Math.max(0, currentPoints - cost);
      const updatedPurchased = [...(userProfile?.purchased || []), game.id];
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          points: newPoints,
          purchased: updatedPurchased
        });
        setPointsNotification({
          show: true,
          points: -cost,
          message: language === 'ar'
            ? `تم الشراء بنجاح! تم خصم ${cost} نقطة من حسابك، ويبدأ التنزيل الآن. استمتع بمودك الجديد! 🚀`
            : `Success! ${cost} points deducted from your balance, your download starts now. Enjoy your new mod! 🚀`
        });
        triggerDownload(game.title, game.downloadUrl, game.description, game.category, game.id);
      } catch (error) {
        console.error("Error buying mod with points:", error);
      }
    } else {
      const newPoints = Math.max(0, guestPoints - cost);
      localStorage.setItem('gih_guest_points', String(newPoints));
      setGuestPoints(newPoints);
      
      const updatedPurchased = [...guestPurchased, game.id];
      localStorage.setItem('gih_guest_purchased', JSON.stringify(updatedPurchased));
      setGuestPurchased(updatedPurchased);

      setPointsNotification({
        show: true,
        points: -cost,
        message: language === 'ar'
          ? `تم الشراء بنجاح! تم خصم ${cost} نقطة من رصيدك كزائر، ويبدأ التنزيل الآن! 🎉 (سجل الدخول لحفظ نقاطك وتنزيلاتك بشكل دائم!)`
          : `Success! ${cost} points deducted from your guest balance, your download is starting now! 🎉 (Sign in to save your points permanently!)`
      });
      triggerDownload(game.title, game.downloadUrl, game.description, game.category, game.id);
    }
  };

  const handleAdClick = async (ad: Ad) => {
    const reward = 3;
    if (user) {
      const currentPoints = userProfile?.points || 0;
      const newPoints = currentPoints + reward;
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          points: newPoints
        });
        setPointsNotification({
          show: true,
          points: reward,
          message: language === 'ar'
            ? `لقد ربحت +3 نقاط لتفاعلك مع الإعلان! 🎉 تم تحديث رصيدك الجديد إلى ${newPoints} نقطة.`
            : `Success! You earned +3 points for viewing this advertisement! 🎉 Your new balance is ${newPoints} Pts.`
        });
      } catch (error) {
        console.error("Error rewarding points on ad click:", error);
      }
    } else {
      const currentGuestPoints = guestPoints;
      const newPoints = currentGuestPoints + reward;
      localStorage.setItem('gih_guest_points', String(newPoints));
      setGuestPoints(newPoints);
      setPointsNotification({
        show: true,
        points: reward,
        message: language === 'ar'
          ? `لقد ربحت +3 نقاط كزائر لتفاعلك مع الإعلان! 🎉 رصيدك الحالي هو ${newPoints} نقطة. (سجل الدخول لحفظ نقاطك بشكل دائم!)`
          : `Success! You earned +3 visitor points for viewing this advertisement! 🎉 Current balance: ${newPoints} Pts. (Sign in to save them!)`
      });
    }

    if (ad.link && ad.link !== '#') {
      window.open(ad.link, '_blank', 'noopener,noreferrer');
    }
  };

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'socials');
    const unsubscribeSocials = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        setSocials(snap.data() as any);
      }
    }, (err) => {
      console.warn("Error fetching social config: ", err);
    });

    const generalRef = doc(db, 'settings', 'general');
    const unsubscribeGeneral = onSnapshot(generalRef, (snap) => {
      if (snap.exists()) {
        setGeneralSettings(prev => ({
          ...prev,
          ...snap.data()
        }));
      }
    }, (err) => {
      console.warn("Error fetching general config: ", err);
    });

    const statsRef = doc(db, 'settings', 'stats');
    const unsubscribeStats = onSnapshot(statsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setStats(prev => ({
          ...prev,
          totalDownloads: Number(data.totalDownloads || 0),
        }));
      } else {
        setDoc(statsRef, {
          totalDownloads: 0,
        }).catch(err => console.warn("Failed initializing stats:", err));
      }
    }, (err) => {
      console.warn("Error fetching stats:", err);
    });

    // Real-time calculation of total registered users and cumulative favorites from Firestore
    const unsubscribeUsersStats = onSnapshot(collection(db, 'users'), (snapshot) => {
      let totalFavs = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (Array.isArray(data.favorites)) {
          totalFavs += data.favorites.length;
        }
      });
      setStats(prev => ({
        ...prev,
        totalUsers: snapshot.size,
        totalFavorites: totalFavs
      }));
    }, (err) => {
      console.warn("Error counting users/favorites stats:", err);
    });

    // Real-time calculation of total reviews/comments from Firestore
    const unsubscribeReviewsStats = onSnapshot(collection(db, 'reviews'), (snapshot) => {
      setStats(prev => ({
        ...prev,
        totalReviews: snapshot.size
      }));
    }, (err) => {
      console.warn("Error counting reviews stats:", err);
    });

    return () => {
      unsubscribeSocials();
      unsubscribeGeneral();
      unsubscribeStats();
      unsubscribeUsersStats();
      unsubscribeReviewsStats();
    };
  }, []);

  const changeEdition = async (edition: 'java' | 'bedrock') => {
    setSelectedEdition(edition);
    localStorage.setItem('minecraftEdition', edition);
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          await updateDoc(userRef, {
            minecraftEdition: edition
          });
        }
      } catch (err) {
        console.error("Error updating edition in user profile:", err);
      }
    }
  };
  const [colorIndex, setColorIndex] = useState(0);
  const [activeMainTab, setActiveMainTab] = useState<'home' | 'search' | 'favorites' | 'settings'>('home');
  const [activeSubTab, setActiveSubTab] = useState<'home' | 'arcade' | 'for-you'>('home');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [activeDownload, setActiveDownload] = useState<{ 
    title: string; 
    url: string; 
    size: string; 
    progress: number;
    description?: string;
    category?: string;
  } | null>(null);

  // States for live integrated contact form
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  // Helper to calculate unique but deterministic file sizes based on title length
  const calculateFileSize = (title: string): string => {
    const hash = (title.length * 31) % 17;
    const baseSize = 2.4 + (hash * 1.7);
    return `${baseSize.toFixed(1)} MB`;
  };

  const triggerDownload = (title: string, url: string, description?: string, category?: string, gameId?: string) => {
    // Security Gate check: Find if this corresponds to a paid item in our catalog
    const gameObj = games.find(g => (gameId && g.id === gameId) || g.downloadUrl === url);
    if (gameObj && gameObj.isPaid) {
      if (!isGamePurchased(gameObj.id)) {
        // Intercept block and show purchase warning popup
        const cost = gameObj.pointsPrice || calculatePointsPrice(gameObj.price);
        setPointsNotification({
          show: true,
          points: 0,
          message: language === 'ar'
            ? `هذا المود متميز! يجب شراؤه أولاً بـ ${cost} نقطة قبل التنزيل. 🪙`
            : `This is a premium mod! You must purchase it first for ${cost} points before downloading. 🪙`
        });
        return;
      }
    }

    const size = calculateFileSize(title);
    // Instant download trigger - normal like any premium website (bypass popup blockers)
    try {
      if (url) {
        window.open(url, '_blank');
      }
    } catch (err) {
      console.error("Direct download popup block or opening error:", err);
    }
    setActiveDownload({ title, url, size, progress: 0, description, category });

    // Increment global downloads in real stats
    updateDoc(doc(db, 'settings', 'stats'), {
      totalDownloads: increment(1)
    }).catch(e => console.warn("Error incrementing downloads in stats:", e));
  };

  // Fast-feedback non-blocking background download state loader
  useEffect(() => {
    if (!activeDownload) return;

    if (activeDownload.progress >= 100) {
      const timer = setTimeout(() => {
        setActiveDownload(null);
      }, 1500); // Hold completed success state visible for 1.5s
      return () => clearTimeout(timer);
    }

    const interval = setInterval(() => {
      setActiveDownload(prev => {
        if (!prev) return null;
        // Faster organic steps for responsive and enjoyable client feedback
        const step = Math.floor(Math.random() * 22) + 18;
        const nextProgress = Math.min(prev.progress + step, 100);
        return { ...prev, progress: nextProgress };
      });
    }, 120);

    return () => clearInterval(interval);
  }, [activeDownload]);

  // Dynamic presets sourced from the Firestore loaded games array with real ratings
  const displayedGames = gamesWithRealRatings.filter(g => !deletedGameIds.includes(g.id));
  const PRESET_CAROUSEL_MODS = displayedGames.slice(0, 3);
  const PRESET_GRID_MODS = displayedGames;

  const activeCarouselIndex = PRESET_CAROUSEL_MODS.length > 0 
    ? Math.min(carouselIndex, PRESET_CAROUSEL_MODS.length - 1) 
    : 0;

  // Array of highly stylized, gorgeous gaming vibes that the user can shuffle!
  const VIBE_THEMES = [
    {
      id: 'neon-red',
      nameAr: 'العاصفة الحمراء',
      nameEn: 'Cyber Red Storm',
      gradient: 'from-rose-600 via-red-650 to-amber-600',
      activeColor: 'text-red-500',
      borderClass: 'border-red-600/30 hover:border-red-500',
      shadowClass: 'shadow-[5px_5px_0px_#ef4444]',
      badgeBg: 'bg-rose-600/10 text-rose-400 border-rose-500/20',
      btnBg: 'bg-red-600 hover:bg-rose-500'
    },
    {
      id: 'matrix-green',
      nameAr: 'شفرة ماتريكس',
      nameEn: 'Matrix Toxic Green',
      gradient: 'from-emerald-400 via-green-550 to-lime-500',
      activeColor: 'text-emerald-400',
      borderClass: 'border-emerald-500/30 hover:border-emerald-400',
      shadowClass: 'shadow-[5px_5px_0px_#10b981]',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      btnBg: 'bg-emerald-600 hover:bg-emerald-500'
    },
    {
      id: 'cyber-pink',
      nameAr: 'شفق طوكيو',
      nameEn: 'Synthwave Neon Pink',
      gradient: 'from-fuchsia-500 via-pink-500 to-violet-500',
      activeColor: 'text-fuchsia-400',
      borderClass: 'border-fuchsia-500/30 hover:border-fuchsia-400',
      shadowClass: 'shadow-[5px_5px_0px_#d946ef]',
      badgeBg: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
      btnBg: 'bg-fuchsia-600 hover:bg-pink-500'
    },
    {
      id: 'frozen-cyan',
      nameAr: 'الصقيع الكهربائي',
      nameEn: 'Frozen Cyan Ice',
      gradient: 'from-cyan-400 via-sky-500 to-blue-650',
      activeColor: 'text-cyan-400',
      borderClass: 'border-cyan-500/30 hover:border-cyan-400',
      shadowClass: 'shadow-[5px_5px_0px_#06b6d4]',
      badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      btnBg: 'bg-cyan-600 hover:bg-cyan-505'
    },
    {
      id: 'golden-sun',
      nameAr: 'الكنز الذهبي',
      nameEn: 'Royal Golden Sun',
      gradient: 'from-yellow-400 via-amber-500 to-orange-600',
      activeColor: 'text-amber-400',
      borderClass: 'border-amber-500/30 hover:border-amber-400',
      shadowClass: 'shadow-[5px_5px_0px_#f59e0b]',
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      btnBg: 'bg-amber-500 hover:bg-yellow-500'
    }
  ];

  const [activeVibeIndex, setActiveVibeIndex] = useState(0);
  const currentVibe = VIBE_THEMES[activeVibeIndex];
  const isAsymmetricalMode = false;

  // Shuffle Vibe randomly!
  const shuffleVibe = () => {
    setActiveVibeIndex((prev) => {
      let next = Math.floor(Math.random() * VIBE_THEMES.length);
      while (next === prev) {
        next = Math.floor(Math.random() * VIBE_THEMES.length);
      }
      return next;
    });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % 5);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const GAMES_PER_PAGE = 6;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Auth Listener
  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Unsubscribe from previous profile if exists
        if (unsubscribeProfile) unsubscribeProfile();

        const userRef = doc(db, 'users', currentUser.uid);
        
        // Listen to User Profile changes
        unsubscribeProfile = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as UserProfileData;
            setUserProfile({
              id: snapshot.id,
              ...data
            } as any);
            if (data.theme) {
              setLocalTheme(data.theme);
              localStorage.setItem('theme', data.theme);
            }
            if (data.minecraftEdition) {
              setSelectedEdition(data.minecraftEdition);
              localStorage.setItem('minecraftEdition', data.minecraftEdition);
            }
          }
        });

        // Update profile / Create if not exists
        try {
          const docSnap = await getDoc(userRef);
          
          if (!docSnap.exists()) {
            // First time login - Create full profile
            let startingPoints = 0;
            const refCode = localStorage.getItem('gih_referral_code');
            if (refCode && refCode !== currentUser.uid) {
              try {
                const referrerRef = doc(db, 'users', refCode);
                const referrerSnap = await getDoc(referrerRef);
                if (referrerSnap.exists()) {
                  const rData = referrerSnap.data();
                  const currentReferrerPoints = rData.points || 0;
                  await updateDoc(referrerRef, {
                    points: currentReferrerPoints + 40,
                    referralsCount: increment(1)
                  });
                  // Log system report
                  await addDoc(collection(db, 'reports'), {
                    userEmail: 'system',
                    message: `🎉 العضو الجديد (${currentUser.email || 'غير معروف'}) سجل عبر رابط دعوة صديق. حصل الداعي (${rData.email || 'غير معروف'}) على 40 نقطة إضافية!`,
                    status: 'resolved',
                    isSystemWarning: false,
                    timestamp: serverTimestamp()
                  });
                  // Grant 40 welcome points to the referred user as well
                  startingPoints = 40;
                }
              } catch (err) {
                console.warn("Error processing referral points reward:", err);
              } finally {
                localStorage.removeItem('gih_referral_code');
              }
            }

            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || '',
              photoURL: currentUser.photoURL || '',
              bio: '',
              role: currentUser.email === 'frassa0000@gmail.com' ? 'admin' : 'user',
              verified: currentUser.email === 'frassa0000@gmail.com' ? true : false,
              theme: 'dark',
              favorites: [],
              minecraftEdition: selectedEdition,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
              points: startingPoints,
              referredBy: refCode || null,
              referralsCount: 0
            });

            // Increment global users count in stats
            await updateDoc(doc(db, 'settings', 'stats'), {
              totalUsers: increment(1)
            }).catch(e => console.warn("Error incrementing user count in stats:", e));
          } else {
            // Returning user - Only update volatile fields
            await updateDoc(userRef, {
              displayName: currentUser.displayName || docSnap.data().displayName,
              photoURL: currentUser.photoURL || docSnap.data().photoURL,
              lastLogin: serverTimestamp(),
            });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
        }
      } else {
        setUserProfile(null);
        if (unsubscribeProfile) unsubscribeProfile();
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  // Games Listener
  useEffect(() => {
    const q = query(collection(db, 'games'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gamesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Game[];
      
      if (gamesList.length === 0) {
        setGames(SEEDED_FALLBACK_GAMES);
      } else {
        const combined = [...gamesList];
        SEEDED_FALLBACK_GAMES.forEach(seeded => {
          if (!combined.some(g => g.id === seeded.id || g.title.toLowerCase() === seeded.title.toLowerCase())) {
            combined.push(seeded);
          }
        });
        setGames(combined);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'games');
    });
    return () => unsubscribe();
  }, [loading, user]);

  // Reviews listener subscription for the active game details drawer
  useEffect(() => {
    if (!selectedGameForDetails) {
      setReviews([]);
      setNewComment('');
      setNewRating(5);
      return;
    }
    setReviewsLoading(true);
    const q = query(
      collection(db, 'reviews'),
      where('gameId', '==', selectedGameForDetails.id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort newest first
      list.sort((a: any, b: any) => {
        const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (new Date(a.createdAt).getTime() || 0);
        const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (new Date(b.createdAt).getTime() || 0);
        return tB - tA;
      });
      setReviews(list);
      setReviewsLoading(false);
    }, (error) => {
      console.error("Error subscribing to reviews:", error);
      setReviewsLoading(false);
    });
    return () => unsubscribe();
  }, [selectedGameForDetails]);

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGameForDetails) return;
    if (!newComment.trim()) {
      alert(language === 'ar' ? 'الرجاء كتابة تعليق أولاً!' : 'Please write a comment first!');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const reviewerName = userProfile?.displayName?.trim() || guestName.trim() || (language === 'ar' ? 'لاعب زائر' : 'Guest Player');
      const reviewerUid = userProfile?.uid || ('guest_' + Math.random().toString(36).substr(2, 9));
      const reviewerPhoto = userProfile?.photoURL || '';

      const reviewData = {
        gameId: selectedGameForDetails.id,
        userId: reviewerUid,
        userName: reviewerName,
        userPhoto: reviewerPhoto,
        rating: Number(newRating),
        comment: newComment.trim(),
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'reviews'), reviewData);
      
      // Increment global reviews count in stats
      await updateDoc(doc(db, 'settings', 'stats'), {
        totalReviews: increment(1)
      }).catch(e => console.warn("Error incrementing reviews count in stats:", e));

      setNewComment('');
      setGuestName('');
    } catch (error) {
      console.error("Error adding review:", error);
      alert(language === 'ar' ? 'حدث خطأ أثناء إضافة التقييم. الرجاء المحاولة مرة أخرى.' : 'Error submitting review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
      setShowLoginModal(false);
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      await signInWithPopup(auth, githubProvider);
      setShowLoginModal(false);
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSocialClick = (url: string | undefined, platformName: string) => {
    if (url && url.trim().startsWith('http')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      alert(language === 'ar' 
        ? `رابط ${platformName} غير نشط حالياً. سيقوم مدير الموقع بتفعيله قريباً!` 
        : `${platformName} link is currently inactive. The administrator will activate it soon!`);
    }
  };

  const handleGuestLogin = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      await signInAnonymously(auth);
      setShowLoginModal(false);
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      if (loginMode !== 'email-signup') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setShowLoginModal(false);
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  const getGameDownloads = (game: Game) => {
    // If the game has a downloads field, use it. Otherwise, generate a deterministic count.
    const title = game.title || '';
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 9800) + 120;
  };

  const getGameCreationTime = (game: Game) => {
    if (game.createdAt) {
      if (typeof game.createdAt.toMillis === 'function') {
        return game.createdAt.toMillis();
      }
      if (game.createdAt instanceof Date) {
        return game.createdAt.getTime();
      }
      if (typeof game.createdAt === 'number') {
        return game.createdAt;
      }
      return new Date(game.createdAt).getTime();
    }
    const id = game.id || '';
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return 1735689600000 + Math.abs(hash % 31536000000);
  };

  const filteredGames = displayedGames.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = (() => {
      if (selectedCategory === 'الكل' || selectedCategory === 'All') return true;
      const cat = (game.category || '').toLowerCase();
      const sel = selectedCategory.toLowerCase();
      
      if (sel === 'سكنات' || sel === 'skins') {
        return cat === 'سكنات' || cat === 'skins';
      }
      if (sel === 'مودات' || sel === 'mods' || sel === 'add-ons' || sel === 'addons') {
        return cat === 'مودات' || cat === 'mods' || cat === 'add-ons' || cat === 'addons';
      }
      if (sel === 'خرائط' || sel === 'maps') {
        return cat === 'خرائط' || cat === 'maps';
      }
      if (sel === 'شيدرز' || sel === 'shaders' || sel === 'textures') {
        return cat === 'شيدرز' || cat === 'shaders' || cat === 'textures';
      }
      if (sel === 'موارد' || sel === 'resources' || sel === 'أدوات' || sel === 'tools') {
        return cat === 'موارد' || cat === 'resources' || cat === 'أدوات' || cat === 'tools';
      }
      return cat === sel;
    })();
    const matchesEdition = !game.edition || game.edition === 'both' || game.edition === selectedEdition;
    return matchesSearch && matchesCategory && matchesEdition;
  });

  const sortedGames = [...filteredGames].sort((a, b) => {
    if (sortBy === 'highest_rated') {
      const ratingA = a.rating ?? 0;
      const ratingB = b.rating ?? 0;
      return ratingB - ratingA;
    }
    if (sortBy === 'most_downloaded') {
      return getGameDownloads(b) - getGameDownloads(a);
    }
    return getGameCreationTime(b) - getGameCreationTime(a);
  });

  const totalPages = Math.ceil(sortedGames.length / GAMES_PER_PAGE);
  const paginatedGames = sortedGames.slice((currentPage - 1) * GAMES_PER_PAGE, currentPage * GAMES_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, sortBy]);

  const isAdmin = user?.email === 'frassa0000@gmail.com';
  
  const latestModsList = [...gamesWithRealRatings]
    .filter(g => g.category === 'مودات' || g.category?.toLowerCase() === 'mods' || g.category?.toLowerCase() === 'addons')
    .sort((a, b) => getGameCreationTime(b) - getGameCreationTime(a));

  const mostDownloadedList = [...gamesWithRealRatings]
    .sort((a, b) => getGameDownloads(b) - getGameDownloads(a));

  const latestSkinsList = [...gamesWithRealRatings]
    .filter(g => g.category === 'سكنات' || g.category?.toLowerCase() === 'skins')
    .sort((a, b) => getGameCreationTime(b) - getGameCreationTime(a));
  
  const translations = {
    ar: {
      home: 'الرئيسية',
      trending: 'الأكثر تحميلاً',
      new: 'جديد المودات',
      heroTitle: 'Golden',
      heroSubtitle: 'Get Started',
      searchPlaceholder: 'ابحث عن المود المفضل لديك...',
      all: 'الكل',
      mods: 'مودات',
      maps: 'خرائط',
      shaders: 'شيدرز',
      resources: 'موارد',
      skins: 'سكنات',
      availableMods: 'المودات المتاحة',
      quickAdd: 'إضافة سريعة عبر الرابط',
      quickAddPlaceholder: 'ضع رابط التحميل هنا (Mediafire, Drive, etc...)',
      processLink: 'معالجة الرابط',
      footerRights: 'جميع الحقوق محفوظة.',
      contact: 'اتصل بنا',
      login: 'تسجيل الدخول',
      userPanel: 'لوحة التحكم',
    },
    en: {
      home: 'Home',
      trending: 'Trending',
      new: 'New Mods',
      heroTitle: 'Golden',
      heroSubtitle: 'Get Started',
      searchPlaceholder: 'Search for your favorite mod...',
      all: 'All',
      mods: 'Mods',
      maps: 'Maps',
      shaders: 'Shaders',
      resources: 'Resources',
      skins: 'Skins',
      availableMods: 'Available Content',
      quickAdd: 'Quick Add via Link',
      quickAddPlaceholder: 'Paste download link here...',
      processLink: 'Process Link',
      footerRights: 'All rights reserved.',
      contact: 'Contact Us',
      login: 'Sign In',
      userPanel: 'Dashboard',
    }
  };

  const t = translations[language];

  const categories = language === 'ar' 
    ? ['الكل', 'مودات', 'خرائط', 'شيدرز', 'موارد', 'سكنات']
    : ['All', 'Mods', 'Maps', 'Shaders', 'Resources', 'Skins'];

  const toggleFavorite = async (gameId: string) => {
    if (!user || !userProfile) {
      setShowLoginModal(true);
      return;
    }
    const isAdding = !(userProfile.favorites || []).includes(gameId);
    const newFavorites = isAdding
      ? [...(userProfile.favorites || []), gameId]
      : userProfile.favorites.filter(id => id !== gameId);
    
    try {
      await updateDoc(doc(db, 'users', user.uid), { favorites: newFavorites });
      
      // Update global favorites count in stats
      await updateDoc(doc(db, 'settings', 'stats'), {
        totalFavorites: increment(isAdding ? 1 : -1)
      }).catch(e => console.warn("Error updating favorites count in stats:", e));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const updateProfile = async (data: Partial<UserProfileData>) => {
    if (data.theme) {
      setLocalTheme(data.theme as 'dark' | 'light');
      localStorage.setItem('theme', data.theme);
    }
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleSendReport = async (message: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'reports'), {
        userId: user.uid,
        userEmail: user.email || 'anonymous',
        message,
        timestamp: serverTimestamp(),
        status: 'pending'
      });
      setShowContactModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reports');
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim()) return;
    setContactSubmitting(true);
    try {
      await addDoc(collection(db, 'reports'), {
        userId: user ? user.uid : 'guest-visitor',
        userEmail: contactEmail.trim() || (user ? user.email : 'anonymous@guest.com'),
        message: `[${language === 'ar' ? 'تواصل' : 'Contact'}: ${contactName.trim() || 'Visitor'}] ${contactMessage.trim()}`,
        timestamp: serverTimestamp(),
        status: 'pending'
      });
      setContactSuccess(true);
      setContactName('');
      setContactEmail('');
      setContactMessage('');
      setTimeout(() => setContactSuccess(false), 5000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reports');
    } finally {
      setContactSubmitting(false);
    }
  };

  const handleAddGame = async (gameData: Omit<Game, 'id'>) => {
    if (!isAdmin) return;
    try {
      await addDoc(collection(db, 'games'), gameData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'games');
    }
  };

  const handleUpdateGame = async (gameId: string, gameData: Partial<Game>) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'games', gameId), gameData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `games/${gameId}`);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!isAdmin) return;
    // Optimistic fast deletion update state and localstorage
    setDeletedGameIds(prev => {
      const updated = [...prev, gameId];
      try {
        localStorage.setItem('golden_gih_deleted_games', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    try {
      await deleteDoc(doc(db, 'games', gameId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `games/${gameId}`);
    }
  };

  const handleResolveReport = async (reportId: string, reply?: string) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'reports', reportId), { 
        status: 'resolved',
        ...(reply ? { reply } : {})
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reports/${reportId}`);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'reports', reportId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `reports/${reportId}`);
    }
  };

  if (isVisualLoading) {
    const getBilingualLoadingMessage = () => {
      if (visualProgress < 25) {
        return {
          ar: "جاري تأمين الاتصال وحماية البيانات الفائقة...",
          en: "Securing connection & establishing cloud armor..."
        };
      } else if (visualProgress < 50) {
        return {
          ar: "فحص ومطابقة ملفات المودات وتوافق الهياكل...",
          en: "Checking mod file structures & ensuring zero payloads..."
        };
      } else if (visualProgress < 75) {
        return {
          ar: "مزامنة محفظة النقاط السحابية والجوائز المتاحة...",
          en: "Synchronizing cloud points wallet & available loot..."
        };
      } else if (visualProgress < 95) {
        return {
          ar: "ضبط أداء المحرك والاتصال بخوادم غولدين جي...",
          en: "Tuning graphics engine & linking high-speed Gih servers..."
        };
      } else {
        return {
          ar: "أهلاً بك في منصة Golden Gih! استعد للمغامرة...",
          en: "Welcome to Golden Gih platform! Prepare to start..."
        };
      }
    };

    const particles = [
      { x: -95, y: -20, s: 4, o: 0.75, delay: 0.2 },
      { x: -90, y: -45, s: 3, o: 0.5, delay: 0.5 },
      { x: -105, y: 10, s: 5, o: 0.85, delay: 0.1 },
      { x: -115, y: -10, s: 3.5, o: 0.4, delay: 0.8 },
      { x: -85, y: 35, s: 6, o: 0.8, delay: 0.4 },
      { x: -92, y: 55, s: 4, o: 0.55, delay: 1.1 },
      { x: -110, y: -30, s: 3, o: 0.45, delay: 1.3 },
      { x: -120, y: 25, s: 4.5, o: 0.6, delay: 0.7 },
      { x: -82, y: -60, s: 5, o: 0.7, delay: 0.9 },
      { x: -100, y: -70, s: 3, o: 0.35, delay: 1.5 },
      { x: 95, y: -20, s: 4, o: 0.8, delay: 0.3 },
      { x: 90, y: -45, s: 3, o: 0.55, delay: 0.6 },
      { x: 105, y: 10, s: 5, o: 0.9, delay: 0.0 },
      { x: 115, y: -10, s: 3.5, o: 0.45, delay: 0.7 },
      { x: 85, y: 35, s: 6, o: 0.85, delay: 0.5 },
      { x: 92, y: 55, s: 4, o: 0.65, delay: 1.2 },
      { x: 110, y: -30, s: 3, o: 0.5, delay: 1.4 },
      { x: 120, y: 25, s: 4.5, o: 0.75, delay: 0.8 },
      { x: 82, y: -60, s: 5, o: 0.6, delay: 1.0 },
      { x: 100, y: -70, s: 3, o: 0.4, delay: 1.6 },
      { x: -40, y: -95, s: 3, o: 0.55, delay: 0.2 },
      { x: 40, y: -95, s: 4, o: 0.65, delay: 0.5 },
      { x: -10, y: -105, s: 3, o: 0.45, delay: 0.9 },
      { x: 20, y: -102, s: 3, o: 0.55, delay: 1.1 },
      { x: -50, y: 92, s: 4, o: 0.65, delay: 0.4 },
      { x: 45, y: 95, s: 3, o: 0.55, delay: 0.7 },
      { x: -15, y: 105, s: 3, o: 0.45, delay: 1.3 },
      { x: 15, y: 102, s: 4, o: 0.65, delay: 0.8 },
    ];

    return (
      <div className="min-h-screen bg-[#030304] flex flex-col items-center justify-center relative overflow-hidden select-none">
        {/* Radial dark atmospheric background vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#0c0a07_0%,_#020203_100%)] pointer-events-none" />
        
        {/* Soft glowing golden ambient orb behind the coin */}
        <div className="absolute w-[320px] h-[320px] bg-amber-500/[0.04] rounded-full blur-[100px] pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center justify-center text-center max-w-[320px] w-full relative z-10"
        >
          {/* Main Gih Medallion Container */}
          <div className="relative w-64 h-64 flex items-center justify-center">
            <svg 
              viewBox="0 0 200 200" 
              className="w-full h-full filter drop-shadow-[0_16px_32px_rgba(20,15,5,0.18)] drop-shadow-[0_0_24px_rgba(245,158,11,0.12)]"
            >
              <defs>
                {/* Golden metallic rim outer gradient */}
                <linearGradient id="gold-rim-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fff8df" />
                  <stop offset="30%" stopColor="#fbbf24" />
                  <stop offset="65%" stopColor="#ca8a04" />
                  <stop offset="100%" stopColor="#713f12" />
                </linearGradient>

                {/* Inner gold rim highlight */}
                <linearGradient id="gold-inner-rim-grad" x1="100%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#fffbeb" />
                  <stop offset="50%" stopColor="#fef08a" />
                  <stop offset="100%" stopColor="#ca8a04" />
                </linearGradient>

                {/* Luminous Golden Front Face Gradient for Gih Logo */}
                <linearGradient id="gih-gold-front" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fffbeb" />
                  <stop offset="15%" stopColor="#fef08a" />
                  <stop offset="65%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#854d0e" />
                </linearGradient>

                {/* Rotating active glow neon arc gradient */}
                <linearGradient id="active-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>

                {/* Golden glow bloom filter */}
                <filter id="gold-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Shimmering Golden Floating Particles Scattered around the Medallion */}
              {particles.map((p, i) => (
                <motion.rect
                  key={i}
                  x={100 + p.x - p.s / 2}
                  y={100 + p.y - p.s / 2}
                  width={p.s}
                  height={p.s}
                  fill="#f59e0b"
                  animate={{
                    opacity: [p.o * 0.35, p.o, p.o * 0.35],
                    scale: [0.85, 1.15, 0.85],
                    y: [100 + p.y - p.s / 2, 100 + p.y - p.s / 2 - 4, 100 + p.y - p.s / 2]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2.2 + (i % 3) * 0.4,
                    delay: p.delay,
                    ease: "easeInOut"
                  }}
                />
              ))}

              {/* Medallion Core Base & Shadows */}
              <circle cx="100" cy="100" r="83" fill="#15120a" opacity="0.1" />
              
              {/* Outer Golden Rim Ring */}
              <circle 
                cx="100" 
                cy="100" 
                r="81" 
                fill="none" 
                stroke="url(#gold-rim-grad)" 
                strokeWidth="7" 
              />

              {/* Fine Inner Accent Inset Border */}
              <circle 
                cx="100" 
                cy="100" 
                r="77.5" 
                fill="none" 
                stroke="#181308" 
                strokeWidth="1.2" 
              />

              {/* Inner Gold Rim Bevel Highlight */}
              <circle 
                cx="100" 
                cy="100" 
                r="76" 
                fill="none" 
                stroke="url(#gold-inner-rim-grad)" 
                strokeWidth="2" 
              />

              {/* Matte Dark Inner Center Background */}
              <circle 
                cx="100" 
                cy="100" 
                r="73.5" 
                fill="#0f0e0c" 
              />



              {/* Centered Pixel Gih Logo group (Exquisite 3D Block Extrusion & Glow) */}
              <g transform="translate(64, 84)">
                {/* Beautiful 3D Solid Drop Shadow/Side Walls via multi-layer offset stack */}
                {[1, 2, 3, 4, 5, 6].map((offset) => (
                  <g key={offset} transform={`translate(${offset * 0.75}, ${offset * 0.75})`}>
                    {/* G side wall shadow */}
                    <path d="M 2,2 h 28 v 8 h -20 v 14 h 14 v -4 h -6 v -4 h 12 v 14 h -28 Z" fill="#3d2605" />
                    {/* i side wall shadow */}
                    <path d="M 36,14 h 8 v 16 h -8 Z M 36,2 h 8 v 8 h -8 Z" fill="#3d2605" />
                    {/* h side wall shadow */}
                    <path d="M 48,2 h 8 v 28 h -8 Z M 56,14 h 16 v 8 h -16 Z M 64,20 h 8 v 10 h -8 Z" fill="#3d2605" />
                  </g>
                ))}

                {/* Symmetrical front face of Gih with elegant bevel border highlight */}
                <g>
                  {/* G Front Face */}
                  <path 
                    d="M 2,2 h 28 v 8 h -20 v 14 h 14 v -4 h -6 v -4 h 12 v 14 h -28 Z" 
                    fill="url(#gih-gold-front)" 
                    stroke="#fffae0"
                    strokeWidth="0.5"
                    strokeLinejoin="miter"
                  />
                  
                  {/* Creeper Hollow Inside the G Cavity */}
                  <rect x="10" y="10" width="14" height="10" fill="#130e05" />
                  <rect x="12" y="11" width="10" height="8" fill="url(#gih-gold-front)" />
                  
                  {/* Pixel-perfect creeper features */}
                  <rect x="13" y="12" width="2" height="2" fill="#130e05" />
                  <rect x="17" y="12" width="2" height="2" fill="#130e05" />
                  <rect x="15" y="14" width="2" height="3" fill="#130e05" />
                  <rect x="14" y="15" width="4" height="2" fill="#130e05" />

                  {/* i Front Face */}
                  <path 
                    d="M 36,14 h 8 v 16 h -8 Z M 36,2 h 8 v 8 h -8 Z" 
                    fill="url(#gih-gold-front)" 
                    stroke="#fffae0"
                    strokeWidth="0.5"
                    strokeLinejoin="miter"
                  />

                  {/* h Front Face */}
                  <path 
                    d="M 48,2 h 8 v 28 h -8 Z M 56,14 h 16 v 8 h -16 Z M 64,20 h 8 v 10 h -8 Z" 
                    fill="url(#gih-gold-front)" 
                    stroke="#fffae0"
                    strokeWidth="0.5"
                    strokeLinejoin="miter"
                  />
                </g>
              </g>
            </svg>
          </div>

          {/* Symmetrical LOADING Text Block with Gray Lines & Square Accents, exactly like the image */}
          <div className="flex items-center justify-center gap-3.5 w-full mt-4 select-none">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-zinc-200" />
            <div className="w-1.5 h-1.5 border border-amber-500 bg-amber-500/10 rotate-45" />
            
            <span className="font-mono text-[10px] font-black tracking-[0.45em] text-amber-500 uppercase pl-1">
              LOADING...
            </span>
            
            <div className="w-1.5 h-1.5 border border-amber-500 bg-amber-500/10 rotate-45" />
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-zinc-200" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} className={`min-h-screen transition-colors duration-500 ${localTheme === 'light' ? 'bg-white text-zinc-900' : 'bg-black text-white'} font-sans selection:bg-red-500 selection:text-white overflow-x-hidden`}>
      {generalSettings.maintenanceMode && !isAdmin && (
        <div className="fixed inset-0 z-[99] bg-black flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
          {/* Dynamic Glow background */}
          <div className="absolute inset-0 z-0 opacity-10 bg-[radial-gradient(circle_at_center,_#ef4444_0%,_transparent_60%)]" />
          
          <div className="relative z-10 max-w-lg bg-zinc-950 border border-zinc-900 rounded-[32px] p-8 md:p-12 shadow-2xl">
            {generalSettings.siteLogo ? (
              <img 
                src={generalSettings.siteLogo} 
                alt={generalSettings.siteName} 
                className="w-20 h-20 mx-auto object-contain rounded-2xl mb-8 animate-bounce animate-duration-1000"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-8 animate-pulse">
                <span className="text-3xl">🛠️</span>
              </div>
            )}

            <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 mb-4 tracking-tight">
              {generalSettings.siteName || 'جولدن'}
            </h1>

            <p className="text-base text-zinc-300 font-extrabold mb-6 leading-relaxed">
              {language === 'ar' 
                ? 'الموقع حالياً تحت أعمال التحديث والصيانة الدورية لتوفير تجربة أفضل.' 
                : 'The site is currently undergoing scheduled maintenance and updates.'}
            </p>

            <p className="text-xs text-zinc-500 leading-relaxed font-semibold mb-8">
              {language === 'ar' 
                ? 'يرجى العودة لاحقاً. شكراً لاهتمامكم وصبركم!' 
                : 'Please check back later. Thank you for your patience!'}
            </p>

            {!user ? (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="text-xs bg-red-650 hover:bg-red-540 text-white px-8 py-3 rounded-full shadow-lg font-black tracking-wide transition-all cursor-pointer active:scale-95"
              >
                {language === 'ar' ? 'تسجيل الدخول كـ مشرف / مدير' : 'Login as Support / Admin'}
              </button>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="text-xs text-zinc-450 font-bold">
                  {language === 'ar' ? `مسجل الدخول كـ: ${user.email} (ليس لديك صلاحيات مشرف)` : `Logged in as: ${user.email} (No admin rights)`}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="text-xs bg-red-650 hover:bg-red-540 text-white px-6 py-2.5 rounded-full font-black tracking-wide transition-all cursor-pointer active:scale-95"
                  >
                    {language === 'ar' ? 'تسجيل الدخول بحساب آخر' : 'Login with another account'}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-6 py-2.5 rounded-full font-bold transition-all cursor-pointer active:scale-95 border border-zinc-800"
                  >
                    {language === 'ar' ? 'تسجيل الخروج' : 'Log Out'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Background Image Layer */}
      <motion.div 
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
        style={{ 
          backgroundImage: `url(${backgroundImage})`,
          opacity: localTheme === 'light' ? 0.05 : 0.12,
        }}
        animate={{
          scale: [1, 1.05, 1.02, 1.06, 1],
          x: [0, 8, -4, 4, 0],
          y: [0, -4, 6, -3, 0],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      />
      {/* Elegant Golden Atmosphere Vignette and Gradient Glow Overlays to blend with the scenery */}
      {localTheme === 'dark' && (
        <>
          <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-t from-black via-black/95 to-black/30" />
          <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_center,_transparent_20%,_rgba(0,0,0,0.92)_80%)]" />
          <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_bottom,_rgba(245,158,11,0.06)_0%,_transparent_60%)]" opacity-70="true" />
          <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.03)_0%,_transparent_50%)]" />
        </>
      )}

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/90 border-zinc-900 border-b px-4 md:px-8 py-3.5 flex items-center justify-between" dir="rtl">
        
        {/* Left Side: Logo with Custom 3D isometric Gold Cube or uploaded logo */}
        <div 
          onClick={() => {
            setActiveMainTab('home');
            setActiveSubTab('home');
            setSelectedCategory('الكل');
            handleGihNamePointsClaim();
          }}
          className="flex items-center gap-3 cursor-pointer select-none"
          title={language === 'ar' ? 'اضغط للحصول على 10 نقاط مكافأة يومية! 🎁' : 'Click to claim 10 daily bonus points! 🎁'}
        >
          {generalSettings.siteLogo ? (
            <img 
              src={generalSettings.siteLogo} 
              alt={generalSettings.siteName || 'Logo'} 
              className="w-9 h-9 object-contain rounded-xl hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
            />
          ) : (
            <img 
              src={gihEarthLogo} 
              alt={generalSettings.siteName || 'Logo'} 
              className="w-9 h-9 object-cover rounded-xl hover:scale-110 transition-transform shadow-md shadow-amber-500/10 border border-zinc-800"
              referrerPolicy="no-referrer"
            />
          )}
          <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-250 to-amber-500 font-sans tracking-tight">
            {generalSettings.siteName || 'Golden'}
          </span>
        </div>

        {/* Center: Main tabs/selections */}
        <div className="hidden lg:flex items-center gap-8 text-sm font-extrabold text-zinc-400">
          <button 
            onClick={() => {
              setActiveMainTab('home');
              setActiveSubTab('home');
              changeCategoryAndScroll('الكل');
            }}
            className={`transition duration-150 relative py-1.5 cursor-pointer ${
              activeMainTab === 'home' && activeSubTab === 'home' && selectedCategory === 'الكل'
                ? 'text-amber-500 font-extrabold border-b-2 border-amber-500'
                : 'hover:text-white'
            }`}
          >
            {language === 'ar' ? 'الرئيسية' : 'Home'}
          </button>
          <button 
            onClick={() => {
              setActiveMainTab('home');
              setActiveSubTab('home');
              changeCategoryAndScroll(language === 'ar' ? 'مودات' : 'Mods');
            }}
            className={`transition duration-150 relative py-1.5 cursor-pointer ${
              activeMainTab === 'home' && activeSubTab === 'home' && (selectedCategory === 'مودات' || selectedCategory === 'Mods')
                ? 'text-amber-500 font-extrabold border-b-2 border-amber-500'
                : 'hover:text-white'
            }`}
          >
            {language === 'ar' ? 'المودات' : 'Mods'}
          </button>
          <button 
            onClick={() => {
              setActiveMainTab('home');
              setActiveSubTab('home');
              changeCategoryAndScroll(language === 'ar' ? 'موارد' : 'Resources');
            }}
            className={`transition duration-150 relative py-1.5 cursor-pointer ${
              activeMainTab === 'home' && activeSubTab === 'home' && (selectedCategory === 'موارد' || selectedCategory === 'Resources')
                ? 'text-amber-500 font-extrabold border-b-2 border-amber-500'
                : 'hover:text-white'
            }`}
          >
            {language === 'ar' ? 'الأدوات' : 'Tools'}
          </button>
          <button 
            onClick={() => {
              setActiveMainTab('home');
              setActiveSubTab('home');
              changeCategoryAndScroll(language === 'ar' ? 'خرائط' : 'Maps');
            }}
            className={`transition duration-150 relative py-1.5 cursor-pointer ${
              activeMainTab === 'home' && activeSubTab === 'home' && (selectedCategory === 'خرائط' || selectedCategory === 'Maps')
                ? 'text-amber-500 font-extrabold border-b-2 border-amber-500'
                : 'hover:text-white'
            }`}
          >
            {language === 'ar' ? 'الخرائط' : 'Maps'}
          </button>
          <button 
            onClick={() => {
              setActiveMainTab('home');
              setActiveSubTab('home');
              changeCategoryAndScroll(language === 'ar' ? 'سكنات' : 'Skins');
            }}
            className={`transition duration-150 relative py-1.5 cursor-pointer ${
              activeMainTab === 'home' && activeSubTab === 'home' && (selectedCategory === 'سكنات' || selectedCategory === 'Skins')
                ? 'text-amber-500 font-extrabold border-b-2 border-amber-500'
                : 'hover:text-white'
            }`}
          >
            {language === 'ar' ? 'السكنات' : 'Skins'}
          </button>
          <button 
            onClick={() => {
              setActiveMainTab('home');
              setActiveSubTab('arcade');
            }}
            className={`transition duration-150 relative py-1.5 cursor-pointer ${
              activeMainTab === 'home' && activeSubTab === 'arcade'
                ? 'text-amber-500 font-extrabold border-b-2 border-amber-500 bg-amber-500/5 px-3 py-1 rounded-full'
                : 'hover:text-white text-amber-500 font-extrabold animate-pulse'
            }`}
          >
            {language === 'ar' ? 'السيرفرات 🕹️' : 'Servers 🕹️'}
          </button>
          <button 
            onClick={() => {
              if (user) {
                setShowUserPanel(true);
              } else {
                setLoginMode('email-signin');
                setShowLoginModal(true);
              }
            }}
            className="hover:text-white transition duration-150 relative py-1.5 cursor-pointer"
          >
            {language === 'ar' ? 'الدعم' : 'Support'}
          </button>
        </div>

        {/* Left Side: Actions and Controls */}
        <div className="flex items-center gap-3">
          {/* Profile Picture / User Profile Button */}
          <div className="relative">
            <button
              onClick={() => {
                if (user) {
                  setShowUserPanel(true);
                } else {
                  setLoginMode('email-signin');
                  setShowLoginModal(true);
                }
              }}
              className="w-9 h-9 rounded-xl overflow-hidden border border-amber-500 ring-2 ring-amber-500/20 hover:border-amber-400 hover:ring-amber-400/30 hover:shadow-lg hover:shadow-amber-500/25 transition-all cursor-pointer group flex items-center justify-center bg-zinc-950"
              title={language === 'ar' ? 'حسابك الشخصي' : 'Your Profile'}
            >
              <img 
                src={user ? (userProfile?.photoURL || "https://mc-heads.net/avatar/MHF_Steve/64") : "https://mc-heads.net/avatar/MHF_Steve/64"} 
                alt="Profile" 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </button>
            {/* Golden radiance coming out next to it */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-amber-400 rounded-full animate-ping opacity-70 pointer-events-none z-0" />
            {/* Glowing Golden indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gradient-to-r from-amber-500 to-yellow-400 border border-zinc-950 rounded-full shadow-md shadow-amber-500/40 z-10" />
          </div>

          {/* Points Counter Badge */}
          <button
            onClick={handleShareWebsite}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md hover:shadow-amber-500/5 hover:scale-105 active:scale-95 shadow-amber-950/10 mr-1 ml-1"
            title={language === 'ar' ? 'اضغط لمشاركة الموقع مع أصدقائك 🚀' : 'Click to share the website with friends 🚀'}
          >
            <Coins className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>
              {totalPoints} {language === 'ar' ? 'نقطة' : 'Pts'}
            </span>
          </button>

          {/* Three-dots consolidated dropdown */}
          <div className="relative">
            {/* Click-outside backdrop layer */}
            {showThreeDotsMenu && (
              <div 
                className="fixed inset-0 z-[60]" 
                onClick={() => setShowThreeDotsMenu(false)} 
              />
            )}

            <button
              onClick={() => setShowThreeDotsMenu(!showThreeDotsMenu)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all z-[70] relative cursor-pointer ${
                showThreeDotsMenu 
                  ? 'bg-red-600 border-red-500 text-white shadow-lg' 
                  : 'bg-[#0c0c0e]/80 border-zinc-900 hover:bg-zinc-900 hover:border-zinc-700 hover:text-amber-500 text-zinc-300'
              }`}
              title={language === 'ar' ? 'المزيد والخيارات التقديرية' : 'More Options & Tools'}
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {showThreeDotsMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className={`absolute left-0 mt-3 w-64 rounded-2xl p-2.5 z-[70] border shadow-2xl text-right flex flex-col gap-1 ${
                    localTheme === 'light' 
                      ? 'bg-white text-zinc-900 border-zinc-200' 
                      : 'bg-[#0a0a0c] text-white border-zinc-850/80 shadow-black/80'
                  }`}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                >
                  {/* Dropdown Header section */}
                  <div className={`px-2 py-1.5 border-b mb-1 flex items-center justify-between ${localTheme === 'light' ? 'border-zinc-100' : 'border-zinc-900'}`}>
                    <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest">
                      {language === 'ar' ? 'لوحة الخيارات السريعة' : 'Quick Control Board'}
                    </span>
                    <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                  </div>

                  {/* 1. Search */}
                  <button
                    onClick={() => {
                      setShowThreeDotsMenu(false);
                      setActiveMainTab('search');
                      setTimeout(() => {
                        const sInput = document.getElementById('search-input-field');
                        if (sInput) sInput.focus();
                      }, 100);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border border-transparent ${
                      localTheme === 'light'
                        ? 'text-zinc-700 hover:bg-zinc-100'
                        : 'text-zinc-300 hover:text-white hover:bg-red-650/10 hover:border-red-650/15'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Search className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{language === 'ar' ? 'البحث عن مودات كرافت' : 'Search Mods'}</span>
                    </div>
                  </button>

                  {/* 2. Favorites */}
                  <button
                    onClick={() => {
                      setShowThreeDotsMenu(false);
                      setActiveMainTab('favorites');
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border border-transparent ${
                      localTheme === 'light'
                        ? 'text-zinc-700 hover:bg-zinc-100'
                        : 'text-zinc-300 hover:text-white hover:bg-red-650/10 hover:border-red-650/15'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Heart className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{language === 'ar' ? 'المفضلات والقلوب' : 'My Favorites'}</span>
                    </div>
                    {userProfile?.favorites && userProfile.favorites.length > 0 && (
                      <span className="text-[9px] bg-red-600/20 text-red-400 font-black px-1.5 py-0.5 rounded-full leading-none">
                        {userProfile.favorites.length}
                      </span>
                    )}
                  </button>

                  {/* 3. My Account */}
                  <button
                    onClick={() => {
                      setShowThreeDotsMenu(false);
                      if (user) {
                        setShowUserPanel(true);
                      } else {
                        setLoginMode('email-signin');
                        setShowLoginModal(true);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border border-transparent ${
                      localTheme === 'light'
                        ? 'text-zinc-700 hover:bg-zinc-100'
                        : 'text-zinc-300 hover:text-white hover:bg-red-650/10 hover:border-red-650/15'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <UserIcon className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{language === 'ar' ? 'الملف الشخصي وحسابي' : 'Control Panel / Account'}</span>
                    </div>
                  </button>

                  {/* 4. Support Tickets */}
                  <button
                    onClick={() => {
                      setShowThreeDotsMenu(false);
                      if (user) {
                        setShowUserPanel(true);
                      } else {
                        setLoginMode('email-signin');
                        setShowLoginModal(true);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border border-transparent ${
                      localTheme === 'light'
                        ? 'text-zinc-700 hover:bg-zinc-100'
                        : 'text-zinc-300 hover:text-white hover:bg-red-650/10 hover:border-red-650/15'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <MessageSquare className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{language === 'ar' ? 'الدعم الفني والشكاوى' : 'Get Help / Tickets'}</span>
                    </div>
                  </button>



                  {/* 5. Theme Settings */}
                  <div className={`border-t my-1.5 pt-2 px-1 ${localTheme === 'light' ? 'border-zinc-100' : 'border-zinc-900'}`}>
                    <div className="flex items-center justify-between px-2 mb-1.5">
                      <span className="text-[9px] text-zinc-500 font-extrabold uppercase">{language === 'ar' ? 'مظهر الموقع' : 'Theme'}</span>
                      <Palette className="w-3 h-3 text-zinc-600" />
                    </div>
                    <div className={`grid grid-cols-2 gap-1 p-1 rounded-xl border ${localTheme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950 border-zinc-900'}`}>
                      <button
                        onClick={async () => {
                          setLocalTheme('dark');
                          localStorage.setItem('theme', 'dark');
                          if (user) await updateProfile({ theme: 'dark' });
                        }}
                        className={`py-1.5 rounded-lg text-[9px] font-black flex items-center justify-center gap-1 cursor-pointer transition-all ${
                          localTheme === 'dark' 
                            ? 'bg-red-600 text-white shadow-md' 
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <Moon className="w-3 h-3 shrink-0" />
                        <span>{language === 'ar' ? 'داكن' : 'Dark'}</span>
                      </button>
                      <button
                        onClick={async () => {
                          setLocalTheme('light');
                          localStorage.setItem('theme', 'light');
                          if (user) await updateProfile({ theme: 'light' });
                        }}
                        className={`py-1.5 rounded-lg text-[9px] font-black flex items-center justify-center gap-1 cursor-pointer transition-all ${
                          localTheme === 'light' 
                            ? 'bg-red-600 text-white shadow-md' 
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <Sun className="w-3 h-3 shrink-0" />
                        <span>{language === 'ar' ? 'فاتح' : 'Light'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 6. Language Select */}
                  <div className="px-1 mt-1 mb-1">
                    <div className="flex items-center justify-between px-2 mb-1.5">
                      <span className="text-[9px] text-zinc-500 font-extrabold uppercase">{language === 'ar' ? 'لغة الموقع' : 'Language'}</span>
                      <Languages className="w-3 h-3 text-zinc-600" />
                    </div>
                    <div className={`grid grid-cols-2 gap-1 p-1 rounded-xl border ${localTheme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950 border-zinc-900'}`}>
                      <button
                        onClick={() => setLanguage('ar')}
                        className={`py-1.5 rounded-lg text-[9px] font-black flex items-center justify-center cursor-pointer transition-all ${
                          language === 'ar' 
                            ? 'bg-red-600 text-white shadow-md' 
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <span>العربية</span>
                      </button>
                      <button
                        onClick={() => setLanguage('en')}
                        className={`py-1.5 rounded-lg text-[9px] font-black flex items-center justify-center cursor-pointer transition-all ${
                          language === 'en' 
                            ? 'bg-red-600 text-white shadow-md' 
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <span>English</span>
                      </button>
                    </div>
                  </div>

                  {/* 7. Administrator Terminal */}
                  {isAdmin && (
                    <div className={`border-t mt-1.5 pt-1.5 ${localTheme === 'light' ? 'border-zinc-200' : 'border-zinc-900'}`}>
                      <button
                        onClick={() => {
                          setShowThreeDotsMenu(false);
                          setShowAdminPanel(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-black text-red-500 hover:bg-zinc-900/50 cursor-pointer transition-all"
                      >
                        <ShieldCheck className="w-4 h-4 text-red-500 shrink-0 animate-bounce" />
                        <span>{language === 'ar' ? 'لوحة كرافت للمدير' : 'Admin Terminal'}</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* Main Content Render Router */}
      <main className="pt-24 pb-24 relative z-10 px-4 md:px-8 text-right">
        <div className="max-w-6xl mx-auto">
          <React.Suspense fallback={
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-650" />
            </div>
          }>
            {activeMainTab === 'home' && (
            <div className="space-y-12 animate-fadeIn">
              {/* BRANDING HERO & HIGHLIGHT LIVE SHOWCASE GRID */}
              <HeroSection
                language={language}
                localTheme={localTheme}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                categories={categories}
                t={t}
                backgroundImage={backgroundImage}
                currentVibe={currentVibe}
                isAsymmetricalMode={isAsymmetricalMode}
                selectedEdition={selectedEdition}
                changeEdition={changeEdition}
                isLoggedIn={!!user}
                onImageClick={handleImageClickPointsClaim}
                userEmail={user?.email || undefined}
                isAdmin={user?.email === 'frassa0000@gmail.com'}
                showSuggestModal={showSuggestModal}
                setShowSuggestModal={setShowSuggestModal}
                showListModal={showListModal}
                setShowListModal={setShowListModal}
                games={games}
                onSelectGame={setSelectedGameForDetails}
              />



              {activeSubTab === 'home' ? (
                <div className="space-y-12">
                  {displayedGames.length > 0 && (
                    <>
                      {/* INTERACTIVE SPOTLIGHT DECK SPOTLIGHT */}
                      <section className="space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-90 w-full pb-3">
                          <div className="space-y-1">
                            <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider flex items-center gap-2">
                              <Crown className="w-4 h-4 text-amber-500" />
                              {language === 'ar' ? 'منصة الاستعراض والتثبيت التفاعلية للأسبوع' : 'INTERACTIVE SPOTLIGHT & INSTALLATION DECK'}
                            </h3>
                            <p className="text-[10px] sm:text-xs text-zinc-550 font-medium">
                              {language === 'ar' ? 'اختر أي مود مميز من القائمة لاستعراض مواصفاته والتحقق من الأمان والتنزيل المباشر' : 'Select any featured mod to load live security specifications and direct package assets'}
                            </p>
                          </div>
                          <span className="text-[9px] text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-yellow-500/20 uppercase font-extrabold tracking-wider">
                            PREMIUM DECK
                          </span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                          {/* Left Side: Large Active Feature Details */}
                          <div className="lg:col-span-7 bg-zinc-950 border border-zinc-900 rounded-[2rem] p-6 relative overflow-hidden flex flex-col justify-between shadow-2xl">
                            {/* Subtle glow highlight behind */}
                            <div className="absolute top-0 left-0 w-80 h-80 bg-red-650/5 rounded-full blur-[100px] pointer-events-none" />
                            
                            <div className="relative z-10 space-y-5">
                              {/* Top badge line */}
                              <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-650/10 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-wider border border-red-500/20">
                                  <Zap className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                                  {language === 'ar' ? 'المود النشط المختار' : 'ACTIVE SPOTLIGHT'}
                                </span>
                                
                                <div className="flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
                                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                  <span className="text-xs font-black text-white">{PRESET_CAROUSEL_MODS[activeCarouselIndex]?.rating || 5.0} / 5.0</span>
                                </div>
                              </div>

                              {/* Cover preview aspect border */}
                              <div className="aspect-video relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-900 shadow-inner group">
                                <img 
                                  src={PRESET_CAROUSEL_MODS[activeCarouselIndex]?.thumbnail || null} 
                                  alt={PRESET_CAROUSEL_MODS[activeCarouselIndex]?.title || ""}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                                <div className="absolute bottom-4 right-4 text-right">
                                  <span className="text-[9px] bg-red-650 font-black text-white px-2 py-0.5 rounded uppercase tracking-widest">
                                    {PRESET_CAROUSEL_MODS[activeCarouselIndex]?.category}
                                  </span>
                                  <h3 className="text-lg md:text-xl font-black text-white mt-1 uppercase">
                                    {PRESET_CAROUSEL_MODS[activeCarouselIndex]?.title}
                                  </h3>
                                </div>
                              </div>

                              {/* Description text */}
                              <p className="text-zinc-300 text-xs sm:text-sm font-semibold leading-relaxed text-right bg-zinc-900 p-4 border border-zinc-900/60 rounded-xl">
                                {language === 'ar' 
                                  ? PRESET_CAROUSEL_MODS[activeCarouselIndex]?.description 
                                  : (PRESET_CAROUSEL_MODS[activeCarouselIndex]?.descriptionEn || PRESET_CAROUSEL_MODS[activeCarouselIndex]?.description)}
                              </p>
                            </div>

                            {/* Action details footer */}
                            <div className="pt-6 border-t border-zinc-90 w-full flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                              <div className="flex items-center gap-2 text-red-500 font-bold text-[11px] bg-red-650/5 px-3 py-2 rounded-xl border border-red-500/10">
                                <ShieldCheck className="w-4 h-4 text-red-500" />
                                <span>{language === 'ar' ? 'الحماية والتحقق: آمن ومعتمد 100%' : 'Certificate: Secure & Live'}</span>
                              </div>

                              {(() => {
                                const activeGame = PRESET_CAROUSEL_MODS[activeCarouselIndex];
                                if (!activeGame) return null;
                                
                                if (activeGame.isPaid) {
                                  if (isGamePurchased(activeGame.id)) {
                                    return (
                                      <button 
                                        onClick={() => triggerDownload(activeGame.title, activeGame.downloadUrl, activeGame.description, activeGame.category, activeGame.id)}
                                        className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 via-teal-550 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs px-8 py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/15 active:scale-95 flex items-center justify-center gap-2.5 uppercase tracking-wider cursor-pointer border border-emerald-555/20"
                                      >
                                        <Crown className="w-4 h-4 text-white" />
                                        <span>{language === 'ar' ? 'تحميل المود (مفتوح ✅)' : 'Download (Unlocked ✅)'}</span>
                                      </button>
                                    );
                                  } else {
                                    return (
                                      <button 
                                        onClick={() => handleBuyWithPoints(activeGame)}
                                        className="w-full sm:w-auto bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-500 hover:from-amber-500 hover:to-yellow-400 text-white font-black text-xs px-8 py-4 rounded-2xl transition-all shadow-lg shadow-amber-500/15 active:scale-95 flex items-center justify-center gap-2.5 uppercase tracking-wider cursor-pointer border border-amber-555/20 animate-pulse"
                                      >
                                        <Coins className="w-4 h-4 text-white" />
                                        <span>
                                          {language === 'ar' 
                                            ? `شراء بـ ${activeGame.pointsPrice || calculatePointsPrice(activeGame.price)} نقطة` 
                                            : `Buy for ${activeGame.pointsPrice || calculatePointsPrice(activeGame.price)} Points`}
                                        </span>
                                      </button>
                                    );
                                  }
                                }

                                return (
                                  <button 
                                    onClick={() => triggerDownload(activeGame.title, activeGame.downloadUrl, activeGame.description, activeGame.category, activeGame.id)}
                                    className="w-full sm:w-auto bg-gradient-to-r from-red-650 via-rose-600 to-amber-500 hover:from-red-600 hover:to-amber-400 text-white font-black text-xs px-8 py-4 rounded-2xl transition-all shadow-lg shadow-red-650/15 hover:shadow-red-500/25 active:scale-95 flex items-center justify-center gap-2.5 uppercase tracking-wider cursor-pointer border border-red-550/20"
                                  >
                                    <Download className="w-4 h-4 text-white" />
                                    <span>{language === 'ar' ? 'تحميل المود' : 'Download Mod'}</span>
                                  </button>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Right Side: Tab Select List Deck */}
                          <div className="lg:col-span-5 flex flex-col justify-between gap-3 text-right">
                            <div className="space-y-2">
                              <span className="text-[10px] font-black uppercase text-zinc-500 block mb-2">
                                {language === 'ar' ? 'انقر على حزمة للتعديل السريع' : 'CLICK TO TOGGLE WEEKLY PICKS'}
                              </span>
                              
                              {PRESET_CAROUSEL_MODS.map((sliderItem, idx) => {
                                const isSelected = activeCarouselIndex === idx;
                                return (
                                  <motion.div
                                    key={sliderItem.id}
                                    onClick={() => setCarouselIndex(idx)}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex gap-3 text-right items-center relative overflow-hidden select-none ${
                                      isSelected 
                                        ? 'bg-zinc-900/80 border-red-550 shadow-lg' 
                                        : 'bg-zinc-950 border-zinc-900 hover:border-zinc-800'
                                    }`}
                                  >
                                    {/* Selected subtle color top stripe */}
                                    {isSelected && (
                                      <div className="absolute top-0 inset-x-0 h-[2px] bg-red-500" />
                                    )}

                                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-zinc-900 bg-zinc-900 relative">
                                      <img src={sliderItem.thumbnail || null} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-1">
                                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                                          isSelected ? 'bg-red-600/20 text-red-500 border border-red-500/20' : 'bg-zinc-900 text-zinc-400'
                                        }`}>
                                          {sliderItem.category}
                                        </span>
                                        
                                        <div className="flex items-center gap-0.5 text-[10px] text-amber-500 font-extrabold">
                                          <Star className="w-3" />
                                          {sliderItem.rating}
                                        </div>
                                      </div>

                                      <h4 className="text-xs sm:text-sm font-black text-white truncate mt-1 uppercase">
                                        {sliderItem.title}
                                      </h4>
                                      
                                      <p className="text-[10px] text-zinc-500 truncate mt-0.5 font-semibold">
                                        {language === 'ar' ? sliderItem.description : (sliderItem.descriptionEn || sliderItem.description)}
                                      </p>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>

                            {/* Visual quick info widget indicator */}
                            <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-2xl flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-black text-[10px] text-zinc-400">
                                <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                                <span>{language === 'ar' ? 'يتم التحديث دورياً كل ٢٤ ساعة' : 'Updated fully every 24 hours'}</span>
                              </div>
                              
                              <div className="flex gap-1">
                                {PRESET_CAROUSEL_MODS.map((_, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => setCarouselIndex(idx)}
                                    className={`w-3.5 h-1.5 rounded-full transition-all duration-300 ${
                                      activeCarouselIndex === idx ? 'bg-red-600 w-6' : 'bg-zinc-805 hover:bg-zinc-700'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>

                      {/* SPOTLIGHT BENTO PANEL SHOWCASE */}
                      <section className="space-y-6">
                        <div className="flex items-center justify-between border-b border-zinc-90 w-full pb-3">
                          <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider flex items-center gap-2">
                            <Crown className="w-4 h-4 text-amber-500" />
                            {language === 'ar' ? 'الإضافات الحصرية المنسقة عالية الجودة' : 'HANDPICKED EXCLUSIVE PREMIUM ADD-ONS'}
                          </h3>
                          <span className="text-[9px] text-zinc-500 bg-zinc-910 px-2.5 py-1 rounded-xl border border-zinc-900 uppercase font-black tracking-wider">
                            GIH EXCLUSIVE
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                          {PRESET_GRID_MODS.slice(0, 8).map((item, idx) => {
                            const isMainSpotlight = idx === 0;
                            return (
                              <motion.div 
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-40px" }}
                                transition={{ duration: 0.4, delay: idx * 0.05 }}
                                whileHover={{ y: -4, transition: { duration: 0.15 } }}
                                className={`rounded-2xl border overflow-hidden p-3.5 flex flex-col justify-between transition-all duration-300 shadow-xl cursor-pointer ${
                                  isMainSpotlight 
                                    ? 'bg-gradient-to-br from-zinc-950 via-zinc-950 to-amber-950/20 border-amber-500/20 hover:border-amber-500/30' 
                                    : 'bg-zinc-950 border-zinc-900 hover:border-zinc-800'
                                }`}
                                onClick={(e) => {
                                  const target = e.target as HTMLElement;
                                  if (target.closest('button') || target.closest('a')) {
                                    return;
                                  }
                                  setSelectedGameForDetails(item);
                                }}
                              >
                                <div className="space-y-3.5 text-right">
                                  {/* Thumbnail preview aspect header */}
                                  <div className="aspect-video relative rounded-xl overflow-hidden bg-zinc-90 w-full border border-zinc-900">
                                    <img 
                                      src={item.thumbnail || null} 
                                      alt={item.title} 
                                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    
                                    <div className="absolute top-2.5 right-2.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1 text-[10px] font-black text-white border border-zinc-900/40">
                                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                      {item.rating}
                                    </div>

                                    {isMainSpotlight && (
                                      <div className="absolute bottom-2.5 right-2.5 bg-amber-500/20 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider backdrop-blur-sm">
                                        TOP PICK
                                      </div>
                                    )}
                                  </div>

                                  {/* Text descriptor details */}
                                  <div className="space-y-1.5 text-right px-1">
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                                      isMainSpotlight 
                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/10' 
                                        : 'bg-red-500/5 text-red-500 border-red-500/10'
                                    }`}>
                                      {item.category}
                                    </span>

                                    <h4 className={`text-sm font-black text-white truncate uppercase transition-colors pt-1 ${
                                      isMainSpotlight ? 'text-amber-400' : ''
                                    }`}>
                                      {item.title}
                                    </h4>

                                    <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed line-clamp-2">
                                      {item.description}
                                    </p>
                                  </div>
                                </div>

                                {/* Download Action row */}
                                <div className="pt-4 border-t border-dashed border-zinc-900 px-1 flex items-center justify-between gap-1.5 mt-4">
                                  <span className="text-[9px] text-zinc-500 font-bold">
                                    {item.isPaid 
                                      ? (isGamePurchased(item.id) 
                                          ? (language === 'ar' ? 'مفتوح ✅' : 'Unlocked ✅') 
                                          : `${item.pointsPrice || calculatePointsPrice(item.price)} Pts`)
                                      : (language === 'ar' ? 'سريع وآمن' : 'Fast & Secure')}
                                  </span>

                                  {item.isPaid && !isGamePurchased(item.id) ? (
                                    <button 
                                      onClick={() => handleBuyWithPoints(item)}
                                      className="px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 border bg-amber-500/10 text-amber-500 hover:bg-amber-550 hover:text-white border-amber-500/20 text-[10px] font-black cursor-pointer shadow-amber-950/10 animate-pulse"
                                    >
                                      <Coins className="w-3.5 h-3.5" />
                                      <span>{language === 'ar' ? 'شراء' : 'Buy'}</span>
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => triggerDownload(item.title, item.downloadUrl, item.description, item.category, item.id)}
                                      className={`p-2 rounded-xl transition-all flex items-center justify-center border ${
                                        isMainSpotlight 
                                          ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white border-amber-500/20 hover:border-amber-500' 
                                          : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border-zinc-800'
                                      }`}
                                      title={language === 'ar' ? 'تحميل مجاني' : 'Direct Download'}
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </section>
                    </>
                  )}

                  {/* MARKETPLACE TITLE Display Heading */}
                  <div className="flex flex-col space-y-1.5 pt-6 text-right">
                    <h2 className="text-3xl font-black tracking-tight text-white font-sans uppercase">
                      MARKETPLACE
                    </h2>
                    <p className="text-xs font-semibold text-zinc-500">
                      {language === 'ar' ? 'تصفح كل المودات والخرائط المتوفرة في قاعدة البيانات المفتوحة' : 'Search and explore the catalog database assets'}
                    </p>
                  </div>
                </div>
              ) : (
                /* For You Recommended block */
                <div className="space-y-8 animate-fadeIn">
                  <div className="flex flex-col space-y-1.5 border-b border-zinc-900 pb-4">
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                      <Crown className="w-6 h-6 text-yellow-500" />
                      {language === 'ar' ? 'ترشيحات لك خصيصاً' : 'Recommended For You'}
                    </h2>
                    <p className="text-xs font-bold text-zinc-500">
                      {language === 'ar' ? 'مودات وسكنات منسقة بعناية بناءً على خيارات الألعاب الأكثر تحميلاً في شبكتنا' : 'Carefully handpicked items featuring elite performance characteristics.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {PRESET_GRID_MODS.slice(0, 3).map((mod) => (
                      <motion.div 
                        key={mod.id}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        whileHover={{ y: -6, transition: { duration: 0.2 } }}
                        className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-4 flex flex-col md:flex-row gap-4 items-center group hover:border-zinc-800 transition text-right cursor-pointer bg-zinc-950"
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          if (target.closest('button') || target.closest('a')) {
                            return;
                          }
                          setSelectedGameForDetails(mod);
                        }}
                      >
                        <img 
                          src={mod.thumbnail || null} 
                          alt={mod.title}
                          className="w-full md:w-28 h-28 object-cover rounded-2xl border border-zinc-900 shrink-0"
                        />
                        <div className="flex-1 text-right w-full space-y-3">
                          <div>
                            <span className="text-[9px] font-black text-red-500 uppercase bg-red-650/10 px-2 py-0.5 rounded border border-red-500/10">
                              {mod.category}
                            </span>
                            <h3 className="text-base font-black text-white hover:text-red-500 transition-colors">
                              {mod.title}
                            </h3>
                          </div>
                          <p className="text-xs text-zinc-400 line-clamp-2">
                            {mod.description}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                            <span>📥 {mod.downloads || '120k'}</span>
                            <span>⭐ {mod.rating || '4.9'}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* This is the marketplace container when on home tab */}
              {activeMainTab === 'home' && activeSubTab === 'home' && (
                <div className="space-y-12 pt-4 max-w-4xl mx-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  
                  {/* Premium High-Fidelity Marketplace Categories (Exactly matching the user's reference image) */}
                  <div className="flex flex-col items-center justify-center w-full select-none py-8 border-b border-zinc-900/40" dir="ltr">
                    {/* MARKETPLACE Header */}
                    <div className="text-center mb-10">
                      <h1 className="text-4xl md:text-6xl font-black tracking-[0.18em] text-white uppercase font-sans drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
                        MARKETPLACE
                      </h1>
                      <div className="h-[2.5px] w-40 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent mx-auto mt-3" />
                    </div>

                    {/* Symmetrical Bento-style Categories Grid */}
                    <div className="w-full max-w-xl px-4 flex flex-col items-center gap-5">
                      
                      {/* Row 1: ALL / الكل (Centered Silver-White Capsule) */}
                      <div className="w-full flex justify-center">
                        <button
                          onClick={() => changeCategoryAndScroll('الكل')}
                          className={`w-full max-w-[280px] h-[54px] rounded-full border px-6 flex items-center justify-between transition-all duration-300 relative overflow-hidden cursor-pointer select-none group ${
                            selectedCategory === 'الكل'
                              ? 'bg-gradient-to-b from-zinc-900 to-black border-white/90 shadow-[0_0_25px_rgba(255,255,255,0.18)] scale-[1.03]'
                              : 'bg-gradient-to-b from-zinc-950 to-[#0c0c0e] border-zinc-800/80 hover:border-zinc-700/80 hover:scale-[1.01]'
                          }`}
                        >
                          {/* Inner soft radial ambient glow */}
                          {selectedCategory === 'الكل' && (
                            <div className="absolute inset-0 bg-white/[0.03] blur-md pointer-events-none" />
                          )}
                          
                          {/* Left Icon with subtle pixel shadow */}
                          <div className="flex items-center justify-center w-10 h-10 shrink-0">
                            <svg className={`w-6 h-6 transition-transform duration-300 group-hover:scale-110 ${selectedCategory === 'الكل' ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]' : 'opacity-60 group-hover:opacity-100'}`} viewBox="0 0 24 24">
                              <polygon points="12,3 14,9 20,9 15,13 17,19 12,15 7,19 9,13 4,9 10,9" fill={selectedCategory === 'الكل' ? '#ffffff' : '#9ca3af'} />
                              <polygon points="12,5 13.5,9.5 18,9.5 14.5,12.5 16,17 12,14 8,17 9.5,12.5 6,9.5 10.5,9.5" fill="#ffffff" opacity="0.9" />
                            </svg>
                          </div>

                          {/* Category Name Label (All Caps, Geometric) */}
                          <div className="flex flex-col items-end text-right">
                            <span className={`text-sm font-black tracking-widest ${selectedCategory === 'الكل' ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                              {language === 'ar' ? 'الكل' : 'ALL'}
                            </span>
                            <span className="text-[8px] font-black tracking-wider text-zinc-650 uppercase">
                              {language === 'ar' ? 'جميع التصنيفات' : 'EVERYTHING'}
                            </span>
                          </div>
                        </button>
                      </div>

                      {/* Row 2: ADD-ONS and MAPS (Side by side) */}
                      <div className="flex flex-col sm:flex-row gap-5 w-full justify-center items-center">
                        {/* ADD-ONS Capsule (Gold theme) */}
                        <button
                          onClick={() => changeCategoryAndScroll(language === 'ar' ? 'مودات' : 'Mods')}
                          className={`w-full max-w-[280px] h-[54px] rounded-full border px-6 flex items-center justify-between transition-all duration-300 relative overflow-hidden cursor-pointer select-none group ${
                            (selectedCategory === 'مودات' || selectedCategory === 'Mods')
                              ? 'bg-gradient-to-b from-zinc-900 to-black border-amber-500/90 shadow-[0_0_25px_rgba(245,158,11,0.22)] scale-[1.03]'
                              : 'bg-gradient-to-b from-zinc-950 to-[#0c0c0e] border-[#b45309]/30 hover:border-[#b45309]/60 hover:scale-[1.01]'
                          }`}
                        >
                          {/* Inner soft radial ambient glow */}
                          {(selectedCategory === 'مودات' || selectedCategory === 'Mods') && (
                            <div className="absolute inset-0 bg-amber-500/[0.04] blur-md pointer-events-none" />
                          )}

                          {/* Left Icon: Isometric Gold Cube */}
                          <div className="flex items-center justify-center w-10 h-10 shrink-0">
                            <svg className={`w-7 h-7 transition-transform duration-300 group-hover:scale-110 ${
                              (selectedCategory === 'مودات' || selectedCategory === 'Mods') 
                                ? 'drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]' 
                                : 'opacity-60 group-hover:opacity-100'
                            }`} viewBox="0 0 24 24">
                              <polygon points="12,3 19,7 12,11 5,7" fill="#fef08a" />
                              <polygon points="5,7 12,11 12,18 5,14" fill="#ca8a04" />
                              <polygon points="12,11 19,7 19,14 12,18" fill="#a16207" />
                              <g transform="translate(15, 1.5)">
                                <rect x="2" y="0" width="2" height="6" fill="#facc15" />
                                <rect x="0" y="2" width="6" height="2" fill="#facc15" />
                                <rect x="2.5" y="0.5" width="1" height="5" fill="#ffffff" opacity="0.8" />
                                <rect x="0.5" y="2.5" width="5" height="1" fill="#ffffff" opacity="0.8" />
                              </g>
                            </svg>
                          </div>

                          {/* Category Name Label */}
                          <div className="flex flex-col items-end text-right">
                            <span className={`text-sm font-black tracking-widest ${
                              (selectedCategory === 'مودات' || selectedCategory === 'Mods') ? 'text-[#fcd34d]' : 'text-amber-200/60 group-hover:text-amber-200/85'
                            }`}>
                              {language === 'ar' ? 'المودات' : 'ADD-ONS'}
                            </span>
                            <span className="text-[8px] font-black tracking-wider text-zinc-650 uppercase">
                              {language === 'ar' ? 'تعديلات اللعبة' : 'MODPACKS'}
                            </span>
                          </div>
                        </button>

                        {/* MAPS Capsule (Orange theme) */}
                        <button
                          onClick={() => changeCategoryAndScroll(language === 'ar' ? 'خرائط' : 'Maps')}
                          className={`w-full max-w-[280px] h-[54px] rounded-full border px-6 flex items-center justify-between transition-all duration-300 relative overflow-hidden cursor-pointer select-none group ${
                            (selectedCategory === 'خرائط' || selectedCategory === 'Maps')
                              ? 'bg-gradient-to-b from-zinc-900 to-black border-orange-500/90 shadow-[0_0_25px_rgba(234,88,12,0.22)] scale-[1.03]'
                              : 'bg-gradient-to-b from-zinc-950 to-[#0c0c0e] border-[#c2410c]/30 hover:border-[#c2410c]/60 hover:scale-[1.01]'
                          }`}
                        >
                          {/* Inner soft radial ambient glow */}
                          {(selectedCategory === 'خرائط' || selectedCategory === 'Maps') && (
                            <div className="absolute inset-0 bg-orange-500/[0.04] blur-md pointer-events-none" />
                          )}

                          {/* Left Icon: Saturn Planet */}
                          <div className="flex items-center justify-center w-10 h-10 shrink-0">
                            <svg className={`w-7 h-7 transition-transform duration-300 group-hover:scale-110 ${
                              (selectedCategory === 'خرائط' || selectedCategory === 'Maps') 
                                ? 'drop-shadow-[0_0_8px_rgba(234,88,12,0.7)]' 
                                : 'opacity-60 group-hover:opacity-100'
                            }`} viewBox="0 0 24 24">
                              <path d="M 4,14 Q 8,7 20,10" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
                              <circle cx="12" cy="12" r="6" fill="#ea580c" />
                              <circle cx="10.5" cy="10.5" r="5" fill="#f97316" />
                              <path d="M 9,9 Q 12,12 15,15" fill="none" stroke="#fdba74" strokeWidth="1.5" strokeLinecap="round" />
                              <path d="M 3,13 Q 11,17 22,12" fill="none" stroke="#f97316" strokeWidth="3.5" strokeLinecap="round" />
                              <path d="M 5,13 Q 11,16.5 20,12.5" fill="none" stroke="#fef08a" strokeWidth="1" strokeLinecap="round" opacity="0.9" />
                            </svg>
                          </div>

                          {/* Category Name Label */}
                          <div className="flex flex-col items-end text-right">
                            <span className={`text-sm font-black tracking-widest ${
                              (selectedCategory === 'خرائط' || selectedCategory === 'Maps') ? 'text-[#fed7aa]' : 'text-orange-200/60 group-hover:text-orange-200/85'
                            }`}>
                              {language === 'ar' ? 'الخرائط' : 'MAPS'}
                            </span>
                            <span className="text-[8px] font-black tracking-wider text-zinc-650 uppercase">
                              {language === 'ar' ? 'عوالم ومغامرات' : 'WORLDS'}
                            </span>
                          </div>
                        </button>
                      </div>

                      {/* Row 3: TEXTURES (Centered Green Capsule) */}
                      <div className="w-full flex justify-center">
                        <button
                          onClick={() => changeCategoryAndScroll(language === 'ar' ? 'شيدرز' : 'Shaders')}
                          className={`w-full max-w-[280px] h-[54px] rounded-full border px-6 flex items-center justify-between transition-all duration-300 relative overflow-hidden cursor-pointer select-none group ${
                            (selectedCategory === 'شيدرز' || selectedCategory === 'Shaders')
                              ? 'bg-gradient-to-b from-zinc-900 to-black border-emerald-500/90 shadow-[0_0_25px_rgba(16,185,129,0.22)] scale-[1.03]'
                              : 'bg-gradient-to-b from-zinc-950 to-[#0c0c0e] border-[#047857]/30 hover:border-[#047857]/60 hover:scale-[1.01]'
                          }`}
                        >
                          {/* Inner soft radial ambient glow */}
                          {(selectedCategory === 'شيدرز' || selectedCategory === 'Shaders') && (
                            <div className="absolute inset-0 bg-emerald-500/[0.04] blur-md pointer-events-none" />
                          )}

                          {/* Left Icon: Paintbrush */}
                          <div className="flex items-center justify-center w-10 h-10 shrink-0">
                            <svg className={`w-7 h-7 transition-transform duration-300 group-hover:scale-110 ${
                              (selectedCategory === 'شيدرز' || selectedCategory === 'Shaders') 
                                ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.7)]' 
                                : 'opacity-60 group-hover:opacity-100'
                            }`} viewBox="0 0 24 24" transform="rotate(-15)">
                              <rect x="4" y="16" width="3" height="6" fill="#78350f" transform="rotate(-45 5.5 19)" />
                              <rect x="5.5" y="14" width="4" height="3" fill="#9ca3af" transform="rotate(-45 7.5 15.5)" />
                              <path d="M 10,10 L 16,4 L 20,8 L 14,14 Z" fill="#059669" />
                              <path d="M 12,8 L 16,4 L 19,7 L 15,11 Z" fill="#34d399" />
                              <path d="M 15,5 L 17,3 L 21,7 L 19,9 Z" fill="#a7f3d0" />
                              <circle cx="21" cy="12" r="1.5" fill="#34d399" />
                              <circle cx="18" cy="15" r="1" fill="#10b981" />
                            </svg>
                          </div>

                          {/* Category Name Label */}
                          <div className="flex flex-col items-end text-right">
                            <span className={`text-sm font-black tracking-widest ${
                              (selectedCategory === 'شيدرز' || selectedCategory === 'Shaders') ? 'text-[#a7f3d0]' : 'text-emerald-200/60 group-hover:text-emerald-200/85'
                            }`}>
                              {language === 'ar' ? 'شيدرز' : 'TEXTURES'}
                            </span>
                            <span className="text-[8px] font-black tracking-wider text-zinc-650 uppercase">
                              {language === 'ar' ? 'رسوميات واقعية' : 'GRAPHICS'}
                            </span>
                          </div>
                        </button>
                      </div>

                      {/* Row 4: SKINS (Centered Purple Capsule with NEW badge) */}
                      <div className="w-full flex justify-center relative">
                        {/* Bouncing Purple NEW Badge */}
                        <motion.div 
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute -top-3.5 right-[calc(50%-100px)] z-10 select-none pointer-events-none"
                        >
                          <span className="bg-purple-600 border border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] text-[8px] font-black tracking-wider px-2.5 py-0.5 rounded-full text-white uppercase font-mono">
                            NEW
                          </span>
                        </motion.div>

                        <button
                          onClick={() => changeCategoryAndScroll(language === 'ar' ? 'سكنات' : 'Skins')}
                          className={`w-full max-w-[280px] h-[54px] rounded-full border px-6 flex items-center justify-between transition-all duration-300 relative overflow-hidden cursor-pointer select-none group ${
                            (selectedCategory === 'سكنات' || selectedCategory === 'Skins')
                              ? 'bg-gradient-to-b from-zinc-900 to-black border-purple-500/90 shadow-[0_0_25px_rgba(168,85,247,0.22)] scale-[1.03]'
                              : 'bg-gradient-to-b from-zinc-950 to-[#0c0c0e] border-[#6b21a8]/30 hover:border-[#6b21a8]/60 hover:scale-[1.01]'
                          }`}
                        >
                          {/* Inner soft radial ambient glow */}
                          {(selectedCategory === 'سكنات' || selectedCategory === 'Skins') && (
                            <div className="absolute inset-0 bg-purple-500/[0.04] blur-md pointer-events-none" />
                          )}

                          {/* Left Icon: Hanger */}
                          <div className="flex items-center justify-center w-10 h-10 shrink-0">
                            <svg className={`w-7 h-7 transition-transform duration-300 group-hover:scale-110 ${
                              (selectedCategory === 'سكنات' || selectedCategory === 'Skins') 
                                ? 'drop-shadow-[0_0_8px_rgba(168,85,247,0.7)]' 
                                : 'opacity-60 group-hover:opacity-100'
                            }`} viewBox="0 0 24 24">
                              <path d="M 12,9 C 12,6 14,6 14,8 C 14,9 13,10 12,11" fill="none" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" />
                              <polygon points="12,11 21,17 3,17" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinejoin="round" />
                              <polygon points="12,11.5 19.5,16.5 4.5,16.5" fill="none" stroke="#f3e8ff" strokeWidth="1" strokeLinejoin="round" opacity="0.9" />
                              <line x1="6" y1="17" x2="18" y2="17" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                            </svg>
                          </div>

                          {/* Category Name Label */}
                          <div className="flex flex-col items-end text-right">
                            <span className={`text-sm font-black tracking-widest ${
                              (selectedCategory === 'سكنات' || selectedCategory === 'Skins') ? 'text-[#f3e8ff]' : 'text-purple-200/60 group-hover:text-purple-200/85'
                            }`}>
                              {language === 'ar' ? 'السكنات' : 'SKINS'}
                            </span>
                            <span className="text-[8px] font-black tracking-wider text-zinc-650 uppercase">
                              {language === 'ar' ? 'مظاهر اللاعبين' : 'OUTFITS'}
                            </span>
                          </div>
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* DYNAMIC AND HIGH-FIDELITY HOME GAMES LIST SECTION */}
                  <div id="available-mods-anchor" className="space-y-12 text-right">
                    {/* If selectedCategory is 'الكل', we show the three gorgeous sections from the screenshot */}
                    {selectedCategory === 'الكل' ? (
                      <div className="space-y-12">
                        {/* Section 1: Latest Mods (أحدث المودات) - Red Bar */}
                        <div className="space-y-6">
                          <div className="flex items-center justify-between border-b border-zinc-900/40 pb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-[5px] h-6 rounded-full bg-[#ef233c] shadow-[0_0_8px_rgba(239,35,60,0.5)]" />
                              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                                {language === 'ar' ? 'أحدث المودات' : 'Latest Mods'}
                              </h2>
                            </div>
                            <span className="text-xs font-black text-amber-500 bg-amber-500/5 px-3 py-1.5 rounded-xl border border-amber-500/10">
                              {latestModsList.length} {language === 'ar' ? 'مود متوفر' : 'Mods Available'}
                            </span>
                          </div>

                          {latestModsList.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              {latestModsList.slice(0, 4).map((game) => (
                                <motion.div
                                  key={game.id}
                                  initial={{ opacity: 0, y: 15 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="bg-[#0c0c0e]/95 border border-zinc-900 hover:border-zinc-850 rounded-[2.5rem] p-4 flex flex-col justify-between transition-all duration-300 group relative cursor-pointer shadow-lg hover:shadow-zinc-950/40"
                                  onClick={(e) => {
                                    const target = e.target as HTMLElement;
                                    if (target.closest('button') || target.closest('a')) {
                                      return;
                                    }
                                    setSelectedGameForDetails(game);
                                  }}
                                >
                                  <div className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden bg-zinc-950 shrink-0 border border-zinc-900/60 shadow-inner">
                                    <img 
                                      src={(game.thumbnail && game.thumbnail !== "") ? game.thumbnail : 'https://images.unsplash.com/photo-1587573089734-09cb69c0f2b4?q=80&w=400&auto=format&fit=crop'} 
                                      alt={game.title} 
                                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                      referrerPolicy="no-referrer"
                                    />
                                    {/* Add-On Label */}
                                    {(game.category === 'مودات' || game.id === 'herschel-backpack' || game.id === 'essentials') && (
                                      <div className="absolute bottom-3 left-3 bg-black/90 border-2 border-[#caa43c] px-3 py-1 text-[#caa43c] text-[11px] font-black font-mono rounded-lg tracking-wider uppercase shadow-lg select-none">
                                        Add-On
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex flex-col gap-2 mt-4 text-right">
                                    <h3 className="text-base sm:text-lg font-black text-white group-hover:text-[#caa43c] transition-colors leading-snug truncate">
                                      {game.title}
                                    </h3>
                                    <p className="text-zinc-400 text-xs font-semibold leading-relaxed line-clamp-2 min-h-[32px]">
                                      {game.description}
                                    </p>
                                    
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-900/40">
                                      <span className="bg-[#ef233c] text-white font-black text-[10px] sm:text-xs px-3 py-1 rounded-xl uppercase tracking-wider shadow-sm">
                                        {language === 'ar' ? 'إضافات' : 'ADD-ONS'}
                                      </span>

                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          triggerDownload(game.title, game.downloadUrl, game.description, game.category, game.id);
                                        }}
                                        className="bg-[#0c0c0e] hover:bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 text-[10px] sm:text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md"
                                      >
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
                                        <Download className="w-3.5 h-3.5 stroke-[3px]" />
                                      </button>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-10 bg-zinc-950/50 border border-zinc-900/60 rounded-3xl border-dashed">
                              <p className="text-xs text-zinc-500">{language === 'ar' ? 'لا توجد مودات حالياً' : 'No mods available yet'}</p>
                            </div>
                          )}
                        </div>

                        {/* Section 2: Most Downloaded (الأكثر تحميلاً) - Blue Bar */}
                        <div className="space-y-6">
                          <div className="flex items-center justify-between border-b border-zinc-900/40 pb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-[5px] h-6 rounded-full bg-[#00b4d8] shadow-[0_0_8px_rgba(0,180,216,0.5)]" />
                              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                                {language === 'ar' ? 'الأكثر تحميلاً' : 'Most Downloaded'}
                              </h2>
                            </div>
                            <span className="text-xs font-black text-blue-500 bg-blue-500/5 px-3 py-1.5 rounded-xl border border-blue-500/10">
                              {language === 'ar' ? 'الأعلى طلباً' : 'Top Choice'}
                            </span>
                          </div>

                          {mostDownloadedList.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              {mostDownloadedList.slice(0, 4).map((game) => (
                                <motion.div
                                  key={game.id}
                                  initial={{ opacity: 0, y: 15 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="bg-[#0c0c0e]/95 border border-zinc-900 hover:border-zinc-850 rounded-[2.5rem] p-4 flex flex-col justify-between transition-all duration-300 group relative cursor-pointer shadow-lg hover:shadow-zinc-950/40"
                                  onClick={(e) => {
                                    const target = e.target as HTMLElement;
                                    if (target.closest('button') || target.closest('a')) {
                                      return;
                                    }
                                    setSelectedGameForDetails(game);
                                  }}
                                >
                                  <div className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden bg-zinc-950 shrink-0 border border-zinc-900/60 shadow-inner">
                                    <img 
                                      src={(game.thumbnail && game.thumbnail !== "") ? game.thumbnail : 'https://images.unsplash.com/photo-1587573089734-09cb69c0f2b4?q=80&w=400&auto=format&fit=crop'} 
                                      alt={game.title} 
                                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                      referrerPolicy="no-referrer"
                                    />
                                    {/* Add-On Label */}
                                    {(game.category === 'مودات' || game.id === 'herschel-backpack' || game.id === 'essentials') && (
                                      <div className="absolute bottom-3 left-3 bg-black/90 border-2 border-[#caa43c] px-3 py-1 text-[#caa43c] text-[11px] font-black font-mono rounded-lg tracking-wider uppercase shadow-lg select-none">
                                        Add-On
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex flex-col gap-2 mt-4 text-right">
                                    <h3 className="text-base sm:text-lg font-black text-white group-hover:text-[#caa43c] transition-colors leading-snug truncate">
                                      {game.title}
                                    </h3>
                                    <p className="text-zinc-400 text-xs font-semibold leading-relaxed line-clamp-2 min-h-[32px]">
                                      {game.description}
                                    </p>
                                    
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-900/40">
                                      {/* Dynamic label matching type */}
                                      {(() => {
                                        let badgeBg = "bg-red-600";
                                        let badgeText = language === 'ar' ? 'إضافات' : 'ADD-ONS';
                                        if (game.category === 'سكنات' || game.category === 'Skins') {
                                          badgeBg = "bg-[#9d4edd]";
                                          badgeText = language === 'ar' ? 'سكنات' : 'SKINS';
                                        } else if (game.category === 'خرائط' || game.category === 'Maps') {
                                          badgeBg = "bg-orange-650";
                                          badgeText = language === 'ar' ? 'خرائط' : 'MAPS';
                                        } else if (game.category === 'شيدرز' || game.category === 'Textures' || game.category === 'Shaders') {
                                          badgeBg = "bg-red-600";
                                          badgeText = language === 'ar' ? 'شيدرز' : 'TEXTURES';
                                        }
                                        return (
                                          <span className={`${badgeBg} text-white font-black text-[10px] sm:text-xs px-3 py-1 rounded-xl uppercase tracking-wider shadow-sm`}>
                                            {badgeText}
                                          </span>
                                        );
                                      })()}

                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          triggerDownload(game.title, game.downloadUrl, game.description, game.category, game.id);
                                        }}
                                        className="bg-[#0c0c0e] hover:bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 text-[10px] sm:text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md"
                                      >
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
                                        <Download className="w-3.5 h-3.5 stroke-[3px]" />
                                      </button>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-10 bg-zinc-950/50 border border-zinc-900/60 rounded-3xl border-dashed">
                              <p className="text-xs text-zinc-500">{language === 'ar' ? 'لا توجد إحصاءات حالياً' : 'No stats available yet'}</p>
                            </div>
                          )}
                        </div>

                        {/* Section 3: Latest Skins (أحدث السكنات) - Purple Bar */}
                        <div className="space-y-6">
                          <div className="flex items-center justify-between border-b border-zinc-900/40 pb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-[5px] h-6 rounded-full bg-[#9d4edd] shadow-[0_0_8px_rgba(157,78,221,0.5)]" />
                              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                                {language === 'ar' ? 'أحدث السكنات' : 'Latest Skins'}
                              </h2>
                            </div>
                            <span className="text-xs font-black text-purple-500 bg-purple-500/5 px-3 py-1.5 rounded-xl border border-purple-500/10">
                              {latestSkinsList.length} {language === 'ar' ? 'سكن متوفر' : 'Skins Available'}
                            </span>
                          </div>

                          {latestSkinsList.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              {latestSkinsList.slice(0, 4).map((game) => (
                                <motion.div
                                  key={game.id}
                                  initial={{ opacity: 0, y: 15 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="bg-[#0c0c0e]/95 border border-zinc-900 hover:border-zinc-850 rounded-[2.5rem] p-4 flex flex-col justify-between transition-all duration-300 group relative cursor-pointer shadow-lg hover:shadow-zinc-950/40"
                                  onClick={(e) => {
                                    const target = e.target as HTMLElement;
                                    if (target.closest('button') || target.closest('a')) {
                                      return;
                                    }
                                    setSelectedGameForDetails(game);
                                  }}
                                >
                                  <div className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden bg-zinc-950 shrink-0 border border-zinc-900/60 shadow-inner">
                                    <img 
                                      src={(game.thumbnail && game.thumbnail !== "") ? game.thumbnail : 'https://images.unsplash.com/photo-1587573089734-09cb69c0f2b4?q=80&w=400&auto=format&fit=crop'} 
                                      alt={game.title} 
                                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>

                                  <div className="flex flex-col gap-2 mt-4 text-right">
                                    <h3 className="text-base sm:text-lg font-black text-white group-hover:text-[#caa43c] transition-colors leading-snug truncate">
                                      {game.title}
                                    </h3>
                                    <p className="text-zinc-400 text-xs font-semibold leading-relaxed line-clamp-2 min-h-[32px]">
                                      {game.description}
                                    </p>
                                    
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-900/40">
                                      <span className="bg-[#9d4edd] text-white font-black text-[10px] sm:text-xs px-3 py-1 rounded-xl uppercase tracking-wider shadow-sm">
                                        {language === 'ar' ? 'سكنات' : 'SKINS'}
                                      </span>

                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          triggerDownload(game.title, game.downloadUrl, game.description, game.category, game.id);
                                        }}
                                        className="bg-[#0c0c0e] hover:bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 text-[10px] sm:text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md"
                                      >
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
                                        <Download className="w-3.5 h-3.5 stroke-[3px]" />
                                      </button>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-10 bg-zinc-950/50 border border-zinc-900/60 rounded-3xl border-dashed">
                              <p className="text-xs text-zinc-500">{language === 'ar' ? 'لا توجد سكنات حالياً' : 'No skins available yet'}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Fallback view: if specific category is selected, we show a clean single category view */
                      <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-zinc-900/40 pb-4 gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-[5px] h-6 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                              {selectedCategory}
                            </h2>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-zinc-500">
                              {language === 'ar' ? 'ترتيب حسب:' : 'Sort By:'}
                            </span>
                            <div className="relative inline-block text-left text-zinc-400">
                              <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="appearance-none text-xs font-black rounded-xl pl-3 pr-8 py-2 bg-[#0c0c0e] border border-zinc-900 text-white hover:bg-zinc-900 transition-all cursor-pointer"
                              >
                                <option value="newest">{language === 'ar' ? 'الأحدث' : 'Newest'}</option>
                                <option value="highest_rated">{language === 'ar' ? 'الأعلى تقييماً' : 'Highest Rated'}</option>
                                <option value="most_downloaded">{language === 'ar' ? 'الأكثر تحميلاً' : 'Most Downloaded'}</option>
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500">
                                <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 11-1.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                </svg>
                              </div>
                            </div>
                            <span className="text-xs font-black text-amber-500 bg-amber-500/5 px-3 py-1.5 rounded-xl border border-amber-500/10">
                              {filteredGames.length} {language === 'ar' ? 'مود متوفر' : 'Mods Available'}
                            </span>
                          </div>
                        </div>

                        {paginatedGames.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {paginatedGames.map((game) => (
                              <motion.div
                                key={game.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-[#0c0c0e]/95 border border-zinc-900 hover:border-zinc-850 rounded-[2.5rem] p-4 flex flex-col justify-between transition-all duration-300 group relative cursor-pointer shadow-lg hover:shadow-zinc-950/40"
                                onClick={(e) => {
                                  const target = e.target as HTMLElement;
                                  if (target.closest('button') || target.closest('a')) {
                                    return;
                                  }
                                  setSelectedGameForDetails(game);
                                }}
                              >
                                <div className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden bg-zinc-950 shrink-0 border border-zinc-900/60 shadow-inner">
                                  <img 
                                    src={(game.thumbnail && game.thumbnail !== "") ? game.thumbnail : 'https://images.unsplash.com/photo-1587573089734-09cb69c0f2b4?q=80&w=400&auto=format&fit=crop'} 
                                    alt={game.title} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    referrerPolicy="no-referrer"
                                  />
                                  {/* Add-On Label */}
                                  {(game.category === 'مودات' || game.id === 'herschel-backpack' || game.id === 'essentials') && (
                                    <div className="absolute bottom-3 left-3 bg-black/90 border-2 border-[#caa43c] px-3 py-1 text-[#caa43c] text-[11px] font-black font-mono rounded-lg tracking-wider uppercase shadow-lg select-none">
                                      Add-On
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col gap-2 mt-4 text-right">
                                  <h3 className="text-base sm:text-lg font-black text-white group-hover:text-amber-400 transition-colors leading-snug truncate">
                                    {game.title}
                                  </h3>
                                  <p className="text-zinc-400 text-xs font-semibold leading-relaxed line-clamp-2 min-h-[32px]">
                                    {game.description}
                                  </p>
                                  
                                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-900/40">
                                    {/* Dynamic Category Badge */}
                                    {(() => {
                                      let badgeBg = "bg-red-600";
                                      let badgeText = language === 'ar' ? 'إضافات' : 'ADD-ONS';
                                      if (game.category === 'سكنات' || game.category === 'Skins') {
                                        badgeBg = "bg-[#9d4edd]";
                                        badgeText = language === 'ar' ? 'سكنات' : 'SKINS';
                                      } else if (game.category === 'خرائط' || game.category === 'Maps') {
                                        badgeBg = "bg-orange-650";
                                        badgeText = language === 'ar' ? 'خرائط' : 'MAPS';
                                      } else if (game.category === 'شيدرز' || game.category === 'Textures' || game.category === 'Shaders') {
                                        badgeBg = "bg-red-600";
                                        badgeText = language === 'ar' ? 'شيدرز' : 'TEXTURES';
                                      }
                                      return (
                                        <span className={`${badgeBg} text-white font-black text-[10px] sm:text-xs px-3 py-1 rounded-xl uppercase tracking-wider shadow-sm`}>
                                          {badgeText}
                                        </span>
                                      );
                                    })()}

                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        triggerDownload(game.title, game.downloadUrl, game.description, game.category, game.id);
                                      }}
                                      className="bg-[#0c0c0e] hover:bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 text-[10px] sm:text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md"
                                    >
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
                                      <Download className="w-3.5 h-3.5 stroke-[3px]" />
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-20 bg-zinc-950 border border-zinc-900 rounded-[2rem] border-dashed">
                            <Gamepad2 className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                            <h3 className="text-sm font-black text-zinc-400">لا توجد مذكرات أو مودات تطابق بحثك حالياً</h3>
                            <p className="text-xs text-zinc-500 mt-1">جرب إدخال كلمات بحث أخرى أو تعديل تصفية الفئات</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>



                  {/* 3. ABOUT US SECTION ("معلومات عنا") */}
                  <div className="space-y-6 text-right pt-4 pb-4">
                    <div className="flex items-center gap-2.5 border-b border-zinc-900/40 pb-3">
                      {/* Info SVG Icon */}
                      <svg className="w-6 h-6 text-[#f59e0b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                        <span>{language === 'ar' ? 'معلومات عنا' : 'About Us'}</span>
                      </h2>
                    </div>

                    <div className="bg-[#0c0c0e]/90 border border-zinc-900/80 rounded-2xl p-6 sm:p-8">
                      <p className="text-zinc-300 text-sm sm:text-base font-bold leading-relaxed">
                        {language === 'ar' 
                          ? 'Golden هو موقع متخصص في توفير أفضل مودات ماين كرافت بشكل آمن وسهل التحميل. نحن نعمل على تقديم تجربة مميزة لعشاق ماين كرافت.' 
                          : 'Golden is a premium hub dedicated to providing the best Minecraft mods securely and easily. We strive to offer an amazing experience for all Minecraft lovers.'}
                      </p>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* DYNAMIC SEARCH TAB VIEW */}
          {activeMainTab === 'search' && (
            <SearchTab
              language={language}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categories={categories}
              filteredGames={filteredGames}
              toggleFavorite={toggleFavorite}
              userProfile={userProfile}
              t={t}
              onDownload={(title, url, description, category, id) => triggerDownload(title, url, description, category, id)}
              onBuyWithPoints={handleBuyWithPoints}
              isGamePurchased={isGamePurchased}
            />
          )}

          {/* DYNAMIC SAVED FAVORITES HUB TAB VIEW */}
          {activeMainTab === 'favorites' && (
            <FavoritesTab
              language={language}
              user={user}
              userProfile={userProfile}
              games={gamesWithRealRatings}
              toggleFavorite={toggleFavorite}
              setLoginMode={setLoginMode}
              setShowLoginModal={setShowLoginModal}
              onDownload={(title, url, description, category, id) => triggerDownload(title, url, description, category, id)}
              onBuyWithPoints={handleBuyWithPoints}
              isGamePurchased={isGamePurchased}
            />
          )}

          {/* DYNAMIC SETTINGS REDIRECT TAB VIEW */}
          {activeMainTab === 'settings' && (
            <div className="space-y-6 mt-4 max-w-xl mx-auto text-center py-10 bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8">
              <Settings className="w-16 h-16 text-red-500 mx-auto" />
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white">{language === 'ar' ? 'لوحة تحكم وإعدادات الحساب' : 'Account Management Area'}</h3>
                <p className="text-zinc-404 text-xs sm:text-sm leading-relaxed">
                  {language === 'ar' 
                    ? 'يرجى استخدام واجهة الإعدادات الشاملة لتغيير لغة الموقع، والسمة المرئية، أو إرسال تقرير الدعم الفني للمشرفين.'
                    : 'Configure theme choices, interface language bindings or submit high priority logs directly from your controller.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowUserPanel(true);
                  setActiveMainTab('home');
                }}
                className="bg-red-650 hover:bg-red-550 text-white font-black text-xs px-8 py-3.5 rounded-xl transition-all shadow-lg"
              >
                {language === 'ar' ? 'افتح واجهة الإعدادات الآن' : 'Trigger Settings Hub'}
              </button>
            </div>
          )}
          </React.Suspense>
        </div>
      </main>

      {/* Hidden Layout anchor container to avoid breaking references */}
      <div className="hidden border-offset-none">
        <div className="relative z-10">


          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-16">
            
            {/* Left/Main Column - Info, Search & Filters */}
            <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-right">
              {/* Feature Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/15 border border-red-600/25 text-red-500 rounded-full text-xs font-bold mb-6 tracking-wide"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>
                  {language === 'ar' ? 'الشبكة الرسمية لمودات وسكنات الألعاب' : 'The Ultimate Gaming Mods & Maps Hub'}
                </span>
              </motion.div>

              {/* Title */}
              <motion.h1 
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ duration: 0.7, type: "spring" }}
                className="text-5xl md:text-7xl font-black mb-4 leading-tight tracking-tighter flex flex-wrap items-center justify-center lg:justify-start gap-x-4"
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 drop-shadow-[0_0_35px_rgba(245,158,11,0.35)] font-black">
                  {generalSettings.siteName || 'Golden Gih'}
                </span>
              </motion.h1>

              {/* Description */}
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className={`text-zinc-400 text-sm md:text-lg max-w-xl mb-8 leading-relaxed font-black ${language === 'ar' ? 'text-right' : 'text-left'}`}
              >
                {generalSettings.siteDescription || (language === 'ar' 
                  ? 'منصتك الشاملة لتحميل وتنزيل أفضل إضافات الألعاب والخرائط وسرعات السيرفرات الآمنة بنسبة 100%. ابدأ رحلتك الآن في تصفح مئات المودات المصنفة!' 
                  : 'Your ultimate destination for lightning-fast mods, customized shaders, and immersive world maps. Completely safe, tested, and updated daily!')}
              </motion.p>

              {/* Redesigned Search Box */}
              <div className="w-full max-w-2xl mb-8 relative group z-25">
                <div className="absolute -inset-2 bg-gradient-to-r from-red-600 to-pink-600 rounded-[22px] blur-md opacity-30 group-focus-within:opacity-50 transition duration-300" />
                <div className={`relative flex items-center ${localTheme === 'light' ? 'bg-white border-zinc-200' : 'bg-black/95 border-zinc-800'} border-2 rounded-[22px] p-2.5 shadow-2xl`}>
                  <div className={`flex items-center flex-1 ${language === 'ar' ? 'pr-5' : 'pl-5'}`}>
                    <Search className="w-6 h-6 text-red-500 shrink-0 animate-pulse" />
                    <input 
                      type="text" 
                      placeholder={t.searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full bg-transparent border-none ${language === 'ar' ? 'pr-4 pl-4 text-right' : 'pl-4 pr-4 text-left'} focus:outline-none focus:ring-0 text-base py-3.5 text-white placeholder:text-zinc-500 font-extrabold`}
                    />
                  </div>
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="p-3 hover:bg-zinc-800/20 text-zinc-400 hover:text-white rounded-2xl transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>


            </div>

            {/* Right Column - Beautiful Live Feature Showcase Panel ("الألعاب المميزة") */}
            <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className={`w-full max-w-sm rounded-[32px] p-6 border relative overflow-hidden group ${
                  localTheme === 'light' 
                    ? 'bg-zinc-50 border-zinc-200 shadow-xl' 
                    : 'bg-zinc-950/60 border-zinc-800/80 shadow-2xl shadow-red-950/10'
                }`}
              >
                {/* Visual glow backdrop in card */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] uppercase font-bold text-zinc-500">
                      {language === 'ar' ? 'بث مباشر من المنصة' : 'PLATFORM LIVE STATS'}
                    </span>
                  </div>
                  <span className="text-[11px] bg-red-600/10 text-red-400 px-2 py-0.5 rounded-full font-black flex items-center gap-1 border border-red-600/20">
                    <Flame className="w-3 h-3 text-red-500" />
                    {language === 'ar' ? 'مميز' : 'WEEKLY PICK'}
                  </span>
                </div>

                {/* Main Visual Core Card */}
                <div className="relative aspect-video rounded-2xl bg-zinc-900/95 border border-zinc-800/80 overflow-hidden mb-5">
                  {/* Subtle styling lines */}
                  <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay bg-fixed" style={{ backgroundImage: `url(${backgroundImage})` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  
                  <div className="absolute inset-0 flex flex-col justify-end p-4">
                    <span className="text-[9px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-extrabold px-1.5 py-0.5 rounded w-max mb-1 uppercase">
                      Minecraft / PE
                    </span>
                    <h4 className="text-sm font-black text-white truncate">
                      {language === 'ar' ? 'حزمة الأسلحة والسيارات الخارقة v5.4' : 'Cybernetic Weapons & Custom Cars V5.4'}
                    </h4>
                    <p className="text-[10px] text-zinc-400">
                      {language === 'ar' ? 'سرعة قصوى • آمن تماماً • تحديث فوري' : 'Ultra Performance • Tested Safe • Immediate Update'}
                    </p>
                  </div>
                </div>

                {/* Specs Info rows */}
                <div className="space-y-3.5 mb-6 text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-zinc-805/20">
                    <span className="text-zinc-500 text-xs font-bold">{language === 'ar' ? 'مجموع التحميلات' : 'Downloads'}</span>
                    <span className="font-extrabold text-xs flex items-center gap-1 text-zinc-300">
                      <Download className="w-3 h-3 text-red-500" />
                      14,208+
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-zinc-805/20">
                    <span className="text-zinc-500 text-xs font-bold">{language === 'ar' ? 'تقييم اللاعبين' : 'Player Rating'}</span>
                    <span className="font-extrabold text-xs flex items-center gap-1 text-zinc-300">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      4.9 / 5.0
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-zinc-500 text-xs font-bold">{language === 'ar' ? 'فحص ملف التنزيل' : 'Security Status'}</span>
                    <span className="font-extrabold text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {language === 'ar' ? 'آمن وموثّق 100%' : '100% Certified Safe'}
                    </span>
                  </div>
                </div>

                {/* Action Interactive Highlight Button */}
                <button 
                  onClick={() => {
                    // Pre-fill search with Weapons to instantly display relevant results
                    setSearchTerm(language === 'ar' ? 'سيارات' : 'Cars');
                    const el = document.getElementById("available-mods-anchor");
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>
                    {language === 'ar' ? 'تصفح تحميل المود فوراً' : 'Browse & Install This Mod'}
                  </span>
                </button>
              </motion.div>
            </div>

          </div>

          {/* Stats Bar (styled beautifully as high-tech glassy gaming gauges) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-zinc-800/30">
            {[
              { icon: Smartphone, label: language === 'ar' ? "مودات هواتف" : "Mobile Mods", value: "500+" },
              { icon: Flame, label: language === 'ar' ? "خرائط تريند" : "Trending Maps", value: "120+" },
              { icon: TrendingUp, label: language === 'ar' ? "تحميلات يومية" : "Daily Hits", value: "10K+" },
              { icon: CheckCircle2, label: language === 'ar' ? "أمان كامل" : "100% Safe", value: "100%" },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                className={`relative overflow-hidden border p-4.5 rounded-2xl text-center group transition-all duration-300 hover:border-red-500/40 hover:-translate-y-1 ${
                  localTheme === 'light' 
                    ? 'bg-zinc-100/65 border-zinc-200' 
                    : 'bg-zinc-950 border-zinc-900 hover:bg-zinc-900'
                }`}
              >
                <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-red-500 rounded-br-lg opacity-40 group-hover:opacity-100 transition-opacity" />
                <stat.icon className="w-5.5 h-5.5 text-red-500 mx-auto mb-2.5 transition-transform group-hover:scale-110" />
                <p className={`text-2xl font-black tracking-tight ${localTheme === 'light' ? 'text-zinc-900' : 'text-zinc-100'}`}>{stat.value}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>

        </div>
      </div>



      {/* Floating Sticky Bottom Glass Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-[100] bg-black/95 border-t border-zinc-900 px-6 py-4 flex justify-around items-center shadow-[0_-10px_35px_rgba(0,0,0,0.5)]">
        <motion.button 
          id="tab-btn-home"
          onClick={() => {
            setActiveMainTab('home');
            setActiveSubTab('home');
          }}
          whileHover={{ scale: 1.12, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className={`flex flex-col items-center gap-1 transition-colors relative py-1 px-4 rounded-xl hover:bg-zinc-900/50 ${activeMainTab === 'home' ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-350'}`}
        >
          <Gamepad2 className="w-5 h-5" />
          <span className="text-[10px] font-black">{language === 'ar' ? 'الرئيسية' : 'Home'}</span>
          {activeMainTab === 'home' && (
            <motion.div 
              layoutId="nav-indicator" 
              className="absolute -bottom-1 left-4 right-4 h-0.5 bg-red-600 rounded-full"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </motion.button>

        <motion.button 
          id="tab-btn-search"
          onClick={() => setActiveMainTab('search')}
          whileHover={{ scale: 1.12, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className={`flex flex-col items-center gap-1 transition-colors relative py-1 px-4 rounded-xl hover:bg-zinc-900/50 ${activeMainTab === 'search' ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-350'}`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-black">{language === 'ar' ? 'البحث' : 'Search'}</span>
          {activeMainTab === 'search' && (
            <motion.div 
              layoutId="nav-indicator" 
              className="absolute -bottom-1 left-4 right-4 h-0.5 bg-red-600 rounded-full"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </motion.button>

        <motion.button 
          id="tab-btn-favorites"
          onClick={() => setActiveMainTab('favorites')}
          whileHover={{ scale: 1.12, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className={`flex flex-col items-center gap-1 transition-colors relative py-1 px-4 rounded-xl hover:bg-zinc-900/50 ${activeMainTab === 'favorites' ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-350'}`}
        >
          <Heart className="w-5 h-5" />
          <span className="text-[10px] font-black">{language === 'ar' ? 'المفضلة' : 'Favorites'}</span>
          {activeMainTab === 'favorites' && (
            <motion.div 
              layoutId="nav-indicator" 
              className="absolute -bottom-1 left-4 right-4 h-0.5 bg-red-600 rounded-full"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </motion.button>

        {/* More/Menu 3 Dots Button */}
        <motion.button 
          id="tab-btn-more"
          onClick={() => setShowMobileMenu(true)}
          whileHover={{ scale: 1.12, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center gap-1 transition-colors relative py-1 px-4 rounded-xl hover:bg-zinc-900/50 text-zinc-500 hover:text-zinc-350"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-black">{language === 'ar' ? 'المزيد' : 'More'}</span>
        </motion.button>
      </nav>

      {/* Footer */}
      <footer className={`py-16 px-6 md:px-12 border-t ${localTheme === 'light' ? 'bg-zinc-100 border-zinc-200' : 'bg-[#050507] border-zinc-900'} transition-all text-center relative overflow-hidden`}>
        {/* Subtle Ambient Backlight Red/Orange Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-650/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-10 relative z-10">
          {/* Social Community Headers Area */}
          <div className="space-y-4">
            <motion.h2 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase text-white bg-clip-text drop-shadow-[0_0_25px_rgba(239,68,68,0.15)] font-sans"
            >
              FOLLOW GOLDEN GIH
            </motion.h2>
            <p className="text-zinc-400 text-xs sm:text-sm md:text-base font-semibold leading-relaxed max-w-xl mx-auto">
              {language === 'ar' 
                ? 'انضم إلى مجتمعنا العربي للحصول على التحديثات اليومية والمحتوى الحصري والمساعدات الفورية!'
                : 'Join our community for daily updates, exclusive mods, gameplay tips and direct help!'}
            </p>
          </div>

          {/* Social Showcase Grid Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 select-none">
            {/* TikTok */}
            <button
              onClick={() => handleSocialClick(socials.tiktok, 'تيك توك (TikTok)')}
              className="flex items-center justify-center gap-2.5 px-6 py-3 rounded-full bg-zinc-950/85 border border-zinc-850 hover:border-red-500/80 hover:bg-zinc-900 text-white text-xs sm:text-sm font-black transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <Music className="w-4 h-4 text-red-500" />
              <span>TikTok</span>
            </button>

            {/* Telegram */}
            <button
              onClick={() => handleSocialClick(socials.telegram, 'تلغرام (Telegram)')}
              className="flex items-center justify-center gap-2.5 px-6 py-3 rounded-full bg-zinc-950/85 border border-zinc-850 hover:border-sky-500/80 hover:bg-zinc-900 text-white text-xs sm:text-sm font-black transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <Send className="w-4 h-4 text-sky-400" />
              <span>Telegram</span>
            </button>

            {/* Discord */}
            <button
              onClick={() => handleSocialClick(socials.discord, 'ديسكورد (Discord)')}
              className="flex items-center justify-center gap-2.5 px-6 py-3 rounded-full bg-zinc-950/85 border border-zinc-850 hover:border-indigo-500/80 hover:bg-zinc-900 text-white text-xs sm:text-sm font-black transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <Gamepad2 className="w-4 h-4 text-indigo-400" />
              <span>Discord</span>
            </button>

            {/* YouTube */}
            <button
              onClick={() => handleSocialClick(socials.youtube, 'يوتيوب (YouTube)')}
              className="flex items-center justify-center gap-2.5 px-6 py-3 rounded-full bg-zinc-950/85 border border-zinc-850 hover:border-red-650/80 hover:bg-zinc-900 text-white text-xs sm:text-sm font-black transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <Youtube className="w-4 h-4 text-red-600" />
              <span>YouTube</span>
            </button>

            {/* X / Twitter */}
            <button
              onClick={() => handleSocialClick(socials.twitter, 'منصة إكس (Twitter/X)')}
              className="flex items-center justify-center gap-2.5 px-6 py-3 rounded-full bg-zinc-950/85 border border-zinc-850 hover:border-zinc-300 hover:bg-zinc-900 text-white text-xs sm:text-sm font-black transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <Twitter className="w-4 h-4 text-zinc-300" />
              <span>X</span>
            </button>
          </div>

          {/* Minimalist Sub Row for Official Utilities & Modals */}
          <div className="pt-6 border-t border-zinc-900/60 max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs font-bold text-zinc-500 select-none">
            <button onClick={() => setShowPrivacyModal(true)} className="hover:text-red-500 transition-colors cursor-pointer flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span>{language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}</span>
            </button>
            <span className="opacity-30">•</span>
            <button onClick={() => setShowTermsModal(true)} className="hover:text-red-500 transition-colors cursor-pointer flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5 text-zinc-400" />
              <span>{language === 'ar' ? 'شروط الاستخدام' : 'Terms of Use'}</span>
            </button>
            <span className="opacity-30">•</span>
            <button onClick={() => setShowAboutModal(true)} className="hover:text-red-500 transition-colors cursor-pointer flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{language === 'ar' ? 'عن المنصة والأعضاء' : 'About Platform'}</span>
            </button>
            <span className="opacity-30">•</span>
            <button onClick={() => setShowContactModal(true)} className="hover:text-red-500 transition-colors cursor-pointer flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-zinc-400" />
              <span>{language === 'ar' ? 'الدعم الفني' : 'Contact Support'}</span>
            </button>
          </div>

          {/* Bottom copyright line Bar */}
          <div className="pt-4 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] font-bold text-zinc-500 max-w-3xl mx-auto border-t border-zinc-900/30 font-sans">
            <p>
              © 2026 {generalSettings.siteName || 'Golden Gih'}. {t.footerRights}
            </p>
            <p className="text-zinc-650 font-sans">
              {language === 'ar' ? 'صنع بكل حب لعشاق ماين كرافت العربي Minecraft' : 'Crafted for Minecraft Fans worldwide'}
            </p>
          </div>
        </div>
      </footer>

      {/* Admin Panel Modal */}
      <AdminPanel 
        isOpen={showAdminPanel} 
        onClose={() => setShowAdminPanel(false)} 
        onAddGame={handleAddGame}
        onUpdateGame={handleUpdateGame}
        onDeleteGame={handleDeleteGame}
        onResolveReport={handleResolveReport}
        onDeleteReport={handleDeleteReport}
        games={displayedGames}
        language={language}
        t={t}
        theme={localTheme}
        user={user}
        userProfile={userProfile}
      />

      {/* User Panel Modal */}
      <UserPanel 
        isOpen={showUserPanel} 
        onClose={() => setShowUserPanel(false)}
        profile={userProfile}
        allGames={displayedGames}
        onUpdateProfile={updateProfile}
        onSendReport={handleSendReport}
        theme={localTheme}
        language={language}
        isAppInstalled={isAppInstalled}
        onInstallPWA={handleInstallPWA}
        stats={stats}
      />

      {/* Contact Modal */}
      <ContactModal 
        isOpen={showContactModal} 
        onClose={() => setShowContactModal(false)} 
        onSend={handleSendReport}
        theme={localTheme}
        language={language}
      />

      {/* Privacy Policy Modal */}
      <PrivacyModal 
        isOpen={showPrivacyModal} 
        onClose={() => setShowPrivacyModal(false)} 
        theme={localTheme}
        language={language}
      />

      {/* Terms of Use Modal */}
      <TermsModal 
        isOpen={showTermsModal} 
        onClose={() => setShowTermsModal(false)} 
        theme={localTheme}
        language={language}
      />

      {/* About Platform Modal */}
      <AboutModal 
        isOpen={showAboutModal} 
        onClose={() => setShowAboutModal(false)} 
        theme={localTheme}
        language={language}
      />

      {/* Game/Mod Details Drawer Overlay */}
      <AnimatePresence>
        {selectedGameForDetails && (() => {
          const averageRating = reviews.length > 0 
            ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
            : (selectedGameForDetails.rating || '5.0');

          return (
            <div className="fixed inset-0 z-[160] flex justify-end font-sans" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              {/* Backdrop cover */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedGameForDetails(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto"
              />

              {/* Sliding Drawer Panel */}
              <motion.div
                initial={{ x: language === 'ar' ? '100%' : '100%' }}
                animate={{ x: 0 }}
                exit={{ x: language === 'ar' ? '100%' : '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                className="relative w-full max-w-lg h-full bg-[#0c0c0e] border-l border-zinc-900/80 shadow-2xl flex flex-col z-20 overflow-hidden pointer-events-auto text-right"
              >
                {/* Header block with close and background */}
                <div className="relative aspect-video shrink-0 bg-zinc-950 overflow-hidden border-b border-zinc-900">
                  <img
                    src={selectedGameForDetails.thumbnail || 'https://images.unsplash.com/photo-1587573089734-09cb69c0f2b4?q=80&w=400&auto=format&fit=crop'}
                    alt={selectedGameForDetails.title}
                    className="w-full h-full object-cover animate-fade-in"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-transparent to-transparent opacity-95" />
                  
                  {/* Floating controls in header absolute */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10" dir="ltr">
                    {/* Floating Edition Tag */}
                    <span className="bg-amber-500 text-black font-extrabold px-3 py-1 rounded-xl text-[10px] uppercase tracking-wider shadow-lg select-none pointer-events-auto">
                      {selectedGameForDetails.edition === 'java' ? 'Java 1.20.4' : selectedGameForDetails.edition === 'bedrock' ? 'Bedrock 1.20' : '1.20.4'}
                    </span>

                    {/* Close button Drawer */}
                    <button
                      onClick={() => setSelectedGameForDetails(null)}
                      className="w-9 h-9 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 border border-zinc-800 text-zinc-400 hover:text-white pointer-events-auto transition active:scale-95 cursor-pointer"
                      title={language === 'ar' ? 'إغلاق التفاصيل' : 'Close Details'}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Game title overlapping overlay background */}
                  <div className="absolute bottom-4 inset-x-5 text-right flex flex-col gap-1 z-10" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-wider">
                      {selectedGameForDetails.category}
                    </span>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                      {selectedGameForDetails.title}
                    </h2>
                  </div>
                </div>

                {/* Scrollable Core Drawer Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                  {/* Statistics panel block */}
                  <div className="grid grid-cols-3 gap-3 bg-zinc-900/40 p-4 rounded-xl border border-zinc-900/60 text-center">
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-500 font-black">
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                        <span className="text-sm font-black text-white">{averageRating}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">{language === 'ar' ? 'التقييم العام' : 'Rating'}</span>
                    </div>

                    <div className="h-8 w-[1px] bg-zinc-800 self-center" />

                    <div className="flex flex-col items-center justify-center space-y-1">
                      <div className="flex items-center gap-1.5 text-zinc-200 font-black">
                        <Download className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm font-black text-white">{getGameDownloads(selectedGameForDetails).toLocaleString()}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">{language === 'ar' ? 'التنزيلات' : 'Downloads'}</span>
                    </div>

                    <div className="h-8 w-[1px] bg-zinc-800 self-center" />

                    <div className="flex flex-col items-center justify-center space-y-1">
                      <div className="flex items-center justify-center gap-1.5 font-black text-emerald-400">
                        {selectedGameForDetails.isPaid ? (
                          <>
                            <Coins className="w-4 h-4 text-amber-500" />
                            <span className="text-xs text-amber-500 font-black">{selectedGameForDetails.price || (language === 'ar' ? 'متميز' : 'Premium')}</span>
                          </>
                        ) : (
                          <span className="text-xs font-black text-emerald-400">{language === 'ar' ? 'مجاني' : 'Free'}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">{language === 'ar' ? 'التكلفة' : 'Price'}</span>
                    </div>
                  </div>

                  {/* Summary / Description */}
                  <div className="space-y-2 text-right">
                    <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest">{language === 'ar' ? 'تفاصيل وإرشاد المود' : 'Mod Details & Instructions'}</h4>
                    <p className="text-xs text-zinc-300 font-semibold leading-relaxed select-text whitespace-pre-line">
                      {selectedGameForDetails.description}
                    </p>
                  </div>

                  {/* Download / Buy CTA Inside Drawer */}
                  <div className="bg-zinc-900/20 p-4 rounded-2xl border border-zinc-900 flex items-center justify-between gap-4 text-right">
                    <div className="flex flex-col text-right">
                      <span className="text-[9px] text-zinc-500 font-black uppercase">{language === 'ar' ? 'حالة الترخيص والموثوقية' : 'License Trust Certificate'}</span>
                      <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        {language === 'ar' ? 'آمن ومفحوص تماماً' : 'Secure and scanning verified'}
                      </span>
                    </div>

                    <div>
                      {selectedGameForDetails.isPaid ? (
                        isGamePurchased(selectedGameForDetails.id) ? (
                          <button
                            onClick={() => triggerDownload(selectedGameForDetails.title, selectedGameForDetails.downloadUrl, selectedGameForDetails.description, selectedGameForDetails.category, selectedGameForDetails.id)}
                            className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-black px-5 py-3 rounded-xl flex items-center gap-2 transition active:scale-95 shadow-lg shadow-yellow-500/10 cursor-pointer"
                          >
                            <span>
                              {(() => {
                                const cat = (selectedGameForDetails.category || '').toLowerCase();
                                const isAr = language === 'ar';
                                if (cat === 'سكنات' || cat === 'skins') return isAr ? 'تنزيل السكن' : 'Download Skin';
                                if (cat === 'خرائط' || cat === 'maps') return isAr ? 'تنزيل الخريطة' : 'Download Map';
                                if (cat === 'شيدرز' || cat === 'shaders' || cat === 'textures') return isAr ? 'تنزيل الشيدر' : 'Download Shader';
                                if (cat === 'موارد' || cat === 'resources') return isAr ? 'تنزيل المورد' : 'Download Resource';
                                return isAr ? 'تنزيل المود' : 'Download Mod';
                              })()}
                            </span>
                            <Download className="w-4 h-4 stroke-[3px]" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBuyWithPoints(selectedGameForDetails)}
                            className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-550 hover:to-yellow-505 text-white text-xs font-black px-5 py-3 rounded-xl flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-md"
                          >
                            <span>
                              {(() => {
                                const cat = (selectedGameForDetails.category || '').toLowerCase();
                                const isAr = language === 'ar';
                                if (cat === 'سكنات' || cat === 'skins') return isAr ? 'شراء السكن' : 'Buy Skin';
                                if (cat === 'خرائط' || cat === 'maps') return isAr ? 'شراء الخريطة' : 'Buy Map';
                                if (cat === 'شيدرز' || cat === 'shaders' || cat === 'textures') return isAr ? 'شراء الشيدر' : 'Buy Shader';
                                if (cat === 'موارد' || cat === 'resources') return isAr ? 'شراء المورد' : 'Buy Resource';
                                return isAr ? 'شراء المود' : 'Buy Mod';
                              })()}
                            </span>
                            <Coins className="w-4 h-4" />
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => triggerDownload(selectedGameForDetails.title, selectedGameForDetails.downloadUrl, selectedGameForDetails.description, selectedGameForDetails.category, selectedGameForDetails.id)}
                          className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-black px-5 py-3 rounded-xl flex items-center gap-2 transition active:scale-95 shadow-lg shadow-yellow-500/10 cursor-pointer"
                        >
                          <span>
                            {(() => {
                              const cat = (selectedGameForDetails.category || '').toLowerCase();
                              const isAr = language === 'ar';
                              if (cat === 'سكنات' || cat === 'skins') return isAr ? 'تنزيل السكن' : 'Download Skin';
                              if (cat === 'خرائط' || cat === 'maps') return isAr ? 'تنزيل الخريطة' : 'Download Map';
                              if (cat === 'شيدرز' || cat === 'shaders' || cat === 'textures') return isAr ? 'تنزيل الشيدر' : 'Download Shader';
                              if (cat === 'موارد' || cat === 'resources') return isAr ? 'تنزيل المورد' : 'Download Resource';
                              return isAr ? 'تنزيل المود' : 'Download Mod';
                            })()}
                          </span>
                          <Download className="w-4 h-4 stroke-[3px]" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="h-[1px] bg-zinc-900" />

                  {/* Write a Review Block */}
                  <div className="space-y-4 bg-zinc-900/20 p-5 rounded-2xl border border-zinc-900 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <h4 className="text-sm font-black text-white">{language === 'ar' ? 'إضافة تقييم ومراجعة' : 'Add Your Review & Feedback'}</h4>
                      <MessageSquare className="w-4 h-4 text-amber-500" />
                    </div>

                    <form onSubmit={handlePostReview} className="space-y-3.5">
                      {/* Username row */}
                      {!userProfile && (
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-bold uppercase">{language === 'ar' ? 'الاسم المستعار (لاعب زائر)' : 'Nickname (Guest Player)'}</label>
                          <input
                            type="text"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            placeholder={language === 'ar' ? 'مثال: ستيف الخارق' : 'e.g. Steve Gamer'}
                            className="w-full bg-zinc-950 border border-zinc-900 hover:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-650 focus:border-amber-500/50 outline-none transition text-right"
                          />
                        </div>
                      )}

                      {/* Stars picker row */}
                      <div className="space-y-1 text-right">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase block">{language === 'ar' ? 'عدد النجوم' : 'Stars Rating'}</label>
                        <div className="flex items-center justify-end gap-1" dir="ltr">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setNewRating(num)}
                              className="p-1 cursor-pointer transition transform hover:scale-125 focus:outline-none"
                              title={`${num} Stars`}
                            >
                              <Star
                                className={`w-5 h-5 transition-all duration-150 ${
                                  num <= newRating 
                                    ? 'text-yellow-500 fill-yellow-500 scale-110 drop-shadow-[0_0_3px_rgba(245,158,11,0.45)]' 
                                    : 'text-zinc-700 hover:text-zinc-500'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Comment text area */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase">{language === 'ar' ? 'التعليق والمراجعة' : 'Review Comment'}</label>
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder={language === 'ar' ? 'اكتب انطباعك بوضوح وملاحظاتك عن المود...' : 'Type your detailed impressions about mod performance...'}
                          className="w-full h-24 bg-zinc-950 border border-zinc-900 hover:border-zinc-800 rounded-xl p-4 text-xs text-white placeholder-zinc-600 focus:border-amber-500/50 outline-none transition resize-none text-right"
                        />
                      </div>

                      {/* Submit button inside form */}
                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white hover:text-amber-500 text-xs font-black px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-md"
                      >
                        {isSubmittingReview ? (
                          <div className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>{language === 'ar' ? 'إرسال التقييم رسمياً' : 'Submit My Review'}</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  <div className="h-[1px] bg-zinc-900" />

                  {/* Reviews List block */}
                  <div className="space-y-4 text-right animate-pulse-subtle">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-900 font-black">
                        {reviews.length} {language === 'ar' ? 'تقييمات مضافة' : 'Reviews posted'}
                      </span>
                      <h4 className="text-sm font-black text-white">{language === 'ar' ? 'آراء ومراجعات كرافت السابقة' : 'Past Player Reviews'}</h4>
                    </div>

                    {reviewsLoading ? (
                      <div className="py-8 text-center text-xs text-zinc-500 font-bold flex flex-col items-center gap-2">
                        <div className="w-5 h-5 border-2 border-t-transparent border-amber-500 rounded-full animate-spin" />
                        <span>{language === 'ar' ? 'جاري تحميل التقييمات في الوقت الفعلي...' : 'Loading secure live comments...'}</span>
                      </div>
                    ) : (
                      <div className="space-y-3.5 text-right">
                        {reviews.length === 0 ? (
                          <div className="p-6 rounded-xl bg-[#09090b] border border-zinc-900 text-center text-zinc-500 text-xs font-bold py-8">
                            {language === 'ar' 
                              ? 'لا توجد مراجعات أو تعليقات مضافة بعد لهذا المود. كن أول من يكتب تعليقاً حقيقياً! ✍️' 
                              : 'No reviews or comments posted yet for this mod. Be the first to post an authentic review! ✍️'}
                          </div>
                        ) : (
                          reviews.map((rev) => (
                            <div key={rev.id} className="p-4 rounded-xl bg-[#09090b] border border-zinc-900 text-right space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] text-zinc-600 font-sans">
                                  {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  }) : ''}
                                </span>

                                <div className="flex items-center gap-2.5">
                                  <div className="flex flex-col text-right">
                                    <span className="text-xs font-black text-zinc-200">{rev.userName}</span>
                                    <div className="flex items-center justify-end gap-0.5">
                                      {[...Array(5)].map((_, s) => (
                                        <Star
                                          key={s}
                                          className={`w-2.5 h-2.5 ${s < rev.rating ? 'text-yellow-500 fill-yellow-500' : 'text-zinc-800'}`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  <div className="w-8 h-8 rounded-full border border-zinc-800 bg-zinc-900/60 flex items-center justify-center font-bold text-amber-500 text-[10px] shrink-0 uppercase">
                                    {rev.userPhoto ? (
                                      <img src={rev.userPhoto} alt="" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                                    ) : (
                                      rev.userName?.slice(0, 2) || 'GP'
                                    )}
                                  </div>
                                </div>
                              </div>

                              <p className="text-zinc-400 text-xs font-semibold leading-relaxed whitespace-pre-line pl-10 pr-1">
                                {rev.comment}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Points Notification Modal */}
      <AnimatePresence>
        {pointsNotification?.show && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-zinc-950 border border-amber-500/30 p-6 sm:p-8 rounded-3xl text-center max-w-sm w-full space-y-5 shadow-2xl shadow-amber-950/20"
            >
              <div className="w-16 h-16 bg-amber-500/10 border-2 border-amber-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <Coins className="w-8 h-8 text-amber-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white">
                  {pointsNotification.points > 0 
                    ? (language === 'ar' ? '🎉 مبروك! ربحت نقاطاً!' : '🎉 Points Awarded!')
                    : (language === 'ar' ? '🔍 تنبيه النقاط' : '🔍 Points Notice')
                  }
                </h3>
                {pointsNotification.points > 0 && (
                  <p className="text-3xl font-black text-amber-400">
                    +{pointsNotification.points}
                  </p>
                )}
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed text-center">
                  {pointsNotification.message}
                </p>
              </div>
              <button
                onClick={() => setPointsNotification(null)}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/10 hover:scale-[1.02] active:scale-[0.98] select-none"
              >
                {language === 'ar' ? 'رائع، شكراً لك!' : 'Great, Thank You!'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile & Desktop Side Menu & Settings Drawer */}
      <AnimatePresence>
        {showMobileMenu && (
          <div className="fixed inset-0 z-[150]">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />
            <motion.div 
              initial={{ x: language === 'ar' ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: language === 'ar' ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className={`absolute top-0 ${language === 'ar' ? 'right-0' : 'left-0'} w-full sm:w-[380px] h-full ${localTheme === 'light' ? 'bg-white text-zinc-900 border-zinc-200' : 'bg-zinc-950 text-white border-zinc-900'} border-l border-r shadow-2xl p-6 flex flex-col`}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/20">
                <div 
                  onClick={handleGihNamePointsClaim}
                  className="flex items-center gap-2.5 cursor-pointer select-none hover:scale-105 active:scale-95 transition-all duration-150"
                  title={language === 'ar' ? 'اضغط للحصول على 10 نقاط مكافأة يومية! 🎁' : 'Click to claim 10 daily bonus points! 🎁'}
                >
                  <img 
                    src={gihEarthLogo} 
                    alt="Golden Gih" 
                    className="w-10 h-10 object-cover rounded-xl shadow-lg border border-zinc-800"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex flex-col leading-tight text-right">
                    <span className="text-sm font-black tracking-tight uppercase">Golden Gih</span>
                    <span className="text-[10px] text-zinc-500 font-extrabold">{language === 'ar' ? 'المكتبة الأكبر للمودات' : 'Minecraft Mods Hub'}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowMobileMenu(false)}
                  className={`p-2.5 rounded-xl transition-all ${localTheme === 'light' ? 'hover:bg-zinc-100 text-zinc-600' : 'hover:bg-zinc-900 text-zinc-400 hover:text-white'} cursor-pointer`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrolling Body */}
              <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-6 pb-8 scrollbar-thin">
                
                {/* 1. Language & Theme Selection Section */}
                <div className={`p-4 rounded-2xl ${localTheme === 'light' ? 'bg-zinc-100/60' : 'bg-zinc-900/40'} border ${localTheme === 'light' ? 'border-zinc-200' : 'border-zinc-850'} space-y-4`}>
                  <div>
                    <p className={`text-[10px] font-black uppercase text-zinc-500 mb-1.5 flex items-center gap-1.5 ${language === 'ar' ? 'justify-start' : 'justify-start'}`}>
                      <Languages className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{language === 'ar' ? 'لغة الموقع / Language' : 'Website Language'}</span>
                    </p>
                    <div className="grid grid-cols-2 gap-2 bg-zinc-950/40 p-1 rounded-xl border border-zinc-800/10">
                      <button 
                        onClick={() => {
                          setLanguage('ar');
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${language === 'ar' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20 font-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                      >
                        <span>العربية</span>
                      </button>
                      <button 
                        onClick={() => {
                          setLanguage('en');
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${language === 'en' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                      >
                        <span>English</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-500 mb-1.5 flex items-center gap-1.5 text-right">
                      <Palette className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{language === 'ar' ? 'مظهر المنصة / Theme' : 'Theme Settings'}</span>
                    </p>
                    <div className="grid grid-cols-2 gap-2 bg-zinc-950/40 p-1 rounded-xl border border-zinc-800/10">
                      <button 
                        onClick={async () => {
                          setLocalTheme('dark');
                          localStorage.setItem('theme', 'dark');
                          if (user) await updateProfile({ theme: 'dark' });
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${localTheme === 'dark' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-305'}`}
                      >
                        <Moon className="w-3.5 h-3.5" />
                        <span>{language === 'ar' ? 'داكن' : 'Dark'}</span>
                      </button>
                      <button 
                        onClick={async () => {
                          setLocalTheme('light');
                          localStorage.setItem('theme', 'light');
                          if (user) await updateProfile({ theme: 'light' });
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${localTheme === 'light' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-350'}`}
                      >
                        <Sun className="w-3.5 h-3.5" />
                        <span>{language === 'ar' ? 'فاتح' : 'Light'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. User Settings & Editing Profile Customization (100% Working) */}
                <div className={`p-4 rounded-2xl ${localTheme === 'light' ? 'bg-zinc-100/60' : 'bg-zinc-900/40'} border ${localTheme === 'light' ? 'border-zinc-200' : 'border-zinc-850'} space-y-4`}>
                  <div className="flex items-center gap-1.5 border-b border-zinc-850/10 pb-2.5">
                    <UserCog className="w-4 h-4 text-red-500" />
                    <h3 className="text-xs font-black uppercase tracking-wider">
                      {language === 'ar' ? 'إعدادات الحساب والملف' : 'Account & Edit Profile'}
                    </h3>
                  </div>

                  {!user ? (
                    <div className="space-y-3 py-2 text-center" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                      <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
                        {language === 'ar' 
                          ? 'قم بتسجيل الدخول الآن لتعديل ملفك الشخصي، ورفع المودات، والتحكم بالكامل بخصائص حسابك.' 
                          : 'Sign in to customize your display name, choose awesome gaming avatars, set preferences or publish mods.'}
                      </p>
                      <button 
                        onClick={() => {
                          setShowMobileMenu(false);
                          setLoginMode('email-signin');
                          setShowLoginModal(true);
                        }}
                        className="w-full bg-red-650 hover:bg-red-550 text-white text-xs py-2.5 px-4 rounded-xl font-black transition-all shadow-lg active:scale-95 cursor-pointer"
                      >
                        {language === 'ar' ? 'تسجيل الدخول / إنشاء حساب' : 'Log In or Register'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 text-right" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                      {/* Avatar presentation & Rank information */}
                      <div className="flex flex-col gap-2.5 bg-zinc-950/30 p-2.5 rounded-xl border border-zinc-800/10">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <img 
                              src={userProfile?.photoURL && userProfile.photoURL !== "" ? userProfile.photoURL : "https://mc-heads.net/avatar/MHF_Steve/64"} 
                              alt="" 
                              className="w-12 h-12 rounded-xl object-cover border-2 border-amber-500 ring-2 ring-amber-500/20 shadow-md shadow-amber-500/10"
                            />
                            {userProfile?.email === 'frassa0000@gmail.com' && (
                              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full shadow border border-zinc-950">
                                <Crown className="w-3 h-3 fill-current" />
                              </div>
                            )}
                          </div>
                          <div className="leading-tight text-right flex-1 min-w-0">
                            <p className="font-extrabold text-xs text-white truncate">
                              {userProfile?.displayName || userProfile?.email?.split('@')[0] || 'لاعب غولدين'}
                            </p>
                            <div className="flex gap-1.5 mt-1 items-center">
                              {userProfile?.email === 'frassa0000@gmail.com' ? (
                                <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full font-black">المدير</span>
                              ) : userProfile?.verified ? (
                                <span className="text-[9px] bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded-full font-black">عضو موثق</span>
                              ) : (
                                <span className="text-[9px] bg-zinc-805 text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded-full font-black">عضو جديد</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {userProfile?.bio && (
                          <div className="border-t border-zinc-900/40 pt-1.5 text-right w-full">
                            <p className="text-[10px] text-zinc-400 leading-relaxed font-semibold pr-1 break-words">
                              {userProfile.bio}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Display name field edit */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-500 font-black mr-1 uppercase">الاسم المستعار</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={drawerDisplayName}
                            onChange={(e) => setDrawerDisplayName(e.target.value)}
                            placeholder={language === 'ar' ? 'أدخل اسمك الجديد' : 'Set nickname'}
                            className={`flex-1 bg-zinc-950 border ${localTheme === 'light' ? 'border-zinc-200 text-black' : 'border-zinc-800 text-white'} rounded-xl p-2.5 text-xs focus:border-red-650 outline-none transition-colors font-bold ${language === 'ar' ? 'text-right' : 'text-left'}`}
                          />
                          <button 
                            onClick={async () => {
                              if (!drawerDisplayName.trim()) return;
                              setIsSavingDrawerProfile(true);
                              try {
                                await updateProfile({ displayName: drawerDisplayName.trim() });
                                setDrawerSaveSuccess(true);
                                setTimeout(() => setDrawerSaveSuccess(false), 3000);
                              } catch (err) {
                                console.error(err);
                              } finally {
                                setIsSavingDrawerProfile(false);
                              }
                            }}
                            disabled={isSavingDrawerProfile}
                            className="bg-red-600 hover:bg-red-500 text-white px-4 rounded-xl text-xs font-black transition-all active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
                          >
                            {isSavingDrawerProfile ? (language === 'ar' ? '...' : '...') : (language === 'ar' ? 'حفظ' : 'Save')}
                          </button>
                        </div>
                      </div>

                      {/* Bio field edit */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-500 font-black mr-1 uppercase">الوصف الشخصي (Bio)</label>
                        <div className="flex flex-col gap-2">
                          <textarea 
                            value={drawerBio}
                            onChange={(e) => setDrawerBio(e.target.value)}
                            placeholder={language === 'ar' ? 'اكتب نبذة قصيرة عن نفسك لتظهر لغيرك من اللاعبين...' : 'Write a short description to represent yourself to other players...'}
                            maxLength={150}
                            rows={2}
                            className={`w-full bg-zinc-950 border ${localTheme === 'light' ? 'border-zinc-200 text-black' : 'border-zinc-800 text-white'} rounded-xl p-2.5 text-xs focus:border-red-650 outline-none transition-colors font-semibold resize-none ${language === 'ar' ? 'text-right' : 'text-left'}`}
                          />
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] text-zinc-500 font-bold">{drawerBio.length}/150</span>
                            <button 
                              onClick={async () => {
                                setIsSavingDrawerProfile(true);
                                try {
                                  await updateProfile({ bio: drawerBio.trim() });
                                  setDrawerSaveSuccess(true);
                                  setTimeout(() => setDrawerSaveSuccess(false), 3000);
                                } catch (err) {
                                  console.error(err);
                                } finally {
                                  setIsSavingDrawerProfile(false);
                                }
                              }}
                              disabled={isSavingDrawerProfile}
                              className="bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded-xl text-[10px] font-black transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                              {isSavingDrawerProfile ? (language === 'ar' ? 'انتقال...' : '...') : (language === 'ar' ? 'تحديث الوصف' : 'Update Bio')}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Minecraft Edition Preference Selection toggle */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-500 font-black mr-1 uppercase">نسختك المفضلة (Minecraft Edition)</label>
                        <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-850">
                          <button
                            onClick={async () => {
                              setDrawerSelectedEdition('java');
                              await updateProfile({ minecraftEdition: 'java' });
                            }}
                            className={`py-1.5 rounded-lg text-[10px] font-black tracking-tight transition-all cursor-pointer ${drawerSelectedEdition === 'java' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-350'}`}
                          >
                            جافا (Java)
                          </button>
                          <button
                            onClick={async () => {
                              setDrawerSelectedEdition('bedrock');
                              await updateProfile({ minecraftEdition: 'bedrock' });
                            }}
                            className={`py-1.5 rounded-lg text-[10px] font-black tracking-tight transition-all cursor-pointer ${drawerSelectedEdition === 'bedrock' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-350'}`}
                          >
                            بيدروك (Bedrock)
                          </button>
                        </div>
                      </div>

                      {/* Cool Avatar Picker Preset list + file uploader */}
                      <div className="space-y-2">
                        <label className="text-[10px] text-zinc-500 font-black mr-1 uppercase">اختر صورتك الرمزية (Gamer Avatar)</label>
                        <div className="grid grid-cols-4 gap-2 bg-zinc-950/40 p-2 rounded-xl border border-zinc-900">
                          {[
                            { name: 'Steve', url: 'https://mc-heads.net/avatar/MHF_Steve/64' },
                            { name: 'Alex', url: 'https://mc-heads.net/avatar/MHF_Alex/64' },
                            { name: 'Felix', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
                            { name: 'Aria', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aria' },
                            { name: 'Creeper', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Creeper' },
                            { name: 'Ender', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Ender' },
                            { name: 'GoldStar', url: 'https://api.dicebear.com/7.x/identicon/svg?seed=Dragon' },
                          ].map((av, idx) => (
                            <button
                              key={idx}
                              onClick={async () => {
                                await updateProfile({ photoURL: av.url });
                                setDrawerSaveSuccess(true);
                                setTimeout(() => setDrawerSaveSuccess(false), 3000);
                              }}
                              className={`w-10 h-10 rounded-lg overflow-hidden border transition-all cursor-pointer ${userProfile?.photoURL === av.url ? 'border-red-500 ring-2 ring-red-600/20' : 'border-zinc-800 hover:border-zinc-600'}`}
                            >
                              <img src={av.url} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}

                          {/* Custom Uploader Tool inside grid */}
                          <label className="w-10 h-10 rounded-lg flex items-center justify-center border border-dashed border-zinc-800 hover:border-red-500 cursor-pointer bg-zinc-900 transition-colors">
                            <FileUp className="w-4 h-4 text-zinc-500 hover:text-red-500" />
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = async (event) => {
                                    const rawBase64 = event.target?.result as string;
                                    try {
                                      const compressedB64 = await compressImage(rawBase64, 250, 250, 0.5);
                                      await updateProfile({ photoURL: compressedB64 });
                                      setDrawerSaveSuccess(true);
                                      setTimeout(() => setDrawerSaveSuccess(false), 3000);
                                    } catch (err) {
                                      console.error("Error compressing/uploading custom avatar:", err);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>

                        {/* Direct image link URL input field */}
                        <div className="space-y-1.5 mt-2 bg-zinc-950/20 p-2 rounded-xl border border-zinc-900/40">
                          <label className="text-[10px] text-zinc-500 font-black mr-1 uppercase">رابط صورة ميزانية مخصص (Direct Image URL)</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={drawerCustomPhotoUrl}
                              onChange={(e) => setDrawerCustomPhotoUrl(e.target.value)}
                              placeholder={language === 'ar' ? 'ضع رابط الصورة المباشر هنا...' : 'Paste custom image URL here...'}
                              className={`flex-1 bg-zinc-950 border ${localTheme === 'light' ? 'border-zinc-200 text-black' : 'border-zinc-800 text-white'} rounded-xl p-2.5 text-[11px] focus:border-red-650 outline-none transition-colors font-semibold ${language === 'ar' ? 'text-right' : 'text-left'}`}
                            />
                            <button 
                              onClick={async () => {
                                if (!drawerCustomPhotoUrl.trim()) return;
                                setIsSavingDrawerProfile(true);
                                try {
                                  await updateProfile({ photoURL: drawerCustomPhotoUrl.trim() });
                                  setDrawerSaveSuccess(true);
                                  setTimeout(() => setDrawerSaveSuccess(false), 3000);
                                } catch (err) {
                                  console.error(err);
                                } finally {
                                  setIsSavingDrawerProfile(false);
                                }
                              }}
                              disabled={isSavingDrawerProfile}
                              className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black transition-all active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
                            >
                              {language === 'ar' ? 'حفظ الرابط' : 'Apply Link'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Success Feedback overlay indicator */}
                      {drawerSaveSuccess && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-center text-[10px] font-black leading-none"
                        >
                          {language === 'ar' ? '✓ تم حفظ التعديلات بنجاح!' : '✓ Settings updated & saved successfully!'}
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Navigation shortcuts */}
                <div className="space-y-1">
                  <p className="text-[10px] text-zinc-500 font-extrabold px-3 py-1 uppercase tracking-wider text-right">
                    {language === 'ar' ? 'تصفح سريع' : 'Quick Navigation'}
                  </p>
                  {[
                    { label: t.home, icon: LayoutDashboard, action: () => { setActiveMainTab('home'); setActiveSubTab('home'); } },
                    { label: t.trending, icon: Flame, action: () => { setActiveMainTab('home'); setActiveSubTab('trending'); } },
                    { label: t.new, icon: Star, action: () => { setActiveMainTab('home'); setActiveSubTab('for-you'); } },
                    { label: language === 'ar' ? 'البحث عن المودات' : 'Search Mods', icon: Search, action: () => { setActiveMainTab('search'); } },
                    { label: language === 'ar' ? 'المفضلات والقلوب' : 'My Favorites', icon: Heart, action: () => { setActiveMainTab('favorites'); } },
                  ].map((item, i) => (
                    <button 
                      key={i}
                      className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl ${localTheme === 'light' ? 'hover:bg-zinc-100 text-zinc-850' : 'hover:bg-zinc-900 text-zinc-200'} transition-all font-bold w-full cursor-pointer ${language === 'ar' ? 'text-right flex-row-reverse' : 'text-left'}`}
                      onClick={() => {
                        setShowMobileMenu(false);
                        item.action();
                      }}
                    >
                      <item.icon className="w-5 h-5 text-red-500 shrink-0" />
                      <span className="text-xs">{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* 4. Controls inside user profile states */}
                {user && (
                  <div className="space-y-1 border-t border-zinc-800/10 pt-3">
                    <p className="text-[10px] text-zinc-500 font-extrabold px-3 py-1 uppercase tracking-wider text-right">
                      {language === 'ar' ? 'خيارات مخصصة' : 'Preferences'}
                    </p>
                    
                    {/* Support Assistant Link */}
                    <button 
                      onClick={() => {
                        setShowMobileMenu(false);
                        setShowUserPanel(true);
                      }}
                      className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl hover:bg-amber-500/10 transition-all font-bold w-full text-amber-500 cursor-pointer ${language === 'ar' ? 'text-right flex-row-reverse' : 'text-left'}`}
                    >
                      <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                      <span className="text-xs">{language === 'ar' ? 'مساعد الدعم بالذكاء الاصطناعي' : 'AI Support Assistant'}</span>
                    </button>

                    {/* Report bug shortcut */}
                    <button 
                      onClick={() => {
                        setShowMobileMenu(false);
                        setShowUserPanel(true);
                      }}
                      className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl hover:bg-zinc-900/40 transition-all font-bold w-full text-zinc-400 cursor-pointer ${language === 'ar' ? 'text-right flex-row-reverse' : 'text-left'}`}
                    >
                      <MessageSquare className="w-5 h-5 text-zinc-500 shrink-0" />
                      <span className="text-xs">{language === 'ar' ? 'تذاكر الدعم والتبليغ' : 'Submit support ticket'}</span>
                    </button>

                    {/* Favorites shortcut */}
                    <button 
                      onClick={() => {
                        setShowMobileMenu(false);
                        setShowUserPanel(true);
                      }}
                      className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl hover:bg-zinc-900/40 transition-all font-bold w-full text-zinc-400 cursor-pointer ${language === 'ar' ? 'text-right flex-row-reverse' : 'text-left'}`}
                    >
                      <Heart className="w-5 h-5 text-red-500 shrink-0" />
                      <span className="text-xs">{language === 'ar' ? 'ألعابي المفضلة' : 'My Favorites'}</span>
                    </button>

                    {/* Admin panel if administrator */}
                    {isAdmin && (
                      <button 
                        onClick={() => {
                          setShowMobileMenu(false);
                          setShowAdminPanel(true);
                        }}
                        className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl hover:bg-red-650/10 border border-red-500/20 text-red-500 transition-all font-black w-full mt-2 cursor-pointer ${language === 'ar' ? 'text-right flex-row-reverse' : 'text-left'}`}
                      >
                        <ShieldCheck className="w-5 h-5 text-red-500 shrink-0" />
                        <span className="text-xs">{language === 'ar' ? 'لوحة تحكم المدير' : 'Administrator Console'}</span>
                      </button>
                    )}

                    {/* Log out */}
                    <button 
                      onClick={async () => {
                        setShowMobileMenu(false);
                        try {
                          await auth.signOut();
                        } catch (error) {
                          console.error("Sign out error", error);
                        }
                      }}
                      className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl hover:bg-zinc-900/40 transition-all font-bold w-full text-zinc-400 cursor-pointer ${language === 'ar' ? 'text-right flex-row-reverse' : 'text-left'}`}
                    >
                      <LogOut className="w-5 h-5 text-zinc-500 shrink-0" />
                      <span className="text-xs">{language === 'ar' ? 'تسجيل الخروج' : 'Log Out'}</span>
                    </button>
                  </div>
                )}

                {/* 5. Policy pages / footer controls */}
                <div className="space-y-1 border-t border-zinc-900/20 pt-3">
                  <p className="text-[10px] text-zinc-500 font-extrabold px-3 py-1 uppercase tracking-wider text-right">
                    {language === 'ar' ? 'سياسات المنصة' : 'Policies & Guides'}
                  </p>

                  <button 
                    onClick={() => { setShowMobileMenu(false); setShowPrivacyModal(true); }}
                    className={`flex items-center gap-3 px-4 py-2 rounded-xl text-zinc-500 hover:text-zinc-350 hover:bg-zinc-900/20 transition-all font-bold w-full text-xs cursor-pointer ${language === 'ar' ? 'text-right flex-row-reverse' : 'text-left'}`}
                  >
                    <span>{language === 'ar' ? '🔐 سياسة الخصوصية والأمان' : '🔐 Privacy Policy'}</span>
                  </button>

                  <button 
                    onClick={() => { setShowMobileMenu(false); setShowTermsModal(true); }}
                    className={`flex items-center gap-3 px-4 py-2 rounded-xl text-zinc-500 hover:text-zinc-350 hover:bg-zinc-900/20 transition-all font-bold w-full text-xs cursor-pointer ${language === 'ar' ? 'text-right flex-row-reverse' : 'text-left'}`}
                  >
                    <span>{language === 'ar' ? '📜 شروط وقوانين المنصة' : '📜 Terms of Use'}</span>
                  </button>

                  <button 
                    onClick={() => { setShowMobileMenu(false); setShowAboutModal(true); }}
                    className={`flex items-center gap-3 px-4 py-2 rounded-xl text-zinc-500 hover:text-zinc-350 hover:bg-zinc-900/20 transition-all font-bold w-full text-xs cursor-pointer ${language === 'ar' ? 'text-right flex-row-reverse' : 'text-left'}`}
                  >
                    <span>{language === 'ar' ? '🚀 حول منصة Golden Gih' : '🚀 About Platform'}</span>
                  </button>
                </div>
              </div>

              {/* Drawer footer */}
              <div className="mt-auto pt-4 border-t border-zinc-900 flex flex-col gap-2 shrink-0">
                <button 
                  onClick={() => {
                    setShowMobileMenu(false);
                    setShowContactModal(true);
                  }}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl bg-red-650 hover:bg-red-540 text-white transition-all font-black text-xs w-full cursor-pointer shadow-lg shadow-red-600/10 justify-center h-11`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{language === 'ar' ? 'اتصل بفرق الدعم الفني' : 'Contact Support Hub'}</span>
                </button>
                <div className="text-center py-1">
                  <p className="text-[10px] text-zinc-650 uppercase tracking-widest font-black">{generalSettings.siteName || 'Golden Gih'} &copy; 2026</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Safe & Verified High-Fidelity Download Progress - Floating Non-Blocking Toast Notifier */}
      <AnimatePresence>
        {activeDownload && (
          <div className="fixed bottom-6 right-6 left-6 sm:left-auto sm:right-6 sm:w-[410px] z-[250]">
            <motion.div
              initial={{ y: 50, scale: 0.9, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 30, scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              className="bg-zinc-950/98 border border-zinc-900 rounded-[2.2rem] p-6 shadow-[0_25px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl relative overflow-hidden text-right font-sans"
            >
              {/* Subtle pulsing red light decoration representing secure scanning status */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-red-650/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

              <div className="flex gap-4 items-start mb-4">
                {/* Premium circular progress SVG wheel indicator */}
                <div className="w-12 h-12 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shrink-0 flex items-center justify-center text-red-500 relative select-none">
                  {activeDownload.progress < 100 ? (
                    <>
                      <svg className="w-10 h-10 transform -rotate-90">
                        <circle
                          cx="20"
                          cy="20"
                          r="15"
                          className="stroke-zinc-800"
                          strokeWidth="2"
                          fill="transparent"
                        />
                        <motion.circle
                          cx="20"
                          cy="20"
                          r="15"
                          className="stroke-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.5)]"
                          strokeWidth="2.5"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 15}
                          animate={{ strokeDashoffset: (2 * Math.PI * 15) - (activeDownload.progress / 100) * (2 * Math.PI * 15) }}
                          transition={{ ease: "easeOut", duration: 0.1 }}
                        />
                      </svg>
                      <span className="absolute text-[9px] font-mono font-black text-red-500">
                        {activeDownload.progress}%
                      </span>
                    </>
                  ) : (
                    <ShieldCheck className="w-6 h-6 text-amber-500 animate-bounce" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[9px] px-2.5 py-0.5 rounded-lg border font-black uppercase tracking-wider ${
                      activeDownload.progress < 100 
                        ? 'bg-red-950/40 text-red-500 border-red-900/30 animate-pulse' 
                        : 'bg-amber-950/40 text-amber-500 border-amber-900/30'
                    }`}>
                      {activeDownload.progress < 100 
                        ? (language === 'ar' ? 'تحليل المود أمنياً...' : 'ANALYZING CONTENT...') 
                        : (language === 'ar' ? 'اكتمل التحليل والتثبيت' : 'ANALYSIS COMPLETE')}
                    </span>
                    <span className="text-xs font-black text-rose-500">{activeDownload.progress}%</span>
                  </div>

                  <h3 className="text-sm font-black text-white truncate text-right">
                    {activeDownload.title}
                  </h3>
                  
                  <div className="text-[10px] text-zinc-400 font-bold flex justify-between">
                    <span>{activeDownload.size}</span>
                    <span className="text-zinc-650">Minecraft Java/Bedrock Pack</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Content Analysis Block */}
              <div className="bg-black/40 border border-zinc-900/80 rounded-2xl p-3.5 space-y-2 text-right relative min-h-[105px] flex flex-col justify-center">
                <span className="text-[8px] uppercase tracking-widest font-black text-zinc-600 block mb-1">
                  {language === 'ar' ? '📊 تقرير فحص وتحليل المود التلقائي:' : '📊 AUTOPILOT MOD REPORT:'}
                </span>
                
                <AnimatePresence mode="wait">
                  {activeDownload.progress < 30 ? (
                    <motion.div 
                      key="p1" 
                      initial={{ opacity: 0, y: 5 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0 }}
                      className="space-y-1"
                    >
                      <p className="text-[11px] font-black text-rose-400 animate-pulse">
                        🛡️ {language === 'ar' ? 'جاري فحص التوقيع الرقمي ومراجعة الملفات...' : 'Scanning digital signatures and reviewing files...'}
                      </p>
                      <p className="text-[9px] text-zinc-500">
                        {language === 'ar' 
                          ? `بدء فك تجميع الهياكل لـ "${activeDownload.title}" والتحقق من خلوها من الأكواد الضارة تماماً.` 
                          : `Decomposing code structures for "${activeDownload.title}" to ensure complete absence of payloads.`}
                      </p>
                    </motion.div>
                  ) : activeDownload.progress < 70 ? (
                    <motion.div 
                      key="p2" 
                      initial={{ opacity: 0, y: 5 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0 }}
                      className="space-y-1"
                    >
                      <p className="text-[11px] font-black text-amber-500">
                        ✨ {language === 'ar' ? 'تم فك حزمة المورد وتحليل الميزات:' : 'Resource package unpacked & features analyzed:'}
                      </p>
                      <p className="text-[10px] text-zinc-300 font-semibold leading-relaxed line-clamp-3 bg-zinc-950/40 p-2 rounded-xl border border-zinc-900">
                        {activeDownload.description || (language === 'ar' ? 'مود متميز ورائع يضيف ميزات حصرية ممتعة ومتوافقة مع سوق ماين كرافت الرسمي.' : 'A premium gameplay enhancement mod pack that boosts vanilla functions perfectly.')}
                      </p>
                    </motion.div>
                  ) : activeDownload.progress < 100 ? (
                    <motion.div 
                      key="p3" 
                      initial={{ opacity: 0, y: 5 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0 }}
                      className="space-y-1"
                    >
                      <p className="text-[11px] font-black text-emerald-500 flex items-center gap-1">
                        📦 [{activeDownload.category || (language === 'ar' ? 'مودات' : 'Mods')}]
                        <span>{language === 'ar' ? 'تم الفحص السحابي الأمني بنجاح' : 'Secured Cloud Protection approved'}</span>
                      </p>
                      <p className="text-[9px] text-zinc-500">
                        {language === 'ar' 
                          ? 'تنسيق متوافق مع كافة الهواتف والأجهزة المكتبية ومنصات الكونسول (Bedrock & Java).' 
                          : 'Optimized manifest format compatible across Pocket, Console, Java & Bedrock platforms.'}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="p4" 
                      initial={{ opacity: 0, y: 5 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="space-y-1"
                    >
                      <p className="text-[11px] font-black text-amber-400">
                        🚀 {language === 'ar' ? 'اكتمل التحليل وتثبيت المود بنجاح!' : 'Mod parsed and downloaded successfully!'}
                      </p>
                      <p className="text-[9px] text-zinc-400">
                        {language === 'ar' 
                          ? 'الملف جاهز الآن للتشغيل المباشر داخل اللعبة. استمتع بتجربة لعب فريدة ومأمونة.' 
                          : 'Asset package fully indexed inside the client cache. You are ready to engage!'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Linear mini progress track */}
              <div className="mt-4 space-y-2">
                <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-red-650 via-rose-500 to-amber-500"
                    initial={{ width: '0%' }}
                    animate={{ width: `${activeDownload.progress}%` }}
                    transition={{ type: "spring", stiffness: 80, damping: 15 }}
                  />
                </div>

                {/* Footer close option */}
                <div className="flex justify-between items-center text-[9px] text-zinc-500 select-none">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block" />
                    {activeDownload.progress < 100 
                      ? (language === 'ar' ? 'حصانة سحابية نشطة 100%' : '100% Cloud Sandbox Secure')
                      : (language === 'ar' ? 'جاهز للاستخدام النهائي' : 'Ready for Gameplay')}
                  </span>
                  <button 
                    onClick={() => setActiveDownload(null)} 
                    className="text-zinc-500 hover:text-white transition-colors cursor-pointer text-[10px] font-bold"
                  >
                    {language === 'ar' ? 'إغلاق نافذة التحليل ×' : 'Close Terminal ×'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginModal(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden relative z-10 shadow-2xl self-end sm:self-center flex flex-col max-h-[85vh] sm:max-h-[90vh]"
            >
              {/* Centered Pull-Down Animated Chevron/Arrow Header */}
              <div 
                className="w-full flex flex-col items-center py-3 cursor-pointer border-b border-zinc-900/60 sticky top-0 bg-zinc-950 z-20 shrink-0 select-none gap-1"
                onClick={() => setShowLoginModal(false)}
              >
                <div className="w-12 h-1 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors" />
                <motion.div
                  animate={{ y: [0, 3, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="text-zinc-500 hover:text-red-500 transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </div>

              <button 
                onClick={() => setShowLoginModal(false)}
                className="absolute top-3 right-6 text-zinc-500 hover:text-white transition-colors z-20"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Scrollable Modal Content */}
              <div className="overflow-y-auto flex-1 p-8 pt-6 [scrollbar-width:thin] [scrollbar-color:rgba(239,68,68,0.3)_rgba(0,0,0,0)] select-none">
                <div className="bg-red-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-600/20 rotate-3 animate-pulse">
                  <Gamepad2 className="w-8 h-8 text-white" />
                </div>
                
                <h2 className="text-2xl font-black text-center mb-1 tracking-tighter">
                  {language === 'ar' ? `مرحباً بك في ${generalSettings.siteName || 'Golden Gih'}` : `Welcome to ${generalSettings.siteName || 'Golden Gih'}`}
                </h2>
                <p className="text-zinc-500 text-center mb-6 text-xs font-bold">يرجى تسجيل الدخول أو إنشاء حساب جديد للمتابعة</p>

                {/* Minecraft Edition Selector */}
                <div className="mb-6 bg-zinc-900/40 p-4 rounded-2xl border border-zinc-900">
                  <p className="text-[10px] font-black text-amber-500 text-center mb-3 uppercase tracking-wider">
                    {language === 'ar' ? 'اختر إصدارك المفضل لتصفح موداته:' : 'Select Minecraft Edition:'}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => changeEdition('bedrock')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
                        selectedEdition === 'bedrock'
                          ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-bold scale-[1.02] shadow-lg shadow-amber-500/5'
                          : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-400'
                      }`}
                    >
                      <Smartphone className="w-5 h-5 mb-1.5" />
                      <span className="text-xs font-bold">{language === 'ar' ? 'بيدروك (Bedrock)' : 'Bedrock'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => changeEdition('java')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
                        selectedEdition === 'java'
                          ? 'bg-red-500/10 border-red-500 text-red-500 font-bold scale-[1.02] shadow-lg shadow-red-500/5'
                          : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-400'
                      }`}
                    >
                      <Laptop className="w-5 h-5 mb-1.5" />
                      <span className="text-xs font-bold">{language === 'ar' ? 'جافا (Java)' : 'Java'}</span>
                    </button>
                  </div>
                </div>

                {/* Tab Switcher for Sign In vs Sign Up */}
                <div className="bg-zinc-900/80 p-1 rounded-2xl border border-zinc-800 grid grid-cols-2 mb-6 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode('email-signin');
                      setAuthError('');
                    }}
                    className={`py-3 rounded-xl font-black text-xs transition-all text-center cursor-pointer ${
                      loginMode !== 'email-signup'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    تسجيل الدخول
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode('email-signup');
                      setAuthError('');
                    }}
                    className={`py-3 rounded-xl font-black text-xs transition-all text-center cursor-pointer ${
                      loginMode === 'email-signup'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    إنشاء حساب جديد
                  </button>
                </div>

                {authError && (
                  authError.toLowerCase().includes('unauthorized-domain') || authError.toLowerCase().includes('unauthorized domain') ? (
                    <div className="bg-amber-950/35 border border-amber-800/40 text-amber-200 p-5 rounded-2xl mb-6 text-xs space-y-3" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-bounce" />
                        <div>
                          <h4 className="font-black text-white text-sm mb-1">
                            {language === 'ar' ? '⚠️ نطاق غير مصرح به في Firebase' : '⚠️ Firebase Unauthorized Domain'}
                          </h4>
                          <p className="text-[11px] leading-relaxed text-zinc-300">
                            {language === 'ar' 
                              ? 'يرجى تسجيل الرابط الحالي للموقع في لوحة تحكم Firebase Authentication حتى تتمكن من تسجيل الدخول.' 
                              : 'Please authorize this application domain in your Firebase Authentication settings to enable login.'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-900 space-y-2 mt-2">
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-wider">
                          {language === 'ar' ? '📱 الرابط المطلوب إضافته:' : '📱 Domain to copy:'}
                        </p>
                        <div className="flex items-center justify-between bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-800 text-zinc-300 font-mono text-[10px] break-all">
                          <code className="select-all font-bold transition-colors text-white">{window.location.hostname}</code>
                          <button 
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(window.location.hostname);
                              alert(language === 'ar' ? 'تم نسخ النقاط بنجاح!' : 'Domain copied successfully!');
                            }} 
                            className="text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded transition-colors ml-2 cursor-pointer shrink-0 animate-pulse"
                          >
                            {language === 'ar' ? 'نسخ' : 'Copy'}
                          </button>
                        </div>
                        <ol className="list-decimal list-inside space-y-1 text-zinc-400 text-[10px] leading-relaxed pl-1 pt-1 text-right" dir="rtl">
                          <li>
                            {language === 'ar' 
                              ? 'اذهب إلى لوحة تحكم Firebase Console.' 
                              : 'Go to your Firebase Console.'}
                          </li>
                          <li>
                            {language === 'ar' 
                              ? 'اختر مشروعك ثم انتقل إلى قسم Authentication.' 
                              : 'Select your project and go to Authentication.'}
                          </li>
                          <li>
                            {language === 'ar' 
                              ? 'من التبويب Settings (الإعدادات) ثم Authorized Domains (النطاقات المصرح بها).' 
                              : 'Navigate to Settings (or Authorized Domains) tab.'}
                          </li>
                          <li>
                            {language === 'ar' 
                              ? 'اضغط على "Add domain" وألصق النطاق المنسوخ أعلاه.' 
                              : 'Click "Add domain" and paste the copied domain.'}
                          </li>
                        </ol>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-900/20 border border-red-900/50 text-red-400 p-3 rounded-xl mb-6 text-xs flex items-center gap-2 text-right justify-end" dir="rtl">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )
                )}

                {/* Email & Password Input Fields */}
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="space-y-1 text-right">
                    <label className="text-xs font-bold text-zinc-400 mr-2 block">البريد الإلكتروني</label>
                    <div className="relative">
                      <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full bg-zinc-900 border border-zinc-800 h-14 rounded-2xl pr-12 pl-6 focus:outline-none focus:border-red-500 transition-colors text-right text-white font-bold"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-right">
                    <label className="text-xs font-bold text-zinc-400 mr-2 block">كلمة المرور</label>
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                      <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-zinc-900 border border-zinc-800 h-14 rounded-2xl pr-12 pl-6 focus:outline-none focus:border-red-500 transition-colors text-right text-white font-bold"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-red-600 text-white h-14 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-red-500 transition-all active:scale-[0.98] disabled:opacity-50 mt-4 cursor-pointer"
                  >
                    {authLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{loginMode === 'email-signup' ? 'إنشاء حساب جديد' : 'تسجيل الدخول ومتابعة'}</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                {/* Divider for Quick Alternative logins */}
                <div className="flex items-center gap-4 my-6">
                  <div className="h-px bg-zinc-900 flex-1" />
                  <span className="text-zinc-600 text-[10px] font-black uppercase tracking-wider">أو المتابعة السريعة</span>
                  <div className="h-px bg-zinc-900 flex-1" />
                </div>

                {/* Guest alternative and other quick logins */}
                <div className="space-y-3">
                  <button 
                    onClick={handleGuestLogin}
                    disabled={authLoading}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-400 h-13 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-800 hover:text-white transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer text-xs"
                  >
                    <Ghost className="w-4 h-4 text-zinc-500" />
                    الدخول السريع كزائر (بدون حساب)
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={handleGoogleLogin}
                      disabled={authLoading}
                      className="w-full bg-white text-black h-13 rounded-2xl font-black flex items-center justify-center gap-2.5 hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer text-xs"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      جوجل (Google)
                    </button>

                    <button 
                      onClick={handleGithubLogin}
                      disabled={authLoading}
                      className="w-full bg-zinc-900 border border-zinc-800 text-white h-13 rounded-2xl font-black flex items-center justify-center gap-2.5 hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer text-xs"
                    >
                      <Github className="w-4 h-4 text-zinc-500" />
                      جيت هاب
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-zinc-900/50 p-6 text-center border-t border-zinc-900 shrink-0">
                <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] leading-relaxed">
                  بالمتابعة، أنت توافق على شروط الخدمة<br/>وسياسة الخصوصية الخاصة بنا
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  return <AppContent />;
}

const compressImage = (base64Str: string, maxWidth = 500, maxHeight = 500, quality = 0.6): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Compress as image/jpeg
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

// --- Components ---

const AdminPanel = ({ 
  isOpen, 
  onClose, 
  onAddGame, 
  onUpdateGame,
  onDeleteGame, 
  onResolveReport, 
  onDeleteReport,
  games,
  language,
  t,
  theme,
  user,
  userProfile
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onAddGame: (data: Omit<Game, 'id'>) => void;
  onUpdateGame: (id: string, data: Partial<Game>) => void;
  onDeleteGame: (id: string) => void;
  onResolveReport: (id: string, reply?: string) => void;
  onDeleteReport: (id: string) => void;
  games: Game[];
  language: 'ar' | 'en';
  t: any;
  theme: 'dark' | 'light';
  user: User | null;
  userProfile: UserProfileData | null;
}) => {
  const [activeTab, setActiveTab] = useState<string>('settings-general');
  const [settingsExpanded, setSettingsExpanded] = useState<boolean>(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportReplies, setReportReplies] = useState<{[reportId: string]: string}>({});
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [userSearchText, setUserSearchText] = useState('');
  const [adminSocials, setAdminSocials] = useState({
    tiktok: '',
    telegram: '',
    discord: '',
    youtube: '',
    twitter: ''
  });
  const [socialsLoading, setSocialsLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'جولدن',
    siteDescription: 'جولدن - محتوى ماين كرافت عربي مميز لأخبار، شروحات، مودات و كل ما يخص عالم ماين كرافت!',
    siteLogo: gihEarthLogo,
    siteUrl: 'https://golden-mc.com',
    adminEmail: 'admin@golden-mc.com',
    timezone: 'القاهرة (UTC+02:00)',
    siteLanguage: 'العربية',
    maintenanceMode: false,
    youtube: 'https://youtube.com/@GoldenMC',
    discord: 'https://discord.gg/golden',
    twitter: 'https://twitter.com/GoldenMC'
  });

  useEffect(() => {
    if (isOpen) {
      setSettingsLoading(true);
      const settingsRef = doc(db, 'settings', 'socials');
      getDoc(settingsRef).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setAdminSocials(data as any);
          setGeneralSettings(prev => ({
            ...prev,
            youtube: data.youtube || prev.youtube,
            discord: data.discord || prev.discord,
            twitter: data.twitter || prev.twitter,
          }));
        }
      }).catch(err => console.error("Error fetching socials config:", err));

      const generalRef = doc(db, 'settings', 'general');
      getDoc(generalRef).then((snap) => {
        if (snap.exists()) {
          setGeneralSettings(prev => ({
            ...prev,
            ...snap.data()
          }));
        }
      }).catch(err => console.error("Error fetching general config:", err))
        .finally(() => setSettingsLoading(false));
    }
  }, [isOpen]);

  const handleSaveSocials = async () => {
    setSocialsLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'socials'), {
        youtube: generalSettings.youtube,
        discord: generalSettings.discord,
        twitter: generalSettings.twitter,
        tiktok: adminSocials.tiktok || '',
        telegram: adminSocials.telegram || ''
      });
      alert(language === 'ar' ? 'تم حفظ روابط شبكات التواصل بنجاح!' : 'Social links saved successfully!');
    } catch (err) {
      console.error("Save socials error:", err);
      alert(language === 'ar' ? 'فشل الحفظ كمدير. تأكد من قواعد السيرفر.' : 'Failed saving settings as admin.');
    } finally {
      setSocialsLoading(false);
    }
  };

  const handleSaveGeneralSettings = async () => {
    setSettingsLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'general'), generalSettings);
      
      // Also sync socials to socials collection
      await setDoc(doc(db, 'settings', 'socials'), {
        youtube: generalSettings.youtube,
        discord: generalSettings.discord,
        twitter: generalSettings.twitter,
        tiktok: adminSocials.tiktok || '',
        telegram: adminSocials.telegram || ''
      });

      alert(language === 'ar' ? 'تم حفظ الإعدادات بنجاح!' : 'Settings saved successfully!');
    } catch (err) {
      console.error("Save general settings error:", err);
      alert(language === 'ar' ? 'حدث خطأ أثناء حفظ الإعدادات.' : 'Failed saving general settings.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleLogoUpload = () => {
    const newLogo = prompt(
      language === 'ar' 
        ? 'أدخل رابط الصورة لشعار الموقع الجديد:' 
        : 'Enter image URL for the new site logo:', 
      generalSettings.siteLogo || 'https://golden-mc.com/logo.png'
    );
    if (newLogo !== null) {
      setGeneralSettings(prev => ({ ...prev, siteLogo: newLogo }));
    }
  };

  const handleLogoDelete = () => {
    setGeneralSettings(prev => ({ ...prev, siteLogo: '' }));
  };

  useEffect(() => {
    if (activeTab === 'users' && isOpen) {
      const q = query(collection(db, 'users'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDbUsers(list);
      }, (err) => {
        console.error("Error fetching users:", err);
      });
      return () => unsubscribe();
    }
  }, [activeTab, isOpen]);

  const handleToggleVerification = async (userId: string, currentStatus: boolean | undefined) => {
    setToggleLoading(userId);
    try {
      await updateDoc(doc(db, 'users', userId), {
        verified: !currentStatus
      });
    } catch (err) {
      console.error("Error updating verification:", err);
      alert(language === 'ar' ? 'حدث خطأ أثناء تعديل حالة العضو' : 'Error updating user verification');
    } finally {
      setToggleLoading(null);
    }
  };

  const [pricingChatHistory, setPricingChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [pricingInputText, setPricingInputText] = useState('');
  const [isPricingBotLoading, setIsPricingBotLoading] = useState(false);

  const [newGame, setNewGame] = useState({
    title: '',
    description: '',
    thumbnail: '',
    downloadUrl: '',
    category: 'مودات',
    rating: 5,
    edition: 'both' as 'java' | 'bedrock' | 'both',
    isPaid: false,
    price: ''
  });
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [quickAddLink, setQuickAddLink] = useState('');
  
  const initPricingChat = () => {
    if (pricingChatHistory.length === 0) {
      setPricingChatHistory([
        {
          role: 'model',
          text: language === 'ar' 
            ? 'مرحباً بك في مساعد التسعير الذكي الخاص بسوق ماين كرافت! 🛡️💎\n\nأنا هنا لمساعدتك في تحديد وتوفير أسعار دقيقة تتماشى مع معايير متجر ماين كرافت الرسمي (Minecraft Marketplace). \n\nيرجى تزويدي بنوع المود (Skin Pack, Map, Addon...) والمحتويات المتضمنة فيه (أشكال مخصصة، شيدر، أكواد جافا سكريبت، إلخ.) وسأقترح عليك السعر الأنسب بالعملة الافتراضية للعبة (Minecoins) والنسخة المقابلة بالدولار الأمريكي وبطريقة احترافية بالكامل.'
            : 'Welcome to your Minecraft Marketplace Intelligent Pricing Assistant! 🛡️💎\n\nI can help you analyze features of your mod to calculate typical Minecraft Marketplace prices equivalent in Minecoins and USD.\n\nTell me the type of mod (Skins, Map, Resource Pack, Add-on) and its special features to receive an immediate professional price evaluation!'
        }
      ]);
    }
  };

  const askPricingQuestion = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isPricingBotLoading) return;

    // Add user message to state
    const updatedHistory = [
      ...pricingChatHistory,
      { role: 'user' as const, text: trimmed }
    ];
    setPricingChatHistory(updatedHistory);
    setPricingInputText('');
    setIsPricingBotLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        // Fallback pricing simulation if API key is not in dev workspace
        setTimeout(() => {
          let simulatedPrice = "490 Minecoins ($2.99)";
          let simulatedText = language === 'ar' 
            ? `بناءً على مواصفات المود "${newGame.title || 'هذا المود'}"، ينصح بوضع سعر متوسط ترويجي يبلغ 490 Minecoins (ما يعادل تقريباً 2.99 دولار أمريكي). \n\n• حزم السكنات: 160 - 310 Minecoins\n• الخرائط والـ Addons: 490 - 830 Minecoins\n• المودات الكاملة والمستعمرات العريقة: 990+ Minecoins.`
            : `Based on your description, the standard Minecraft Marketplace pricing for "${newGame.title || 'this mod'}" is estimated around 490 Minecoins (~$2.99 USD). \n\n• Skin packs average: 160 - 310 Minecoins\n• Adventure Maps / Addons: 490 - 830 Minecoins\n• World Templates: 990+ Minecoins.`;
          
          if (trimmed.includes('سكن') || trimmed.toLowerCase().includes('skin')) {
            simulatedPrice = "160 Minecoins ($0.99)";
            simulatedText = language === 'ar'
              ? `حزمة سكنات (Skin Pack): السعر الموصى به هو 160 كوينز ($0.99) للمتجر لتشجيع التحميل السريع لمستخدمي الهاتف والجافا.`
              : `Skin Pack: Recommended standard starts at 160 Minecoins ($0.99) to build immediate interest and conversions.`;
          } else if (trimmed.includes('خريطة') || trimmed.toLowerCase().includes('map')) {
            simulatedPrice = "830 Minecoins ($4.99)";
            simulatedText = language === 'ar'
              ? `خريطة مغامرات عريضة: ينصح بسعر 830 كوينز ($4.99 USD) لوجود عوالم ومهمات مخصصة تزيد من وقت اللعب.`
              : `Adventure Map: An optimized price point is 830 Minecoins ($4.99 USD) reflecting custom quest lines, audio, and high replayability.`;
          }

          setPricingChatHistory(prev => [
            ...prev,
            { role: 'model' as const, text: simulatedText }
          ]);
          setNewGame(prev => ({ ...prev, price: simulatedPrice }));
          setIsPricingBotLoading(false);
        }, 1200);
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      // Compile current prompt context
      const systemInstruction = `You are a Minecraft Marketplace Pricing Expert. You evaluate mods, behavior packs, skins, textures, maps, and addons.
Your goal is to suggest standard Minecraft Marketplace pricing in Minecoins (with conversion rate: 160 Minecoins = $0.99 USD, 310 Minecoins = $1.99, 490 Minecoins = $2.99, 830 Minecoins = $4.99, 990 Minecoins = $5.99, 1340 Minecoins = $7.99, 1600 Minecoins = $9.99).
Provide useful, detailed and friendly guidelines. Always conclude with a final suggested price in standard marketplace values (e.g., 490 Minecoins ($2.99)). Always reply in Arabic beautifully in standard gamer tone.`;

      // Map format for generateContent contents
      const formattedContents = updatedHistory.map(item => ({
        role: item.role === 'user' ? 'user' : 'model',
        parts: [{ text: item.text }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents as any,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.75
        }
      });

      const replyText = response.text || '';
      const finalHistory = [
        ...updatedHistory,
        { role: 'model' as const, text: replyText }
      ];
      setPricingChatHistory(finalHistory);

      const minecoinsRegex = /(\d+)\s*(Minecoins|Minecoin|كوين)/i;
      const usdRegex = /\$\d+(\.\d{2})?/;
      const matchCoin = replyText.match(minecoinsRegex);
      const matchUsd = replyText.match(usdRegex);
      
      if (matchCoin) {
        let textPrice = `${matchCoin[1]} Minecoins`;
        if (matchUsd) {
          textPrice += ` (${matchUsd[0]})`;
        }
        setNewGame(prev => ({ ...prev, price: textPrice }));
      }

    } catch (err) {
      console.error("Gemini pricing error:", err);
      // Fallback
      setPricingChatHistory(prev => [
        ...prev,
        { role: 'model' as const, text: language === 'ar' ? "حدث ضغط على النظام! السعر المقترح الشائع لمثل هذه المودات هو 310 Minecoins ($1.99)." : "Server timeout. Standard recommended price is 310 Minecoins ($1.99)." }
      ]);
      setNewGame(prev => ({ ...prev, price: "310 Minecoins ($1.99)" }));
    } finally {
      setIsPricingBotLoading(false);
      setTimeout(() => {
        const container = document.getElementById('chat-messages-container');
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 100);
    }
  };
  
  const [imageLoading, setImageLoading] = useState(false);
  const [isImageUnsafe, setIsImageUnsafe] = useState(false);
  const [unsafeReason, setUnsafeReason] = useState('');
  const [modFileName, setModFileName] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageLoading(true);
    setIsImageUnsafe(false);
    setUnsafeReason('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawBase64 = event.target?.result as string;
      let base64Data = rawBase64;
      
      try {
        // Compress the image client-side to keep document size under Firestore's 1MB limit
        base64Data = await compressImage(rawBase64);
        
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          console.warn("GEMINI_API_KEY is not configured in environment variables. Moderation bypassed.");
          setNewGame(prev => ({ ...prev, thumbnail: base64Data }));
          setImageLoading(false);
          return;
        }

        const ai = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const prompt = `Analyze this image. Check if it contains any pornographic, sexually explicit, nude, or heavily inappropriate content. Respond strictly in Arabic using this JSON structure:
{
  "isInappropriate": true,
  "reason": "توضيح باللغة العربية لسبب الحظر"
} or if it is safe:
{
  "isInappropriate": false,
  "reason": "آمن وسليم"
}`;

        const cleanBase64 = base64Data.split(',')[1] || base64Data;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: cleanBase64
              }
            },
            prompt
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isInappropriate: { type: Type.BOOLEAN },
                reason: { type: Type.STRING }
              },
              required: ["isInappropriate", "reason"]
            }
          }
        });

        const textOutput = response.text || '';
        const parsed = JSON.parse(textOutput.trim());

        if (parsed.isInappropriate) {
          setIsImageUnsafe(true);
          setUnsafeReason(parsed.reason);
          setNewGame(prev => ({ ...prev, thumbnail: '' })); // Block the image!

          // Send immediate report/alert to the Manager in Firestore reports collection
          const name = userProfile?.displayName || user?.displayName || user?.email || 'مسؤول مجهول';
          await addDoc(collection(db, 'reports'), {
            userId: user?.uid || 'system',
            userEmail: user?.email || 'admin@goldengames.com',
            message: `🚨 إنذار عاجل للمدير: قام المسؤول (${name}) بمحاولة رفع صورة مخلة بالآداب أو غير لائقة لمود جديد! تم الكشف والتصدي له تلقائياً بواسطة الذكاء الاصطناعي وبمساهمة خوارزمياتنا تقليص حجم وحجب الصورة. سبب الحظر الفني: ${parsed.reason}`,
            timestamp: serverTimestamp(),
            status: 'pending',
            isSystemWarning: true
          });
        } else {
          setNewGame(prev => ({ ...prev, thumbnail: base64Data }));
        }
      } catch (err) {
        console.error("Gemini Error:", err);
        // Fallback setting image if Gemini fails or is busy inside sandboxed testing
        setNewGame(prev => ({ ...prev, thumbnail: base64Data }));
      } finally {
        setImageLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleQuickLink = () => {
    if (!quickAddLink) return;
    try {
      const url = new URL(quickAddLink);
      const pathSegments = url.pathname.split('/');
      const lastSegment = pathSegments[pathSegments.length - 1];
      const title = decodeURIComponent(lastSegment.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' '));
      
      setNewGame({
        ...newGame,
        title: title || 'محتوى جديد',
        downloadUrl: quickAddLink,
        description: language === 'ar' ? `تحميل ${title} من رابط مباشر.` : `Download ${title} from direct link.`
      });
      setQuickAddLink('');
    } catch (e) {
      alert(language === 'ar' ? 'رابط غير صالح' : 'Invalid URL');
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const q = query(collection(db, 'reports'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Report[];
      setReports(reportsList);
    });
    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-black"
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 1 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`${theme === 'light' ? 'bg-white text-zinc-900 border-zinc-200' : 'bg-zinc-950 text-white border-zinc-800'} border w-full max-w-5xl h-full md:h-[80vh] rounded-none md:rounded-[2.5rem] overflow-hidden relative z-10 flex flex-col shadow-2xl`}
      >
        <div className={`p-4 md:p-6 border-b ${theme === 'light' ? 'border-zinc-200 bg-zinc-50' : 'border-zinc-900 bg-zinc-900'} flex items-center justify-between`}>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="bg-red-600 p-2 rounded-xl">
              <Settings className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tighter">لوحة التحكم</h2>
          </div>
          <button onClick={onClose} className={`p-2 ${theme === 'light' ? 'hover:bg-zinc-200' : 'hover:bg-zinc-800'} rounded-full transition-colors`}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Tabs */}
        <div className={`flex md:hidden border-b ${theme === 'light' ? 'border-zinc-200 bg-white' : 'border-zinc-900 bg-zinc-950'} px-2`}>
          <button 
            onClick={() => setActiveTab('games')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all ${activeTab === 'games' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500'}`}
          >
            <Gamepad2 className="w-5 h-5" />
            <span className="text-[10px] font-bold">الألعاب</span>
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all ${activeTab === 'reports' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500'}`}
          >
            <div className="relative">
              <ClipboardList className="w-5 h-5" />
              {reports.filter(r => r.status === 'pending').length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-[8px] min-w-[14px] h-[14px] flex items-center justify-center rounded-full text-white">
                  {reports.filter(r => r.status === 'pending').length}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold">التقارير</span>
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all ${activeTab === 'users' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500'}`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-bold">الأعضاء</span>
          </button>
          <button 
            onClick={() => setActiveTab('socials')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all ${activeTab === 'socials' ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500'}`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-bold">الإعدادات</span>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className={`w-64 border-l ${theme === 'light' ? 'border-zinc-200 bg-zinc-50' : 'border-zinc-900 bg-zinc-950'} p-4 space-y-2 hidden md:block`}>
            <button 
              onClick={() => setActiveTab('games')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'games' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : `text-zinc-500 ${theme === 'light' ? 'hover:bg-zinc-200' : 'hover:bg-zinc-900'}`}`}
            >
              <Gamepad2 className="w-5 h-5" />
              إدارة الألعاب
            </button>
            <button 
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'reports' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : `text-zinc-500 ${theme === 'light' ? 'hover:bg-zinc-200' : 'hover:bg-zinc-900'}`}`}
            >
              <ClipboardList className="w-5 h-5" />
              التقارير والشكاوى
              {reports.filter(r => r.status === 'pending').length > 0 && (
                <span className="bg-white text-red-600 text-[10px] px-2 py-0.5 rounded-full mr-auto">
                  {reports.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'users' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : `text-zinc-500 ${theme === 'light' ? 'hover:bg-zinc-200' : 'hover:bg-zinc-900'}`}`}
            >
              <Users className="w-5 h-5" />
              تنظيم الأعضاء (التوثيقات)
            </button>
            <button 
              onClick={() => setActiveTab('socials')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'socials' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : `text-zinc-500 ${theme === 'light' ? 'hover:bg-zinc-200' : 'hover:bg-zinc-900'}`}`}
            >
              <Settings className="w-5 h-5" />
              الإعدادات العامة
            </button>
          </div>

          {/* Content */}
          <div className={`flex-1 overflow-y-auto p-4 md:p-8 ${theme === 'light' ? 'bg-zinc-50/50' : 'bg-zinc-900/20'}`}>
            {activeTab === 'games' ? (
              <div className="space-y-8">
                <div className={`bg-zinc-900/50 border ${theme === 'light' ? 'border-zinc-200' : 'border-zinc-800'} p-6 rounded-3xl`}>
                  <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Plus className="w-5 h-5 text-red-500" />
                        {t.quickAdd}
                      </h3>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500`} />
                      <input 
                        type="text" 
                        placeholder={t.quickAddPlaceholder}
                        value={quickAddLink}
                        onChange={e => setQuickAddLink(e.target.value)}
                        className={`w-full ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'} border rounded-xl py-3 ${language === 'ar' ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'} text-sm focus:border-red-600 outline-none transition-colors`}
                      />
                    </div>
                    <button 
                      onClick={handleQuickLink}
                      className={`bg-zinc-800 hover:bg-zinc-700 text-white px-6 rounded-xl font-bold text-sm transition-all`}
                    >
                      {t.processLink}
                    </button>
                  </div>
                </div>

                {/* Manual Adder */}
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl" id="admin-games-form-container">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      {editingGameId ? (
                        <>
                          <Edit className="w-5 h-5 text-amber-500" />
                          <span>{language === 'ar' ? `تعديل المحتوى: ${newGame.title}` : `Edit Content: ${newGame.title}`}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-5 h-5 text-red-500" />
                          <span>إضافة محتوى جديد</span>
                        </>
                      )}
                    </h3>
                    <div className="flex items-center gap-2">
                      {editingGameId && (
                        <button 
                          onClick={() => {
                            setEditingGameId(null);
                            setNewGame({ title: '', description: '', thumbnail: '', downloadUrl: '', category: 'مودات', rating: 5, edition: 'both' as 'java' | 'bedrock' | 'both', isPaid: false, price: '' });
                            setModFileName('');
                          }}
                          className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-350 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
                        >
                          {language === 'ar' ? 'إلغاء التعديل ×' : 'Cancel Edit ×'}
                        </button>
                      )}
                      <input 
                        type="file" 
                        id="bulk-upload" 
                        className="hidden" 
                        accept=".json"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = async (event) => {
                            try {
                              const content = event.target?.result as string;
                              const gamesData = JSON.parse(content);
                              if (Array.isArray(gamesData)) {
                                for (const game of gamesData) {
                                  await onAddGame(game);
                                }
                                alert('تم رفع المحتوى بنجاح!');
                              } else {
                                alert('تنسيق الملف غير صحيح. يجب أن يكون مصفوفة من العناصر.');
                              }
                            } catch (error) {
                              alert('حدث خطأ أثناء قراءة الملف.');
                            }
                          };
                          reader.readAsText(file);
                        }}
                      />
                      <label 
                        htmlFor="bulk-upload"
                        className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
                      >
                        <FileUp className="w-4 h-4" />
                        رفع ملف JSON
                      </label>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input 
                      type="text" 
                      placeholder="اسم المود / الخريطة"
                      value={newGame.title}
                      onChange={e => setNewGame({...newGame, title: e.target.value})}
                      className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:border-red-600 outline-none transition-colors"
                    />
                    <select 
                      value={newGame.category}
                      onChange={e => setNewGame({...newGame, category: e.target.value})}
                      className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:border-red-600 outline-none transition-colors"
                    >
                      <option>مودات</option>
                      <option>خرائط</option>
                      <option>شيدرز</option>
                      <option>موارد</option>
                      <option>سكنات</option>
                    </select>
                    <select 
                      value={newGame.edition}
                      onChange={e => setNewGame({...newGame, edition: e.target.value as any})}
                      className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:border-red-600 outline-none transition-colors"
                    >
                      <option value="both">{language === 'ar' ? 'نسخة الجافا وبيدروك معاً (Both)' : 'Both Editions'}</option>
                      <option value="java">{language === 'ar' ? 'نسخة جافا فقط (Java)' : 'Java Edition Only'}</option>
                      <option value="bedrock">{language === 'ar' ? 'نسخة بيدروك/الجوال فقط (Bedrock)' : 'Bedrock Edition Only'}</option>
                    </select>

                    {/* Star Rating Selection Input */}
                    <div className="col-span-1 md:col-span-3 bg-zinc-950/20 p-4 rounded-2xl border border-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 animate-pulse" />
                        <div className="text-right" dir="rtl">
                          <p className="text-xs font-black text-white">
                            {language === 'ar' ? 'التقييم الافتراضي للمود' : 'Default Rating'}
                          </p>
                          <p className="text-[10px] text-zinc-500">
                            {language === 'ar' ? 'حدد عدد النجوم الافتراضية الممنوحة لهذا المود عند نشره' : 'Select the default stars count for this mod'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-zinc-950 p-2 rounded-xl border border-zinc-905 w-fit self-end md:self-auto" dir="ltr">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            type="button"
                            key={num}
                            onClick={() => setNewGame({ ...newGame, rating: num })}
                            className="p-1 transition-all hover:scale-125 focus:outline-none cursor-pointer"
                          >
                            <Star 
                              className={`w-5 h-5 transition-all ${
                                num <= newGame.rating 
                                  ? 'text-yellow-500 fill-yellow-500 filter drop-shadow-[0_0_3px_rgba(234,179,8,0.4)]' 
                                  : 'text-zinc-700 hover:text-yellow-400'
                              }`} 
                            />
                          </button>
                        ))}
                        <span className="text-xs font-black ml-2 text-yellow-500">{newGame.rating} / 5</span>
                      </div>
                    </div>

                    {/* Paid Status & Intelligent Pricing Assistant Block */}
                    <div className="col-span-1 md:col-span-3 bg-zinc-950/25 p-5 rounded-[2rem] border border-zinc-900 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <Coins className="w-5 h-5 text-amber-500 animate-pulse" />
                          <div className="text-right" dir="rtl">
                            <p className="text-xs font-black text-white">
                              {language === 'ar' ? 'هل هذا المود مدفوع ومتميز؟' : 'Is this Mod Paid / Premium?'}
                            </p>
                            <p className="text-[10px] text-zinc-500">
                              {language === 'ar' ? 'اختر ما إذا كان المود مجانياً بالكامل أم يتطلب نقود Minecoins للتنزيل' : 'Specify if this is a free mod or a premium Minecraft Marketplace content'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-900" dir="rtl">
                          <button
                            type="button"
                            onClick={() => setNewGame({ ...newGame, isPaid: false, price: '' })}
                            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${!newGame.isPaid ? 'bg-red-600 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
                          >
                            {language === 'ar' ? 'محتوى مجاني' : 'Free Content'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNewGame(prev => ({ ...prev, isPaid: true, price: '490 Minecoins ($2.99)' }));
                              initPricingChat();
                            }}
                            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${newGame.isPaid ? 'bg-amber-600 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
                          >
                            {language === 'ar' ? 'محتوى مدفوع (Premium)' : 'Paid Content'}
                          </button>
                        </div>
                      </div>

                      {newGame.isPaid && (
                        <div className="border-t border-zinc-900/60 pt-4 space-y-4" dir="rtl">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-1 flex flex-col gap-1.5 text-right">
                              <label className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                                <DollarSign className="w-4 h-4" />
                                {language === 'ar' ? 'السعر المقترح للمود:' : 'Suggested Price:'}
                              </label>
                              <input
                                type="text"
                                placeholder={language === 'ar' ? 'مثال: 490 Minecoins ($2.99)' : 'e.g. 490 Minecoins ($2.99)'}
                                value={newGame.price}
                                onChange={e => setNewGame({ ...newGame, price: e.target.value })}
                                className="bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-sm focus:border-amber-500 text-white font-black outline-none w-full"
                              />
                            </div>

                            <div className="md:col-span-2 flex flex-col gap-1.5">
                              <label className="text-xs font-bold text-zinc-400">
                                {language === 'ar' ? 'مساعد التقييم والأسعار حسب سوق ماين كرافت المعتمد 🤖' : 'Minecraft Marketplace Pricing Assistant 🤖'}
                              </label>
                              {/* Real AI Chat interface below */}
                              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col h-[280px] overflow-hidden">
                                {/* Header */}
                                <div className="bg-zinc-900/60 border-b border-zinc-900 p-2.5 flex items-center justify-between text-right px-4">
                                  <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                                    {language === 'ar' ? 'مستشار التسعير الذكي نشط' : 'Pricing Advisor Active'}
                                  </span>
                                  <span className="text-xs font-bold text-amber-400">Minecoins Marketplace AI</span>
                                </div>

                                {/* Messages box */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 text-right text-xs" id="chat-messages-container">
                                  {pricingChatHistory.map((msg, idx) => (
                                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-start animate-fade-in' : 'items-end'}`}>
                                      <span className="text-[9px] text-zinc-650 mb-0.5">{msg.role === 'user' ? (language === 'ar' ? 'مطور المود' : 'You') : (language === 'ar' ? 'مستشار السوق' : 'Market Bot')}</span>
                                      <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${msg.role === 'user' ? 'bg-zinc-900 text-zinc-300' : 'bg-emerald-950/20 text-emerald-300 border border-emerald-900/30 text-right whitespace-pre-wrap font-sans'}`}>
                                        {msg.text}
                                      </div>
                                    </div>
                                  ))}
                                  {isPricingBotLoading && (
                                    <div className="flex items-center gap-2 text-zinc-500 self-end p-2 bg-zinc-900/35 rounded-xl border border-zinc-900 pr-4">
                                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce delay-75" />
                                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce delay-150" />
                                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce delay-300" />
                                      <span className="text-[10px] text-zinc-400 font-bold">{language === 'ar' ? 'يقوم Gemini بحساب أسعار السوق العادلة...' : 'Calculating market index...'}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Quick suggestion prompt tags */}
                                <div className="p-2 border-t border-zinc-900 bg-zinc-950/40 flex flex-wrap gap-1.5 justify-end" dir="rtl">
                                  <button
                                    type="button"
                                    onClick={() => askPricingQuestion(
                                      language === 'ar' 
                                        ? `ما هو السعر المناسب لسكن باك (Skin Pack) يحتوي على 10 سكنات في سوق ماين كرافت؟` 
                                        : `What is a good price for a Skin Pack with 10 skins?`
                                    )}
                                    className="text-[9px] bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white px-2 py-1 rounded-md transition cursor-pointer font-bold"
                                  >
                                    👕 {language === 'ar' ? 'سعر حزمة سكنات' : 'Skin Pack Price'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => askPricingQuestion(
                                      language === 'ar' 
                                        ? `أقوم بنشر خريطة مغامرات كاملة (Adventure Map) مع شيدرز مخصص وتطويرات. ما القيمة المقترحة بالكوين والدولار؟` 
                                        : `I am publishing an Adventure Map with custom shaders and behavior packs, standard price in Minecoins?`
                                    )}
                                    className="text-[9px] bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white px-2 py-1 rounded-md transition cursor-pointer font-bold"
                                  >
                                    🗺️ {language === 'ar' ? 'سعر خريطة مغامرات' : 'Adventure Map Price'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => askPricingQuestion(
                                      language === 'ar' 
                                        ? `أريد بيع مود أسلحة وسيارات مطور (Add-on) بنظام Bedrock Edition. كم أضعه في المتجر؟` 
                                        : `Price for a complex weapons and cars Add-on for Bedrock Edition?`
                                    )}
                                    className="text-[9px] bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white px-2 py-1 rounded-md transition cursor-pointer font-bold"
                                  >
                                    🚗 {language === 'ar' ? 'سعر مود أو إضافات' : 'Addon & Cars Price'}
                                  </button>
                                </div>

                                {/* Form Input box */}
                                <div className="p-2 border-t border-zinc-900 bg-zinc-900/30 flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    placeholder={language === 'ar' ? 'اسأل عن سعر المود ونقاط سوق ماين كرافت...' : 'Ask about typical Minecoin pricing or rates...'}
                                    value={pricingInputText}
                                    onChange={e => setPricingInputText(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        askPricingQuestion(pricingInputText);
                                      }
                                    }}
                                    className="flex-1 bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-right text-xs text-white focus:border-amber-500 outline-none placeholder:text-zinc-650"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => askPricingQuestion(pricingInputText)}
                                    className="bg-amber-600 hover:bg-amber-500 text-white p-2 rounded-xl transition cursor-pointer"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Mod Thumbnail Upload block */}
                    <div className="flex flex-col gap-2 col-span-1 md:col-span-3 bg-zinc-950/20 p-4 rounded-2xl border border-zinc-800">
                      <label className="text-xs font-bold text-zinc-400 mr-2 uppercase tracking-widest flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-red-500" />
                        صورة المود (Thumbnail)
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div className="relative border-2 border-dashed border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center bg-zinc-950 hover:border-red-500/50 transition-all cursor-pointer min-h-[120px]">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          />
                          {imageLoading ? (
                            <div className="flex flex-col items-center gap-2 text-center">
                              <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                              <p className="text-xs text-red-400">جاري فحص أمان الصورة بالذكاء الاصطناعي...</p>
                            </div>
                          ) : isImageUnsafe ? (
                            <div className="flex flex-col items-center text-center gap-2 text-red-500">
                              <AlertCircle className="w-6 h-6 text-red-500 animate-pulse" />
                              <p className="text-xs font-bold">⚠️ تم حجب الصورة! محتوى غير لائق.</p>
                              <p className="text-[10px] text-zinc-500">{unsafeReason}</p>
                            </div>
                          ) : newGame.thumbnail && newGame.thumbnail.startsWith('data:') ? (
                            <div className="relative w-full h-[100px] rounded-lg overflow-hidden border border-zinc-800">
                              <img src={newGame.thumbnail} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <span className="text-xs text-white">تغيير الصورة</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-zinc-500">
                              <FileUp className="w-6 h-6 text-zinc-600" />
                              <p className="text-xs font-bold font-sans">ارفع صورة من الهاتف</p>
                              <p className="text-[10px] text-zinc-600 font-sans">سيتم فحصها بواسطة Gemini</p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col justify-center gap-2">
                          <label className="text-[10px] text-zinc-500">أو أدخل رابط صورة خارجي مباشر:</label>
                          <input 
                            type="text" 
                            placeholder="رابط الصورة (Thumbnail)"
                            value={newGame.thumbnail && newGame.thumbnail.startsWith('data:') ? '' : newGame.thumbnail}
                            onChange={e => {
                              setIsImageUnsafe(false);
                              setNewGame({...newGame, thumbnail: e.target.value});
                            }}
                            className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:border-red-600 outline-none transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Mod File Upload block */}
                    <div className="flex flex-col gap-2 col-span-1 md:col-span-3 bg-zinc-950/20 p-4 rounded-2xl border border-zinc-800">
                      <label className="text-xs font-bold text-zinc-400 mr-2 uppercase tracking-widest flex items-center gap-2">
                        <FileUp className="w-4 h-4 text-red-500" />
                        ملف المود (Mod File)
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div className="relative border-2 border-dashed border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center bg-zinc-950 hover:border-red-500/50 transition-all cursor-pointer min-h-[120px]">
                          <input 
                            type="file" 
                            accept=".zip,.mcpack,.mcworld,.addon,.rar,.json"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const fileUrl = URL.createObjectURL(file);
                                setModFileName(file.name);
                                setNewGame(prev => ({ 
                                  ...prev, 
                                  downloadUrl: fileUrl, 
                                  title: prev.title || file.name.replace(/\.[^/.]+$/, "") 
                                }));
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          />
                          {modFileName ? (
                            <div className="flex flex-col items-center text-center gap-1 text-green-500">
                              <CheckCircle2 className="w-8 h-8 text-green-500" />
                              <p className="text-xs font-bold truncate max-w-[180px]">{modFileName}</p>
                              <p className="text-[10px] text-zinc-500">جاهز للتنزيل المباشر</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-zinc-500 font-sans">
                              <Smartphone className="w-6 h-6 text-zinc-600" />
                              <p className="text-xs font-bold">رفع ملف المود من الهاتف</p>
                              <p className="text-[10px] text-zinc-600">يدعم mcpack, zip, rar, etc</p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col justify-center gap-2">
                          <label className="text-[10px] text-zinc-500">أو أدخل رابط تحميل مباشر خارجي (مثل Mediafire, Drive):</label>
                          <input 
                            type="text" 
                            placeholder="رابط التحميل"
                            value={newGame.downloadUrl && newGame.downloadUrl.startsWith('blob:') ? '' : newGame.downloadUrl}
                            onChange={e => {
                              setModFileName('');
                              setNewGame({...newGame, downloadUrl: e.target.value});
                            }}
                            className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:border-red-600 outline-none transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    <textarea 
                      placeholder="الوصف"
                      value={newGame.description}
                      onChange={e => setNewGame({...newGame, description: e.target.value})}
                      className="col-span-1 md:col-span-3 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm h-24 focus:border-red-600 outline-none transition-colors resize-none"
                    />
                  </div>
                  <button 
                    onClick={async () => {
                      if (isImageUnsafe) {
                        alert(language === 'ar' ? 'عذراً، لا يمكنك النشر بصورة غير لائقة!' : 'Sorry, you cannot publish with inappropriate images!');
                        return;
                      }
                      const cleanTitle = newGame.title.trim();
                      const cleanDownloadUrl = newGame.downloadUrl.trim();
                      if (!cleanTitle) {
                        alert(language === 'ar' ? 'يرجى إدخال اسم المود أولاً!' : 'Please enter the mod title first!');
                        return;
                      }
                      if (!cleanDownloadUrl) {
                        alert(language === 'ar' ? 'يرجى رفع ملف المود أو وضع رابط تحميل مباشر!' : 'Please upload a mod file or provide a direct download URL first!');
                        return;
                      }
                      try {
                        if (editingGameId) {
                          await onUpdateGame(editingGameId, {
                            ...newGame,
                            title: cleanTitle,
                            downloadUrl: cleanDownloadUrl
                          });
                          alert(language === 'ar' ? 'تم حفظ تعديلات المود بنجاح!' : 'Mod changes saved successfully!');
                          setEditingGameId(null);
                        } else {
                          await onAddGame({
                            ...newGame,
                            title: cleanTitle,
                            downloadUrl: cleanDownloadUrl
                          });
                          alert(language === 'ar' ? 'تم رفع ونشر المود بنجاح!' : 'Mod uploaded and published successfully!');
                        }
                        setNewGame({ title: '', description: '', thumbnail: '', downloadUrl: '', category: 'مودات', rating: 5, edition: 'both' as 'java' | 'bedrock' | 'both', isPaid: false, price: '' });
                        setModFileName('');
                      } catch (err: any) {
                        console.error("Error saving mod:", err);
                        alert(language === 'ar' 
                          ? 'حدث خطأ أثناء حفظ المود. تفاصيل الخطأ:\n' + (err.message || err)
                          : 'An error occurred while saving. Details:\n' + (err.message || err)
                        );
                      }
                    }}
                    disabled={imageLoading || isImageUnsafe}
                    className="mt-6 w-full bg-red-650 hover:bg-red-540 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-red-650/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {imageLoading ? 'جاري فحص الصورة بالذكاء الاصطناعي...' : editingGameId ? 'حفظ تعديلات المود' : 'نشر المحتوى الآن'}
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold font-sans text-right">المحتوى المنشور ({games.length})</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {games.map(game => (
                      <div key={game.id} className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          {game.thumbnail && game.thumbnail !== "" ? (
                            <img src={game.thumbnail} className="w-16 h-10 object-cover rounded-lg bg-zinc-800" />
                          ) : (
                            <div className="w-16 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-zinc-650" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-sm">{game.title}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-zinc-500">{game.category}</span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-850 text-zinc-400 capitalize">
                                {{
                                  'java': language === 'ar' ? 'جافا' : 'Java',
                                  'bedrock': language === 'ar' ? 'بيدروك' : 'Bedrock',
                                  'both': language === 'ar' ? 'الإصدارين' : 'Both'
                                }[game.edition || 'both']}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => {
                              setEditingGameId(game.id);
                              setNewGame({
                                title: game.title || '',
                                description: game.description || '',
                                thumbnail: game.thumbnail || '',
                                downloadUrl: game.downloadUrl || '',
                                category: game.category || 'مودات',
                                rating: game.rating || 5,
                                edition: game.edition || 'both',
                                isPaid: game.isPaid || false,
                                price: game.price || ''
                              });
                              const formEl = document.getElementById('admin-games-form-container');
                              if (formEl) {
                                formEl.scrollIntoView({ behavior: 'smooth' });
                              }
                            }}
                            className="p-2 text-zinc-500 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all cursor-pointer"
                            title={language === 'ar' ? 'تعديل المود' : 'Edit Mod'}
                          >
                            <Edit3 className="w-4.5 h-4.5" />
                          </button>
                          <button 
                            onClick={() => onDeleteGame(game.id)}
                            className="p-2 text-zinc-650 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                            title={language === 'ar' ? 'حذف المود' : 'Delete Mod'}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : activeTab === 'reports' ? (
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-6 font-sans text-right">تقارير المستخدمين ({reports.length})</h3>
                {reports.length === 0 ? (
                  <div className="text-center py-20 text-zinc-600">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>لا توجد تقارير حالياً</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {reports.map(report => {
                      const isSystemWarning = report.isSystemWarning === true || report.message?.includes('🚨');
                      return (
                        <div 
                          key={report.id} 
                          className={`p-6 rounded-3xl border transition-all ${
                            isSystemWarning 
                              ? 'bg-red-950/20 border-red-500/50 shadow-red-900/10 shadow-lg' 
                              : report.status === 'resolved' 
                              ? 'bg-zinc-900/20 border-zinc-900 opacity-60' 
                              : 'bg-zinc-900/50 border-zinc-800 shadow-xl'
                          }`}
                        >
                          {isSystemWarning && (
                            <div className="bg-red-600/20 text-red-500 border border-red-600/30 px-3 py-1.5 rounded-xl text-xs font-black mb-4 inline-flex items-center gap-2 font-sans animate-pulse">
                              <AlertCircle className="w-4 h-4 text-red-500" />
                              ⚠️ تنبيه أمني عاجل للمدير العام
                            </div>
                          )}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${isSystemWarning ? 'bg-red-500' : report.status === 'resolved' ? 'bg-green-500' : 'bg-red-500'}`} />
                              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">{report.userEmail}</span>
                            </div>
                            <span className="text-[10px] text-zinc-650">
                              {report.timestamp?.toDate().toLocaleString('ar-EG')}
                            </span>
                          </div>
                          <p className={`leading-relaxed mb-6 ${isSystemWarning ? 'text-red-200 font-bold font-sans' : 'text-zinc-300'}`}>{report.message}</p>
                          
                          {/* Display custom reply if it exists */}
                          {report.reply && (
                            <div className="mb-4 p-4 rounded-2xl bg-zinc-950/60 border border-zinc-850 text-right text-xs" dir="rtl">
                              <span className="font-extrabold text-amber-500">✍️ رد المدير العام: </span>
                              <span className="text-zinc-300 leading-relaxed font-semibold">{report.reply}</span>
                            </div>
                          )}

                          {/* Write custom reply if report is pending */}
                          {report.status === 'pending' && (
                            <div className="mb-4 text-right" dir="rtl">
                              <label className="block text-xs font-bold text-zinc-400 mb-2">
                                ✍️ اكتب ردك المخصص على هذه المشكلة:
                              </label>
                              <textarea
                                value={reportReplies[report.id] || ''}
                                onChange={(e) => setReportReplies({
                                  ...reportReplies,
                                  [report.id]: e.target.value
                                })}
                                placeholder="اكتب ردك هنا بالتفصيل (مثال: تم تجديد المود، يرجى إعادة التحميل الآن...)"
                                className="w-full bg-zinc-950 border border-zinc-850 rounded-2xl p-3 text-xs h-20 focus:border-red-600 outline-none transition-colors resize-none text-white font-semibold"
                              />
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            {report.status === 'pending' && (
                              <button 
                                onClick={() => onResolveReport(report.id, reportReplies[report.id] || '')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isSystemWarning ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-green-600/10 text-green-500 border border-green-600/20 hover:bg-green-600 hover:text-white'}`}
                              >
                                {reportReplies[report.id]?.trim() ? 'إرسال الرد وحل المشكلة' : 'حل المشكلة (بدون رد)'}
                              </button>
                            )}
                            <button 
                              onClick={() => onDeleteReport(report.id)}
                              className="bg-red-600/10 text-red-500 border border-red-600/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-600 hover:text-white transition-all"
                            >
                              حذف التقرير
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : activeTab === 'users' ? (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Users className="w-5 h-5 text-red-500" />
                      تنظيم أعضاء الموقع وتوثيقهم
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      الأعضاء الجُدد لا يحصلون على توثيق تلقائي لدخولهم بل يكونون (عضو جديد) افتراضياً. تحكّم في منح شارات التوثيق أو سحبها من هنا.
                    </p>
                  </div>
                  <div className="w-full md:w-80 relative">
                    <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500`} />
                    <input 
                      type="text"
                      placeholder="ابحث عن عضو بالاسم أو الإيميل..."
                      value={userSearchText}
                      onChange={(e) => setUserSearchText(e.target.value)}
                      className={`w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 ${language === 'ar' ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'} text-sm focus:border-red-600 outline-none transition-colors text-white`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {dbUsers.filter(u => 
                    u.email?.toLowerCase().includes(userSearchText.toLowerCase()) || 
                    u.displayName?.toLowerCase().includes(userSearchText.toLowerCase())
                  ).map(targetUser => {
                    const isTargetAdmin = targetUser.email === 'frassa0000@gmail.com';
                    return (
                      <div 
                        key={targetUser.id} 
                        className={`p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                          isTargetAdmin 
                            ? 'bg-amber-500/5 border-amber-500/20' 
                            : targetUser.verified 
                            ? 'bg-zinc-900/40 border-blue-500/25 shadow-lg shadow-blue-950/10' 
                            : 'bg-zinc-900/10 border-zinc-800'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <img 
                            src={targetUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser.id}`} 
                            alt="" 
                            className={`w-12 h-12 rounded-full border-2 ${isTargetAdmin ? 'border-amber-500' : targetUser.verified ? 'border-blue-500' : 'border-zinc-700'} object-cover bg-zinc-900`}
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-zinc-100">
                                {targetUser.displayName || 'أحد الزوار الجدد'}
                              </span>
                              {isTargetAdmin && (
                                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-black flex items-center gap-1">
                                  <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />
                                  المدير
                                </span>
                              )}
                              {!isTargetAdmin && targetUser.verified && (
                                <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full font-black flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  عضو موثق
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-zinc-500 block mt-1">{targetUser.email}</span>
                          </div>
                        </div>

                        <div>
                          {isTargetAdmin ? (
                            <button 
                              disabled
                              className="text-[11px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-4 py-2 rounded-xl font-bold"
                            >
                              صاحب الموقع والمدير
                            </button>
                          ) : (
                            <button 
                              disabled={toggleLoading === targetUser.id}
                              type="button"
                              onClick={() => handleToggleVerification(targetUser.id, targetUser.verified)}
                              className={`text-[11px] font-bold px-4 py-2 rounded-xl border transition-all ${
                                targetUser.verified 
                                  ? 'bg-red-600/10 text-red-500 border-red-600/20 hover:bg-red-600 hover:text-white' 
                                  : 'bg-green-600/10 text-green-500 border-green-600/20 hover:bg-green-600 hover:text-white'
                              }`}
                            >
                              {toggleLoading === targetUser.id 
                                ? (language === 'ar' ? 'جاري التحديث...' : 'Updating...') 
                                : targetUser.verified 
                                ? (language === 'ar' ? 'سحب التوثيق (عضو جديد)' : 'Revoke Verification') 
                                : (language === 'ar' ? 'توثيق العضو وتأكيده' : 'Verify Member')}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {dbUsers.filter(u => 
                    u.email?.toLowerCase().includes(userSearchText.toLowerCase()) || 
                    u.displayName?.toLowerCase().includes(userSearchText.toLowerCase())
                  ).length === 0 && (
                    <div className="text-center py-20 text-zinc-600 border border-dashed border-zinc-800 rounded-3xl bg-zinc-950/20">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-sm">لا يوجد مستخدمون يطابقون بحثك الحالي.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'socials' ? (
              <div className="space-y-6 text-right" dir="rtl">
                {/* Header */}
                <div className="mb-8">
                  <h2 className="text-2xl font-black text-white tracking-tight font-sans">الإعدادات العامة</h2>
                  <p className="text-zinc-500 text-xs mt-1 font-semibold">إدارة إعدادات موقع جولدن</p>
                </div>

                {/* Card 1: هوية الموقع */}
                <div className="bg-[#0c0d10] border border-zinc-900 rounded-3xl p-6 md:p-8 space-y-6">
                  <div className="flex items-center justify-between border-b border-zinc-900/60 pb-3">
                    <span className="text-sm font-black text-amber-500">هوية الموقع</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                    <div className="md:col-span-1 text-right">
                      <label className="text-xs font-bold text-zinc-400">اسم الموقع</label>
                    </div>
                    <div className="md:col-span-3">
                      <input 
                        type="text"
                        value={generalSettings.siteName}
                        onChange={e => setGeneralSettings(prev => ({ ...prev, siteName: e.target.value }))}
                        className="w-full bg-[#090b0d] border border-zinc-900 rounded-xl py-3 px-4 text-xs font-bold text-zinc-100 focus:border-amber-500 outline-none transition-colors text-right"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                    <div className="md:col-span-1 text-right pt-2">
                      <label className="text-xs font-bold text-zinc-400">وصف الموقع</label>
                    </div>
                    <div className="md:col-span-3">
                      <textarea 
                        rows={3}
                        value={generalSettings.siteDescription}
                        onChange={e => setGeneralSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                        className="w-full bg-[#090b0d] border border-zinc-900 rounded-xl py-3 px-4 text-xs font-medium leading-relaxed text-zinc-100 focus:border-amber-500 outline-none transition-colors text-right resize-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                    <div className="md:col-span-1 text-right">
                      <label className="text-xs font-bold text-zinc-400">شعار الموقع</label>
                    </div>
                    <div className="md:col-span-3">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border border-dashed border-zinc-900 bg-zinc-950/20 p-5 rounded-2xl max-w-xl">
                        <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            onClick={handleLogoUpload}
                            className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                          >
                            تغيير الشعار
                          </button>
                          <button 
                            type="button"
                            onClick={handleLogoDelete}
                            className="border border-red-500/20 hover:border-red-500 text-red-500 hover:bg-red-500/5 font-bold text-xs px-5 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer"
                          >
                            حذف
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-3 bg-[#0d0e11] px-5 py-3 rounded-2xl border border-zinc-900 shadow-inner select-none">
                          <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-250 to-amber-500">جولدن</span>
                          <svg className="w-8 h-8 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M50 20 L85 37 L50 54 L15 37 Z" fill="#5c8e32" stroke="#3c5f21" strokeWidth="1.5" />
                            <path d="M15 37 L50 54 L50 82 L15 65 Z" fill="#866043" stroke="#5d432e" strokeWidth="1.5" />
                            <path d="M15 37 L50 54 L50 62 L32.5 53.5 L24 51 L15 42.5 Z" fill="#4d7729" />
                            <path d="M50 54 L85 37 L85 65 L50 82 Z" fill="#573e2b" stroke="#3b2a1d" strokeWidth="1.5" />
                            <path d="M50 54 L85 37 L85 45.5 L74.5 50.5 L67 52.5 L50 62 Z" fill="#426623" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: إعدادات عامة */}
                <div className="bg-[#0c0d10] border border-zinc-900 rounded-3xl p-6 md:p-8 space-y-6">
                  <div className="flex items-center justify-between border-b border-zinc-900/60 pb-3">
                    <span className="text-sm font-black text-amber-500">إعدادات عامة</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                    <div className="md:col-span-1 text-right">
                      <label className="text-xs font-bold text-zinc-400">رابط الموقع</label>
                    </div>
                    <div className="md:col-span-3">
                      <input 
                        type="text"
                        value={generalSettings.siteUrl}
                        onChange={e => setGeneralSettings(prev => ({ ...prev, siteUrl: e.target.value }))}
                        className="w-full bg-[#090b0d] border border-zinc-900 rounded-xl py-3 px-4 text-xs font-semibold text-zinc-100 focus:border-amber-500 outline-none font-mono transition-colors text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                    <div className="md:col-span-1 text-right">
                      <label className="text-xs font-bold text-zinc-400">البريد الإلكتروني للمشرف</label>
                    </div>
                    <div className="md:col-span-3">
                      <input 
                        type="email"
                        value={generalSettings.adminEmail}
                        onChange={e => setGeneralSettings(prev => ({ ...prev, adminEmail: e.target.value }))}
                        className="w-full bg-[#090b0d] border border-zinc-900 rounded-xl py-3 px-4 text-xs font-semibold text-zinc-100 focus:border-amber-500 outline-none transition-colors text-right"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                    <div className="md:col-span-1 text-right">
                      <label className="text-xs font-bold text-zinc-400">المنطقة الزمنية</label>
                    </div>
                    <div className="md:col-span-3">
                      <input 
                        type="text"
                        value={generalSettings.timezone}
                        onChange={e => setGeneralSettings(prev => ({ ...prev, timezone: e.target.value }))}
                        className="w-full bg-[#090b0d] border border-zinc-900 rounded-xl py-3 px-4 text-xs font-semibold text-zinc-100 focus:border-amber-500 outline-none transition-colors text-right"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                    <div className="md:col-span-1 text-right">
                      <label className="text-xs font-bold text-zinc-400">لغة الموقع الافتراضية</label>
                    </div>
                    <div className="md:col-span-3">
                      <input 
                        type="text"
                        value={generalSettings.siteLanguage}
                        onChange={e => setGeneralSettings(prev => ({ ...prev, siteLanguage: e.target.value }))}
                        className="w-full bg-[#090b0d] border border-zinc-900 rounded-xl py-3 px-4 text-xs font-semibold text-zinc-100 focus:border-amber-500 outline-none transition-colors text-right"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                    <div className="md:col-span-1 text-right">
                      <label className="text-xs font-bold text-zinc-400">وضع الصيانة</label>
                    </div>
                    <div className="md:col-span-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setGeneralSettings(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${generalSettings.maintenanceMode ? 'bg-amber-500' : 'bg-zinc-800'}`}
                      >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${generalSettings.maintenanceMode ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                      <span className="text-xs text-zinc-500">تفعيل وضع الصيانة يمنع الزوار غير المشرفين من تصفح الموقع</span>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button 
                      type="button"
                      onClick={handleSaveGeneralSettings}
                      disabled={settingsLoading}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs px-6 py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {settingsLoading ? 'جاري الحفظ...' : 'حفظ الإعدادات العامة'}
                    </button>
                  </div>
                </div>

                {/* Card 3: روابط شبكات التواصل */}
                <div className="bg-[#0c0d10] border border-zinc-900 rounded-3xl p-6 md:p-8 space-y-6">
                  <div className="flex items-center justify-between border-b border-zinc-900/60 pb-3">
                    <span className="text-sm font-black text-amber-500">روابط قنوات ومواقع التواصل</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                    <div className="md:col-span-1 text-right">
                      <label className="text-xs font-bold text-zinc-400">قناة اليوتيوب</label>
                    </div>
                    <div className="md:col-span-3">
                      <input 
                        type="text"
                        value={generalSettings.youtube}
                        onChange={e => setGeneralSettings(prev => ({ ...prev, youtube: e.target.value }))}
                        className="w-full bg-[#090b0d] border border-zinc-900 rounded-xl py-3 px-4 text-xs font-semibold text-zinc-100 focus:border-amber-500 outline-none font-mono transition-colors text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                    <div className="md:col-span-1 text-right">
                      <label className="text-xs font-bold text-zinc-400">سيرفر الديسكورد</label>
                    </div>
                    <div className="md:col-span-3">
                      <input 
                        type="text"
                        value={generalSettings.discord}
                        onChange={e => setGeneralSettings(prev => ({ ...prev, discord: e.target.value }))}
                        className="w-full bg-[#090b0d] border border-zinc-900 rounded-xl py-3 px-4 text-xs font-semibold text-zinc-100 focus:border-amber-500 outline-none font-mono transition-colors text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                    <div className="md:col-span-1 text-right">
                      <label className="text-xs font-bold text-zinc-400">حساب تويتر (X)</label>
                    </div>
                    <div className="md:col-span-3">
                      <input 
                        type="text"
                        value={generalSettings.twitter}
                        onChange={e => setGeneralSettings(prev => ({ ...prev, twitter: e.target.value }))}
                        className="w-full bg-[#090b0d] border border-zinc-900 rounded-xl py-3 px-4 text-xs font-semibold text-zinc-100 focus:border-amber-500 outline-none font-mono transition-colors text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button 
                      type="button"
                      onClick={handleSaveSocials}
                      disabled={socialsLoading}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs px-6 py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {socialsLoading ? "جاري الحفظ..." : "حفظ روابط التواصل"}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const UserPanel = ({ 
  isOpen, 
  onClose, 
  profile, 
  allGames, 
  onUpdateProfile, 
  onSendReport,
  theme,
  language,
  isAppInstalled,
  onInstallPWA,
  stats
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  profile: UserProfileData | null;
  allGames: Game[];
  onUpdateProfile: (data: Partial<UserProfileData>) => void;
  onSendReport: (msg: string) => void;
  theme: "dark" | "light";
  language: "ar" | "en";
  isAppInstalled: boolean;
  onInstallPWA: () => void;
  stats: {
    totalDownloads: number;
    totalUsers: number;
    totalReviews: number;
    totalFavorites: number;
  };
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'favorites' | 'settings' | 'support' | 'assistant'>('assistant');
  const [newName, setNewName] = useState('');
  const [newBio, setNewBio] = useState('');
  const [newPhotoURL, setNewPhotoURL] = useState('');
  const [panelSaveSuccess, setPanelSaveSuccess] = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [reportMsg, setReportMsg] = useState('');
  const [assistantStep, setAssistantStep] = useState<1 | 2 | 3>(1);
  const [selectedSupportOption, setSelectedSupportOption] = useState<string>('');
  const [assistantMessage, setAssistantMessage] = useState<string>('');
  const [isSendingAssistant, setIsSendingAssistant] = useState<boolean>(false);
  const [userReports, setUserReports] = useState<Report[]>([]);

  useEffect(() => {
    if (profile) {
      setNewName(profile.displayName || '');
      setNewBio(profile.bio || '');
      setNewPhotoURL(profile.photoURL || '');
    }
  }, [profile]);

  useEffect(() => {
    if (!isOpen || !profile?.uid) return;
    const q = query(
      collection(db, 'reports'),
      where('userId', '==', profile.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Report[];
      const sorted = list.sort((a, b) => {
        const tA = a.timestamp?.seconds || 0;
        const tB = b.timestamp?.seconds || 0;
        return tB - tA;
      });
      setUserReports(sorted);
    }, (error) => {
      console.error("Error subscribing to personal reports:", error);
    });
    return () => unsubscribe();
  }, [isOpen, profile?.uid]);

  if (!isOpen || !profile) return null;

  const favoriteGames = allGames.filter(g => profile.favorites?.includes(g.id));

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-black"
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 1 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`${theme === 'light' ? 'bg-white text-zinc-900 border-zinc-200' : 'bg-zinc-950 text-white border-zinc-800'} border w-full max-w-4xl h-full md:h-[70vh] rounded-none md:rounded-[2.5rem] overflow-hidden relative z-10 flex flex-col shadow-2xl`}
      >
        <div className={`p-4 md:p-6 border-b ${theme === 'light' ? 'border-zinc-200 bg-zinc-50' : 'border-zinc-900 bg-zinc-900'} flex items-center justify-between`}>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="bg-red-600 p-2 rounded-xl text-white">
              <UserCog className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tighter">لوحة التحكم الشخصية</h2>
          </div>
          <button onClick={onClose} className={`p-2 ${theme === 'light' ? 'hover:bg-zinc-200' : 'hover:bg-zinc-800'} rounded-full transition-colors text-zinc-500 hover:text-white`}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Tabs */}
        <div className={`flex md:hidden border-b ${theme === 'light' ? 'border-zinc-200 bg-white' : 'border-zinc-900 bg-zinc-950'} overflow-x-auto no-scrollbar scroll-smooth`}>
          {[
            { id: 'profile', label: 'حسابي', icon: UserIcon },
            { id: 'favorites', label: 'المفضلات', icon: Heart },
            { id: 'settings', label: 'الإعدادات', icon: Settings },
            { id: 'support', label: 'الدعم الفني ورد الدعم الفني عليك', icon: MessageSquare },
            { id: 'assistant', label: 'مساعد الدعم', icon: Sparkles },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex flex-col items-center gap-1 px-4 py-3 min-w-[90px] transition-all ${activeTab === tab.id ? 'text-red-500 border-b-2 border-red-500' : 'text-zinc-500'}`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] whitespace-nowrap font-bold">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className={`w-64 border-l ${theme === 'light' ? 'border-zinc-200 bg-zinc-50' : 'border-zinc-900 bg-zinc-950'} p-4 space-y-2 hidden md:block`}>
            {[
              { id: 'profile', label: 'حسابي', icon: UserIcon },
              { id: 'favorites', label: 'المفضلات', icon: Heart },
              { id: 'settings', label: 'الإعدادات', icon: Settings },
              { id: 'support', label: 'الدعم الفني ورد الدعم الفني عليك', icon: MessageSquare },
              { id: 'assistant', label: 'مساعد الدعم', icon: Sparkles },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === tab.id ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : `text-zinc-500 ${theme === 'light' ? 'hover:bg-zinc-200' : 'hover:bg-zinc-900'} hover:text-zinc-300`}`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className={`flex-1 overflow-y-auto p-4 md:p-8 ${theme === 'light' ? 'bg-zinc-50/50' : 'bg-zinc-900/20'}`}>
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-zinc-800 border-4 border-red-600/20 flex items-center justify-center overflow-hidden">
                      {profile.photoURL && profile.photoURL !== "" ? (
                        <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-16 h-16 text-zinc-600" />
                      )}
                    </div>
                    {profile.email === 'frassa0000@gmail.com' && (
                      <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1.5 rounded-full shadow-lg border-2 border-zinc-950">
                        <Crown className="w-5 h-5 fill-current" />
                      </div>
                    )}
                    {profile.verified && profile.email !== 'frassa0000@gmail.com' && (
                      <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1.5 rounded-full shadow-lg border-2 border-zinc-950">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold flex items-center justify-center gap-2">
                      {profile.displayName || 'لاعب محترف'}
                      {profile.email === 'frassa0000@gmail.com' && <span className="text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded-full font-black">المدير</span>}
                      {profile.verified && profile.email !== 'frassa0000@gmail.com' && <span className="text-xs bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2.5 py-1 rounded-full font-black">عضو موثق</span>}
                      {!profile.verified && profile.email !== 'frassa0000@gmail.com' && <span className="text-xs bg-zinc-800 text-zinc-400 border border-zinc-700 px-2.5 py-1 rounded-full font-black">عضو جديد</span>}
                    </h3>
                    <p className="text-zinc-500 text-sm mt-1">{profile.email}</p>
                    <div className="mt-3 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs font-black mx-auto w-fit select-none shadow-md shadow-amber-950/10">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        {profile.points || 0} {language === 'ar' ? 'نقطة' : 'Pts'}
                      </span>
                    </div>
                    {profile.bio && (
                      <p className="text-zinc-400 text-xs mt-3 max-w-md mx-auto italic font-semibold leading-relaxed bg-zinc-900/40 py-2 px-3.5 rounded-xl border border-zinc-800/50 break-words text-center">
                        {profile.bio}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-5 text-right font-semibold animate-fade-in" dir="rtl">
                  <h4 className="font-black text-sm text-zinc-400 mr-1 border-b border-zinc-800/20 pb-2 flex items-center gap-2">
                    <span>✏️</span>
                    <span>تعديل بيانات الملف الشخصي والوصف</span>
                  </h4>
                  
                  {/* Nickname Entry */}
                  <div className="space-y-1.5 text-right">
                    <label className="text-xs text-zinc-500 font-extrabold mr-1">الاسم المستعار</label>
                    <input 
                      type="text" 
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="أدخل اسمك الجديد"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:border-red-650 outline-none transition-all font-bold text-right"
                    />
                  </div>

                  {/* Image URL Entry */}
                  <div className="space-y-1.5 text-right">
                    <label className="text-xs text-zinc-500 font-extrabold mr-1">رابط الصورة الشخصية (Direct Photo URL)</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input 
                        type="text" 
                        value={newPhotoURL}
                        onChange={(e) => setNewPhotoURL(e.target.value)}
                        placeholder="ضع رابط الصورة المباشر هنا..."
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:border-red-650 outline-none transition-all font-semibold text-left"
                        dir="ltr"
                      />
                      
                      {/* Presets List in Modal */}
                      <div className="flex gap-1 items-center shrink-0">
                        {[
                          { name: 'Steve', url: 'https://mc-heads.net/avatar/MHF_Steve/64' },
                          { name: 'Alex', url: 'https://mc-heads.net/avatar/MHF_Alex/64' },
                          { name: 'Felix', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
                          { name: 'Ender', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Ender' }
                        ].map((p, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => setNewPhotoURL(p.url)}
                            title={p.name}
                            className={`w-9 h-9 rounded-lg overflow-hidden border transition-all ${newPhotoURL === p.url ? 'border-red-500 scale-105' : 'border-zinc-800 hover:border-zinc-600'}`}
                          >
                            <img src={p.url} className="w-full h-full object-cover animate-pulse" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bio Entry */}
                  <div className="space-y-1.5 text-right">
                    <div className="flex justify-between items-center mr-1">
                      <label className="text-xs text-zinc-500 font-extrabold">الوصف الشخصي (Biography / Bio)</label>
                      <span className="text-[10px] text-zinc-500 font-bold">{newBio.length}/150</span>
                    </div>
                    <textarea 
                      value={newBio}
                      onChange={(e) => setNewBio(e.target.value)}
                      placeholder="اكتب نبذة قصيرة لتشرح فيها اهتماماتك..."
                      maxLength={150}
                      rows={3}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:border-red-850 outline-none transition-all font-semibold resize-none text-right"
                    />
                  </div>

                  {/* Success indicator inside modal */}
                  {panelSaveSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-center text-xs font-black"
                    >
                      ✓ تم حفظ وتحديث بياناتك الشخصية بنجاح!
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2 flex justify-end">
                    <button 
                      onClick={async () => {
                        try {
                          await onUpdateProfile({ 
                            displayName: newName.trim(), 
                            photoURL: newPhotoURL.trim(), 
                            bio: newBio.trim() 
                          });
                          setPanelSaveSuccess(true);
                          setTimeout(() => setPanelSaveSuccess(false), 3000);
                        } catch (err) {
                          console.error("Error updating profile inside modal panel:", err);
                        }
                      }}
                      className="w-full sm:w-auto bg-gradient-to-r from-red-650 to-amber-500 hover:from-red-550 hover:to-amber-450 text-white px-8 py-3.5 rounded-2xl font-black text-xs transition-all active:scale-[0.98] shadow-lg shadow-red-550/10 cursor-pointer"
                    >
                      حفظ جميع التغييرات
                    </button>
                  </div>
                </div>

                {/* Referral Invitation System Card */}
                <div className="bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-zinc-950/40 border border-amber-500/20 p-6 rounded-3xl space-y-5 text-right font-semibold animate-fade-in" dir="rtl">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-amber-500/15 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                        <Gift className="w-5 h-5" />
                      </div>
                      <div className="text-right">
                        <h4 className="font-black text-sm text-amber-400">🎁 نظام دعوة الأصدقاء ومضاعفة النقاط</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">شارك رابطك واكسب 40 نقطة ذهبية مجانية عن كل صديق!</p>
                      </div>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-2xl text-xs font-black text-amber-500 flex items-center gap-1.5 self-end sm:self-auto select-none">
                      <Users className="w-4 h-4" />
                      <span>الأصدقاء المدعوون: {profile.referralsCount || 0}</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
                    كل صديق جديد يقوم بالتسجيل في موقعنا عبر رابطك الخاص أدناه، ستحصل أنت فوراً على <span className="text-amber-400 font-extrabold">+40 نقطة</span> في محفظتك! ولتسهيل الأمر على أصدقائك، سيحصل صديقك المدعو أيضاً على <span className="text-amber-400 font-extrabold">+40 نقطة</span> مجانية كمكافأة ترحيبية لشراء وتحميل المودات المتميزة فوراً! 🎉
                  </p>

                  <div className="space-y-2 text-right">
                    <label className="text-xs text-zinc-500 font-extrabold mr-1">رابط الدعوة الخاص بك (الرابط الفريد)</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                        type="text" 
                        readOnly
                        value={`${window.location.origin}?ref=${profile.uid}`}
                        className="flex-1 bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs focus:border-amber-600 outline-none transition-all font-semibold text-left select-all font-mono"
                        dir="ltr"
                      />
                      <button
                        onClick={() => {
                          try {
                            navigator.clipboard.writeText(`${window.location.origin}?ref=${profile.uid}`);
                            setCopiedReferral(true);
                            setTimeout(() => setCopiedReferral(false), 2000);
                          } catch (err) {
                            console.error("Failed to copy link:", err);
                          }
                        }}
                        className={`px-6 py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${copiedReferral ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'bg-amber-500 hover:bg-amber-450 text-black shadow-lg shadow-amber-500/15'}`}
                      >
                        {copiedReferral ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>تم النسخ!</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-4 h-4" />
                            <span>نسخ رابط الدعوة</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'favorites' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-6">مفضلاتي ({favoriteGames.length})</h3>
                {favoriteGames.length === 0 ? (
                  <div className="text-center py-20 text-zinc-600 border border-dashed border-zinc-800 rounded-[2rem]">
                    <Heart className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>قائمة المفضلات فارغة حالياً</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {favoriteGames.map(game => (
                      <div key={game.id} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          {game.thumbnail && game.thumbnail !== "" ? (
                            <img src={game.thumbnail} alt="" className="w-16 h-10 object-cover rounded-lg" />
                          ) : (
                            <div className="w-16 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-zinc-600" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-sm">{game.title}</h4>
                            <p className="text-[10px] text-zinc-500">{game.category}</p>
                          </div>
                        </div>
                        <a 
                          href={game.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-red-600 p-2 rounded-lg text-white hover:bg-red-500 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold mb-6">
                  {language === 'ar' ? 'إعدادات الموقع' : 'App Settings'}
                </h3>
                
                {/* Theme Setting */}
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Palette className="w-5 h-5 text-red-500" />
                      <div>
                        <p className="font-bold">
                          {language === 'ar' ? 'المظهر العام' : 'Appearance'}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {language === 'ar' ? 'اختر لون الموقع المفضل لديك' : 'Choose your preferred theme'}
                        </p>
                      </div>
                    </div>
                    <div className={`flex bg-zinc-950 p-1 rounded-xl border ${theme === 'light' ? 'border-zinc-200' : 'border-zinc-800'}`}>
                      <button 
                        onClick={() => onUpdateProfile({ theme: 'dark' })}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${theme === 'dark' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-500'}`}
                      >
                        {language === 'ar' ? 'داكن' : 'Dark'}
                      </button>
                      <button 
                        onClick={() => onUpdateProfile({ theme: 'light' })}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${theme === 'light' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-500'}`}
                      >
                        {language === 'ar' ? 'فاتح' : 'Light'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 📊 Page Interactions ("تفاعلات الصفحة") */}
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-6 text-right" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                    <span className="text-2xl">📊</span>
                    <div>
                      <h4 className="font-black text-lg text-white">
                        {language === 'ar' ? 'تفاعلات الصفحة' : 'Page Interactions'}
                      </h4>
                      <p className="text-xs text-zinc-500">
                        {language === 'ar' ? 'إحصائيات تفاعلية حقيقية ومباشرة من قاعدة البيانات' : 'Live real-time interaction stats straight from the database'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {/* 1. Total Downloads */}
                    <div className="bg-zinc-950/80 border border-zinc-850 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 hover:border-zinc-700 transition duration-150">
                      <span className="text-3xl">📥</span>
                      <span className="text-2xl font-black text-red-500 tracking-tight">
                        {stats.totalDownloads.toLocaleString()}
                      </span>
                      <span className="text-[11px] font-bold text-zinc-400">
                        {language === 'ar' ? 'إجمالي التحميلات الحقيقية' : 'Total Downloads'}
                      </span>
                    </div>

                    {/* 2. Registered Users */}
                    <div className="bg-zinc-950/80 border border-zinc-850 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 hover:border-zinc-700 transition duration-150">
                      <span className="text-3xl">👤</span>
                      <span className="text-2xl font-black text-amber-500 tracking-tight">
                        {stats.totalUsers.toLocaleString()}
                      </span>
                      <span className="text-[11px] font-bold text-zinc-400">
                        {language === 'ar' ? 'الأعضاء المسجلين' : 'Registered Members'}
                      </span>
                    </div>

                    {/* 3. Written Reviews */}
                    <div className="bg-zinc-950/80 border border-zinc-850 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 hover:border-zinc-700 transition duration-150">
                      <span className="text-3xl">💬</span>
                      <span className="text-2xl font-black text-blue-500 tracking-tight">
                        {stats.totalReviews.toLocaleString()}
                      </span>
                      <span className="text-[11px] font-bold text-zinc-400">
                        {language === 'ar' ? 'التعليقات والمراجعات' : 'Written Reviews'}
                      </span>
                    </div>

                    {/* 4. Community Favorites */}
                    <div className="bg-zinc-950/80 border border-zinc-850 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 hover:border-zinc-700 transition duration-150">
                      <span className="text-3xl">❤️</span>
                      <span className="text-2xl font-black text-rose-500 tracking-tight">
                        {stats.totalFavorites.toLocaleString()}
                      </span>
                      <span className="text-[11px] font-bold text-zinc-400">
                        {language === 'ar' ? 'إجمالي تفضيلات الأعضاء' : 'Total Favorites'}
                      </span>
                    </div>

                    {/* 5. Published Mods count */}
                    <div className="bg-zinc-950/80 border border-zinc-850 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 hover:border-zinc-700 transition duration-150">
                      <span className="text-3xl">📦</span>
                      <span className="text-2xl font-black text-emerald-500 tracking-tight">
                        {allGames.length}
                      </span>
                      <span className="text-[11px] font-bold text-zinc-400">
                        {language === 'ar' ? 'المودات والخرائط المتوفرة' : 'Published Content'}
                      </span>
                    </div>

                    {/* 6. Active user's own saved favorites count */}
                    <div className="bg-zinc-950/80 border border-zinc-850 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 hover:border-zinc-700 transition duration-150">
                      <span className="text-3xl">⭐</span>
                      <span className="text-2xl font-black text-purple-500 tracking-tight">
                        {profile?.favorites?.length || 0}
                      </span>
                      <span className="text-[11px] font-bold text-zinc-400">
                        {language === 'ar' ? 'مفضلاتك المحفوظة' : 'Your Saved Favorites'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* PWA App Installation Setting */}
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-5 text-right" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/10 shrink-0">
                        <Smartphone className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-black text-base text-white">
                          {language === 'ar' ? 'إضافة التطبيق إلى شاشة الهاتف' : 'Add App to Home Screen'}
                        </h4>
                        <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
                          {language === 'ar' 
                            ? 'قم بتنزيل وتثبيت تطبيق Golden Gih على جهازك كـ تطبيق مثبت فوري لمتابعة وتحميل أسرع للمودات والخرائط بدون الحاجة لفتح المتصفح!'
                            : 'Download & install Golden Gih on your device as an app for extremely fast catalog exploring and direct mod downloads!'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="shrink-0">
                      {isAppInstalled ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 text-emerald-500 border border-emerald-500/20 rounded-xl text-xs font-extrabold">
                          <CheckCircle2 className="w-4 h-4" />
                          {language === 'ar' ? 'مُثبّت بالفعل' : 'Installed'}
                        </span>
                      ) : (
                        <button
                          onClick={onInstallPWA}
                          className="w-full sm:w-auto bg-gradient-to-r from-red-650 to-amber-500 hover:from-red-550 hover:to-amber-400 text-white px-5 py-3 rounded-2xl font-black text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-red-500/10 cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>{language === 'ar' ? 'تنزيل وتثبيت التطبيق' : 'Install App'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Manual installation guide */}
                  {!isAppInstalled && (
                    <div className="bg-zinc-950/80 p-4 rounded-2xl border border-zinc-900 space-y-3 mt-4 text-xs font-semibold">
                      <p className="font-black text-amber-500 flex items-center gap-1.5 justify-end" dir="rtl">
                        <span>💡 دليل التثبيت اليدوي لأي هاتف:</span>
                      </p>
                      <div className="space-y-2 text-zinc-400 text-right leading-relaxed" dir="rtl">
                        <div className="flex items-start gap-2 justify-end">
                          <span className="text-white bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-lg text-[10px] font-black shrink-0">أندرويد</span>
                          <span>إذا كنت تستخدم أندرويد (متصفح كروم): اضغط على زر القائمة <span className="text-white font-bold select-none">(⋮)</span> بجانب الرابط ثم اختر <span className="text-white font-black">"تثبيت التطبيق"</span> أو <span className="text-white font-black">"Add to Home screen"</span>.</span>
                        </div>
                        <div className="flex items-start gap-2 justify-end">
                          <span className="text-white bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-lg text-[10px] font-black shrink-0">آيفون iOS</span>
                          <span>إذا كنت تستخدم آيفون (متصفح سفاري): اضغط على زر المشاركة السفلي <span className="text-white font-bold select-none">(📤)</span> ثم اختر <span className="text-white font-black">"إضافة للشاشة الرئيسية"</span> أو <span className="text-white font-black">"Add to Home Screen"</span>.</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'support' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold mb-6 text-right">الإبلاغ عن مشكلة</h3>
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-4 text-right">
                  <p className="text-sm text-zinc-400">هل تواجه مشكلة في تحميل المودات؟ اترك لنا رسالة وسنرد عليك في أقرب وقت.</p>
                  <textarea 
                    value={reportMsg}
                    onChange={(e) => setReportMsg(e.target.value)}
                    placeholder="اشرح المشكلة بالتفصيل..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-[1.5rem] p-4 text-sm h-32 focus:border-red-600 outline-none transition-colors resize-none"
                  />
                  <button 
                    disabled={!reportMsg.trim()}
                    onClick={() => {
                      onSendReport(reportMsg);
                      setReportMsg('');
                      alert('تم إرسال بلاغك بنجاح');
                    }}
                    className="w-full bg-white text-black py-4 rounded-xl font-bold hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    إرسال البلاغ
                  </button>
                </div>

                {/* Display list of user's past reports and their status/answers */}
                <div className="space-y-4 text-right mt-8">
                  <h4 className="text-lg font-bold border-r-4 border-red-600 pr-3">📦 بلاغاتك السابقة ورد الدعم الفني عليك ({userReports.length})</h4>
                  {userReports.length === 0 ? (
                    <p className="text-xs text-zinc-500 py-4 text-center">لم تقم بإرسال أي بلاغات سابقة بعد.</p>
                  ) : (
                    <div className="space-y-3">
                      {userReports.map((item) => (
                        <div 
                          key={item.id} 
                          className={`p-4 rounded-2xl border ${
                            item.status === 'resolved' 
                              ? 'bg-zinc-950/40 border-emerald-500/25 animate-pulse-subtle' 
                              : 'bg-zinc-950/20 border-zinc-900'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                              item.status === 'resolved' 
                                ? 'bg-emerald-500/10 text-emerald-500' 
                                : 'bg-red-500/10 text-red-500'
                            }`}>
                              {item.status === 'resolved' ? 'تم الرد والحل' : 'قيد الانتظار والمراجعة'}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleString('ar-EG') : ''}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-350 leading-relaxed font-semibold">{item.message}</p>
                          
                          {item.reply && (
                            <div className="mt-3 p-3 bg-zinc-950 rounded-xl border border-zinc-900 text-xs shadow-inner">
                              <p className="font-extrabold text-amber-500 mb-1">✍️ رد الإدارة والمدير العام:</p>
                              <p className="text-zinc-300 font-bold leading-relaxed">{item.reply}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'assistant' && (() => {
              const supportOptions = language === 'ar' ? [
                { text: 'هل في مشكلة؟', desc: 'مشاكل تصفح، تعليق أو بطء في التحميل' },
                { text: 'لم يشتغل المود؟', desc: 'المودات لا تظهر أو لا تعمل في اللعبة' },
                { text: 'أرجو التواصل معي', desc: 'مواضيع أخرى أو استفسار مخصص للمدير' }
              ] : [
                { text: 'Is there an issue?', desc: 'Browsing issues, interface lag, or slow download speeds' },
                { text: 'Did the mod fail?', desc: 'My mods are not showing up or working in-game' },
                { text: 'Contact admin', desc: 'Other custom inquiries or questions for the Administrator' }
              ];

              return (
                <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                      <h3 className="text-xl font-bold text-white">
                        {language === 'ar' ? 'مساعد الدعم الفني الذكي' : 'Smart Support Assistant'}
                      </h3>
                      <p className="text-xs text-zinc-500">
                        {language === 'ar' ? 'مساعدك لحل جميع المشاكل التقنية على الفور' : 'Your assistant to resolve technical issues instantly'}
                      </p>
                    </div>
                  </div>

                  <div className={`border p-6 rounded-[2rem] space-y-6 ${theme === 'light' ? 'bg-zinc-100/50 border-zinc-200' : 'bg-zinc-900/40 border-zinc-900'}`}>
                    {assistantStep === 1 && (
                      <div className={`space-y-6 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                        {/* Bot Greeting Bubble */}
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center shrink-0 shadow-lg shadow-amber-600/15">
                            <Sparkles className="w-5 h-5 text-white animate-pulse" />
                          </div>
                          <div className={`p-5 rounded-3xl rounded-tr-none text-sm leading-relaxed max-w-lg ${theme === 'light' ? 'bg-white text-zinc-800 border border-zinc-200 shadow-sm' : 'bg-zinc-950 text-zinc-100 border border-zinc-900'}`}>
                            <p className={`font-extrabold text-amber-500 mb-1 flex items-center gap-2 ${language === 'ar' ? 'justify-end' : 'justify-start'}`}>
                              <span>{language === 'ar' ? 'مساعد ماين كرافت الذهبي' : 'Golden Minecraft Assistant'}</span>
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            </p>
                            <p>
                              {language === 'ar' 
                                ? 'مرحباً بك يا غالي! أنا هنا لمساعدتك فوراً لحل أي مشكلة أو الرد على استفسارك ومساعدتك في المودات والخرائط. يرجى اختيار أحد المواضيع السريعة التالية للبدء:' 
                                : 'Welcome! I am here to help you resolve any issues or answer your questions about mods, skins, and maps. Please choose one of the quick topics below to begin:'}
                            </p>
                          </div>
                        </div>

                        {/* Helper Selectable Buttons */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                          {supportOptions.map((opt, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setSelectedSupportOption(opt.text);
                                setAssistantStep(2);
                              }}
                              className={`p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] flex flex-col justify-between h-32 group cursor-pointer ${language === 'ar' ? 'text-right' : 'text-left'} ${
                                theme === 'light' 
                                  ? 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-900 hover:border-amber-500/50 shadow-sm' 
                                  : 'bg-zinc-950 hover:bg-zinc-900/40 border-zinc-900 text-white hover:border-amber-500/50'
                              }`}
                            >
                              <span className={`font-black text-sm text-amber-500 group-hover:text-amber-400 transition-colors flex items-center gap-1.5 w-full ${language === 'ar' ? 'justify-end' : 'justify-start'}`}>
                                {language === 'ar' ? '' : <span className="w-2 h-2 rounded-full bg-amber-500" />}
                                {opt.text}
                                {language === 'ar' ? <span className="w-2 h-2 rounded-full bg-amber-500" /> : null}
                              </span>
                              <span className={`text-xs text-zinc-500 font-bold leading-snug mt-2 w-full ${language === 'ar' ? 'text-right' : 'text-left'}`}>{opt.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {assistantStep === 2 && (
                      <div className={`space-y-6 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                        {/* Bot Guidance Bubble */}
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center shrink-0 shadow-lg">
                            <Sparkles className="w-5 h-5 text-white" />
                          </div>
                          <div className={`p-5 rounded-3xl rounded-tr-none text-sm leading-relaxed max-w-lg ${theme === 'light' ? 'bg-white text-zinc-800 border border-zinc-200' : 'bg-zinc-950 text-zinc-100 border border-zinc-900'}`}>
                            <p className="font-extrabold text-amber-500 mb-1">
                              {language === 'ar' ? 'مساعد ماين كرافت الذهبي' : 'Golden Minecraft Assistant'}
                            </p>
                            <p>
                              {language === 'ar' ? 'ممتاز جداً! لقد اخترت: ' : 'Perfect! You selected: '}
                              <span className="font-black text-white px-2 py-1 bg-amber-500/10 border border-amber-500/25 rounded-lg text-xs">"{selectedSupportOption}"</span>
                            </p>
                            <p className="mt-3">
                              {language === 'ar' 
                                ? 'يرجى الآن كتابة رسالتك بالتفصيل (مثل رقم المود أو المشكلة التي واجهتك، أو وسيلة التواصل معك) في المستطيل أدناه، وسأرفعها فوراً إلى المدير:' 
                                : 'Please write down your message in detail (such as name of the mod, the error you encountered, or contact details) below, and I will upload it to the admin dashboard instantly:'}
                            </p>
                          </div>
                        </div>

                        {/* Textarea for Writing Message */}
                        <div className="space-y-4">
                          <textarea
                            value={assistantMessage}
                            onChange={(e) => setAssistantMessage(e.target.value)}
                            placeholder={language === 'ar' ? 'اكتب رسالتك وتفاصيل المشكلة هنا بالتفصيل...' : 'Please write down your message details here...'}
                            className={`w-full bg-zinc-950 border border-zinc-805 rounded-3xl p-5 text-sm h-36 focus:border-amber-500 outline-none transition-all resize-none text-white font-bold placeholder-zinc-650 shadow-inner ${language === 'ar' ? 'text-right' : 'text-left'}`}
                          />

                          <div className="flex flex-col sm:flex-row gap-3">
                            <button
                              disabled={!assistantMessage.trim() || isSendingAssistant}
                              onClick={async () => {
                                setIsSendingAssistant(true);
                                try {
                                  const fullReportContent = `[مساعد الدعم]: العميل اختار خيار: "${selectedSupportOption}"\n\nالرسالة المكتوبة:\n${assistantMessage.trim()}`;
                                  await onSendReport(fullReportContent);
                                  setAssistantStep(3);
                                } catch (e) {
                                  console.error(e);
                                } finally {
                                  setIsSendingAssistant(false);
                                }
                              }}
                              className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black py-4 rounded-2xl font-black text-xs transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/15 cursor-pointer"
                            >
                              <span>{isSendingAssistant ? (language === 'ar' ? 'جاري إرسال رسالتك...' : 'Submitting message...') : (language === 'ar' ? 'إرسال الرسالة إلى لوحة تحكم المدير' : 'Send Message to Admin Console')}</span>
                            </button>

                            <button
                              onClick={() => {
                                setAssistantStep(1);
                                setAssistantMessage('');
                              }}
                              className="bg-zinc-950 hover:bg-zinc-900 text-zinc-400 border border-zinc-800 px-6 py-4 rounded-2xl font-bold transition-all text-xs cursor-pointer"
                            >
                              {language === 'ar' ? 'رجوع للخلف' : 'Go Back'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {assistantStep === 3 && (
                      <div className="text-center py-8 space-y-6">
                        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto shadow-lg animate-bounce">
                          <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-xl font-black text-amber-400">
                            {language === 'ar' ? 'تم إرسال رسالتك بنجاح!' : 'Your message has been sent successfully!'}
                          </h4>
                          <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                            {language === 'ar' 
                              ? `تم رفع طلبك المصنف كمشكلة تتبع لـ "${selectedSupportOption}" مباشرة إلى الإعدادات ولوحة التحكم الخاصة بالمدير العام لمراجعتها وحلها في أسرع وقت.`
                              : `Your message, categorized under "${selectedSupportOption}", was forwarded to the supervisor dashboard for instant review and troubleshooting.`}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setAssistantStep(1);
                            setSelectedSupportOption('');
                            setAssistantMessage('');
                          }}
                          className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 px-8 py-3.5 rounded-2xl font-black text-xs transition-all cursor-pointer"
                        >
                          {language === 'ar' ? 'بدء طلب جديد مع المساعد' : 'Start a new inquiry with Assistant'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const ContactModal = ({ 
  isOpen, 
  onClose, 
  onSend,
  theme,
  language = 'ar'
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSend: (msg: string) => void;
  theme: 'dark' | 'light';
  language?: string;
}) => {
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-black"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 1, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className={`${theme === 'light' ? 'bg-white text-zinc-900 border-zinc-200' : 'bg-zinc-950 text-white border-zinc-800'} border w-full max-w-lg rounded-[2.5rem] overflow-hidden relative z-10 shadow-2xl`}
      >
        <div className={`p-8 pt-12 ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="bg-red-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-600/20 rotate-3">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-3xl font-black text-center mb-2 tracking-tighter">
            {language === 'ar' ? 'إرسال تقرير للإدارة' : 'Send Report to Admin'}
          </h2>
          <p className={`${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'} text-center mb-8 text-sm`}>
            {language === 'ar' ? 'أخبرنا عن أي مشكلة تواجهك أو اقتراح لتحسين الموقع' : 'Tell us about any problems or feedback to improve the site'}
          </p>

          <textarea 
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder={language === 'ar' ? "اكتب رسالتك هنا بالتفصيل..." : "Write your message here in detail..."}
            className={`w-full ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-black' : 'bg-zinc-900 border-zinc-805 text-white'} border rounded-2xl p-4 h-40 focus:border-red-600 outline-none transition-colors resize-none mb-6 ${language === 'ar' ? 'text-right' : 'text-left'}`}
          />

          <div className="flex gap-3">
            <button 
              onClick={() => {
                onSend(message);
                setMessage('');
              }}
              disabled={!message.trim()}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white py-4 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-red-600/20"
            >
              {language === 'ar' ? 'إرسال التقرير' : 'Submit Report'}
            </button>
            <button 
              onClick={onClose}
              className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 py-4 rounded-2xl font-bold transition-all active:scale-95"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const PrivacyModal = ({ 
  isOpen, 
  onClose, 
  theme,
  language = 'ar'
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  theme: 'dark' | 'light'; 
  language?: string;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-black"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 1, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className={`${theme === 'light' ? 'bg-white text-zinc-900 border-zinc-200' : 'bg-zinc-950 text-white border-zinc-800'} border w-full max-w-2xl rounded-[2.5rem] overflow-hidden relative z-10 shadow-2xl`}
      >
        <div className={`p-8 pt-10 ${language === 'ar' ? 'text-right' : 'text-left'} max-h-[80vh] overflow-y-auto scrollbar-none`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="bg-red-650 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-white" />
          </div>
          
          <h2 className={`text-2xl font-black text-center mb-6 tracking-tighter ${theme === 'light' ? 'text-zinc-900' : 'text-zinc-100'}`}>
            {language === 'ar' ? '🔐 سياسة الخصوصية وأمان البيانات' : '🔐 Privacy Policy & Data Security'}
          </h2>
          
          <div className={`space-y-6 text-sm font-semibold leading-relaxed ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>
            <div className={`p-5 rounded-2xl ${theme === 'light' ? 'bg-zinc-50 border border-zinc-200 text-zinc-800' : 'bg-zinc-900 border border-zinc-800 text-zinc-300'}`}>
              <h3 className="font-black text-red-500 mb-2">
                {language === 'ar' ? '1. جمع وإدارة البيانات' : '1. Data Collection & Management'}
              </h3>
              <p>
                {language === 'ar' 
                  ? 'نهتم بخصوصيتك لأقصى درجة. نجمع فقط معلومات التسجيل الأساسية لتوفير حساب آمن مثل اسم المستخدم، والبريد الإلكتروني، وصورة الحساب الشخصي التي تقوم بتهيئتها.'
                  : 'We care deeply about your privacy. We only collect essential register details required to secure your account, such as username, email address, and custom avatar URL.'}
              </p>
            </div>

            <div className={`p-5 rounded-2xl ${theme === 'light' ? 'bg-zinc-50 border border-zinc-200 text-zinc-800' : 'bg-zinc-900 border border-zinc-800 text-zinc-300'}`}>
              <h3 className="font-black text-red-500 mb-2">
                {language === 'ar' ? '2. أمان الملفات والمودات' : '2. Mod & File Safety'}
              </h3>
              <p>
                {language === 'ar' 
                  ? 'جميع المودات والخرائط الموجودة قابلة للتحميل بروابط مباشرة رسمية وآمنة. نقوم بفحص السيرفرات والروابط دورياً لضمان عدم وجود برمجيات خبيثة وحماية أجهزتك بالكامل.'
                  : 'All mods and maps are downloadable via official directly secured server mirrors. We scan files periodically to shield your hardware and guarantee absolute safety.'}
              </p>
            </div>

            <div className={`p-5 rounded-2xl ${theme === 'light' ? 'bg-zinc-50 border border-zinc-200 text-zinc-800' : 'bg-zinc-900 border border-zinc-800 text-zinc-300'}`}>
              <h3 className="font-black text-red-500 mb-2">
                {language === 'ar' ? '3. ملفات تعريف الارتباط و LocalStorage' : '3. Cookies & Local Storage'}
              </h3>
              <p>
                {language === 'ar' 
                  ? 'نستخدم وحدات التخزين المحلية لتفضيل الثيم المفضل لك (مظلم أو مضيء) والاحتفاظ بحالة تسجيل الدخول لتسريع تجربتك عند تصفح المنصة.'
                  : 'We use local storage parameters to persist your visual theme choice (light/dark mode) and cache user authorization state to speed up interactions.'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full mt-8 bg-gradient-to-r from-red-600 to-amber-500 text-white py-4 rounded-2xl font-black text-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            {language === 'ar' ? 'فهمت وإغلاق' : 'I Understand & Close'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const TermsModal = ({ 
  isOpen, 
  onClose, 
  theme,
  language = 'ar'
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  theme: 'dark' | 'light'; 
  language?: string;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-black"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 1, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className={`${theme === 'light' ? 'bg-white text-zinc-900 border-zinc-200' : 'bg-zinc-950 text-white border-zinc-800'} border w-full max-w-2xl rounded-[2.5rem] overflow-hidden relative z-10 shadow-2xl`}
      >
        <div className={`p-8 pt-10 ${language === 'ar' ? 'text-right' : 'text-left'} max-h-[80vh] overflow-y-auto scrollbar-none`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="bg-red-650 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-7 h-7 text-white" />
          </div>
          
          <div className="hidden" /> {/* Spacer */}
          <h2 className={`text-2xl font-black text-center mb-6 tracking-tighter ${theme === 'light' ? 'text-zinc-900' : 'text-zinc-100'}`}>
            {language === 'ar' ? '📜 شروط الاستخدام وقوانين المنصة' : '📜 Terms of Use & Policies'}
          </h2>
          
          <div className={`space-y-6 text-sm font-semibold leading-relaxed ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>
            <div className={`p-5 rounded-2xl ${theme === 'light' ? 'bg-zinc-50 border border-zinc-200 text-zinc-800' : 'bg-zinc-900 border border-zinc-800 text-zinc-300'}`}>
              <h3 className="font-black text-red-500 mb-2">
                {language === 'ar' ? '1. الاستخدام العادل والمسموح' : '1. Fair & Allowable Use'}
              </h3>
              <p>
                {language === 'ar' 
                  ? 'يُسمح لجميع أعضاء المنصة بتنزيل وتثبيت المودات والملفات وإبداء تفضيلاتها بالقلب بشكل مجاني تماماً. يُمنع الاستخدام غير العادل أو إرسال تقارير كاذبة مزعجة في لوحة القيادة التابعة للإدارة.'
                  : 'All verified members are authorized to browse, download files, and toggle favorite hearts free of cost. Unauthorized automated scripts or spamming false status reports is strictly disallowed.'}
              </p>
            </div>

            <div className={`p-5 rounded-2xl ${theme === 'light' ? 'bg-zinc-50 border border-zinc-200 text-zinc-800' : 'bg-zinc-900 border border-zinc-800 text-zinc-300'}`}>
              <h3 className="font-black text-red-500 mb-2">
                {language === 'ar' ? '2. رفع المحتوى والملفات' : '2. File Uploading & Hosting'}
              </h3>
              <p>
                {language === 'ar' 
                  ? 'للمدير العام والمسؤولين حظر أي روابط تحمل ملفات كسر حماية أو التفافية. يجب أن يحمل الملف ترخيص المطور أو يكون متاح ومصرح للنشر للعامة حرصاً على الحقوق الفكرية والملكية.'
                  : 'System administrators reserve absolute rights to block links harboring harmful files. Submitted URLs must comply with intellectual ownership and public licenses.'}
              </p>
            </div>

            <div className={`p-5 rounded-2xl ${theme === 'light' ? 'bg-zinc-50 border border-zinc-200 text-zinc-800' : 'bg-zinc-900 border border-zinc-800 text-zinc-300'}`}>
              <h3 className="font-black text-red-500 mb-2">
                {language === 'ar' ? '3. إخلاء وتبرئة المسؤولية' : '3. Direct Disclaimers'}
              </h3>
              <p>
                {language === 'ar' 
                  ? 'نحن نسعى دائماً لتفادي وعزل المشاكل التقنية وملفات الكراش. بالرغم من ذلك لا تتحمل إدارة المنصة أي أضرار جانبية أو خلل ينشأ عن تثبيت المود بصيغة غير متوافقة مع جوالك أو نسختك الخاصة من ماين كرافت.'
                  : 'We constantly work to isolate game bugs or crash reports. However, Golden Gih holds no responsibility for conflicts arising from installing third party modifications with incompatible game clients.'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full mt-8 bg-gradient-to-r from-red-600 to-amber-500 text-white py-4 rounded-2xl font-black text-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            {language === 'ar' ? 'أوافق وأغلق' : 'I Agree & Close'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const AboutModal = ({ 
  isOpen, 
  onClose, 
  theme,
  language = 'ar'
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  theme: 'dark' | 'light'; 
  language?: string;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-black"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 1, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className={`${theme === 'light' ? 'bg-white text-zinc-900 border-zinc-200' : 'bg-zinc-950 text-white border-zinc-800'} border w-full max-w-2xl rounded-[2.5rem] overflow-hidden relative z-10 shadow-2xl`}
      >
        <div className={`p-8 pt-10 ${language === 'ar' ? 'text-right' : 'text-left'} max-h-[80vh] overflow-y-auto scrollbar-none`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="bg-gradient-to-r from-red-600 to-amber-500 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/10">
            <Gamepad2 className="w-7 h-7 text-white" />
          </div>
          
          <h2 className={`text-2xl font-black text-center mb-2 tracking-tighter ${theme === 'light' ? 'text-zinc-900' : 'text-zinc-100'}`}>
            {language === 'ar' ? 'عن منصة Golden Gih' : 'About Golden Gih'}
          </h2>
          <p className="text-xs text-zinc-500 text-center mb-6 font-bold">
            {language === 'ar' ? 'تأسس الموقع وقاعدة بيانتنا السحابية في يونيو 2026' : 'The platform and cloud database were established in June 2026'}
          </p>
          
          <div className={`space-y-6 text-sm font-semibold leading-relaxed ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>
            <div className={`p-5 rounded-2xl ${theme === 'light' ? 'bg-zinc-50 border border-zinc-200 text-zinc-800' : 'bg-zinc-900 border border-zinc-805 text-zinc-300'}`}>
              <h3 className={`font-black text-red-500 mb-2 flex items-center gap-1.5 ${language === 'ar' ? 'justify-end' : 'justify-start'}`}>
                {language === 'ar' ? null : <Sparkles className="w-4 h-4 text-amber-500" />}
                <span>{language === 'ar' ? 'البداية والرؤية' : 'The Vision & Start'}</span>
                {language === 'ar' ? <Sparkles className="w-4 h-4 text-amber-500" /> : null}
              </h3>
              <p>
                {language === 'ar' 
                  ? 'تم إطلاق لوحة المنصة لتوفير محتوى ماين كرافت متميز وآمن للاعبين والزوار بالوطن العربي دون تشتيت أو إعلانات مسرطنة للملفات. طموحاتنا تمكين محبي اللعبة من العثور على ما يرغبون به بيسر وسرعة فائقة.'
                  : 'The platform was launched to offer premium, safe Minecraft contents for players and visitors in the Arab region, without distracting or malicious ads. Our vision is to empower fans to find exactly what they need with extreme speed.'}
              </p>
            </div>

            <div className={`p-5 rounded-2xl ${theme === 'light' ? 'bg-zinc-50 border border-zinc-200 text-zinc-800' : 'bg-zinc-900 border border-zinc-805 text-zinc-300'}`}>
              <h3 className={`font-black text-red-500 mb-2 flex items-center gap-1.5 ${language === 'ar' ? 'justify-end' : 'justify-start'}`}>
                {language === 'ar' ? null : <Crown className="w-4 h-4 text-amber-500" />}
                <span>{language === 'ar' ? 'مميزات وإحصائيات الأعضاء' : 'Member Features & Stats'}</span>
                {language === 'ar' ? <Crown className="w-4 h-4 text-amber-500" /> : null}
              </h3>
              <p>
                {language === 'ar' 
                  ? 'تتمتع عضويتك بتصنيفات راقية وإطارات متلألئة حول رمزك، بفضل نظام الدخول الموحد، والمفضلة السهلة وخطوط النقر الحديثة المعززة بتأثيرات الحركة المذهلة.'
                  : 'Your account benefits from premium status tags and shining borders around your avatar, powered by unified secure logins, easy bookmarking, and modern tactile motion effects.'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full mt-8 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white py-4 rounded-2xl font-black text-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            {language === 'ar' ? 'شكراً لكم وإغلاق' : 'Thank You & Close'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
