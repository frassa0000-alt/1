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
  Image as ImageIcon
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
import backgroundImage from './assets/images/gih_background_1779447034941.png';

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
}

interface Report {
  id: string;
  userId: string;
  userEmail: string;
  message: string;
  timestamp: any;
  status: 'pending' | 'resolved';
}

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
      <nav className={`fixed top-0 w-full z-50 transition-colors ${localTheme === 'light' ? 'bg-white/80 border-zinc-200' : 'bg-black/80 border-zinc-900'} backdrop-blur-md border-b px-4 md:px-8 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowMobileMenu(true)}
            className="md:hidden p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="bg-red-600 p-2 rounded-lg shadow-lg shadow-red-600/20">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <motion.span 
              animate={{ 
                color: ["#ffffff", "#ef4444", "#ffffff"],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-xl font-black tracking-tighter uppercase"
            >
              Gih
            </motion.span>
          </motion.div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#" className="hover:text-red-500 transition-colors">{t.home}</a>
          <a href="#" className="hover:text-red-500 transition-colors">{t.trending}</a>
          <a href="#" className="hover:text-red-500 transition-colors">{t.new}</a>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {isAdmin && (
            <button 
              onClick={() => setShowAdminPanel(true)}
              className={`hidden md:flex items-center gap-2 ${localTheme === 'light' ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-900 border-zinc-800'} border px-4 py-2 rounded-xl text-sm font-bold hover:opacity-80 transition-all`}
            >
              <ShieldCheck className="w-4 h-4 text-red-500" />
              لوحة التحكم
            </button>
          )}
          


          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-red-400">مرحباً بك</p>
                <p className="text-sm font-bold truncate max-w-[100px]">
                  {userProfile?.displayName || user.displayName || (user.isAnonymous ? 'زائر' : user.email?.split('@')[0])}
                </p>
              </div>
              <button 
                onClick={() => setShowUserPanel(true)}
                className="p-2 hover:bg-zinc-900 rounded-full transition-colors text-zinc-400 hover:text-white"
              >
                <UserCog className="w-5 h-5" />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-zinc-900 rounded-full transition-colors text-red-400 hover:text-red-300"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <img 
                src={user.photoURL && user.photoURL !== "" ? user.photoURL : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                alt="Profile" 
                className="w-10 h-10 rounded-full border-2 border-red-600 object-cover bg-zinc-900"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <button 
              onClick={() => {
                setLoginMode('options');
                setShowLoginModal(true);
              }}
              className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-600/30"
            >
              تسجيل الدخول
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 md:px-8 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-20">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-red-600 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div 
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <motion.h1 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ 
                duration: 1, 
                type: "spring",
                bounce: 0.4
              }}
              className="text-6xl md:text-9xl font-black mb-6 leading-tight tracking-tighter"
            >
              <span className="relative inline-block select-none py-2">
                <span className="invisible select-none">Golden</span>

                {[
                  "from-yellow-200 via-amber-400 to-amber-600 drop-shadow-[0_0_35px_rgba(245,158,11,0.45)]",
                  "from-cyan-300 via-sky-400 to-blue-600 drop-shadow-[0_0_35px_rgba(14,165,233,0.45)]",
                  "from-rose-300 via-pink-500 to-red-600 drop-shadow-[0_0_35px_rgba(244,63,94,0.45)]",
                  "from-emerald-300 via-teal-400 to-cyan-600 drop-shadow-[0_0_35px_rgba(16,185,129,0.45)]",
                  "from-purple-300 via-fuchsia-500 to-pink-600 drop-shadow-[0_0_35px_rgba(168,85,247,0.45)]"
                ].map((grad, idx) => (
                  <span
                    key={idx}
                    className={`absolute inset-0 transition-opacity duration-1000 ${
                      colorIndex === idx ? "opacity-100" : "opacity-0 pointer-events-none"
                    } bg-clip-text text-transparent bg-gradient-to-b ${grad}`}
                  >
                    Golden
                  </span>
                ))}
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-red-200/70 text-lg md:text-3xl max-w-2xl mx-auto mb-10 font-black tracking-tight"
            >
              {t.heroSubtitle}
            </motion.p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="relative w-full max-w-md group">
                <Search className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-red-400 group-focus-within:text-red-500 transition-colors`} />
                <input 
                  type="text" 
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full bg-zinc-900/50 border border-zinc-800 rounded-full py-4 ${language === 'ar' ? 'pr-12 pl-6 text-right' : 'pl-12 pr-6 text-left'} focus:outline-none focus:border-red-500 transition-colors text-white placeholder:text-zinc-600`}
                />
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { icon: Smartphone, label: language === 'ar' ? "مودات موبايل" : "Mobile Mods", value: "500+" },
              { icon: Flame, label: language === 'ar' ? "خرائط تريند" : "Trending Maps", value: "120+" },
              { icon: TrendingUp, label: language === 'ar' ? "تحميلات يومية" : "Daily Hits", value: "10K+" },
              { icon: CheckCircle2, label: language === 'ar' ? "أمان كامل" : "100% Safe", value: "100%" },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className={`${localTheme === 'light' ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-900/50 border-zinc-800'} border p-4 rounded-2xl text-center`}
              >
                <stat.icon className="w-6 h-6 text-red-500 mx-auto mb-2" />
                <p className={`text-2xl font-black ${localTheme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{stat.value}</p>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

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
      <section className="py-12 px-4 md:px-8">
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
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

      {/* Footer */}
      <footer className={`py-12 px-4 md:px-8 border-t ${localTheme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-black border-zinc-900'}`}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="bg-red-600 p-2 rounded-lg">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">Gih</span>
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
            © 2026 Gih Hub. {t.footerRights}
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
                  <div className="bg-red-600 p-2 rounded-lg">
                    <Gamepad2 className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-black tracking-tighter uppercase">Gih</span>
                </div>
                <button 
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => {
                      setLanguage(language === 'ar' ? 'en' : 'ar');
                      setShowMobileMenu(false);
                    }}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl bg-red-600/10 border border-red-600/20 text-red-500 font-bold w-full mb-4"
                  >
                    <Languages className="w-5 h-5" />
                    <span>{language === 'ar' ? 'Switch to English' : 'التغيير للعربية'}</span>
                  </button>

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
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-black">Gih HUB</p>
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
                
                <h2 className="text-3xl font-black text-center mb-2 tracking-tighter">مرحباً بك في Gih</h2>
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
  theme
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
}) => {
  const [activeTab, setActiveTab] = useState<'games' | 'reports'>('games');
  const [reports, setReports] = useState<Report[]>([]);
  const [newGame, setNewGame] = useState({
    title: '',
    description: '',
    thumbnail: '',
    downloadUrl: '',
    category: 'مودات',
    rating: 5
  });
  const [quickAddLink, setQuickAddLink] = useState('');

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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'reports' ? 'bg-red-600 text-white' : 'text-zinc-500 hover:bg-zinc-900'}`}
            >
              <ClipboardList className="w-5 h-5" />
              التقارير والشكاوى
              {reports.filter(r => r.status === 'pending').length > 0 && (
                <span className="bg-white text-red-600 text-[10px] px-2 py-0.5 rounded-full mr-auto">
                  {reports.filter(r => r.status === 'pending').length}
                </span>
              )}
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
                    <input 
                      type="text" 
                      placeholder="رابط الصورة (Thumbnail)"
                      value={newGame.thumbnail}
                      onChange={e => setNewGame({...newGame, thumbnail: e.target.value})}
                      className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:border-red-600 outline-none transition-colors"
                    />
                    <input 
                      type="text" 
                      placeholder="رابط التحميل"
                      value={newGame.downloadUrl}
                      onChange={e => setNewGame({...newGame, downloadUrl: e.target.value})}
                      className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:border-red-600 outline-none transition-colors"
                    />
                    <textarea 
                      placeholder="الوصف"
                      value={newGame.description}
                      onChange={e => setNewGame({...newGame, description: e.target.value})}
                      className="col-span-1 md:col-span-2 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm h-24 focus:border-red-600 outline-none transition-colors resize-none"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      onAddGame(newGame);
                      setNewGame({ title: '', description: '', thumbnail: '', downloadUrl: '', category: 'مودات', rating: 5 });
                    }}
                    className="mt-6 w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-red-600/20"
                  >
                    نشر المحتوى الآن
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
            ) : (
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-6">تقارير المستخدمين ({reports.length})</h3>
                {reports.length === 0 ? (
                  <div className="text-center py-20 text-zinc-600">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>لا توجد تقارير حالياً</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {reports.map(report => (
                      <div key={report.id} className={`p-6 rounded-3xl border transition-all ${report.status === 'resolved' ? 'bg-zinc-900/20 border-zinc-900 opacity-60' : 'bg-zinc-900/50 border-zinc-800 shadow-xl'}`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${report.status === 'resolved' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">{report.userEmail}</span>
                          </div>
                          <span className="text-[10px] text-zinc-600">
                            {report.timestamp?.toDate().toLocaleString('ar-EG')}
                          </span>
                        </div>
                        <p className="text-zinc-300 leading-relaxed mb-6">{report.message}</p>
                        <div className="flex items-center gap-2">
                          {report.status === 'pending' && (
                            <button 
                              onClick={() => onResolveReport(report.id)}
                              className="bg-green-600/10 text-green-500 border border-green-600/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-600 hover:text-white transition-all"
                            >
                              تم الحل
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
                    ))}
                  </div>
                )}
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
                  <div className="w-32 h-32 rounded-full bg-zinc-800 border-4 border-red-600/20 flex items-center justify-center overflow-hidden">
                    {profile.photoURL && profile.photoURL !== "" ? (
                      <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-16 h-16 text-zinc-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{profile.displayName || 'لاعب محترف'}</h3>
                    <p className="text-zinc-500 text-sm">{profile.email}</p>
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
