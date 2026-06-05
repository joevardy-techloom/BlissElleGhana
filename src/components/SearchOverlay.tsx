import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, ShoppingBag, Heart, ArrowRight, Sparkles } from 'lucide-react';
import { StyleProduct } from './ShopByStyle';
import { Hotspot } from '../types';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  products: StyleProduct[];
  onAddToBag: (item: Hotspot) => void;
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  cartItems: Hotspot[];
}

const SEARCH_SUGGESTIONS = ['Heels', 'Handbags', 'Slippers', 'Gold', 'Emerald', 'Premium Leather'];

export default function SearchOverlay({
  isOpen,
  onClose,
  products = [],
  onAddToBag,
  wishlist = [],
  onToggleWishlist,
  cartItems = []
}: SearchOverlayProps) {
  const [queryText, setQueryText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    } else {
      setQueryText('');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filtered list
  const filteredProducts = products.filter(product => {
    if (!queryText.trim()) return false;
    const s = queryText.toLowerCase();
    return (
      product.name.toLowerCase().includes(s) ||
      (product.category || '').toLowerCase().includes(s) ||
      (product.description || '').toLowerCase().includes(s) ||
      (product.material || '').toLowerCase().includes(s) ||
      (product.styling || '').toLowerCase().includes(s) ||
      (product.badge || '').toLowerCase().includes(s)
    );
  });

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

  const handleProductLocate = (productId: string) => {
    onClose();
    setTimeout(() => {
      const el = document.getElementById(`product-card-${productId}`);
      const section = document.getElementById("shop-by-style-section");
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Pulse background highlight effect on the element
        el.classList.add('ring-4', 'ring-[#BA9A5D]', 'scale-[1.02]');
        setTimeout(() => {
          el.classList.remove('ring-4', 'ring-[#BA9A5D]', 'scale-[1.02]');
        }, 2200);
      } else if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }, 250);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="search-overlay-fullscreen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex flex-col bg-[#050f0c]/98 backdrop-blur-3xl text-white overflow-hidden"
        >
          {/* Header row */}
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-5 flex justify-between items-center bg-transparent shrink-0">
            <span className="font-sans text-[10px] tracking-[0.3em] font-black uppercase text-[#BA9A5D]">
              Maison Search Engine
            </span>
            <button
              id="close-search-overlay-btn"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/5 border border-white/5 hover:border-white/20 transition-all duration-300 flex items-center justify-center cursor-pointer group"
              aria-label="Close search overlay"
            >
              <X className="h-5 w-5 text-zinc-400 group-hover:text-white group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          {/* Search Bar Frame */}
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-8 pt-10 sm:pt-16 pb-6 shrink-0 flex flex-col items-center">
            <div className="relative w-full flex items-center justify-center">
              <Search className="absolute left-1 sm:left-4 h-6 sm:h-8 w-6 sm:w-8 text-[#BA9A5D]/60 animate-pulse pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="SEARCH BEAUTY & STYLE..."
                className="w-full bg-transparent pl-10 sm:pl-16 pr-4 text-center text-lg sm:text-2xl lg:text-3xl font-serif-luxury text-[#DFCE9F] placeholder-zinc-700 border-b border-white/10 py-5 focus:outline-none focus:border-[#BA9A5D] transition-all tracking-[0.15em] uppercase select-all font-light"
              />
            </div>

            {/* Quick search suggestions */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase mr-1">
                Hot Keys:
              </span>
              {SEARCH_SUGGESTIONS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQueryText(tag)}
                  className="px-3 py-1 rounded-full text-[9px] font-mono tracking-widest uppercase text-zinc-400 hover:text-[#DFCE9F] bg-white/[0.02] hover:bg-[#BA9A5D]/20 border border-white/5 hover:border-[#BA9A5D]/40 transition-all cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Search results workspace */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-12">
            <div className="w-full max-w-4xl mx-auto">
              {!queryText.trim() ? (
                <div className="h-[40vh] flex flex-col justify-center items-center text-center p-6">
                  <div className="relative mb-5 max-w-[200px]">
                    <div className="absolute -inset-2 rounded-full bg-[#BA9A5D]/10 blur-xl animate-pulse" />
                    <div className="relative h-14 w-14 rounded-full border border-white/10 bg-white/[0.01] flex items-center justify-center text-[#BA9A5D]">
                      <Search className="h-6 w-6 stroke-[1.2]" />
                    </div>
                  </div>
                  <h4 className="font-sans text-[11px] font-black tracking-[0.2em] text-[#DFCE9F] uppercase mb-1.5">
                    Showroom Search System
                  </h4>
                  <p className="font-sans text-[10px] text-zinc-500 max-w-sm leading-relaxed font-light">
                    Type the name, material description, or style category of our bespoke sandals, heels, or handbags to query the collection archive instantly.
                  </p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="h-[40vh] flex flex-col justify-center items-center text-center p-6">
                  <span className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest mb-3">
                    Search Outcome
                  </span>
                  <h4 className="font-sans text-xs font-black tracking-[0.15em] text-[#DFCE9F] uppercase mb-1.5">
                    no matches discovered inside registry
                  </h4>
                  <p className="font-sans text-[10px] text-zinc-500 max-w-xs leading-relaxed font-light">
                    We couldn't locate any bespoke entries for "{queryText}". Refine your request or try searching alternative terms.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#BA9A5D]">
                      Found {filteredProducts.length} Match{filteredProducts.length > 1 ? 'es' : ''} inside archive
                    </span>
                    <span className="text-[9px] text-zinc-500 font-mono">
                      Real-time Feed
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProducts.map((item) => {
                      const isLiked = wishlist.includes(item.id);
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-4 p-4 rounded-2xl border border-white/5 bg-white/[0.01] hover:border-[#BA9A5D]/30 hover:bg-white/[0.03] transition-all duration-300 group"
                        >
                          {/* Image */}
                          <div className="relative h-20 w-16 sm:h-24 sm:w-20 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10">
                            <img src={item.images[0]} alt={item.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-[8px] tracking-wider text-[#BA9A5D] uppercase">
                                  {item.category}
                                </span>
                                {item.badge && (
                                  <span className="text-[7px] font-mono tracking-widest uppercase border border-[#BA9A5D]/40 text-[#DFCE9F] px-1.5 py-0.5 rounded-sm bg-[#BA9A5D]/5">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-sans text-[11px] sm:text-xs font-black uppercase tracking-widest text-[#DFCE9F] truncate mt-1">
                                {item.name}
                              </h4>
                              <p className="font-sans text-[9px] text-zinc-400 font-light line-clamp-2 mt-1 leading-snug">
                                {item.description}
                              </p>
                            </div>

                            <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-white/5">
                              <span className="font-mono text-[10px] font-black text-white">
                                GHS {item.price}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {/* Toggle Wishlist Button */}
                                <button
                                  type="button"
                                  onClick={() => onToggleWishlist(item.id)}
                                  className="p-1 rounded-full bg-white/[0.03] hover:bg-white/10 text-[#DFCE9F] hover:text-red-400 transition-colors cursor-pointer border border-white/5"
                                  title={isLiked ? "Remove from wishlist" : "Add to wishlist"}
                                >
                                  <Heart className={`h-3 w-3 ${isLiked ? 'fill-red-500 text-red-500' : 'text-[#DFCE9F]'}`} />
                                </button>

                                {/* Direct Secure checkout */}
                                <button
                                  type="button"
                                  onClick={() => handleAddProductToCart(item)}
                                  className="px-2.5 py-1 rounded-full bg-[#BA9A5D] hover:bg-[#DFCE9F] text-zinc-950 font-sans text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <ShoppingBag className="h-2 w-2" /> Secure
                                </button>

                                {/* Locate style on exhibition screen */}
                                <button
                                  type="button"
                                  onClick={() => handleProductLocate(item.id)}
                                  className="px-2 py-1 rounded-full bg-white/[0.05] hover:bg-white/15 text-zinc-300 hover:text-white font-sans text-[8px] uppercase tracking-widest transition-all cursor-pointer flex items-center gap-0.5 border border-white/5"
                                >
                                  Exhibition <ArrowRight className="h-2 w-2" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
