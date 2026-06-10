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
  Settings,
  ClipboardList,
  Plus,
  Trash2,
  MessageSquare,
  ShieldCheck,
  FileUp,
  Heart,
  Palette,
  UserCog,
  LayoutDashboard,
  Menu,
  Languages,
  Sun,
  Moon,
  Link as LinkIcon,
  Image as ImageIcon,
  Users,
  Crown,
  Zap,
  Sparkles
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
  serverTimestamp 
} from 'firebase/firestore';
// @ts-ignore
import { GoogleGenAI, Type } from '@google/genai';
// @ts-ignore
import backgroundImage from './assets/images/gih_background_1779447034941.png';

// Import Modular Dashboard Components
import { HeroSection } from './components/HeroSection';
import { GaugesSection } from './components/GaugesSection';
import { SidebarSection } from './components/SidebarSection';
import { SearchTab } from './components/SearchTab';
import { FavoritesTab } from './components/FavoritesTab';

// Types
interface Game {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  downloadUrl: string;
  category: string;
  rating: number;
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
}

interface Report {
  id: string;
  userId: string;
  userEmail: string;
  message: string;
  timestamp: any;
  status: 'pending' | 'resolved';
}

const PRESET_CAROUSEL_MODS: any[] = [];

const PRESET_GRID_MODS: any[] = [];

