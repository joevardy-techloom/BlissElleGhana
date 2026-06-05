import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ShoppingBag, ArrowRight, Sparkles, BookOpen, Clock, AlertCircle, LogIn, Lock, Download, Award, Trash2, Heart } from 'lucide-react';
import { Hotspot, Collection } from '../types';
import { db, auth, logInWithGoogle, handleFirestoreError, OperationType, logWhatsAppInteraction } from '../firebase';
import { collection, doc, setDoc, getDocs, getDoc, serverTimestamp } from 'firebase/firestore';
import { STYLE_PRODUCTS, StyleProduct } from './ShopByStyle';

interface InteractivePanelsProps {
  isCartOpen: boolean;
  onCloseCart: () => void;
  cartItems: Hotspot[];
  onRemoveFromCart: (id: string) => void;
  onClearCart: () => void;
  isLookbookOpen: boolean;
  onCloseLookbook: () => void;
  currentCollection: Collection;
}

export function CartDrawer({
  isCartOpen,
  onCloseCart,
  cartItems,
  onRemoveFromCart,
  onClearCart
}: Omit<InteractivePanelsProps, 'isLookbookOpen' | 'onCloseLookbook' | 'currentCollection'>) {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successDetails, setSuccessDetails] = useState({ 
    count: 0, 
    total: 0,
    clientName: "",
    clientPhone: "",
    clientLocation: "",
    clientBranch: "",
    items: [] as Hotspot[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [user, setUser] = useState(auth.currentUser);

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientLocation, setClientLocation] = useState("");
  const [clientBranch, setClientBranch] = useState("Maison Accra (Airport Residential)");

  useEffect(() => {
    return auth.onAuthStateChanged((u) => {
      setUser(u);
      if (u) {
        setClientName(u.displayName || "");
        
        // Instant pre-population fallback from localStorage
        const cached = localStorage.getItem(`profile_${u.uid}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.username) setClientName(parsed.username);
            if (parsed.phone) setClientPhone(parsed.phone);
            if (parsed.location) setClientLocation(parsed.location);
          } catch (e) {
            console.warn("Local profile parsing failed:", e);
          }
        }

        // Dynamic fetch from the account system profile portal
        getDoc(doc(db, 'profiles', u.uid))
          .then((snap) => {
            if (snap.exists()) {
              const data = snap.data();
              if (data.username) setClientName(data.username);
              if (data.phone) setClientPhone(data.phone);
              if (data.location) setClientLocation(data.location);
              if (data.branch) setClientBranch(data.branch);
            }
          })
          .catch((err) => {
            console.warn("Could not pre-fetch profile from database:", err);
          });
      }
    });
  }, [isCartOpen]);
  
  const calculateTotal = () => {
    return cartItems.reduce((acc, item) => {
      const priceVal = parseInt(item.price.replace('$', '').replace(',', ''));
      return acc + (isNaN(priceVal) ? 0 : priceVal);
    }, 0);
  };

  const handleCheckout = async () => {
    if (!user) {
      setErrorMessage("Secure Google login is required to submit a booking slot to Firestore.");
      return;
    }

    const hasIncompleteProfile = !clientName.trim() || !clientPhone.trim() || !clientLocation.trim();
    
    // Smoothly falls back so client is never blocked
    const finalName = clientName.trim() || user.displayName || "VIP Guest Client";
    const finalPhone = clientPhone.trim() || "Complete on WhatsApp chat";
    const finalLocation = clientLocation.trim() || "Address pending profile update";
    const finalBranch = clientBranch || "Maison Accra (Airport Residential)";

    setIsSubmitting(true);
    setErrorMessage("");
    try {
       const orderId = "ord_" + Math.random().toString(36).substring(2, 11);
       const subtotal = calculateTotal();
       
       const orderDoc = {
         userId: user.uid,
         email: user.email || "vip_client@blisselle.com",
         clientName: finalName,
         clientPhone: finalPhone,
         clientLocation: finalLocation,
         preferredBranch: finalBranch,
         count: cartItems.length,
         total: subtotal,
         status: "pending",
         type: "Bespoke Order Sent",
         message: "Booking order submitted and directed to WhatsApp chat.",
         items: cartItems.map(item => ({
           id: item.id,
           name: item.name,
           category: item.category,
           price: item.price,
           imageUrl: item.imageUrl || ""
         })),
         createdAt: serverTimestamp(),
         updatedAt: serverTimestamp()
       };
 
       const docRef = doc(db, 'orders', orderId);
       try {
          await setDoc(docRef, orderDoc);
        } catch (orderWriteErr) {
          handleFirestoreError(orderWriteErr, OperationType.WRITE, `orders/${orderId}`);
        };

       // Auto-save user's coordinates and also append full order details to profile in Firestore & localStorage
       if (user) {
         try {
           const profileRef = doc(db, 'profiles', user.uid);
           let existingOrderHistory: any[] = [];
           let usernameVal = clientName.trim() || user.displayName || "";
           let phoneVal = clientPhone.trim() || "";
           let locationVal = clientLocation.trim() || "";
           let branchVal = clientBranch || "";

           try {
             const profileSnap = await getDoc(profileRef);
             if (profileSnap.exists()) {
               const data = profileSnap.data();
               if (Array.isArray(data.orderHistory)) {
                 existingOrderHistory = data.orderHistory;
               } else if (Array.isArray(data.ordersList)) {
                 existingOrderHistory = data.ordersList;
               }
               if (!usernameVal && data.username) usernameVal = data.username;
               if (!phoneVal && data.phone) phoneVal = data.phone;
               if (!locationVal && data.location) locationVal = data.location;
               if (!branchVal && data.branch) branchVal = data.branch;
             }
           } catch (snapErr) {
             console.warn("Could not retrieve current profile SNAP to join order history:", snapErr);
           }

           const newOrderHistoryItem = {
             orderId,
             clientName: finalName,
             clientPhone: finalPhone,
             clientLocation: finalLocation,
             preferredBranch: finalBranch,
             count: cartItems.length,
             total: subtotal,
             status: "submitted",
             items: cartItems.map(item => ({
               id: item.id,
               name: item.name,
               category: item.category,
               price: item.price,
               imageUrl: item.imageUrl || ""
             })),
             timestamp: new Date().toISOString(),
             createdAt: new Date().toISOString()
           };

           await setDoc(profileRef, {
             username: usernameVal || finalName,
             phone: phoneVal || finalPhone,
             location: locationVal || finalLocation,
             branch: branchVal || finalBranch,
             email: user.email || "",
             updatedAt: new Date(),
             orderHistory: [...existingOrderHistory, newOrderHistoryItem],
             ordersList: [...existingOrderHistory, newOrderHistoryItem]
           }, { merge: true });

           localStorage.setItem(`profile_${user.uid}`, JSON.stringify({
             username: usernameVal || finalName,
             phone: phoneVal || finalPhone,
             location: locationVal || finalLocation,
             branch: branchVal || finalBranch,
             updatedAt: new Date().toISOString()
           }));
         } catch (profileErr) {
           console.warn("Could not auto-save order coordinates back to profile:", profileErr);
         }
       }

       // Record Order Interaction in client's history logs
       if (user) {
         try {
           const itemsListText = cartItems.map((it, idx) => `✦ (${idx + 1}) ${it.name} (${it.price})`).join('\n');
           const waMessageText = `Hello Bliss Elle, I've just placed an order!\n\n` +
                                 `✦ Client Name: ${finalName}\n` +
                                 `✦ Phone: ${finalPhone}\n` +
                                 `✦ Delivery Location: ${finalLocation}\n\n` +
                                 `Bespoke Selections:\n${itemsListText}\n\n` +
                                 `Total price: GHS ${subtotal.toLocaleString()}`;
           await logWhatsAppInteraction(user.uid, {
             message: waMessageText,
             type: "Bespoke Order Sent",
             items: cartItems.map(item => ({
               id: item.id,
               name: item.name,
               price: item.price,
               imageUrl: item.imageUrl || ""
             })),
             total: subtotal
           });
         } catch (e) {
           console.warn("Could not log order interaction:", e);
         }
       }
 
       setSuccessDetails({ 
         count: cartItems.length, 
         total: subtotal,
         clientName: finalName,
         clientPhone: finalPhone,
         clientLocation: finalLocation,
         clientBranch: finalBranch,
         items: [...cartItems]
       });

       // Formulate and send order details to the admin's professional WhatsApp number automatically
       const itemsListTextFormatted = cartItems.map((it, idx) => `✦ (${idx + 1}) ${it.name} - GHS ${it.price}`).join('\n');
       
       const waMessageTextFormatted = `⚜️ BLISS ELLE - Bespoke Luxury Order Confirmation ⚜️\n\n` +
                                      `Greetings Bliss Elle Maison, an order has been submitted with the following details:\n\n` +
                                      `👤 Client Profile Details:\n` +
                                      `- Client Name: ${finalName}\n` +
                                      `- Account Email: ${user?.email || "anonymous_vip@blisselle.com"}\n` +
                                      `- WhatsApp Phone: ${finalPhone}\n` +
                                      `- Delivery Location: ${finalLocation}\n` +
                                      `- Selected Maison Branch: ${finalBranch}\n\n` +
                                      `🛍️ Curated Selections:\n` +
                                      `${itemsListTextFormatted}\n\n` +
                                      `💰 Order Total: GHS ${subtotal.toLocaleString()}\n` +
                                      `🕒 Order Timestamp: ${new Date().toLocaleString()}\n\n` +
                                      `Please process my order coordination! Thank you.`;

       const waUrl = `https://wa.me/233543750366?text=${encodeURIComponent(waMessageTextFormatted)}`;
       window.open(waUrl, '_blank');

       setShowSuccessModal(true);
    } catch (err) {
       console.error("Firestore Order Submission Error:", err);
       // Offline direct WhatsApp dispatcher fallback
       const waMessageFallback = `Hello Bliss Elle, I've just placed an order direct on WhatsApp!\n\n` +
                                 `✦ Client Name: ${finalName}\n` +
                                 `Curated Selections:\n` +
                                 (cartItems.map((it, idx) => `✦ (${idx + 1}) ${it.name} (${it.price})`).join('\n')) +
                                 `\n\nTotal price: GHS ${calculateTotal().toLocaleString()}`;
       const waUrlFallback = `https://wa.me/233543750366?text=${encodeURIComponent(waMessageFallback)}`;
       window.open(waUrlFallback, '_blank');

       setSuccessDetails({ 
         count: cartItems.length, 
         total: calculateTotal(),
         clientName: finalName,
         clientPhone: finalPhone,
         clientLocation: finalLocation,
         clientBranch: finalBranch,
         items: [...cartItems]
       });
       setShowSuccessModal(true);
    } finally {
       setIsSubmitting(false);
    }
  };

  const handleInlineLogin = async () => {
    setErrorMessage("");
    try {
      await logInWithGoogle();
    } catch (err: any) {
      console.warn("Cart checkout inline auth error:", err);
      let msg = "Google Sign In failed. Ensure popups are allowed.";
      const errMsgStr = String(err?.message || err);
      const errCodeStr = String(err?.code || '');
      
      if (errCodeStr.includes('cancelled-popup-request') || 
          errCodeStr.includes('popup-closed-by-user') || 
          errMsgStr.includes('cancelled-popup-request') || 
          errMsgStr.includes('popup-closed-by-user')) {
        msg = "Authentication popup was closed or cancelled. Please click 'Sign In' again and select your account.";
      } else if (errCodeStr.includes('network-request-failed') || errMsgStr.includes('network-request-failed')) {
        msg = "Network/blocker interference. The sandbox iframe might block popups. Please click 'Open App' at the top to load this app in a separate non-iframe tab, and sign in easily!";
      } else if (err?.message) {
        msg = err.message;
      }
      setErrorMessage(msg);
    }
  };

  return (
    <>
      <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Black backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseCart}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            id="shopping-cart-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md border-l border-white/10 bg-[#152D25]/95 backdrop-blur-2xl p-6 sm:p-8 flex flex-col shadow-2xl text-white"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-[#BA9A5D]" />
                <h3 className="font-sans text-xs font-black tracking-widest uppercase text-white text-glow-gold">Your Selections</h3>
              </div>
              <button
                id="close-cart-btn"
                onClick={onCloseCart}
                className="p-1 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close cart"
              >
                <X className="h-5 w-5 text-zinc-400 hover:text-white" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto py-6 space-y-4 pr-1">
              {cartItems.length === 0 ? (
                <div className="h-[70vh] flex flex-col justify-center items-center text-center p-6">
                  <div className="relative mb-6">
                    <div className="absolute -inset-2 rounded-full bg-[#BA9A5D]/10 blur-md animate-pulse" />
                    <div className="relative h-18 w-18 rounded-full bg-linear-to-b from-white/[0.04] to-transparent border border-white/10 flex items-center justify-center text-[#BA9A5D]">
                      <ShoppingBag className="h-8 w-8 stroke-[1.2]" />
                    </div>
                  </div>
                  <h4 className="font-sans text-sm font-black tracking-[0.2em] text-[#DFCE9F] uppercase">YOUR BAG IS EMPTY</h4>
                  <p className="font-sans text-[11px] text-zinc-400 mt-3 max-w-xs leading-relaxed font-light">
                    Your bespoke luxury selection is currently unoccupied. Discover our hand-crafted, limited-edition heels, artisanal bags, and luxury accessories.
                  </p>
                  
                  {/* EXPLORE THE SHOP CALL-TO-ACTION BUTTON */}
                  <button
                    onClick={() => {
                      onCloseCart();
                      setTimeout(() => {
                        const el = document.getElementById("shop-by-style-section");
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth" });
                        }
                      }, 250);
                    }}
                    className="mt-8 relative overflow-hidden group flex items-center justify-center gap-2 px-6 py-3.5 w-full rounded-full border border-[#BA9A5D]/50 bg-gradient-to-r from-[#BA9A5D] to-[#DFCE9F] text-zinc-950 font-sans text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all hover:scale-[1.03] cursor-pointer"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Start Curating
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                    <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                  </button>
                </div>
              ) : (
                cartItems.map((item, index) => (
                  <motion.div
                    key={`${item.id}-${index}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex justify-between items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/10 transition-colors"
                  >
                    <div className="flex-1">
                      <span className="font-mono text-[8px] tracking-wider text-[#BA9A5D] uppercase block">
                        {item.category}
                      </span>
                      <h4 className="font-sans text-xs font-bold uppercase tracking-widest text-white leading-tight mt-1">
                        {item.name}
                      </h4>
                      <p className="font-sans-luxury text-[10px] text-zinc-400 mt-1 line-clamp-1">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 text-right">
                      <span className="font-sans text-xs font-black tracking-widest text-white">
                        {item.price}
                      </span>
                      <button
                        onClick={() => onRemoveFromCart(item.id)}
                        className="text-[10px] text-zinc-400 hover:text-red-400 transition-colors underline uppercase tracking-wider"
                      >
                        Remove
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Error notifications */}
            {errorMessage && (
              <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-200 rounded-xl text-xs flex gap-2 items-start mt-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                <p className="font-sans-luxury leading-relaxed">{errorMessage}</p>
              </div>
            )}

            {/* Sticky summary area */}
            {cartItems.length > 0 && (
              <div className="pt-6 border-t border-white/10 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400 font-sans-luxury uppercase tracking-wider">Curated Subtotal</span>
                  <span className="font-sans text-xs font-black tracking-widest text-[#DFCE9F]">
                    ${calculateTotal().toLocaleString()}
                  </span>
                </div>
                
                {/* Consignment Custom Fields */}
                {user && (
                  <div className="space-y-3 bg-black/45 rounded-2xl border border-white/5 p-4 mt-2">
                    <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                      <Sparkles className="h-3 w-3 text-[#BA9A5D]" />
                      <span className="font-sans text-[9px] font-black uppercase tracking-widest text-[#DFCE9F]">Concierge Fitting Details</span>
                    </div>
                    
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[8px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Your Full Name</label>
                        <input
                          type="text"
                          required
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="e.g. Lady Seraphina"
                          className="w-full bg-black/45 border border-[#BA9A5D]/30 focus:border-[#DFCE9F] text-xs px-3.5 py-1.5 rounded-xl text-white outline-none transition-all placeholder:text-zinc-700"
                        />
                      </div>

                      <div>
                        <label className="block text-[8px] font-bold uppercase tracking-widest text-zinc-400 mb-1">WhatsApp / Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="e.g. +233 24 567 8910"
                          className="w-full bg-black/45 border border-[#BA9A5D]/30 focus:border-[#DFCE9F] text-xs px-3.5 py-1.5 rounded-xl text-white outline-none transition-all placeholder:text-zinc-700"
                        />
                      </div>

                      <div>
                        <label className="block text-[8px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Delivery Address</label>
                        <input
                          type="text"
                          required
                          value={clientLocation}
                          onChange={(e) => setClientLocation(e.target.value)}
                          placeholder="e.g. Airport Residential Area Near Marriott, Accra"
                          className="w-full bg-black/45 border border-[#BA9A5D]/30 focus:border-[#DFCE9F] text-xs px-3.5 py-1.5 rounded-xl text-white outline-none transition-all placeholder:text-zinc-700"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {user ? (
                  <div className="rounded-xl bg-[#BA9A5D]/10 border border-[#BA9A5D]/20 p-3 flex gap-3 text-xs text-[#DFCE9F] font-sans-luxury">
                    <Sparkles className="h-4 w-4 shrink-0 text-[#BA9A5D] mt-0.5" />
                    <p className="leading-relaxed">
                      Logged in as <strong className="text-white">{user.email}</strong>. Ready to register this VIP allocation securely in Firestore.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl bg-orange-950/20 border border-orange-500/20 p-3 flex flex-col gap-2 text-xs text-orange-200 font-sans-luxury">
                    <div className="flex gap-2 items-center">
                      <Lock className="h-4 w-4 text-[#BA9A5D]" />
                      <strong className="text-white">Luxury Privilege Authentication Required</strong>
                    </div>
                    <p className="leading-relaxed text-[11px] text-zinc-300">
                      Sign in with Google to secure authentic verification, fittings tracking, and bespoke design configurations.
                    </p>
                    <button 
                      onClick={handleInlineLogin}
                      className="w-full flex items-center justify-center gap-2 py-2 mt-1 rounded-lg bg-[#BA9A5D] text-[#152D25] hover:bg-[#DFCE9F] transition-all font-bold text-[10px] uppercase tracking-wider cursor-pointer"
                    >
                      <LogIn className="h-3 w-3" /> Connect Google Account
                    </button>
                  </div>
                )}

                {user && (!clientName.trim() || !clientPhone.trim() || !clientLocation.trim()) && (
                  <p className="text-[9px] text-[#DFCE9F]/70 text-center uppercase tracking-widest font-mono animate-pulse">
                    ✦ Please complete form to unlock order submission
                  </p>
                )}

                <div className="flex gap-2.5">
                  <button
                    onClick={onClearCart}
                    disabled={isSubmitting}
                    className="flex-1 rounded-full border border-white/10 bg-transparent text-xs py-3 font-sans-luxury font-medium uppercase tracking-widest text-[#DFCE9F] hover:bg-white/5 transition-all text-center cursor-pointer disabled:opacity-50"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={handleCheckout}
                    disabled={isSubmitting || !user || !clientName.trim() || !clientPhone.trim() || !clientLocation.trim()}
                    className="flex-[2] rounded-full bg-[#BA9A5D] text-xs py-3 font-sans-luxury font-bold uppercase tracking-widest text-[#152D25] hover:bg-[#DFCE9F] transition-all text-center flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2 animate-pulse justify-center">
                        Contacting Concierge...
                      </span>
                    ) : (
                      <>
                        Send Order request <ArrowRight className="h-3 w-3" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {/* Custom Luxury Checkout Success Modal Popup */}
    <AnimatePresence>
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Ambient rich blur backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowSuccessModal(false);
              onClearCart();
              onCloseCart();
            }}
            className="absolute inset-0 bg-black/95 backdrop-blur-md"
          />

          {/* Luxury Dialog Box Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="relative w-full max-w-md border border-[#BA9A5D]/40 bg-[#152D25] p-8 rounded-3xl shadow-2xl text-center text-white overflow-hidden box-glow-gold"
          >
            {/* Fine luxury highlight */}
            <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-[#BA9A5D] to-transparent" />
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#BA9A5D]/5 rounded-full blur-3xl pointer-events-none" />

            {/* Glowing Brand Icon Badge */}
            <div className="relative mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-black/20 border border-[#BA9A5D]/20 mb-6">
              <span className="absolute inset-0 rounded-full border border-[#BA9A5D]/40 animate-ping opacity-25" />
              <div className="relative flex items-center justify-center h-14 w-14 rounded-full bg-linear-to-b from-[#DFCE9F]/20 to-[#BA9A5D]/20 border border-[#BA9A5D]/30 shadow-[0_0_15px_rgba(186,154,93,0.3)]">
                <Sparkles className="h-6 w-6 text-[#DFCE9F]" />
              </div>
            </div>

            {/* Typography Header */}
            <span className="font-sans-luxury text-[10px] tracking-[0.25em] text-[#BA9A5D] uppercase block">
              Bespoke Request Received
            </span>
            <h4 className="font-sans text-sm font-black uppercase tracking-widest text-white leading-tight mt-3">
              Selections Saved
            </h4>

            {/* Structured details aligned beautifully */}
            <div className="my-6 border-y border-white/5 py-4 space-y-2 font-sans-luxury text-zinc-300">
              <p className="text-zinc-400 text-[10px] uppercase tracking-wider">Your curated checklist is locked:</p>
              <div className="flex justify-between text-xs px-4">
                <span className="font-medium text-zinc-400">Total Selections:</span>
                <span className="font-sans font-bold text-xs uppercase tracking-wider text-[#DFCE9F]">{successDetails.count} Bespoke Pieces</span>
              </div>
              <div className="flex justify-between text-xs px-4">
                <span className="font-medium text-zinc-400">Estimated Valuation:</span>
                <span className="font-sans font-bold text-xs uppercase tracking-wider text-white">${successDetails.total.toLocaleString()}</span>
              </div>
            </div>            {/* Informative concierge advice in custom typography */}
            <p className="font-sans-luxury text-xs text-zinc-300 leading-relaxed max-w-xs mx-auto">
              Thank you for choosing <strong className="text-white">BLISS ELLE</strong>. Your private concierge stylist has received your order request and will contact you within 24 hours to coordinate customized fittings and bespoke sizing adjustments.
            </p>

            <div className="mt-5 p-3 rounded-xl bg-black/40 border border-white/5">
              <p className="font-mono text-[9px] text-[#BA9A5D] uppercase tracking-widest leading-relaxed">
                Complimentary express shipping secured
              </p>
            </div>

            {/* Custom Sizing Alteration Further Requests Segment */}
            <div className="mt-6 pt-5 border-t border-white/5 space-y-3">
              <span className="font-sans-luxury text-[9px] tracking-widest text-[#BA9A5D] uppercase block">
                Have further queries or custom designs?
              </span>
              <p className="font-sans-luxury text-[10px] text-zinc-400 leading-normal max-w-xs mx-auto">
                Reach out directly to the Bliss Admin to coordinate custom measurements, alterations, and express fittings.
              </p>
                            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <a
                  href={`https://wa.me/233543750366?text=${encodeURIComponent(
                    `Hello Bliss Elle, I've just placed an order with the following details:\n` +
                    `- Client: ${successDetails.clientName}\n` +
                    `- Phone: ${successDetails.clientPhone}\n` +
                    `- Location: ${successDetails.clientLocation}\n\n` +
                    `Curated Selections:\n` +
                    (successDetails.items?.map(it => `✦ ${it.name} (${it.price})`).join('\n') || '') +
                    `\n\nI would like to make further requests regarding customized fittings and bespoke design adjustments.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-[#BA9A5D] bg-[#BA9A5D]/15 text-[#DFCE9F] hover:bg-[#BA9A5D] hover:text-zinc-950 transition-all font-bold text-[9px] uppercase tracking-widest text-center duration-300"
                >
                  WhatsApp Admin
                </a>
                
                <a
                  href={`mailto:jannahblisselle@gmail.com,abubakarsadikmusah2004@gmail.com?subject=Bespoke Fitting Sizing Request: ${encodeURIComponent(successDetails.clientName)}&body=${encodeURIComponent(
                    `Hello Bliss Elle,\n\nI have just placed an order with the following details:\n\n` +
                    `- Client Name: ${successDetails.clientName}\n` +
                    `- WhatsApp Phone: ${successDetails.clientPhone}\n` +
                    `- Delivery / Sizing Location: ${successDetails.clientLocation}\n\n` +
                    `Selections Checklist:\n` +
                    (successDetails.items?.map(it => `✦ ${it.name} (${it.price})`).join('\n') || '') +
                    `\n\nI'd like to clarify sizing details, customized details, and fitting options.\n\nThank you!`
                  )}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all font-bold text-[9px] uppercase tracking-widest text-center duration-300"
                >
                  Email Admin
                </a>
              </div>
            </div>

            {/* CTA action tailored beautifully */}
            <button
              onClick={() => {
                setShowSuccessModal(false);
                onClearCart();
                onCloseCart();
              }}
              className="relative group overflow-hidden w-full rounded-full bg-gradient-to-r from-[#BA9A5D] to-[#DFCE9F] text-zinc-950 font-sans-luxury font-bold text-xs uppercase tracking-widest py-4 mt-8 transition-all hover:scale-[1.02] shadow-[0_12px_32px_rgba(186,154,93,0.15)] cursor-pointer"
            >
              <span className="relative z-10">Acknowledge</span>
              <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/40 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}

interface WishlistDrawerProps {
  isWishlistOpen: boolean;
  onCloseWishlist: () => void;
  wishlist: string[];
  onToggleWishlist: (id: string) => void;
  onAddToBag: (item: Hotspot) => void;
  onClearWishlist?: () => void;
  hotspots?: Hotspot[];
}

export function WishlistDrawer({
  isWishlistOpen,
  onCloseWishlist,
  wishlist,
  onToggleWishlist,
  onAddToBag,
  onClearWishlist,
  hotspots = []
}: WishlistDrawerProps) {
  // Convert dynamic hotspots to StyleProduct structures so wishlist filter can evaluate them
  const mappedHotspots: StyleProduct[] = hotspots.map(h => {
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
      sizes: h.sizes || [],
      inStock: true
    };
  });

  const allProductsCombined = [...STYLE_PRODUCTS];
  mappedHotspots.forEach(mh => {
    if (!allProductsCombined.some(p => p.id === mh.id)) {
      allProductsCombined.push(mh);
    }
  });

  const savedProducts = allProductsCombined.filter(p => wishlist.includes(p.id));

  const handleAddProductToCart = (product: StyleProduct) => {
    const item: Hotspot = {
      id: `${product.id}-default`,
      name: product.name,
      category: product.category,
      tag: "Signature Piece",
      price: `$${product.price}`,
      description: product.description,
      imageUrl: product.images[0],
      x: "50%",
      y: "50%"
    };
    onAddToBag(item);
  };

  return (
    <>
      <AnimatePresence>
      {isWishlistOpen && (
        <>
          {/* Black backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseWishlist}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            id="wishlist-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md border-l border-white/10 bg-[#0c1c17]/95 backdrop-blur-2xl p-6 sm:p-8 flex flex-col shadow-2xl text-white"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500 fill-red-500 animate-pulse" />
                <h3 className="font-sans text-xs font-black tracking-widest uppercase text-white text-glow-gold">Saved Favorites</h3>
              </div>
              <button
                id="close-wishlist-btn"
                onClick={onCloseWishlist}
                className="p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close wishlist"
              >
                <X className="h-5 w-5 text-zinc-400 hover:text-white" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto py-6 pr-1">
              {savedProducts.length === 0 ? (
                <div className="h-[70vh] flex flex-col justify-center items-center text-center p-6">
                  <div className="relative mb-6">
                    <div className="absolute -inset-2 rounded-full bg-[#BA9A5D]/10 blur-md" />
                    <div className="relative h-18 w-18 rounded-full bg-linear-to-b from-white/[0.04] to-transparent border border-white/10 flex items-center justify-center text-red-500">
                      <Heart className="h-8 w-8 stroke-[1.2]" />
                    </div>
                  </div>
                  <h4 className="font-sans text-sm font-black tracking-[0.2em] text-[#DFCE9F] uppercase">YOUR WISHLIST IS UNSELECTED</h4>
                  <p className="font-sans text-[11px] text-zinc-400 mt-3 max-w-xs leading-relaxed font-light">
                    Your luxury portfolio is empty. Save your favorite hand-crafted gold-clasp bags, structured stilettos, and bespoke slide slippers to view them here.
                  </p>
                  
                  {/* EXPLORE THE SHOP */}
                  <button
                    onClick={() => {
                      onCloseWishlist();
                      setTimeout(() => {
                        const el = document.getElementById("shop-by-style-section");
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth" });
                        }
                      }, 250);
                    }}
                    className="mt-8 relative overflow-hidden group flex items-center justify-center gap-2 px-6 py-3 w-full rounded-full border border-red-500/30 bg-gradient-to-r from-[#BA9A5D] to-[#DFCE9F] text-zinc-950 font-sans text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all hover:scale-[1.03] cursor-pointer"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Start Favoriting
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </button>
                </div>
              ) : (
                <div id="wishlist-grid-view" className="grid grid-cols-1 min-[340px]:grid-cols-2 gap-4 justify-items-center justify-center items-stretch w-full">
                  {savedProducts.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative flex flex-col justify-between items-center text-center p-4 rounded-xl border border-white/5 bg-white/[0.02]/80 hover:border-[#BA9A5D]/40 hover:bg-white/[0.04] transition-all duration-300 w-full max-w-[280px] min-[340px]:max-w-none mx-auto h-full"
                    >
                      {/* Centered Product Wallpaper Image */}
                      <div className="relative h-28 w-24 rounded-lg overflow-hidden border border-white/10 bg-black shrink-0 mx-auto group">
                        <img src={item.images[0]} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      </div>

                      {/* Info Panel perfectly centered */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center items-center mt-3 mb-4 w-full">
                        <span className="font-mono text-[8px] tracking-wider text-[#BA9A5D] uppercase block">
                          {item.category}
                        </span>
                        <h4 className="font-sans text-[11px] font-bold uppercase tracking-widest text-[#DFCE9F] leading-tight mt-1 truncate w-full px-1 text-center">
                          {item.name}
                        </h4>
                        <p className="font-sans text-[10px] text-white font-bold mt-1">
                          GHS {item.price}
                        </p>
                      </div>

                      {/* Big thumb-friendly buttons targeting touch accessibility heights */}
                      <div className="w-full flex flex-col gap-2 shrink-0 items-center justify-end mt-auto">
                        <button
                          onClick={() => handleAddProductToCart(item)}
                          className="w-full min-h-[44px] px-3 py-2 rounded-full bg-[#BA9A5D] hover:bg-[#DFCE9F] text-zinc-950 text-[9px] uppercase font-black tracking-widest transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(186,154,93,0.2)]"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" /> ADD TO BAG
                        </button>
                        <button
                          onClick={() => onToggleWishlist(item.id)}
                          className="text-[9px] text-zinc-400 hover:text-red-400 font-mono uppercase tracking-[0.15em] transition-all py-1.5 focus:outline-none hover:bg-white/5 w-full rounded-full cursor-pointer flex items-center justify-center"
                        >
                          ✦ REMOVE
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {savedProducts.length > 0 && (
              <div className="pt-6 border-t border-white/10 space-y-4">
                <button
                  onClick={() => {
                    savedProducts.forEach(item => {
                      const hotspotItem: Hotspot = {
                        id: `${item.id}-default`,
                        name: item.name,
                        category: item.category,
                        tag: "Signature Piece",
                        price: `$${item.price}`,
                        description: item.description,
                        imageUrl: item.images[0],
                        x: "50%",
                        y: "50%"
                      };
                      onAddToBag(hotspotItem);
                    });
                    if (onClearWishlist) {
                      onClearWishlist();
                    }
                    onCloseWishlist();
                  }}
                  className="w-full rounded-full bg-linear-to-r from-[#BA9A5D] to-[#DFCE9F] text-xs py-3.5 font-sans font-black uppercase tracking-widest text-[#152D25] hover:scale-[1.02] transition-transform text-center flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <ShoppingBag className="h-3.5 w-3.5 animate-bounce" /> Secure All in Cart
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}

// LOOKBOOK VISUALS FOR INTERACTION DISPLAY
const CAMPAIGN_PHOTOS = [
  {
    title: "Sovereign Stilettos",
    caption: "Our custom 110mm Aurelia satin heels handcrafted with architectural gold contours and custom bespoke arch support.",
    image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=600&h=750"
  },
  {
    title: "Maison Silk Slippers",
    caption: "The ultimate expression of high-society leisure: premium slipper mules lined in mulberry silk and golden metallic bullion embroidery.",
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=600&h=750"
  },
  {
    title: "Signature Gold-Clasp Bag",
    caption: "Sculpted calfskin masterpiece boasting our signature gold-plated hardware and classic fluid drop-chain configurations.",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600&h=750"
  }
];

export function LookbookDrawer({
  isLookbookOpen,
  onCloseLookbook,
  currentCollection,
  onAddToBag,
  hotspots = [],
  isAdminUser = false,
  onDeleteProduct
}: Omit<InteractivePanelsProps, 'isCartOpen' | 'onCloseCart' | 'cartItems' | 'onRemoveFromCart' | 'onClearCart'> & {
  onAddToBag?: (item: Hotspot) => void;
  hotspots?: Hotspot[];
  isAdminUser?: boolean;
  onDeleteProduct?: (id: string) => void;
}) {
  const [successAddId, setSuccessAddId] = useState<string | null>(null);

  const [newsEmail, setNewsEmail] = useState("");
  const [submittingNews, setSubmittingNews] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");

  const downloadBespokeCard = (item: Hotspot) => {
    const displayImageUrl = item.imageUrl || (
      item.category === "Dresses" 
        ? "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600"
        : item.category === "Heels"
        ? "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=600"
        : item.category === "Slippers"
        ? "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&q=80&w=600"
        : item.category === "Bags"
        ? "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600"
        : "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&q=80&w=600"
    );
    const formattedPrice = item.price.startsWith('GHS') || item.price.startsWith('$') 
      ? item.price 
      : `GHS ${item.price}`;

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bliss Elle Bespoke | ${item.name} Bespoke Certificate</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;800&display=swap" rel="stylesheet">
  <style>
    body {
      background: #030705;
      font-family: 'Montserrat', sans-serif;
      color: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .card {
      border: 2px solid #BA9A5D;
      background: linear-gradient(145deg, #08120e, #030705);
      border-radius: 20px;
      padding: 40px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 20px 50px rgba(0,0,0,0.9), 0 0 40px rgba(186,154,93,0.2);
      position: relative;
      text-align: center;
    }
    .card::before {
      content: '';
      position: absolute;
      top: 6px; left: 6px; right: 6px; bottom: 6px;
      border: 1px dashed rgba(186,154,93,0.35);
      border-radius: 14px;
      pointer-events: none;
    }
    .badge {
      display: inline-block;
      font-size: 9px;
      letter-spacing: 4px;
      color: #BA9A5D;
      text-transform: uppercase;
      font-weight: 600;
      border: 1px solid rgba(186,154,93,0.4);
      padding: 5px 14px;
      border-radius: 30px;
      margin-bottom: 25px;
      background: rgba(186,154,93,0.06);
    }
    .title {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 2px;
      margin: 10px 0;
      text-transform: uppercase;
      color: #fff;
    }
    .price {
      font-size: 16px;
      color: #DFCE9F;
      font-weight: 600;
      margin-bottom: 20px;
      letter-spacing: 1px;
    }
    .desc {
      font-size: 11px;
      color: #a1a1aa;
      line-height: 1.6;
      margin-bottom: 30px;
      font-weight: 300;
    }
    .image-container {
      width: 100%;
      height: 240px;
      overflow: hidden;
      border-radius: 12px;
      margin-bottom: 20px;
      border: 1px solid rgba(186,154,93,0.2);
    }
    .image-preview {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .footer-stamp {
      border-top: 1px solid rgba(255,255,255,0.08);
      padding-top: 25px;
      font-size: 8px;
      color: #71717a;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .stamp-word {
      color: #BA9A5D;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">BESPOKE SPECIFICATION</div>
    <div class="image-container">
      <img src="${displayImageUrl}" class="image-preview" alt="Luxury Piece" referrerpolicy="no-referrer">
    </div>
    <div class="title">${item.name}</div>
    <div class="price">${formattedPrice}</div>
    <div class="desc">${item.description || 'Exclusive luxury apparel item curated at the Jannah Bliss Elle Maison.'}</div>
    <div class="footer-stamp">
      © 2026 <span class="stamp-word">JANNAH BLISS ELLE</span> LUXURY
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bliss_elle_${item.name.toLowerCase().replace(/\s+/g, '_')}_card.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Sort hotspots in real-time (newest uploaded designs represent first in list)
  const sortedItems = React.useMemo(() => {
    return [...hotspots].sort((a, b) => {
      const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
      const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [hotspots]);

  const handleSubscribe = async () => {
    if (!newsEmail || !newsEmail.includes("@") || newsEmail.length < 5) {
      setErrMsg("Please define a valid email address.");
      return;
    }
    setSubmittingNews(true);
    setErrMsg("");
    setSuccessMsg("");
    try {
      const docId = newsEmail.toLowerCase().trim().replace(/[^a-zA-Z0-9_\-]+/g, "_");
      const subDoc = {
        email: newsEmail.toLowerCase().trim(),
        createdAt: new Date()
      };
      
      const docRef = doc(db, 'newsletter', docId);
      await setDoc(docRef, subDoc);
      setSuccessMsg("Success! You've secured exclusive access privileges.");
      setNewsEmail("");
    } catch(err) {
      console.error("Newsletter Subscription failure:", err);
      setErrMsg("Could not register address. Ensure proper characters.");
    } finally {
      setSubmittingNews(false);
    }
  };

  return (
    <AnimatePresence>
      {isLookbookOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseLookbook}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            id="lookbook-panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 180 }}
            className="fixed inset-x-0 bottom-0 z-50 h-[85vh] border-t border-white/10 bg-[#0d1e18]/95 backdrop-blur-2xl px-6 sm:px-12 py-8 flex flex-col shadow-2xl text-white rounded-t-3xl font-sans"
          >
            {/* Upper control headers */}
            <div className="flex justify-between items-center pb-5 border-b border-white/10 shrink-0">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#BA9A5D]">Seasonal Edit</span>
                <h3 className="font-sans text-xl sm:text-2xl font-black tracking-widest uppercase text-white mt-0.5 text-glow-gold">
                  BLISS ELLE LOOKBOOK 2026
                </h3>
              </div>
              <button
                id="close-lookbook-btn"
                onClick={onCloseLookbook}
                className="p-1 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close lookbook"
              >
                <X className="h-5 w-5 text-zinc-400 hover:text-white" />
              </button>
            </div>

            {/* Campaign Slider gallery */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden py-8 flex gap-6 sm:gap-8 items-stretch snap-x">
              
              {/* Introduction Card */}
              <div className="w-[280px] sm:w-[350px] shrink-0 rounded-2xl bg-white/[0.02] border border-white/10 p-6 flex flex-col justify-between snap-start">
                <div className="space-y-4">
                  <div className="h-9 w-9 bg-white/[0.04] border border-[#BA9A5D]/40 rounded-xl flex items-center justify-center">
                    <BookOpen className="h-4.5 w-4.5 text-[#BA9A5D]" />
                  </div>
                  
                  <h4 className="font-sans text-lg font-extrabold leading-tight text-white uppercase tracking-wider text-glow-gold">
                    The Modern Symphony of Confidence
                  </h4>
                  
                  <p className="font-sans text-xs text-zinc-400 leading-relaxed font-light">
                    Designed for women who assert sovereignty in fine spaces. Our signature heels, slippers, and premium handbags are handcrafted by master artisans using ethically sourced Italian leathers, silk-satins, and custom contours.
                  </p>
                </div>

                <div className="border-t border-white/5 pt-4 space-y-1.5 font-mono text-[10px] text-zinc-500">
                  <div className="flex justify-between">
                    <span>Active Collection:</span>
                    <span className="text-[#BA9A5D] font-bold">{currentCollection.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Art Direction:</span>
                    <span className="text-zinc-300">Bliss Elle Studio</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Release:</span>
                    <span className="text-zinc-300">Autumn / Winter Bespoke</span>
                  </div>
                </div>
              </div>

              {/* Photo cards with high design quality (Real-time, synchronized with Firestore) */}
              {sortedItems.length > 0 ? (
                sortedItems.map((item) => {
                  const displayImageUrl = item.imageUrl || (
                    item.category === "Dresses" 
                      ? "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600"
                      : item.category === "Heels"
                      ? "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=600"
                      : item.category === "Slippers"
                      ? "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&q=80&w=600"
                      : item.category === "Bags"
                      ? "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600"
                      : "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&q=80&w=600"
                  );
                  const formattedPrice = item.price.startsWith('GHS') || item.price.startsWith('$') 
                    ? item.price 
                    : `GHS ${item.price}`;
                  const isAdded = successAddId === item.id;

                  const handleAddLookbookBag = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (!item.inStock) return;
                    if (onAddToBag) {
                      onAddToBag(item);
                      setSuccessAddId(item.id);
                      setTimeout(() => setSuccessAddId(null), 1500);
                    }
                  };

                  return (
                    <div
                      key={item.id}
                      className="w-[260px] sm:w-[320px] shrink-0 rounded-2xl overflow-hidden border border-white/10 bg-black/40 flex flex-col justify-between snap-start group relative transition-all hover:border-[#BA9A5D]/40"
                    >
                      {/* Product Visual Frame */}
                      <div className="relative h-64 sm:h-72 w-full overflow-hidden shrink-0">
                        <img
                          src={displayImageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

                        {/* Inventory Toggles & Badges */}
                        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                          <span className="font-mono text-[8.5px] text-[#BA9A5D] uppercase tracking-wider bg-black/85 border border-[#BA9A5D]/20 px-2.5 py-0.5 rounded-full font-bold shadow-md">
                            {item.category}
                          </span>
                        </div>

                        {item.featured && (
                          <div className="absolute top-3 right-3">
                            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-[#BA9A5D] text-zinc-950 font-black text-[10px] shadow-md border border-zinc-950/20" title="Featured Look">
                              👑
                            </span>
                          </div>
                        )}

                        {item.inStock === false && (
                          <div className="absolute inset-0 bg-black/75 flex items-center justify-center p-4">
                            <span className="text-[9px] tracking-widest uppercase font-black px-3 py-1.5 bg-red-950/80 text-red-400 rounded-full border border-red-500/20">
                              Fully Allocated
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="p-4 flex-1 flex flex-col justify-between bg-zinc-950/60 backdrop-blur-md">
                        <div className="space-y-1">
                          <div className="flex justify-between items-start gap-2">
                            <h5 className="font-sans text-xs font-bold text-white tracking-widest uppercase line-clamp-1">
                              {item.name}
                            </h5>
                            <span className="font-mono text-[9px] text-[#DFCE9F] font-bold shrink-0">{formattedPrice}</span>
                          </div>
                          
                          {item.tag && (
                            <p className="font-mono text-[8px] text-[#BA9A5D] uppercase tracking-widest font-semibold">{item.tag}</p>
                          )}
                          <p className="font-sans text-[11px] text-zinc-400 leading-relaxed font-light line-clamp-2">
                            {item.description}
                          </p>
                        </div>

                        {/* Interactive allocation pathways */}
                        <div className="mt-4 pt-3 border-t border-white/5 shrink-0 flex flex-col gap-2">
                          <div className="flex gap-2">
                            <div className="flex-1">
                              {item.inStock === false ? (
                                <button
                                  disabled
                                  className="w-full bg-white/5 border border-white/5 text-zinc-500 text-[9px] font-bold uppercase tracking-widest py-2 rounded-full cursor-not-allowed text-center"
                                >
                                  Waitlist Active
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={handleAddLookbookBag}
                                  className={`w-full text-[9px] font-bold uppercase tracking-widest py-2 rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    isAdded 
                                      ? 'bg-emerald-500 text-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                                      : 'bg-[#BA9A5D] text-zinc-950 hover:bg-[#DFCE9F]'
                                  }`}
                                >
                                  {isAdded ? (
                                    <>
                                      <Check className="h-3 w-3 text-zinc-950" /> Secured in Bag
                                    </>
                                  ) : (
                                    <>
                                      <ShoppingBag className="h-3 w-3 text-zinc-950" /> Secure Allocation
                                    </>
                                  )}
                                </button>
                              )}
                            </div>

                            {isAdminUser && onDeleteProduct && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Permanently remove "${item.name}" from lookup/lookbook?`)) {
                                    onDeleteProduct(item.id);
                                  }
                                }}
                                className="px-3.5 rounded-full border border-red-500/35 bg-red-950/20 hover:bg-red-950/50 hover:border-red-500 text-red-400 transition-all cursor-pointer flex items-center justify-center shadow-md shrink-0"
                                title="Clear product from Lookbook"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => downloadBespokeCard(item)}
                            className="w-full text-[9px] font-bold uppercase tracking-widest py-2/5 rounded-full border border-[#BA9A5D]/30 bg-black/40 text-[#DFCE9F] hover:bg-[#BA9A5D]/10 hover:border-[#DFCE9F] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            title="Download Digital Spec Certificate"
                          >
                            <Download className="h-3 w-3 text-[#BA9A5D]" /> Download spec card
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })
              ) : (
                CAMPAIGN_PHOTOS.map((photo, index) => (
                  <div
                    key={index}
                    className="w-[260px] sm:w-[320px] shrink-0 rounded-2xl overflow-hidden border border-white/10 bg-black/40 flex flex-col snap-start group"
                  >
                    <div className="relative flex-1 overflow-hidden">
                      <img
                        src={photo.image}
                        alt={photo.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    </div>

                    <div className="p-5 shrink-0 space-y-1 bg-zinc-950/60 backdrop-blur-md">
                      <h5 className="font-sans text-xs font-bold uppercase tracking-widest text-white">
                        {photo.title}
                      </h5>
                      <p className="font-sans text-[11px] text-zinc-400 leading-relaxed font-light">
                        {photo.caption}
                      </p>
                    </div>
                  </div>
                ))
              )}

              {/* Behind the Scenes details block */}
              <div className="w-[280px] sm:w-[320px] shrink-0 rounded-2xl bg-linear-to-b from-white/[0.01] to-[#BA9A5D]/5 border border-white/10 p-6 flex flex-col justify-center text-center snap-start">
                <Clock className="mx-auto h-7 w-7 text-[#BA9A5D] mb-4" />
                <h4 className="font-sans text-xs font-black uppercase tracking-widest text-[#BA9A5D]">Next-Gen Runway Drop</h4>
                <p className="font-sans text-xs text-zinc-400 mt-2 leading-relaxed font-light">
                  The upcoming Spring-Summer editorial preview will release in Paris. Sign up to receive a physical printed luxury portfolio catalog.
                </p>
                <div className="mt-5 space-y-2 text-left">
                  <input
                    type="email"
                    value={newsEmail}
                    onChange={(e) => setNewsEmail(e.target.value)}
                    placeholder="Enter your email..."
                    className="w-full bg-[#152D25] border border-white/10 text-xs px-4 py-2.5 rounded-full text-center focus:outline-none focus:border-[#BA9A5D] text-white"
                  />
                  <button 
                    onClick={handleSubscribe}
                    disabled={submittingNews}
                    className="w-full bg-[#BA9A5D] text-[#152D25] text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-full transition-all hover:bg-[#DFCE9F] cursor-pointer disabled:opacity-50"
                  >
                    {submittingNews ? "Securing slot..." : "Request Guestlist Invite"}
                  </button>

                  {successMsg && (
                    <p className="font-sans text-[11px] text-emerald-400 animate-pulse mt-2 text-center">{successMsg}</p>
                  )}
                  {errMsg && (
                    <p className="font-sans text-[11px] text-red-400 mt-2 text-center">{errMsg}</p>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
