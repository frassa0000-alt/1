import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  updateDoc, 
  doc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { 
  Crown, 
  Plus, 
  MessageSquare, 
  UploadCloud, 
  X, 
  ThumbsUp, 
  Trash, 
  Loader2, 
  Star,
  Check,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

const minecraftHero = '/src/assets/images/minecraft_hero_1781259712815.jpg';

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
  onImageClick?: () => void;
  userEmail?: string;
  isAdmin?: boolean;
  showSuggestModal?: boolean;
  setShowSuggestModal?: (val: boolean) => void;
  showListModal?: boolean;
  setShowListModal?: (val: boolean) => void;
}

interface Suggestion {
  id: string;
  title: string;
  category: string;
  description: string;
  downloadUrl: string;
  suggestedBy: string;
  createdAt: string;
  votes: number;
  voters: string[];
  status: 'pending' | 'approved' | 'rejected';
}

export const HeroSection: React.FC<HeroSectionProps> = React.memo(({
  language,
  backgroundImage,
  userEmail,
  isAdmin,
  showSuggestModal: propsShowSuggestModal,
  setShowSuggestModal: propsSetShowSuggestModal,
  showListModal: propsShowListModal,
  setShowListModal: propsSetShowListModal,
}) => {
  const isRTL = language === 'ar';

  const slides = [
    {
      id: 0,
      titleAr: 'أهلاً بك في',
      accentAr: 'جولدن',
      subtitleAr: 'بوابتك المفضلة لأقوى وأحدث مودات وإضافات ماين كرافت المتميزة',
      titleEn: 'Welcome to',
      accentEn: 'Golden',
      subtitleEn: 'Your ultimate gateway to premium and updated Minecraft mods & additions',
      image: backgroundImage || minecraftHero,
    },
    {
      id: 1,
      titleAr: 'أقوى وأحدث',
      accentAr: 'مودات كرافت',
      subtitleAr: 'سكنات، خرائط، شيدرز، وموارد متنوعة وحصرية جاهزة للتحميل المباشر',
      titleEn: 'Premium & Updated',
      accentEn: 'Craft Mods',
      subtitleEn: 'Skins, maps, shaders, and various exclusive resources ready for direct download',
      image: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?q=80&w=1200&auto=format&fit=crop',
    },
    {
      id: 2,
      titleAr: 'اشترك معنا و',
      accentAr: 'تابع صفحاتنا على السوشيال',
      subtitleAr: 'انضم لمجتمع ديسكورد وحساباتنا الرسمية لتصلك أحدث المودات والتحديثات فوراً',
      titleEn: 'Join Us &',
      accentEn: 'Follow Our Social Pages',
      subtitleEn: 'Connect with our official Discord and social channels for instant updates',
      image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1200&auto=format&fit=crop',
    }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Controlled states for modals
  const [internalShowSuggest, setInternalShowSuggest] = useState(false);
  const [internalShowList, setInternalShowList] = useState(false);

  const showSuggestModal = propsShowSuggestModal !== undefined ? propsShowSuggestModal : internalShowSuggest;
  const setShowSuggestModal = propsSetShowSuggestModal !== undefined ? propsSetShowSuggestModal : setInternalShowSuggest;

  const showListModal = propsShowListModal !== undefined ? propsShowListModal : internalShowList;
  const setShowListModal = propsSetShowListModal !== undefined ? propsSetShowListModal : setInternalShowList;

  // Suggestions state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Suggest Form State
  const [suggestForm, setSuggestForm] = useState({
    title: '',
    category: 'مودات',
    description: '',
    downloadUrl: '',
    suggestedBy: userEmail || ''
  });

  // Admin Direct/Approved Upload Form State
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: 'مودات',
    description: '',
    downloadUrl: '',
    thumbnail: '',
    edition: 'both' as 'java' | 'bedrock' | 'both',
    isPaid: false,
    price: '',
    pointsPrice: 150,
  });
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);

  // Preset Thumbnails for quick Admin publishing
  const PRESET_THUMBNAILS = [
    { name: 'Diamond Sword', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=400&auto=format&fit=crop' },
    { name: 'Minecraft Grass', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=400&auto=format&fit=crop' },
    { name: 'Portal', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=400&auto=format&fit=crop' },
    { name: 'Creeper Green', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=400&auto=format&fit=crop' },
    { name: 'Mystic World', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop' }
  ];

  // Sync suggestForm prefill with userEmail when logged in
  useEffect(() => {
    if (userEmail) {
      setSuggestForm(prev => ({ ...prev, suggestedBy: userEmail }));
    }
  }, [userEmail]);

  // Real-time suggestions listener
  useEffect(() => {
    const q = query(collection(db, 'suggestions'), orderBy('votes', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Suggestion[];
      setSuggestions(list);
    }, (error) => {
      console.error("Firestore Error in suggestions: ", error);
    });
    return () => unsubscribe();
  }, []);

  // Auto-play interval
  useEffect(() => {
    if (isHovered || showSuggestModal || showListModal || showUploadModal) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isHovered, slides.length, showSuggestModal, showListModal, showUploadModal]);

  const handlePrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const handleNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  // Submit Suggestion
  const handleSuggestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestForm.title.trim() || !suggestForm.downloadUrl.trim() || !suggestForm.description.trim()) {
      alert(isRTL ? 'الرجاء ملء جميع الحقول المطلوبة!' : 'Please fill all required fields!');
      return;
    }

    setLoadingAction('suggest');
    try {
      const userIdentifier = userEmail || localStorage.getItem('suggestion_vote_user') || 'anonymous_user';
      await addDoc(collection(db, 'suggestions'), {
        title: suggestForm.title.trim(),
        category: suggestForm.category,
        description: suggestForm.description.trim(),
        downloadUrl: suggestForm.downloadUrl.trim(),
        suggestedBy: suggestForm.suggestedBy.trim() || (isRTL ? 'مجهول' : 'Anonymous'),
        createdAt: new Date().toISOString(),
        votes: 1,
        voters: [userIdentifier],
        status: 'pending'
      });
      
      // Reset form & close
      setSuggestForm({
        title: '',
        category: 'مودات',
        description: '',
        downloadUrl: '',
        suggestedBy: userEmail || ''
      });
      setShowSuggestModal(false);
      alert(isRTL ? 'تم تقديم اقتراحك بنجاح! سيتم مراجعته ورفعه بواسطة الإدارة ⚡' : 'Suggestion submitted successfully! The admin will review & publish it.');
    } catch (err) {
      console.error(err);
      alert(isRTL ? 'حدث خطأ أثناء إرسال الاقتراح.' : 'An error occurred while submitting.');
    } finally {
      setLoadingAction(null);
    }
  };

  // Upvote Suggestion
  const handleVote = async (id: string, voters: string[]) => {
    const userIdentifier = userEmail || localStorage.getItem('suggestion_vote_user') || Math.random().toString();
    if (!localStorage.getItem('suggestion_vote_user')) {
      localStorage.setItem('suggestion_vote_user', userIdentifier);
    }

    const currentVoters = voters || [];
    if (currentVoters.includes(userIdentifier)) {
      alert(isRTL ? 'لقد قمت بالتصويت لهذا المود بالفعل! 👍' : 'You have already voted for this mod! 👍');
      return;
    }

    try {
      const docRef = doc(db, 'suggestions', id);
      await updateDoc(docRef, {
        votes: currentVoters.length + 1,
        voters: [...currentVoters, userIdentifier]
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Suggestion (Admin Only)
  const handleDeleteSuggestion = async (id: string) => {
    if (!isAdmin) return;
    if (!window.confirm(isRTL ? 'هل أنت متأكد من رغبتك في حذف هذا الاقتراح؟' : 'Are you sure you want to delete this suggestion?')) return;

    try {
      await deleteDoc(doc(db, 'suggestions', id));
    } catch (err) {
      console.error(err);
    }
  };

  // Approve & Convert to live game
  const handleOpenApproveModal = (s: Suggestion) => {
    setSelectedSuggestion(s);
    setUploadForm({
      title: s.title,
      category: s.category || 'مودات',
      description: s.description,
      downloadUrl: s.downloadUrl,
      thumbnail: PRESET_THUMBNAILS[0].url,
      edition: 'both',
      isPaid: false,
      price: '',
      pointsPrice: 150,
    });
    setShowUploadModal(true);
  };

  // Publish / Upload Game directly to Firestore
  const handleAdminPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title.trim() || !uploadForm.downloadUrl.trim() || !uploadForm.description.trim()) {
      alert(isRTL ? 'الرجاء ملء جميع الحقول المطلوبة!' : 'Please fill all required fields!');
      return;
    }

    setLoadingAction('publish');
    try {
      // Add directly to main games collection
      await addDoc(collection(db, 'games'), {
        title: uploadForm.title.trim(),
        category: uploadForm.category,
        description: uploadForm.description.trim(),
        downloadUrl: uploadForm.downloadUrl.trim(),
        thumbnail: uploadForm.thumbnail || PRESET_THUMBNAILS[0].url,
        edition: uploadForm.edition,
        isPaid: uploadForm.isPaid,
        price: uploadForm.isPaid ? (uploadForm.price || '1.99') : '',
        pointsPrice: uploadForm.isPaid ? Number(uploadForm.pointsPrice || 150) : 0,
        rating: 5,
        downloads: '10+',
        version: '1.20+',
        createdAt: new Date().toISOString()
      });

      // Update suggestion status if approved from suggestion list
      if (selectedSuggestion) {
        await updateDoc(doc(db, 'suggestions', selectedSuggestion.id), {
          status: 'approved'
        });
      }

      setShowUploadModal(false);
      setSelectedSuggestion(null);
      alert(isRTL ? 'تم رفع المود ونشره بنجاح في سوق ماين كرافت! 🚀🔥' : 'Mod successfully published to the Live Store! 🚀🔥');
    } catch (err) {
      console.error(err);
      alert(isRTL ? 'حدث خطأ أثناء نشر المود.' : 'An error occurred during publishing.');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div 
      className="w-full text-center relative z-10 select-none group" 
      dir={isRTL ? "rtl" : "ltr"}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      
      {/* FULL WIDTH HERO BANNER WITH SLIDER */}
      <div className="relative w-full rounded-[2.5rem] overflow-hidden bg-zinc-950 border border-zinc-900 shadow-2xl min-h-[300px] sm:min-h-[360px] md:min-h-[420px] flex flex-col items-center justify-center p-6 text-center transition-all duration-300">
        
        {/* Background Images Layer with Crossfade Transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full"
            style={{
              backgroundImage: `url(${slides[currentSlide].image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        </AnimatePresence>

        {/* Semi-transparent dark overlay */}
        <div className="absolute inset-0 bg-black/60 bg-gradient-to-t from-black/95 via-black/60 to-black/40" />

        {/* Slide Content Router */}
        <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center justify-center py-4">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="space-y-4 px-4"
            >
              <div className="space-y-1">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] font-sans">
                  {isRTL ? slides[currentSlide].titleAr : slides[currentSlide].titleEn}
                </h1>
                <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-[#f59e0b] tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] font-sans">
                  {isRTL ? slides[currentSlide].accentAr : slides[currentSlide].accentEn}
                </h2>
              </div>

              <p className="text-zinc-200 text-xs sm:text-sm md:text-base font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] px-4">
                {isRTL ? slides[currentSlide].subtitleAr : slides[currentSlide].subtitleEn}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Dots Indicator */}
          <div className="flex items-center gap-2.5 pt-6">
            {slides.map((slide, index) => {
              const isActive = index === currentSlide;
              return (
                <button
                  key={slide.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlide(index);
                  }}
                  className={`transition-all duration-300 cursor-pointer ${
                    isActive 
                      ? 'w-7 h-2.5 rounded-full bg-[#f59e0b] shadow-md shadow-amber-500/30' 
                      : 'w-2.5 h-2.5 rounded-full bg-zinc-500/50 hover:bg-zinc-400'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              );
            })}
          </div>

        </div>

        {/* Manual navigation controls */}
        <div className="absolute inset-x-4 sm:inset-x-6 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <button
            onClick={isRTL ? handleNext : handlePrev}
            className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 border border-zinc-800/70 text-white flex items-center justify-center pointer-events-auto transition active:scale-90 cursor-pointer"
            aria-label="Previous slide"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d={isRTL ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
            </svg>
          </button>
          <button
            onClick={isRTL ? handlePrev : handleNext}
            className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 border border-zinc-800/70 text-white flex items-center justify-center pointer-events-auto transition active:scale-90 cursor-pointer"
            aria-label="Next slide"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d={isRTL ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
            </svg>
          </button>
        </div>

      </div>

      {/* ======================================= */}
      {/* 1. SUGGEST A NEW MOD MODAL (MEMBER FORM) */}
      {/* ======================================= */}
      <AnimatePresence>
        {showSuggestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-900 rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl relative text-right"
              dir={isRTL ? "rtl" : "ltr"}
            >
              {/* Header */}
              <div className="bg-zinc-900 px-6 py-5 border-b border-zinc-900 flex items-center justify-between">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-500" />
                  {isRTL ? 'تقديم اقتراح لمود جديد 💡' : 'Suggest a New Mod 💡'}
                </h3>
                <button 
                  onClick={() => setShowSuggestModal(false)}
                  className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSuggestSubmit} className="p-6 space-y-4">
                
                {/* Mod Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-zinc-400 block">
                    {isRTL ? 'اسم المود / الإضافة (مطلوب)' : 'Mod/Addon Name (Required)'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isRTL ? 'مثال: Physics Mod Pro أو More Tools' : 'e.g. Physics Mod Pro'}
                    value={suggestForm.title}
                    onChange={(e) => setSuggestForm({ ...suggestForm, title: e.target.value })}
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-zinc-400 block">
                    {isRTL ? 'التصنيف' : 'Category'}
                  </label>
                  <select
                    value={suggestForm.category}
                    onChange={(e) => setSuggestForm({ ...suggestForm, category: e.target.value })}
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 font-bold cursor-pointer"
                  >
                    <option value="مودات">{isRTL ? 'مودات' : 'Mods'}</option>
                    <option value="خرائط">{isRTL ? 'خرائط' : 'Maps'}</option>
                    <option value="شيدرز">{isRTL ? 'شيدرز' : 'Shaders'}</option>
                    <option value="سكنات">{isRTL ? 'سكنات' : 'Skins'}</option>
                  </select>
                </div>

                {/* Mod Download / Reference URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-zinc-400 block">
                    {isRTL ? 'رابط تحميل المود أو صفحة المصدر (مطلوب)' : 'Download Link or Source Page (Required)'}
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={suggestForm.downloadUrl}
                    onChange={(e) => setSuggestForm({ ...suggestForm, downloadUrl: e.target.value })}
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                {/* Mod Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-zinc-400 block">
                    {isRTL ? 'وصف المود وأبرز ميزاته (مطلوب)' : 'Mod Description & Best Features (Required)'}
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder={isRTL ? 'اكتب ما يفعله المود، ولماذا ترغب في إضافته للموقع...' : 'Describe what this mod does and why it is great...'}
                    value={suggestForm.description}
                    onChange={(e) => setSuggestForm({ ...suggestForm, description: e.target.value })}
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 font-semibold"
                  />
                </div>

                {/* Suggested By Name / Contact */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-zinc-400 block">
                    {isRTL ? 'اسمك أو بريدك الإلكتروني (اختياري)' : 'Your Name or Email (Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder={userEmail || (isRTL ? 'مجهول' : 'Anonymous')}
                    value={suggestForm.suggestedBy}
                    onChange={(e) => setSuggestForm({ ...suggestForm, suggestedBy: e.target.value })}
                    disabled={!!userEmail}
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 font-bold disabled:opacity-50"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-4 border-t border-zinc-90 w-full flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSuggestModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-black hover:text-white cursor-pointer"
                  >
                    {isRTL ? 'إلغاء' : 'Cancel'}
                  </button>

                  <button
                    type="submit"
                    disabled={loadingAction === 'suggest'}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {loadingAction === 'suggest' ? (
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                    ) : (
                      <Plus className="w-4 h-4 text-black" />
                    )}
                    <span>{isRTL ? 'تقديم الاقتراح ⚡' : 'Submit Suggestion ⚡'}</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/* 2. SUGGESTIONS LIST MODAL (VISUAL SLIDE-OVER) */}
      {/* ======================================= */}
      <AnimatePresence>
        {showListModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden shadow-2xl relative text-right"
              dir={isRTL ? "rtl" : "ltr"}
            >
              {/* Header */}
              <div className="bg-zinc-900 px-6 py-5 border-b border-zinc-900 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-5 h-5 text-emerald-500" />
                  <div>
                    <h3 className="text-lg font-black text-white">
                      {isRTL ? 'قائمة اقتراحات المشتركين المفتوحة 📂' : 'Open Subscriber Suggestions 📂'}
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">
                      {isRTL ? 'قم بالتصويت للمودات التي ترغب برفعها في الموقع فوراً!' : 'Upvote mod proposals you want the admin to publish!'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowListModal(false)}
                  className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Suggestions List Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
                {suggestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                    <ShieldAlert className="w-12 h-12 text-zinc-650" />
                    <p className="text-zinc-450 font-black text-sm">
                      {isRTL ? 'لا توجد اقتراحات نشطة حالياً. كن أول من يقترح مودك المفضل!' : 'No suggestions found. Be the first to suggest one!'}
                    </p>
                  </div>
                ) : (
                  suggestions.map((item) => (
                    <div 
                      key={item.id}
                      className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 ${
                        item.status === 'approved' 
                          ? 'bg-emerald-950/20 border-emerald-500/20'
                          : 'bg-zinc-900/40 border-zinc-900 hover:border-zinc-800'
                      }`}
                    >
                      {/* Highlight Top Ribbon for Approved suggestions */}
                      {item.status === 'approved' && (
                        <div className="absolute top-0 right-0 left-0 h-[2px] bg-emerald-500" />
                      )}

                      <div className="space-y-2 flex-1 text-right">
                        {/* Title and Badge row */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-black uppercase">
                            {item.category}
                          </span>
                          
                          {item.status === 'approved' && (
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              {isRTL ? 'مقبول وتم الرفع ✅' : 'Approved & Published ✅'}
                            </span>
                          )}

                          <h4 className="text-sm font-black text-white uppercase tracking-wide">
                            {item.title}
                          </h4>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-zinc-400 font-semibold leading-relaxed max-w-lg">
                          {item.description}
                        </p>

                        {/* Suggested by info */}
                        <div className="flex items-center gap-3 text-[10px] text-zinc-550 font-black pt-1">
                          <span>
                            {isRTL ? `بواسطة: ${item.suggestedBy}` : `Suggested by: ${item.suggestedBy}`}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(item.createdAt).toLocaleDateString(isRTL ? 'ar' : 'en-US')}
                          </span>
                          <span>•</span>
                          <a 
                            href={item.downloadUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-amber-500 hover:underline flex items-center gap-1"
                          >
                            <span>{isRTL ? 'معاينة المصدر 🔗' : 'Source Link 🔗'}</span>
                          </a>
                        </div>
                      </div>

                      {/* Side Vote/Action Deck */}
                      <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-3 shrink-0 border-t sm:border-t-0 sm:border-r border-zinc-800/60 pt-4 sm:pt-0 sm:pr-4">
                        
                        {/* Upvote Capsule */}
                        <button
                          onClick={() => handleVote(item.id, item.voters)}
                          className={`flex items-center justify-center gap-2 h-10 px-4 rounded-xl border font-black text-xs transition-all cursor-pointer ${
                            item.voters?.includes(userEmail || localStorage.getItem('suggestion_vote_user') || 'anonymous')
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{item.votes || 0}</span>
                        </button>

                        {/* Admin Approvals & Trash */}
                        {isAdmin && (
                          <div className="flex items-center gap-2">
                            {item.status !== 'approved' && (
                              <button
                                onClick={() => handleOpenApproveModal(item)}
                                className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] flex items-center gap-1.5 transition cursor-pointer"
                                title={isRTL ? 'نشر هذا المود مباشرة للموقع 🚀' : 'Approve & Publish to Store 🚀'}
                              >
                                <UploadCloud className="w-3.5 h-3.5" />
                                <span>{isRTL ? 'رفع للموقع 🚀' : 'Approve 🚀'}</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteSuggestion(item.id)}
                              className="w-9 h-9 rounded-xl bg-red-950/30 hover:bg-red-900/40 border border-red-500/20 text-red-500 flex items-center justify-center transition cursor-pointer"
                              title={isRTL ? 'حذف الاقتراح' : 'Delete Suggestion'}
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/* 3. ADMIN PUBLISH / UPLOAD MODAL (ADMIN ONLY) */}
      {/* ======================================= */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative text-right"
              dir={isRTL ? "rtl" : "ltr"}
            >
              {/* Header */}
              <div className="bg-zinc-900 px-6 py-5 border-b border-zinc-900 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <UploadCloud className="w-5 h-5 text-purple-500 animate-bounce" />
                  <div>
                    <h3 className="text-lg font-black text-white">
                      {selectedSuggestion 
                        ? (isRTL ? `نشر الاقتراح: ${selectedSuggestion.title} 🚀` : `Publishing Suggestion: ${selectedSuggestion.title} 🚀`)
                        : (isRTL ? 'رفع مود جديد في الموقع فوراً 🚀' : 'Publish a New Mod Directly 🚀')}
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">
                      {isRTL ? 'سيتم حفظ المود ونشره في متجر الألعاب وسوق ماين كرافت مباشرة!' : 'Complete the database entry to push this mod live!'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleAdminPublish} className="flex-1 overflow-y-auto p-6 space-y-4">
                
                {/* Mod Title */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-zinc-400 block">
                      {isRTL ? 'اسم المود (مطلوب)' : 'Mod Title (Required)'}
                    </label>
                    <input
                      type="text"
                      required
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                      className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 font-bold"
                    />
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-zinc-400 block">
                      {isRTL ? 'التصنيف' : 'Category'}
                    </label>
                    <select
                      value={uploadForm.category}
                      onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                      className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 font-bold cursor-pointer"
                    >
                      <option value="مودات">{isRTL ? 'مودات' : 'Mods'}</option>
                      <option value="خرائط">{isRTL ? 'خرائط' : 'Maps'}</option>
                      <option value="شيدرز">{isRTL ? 'شيدرز' : 'Shaders'}</option>
                      <option value="سكنات">{isRTL ? 'سكنات' : 'Skins'}</option>
                    </select>
                  </div>
                </div>

                {/* Download Url */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-zinc-400 block">
                    {isRTL ? 'رابط تحميل المود المباشر (مطلوب)' : 'Direct Download/Source URL (Required)'}
                  </label>
                  <input
                    type="url"
                    required
                    value={uploadForm.downloadUrl}
                    onChange={(e) => setUploadForm({ ...uploadForm, downloadUrl: e.target.value })}
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                {/* Minecraft Edition Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-zinc-400 block">
                    {isRTL ? 'إصدار ماين كرافت المتوافق' : 'Minecraft Edition'}
                  </label>
                  <select
                    value={uploadForm.edition}
                    onChange={(e) => setUploadForm({ ...uploadForm, edition: e.target.value as any })}
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 font-bold cursor-pointer"
                  >
                    <option value="both">{isRTL ? 'الكل (الجافا والبدروك)' : 'Both Editions'}</option>
                    <option value="java">{isRTL ? 'النسخة الجافا (Java Edition)' : 'Java Edition'}</option>
                    <option value="bedrock">{isRTL ? 'نسخة الجوال والكونسول (Bedrock)' : 'Bedrock Edition'}</option>
                  </select>
                </div>

                {/* Thumbnail Pre-sets Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-400 block">
                    {isRTL ? 'اختر صورة غلاف مصغرة مميزة للمود (أو اكتب رابط مخصص أدناه)' : 'Select Cover Thumbnail (Or paste custom URL below)'}
                  </label>
                  <div className="grid grid-cols-5 gap-2 pb-2">
                    {PRESET_THUMBNAILS.map((th) => {
                      const isSelected = uploadForm.thumbnail === th.url;
                      return (
                        <div 
                          key={th.name}
                          onClick={() => setUploadForm({ ...uploadForm, thumbnail: th.url })}
                          className={`aspect-video rounded-xl overflow-hidden cursor-pointer border-2 transition-all relative ${
                            isSelected ? 'border-purple-500 scale-102 shadow-lg shadow-purple-500/20' : 'border-zinc-800/80 hover:border-zinc-700'
                          }`}
                        >
                          <img src={th.url} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/20 hover:bg-transparent transition-all" />
                        </div>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    placeholder={isRTL ? 'رابط صورة مخصص: https://...' : 'Custom Image URL: https://...'}
                    value={uploadForm.thumbnail}
                    onChange={(e) => setUploadForm({ ...uploadForm, thumbnail: e.target.value })}
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                {/* Paid settings */}
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-850 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-zinc-350">
                      {isRTL ? 'تفعيل نظام الشراء بالنقاط؟' : 'Enable purchase with Gold/Points?'}
                    </span>
                    <input
                      type="checkbox"
                      checked={uploadForm.isPaid}
                      onChange={(e) => setUploadForm({ ...uploadForm, isPaid: e.target.checked })}
                      className="w-5 h-5 rounded border-zinc-800 bg-zinc-950 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                  </div>

                  {uploadForm.isPaid && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-zinc-400 block">
                          {isRTL ? 'السعر المعادل بالدولار الأمريكي ($)' : 'Equivalent Price in USD ($)'}
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 1.99"
                          value={uploadForm.price}
                          onChange={(e) => setUploadForm({ ...uploadForm, price: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-zinc-400 block">
                          {isRTL ? 'السعر بالنقاط المطلوبة (أقل شيء 50)' : 'Points Required (Min 50)'}
                        </label>
                        <input
                          type="number"
                          min={50}
                          value={uploadForm.pointsPrice}
                          onChange={(e) => setUploadForm({ ...uploadForm, pointsPrice: Number(e.target.value) })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-zinc-400 block">
                    {isRTL ? 'الوصف بالكامل للمود والمميزات للتنزيل (مطلوب)' : 'Full description / release notes (Required)'}
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 font-semibold"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-4 border-t border-zinc-90 w-full flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedSuggestion(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-black hover:text-white cursor-pointer"
                  >
                    {isRTL ? 'إلغاء' : 'Cancel'}
                  </button>

                  <button
                    type="submit"
                    disabled={loadingAction === 'publish'}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {loadingAction === 'publish' ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Check className="w-4 h-4 text-white" />
                    )}
                    <span>{isRTL ? 'تأكيد النشر والرفع 🚀' : 'Confirm & Publish Live 🚀'}</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
});
