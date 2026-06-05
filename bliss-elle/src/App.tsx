import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, BookOpen, Volume2, VolumeX, Grid, Layers, ShieldCheck, Heart, ShieldAlert, ShoppingBag } from 'lucide-react';
import Navbar from './components/Navbar';
import StatsSection from './components/StatsSection';
import ModelView from './components/ModelView';
import { CartDrawer, LookbookDrawer, WishlistDrawer } from './components/InteractivePanels';
import AdminWorkspace from './components/AdminWorkspace';
import ClientWorkspace from './components/ClientWorkspace';
import ShopByStyle, { STYLE_PRODUCTS, StyleProduct } from './components/ShopByStyle';
import SearchOverlay from './components/SearchOverlay';
import { collections, hotspots as staticHotspots } from './data';
import { Hotspot } from './types';
import { auth, db, logInWithGoogle, logOutUser, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, writeBatch, doc, deleteDoc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { getVideoBlob } from './lib/videoDb';

// Helper to convert File to base64
function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

function FloatingParticle({ p }: { p: any; key?: any }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="absolute pointer-events-auto cursor-crosshair"
      style={{
        left: p.x,
        top: p.y,
        // Invisible comfortable interaction buffer zone when cursor is nearby
        padding: '16px',
        margin: '-16px',
        zIndex: 15,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      // Slow down floating speeds to a crawl when tracked
      animate={{
        y: ['0px', '-140px', '0px'],
        x: ['0px', '50px', '0px'],
      }}
      transition={{
        duration: isHovered ? p.duration * 3.5 : p.duration,
        repeat: Infinity,
        delay: p.delay,
        ease: "easeInOut",
      }}
    >
      <motion.div
        className="rounded-full bg-gradient-to-r from-[#BA9A5D] to-[#DFCE9F] transition-colors duration-500 shadow-xs"
        style={{
          width: p.size,
          height: p.size,
        }}
        animate={{
          scale: isHovered ? 2.5 : 1.0,
          background: isHovered 
            ? 'radial-gradient(circle, #FFEBB5 0%, #BA9A5D 100%)' 
            : 'linear-gradient(to right, #BA9A5D, #DFCE9F)',
          opacity: isHovered ? 0.85 : 0.35,
          boxShadow: isHovered 
            ? '0 0 16px 4px rgba(255, 235, 181, 0.9), 0 0 6px 1px rgba(186, 154, 93, 0.5)' 
            : '0 0 0px 0px rgba(0,0,0,0)',
        }}
        transition={{
          type: "spring",
          stiffness: 150,
          damping: 12,
        }}
      />
    </motion.div>
  );
}

export default function App() {
  // Navigation states
  const [activeSection, setActiveSection] = useState('Home');

  const handleSetSection = (sec: string) => {
    if (sec === 'Lookbook') {
      setIsLookbookOpen(true);
    } else {
      setActiveSection(sec);
    }
  };
  
  // Shopping Cart state
  const [cartItems, setCartItems] = useState<Hotspot[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Lookbook Modal state
  const [isLookbookOpen, setIsLookbookOpen] = useState(false);

  // Admin Desk Modal toggling
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Client Portal Dashboard Modal toggling
  const [isClientOpen, setIsClientOpen] = useState(false);

  // Search Overlay Modal toggling
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Active theme / Collection selection state
  const [selectedCollectionId, setSelectedCollectionId] = useState('emerald');
  const activeCollection = collections.find(c => c.id === selectedCollectionId) || collections[0];

  // Automatic state to flip subtitle badge text every 3 seconds
  const [showChicText, setShowChicText] = useState(false);

  useEffect(() => {
    const textInterval = setInterval(() => {
      setShowChicText(prev => !prev);
    }, 3000);
    return () => clearInterval(textInterval);
  }, []);

  // Local Cached background URLs & types (supports MP4 videos or image wallpapers)
  const [localPortraitUrl, setLocalPortraitUrl] = useState<string | null>(null);
  const [localPortraitType, setLocalPortraitType] = useState<'video' | 'image' | null>(null);
  const [localLandscapeUrl, setLocalLandscapeUrl] = useState<string | null>(null);
  const [localLandscapeType, setLocalLandscapeType] = useState<'video' | 'image' | null>(null);

  useEffect(() => {
    // Attempt to load videos/wallpapers from local browser cache (IndexedDB)
    getVideoBlob('portrait')
      .then(async res => {
        if (res && res.blob) {
          try {
            const text = await res.blob.text();
            if (text.startsWith('URL_REF:')) {
              const parts = text.split(':');
              const fileType = parts[1] as 'video' | 'image';
              const url = parts.slice(2).join(':');
              setLocalPortraitUrl(url);
              setLocalPortraitType(fileType);
              return;
            }
          } catch (e) {
            // Read failure fallback
          }
          setLocalPortraitUrl(URL.createObjectURL(res.blob));
          const fileType = res.blob.type.startsWith('image/') ? 'image' : 'video';
          setLocalPortraitType(fileType);
        }
      })
      .catch(err => console.warn("Failed retrieving portrait background cache:", err));

    getVideoBlob('landscape')
      .then(async res => {
        if (res && res.blob) {
          try {
            const text = await res.blob.text();
            if (text.startsWith('URL_REF:')) {
              const parts = text.split(':');
              const fileType = parts[1] as 'video' | 'image';
              const url = parts.slice(2).join(':');
              setLocalLandscapeUrl(url);
              setLocalLandscapeType(fileType);
              return;
            }
          } catch (e) {
            // Read failure fallback
          }
          setLocalLandscapeUrl(URL.createObjectURL(res.blob));
          const fileType = res.blob.type.startsWith('image/') ? 'image' : 'video';
          setLocalLandscapeType(fileType);
        }
      })
      .catch(err => console.warn("Failed retrieving landscape background cache:", err));
  }, []);

  // Listen to Firestore real-time settings for wallpaper synchronization (for both logged-in and logged-out users)
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'wallpaper'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.portraitUrl !== undefined) {
          setLocalPortraitUrl(data.portraitUrl || null);
          setLocalPortraitType(data.portraitType || null);
        }
        if (data.landscapeUrl !== undefined) {
          setLocalLandscapeUrl(data.landscapeUrl || null);
          setLocalLandscapeType(data.landscapeType || null);
        }
      }
    }, (err) => {
      console.warn("Firestore error reading settings/wallpaper:", err);
    });
    return () => unsub();
  }, []);

  // Selected hotspot identifier
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);

  // Ambient soundtrack volume state (simulating luxury store background sound)
  const [isMuted, setIsMuted] = useState(true);

  // Wishlist state and handlers
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('bliss_wishlist');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('bliss_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Auth User verification
  const [user, setUser] = useState<User | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [welcomeNotification, setWelcomeNotification] = useState<string | null>(null);
  const [adminNotification, setAdminNotification] = useState<string | null>(null);

  // Synchronize Wishlist with Firestore when user is authenticated
  useEffect(() => {
    if (!user) return;

    const wishlistDocRef = doc(db, 'wishlists', user.uid);

    const unsub = onSnapshot(wishlistDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const dbData = snapshot.data();
        const dbItems = dbData.items || [];
        setWishlist(prev => {
          // Merge items without duplicates
          const merged = Array.from(new Set([...prev, ...dbItems]));
          return JSON.stringify(prev) !== JSON.stringify(merged) ? merged : prev;
        });
      } else {
        // If snapshot doesn't exist but we have local wishlist items, write them to Firestore
        if (wishlist.length > 0) {
          setDoc(wishlistDocRef, {
            userId: user.uid,
            items: wishlist,
            updatedAt: serverTimestamp()
          }).catch(err => {
            console.warn("Error creating initial DB wishlist sync:", err);
          });
        }
      }
    }, (err) => {
      console.warn("Unable to subscribe to DB wishlist snapshot:", err);
    });

    return () => unsub();
  }, [user]);

  // Sync state back to Firestore when it changes locally
  useEffect(() => {
    if (!user) return;

    const wishlistDocRef = doc(db, 'wishlists', user.uid);

    const syncWishToFirestore = async () => {
      try {
        await setDoc(wishlistDocRef, {
          userId: user.uid,
          items: wishlist,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.warn("Error syncing wishlist with Firestore on update:", err);
      }
    };

    const timeoutId = setTimeout(() => {
      syncWishToFirestore();
    }, 500); // 500ms debounce to prevent excessive writes on rapid additions

    return () => clearTimeout(timeoutId);
  }, [wishlist, user]);

  useEffect(() => {
    if (welcomeNotification) {
      const timer = setTimeout(() => {
        setWelcomeNotification(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [welcomeNotification]);

  const handleLogin = async () => {
    setAuthError(null);
    try {
      await logInWithGoogle();
    } catch (err: any) {
      console.warn("Auth login failed:", err);
      let errMsg = "Unable to connect. Ensure your browser allows popups and cookies are enabled.";
      const errMsgStr = String(err?.message || err);
      const errCodeStr = String(err?.code || '');
      
      if (errCodeStr.includes('cancelled-popup-request') || 
          errCodeStr.includes('popup-closed-by-user') || 
          errMsgStr.includes('cancelled-popup-request') || 
          errMsgStr.includes('popup-closed-by-user')) {
        errMsg = "Sign-in popup was closed or cancelled. Please click 'Sign In' again, allow the popup to load, and select your account.";
      } else if (errCodeStr.includes('network-request-failed') || errMsgStr.includes('network-request-failed')) {
        errMsg = "Network/blocker interference detected. The sandbox iframe might block popups by default. Click 'Open App' at the very top of AI Studio to load the app in its own tab, and sign in easily!";
      } else if (err?.message) {
        errMsg = err.message;
      }
      setAuthError(errMsg);
    }
  };

  // Dynamic products / hotspots loaded from Firestore
  const [liveHotspots, setLiveHotspots] = useState<Hotspot[]>([]);

  // Convert live items and static items to StyleProduct for unified search & wishlist referencing
  const allAvailableStyleProducts: StyleProduct[] = React.useMemo(() => {
    const liveMapped: StyleProduct[] = (liveHotspots || []).map(h => {
      let priceNum = 350;
      if (h.price) {
        const cleaned = h.price.replace(/[^\d.]/g, '');
        if (cleaned) priceNum = parseFloat(cleaned);
      }
      
      const images = [h.imageUrl || 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=82&w=600'];
      if (h.images) {
        h.images.forEach(img => {
          if (img && !images.includes(img)) images.push(img);
        });
      }

      return {
        id: h.id,
        name: h.name,
        category: h.category || 'Luxury Selection',
        price: priceNum,
        rating: 5.0,
        reviewCount: 0,
        images: images,
        description: h.description || '',
        material: h.material || '',
        quality: h.quality || '',
        styling: h.styling || '',
        colors: h.colors || [],
        sizes: h.sizes || []
      };
    });

    const combined = [...STYLE_PRODUCTS];
    liveMapped.forEach(lm => {
      if (!combined.some(p => p.id === lm.id)) {
        combined.push(lm);
      }
    });
    return combined;
  }, [liveHotspots]);

  // Authenticated State Sync
  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const clientEmail = currentUser.email?.toLowerCase() || '';
        const adminWhitelist = [
          'abubakarsadikmusah2004@gmail.com',
          'jenatubashiru4@gmail.com',
          'jannahblisselle@gmail.com',
          'secondadmin@gmail.com'
        ];
        let isAdmin = adminWhitelist.includes(clientEmail);

        // Check dynamic database admins collection
        if (!isAdmin && clientEmail) {
          try {
            const adminDoc = await getDoc(doc(db, 'admins', clientEmail));
            if (adminDoc.exists()) {
              isAdmin = true;
            }
          } catch (e) {
            console.warn("Could not retrieve administrative document for email:", e);
          }
        }

        setIsAdminUser(isAdmin);

        // Record custom administrator logins and send automated notifications
        if (isAdmin) {
          const sessionKey = `admin_logged_history_${currentUser.uid}`;
          const alreadyLogged = sessionStorage.getItem(sessionKey);
          if (!alreadyLogged) {
            try {
              const loginHistoryRef = doc(collection(db, 'admin_login_history'));
              await setDoc(loginHistoryRef, {
                email: clientEmail,
                timestamp: new Date(),
                userAgent: navigator.userAgent,
                ipPlaceholder: 'Cloud Run Ingress (Dev Iframe)'
              });
              sessionStorage.setItem(sessionKey, 'true');

              setAdminNotification(`Your workspace session is secure and active.`);
            } catch (err) {
              console.warn("Could not register admin login history details:", err);
            }
          }
        } else {
          // Welcoming not admin client user
          const wasWelcomed = sessionStorage.getItem(`welcomed_${currentUser.uid}`);
          if (!wasWelcomed) {
            const userName = currentUser.displayName || currentUser.email?.split('@')[0] || "Guest";
            setWelcomeNotification(`Thank you for logging in and welcome to Bliss Elle Ghana, ${userName}.`);
            sessionStorage.setItem(`welcomed_${currentUser.uid}`, 'true');
          }
        }
      } else {
        setIsAdminUser(false);
      }
    });
  }, []);

  // Real-time Hotspots subscription with automatic static data fallback
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'hotspots'), (snapshot) => {
      const dbList: Hotspot[] = [];
      snapshot.forEach(docSnap => {
        dbList.push({ ...docSnap.data(), id: docSnap.id } as Hotspot);
      });

      if (dbList.length === 0) {
        setLiveHotspots(staticHotspots);
        console.log("Seeding Firestore Hotspots database with rich static collections...");
        const batch = writeBatch(db);
        staticHotspots.forEach(hot => {
          const docRef = doc(db, 'hotspots', hot.id);
          batch.set(docRef, hot);
        });
        batch.commit()
          .then(() => console.log("Fitted Firestore hotspots populated."))
          .catch(e => console.error("Error seeding hotspots:", e));
      } else {
        setLiveHotspots(dbList);
      }
    }, (err) => {
      console.warn("Firestore error reading hotspots:", err);
      setLiveHotspots(staticHotspots);
    });
    return () => unsub();
  }, []);

  // Floating ambient lighting particle objects
  const [particles] = useState(() => 
    Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      x: `${Math.random() * 100}%`,
      y: `${Math.random() * 100}%`,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 12 + 18,
      delay: Math.random() * 5
    }))
  );

  // Reset active look hotspot when collection changes
  useEffect(() => {
    setActiveHotspotId(null);
  }, [selectedCollectionId]);

  // Real-time orientation check: when height > width (portrait), switch the background video
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Premium runway scroll progress tracking
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScrollHeight > 0) {
        const progress = Math.min(Math.max((window.scrollY / totalScrollHeight) * 100, 0), 100);
        setScrollProgress(progress);
      } else {
        setScrollProgress(0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Actions
  const handleAddToBag = (item: Hotspot) => {
    setCartItems(prev => [...prev, item]);
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleDeleteHotspot = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'hotspots', id));
    } catch (err) {
      console.error("Failed to delete hotspot from lookbook drawer:", err);
    }
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlist(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const handleClearWishlist = () => {
    setWishlist([]);
    setWelcomeNotification("COLLECTION PORTFOLIO SECURED. ALL WISHLIST STYLES SUCCESSFULLY TRANSFERRED TO YOUR BAG.");
    setIsCartOpen(true);
  };

  // Newsletter subscription states
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const [showSubscribeSuccess, setShowSubscribeSuccess] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      setNewsletterError('Please enter a valid email address');
      return;
    }

    setNewsletterLoading(true);
    setNewsletterError(null);

    try {
      const subscriberId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await setDoc(doc(db, 'newsletter', subscriberId), {
        email: newsletterEmail.trim().toLowerCase(),
        createdAt: serverTimestamp()
      });
      setNewsletterSubscribed(true);
      setShowSubscribeSuccess(true);
      setNewsletterEmail('');
    } catch (err: any) {
      console.warn("Firestore subscription write offline fallback:", err);
      localStorage.setItem(`subscribed_${newsletterEmail.trim().toLowerCase()}`, 'true');
      setNewsletterSubscribed(true);
      setShowSubscribeSuccess(true);
      setNewsletterEmail('');
    } finally {
      setNewsletterLoading(false);
    }
  };

  // Mouse-move parallax states
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    
    // Dynamic subtle parallax offset scaling to maximum 15px shifting in any direction
    const x = ((clientX - innerWidth / 2) / (innerWidth / 2)) * 15;
    const y = ((clientY - innerHeight / 2) / (innerHeight / 2)) * 15;
    setMouseOffset({ x, y });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
  };

  return (
    <div 
      className="min-h-screen w-full relative overflow-x-hidden flex flex-col justify-start bg-[#FCFBF7] text-white select-none"
      id="bliss-app-root"
      onClick={() => setActiveHotspotId(null)}
    >
      
      {/* Thin, elegant golden "modern runway" progress bar tracking scroll progress */}
      <div className="fixed top-0 left-0 right-0 h-[1px] bg-[#BA9A5D]/5 z-[100] pointer-events-none">
        <motion.div 
          className="h-full bg-gradient-to-r from-[#BA9A5D] via-[#FFEBB5] to-[#BA9A5D] shadow-[0_0_8px_rgba(186,154,93,0.7)]"
          style={{ transformOrigin: "left" }}
          animate={{ scaleX: scrollProgress / 100 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      </div>

      {/* 1. IMMERSIVE HERO SECTION BLOCK WITH SHIFTING INTEGRATED MOOD THEMES */}
      <motion.div
        id="hero-section-block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`relative w-full min-h-screen xl:min-h-[92vh] flex flex-col justify-center overflow-hidden transition-colors duration-1000 bg-linear-to-b ${
          selectedCollectionId === 'emerald'
            ? 'from-[#050f0c] via-[#0b1713] to-[#040807]'
            : selectedCollectionId === 'champagne'
            ? 'from-[#0f1211] via-[#1b221f] to-[#0f1211]'
            : 'from-[#030504] via-[#09100e] to-[#010202]'
        }`}
      >
        {/* Absolute Fullscreen Video or Image Background from Admin Upload Cache */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 bg-gradient-to-b from-[#030906] to-[#010202]">
          {/* Render cached custom background either as high-def video or gorgeous image wallpaper with parallax depth */}
          {isPortrait ? (
            localPortraitUrl ? (
              localPortraitType === 'image' ? (
                <img
                  className="absolute top-1/2 left-1/2 min-w-full min-h-full object-cover transform-gpu will-change-transform"
                  src={localPortraitUrl}
                  alt="Portrait Wallpaper Backdrop"
                  referrerPolicy="no-referrer"
                  style={{
                    transform: `translate3d(calc(-50% + ${mouseOffset.x}px), calc(-50% + ${mouseOffset.y}px), 0) scale(1.06)`,
                    transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                />
              ) : (
                <video
                  key="portrait-uploaded"
                  className="absolute top-1/2 left-1/2 min-w-full min-h-full object-cover aspect-[1080/1920] transform-gpu will-change-transform backface-hidden"
                  src={localPortraitUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  style={{
                    transform: `translate3d(calc(-50% + ${mouseOffset.x}px), calc(-50% + ${mouseOffset.y}px), 0) scale(1.06)`,
                    transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  poster="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=82&w=1080"
                />
              )
            ) : (
              /* Elegant high-impact luxury default portrait wallpaper with zero network buffer lag */
              <img
                className="absolute top-1/2 left-1/2 min-w-full min-h-full object-cover opacity-85 transform-gpu will-change-transform"
                src="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=82&w=1080"
                alt="Luxury Portrait Background Fallback"
                referrerPolicy="no-referrer"
                style={{
                  transform: `translate3d(calc(-50% + ${mouseOffset.x}px), calc(-50% + ${mouseOffset.y}px), 0) scale(1.06)`,
                  transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              />
            )
          ) : (
            localLandscapeUrl ? (
              localLandscapeType === 'image' ? (
                <img
                  className="absolute top-1/2 left-1/2 min-w-full min-h-full object-cover transform-gpu will-change-transform"
                  src={localLandscapeUrl}
                  alt="Landscape Wallpaper Backdrop"
                  referrerPolicy="no-referrer"
                  style={{
                    transform: `translate3d(calc(-50% + ${mouseOffset.x}px), calc(-50% + ${mouseOffset.y}px), 0) scale(1.06)`,
                    transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                />
              ) : (
                <video
                  key="landscape-uploaded"
                  className="absolute top-1/2 left-1/2 min-w-full min-h-full object-cover aspect-[1920/1080] transform-gpu will-change-transform backface-hidden"
                  src={localLandscapeUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  style={{
                    transform: `translate3d(calc(-50% + ${mouseOffset.x}px), calc(-50% + ${mouseOffset.y}px), 0) scale(1.06)`,
                    transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  poster="https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=82&w=1920"
                />
              )
            ) : (
              /* Elegant high-impact luxury default landscape wallpaper with zero network buffer lag */
              <img
                className="absolute top-1/2 left-1/2 min-w-full min-h-full object-cover opacity-85 transform-gpu will-change-transform"
                src="https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=82&w=1920"
                alt="Luxury Landscape Background Fallback"
                referrerPolicy="no-referrer"
                style={{
                  transform: `translate3d(calc(-50% + ${mouseOffset.x}px), calc(-50% + ${mouseOffset.y}px), 0) scale(1.06)`,
                  transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              />
            )
          )}
          {/* Transparent overlay for high-contrast legible layout */}
          <div 
            className="absolute inset-0 bg-black/35 backdrop-blur-[0.2px]" 
          />
        </div>

        {/* 1. Atmospheric Glow Gradients & Background Lighting Rig */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
          {/* Soft Golden spotlight top-right */}
          <div className="absolute top-0 right-10 h-[500px] w-[500px] rounded-full bg-radial-to-br from-[#BA9A5D]/10 via-transparent to-transparent blur-3xl" />
          
          {/* Emerald vignette bloom center-left */}
          <div className="absolute bottom-10 left-[-30px] h-[450px] w-[450px] rounded-full bg-radial-to-tr from-[#020a07]/30 via-transparent to-transparent blur-3xl" />
          
          {/* Subtle grid line backdrop for modern UI structure */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40" />

          {/* 2. Floating Gold Glitter Particles with dynamic hover reaction */}
          {particles.map((p) => (
            <FloatingParticle p={p} key={p.id} />
          ))}
        </div>

        {/* 3. Luxury Outer Display frame (Delicate borders wrapping page) */}
        <div className="hidden xl:block absolute inset-6 border border-white/[0.02] pointer-events-none rounded-[40px] z-30" />

        {/* Main Luxury Hero Area */}
        <main className="flex-1 w-full flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 relative z-20">
        
        {/* LARGE FLOATING GLASSMORPHISM CONTAINER */}
        <div 
          className="relative w-full max-w-[1920px] xl:w-[98%] rounded-[24px] sm:rounded-[32px] p-3 sm:p-5 md:p-6 lg:p-8 xl:p-10 overflow-visible bg-transparent border-none shadow-none"
          id="hero-glass-container"
        >

          {/* Floated Top Logo & Navigation bar inside the container */}
          <Navbar 
            activeSection={activeSection}
            setActiveSection={handleSetSection}
            cartCount={cartItems.length}
            onOpenCart={() => setIsCartOpen(true)}
            onShopNow={() => setIsCartOpen(true)}
            user={user}
            isAdminUser={isAdminUser}
            onLogin={handleLogin}
            onLogout={logOutUser}
            onOpenAdmin={() => setIsAdminOpen(true)}
            onOpenClientPortal={() => setIsClientOpen(true)}
            wishlistCount={wishlist.length}
            onOpenWishlist={() => setIsWishlistOpen(true)}
            onOpenSearch={() => setIsSearchOpen(true)}
          />

          {/* Authentic / Connection / Blocker Error Banner */}
          <AnimatePresence>
            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6 p-4 rounded-2xl bg-amber-950/20 border border-[#BA9A5D]/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs font-sans-luxury text-[#DFCE9F]"
              >
                <div className="flex gap-3 items-center">
                  <ShieldAlert className="h-5 w-5 text-[#BA9A5D] shrink-0" />
                  <div>
                    <strong className="text-white font-semibold">Sign In Guidance:</strong>
                    <p className="text-zinc-300 mt-1">{authError}</p>
                  </div>
                </div>
                <button
                  onClick={() => setAuthError(null)}
                  className="px-3.5 py-1.5 rounded-full border border-white/10 hover:border-white/20 hover:bg-white/5 text-white transition-all uppercase text-[9px] tracking-widest cursor-pointer font-bold font-mono"
                >
                  Dismiss
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Welcome VIP Bliss Air Notification Banner */}
          <AnimatePresence>
            {welcomeNotification && (
              <motion.div
                initial={{ opacity: 0, y: -30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-[#152D25] via-[#040e0a] to-[#152D25] border border-[#BA9A5D] shadow-[0_15px_45px_rgba(186,154,93,0.3)] flex items-center justify-between gap-4 text-xs font-sans text-[#DFCE9F]"
              >
                <div className="flex gap-3.5 items-center">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#BA9A5D]/20 border border-[#BA9A5D]/40">
                    <Sparkles className="h-4 w-4 text-[#DFCE9F] animate-pulse" />
                  </div>
                  <div>
                    <strong className="text-white text-[11px] tracking-[0.2em] uppercase font-black block">Bliss Elle Ghana</strong>
                    <p className="text-zinc-300 mt-1 font-medium text-xs leading-relaxed">{welcomeNotification}</p>
                  </div>
                </div>
                <button
                  onClick={() => setWelcomeNotification(null)}
                  className="px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 hover:bg-white/5 text-white transition-all uppercase text-[9px] tracking-widest cursor-pointer font-bold font-mono shrink-0"
                >
                  Dismiss
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Secure Admin Authorization Login Welcome Banner */}
          <AnimatePresence>
            {adminNotification && (
              <motion.div
                initial={{ opacity: 0, y: -30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-[#BA9A5D]/15 via-zinc-950/95 to-[#BA9A5D]/15 border-2 border-[#BA9A5D] shadow-[0_15px_45px_rgba(186,154,93,0.3)] flex items-center justify-between gap-4 text-xs font-sans text-[#DFCE9F]"
              >
                <div className="flex gap-3.5 items-center">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#BA9A5D]/20 border border-[#BA9A5D]/40">
                    <ShieldCheck className="h-4 w-4 text-[#BA9A5D]" />
                  </div>
                  <div>
                    <strong className="text-white text-[11px] tracking-[0.2em] uppercase font-black block">
                      ⚜️ Welcome Admin, {user?.displayName || (user?.email ? user.email.split('@')[0].split(/[._-]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "Joe Vardy")}
                    </strong>
                    <p className="text-[#DFCE9F] mt-1 font-mono text-xs leading-relaxed">{adminNotification}</p>
                  </div>
                </div>
                <button
                  onClick={() => setAdminNotification(null)}
                  className="px-4 py-2 rounded-full border border-white/10 hover:border-[#BA9A5D] hover:bg-[#BA9A5D]/10 text-white transition-all uppercase text-[8px] tracking-widest cursor-pointer font-bold font-mono shrink-0"
                >
                  Dismiss Greeting
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SPLIT LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mt-8 lg:mt-12 items-center">
            
            {/* LEFT CONTENT COLUMN (Highly transparent premium glass plaque to let the background video wallpaper shine through elegantly while keeping text legible) */}
            <div className="lg:col-span-12 max-w-3xl mx-auto flex flex-col items-start text-left z-20 bg-black/[0.02] sm:bg-[#020c08]/3 backdrop-blur-[2.5px] border border-white/[0.04] p-6 sm:p-10 rounded-3xl shadow-[0_25px_50px_-15px_rgba(0,0,0,0.35)]" id="editorial-left-content">
              
              {/* Active Collection Subtitle badge */}
              <motion.div
                key={`badge-${selectedCollectionId}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 rounded-full border border-[#BA9A5D]/20 bg-[#BA9A5D]/5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#DFCE9F]"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#BA9A5D]" />
                <span className="transition-all duration-500 ease-in-out">
                  {showChicText ? "Chic.Confident.You!" : activeCollection.subtitle}
                </span>
              </motion.div>

              {/* CORE HEADLINE: STEP INTO ELEGANCE */}
              <motion.div
                key={`headline-${selectedCollectionId}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
                className="mt-5"
              >
                <h1 className="text-white leading-[1.1] tracking-tight">
                  <span className="block text-xs sm:text-sm md:text-base lg:text-lg tracking-[0.24em] uppercase text-white/95 font-sans-luxury font-medium mb-1">
                    Welcome To
                  </span>
                  <span className="block text-5xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[7.4rem] font-serif-luxury font-light tracking-wide text-[#BA9A5D] my-1.5 leading-[0.95] text-glow-gold">
                    Bliss Elle Ghana
                  </span>
                  <span className="block text-[10px] sm:text-xs md:text-sm lg:text-base font-light uppercase tracking-[0.12em] sm:tracking-[0.2em] md:tracking-[0.22em] text-[#DFCE9F] mt-3 leading-normal font-sans-luxury">
                    — Luxury Heels, Slippers & Bags
                  </span>
                </h1>
              </motion.div>

              {/* CORE DESCRIPTION */}
              <motion.p
                key={`description-${selectedCollectionId}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mt-6 font-sans-luxury text-sm sm:text-base leading-relaxed text-zinc-300 max-w-xl font-light tracking-wide"
              >
                {activeCollection.description}
              </motion.p>

              {/* INTERACTIVE SEASONAL COLLECTION CHANGER PILLS */}
              <div className="mt-8 w-full">
                <span className="font-mono text-[9px] tracking-widest text-[#BA9A5D]/80 block uppercase mb-3">
                  Select Style Mood
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {collections.map((col) => (
                    <button
                      key={col.id}
                      id={`theme-select-${col.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCollectionId(col.id);
                      }}
                      className={`relative z-10 rounded-full px-5 py-2.5 text-[10px] font-semibold uppercase tracking-widest transition-all cursor-pointer ${
                        selectedCollectionId === col.id
                          ? col.id === 'emerald'
                            ? 'bg-gradient-to-r from-[#BA9A5D] to-[#DFCE9F] text-zinc-950 scale-[1.03] shadow-md font-bold box-glow-gold'
                            : col.id === 'champagne'
                            ? 'bg-[#152D25] text-[#DFCE9F] border border-[#BA9A5D]/50 scale-[1.03] shadow-md font-bold'
                            : 'bg-black text-white border border-[#BA9A5D]/50 scale-[1.03] shadow-md font-bold'
                          : 'bg-white/[0.02] border border-white/10 text-zinc-300 hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      {col.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* ACTION CALL TO BUTTONS */}
              <div className="mt-8 flex flex-wrap gap-4 items-center w-full">
                <button
                  id="cta-shop-collection"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCartOpen(true);
                  }}
                  className="group relative flex items-center gap-2 overflow-hidden rounded-full border border-[#BA9A5D]/60 bg-linear-to-r from-[#BA9A5D] to-[#DFCE9F] px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-950 shadow-lg transition-all hover:scale-[1.03]"
                >
                  <span className="relative z-10 flex items-center gap-2 font-bold">
                    Shop Collection
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/50 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                </button>

                <button
                  id="cta-explore-lookbook"
                  onClick={(e) => {
                    e.stopPropagation();
                    const el = document.getElementById("shop-by-style-section");
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="group flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.02] px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#DFCE9F] backdrop-blur-sm transition-all hover:bg-white/[0.06] hover:border-[#BA9A5D]/30"
                >
                  <BookOpen className="h-3.5 w-3.5 text-[#BA9A5D]" />
                  Explore Lookbook
                </button>
              </div>

              {/* STATS RATING SECTION */}
              <div className="border-t border-white/5 w-full mt-10 pt-6">
                <StatsSection stats={activeCollection.stats} />
              </div>

            </div>

          </div>

        </div>
      </main>
    </motion.div>

      {/* SECTION 02 — SHOP BY STYLE */}
      <ShopByStyle 
        onAddToBag={handleAddToBag} 
        cartItems={cartItems} 
        wishlist={wishlist}
        onToggleWishlist={handleToggleWishlist}
      />

      {/* REDESIGNED LUXURY FOOTER MATCHING THE STRUCTURAL DESIGN IN WORKSPACE SPECIFICATIONS */}
      <footer className="w-full bg-[#FCFBF7] text-[#152D25] py-16 px-4 sm:px-8 lg:px-16 border-t border-[#BA9A5D]/20 z-10 relative">
        <div className="max-w-7xl mx-auto flex flex-col gap-14">
          
          {/* Large Newsletter Rounded Card */}
          <motion.div 
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, cubicBezier: [0.16, 1, 0.3, 1] }}
            className="bg-[#0e2721] rounded-3xl p-8 sm:p-12 lg:p-14 text-white grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border border-white/5 shadow-2xl relative overflow-hidden"
          >
            {/* Subtle luxury ambient blur */}
            <div className="absolute right-0 top-0 w-80 h-80 bg-[#BA9A5D]/5 rounded-full blur-3xl pointer-events-none" />
            
            {/* Left Column: Heading and info text */}
            <div className="lg:col-span-7 flex flex-col items-start gap-4 text-left">
              <h3 className="text-3xl sm:text-4xl lg:text-4xl font-serif-luxury font-light text-white leading-tight tracking-tight uppercase">
                Subscribe our <span className="font-serif-luxury italic text-[#BA9A5D]">newsletter</span>
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 font-sans tracking-wide leading-relaxed font-light max-w-xl">
                Subscribe to our newsletter and be the first to receive updates on exclusive collections, personal runway journals, and expert footwear styling tips.
              </p>
            </div>

            {/* Right Column: Dynamic Form */}
            <div className="lg:col-span-5 w-full flex flex-col gap-2 text-left">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#BA9A5D] block">
                Stay up to date
              </span>
              
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2.5 items-stretch w-full mt-1">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => {
                    setNewsletterEmail(e.target.value);
                    if (newsletterError) setNewsletterError(null);
                  }}
                  placeholder="Enter your email"
                  className="flex-1 bg-white/[0.04] border border-white/15 focus:border-[#BA9A5D]/50 focus:outline-none rounded-full px-5 py-3 text-xs sm:text-[13px] tracking-wider text-white placeholder-zinc-500 transition-all duration-300 min-h-[44px]"
                  disabled={newsletterLoading || newsletterSubscribed}
                  required
                />
                <button
                  type="submit"
                  disabled={newsletterLoading || newsletterSubscribed}
                  className="rounded-full bg-[#BA9A5D] hover:bg-[#DFCE9F] text-zinc-950 px-7 py-3 font-sans text-xs font-bold uppercase tracking-widest transition-all duration-300 hover:scale-[1.03] active:scale-95 disabled:opacity-40 flex items-center justify-center min-h-[44px] cursor-pointer shadow-lg shrink-0"
                >
                  {newsletterLoading ? (
                    <div className="h-4 w-4 border border-t-transparent border-zinc-950 rounded-full animate-spin" />
                  ) : "Subscribe"}
                </button>
              </form>

              {/* Status banner */}
              <AnimatePresence mode="wait">
                {newsletterError && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[10px] text-red-400 tracking-wider font-mono mt-1"
                  >
                    ✦ {newsletterError.toUpperCase()}
                  </motion.p>
                )}
              </AnimatePresence>

              <p className="text-[10px] text-zinc-500 font-mono tracking-wider mt-3">
                By subscribing you agree to our <a href="#privacy" className="underline hover:text-white transition-colors">Privacy Policy</a>
              </p>
            </div>

          </motion.div>

          {/* Clean Structural Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-4 items-start">
            
            {/* branding Column */}
            <div className="lg:col-span-5 flex flex-col items-start text-left gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[#BA9A5D] text-lg">✦</span>
                <span className="text-base font-serif-luxury font-black uppercase tracking-[0.25em] text-[#152D25]">
                  BLISS ELLE GHANA
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-sans tracking-wide leading-relaxed font-light max-w-sm">
                Adorning your steps with unparalleled poise, confidence, and bespoke luxury. Make your steps as confident as your style.
              </p>
            </div>

            {/* Navigational Links Columns */}
            <div className="lg:col-span-7 grid grid-cols-2 gap-8 w-full">
              
              {/* Column 1: Features */}
              <div className="flex flex-col items-start text-left gap-4">
                <span className="text-[11px] font-sans-luxury font-bold uppercase tracking-[0.18em] text-[#152D25]">
                  Features
                </span>
                <div className="flex flex-col gap-2.5">
                  <a href="#emerald" className="text-xs text-zinc-600 hover:text-[#BA9A5D] transition-colors font-sans font-light">Emerald Heels</a>
                  <a href="#boots" className="text-xs text-zinc-600 hover:text-[#BA9A5D] transition-colors font-sans font-light">Thigh Boots</a>
                  <a href="#artisanal" className="text-xs text-zinc-600 hover:text-[#BA9A5D] transition-colors font-sans font-light">Artisanal Bags</a>
                  <a href="#bespoke" className="text-xs text-zinc-600 hover:text-[#BA9A5D] transition-colors font-sans font-light">Bespoke Fitting</a>
                </div>
              </div>

              {/* Column 2: Support */}
              <div className="flex flex-col items-start text-left gap-4">
                <span className="text-[11px] font-sans-luxury font-bold uppercase tracking-[0.18em] text-[#152D25]">
                  Support
                </span>
                <div className="flex flex-col gap-2.5">
                  <a href="#help" className="text-xs text-zinc-600 hover:text-[#BA9A5D] transition-colors font-sans font-light">Help Center</a>
                  <a href="#guide" className="text-xs text-zinc-600 hover:text-[#BA9A5D] transition-colors font-sans font-light">Fittings Guide</a>
                  <a href="#faq" className="text-xs text-zinc-600 hover:text-[#BA9A5D] transition-colors font-sans font-light">Digital FAQ</a>
                  <a href="#concierge" className="text-xs text-zinc-600 hover:text-[#BA9A5D] transition-colors font-sans font-light">Concierge Contact</a>
                </div>
              </div>

            </div>

          </div>

          {/* Sub-note Divider bar */}
          <div className="border-t border-[#BA9A5D]/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
            <p>Bliss Elle Ghana copywrite 2026 developeded by Techloom Ghana(Joe Vardy Grp..)</p>
            <p className="text-[#BA9A5D]/60 flex items-center gap-1.5"><span className="text-xs">✦</span> ACCREDITED WEST AFRICAN CRAFTSMANSHIP</p>
          </div>

        </div>
      </footer>

      {/* 4. Drawers & Floating Panes overlays */}
      <CartDrawer 
        isCartOpen={isCartOpen}
        onCloseCart={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={handleClearCart}
      />

      <WishlistDrawer
        isWishlistOpen={isWishlistOpen}
        onCloseWishlist={() => setIsWishlistOpen(false)}
        wishlist={wishlist}
        onToggleWishlist={handleToggleWishlist}
        onAddToBag={handleAddToBag}
        onClearWishlist={handleClearWishlist}
        hotspots={liveHotspots}
      />

      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={allAvailableStyleProducts}
        onAddToBag={handleAddToBag}
        wishlist={wishlist}
        onToggleWishlist={handleToggleWishlist}
        cartItems={cartItems}
      />

      <LookbookDrawer
        isLookbookOpen={isLookbookOpen}
        onCloseLookbook={() => setIsLookbookOpen(false)}
        currentCollection={activeCollection}
        onAddToBag={handleAddToBag}
        hotspots={liveHotspots}
        isAdminUser={isAdminUser}
        onDeleteProduct={handleDeleteHotspot}
      />

      <AdminWorkspace
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        user={user}
        isAdminUser={isAdminUser}
        onSetAdminUser={setIsAdminUser}
        localPortraitUrl={localPortraitUrl}
        localLandscapeUrl={localLandscapeUrl}
        onVideoUploaded={async (type, url, fileType, rawFile) => {
          let firestoreUrl = url;
          if (rawFile) {
            if (rawFile.size > 800 * 1024) {
              alert("This local file is quite large (>800KB). It is saved locally in your browser workspace fallback, but to synchronize it globally we highly recommend using compression or pasting a direct external media URL instead!");
            } else {
              try {
                firestoreUrl = await fileToBase64(rawFile);
              } catch (err) {
                console.warn("Base64 conversion failed:", err);
              }
            }
          }

          try {
            const docRef = doc(db, 'settings', 'wallpaper');
            const updateData: any = {};
            if (type === 'portrait') {
              updateData.portraitUrl = firestoreUrl;
              updateData.portraitType = fileType || 'video';
            } else {
              updateData.landscapeUrl = firestoreUrl;
              updateData.landscapeType = fileType || 'video';
            }
            await setDoc(docRef, updateData, { merge: true });
            console.log("Firestore wallpaper database updated.");
          } catch (err) {
            console.warn("Failed to update wallpaper settings in Firestore:", err);
          }

          if (type === 'portrait') {
            setLocalPortraitUrl(firestoreUrl);
            setLocalPortraitType(fileType || null);
          } else {
            setLocalLandscapeUrl(firestoreUrl);
            setLocalLandscapeType(fileType || null);
          }
        }}
      />

      <ClientWorkspace
        isOpen={isClientOpen}
        onClose={() => setIsClientOpen(false)}
        user={user}
        onLogout={logOutUser}
      />

      {/* Floating Interactive Controls (Right Side Bottom Corner): Shopping Cart & Wishlist */}
      <div 
        className="fixed right-6 bottom-6 sm:right-8 sm:bottom-8 z-40 flex flex-col gap-4 items-center"
        id="floating-luxury-controls"
      >
        {/* Floating Heart Wishlist Button designed with the exact colors of the cart icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 260, damping: 20 }}
          id="floating-wishlist-anchor"
        >
          <button
            onClick={() => setIsWishlistOpen(true)}
            className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#BA9A5D] bg-zinc-950/85 text-[#DFCE9F] shadow-[0_4px_30px_rgba(186,154,93,0.4)] backdrop-blur-md cursor-pointer hover:scale-110 active:scale-95 group transition-all duration-300"
            title="Open Wishlist Favorites"
          >
            {/* Wave ripple effect on back ring */}
            <span className="absolute inset-0 rounded-full border-2 border-[#BA9A5D]/40 group-hover:animate-ping opacity-75" />
            
            <Heart className={`h-6 w-6 stroke-[1.5] group-hover:scale-110 transition-all duration-300 ${wishlist.length > 0 ? 'fill-[#BA9A5D] text-[#BA9A5D]' : 'text-[#DFCE9F]'}`} />
            
            <AnimatePresence>
              {wishlist.length > 0 && (
                <motion.span
                  key="wishlist-badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1.2 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#BA9A5D] text-[10px] sm:text-xs font-black text-zinc-950 ring-2 ring-[#152D25]"
                >
                  {wishlist.length}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </motion.div>

        {/* Floating Interactive Bag / Shopping Cart Button */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1, type: 'spring', stiffness: 260, damping: 20 }}
          id="floating-cart-anchor"
        >
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#BA9A5D] bg-zinc-950/85 text-[#DFCE9F] shadow-[0_4px_30px_rgba(186,154,93,0.4)] backdrop-blur-md cursor-pointer hover:scale-110 active:scale-95 group transition-all duration-300"
            title="Open Shopping Bag"
          >
            {/* Wave ripple effect on back ring */}
            <span className="absolute inset-0 rounded-full border-2 border-[#BA9A5D]/40 group-hover:animate-ping opacity-75" />
            
            <ShoppingBag className="h-6 w-6 stroke-[1.5] group-hover:rotate-12 transition-transform duration-300" />
            
            <AnimatePresence>
              {cartItems.length > 0 && (
                <motion.span
                  key="badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1.2 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#BA9A5D] text-[10px] sm:text-xs font-black text-zinc-950 ring-2 ring-[#152D25]"
                >
                  {cartItems.length}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </motion.div>
      </div>

      {/* Luxury Subscription Popup Notification Model */}
      <AnimatePresence>
        {showSubscribeSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-md bg-[#0D1C17] border border-[#BA9A5D]/30 p-8 rounded-3xl text-center shadow-[0_24px_50px_rgba(0,0,0,0.8),_0_0_40px_rgba(186,154,93,0.15)] flex flex-col items-center"
            >
              <div className="h-16 w-16 bg-[#BA9A5D]/10 rounded-full flex items-center justify-center border border-[#BA9A5D]/30 mb-6 relative">
                <div className="absolute inset-0 rounded-full bg-[#BA9A5D]/5 animate-ping opacity-75" />
                <Sparkles className="h-7 w-7 text-[#BA9A5D]" />
              </div>
              <h4 className="font-sans font-black uppercase text-xl text-white tracking-widest mb-3">
                ACCESS GRANTED
              </h4>
              <div className="h-[1px] w-20 bg-[#BA9A5D]/30 mb-4" />
              <p className="text-zinc-300 text-xs tracking-wider leading-relaxed mb-6 max-w-sm">
                Welcome to the Bliss Elle luxury circle. You are now subscribed to receive our elite digital catalogs, private collections preview, and bespoke store announcements.
              </p>
              <button
                onClick={() => setShowSubscribeSuccess(false)}
                className="w-full py-3 bg-[#BA9A5D] text-zinc-950 font-sans font-black text-xs uppercase tracking-[0.2em] rounded-full hover:bg-white hover:scale-102 transition-all shadow-[0_8px_20px_rgba(186,154,93,0.25)] cursor-pointer"
              >
                Enter Workspace
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
