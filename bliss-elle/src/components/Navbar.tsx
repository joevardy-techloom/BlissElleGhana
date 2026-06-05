import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Menu, X, Check, ArrowRight, User as UserIcon, LogIn, LogOut, Sliders, Heart, Search } from 'lucide-react';

interface NavbarProps {
  activeSection: string;
  setActiveSection: (sec: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  onShopNow: () => void;
  user: any;
  isAdminUser: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onOpenAdmin: () => void;
  onOpenClientPortal: () => void;
  wishlistCount: number;
  onOpenWishlist: () => void;
  onOpenSearch: () => void;
}

const NAV_LINKS = ['Home', 'Collections', 'Lookbook', 'About'];

export default function Navbar({
  activeSection,
  setActiveSection,
  cartCount,
  onOpenCart,
  onShopNow,
  user,
  isAdminUser,
  onLogin,
  onLogout,
  onOpenAdmin,
  onOpenClientPortal,
  wishlistCount,
  onOpenWishlist,
  onOpenSearch
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isHeartbeating, setIsHeartbeating] = useState(false);

  useEffect(() => {
    if (cartCount > 0) {
      setIsHeartbeating(true);
      const timer = setTimeout(() => setIsHeartbeating(false), 800);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  return (
    <nav className="relative z-50 w-full" id="bliss-navbar">
      {/* Floating Pill Navbar on Desktop / Minimal on Mobile */}
      <div className="mx-auto flex max-w-[1720px] items-center justify-between px-4 py-5 md:px-6">
        
        {/* Bliss Elle Brand Logo Custom Uploaded Image inside an elegant light ivory plaque */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex items-center cursor-pointer shrink-0 group relative py-2"
          onClick={() => setActiveSection('Home')}
          id="bliss-logo-wrapper"
        >
          {/* Subtle luxurious gold background pulse beneath the custom logo */}
          <div className="absolute inset-x-0 inset-y-1 bg-[#BA9A5D]/15 blur-2xl rounded-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Exquisite solid white ivory plaque to highlight the elegant gold calligraphy and tagline */}
          <div className="relative flex items-center justify-center bg-white hover:bg-zinc-50 px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-2xl border border-[#BA9A5D]/30 shadow-[0_16px_48px_rgba(0,0,0,0.35),0_2px_8px_rgba(186,154,93,0.25)] transition-all duration-300 group-hover:scale-[1.04] group-hover:border-[#BA9A5D]/50">
            <img 
              src="https://res.cloudinary.com/dslngzls6/image/upload/v1780082537/Screenshot_2026-05-29_180017_zdemqz.png" 
              alt="BLISS ELLE — Chic. Confident. You." 
              referrerPolicy="no-referrer"
              className="h-10 w-10 sm:h-14 sm:w-14 md:h-16 md:w-16 lg:h-18 lg:w-18 xl:h-20 xl:w-20 2xl:h-24 2xl:w-24 object-contain relative z-10 mix-blend-multiply"
            />
          </div>
        </motion.div>

        {/* Desktop Navigation Links */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="hidden lg:flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 backdrop-blur-md"
        >
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link;
            return (
              <button
                key={link}
                id={`nav-link-${link.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setActiveSection(link)}
                className={`relative px-4 py-2 font-sans-luxury text-xs font-medium uppercase tracking-[0.16em] transition-colors duration-300 ${
                  isActive ? 'text-[#BA9A5D]' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span className="relative z-10">{link}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeNavBackground"
                    className="absolute inset-0 rounded-full bg-white/[0.04]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </motion.div>

        {/* Right Corner: Bag Icon, Workspace, and Auth Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Minimalist Search Button */}
          <button
            id="search-overlay-trigger"
            onClick={onOpenSearch}
            className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-white/5 bg-white/[0.02] text-white transition-all hover:bg-white/[0.07] hover:border-white/20 cursor-pointer"
            aria-label="Search items"
          >
            <Search className="h-4 sm:h-5 w-4 sm:w-5 transition-transform group-hover:scale-110 text-white" />
          </button>

          {/* Shopping Bag Button with animate indicators */}
          <button
            id="shopping-bag-trigger"
            onClick={onOpenCart}
            className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-white/5 bg-white/[0.02] text-white transition-all hover:bg-white/[0.07] hover:border-white/20"
            aria-label="View Shopping bag"
          >
            <ShoppingBag className="h-4 sm:h-5 w-4 sm:w-5 transition-transform group-hover:scale-110 text-white" />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -right-1 -top-1 flex h-4 sm:h-5 w-4 sm:w-5 items-center justify-center rounded-full bg-[#BA9A5D] text-[10px] sm:text-xs font-bold text-[#152D25] ring-2 ring-[#152D25]"
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* User Auth Pill / Embedded Admin Operations Gate */}
          {(user || isAdminUser) ? (
            isAdminUser ? (
              /* Whitelisted Admin Account: Golden Halo Avatar Portal */
              <button
                id="admin-profile-portal"
                onClick={onOpenAdmin}
                className="relative group flex items-center justify-center h-10 w-10 rounded-full border-2 border-[#BA9A5D] bg-black/40 shadow-[0_0_15px_rgba(186,154,93,0.35)] transition-all duration-300 hover:scale-105 cursor-pointer"
                title="Operations Hub (Admin Authorized)"
              >
                {/* Active golden breathing pulse ring */}
                <span className="absolute inset-0 rounded-full border border-[#BA9A5D]/60 animate-ping opacity-25" />
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user?.displayName || "Admin Profile"} 
                    referrerPolicy="no-referrer" 
                    className="h-full w-full rounded-full object-cover" 
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-[#BA9A5D]/10">
                    <Sliders className="h-4 w-4 text-[#BA9A5D]" />
                  </div>
                )}
                {/* Miniature high-luxury editing badge */}
                <div className="absolute -bottom-1.5 -right-1.5 bg-[#BA9A5D] text-zinc-950 rounded-full p-0.5 border border-zinc-950 flex items-center justify-center shadow-md shadow-black/80">
                  <Sliders className="h-2 w-2 text-zinc-950 font-black" />
                </div>
              </button>
            ) : (
              /* Normal VIP Client Account: Portal Hub Trigger + Elegant Exit Option */
              <div className="flex items-center gap-2.5">
                {/* Client Personal Profile Portal Button */}
                <button
                  id="client-profile-portal"
                  onClick={onOpenClientPortal}
                  className="relative group flex items-center justify-center h-10 w-10 rounded-full border border-[#BA9A5D]/50 bg-black/40 hover:border-[#BA9A5D] hover:shadow-[0_0_12px_rgba(186,154,93,0.25)] transition-all duration-300 hover:scale-105 cursor-pointer"
                  title="My Profile & Fitting Portal (Logged In)"
                >
                  {user?.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user?.displayName || "Client Account"} 
                      referrerPolicy="no-referrer" 
                      className="h-full w-full rounded-full object-cover" 
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-[#BA9A5D]/10">
                      <UserIcon className="h-4 w-4 text-[#DFCE9F]" />
                    </div>
                  )}
                </button>

                {/* Direct Exit sign out button */}
                <button 
                  onClick={onLogout}
                  className="group relative flex h-10 w-10 sm:h-10 sm:w-auto sm:px-3 items-center justify-center gap-1.5 rounded-full bg-red-950/15 hover:bg-red-950/30 border border-red-500/10 hover:border-red-500/25 text-red-400 transition-all text-xs cursor-pointer"
                  title={`Sign out of ${user?.email || 'Bespoke Curator'}`}
                >
                  <LogOut className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline uppercase text-[8px] font-black font-sans tracking-widest">Exit</span>
                </button>
              </div>
            )
          ) : (
            /* Unauthenticated state */
            <button
              onClick={onLogin}
              className="group relative flex h-10 px-3.5 items-center gap-2 rounded-full bg-white text-zinc-950 hover:bg-[#BA9A5D] hover:text-zinc-950 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span className="hidden md:inline text-[9px] font-sans-luxury tracking-widest">Sign In</span>
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden absolute top-20 right-6 left-6 z-40 overflow-hidden rounded-2xl border border-white/10 bg-[#152D25]/95 backdrop-blur-xl p-6 shadow-2xl"
          >
            <div className="flex flex-col gap-4">
              {NAV_LINKS.map((link, idx) => {
                const isActive = activeSection === link;
                return (
                  <motion.button
                    key={link}
                    id={`mobile-nav-${link.toLowerCase()}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => {
                      setActiveSection(link);
                      setMobileMenuOpen(false);
                    }}
                    className={`text-left font-sans-luxury text-sm font-semibold uppercase tracking-[0.15em] py-2 border-b border-white/5 ${
                      isActive ? 'text-[#BA9A5D]' : 'text-zinc-300 hover:text-white'
                    }`}
                  >
                    {link}
                  </motion.button>
                );
              })}
              
              <button
                id="mobile-shop-now"
                onClick={() => {
                  onShopNow();
                  setMobileMenuOpen(false);
                }}
                className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#BA9A5D] py-3 text-xs font-semibold uppercase tracking-widest text-[#152D25]"
              >
                Shop Now <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