const AppContent = () => {
  const [user, setUser] = useState<User | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loginMode, setLoginMode] = useState<'options' | 'email-signin' | 'email-signup'>('options');
  const [localTheme, setLocalTheme] = useState<'dark' | 'light'>(
    (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  );
  const [colorIndex, setColorIndex] = useState(0);
  const [activeMainTab, setActiveMainTab] = useState<'home' | 'search' | 'favorites' | 'settings'>('home');
  const [activeSubTab, setActiveSubTab] = useState<'home' | 'for-you'>('home');
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Dynamic presets sourced from the Firestore loaded games array
  const PRESET_CAROUSEL_MODS = games.slice(0, 3);
  const PRESET_GRID_MODS = games;

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
          }
        });

        // Update profile / Create if not exists
        try {
          const docSnap = await getDoc(userRef);
          
          if (!docSnap.exists()) {
            // First time login - Create full profile
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || '',
              photoURL: currentUser.photoURL || '',
              role: currentUser.email === 'frassa0000@gmail.com' ? 'admin' : 'user',
              verified: currentUser.email === 'frassa0000@gmail.com' ? true : false,
              theme: 'dark',
              favorites: [],
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
            });
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
      setGames(gamesList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'games');
    });
    return () => unsubscribe();
  }, [loading, user]);

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
      if (loginMode === 'email-signin') {
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

  const filteredGames = games.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'الكل' || game.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredGames.length / GAMES_PER_PAGE);
  const paginatedGames = filteredGames.slice((currentPage - 1) * GAMES_PER_PAGE, currentPage * GAMES_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const isAdmin = user?.email === 'frassa0000@gmail.com';
  
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
    const newFavorites = (userProfile.favorites || []).includes(gameId)
      ? userProfile.favorites.filter(id => id !== gameId)
      : [...(userProfile.favorites || []), gameId];
    
    try {
      await updateDoc(doc(db, 'users', user.uid), { favorites: newFavorites });
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

  const handleAddGame = async (gameData: Omit<Game, 'id'>) => {
    if (!isAdmin) return;
    try {
      await addDoc(collection(db, 'games'), gameData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'games');
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'games', gameId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `games/${gameId}`);
    }
  };

  const handleResolveReport = async (reportId: string) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'reports', reportId), { status: 'resolved' });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} className={`min-h-screen transition-colors duration-500 ${localTheme === 'light' ? 'bg-white text-zinc-900' : 'bg-black text-white'} font-sans selection:bg-red-500 selection:text-white overflow-x-hidden`}>
      {/* Background Image Layer */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat bg-fixed transition-opacity duration-1000"
        style={{ 
          backgroundImage: `url(${backgroundImage})`,
          opacity: localTheme === 'light' ? 0.05 : 0.22,
        }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 transition-colors bg-black/90 border-zinc-900 border-b px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowMobileMenu(true)}
            className="md:hidden p-2 hover:bg-zinc-900 rounded-lg transition-colors text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center"
          >
            <span className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-red-500 to-red-650 font-sans select-none">
              G<span className="text-red-505 text-red-500">ih</span>
            </span>
          </motion.div>
        </div>

        {/* Center Pill Segmented Selection Control (الرئيسية / لك) */}
        <div className="flex bg-zinc-900/80 p-1 rounded-full border border-zinc-800/60 backdrop-blur-md">
          <button 
            onClick={() => {
              setActiveMainTab('home');
              setActiveSubTab('home');
            }}
            className={`px-5 py-1.5 rounded-full text-xs font-black transition-all ${
              activeMainTab === 'home' && activeSubTab === 'home' 
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {language === 'ar' ? 'الرئيسية' : 'Home'}
          </button>
          <button 
            onClick={() => {
              setActiveMainTab('home');
              setActiveSubTab('for-you');
            }}
            className={`px-5 py-1.5 rounded-full text-xs font-black transition-all ${
              activeMainTab === 'home' && activeSubTab === 'for-you' 
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {language === 'ar' ? 'لك' : 'For You'}
          </button>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {isAdmin && (
            <button 
              onClick={() => setShowAdminPanel(true)}
              className="hidden md:flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-zinc-805 transition-all text-white"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
              لوحة التحكم
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <div 
                className="relative cursor-pointer transition-transform active:scale-95"
                onClick={() => setShowUserPanel(true)}
              >
                <div className="w-9 h-9 rounded-full border border-red-500/40 p-0.5 bg-black overflow-hidden flex items-center justify-center">
                  <img 
                    src={user.photoURL && user.photoURL !== "" ? user.photoURL : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-zinc-950 rounded-full animate-pulse" />
              </div>
            </div>
          ) : (
            <button 
              onClick={() => {
                setLoginMode('options');
                setShowLoginModal(true);
              }}
              className="bg-red-650 hover:bg-red-600 text-white text-xs px-5 py-2 rounded-full font-black transition-all hover:scale-105 active:scale-95"
            >
              {language === 'ar' ? 'دخول' : 'Login'}
            </button>
          )}
        </div>
      </nav>

      {/* Main Content Render Router */}
      <main className="pt-24 pb-24 relative z-10 px-4 md:px-8 text-right">
        <div className="max-w-6xl mx-auto">
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
              />

              {/* HIGH-TECH SPEC GAUGES BAR */}
              <GaugesSection
                language={language}
                localTheme={localTheme}
              />

              {activeSubTab === 'home' ? (
                <div className="space-y-12">
                  {games.length === 0 ? (
                    /* Beautiful Empty State UI for initial blank slate */
                    <div className="bg-zinc-950 border border-zinc-900 w-full p-8 md:p-12 rounded-[2rem] text-center space-y-6 relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 w-80 h-80 bg-red-650/5 rounded-full blur-[100px] pointer-events-none" />
                      <div className="w-20 h-20 bg-zinc-900 border border-zinc-805 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                        <Sparkles className="w-10 h-10 text-amber-500 animate-pulse" />
                      </div>
                      <div className="space-y-3 max-w-xl mx-auto">
                        <h3 className="text-xl md:text-2xl font-black text-white">
                          {language === 'ar' ? 'بانتظار إضافة أول مود سحابي 🚀' : 'Waiting for Minecraft mods...'}
                        </h3>
                        <p className="text-xs sm:text-sm text-zinc-400 font-semibold leading-relaxed">
                          {language === 'ar' 
                            ? 'تم تفريغ الموقع وإزالة جميع المودات التجريبية بنجاح! كمدير للموقع، يمكنك التوجه إلى لوحة التحكم لإضافة وتصنيف ملفات المودات أو الخرائط لتظهر هنا فوراً لجميع الزوار.' 
                            : 'All demo mods were removed successfully! You can register/login, head over to the Control Panel, and publish Minecraft mods or texture files to showcase them live.'}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        {isAdmin ? (
                          <button
                            onClick={() => setShowAdminPanel(true)}
                            className="bg-red-650 hover:bg-red-600 text-white font-black text-xs px-8 py-3.5 rounded-xl transition-all shadow-lg flex items-center gap-2 uppercase tracking-wider"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            {language === 'ar' ? 'لوحة التحكم وإضافة مود جديد' : 'Open Control Panel'}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setLoginMode('options');
                              setShowLoginModal(true);
                            }}
                            className="bg-zinc-900 hover:bg-zinc-805 text-white font-black text-xs px-8 py-3.5 rounded-xl border border-zinc-800 transition-all flex items-center gap-2"
                          >
                            {language === 'ar' ? 'تسجيل دخول كمدير' : 'Login as Manager'}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
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
                                  src={PRESET_CAROUSEL_MODS[activeCarouselIndex]?.thumbnail} 
                                  alt={PRESET_CAROUSEL_MODS[activeCarouselIndex]?.title}
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
                              <p className="text-zinc-300 text-xs sm:text-sm font-semibold leading-relaxed text-right bg-zinc-900/40 p-4 border border-zinc-900/60 rounded-xl">
                                {language === 'ar' 
                                  ? PRESET_CAROUSEL_MODS[activeCarouselIndex]?.description 
                                  : (PRESET_CAROUSEL_MODS[activeCarouselIndex]?.descriptionEn || PRESET_CAROUSEL_MODS[activeCarouselIndex]?.description)}
                              </p>
                            </div>

                            {/* Action details footer */}
                            <div className="pt-6 border-t border-zinc-90 w-full flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                              <div className="flex items-center gap-2 text-emerald-400 font-bold text-[11px] bg-emerald-500/5 px-3 py-2 rounded-xl border border-emerald-500/10">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{language === 'ar' ? 'الحماية والتحقق: آمن ومعتمد 100%' : 'Certificate: Secure & Live'}</span>
                              </div>

                              <button 
                                onClick={() => window.open(PRESET_CAROUSEL_MODS[activeCarouselIndex]?.downloadUrl, '_blank')}
                                className="w-full sm:w-auto bg-red-650 hover:bg-red-550 text-white font-black text-xs px-8 py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider"
                              >
                                <Download className="w-4 h-4 text-white" />
                                {language === 'ar' ? 'تنزيل حزمة الملفات مجاناً' : 'Get Package Assets'}
                              </button>
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
                                      <img src={sliderItem.thumbnail} alt="" className="w-full h-full object-cover" />
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
                                className={`rounded-2xl border overflow-hidden p-3.5 flex flex-col justify-between transition-all duration-300 shadow-xl ${
                                  isMainSpotlight 
                                    ? 'bg-gradient-to-br from-zinc-950 via-zinc-950 to-amber-950/20 border-amber-500/20' 
                                    : 'bg-zinc-950 border-zinc-900'
                                }`}
                              >
                                <div className="space-y-3.5 text-right">
                                  {/* Thumbnail preview aspect header */}
                                  <div className="aspect-video relative rounded-xl overflow-hidden bg-zinc-90 w-full border border-zinc-900">
                                    <img 
                                      src={item.thumbnail} 
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
                                    {language === 'ar' ? 'سريع وآمن' : 'Fast & Secure'}
                                  </span>

                                  <button 
                                    onClick={() => window.open(item.downloadUrl, '_blank')}
                                    className={`p-2 rounded-xl transition-all flex items-center justify-center border ${
                                      isMainSpotlight 
                                        ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white border-amber-500/20 hover:border-amber-500' 
                                        : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border-zinc-800'
                                    }`}
                                    title={language === 'ar' ? 'تحميل مجاني' : 'Direct Download'}
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
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
                        className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-4 flex flex-col md:flex-row gap-4 items-center group hover:border-zinc-800 transition text-right bg-zinc-950"
                      >
                        <img 
                          src={mod.thumbnail} 
                          alt={mod.title}
                          className="w-full md:w-28 h-28 object-cover rounded-2xl border border-zinc-900 shrink-0"
                        />
                        <div className="flex-1 text-right w-full space-y-3">
                          <div>
                            <span className="text-[9px] font-black text-red-500 uppercase bg-red-650/10 px-2 py-0.5 rounded border border-red-500/10">
                              {mod.category}
                            </span>
                            <h3 className="text-base font-black text-white mt-1 group-hover:text-red-400 transition">
                              {mod.title}
                            </h3>
                            <p className="text-zinc-505 text-xs leading-normal line-clamp-1">
                              {language === 'ar' ? 'مود معتمد وآمن تماماً ومتوافق مع أحدث إصدارات الألعاب.' : 'Tested, authentic premium addon package ready for instant setup.'}
                            </p>
                          </div>
                          
                          <button 
                            onClick={() => window.open(mod.downloadUrl, '_blank')}
                            className="bg-zinc-900 hover:bg-zinc-850 text-white text-xs font-black px-4 py-2 rounded-xl transition w-max flex items-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5 text-red-500" />
                            {language === 'ar' ? 'تحميل فوري' : 'Download Now'}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* This is the marketplace container when on home tab */}
          {activeMainTab === 'home' && activeSubTab === 'home' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
              {/* 1. Marketplace Core Catalog List (Column Span 8) */}
              <div id="available-mods-anchor" className="lg:col-span-12 xl:col-span-8 space-y-6 text-right">
                {/* Title Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-900 pb-4 gap-2">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 justify-start">
                      <TrendingUp className="w-6 h-6 text-red-500" />
                      <span>{t.availableMods}</span>
                    </h2>
                    <p className="text-xs font-semibold text-zinc-550">
                      {language === 'ar' ? 'تصفح وحمل مئات المودات المعتمدة والآمنة فوراً' : 'Browse and download secure community contributions instantly'}
                    </p>
                  </div>
                  <span className="text-xs font-black text-red-400 bg-red-500/10 px-3 py-1.5 rounded-xl border border-red-605/10 self-start sm:self-center">
                    {filteredGames.length} {language === 'ar' ? 'مود متوفر' : 'Mods Available'}
                  </span>
                </div>

                {/* Category Filtering Selection Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-5 py-2.5 rounded-xl whitespace-nowrap transition-all text-xs font-black select-none ${
                        selectedCategory === cat 
                          ? 'bg-red-650 text-white shadow-lg' 
                          : `${localTheme === 'light' ? 'bg-zinc-100 text-zinc-650 hover:bg-zinc-200' : 'bg-zinc-900 border border-zinc-900 text-zinc-405 hover:bg-zinc-800'}`
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Render Core Game Listings */}
                {paginatedGames.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <AnimatePresence mode="popLayout">
                      {paginatedGames.map((game, idx) => {
                        const tilts = ['rotate-[-1.5deg]', 'rotate-[1.8deg]', 'rotate-[-2deg]', 'rotate-[2.5deg]', 'rotate-[-1deg]', 'rotate-[1.2deg]'];
                        const tiltAngle = isAsymmetricalMode 
                          ? tilts[idx % tilts.length]
                          : '';

                        const getCategoryVibe = (category: string) => {
                          const norm = category.toUpperCase();
                          if (norm.includes('MOD') || norm.includes('مود')) {
                            return {
                              gradient: 'from-rose-650 to-red-650',
                              shadowClass: 'shadow-[6px_6px_0px_#dc2626]',
                              borderClass: 'border-red-600/30 hover:border-red-500',
                              badgeBg: 'bg-rose-500/10 text-rose-400 border-red-500/25',
                              btnBg: 'bg-gradient-to-r from-red-650 to-rose-600',
                              activeColor: 'text-rose-455',
                            };
                          }
                          if (norm.includes('MAP') || norm.includes('خرا') || norm.includes('خرط')) {
                            return {
                              gradient: 'from-emerald-500 to-teal-600',
                              shadowClass: 'shadow-[6px_6px_0px_#10b981]',
                              borderClass: 'border-emerald-600/30 hover:border-emerald-500',
                              badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                              btnBg: 'bg-gradient-to-r from-emerald-500 to-teal-650',
                              activeColor: 'text-emerald-400',
                            };
                          }
                          if (norm.includes('SHA') || norm.includes('شيد')) {
                            return {
                              gradient: 'from-cyan-500 to-sky-650',
                              shadowClass: 'shadow-[6px_6px_0px_#06b6d4]',
                              borderClass: 'border-cyan-600/30 hover:border-cyan-505',
                              badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-505/20',
                              btnBg: 'bg-gradient-to-r from-cyan-600 to-sky-600',
                              activeColor: 'text-cyan-450',
                            };
                          }
                          if (norm.includes('RES') || norm.includes('موا') || norm.includes('مور')) {
                            return {
                              gradient: 'from-amber-500 to-orange-600',
                              shadowClass: 'shadow-[6px_6px_0px_#f59e0b]',
                              borderClass: 'border-amber-600/30 hover:border-amber-500',
                              badgeBg: 'bg-amber-500/10 text-amber-405 border-amber-500/20',
                              btnBg: 'bg-gradient-to-r from-amber-505 to-yellow-500',
                              activeColor: 'text-amber-400',
                            };
                          }
                          return {
                            gradient: 'from-fuchsia-500 via-pink-500 to-violet-500',
                            shadowClass: 'shadow-[6px_6px_0px_#d946ef]',
                            borderClass: 'border-fuchsia-500/30 hover:border-fuchsia-400',
                            badgeBg: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
                            btnBg: 'bg-gradient-to-r from-fuchsia-600 to-pink-500',
                            activeColor: 'text-fuchsia-400',
                          };
                        };

                        const cardVibe = getCategoryVibe(game.category);
                        
                        const shapeClass = 'rounded-2xl';

                        const cardCustomStyles = 'bg-zinc-950 border-zinc-900 hover:border-zinc-850 shadow-2xl rounded-2xl';
                        
                        return (
                          <motion.div
                            key={game.id}
                            layout
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-80px" }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            whileHover={{ y: -4, transition: { duration: 0.2 } }}
                            className={`group ${cardCustomStyles} border overflow-hidden relative flex flex-col justify-between`}
                          >
                            <div>
                              <div className="aspect-video relative overflow-hidden bg-zinc-900 border-b border-zinc-900">
                                <img 
                                  src={(game.thumbnail && game.thumbnail !== "") ? game.thumbnail : 'https://images.unsplash.com/photo-1587573089734-09cb69c0f2b4?q=80&w=400&auto=format&fit=crop'} 
                                  alt={game.title} 
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                                <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 text-xs font-black text-white border border-zinc-800">
                                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                  {game.rating}
                                </div>
                              </div>
                              
                              <div className="p-5 space-y-3 text-right">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-lg border text-red-500 bg-red-650/10 border-red-600/10">
                                    {game.category}
                                  </span>
                                  <button 
                                    onClick={() => toggleFavorite(game.id)}
                                    className={`p-2 rounded-xl transition-all ${
                                      userProfile?.favorites?.includes(game.id) 
                                        ? 'bg-red-650 text-white shadow-lg shadow-red-600/20' 
                                        : 'bg-zinc-905 text-zinc-500 hover:text-white hover:bg-zinc-800'
                                    }`}
                                  >
                                    <Heart className={`w-4 h-4 ${userProfile?.favorites?.includes(game.id) ? 'fill-current' : ''}`} />
                                  </button>
                                </div>
                                <h3 className="text-lg font-black leading-tight text-white transition-colors uppercase group-hover:text-red-500">{game.title}</h3>
                                <p className="text-zinc-400 text-xs font-semibold leading-relaxed line-clamp-2">{game.description}</p>
                              </div>
                            </div>
                            
                            <div className="p-5 pt-0">
                              <button 
                                onClick={() => window.open(game.downloadUrl, '_blank')}
                                className="w-full text-white text-xs font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md bg-zinc-900 hover:bg-zinc-850 border border-zinc-905 hover:border-zinc-750"
                              >
                                <Download className="w-4 h-4 text-white" />
                                {language === 'ar' ? 'تحميل مجاني الآن' : 'Instantly Install'}
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="text-center py-20 bg-zinc-950 border border-zinc-900 rounded-[2rem] border-dashed">
                    <Gamepad2 className="w-12 h-12 text-zinc-855 mx-auto mb-4" />
                    <h3 className="text-sm font-black text-zinc-400">لا توجد مذكرات أو مودات تطابق بحثك حالياً</h3>
                    <p className="text-xs text-zinc-650 mt-1">جرب إدخال كلمات بحث أخرى أو تعديل تصفية الفئات</p>
                  </div>
                )}

                {/* Core Pagination Row */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-3 bg-zinc-950/20 p-3 rounded-2xl border border-zinc-900/40 w-max mx-auto">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-3 rounded-xl bg-zinc-950 border border-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95 text-xs font-bold"
                    >
                      {language === 'ar' ? 'السابق' : 'Prev'}
                    </button>
                    
                    <div className="flex items-center gap-1.5">
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`w-9 h-9 rounded-xl text-xs font-black transition active:scale-95 ${
                            currentPage === i + 1 
                              ? 'bg-red-650 text-white shadow-lg' 
                              : 'bg-zinc-950 border border-zinc-900 text-zinc-550 hover:text-white'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-3 rounded-xl bg-zinc-950 border border-zinc-900 text-white hover:bg-zinc-850 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95 text-xs font-bold"
                    >
                      {language === 'ar' ? 'التالي' : 'Next'}
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Elite Exclusive Sidebar Panel (Column Span 4) */}
              <div className="lg:col-span-12 xl:col-span-4 space-y-6 text-right">
                <SidebarSection
                  language={language}
                  presetGridMods={PRESET_GRID_MODS}
                  onDownload={(url) => window.open(url, '_blank')}
                />
              </div>
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
            />
          )}

          {/* DYNAMIC SAVED FAVORITES HUB TAB VIEW */}
          {activeMainTab === 'favorites' && (
            <FavoritesTab
              language={language}
              user={user}
              userProfile={userProfile}
              games={games}
              toggleFavorite={toggleFavorite}
              setLoginMode={setLoginMode}
              setShowLoginModal={setShowLoginModal}
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
                  Golden Gih
                </span>
              </motion.h1>

              {/* Description */}
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className={`text-zinc-400 text-sm md:text-lg max-w-xl mb-8 leading-relaxed font-black ${language === 'ar' ? 'text-right' : 'text-left'}`}
              >
                {language === 'ar' 
                  ? 'منصتك الشاملة لتحميل وتنزيل أفضل إضافات الألعاب والخرائط وسرعات السيرفرات الآمنة بنسبة 100%. ابدأ رحلتك الآن في تصفح مئات المودات المصنفة!' 
                  : 'Your ultimate destination for lightning-fast mods, customized shaders, and immersive world maps. Completely safe, tested, and updated daily!'}
              </motion.p>

              {/* Redesigned Search Box */}
              <div className="w-full max-w-lg mb-6 relative group z-25">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl blur opacity-25 group-focus-within:opacity-40 transition duration-300" />
                <div className={`relative flex items-center ${localTheme === 'light' ? 'bg-white border-zinc-200' : 'bg-black/90 border-zinc-800'} border rounded-2xl p-1.5 shadow-xl`}>
                  <div className={`flex items-center flex-1 ${language === 'ar' ? 'pr-4' : 'pl-4'}`}>
                    <Search className="w-5 h-5 text-red-500 shrink-0" />
                    <input 
                      type="text" 
                      placeholder={t.searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full bg-transparent border-none ${language === 'ar' ? 'pr-3 pl-3 text-right' : 'pl-3 pr-3 text-left'} focus:outline-none focus:ring-0 text-sm py-2.5 text-white placeholder:text-zinc-500`}
                    />
                  </div>
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="p-2 hover:bg-zinc-800/10 text-zinc-500 hover:text-white rounded-xl transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Tags Suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 justify-center lg:justify-start">
                <span className="text-xs text-zinc-500 font-bold ml-1">
                  {language === 'ar' ? 'بحث شائع:' : 'Hot categories:'}
                </span>
                {categories.filter(c => c !== 'الكل' && c !== 'All').map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      // Scroll to target content
                      const el = document.getElementById("available-mods-anchor");
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`text-[11px] font-black px-2.5 py-1 rounded-lg border transition-all ${
                      selectedCategory === cat 
                        ? 'bg-red-600/20 text-red-400 border-red-600/40' 
                        : `${localTheme === 'light' ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border-zinc-200' : 'bg-zinc-900/40 hover:bg-zinc-800 border-zinc-800 text-zinc-400'}`
                    }`}
                  >
                    #{cat}
                  </button>
                ))}
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
                    : 'bg-zinc-950/40 border-zinc-800/80 hover:bg-zinc-900/40'
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

      {/* Categories */}
      <section className="py-8 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2 rounded-full whitespace-nowrap transition-all font-bold ${
                  selectedCategory === cat 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' 
                    : `${localTheme === 'light' ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}`
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Games Grid */}
      <section id="available-mods-anchor" className="py-12 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className={`text-2xl font-black flex items-center gap-2 ${language === 'ar' ? 'flex-row' : 'flex-row-reverse'}`}>
              <TrendingUp className="w-6 h-6 text-red-500" />
              {t.availableMods}
            </h2>
            <p className="text-red-400 text-sm">
              {filteredGames.length} {language === 'ar' ? 'مود متوفر' : 'Mods Available'}
            </p>
          </div>

          {paginatedGames.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {paginatedGames.map((game) => (
                  <motion.div
                    key={game.id}
                    layout
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -10 }}
                    className={`group ${localTheme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900/40 border-zinc-800'} border rounded-3xl overflow-hidden relative`}
                  >
                    <div className="aspect-video relative overflow-hidden">
                      <img 
                        src={(game.thumbnail && game.thumbnail !== "") ? game.thumbnail : 'https://images.unsplash.com/photo-1587573089734-09cb69c0f2b4?q=80&w=400&auto=format&fit=crop'} 
                        alt={game.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                      <div className="absolute top-4 right-4 bg-red-600/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 text-xs font-bold">
                        <Star className="w-3 h-3 fill-white" />
                        {game.rating}
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-red-500 uppercase tracking-widest">{game.category}</span>
                        <button 
                          onClick={() => toggleFavorite(game.id)}
                          className={`p-2 rounded-xl transition-all ${userProfile?.favorites?.includes(game.id) ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300'}`}
                        >
                          <Heart className={`w-4 h-4 ${userProfile?.favorites?.includes(game.id) ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                      <h3 className="text-xl font-bold mb-2 group-hover:text-red-500 transition-colors">{game.title}</h3>
                      <p className={`${localTheme === 'light' ? 'text-zinc-500' : 'text-red-200/50'} text-sm mb-6 line-clamp-2`}>{game.description}</p>
                      
                      <button 
                        onClick={() => window.open(game.downloadUrl, '_blank')}
                        className={`w-full ${localTheme === 'light' ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'bg-white text-red-950 hover:bg-red-100'} py-3 rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-95`}
                      >
                        <Download className="w-5 h-5" />
                        تحميل الآن
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className={`text-center py-20 ${localTheme === 'light' ? 'bg-zinc-50 border-zinc-100' : 'bg-zinc-900/20 border-zinc-800'} rounded-3xl border border-dashed`}>
              <Gamepad2 className={`w-16 h-16 ${localTheme === 'light' ? 'text-zinc-200' : 'text-zinc-800'} mx-auto mb-4`} />
              <h3 className={`text-xl font-bold ${localTheme === 'light' ? 'text-zinc-400' : 'text-zinc-600'}`}>لا توجد نتائج تطابق بحثك</h3>
              <p className={localTheme === 'light' ? 'text-zinc-300' : 'text-zinc-800'}>جرب كلمات بحث أخرى</p>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              
              <div className="flex items-center gap-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-12 h-12 rounded-2xl font-bold transition-all active:scale-95 ${
                      currentPage === i + 1 
                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Join Community Section for Non-Logged Users */}
      {!user && (
        <section className="py-20 px-4 md:px-8">
          <div className="max-w-6xl mx-auto bg-gradient-to-br from-red-600 to-red-900 rounded-[3rem] p-8 md:p-16 relative overflow-hidden shadow-2xl shadow-red-600/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="text-center md:text-right max-w-xl">
                <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tighter leading-tight">ما عندك حساب؟<br/>ما في مشكلة!</h2>
                <p className="text-red-100 text-lg mb-8 leading-relaxed">
                  انضم لمجتمع اللاعبين الآن واستمتع بتحميل أحدث المودات. يمكنك البدء فوراً كزائر لتجربة الموقع أو إنشاء حساب لحفظ محتواك المفضل.
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <button 
                    onClick={() => {
                      setLoginMode('email-signup');
                      setShowLoginModal(true);
                    }}
                    className="bg-white text-red-600 px-8 py-4 rounded-2xl font-black text-lg hover:bg-zinc-100 transition-all shadow-xl active:scale-95"
                  >
                    إنشاء حساب جديد
                  </button>
                  <button 
                    onClick={handleGuestLogin}
                    className="bg-black/20 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-black/30 transition-all active:scale-95"
                  >
                    الدخول كزائر
                  </button>
                </div>
              </div>
              
              <div className="relative">
                <motion.div 
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 shadow-2xl"
                >
                  <Ghost className="w-32 h-32 text-white opacity-80" />
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Floating Sticky Bottom Glass Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-[100] bg-black/95 border-t border-zinc-900 px-6 py-4 flex justify-around items-center shadow-[0_-10px_35px_rgba(0,0,0,0.5)]">
        <button 
          id="tab-btn-home"
          onClick={() => {
            setActiveMainTab('home');
            setActiveSubTab('home');
          }}
          className={`flex flex-col items-center gap-1 transition-all ${activeMainTab === 'home' ? 'text-red-500 scale-105' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Gamepad2 className="w-5 h-5" />
          <span className="text-[10px] font-black">{language === 'ar' ? 'الرئيسية' : 'Home'}</span>
        </button>

        <button 
          id="tab-btn-search"
          onClick={() => setActiveMainTab('search')}
          className={`flex flex-col items-center gap-1 transition-all ${activeMainTab === 'search' ? 'text-red-500 scale-105' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-black">{language === 'ar' ? 'البحث' : 'Search'}</span>
        </button>

        <button 
          id="tab-btn-favorites"
          onClick={() => setActiveMainTab('favorites')}
          className={`flex flex-col items-center gap-1 transition-all ${activeMainTab === 'favorites' ? 'text-red-500 scale-105' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Heart className="w-5 h-5 hover:scale-110 transition" />
          <span className="text-[10px] font-black">{language === 'ar' ? 'المفضلة' : 'Favorites'}</span>
        </button>

        <button 
          id="tab-btn-settings"
          onClick={() => setActiveMainTab('settings')}
          className={`flex flex-col items-center gap-1 transition-all ${activeMainTab === 'settings' ? 'text-red-500 scale-105' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-black">{language === 'ar' ? 'إعدادات' : 'Settings'}</span>
        </button>
      </nav>

      {/* Footer */}
      <footer className={`py-12 px-4 md:px-8 border-t ${localTheme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-black border-zinc-900'}`}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-r from-red-600 to-amber-500 p-2 rounded-xl">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-black text-white tracking-tight">Golden Gih</span>
            </div>
          </div>
          
          <div className="flex gap-8 text-sm text-zinc-500">
            <a href="#" className="hover:text-white transition-colors">سياسة الخصوصية</a>
            <a href="#" className="hover:text-white transition-colors">شروط الاستخدام</a>
            <button 
              onClick={() => setShowContactModal(true)}
              className="hover:text-white transition-colors"
            >
              اتصل بنا
            </button>
          </div>

          <p className="text-zinc-700 text-sm">
            © 2026 Golden Gih. {t.footerRights}
          </p>
        </div>
      </footer>

      {/* Admin Panel Modal */}
      <AdminPanel 
        isOpen={showAdminPanel} 
        onClose={() => setShowAdminPanel(false)} 
        onAddGame={handleAddGame}
        onDeleteGame={handleDeleteGame}
        onResolveReport={handleResolveReport}
        onDeleteReport={handleDeleteReport}
        games={games}
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
        allGames={games}
        onUpdateProfile={updateProfile}
        onSendReport={handleSendReport}
        theme={localTheme}
      />

      {/* Contact Modal */}
      <ContactModal 
        isOpen={showContactModal} 
        onClose={() => setShowContactModal(false)} 
        onSend={handleSendReport}
        theme={localTheme}
      />

      {/* Mobile Side Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <div className="fixed inset-0 z-[150] md:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`absolute top-0 left-0 w-[280px] h-full ${localTheme === 'light' ? 'bg-white' : 'bg-zinc-950'} shadow-2xl p-6 flex flex-col`}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-r from-red-600 to-amber-500 p-2 rounded-lg">
                    <Gamepad2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex flex-col leading-tight text-left">
                    <span className="text-xs font-black text-white tracking-tight">Golden Gih</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                  {/* Language Selector */}
                  <div className="mb-4">
                    <p className={`text-[10px] font-black uppercase text-zinc-500 mb-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      {language === 'ar' ? 'لغة الموقع / Language' : 'Website Language'}
                    </p>
                    <div className="grid grid-cols-2 gap-2 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800">
                      <button 
                        onClick={() => {
                          setLanguage('ar');
                          setShowMobileMenu(false);
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${language === 'ar' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-400 hover:text-zinc-200'}`}
                      >
                        <span>العربية</span>
                      </button>
                      <button 
                        onClick={() => {
                          setLanguage('en');
                          setShowMobileMenu(false);
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${language === 'en' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-400 hover:text-zinc-200'}`}
                      >
                        <span>English</span>
                      </button>
                    </div>
                  </div>

                  {[
                    { label: t.home, icon: LayoutDashboard },
                    { label: t.trending, icon: Flame },
                    { label: t.new, icon: Star },
                  ].map((item, i) => (
                  <button 
                    key={i}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-zinc-900 transition-colors ${language === 'ar' ? 'text-right' : 'text-left'} font-bold w-full`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <item.icon className="w-5 h-5 text-red-500" />
                    <span>{item.label}</span>
                  </button>
                ))}
                
                {isAdmin && (
                  <button 
                    onClick={() => {
                      setShowMobileMenu(false);
                      setShowAdminPanel(true);
                    }}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-zinc-900 transition-colors text-right font-bold w-full mt-4 border border-zinc-800"
                  >
                    <ShieldCheck className="w-5 h-5 text-red-500" />
                    <span>لوحة التحكم</span>
                  </button>
                )}
              </div>

              <div className="mt-auto pt-6 border-t border-zinc-900">
                <button 
                  onClick={() => {
                    setShowMobileMenu(false);
                    setShowContactModal(true);
                  }}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-zinc-900 transition-colors text-right font-bold w-full"
                >
                  <MessageSquare className="w-5 h-5 text-zinc-500" />
                  <span>اتصل بنا</span>
                </button>
                <div className="mt-4 px-4">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-black">Golden Gih</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-[2rem] overflow-hidden relative z-10 shadow-2xl"
            >
              <button 
                onClick={() => setShowLoginModal(false)}
                className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="p-8 pt-12">
                <div className="bg-red-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-600/20 rotate-3">
                  <Gamepad2 className="w-8 h-8 text-white" />
                </div>
                
                <h2 className="text-2xl font-black text-center mb-2 tracking-tighter">مرحباً بك في Golden Gih</h2>
                <p className="text-zinc-500 text-center mb-8 text-sm">اختر طريقة الدخول المفضلة لديك</p>

                {authError && (
                  <div className="bg-red-900/20 border border-red-900/50 text-red-400 p-3 rounded-xl mb-6 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {authError}
                  </div>
                )}

                {loginMode === 'options' ? (
                  <div className="space-y-3">
                    <button 
                      onClick={handleGuestLogin}
                      disabled={authLoading}
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-400 h-14 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-800 hover:text-white transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      <Ghost className="w-5 h-5" />
                      الدخول السريع كزائر (بدون حساب)
                    </button>

                    <div className="flex items-center gap-4 my-6">
                      <div className="h-px bg-zinc-800 flex-1" />
                      <span className="text-zinc-600 text-xs font-bold uppercase tracking-widest">أو سجل حساباً دائماً</span>
                      <div className="h-px bg-zinc-800 flex-1" />
                    </div>

                    <button 
                      onClick={handleGoogleLogin}
                      disabled={authLoading}
                      className="w-full bg-white text-black h-14 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      الدخول عبر جوجل
                    </button>

                    <button 
                      onClick={handleGithubLogin}
                      disabled={authLoading}
                      className="w-full bg-zinc-800 text-white h-14 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-700 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      <Github className="w-5 h-5" />
                      الدخول عبر جيت هاب
                    </button>

                    <button 
                      onClick={() => setLoginMode('email-signin')}
                      disabled={authLoading}
                      className="w-full bg-zinc-900 border border-zinc-800 text-white h-14 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      <Mail className="w-5 h-5 text-red-500" />
                      البريد الإلكتروني
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 mr-4 uppercase tracking-widest">البريد الإلكتروني</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full bg-zinc-900 border border-zinc-800 h-14 rounded-2xl pl-12 pr-6 focus:outline-none focus:border-red-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 mr-4 uppercase tracking-widest">كلمة المرور</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                        <input 
                          type="password" 
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-zinc-900 border border-zinc-800 h-14 rounded-2xl pl-12 pr-6 focus:outline-none focus:border-red-500 transition-colors"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-red-600 text-white h-14 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-500 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
                    >
                      {authLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          {loginMode === 'email-signin' ? 'تسجيل الدخول' : 'إنشاء حساب'}
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>

                    <div className="text-center mt-6">
                      <button 
                        type="button"
                        onClick={() => setLoginMode(loginMode === 'email-signin' ? 'email-signup' : 'email-signin')}
                        className="text-sm text-zinc-500 hover:text-red-500 transition-colors"
                      >
                        {loginMode === 'email-signin' ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب بالفعل؟ سجل دخولك'}
                      </button>
                    </div>

                    <button 
                      type="button"
                      onClick={() => setLoginMode('options')}
                      className="w-full text-zinc-600 text-xs font-bold uppercase tracking-widest mt-4 hover:text-zinc-400 transition-colors"
                    >
                      العودة للخيارات
                    </button>
                  </form>
                )}
              </div>
              
              <div className="bg-zinc-900/50 p-6 text-center border-t border-zinc-800">
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

// --- Components ---

const AdminPanel = ({ 
  isOpen, 
  onClose, 
  onAddGame, 
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
  onDeleteGame: (id: string) => void;
  onResolveReport: (id: string) => void;
  onDeleteReport: (id: string) => void;
  games: Game[];
  language: 'ar' | 'en';
  t: any;
  theme: 'dark' | 'light';
  user: User | null;
  userProfile: UserProfileData | null;
}) => {
  const [activeTab, setActiveTab] = useState<'games' | 'reports' | 'users'>('games');
  const [reports, setReports] = useState<Report[]>([]);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [userSearchText, setUserSearchText] = useState('');

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

  const [newGame, setNewGame] = useState({
    title: '',
    description: '',
    thumbnail: '',
    downloadUrl: '',
    category: 'مودات',
    rating: 5
  });
  const [quickAddLink, setQuickAddLink] = useState('');
  
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
      const base64Data = event.target?.result as string;
      
      try {
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
                mimeType: file.type,
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/95 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`${theme === 'light' ? 'bg-white text-zinc-900 border-zinc-200' : 'bg-zinc-950 text-white border-zinc-800'} border w-full max-w-5xl h-full md:h-[80vh] rounded-none md:rounded-[2.5rem] overflow-hidden relative z-10 flex flex-col shadow-2xl`}
      >
        <div className={`p-4 md:p-6 border-b ${theme === 'light' ? 'border-zinc-200 bg-zinc-50' : 'border-zinc-900 bg-zinc-900/50'} flex items-center justify-between`}>
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
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Plus className="w-5 h-5 text-red-500" />
                      إضافة محتوى جديد
                    </h3>
                    <div className="flex items-center gap-2">
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    {/* Mod Thumbnail Upload block */}
                    <div className="flex flex-col gap-2 col-span-1 md:col-span-2 bg-zinc-950/20 p-4 rounded-2xl border border-zinc-800">
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
                    <div className="flex flex-col gap-2 col-span-1 md:col-span-2 bg-zinc-950/20 p-4 rounded-2xl border border-zinc-800">
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
                      className="col-span-1 md:col-span-2 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm h-24 focus:border-red-600 outline-none transition-colors resize-none"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      if (isImageUnsafe) {
                        alert(language === 'ar' ? 'عذراً، لا يمكنك النشر بصورة غير لائقة!' : 'Sorry, you cannot publish with inappropriate images!');
                        return;
                      }
                      onAddGame(newGame);
                      setNewGame({ title: '', description: '', thumbnail: '', downloadUrl: '', category: 'مودات', rating: 5 });
                      setModFileName('');
                    }}
                    disabled={imageLoading || isImageUnsafe}
                    className="mt-6 w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {imageLoading ? 'جاري فحص الصورة بالذكاء الاصطناعي...' : 'نشر المحتوى الآن'}
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold">المحتوى المنشور ({games.length})</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {games.map(game => (
                      <div key={game.id} className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          {game.thumbnail && game.thumbnail !== "" ? (
                            <img src={game.thumbnail} className="w-16 h-10 object-cover rounded-lg bg-zinc-800" />
                          ) : (
                            <div className="w-16 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-zinc-600" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold">{game.title}</h4>
                            <p className="text-xs text-zinc-500">{game.category}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => onDeleteGame(game.id)}
                          className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : activeTab === 'reports' ? (
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-6">تقارير المستخدمين ({reports.length})</h3>
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
                              <div className={`w-2 h-2 rounded-full ${isSystemWarning ? 'bg-red-500 animate-ping' : report.status === 'resolved' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">{report.userEmail}</span>
                            </div>
                            <span className="text-[10px] text-zinc-600">
                              {report.timestamp?.toDate().toLocaleString('ar-EG')}
                            </span>
                          </div>
                          <p className={`leading-relaxed mb-6 ${isSystemWarning ? 'text-red-200 font-bold font-sans' : 'text-zinc-300'}`}>{report.message}</p>
                          <div className="flex items-center gap-2">
                            {report.status === 'pending' && (
                              <button 
                                onClick={() => onResolveReport(report.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isSystemWarning ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-green-600/10 text-green-500 border border-green-600/20 hover:bg-green-600 hover:text-white'}`}
                              >
                                تم الحل ومسامحة الأدمن
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
            ) : (
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
                              {!isTargetAdmin && !targetUser.verified && (
                                <span className="text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 px-2.5 py-0.5 rounded-full font-black">
                                  عضو جديد
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
            )}
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
  theme
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  profile: UserProfileData | null;
  allGames: Game[];
  onUpdateProfile: (data: Partial<UserProfileData>) => void;
  onSendReport: (msg: string) => void;
  theme: 'dark' | 'light';
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'favorites' | 'settings' | 'support'>('profile');
  const [newName, setNewName] = useState(profile?.displayName || '');
  const [reportMsg, setReportMsg] = useState('');

  if (!isOpen || !profile) return null;

  const favoriteGames = allGames.filter(g => profile.favorites?.includes(g.id));

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/95 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`${theme === 'light' ? 'bg-white text-zinc-900 border-zinc-200' : 'bg-zinc-950 text-white border-zinc-800'} border w-full max-w-4xl h-full md:h-[70vh] rounded-none md:rounded-[2.5rem] overflow-hidden relative z-10 flex flex-col shadow-2xl`}
      >
        <div className={`p-4 md:p-6 border-b ${theme === 'light' ? 'border-zinc-200 bg-zinc-50' : 'border-zinc-900 bg-zinc-900/50'} flex items-center justify-between`}>
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
            { id: 'support', label: 'الدعم الفني', icon: MessageSquare },
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
              { id: 'support', label: 'الدعم الفني', icon: MessageSquare },
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
                  </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-4">
                  <h4 className="font-bold text-zinc-400">تعديل البيانات</h4>
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-500 mr-2 uppercase tracking-widest font-black">الاسم المستعار</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="أدخل اسمك الجديد"
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:border-red-600 outline-none transition-colors"
                      />
                      <button 
                        onClick={() => onUpdateProfile({ displayName: newName })}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 rounded-xl font-bold transition-all active:scale-95"
                      >
                        حفظ
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
                <h3 className="text-xl font-bold mb-6">إعدادات الموقع</h3>
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Palette className="w-5 h-5 text-red-500" />
                      <div>
                        <p className="font-bold">المظهر العام</p>
                        <p className="text-xs text-zinc-500">اختر لون الموقع المفضل لديك</p>
                      </div>
                    </div>
                    <div className={`flex bg-zinc-950 p-1 rounded-xl border ${theme === 'light' ? 'border-zinc-200' : 'border-zinc-800'}`}>
                      <button 
                        onClick={() => onUpdateProfile({ theme: 'dark' })}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${theme === 'dark' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-500'}`}
                      >
                        داكن
                      </button>
                      <button 
                        onClick={() => onUpdateProfile({ theme: 'light' })}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${theme === 'light' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-500'}`}
                      >
                        فاتح
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'support' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold mb-6">الإبلاغ عن مشكلة</h3>
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
              </div>
            )}
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
  theme
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSend: (msg: string) => void;
  theme: 'dark' | 'light';
}) => {
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/95 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className={`${theme === 'light' ? 'bg-white text-zinc-900 border-zinc-200' : 'bg-zinc-950 text-white border-zinc-800'} border w-full max-w-lg rounded-[2.5rem] overflow-hidden relative z-10 shadow-2xl`}
      >
        <div className="p-8 pt-12">
          <div className="bg-red-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-600/20 rotate-3">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-3xl font-black text-center mb-2 tracking-tighter">إرسال تقرير للإدارة</h2>
          <p className={`${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'} text-center mb-8 text-sm`}>أخبرنا عن أي مشكلة تواجهك أو اقتراح لتحسين الموقع</p>

          <textarea 
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="اكتب رسالتك هنا بالتفصيل..."
            className={`w-full ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-black' : 'bg-zinc-900 border-zinc-800 text-white'} border rounded-2xl p-4 h-40 focus:border-red-600 outline-none transition-colors resize-none mb-6`}
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
              إرسال التقرير
            </button>
            <button 
              onClick={onClose}
              className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 py-4 rounded-2xl font-bold transition-all active:scale-95"
            >
              إلغاء
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
