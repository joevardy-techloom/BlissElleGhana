import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, User as UserIcon, Phone, MapPin, Sparkles, Check, 
  ShoppingBag, Calendar, ClipboardList, Clock, LogOut, MessageSquare, Package, Trash2
} from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, onSnapshot, deleteDoc } from 'firebase/firestore';

const getStatusBadge = (status: string) => {
  const norm = (status || '').toLowerCase();
  if (norm === 'delivered' || norm === 'completed') {
    return {
      label: 'Delivered',
      classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    };
  } else if (norm === 'packaged' || norm === 'shipped') {
    return {
      label: 'Packaged',
      classes: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
    };
  } else if (norm === 'recived' || norm === 'received' || norm === 'assigned') {
    return {
      label: 'Recived',
      classes: 'bg-sky-500/10 text-sky-400 border-sky-500/20'
    };
  } else if (norm === 'cancelled' || norm === 'failed') {
    return {
      label: 'Cancelled',
      classes: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    };
  } else {
    return {
      label: 'Submitted',
      classes: 'bg-[#BA9A5D]/10 text-[#DFCE9F] border-[#BA9A5D]/20 animate-pulse'
    };
  }
};

const getItemImage = (it: any, index: number) => {
  if (it.imageUrl) return it.imageUrl;
  const fallbacks = [
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=150&h=150',
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=150&h=150',
    'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&q=80&w=150&h=150',
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=150&h=150',
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=150&h=150'
  ];
  let hash = index;
  if (it.name) {
    let charSum = 0;
    for (let i = 0; i < it.name.length; i++) {
      charSum += it.name.charCodeAt(i);
    }
    hash = charSum % fallbacks.length;
  }
  return fallbacks[hash];
};

const formatDateLabel = (ts: any) => {
  if (!ts) return 'Just now';
  const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return date.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

interface ClientWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onLogout: () => void;
}

export default function ClientWorkspace({
  isOpen,
  onClose,
  user,
  onLogout
}: ClientWorkspaceProps) {
  // Client profile form states
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Real-time WhatsApp communication logs
  const [whatsappLogs, setWhatsappLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Fetch client details from Firestore on load/mount when user logs in
  useEffect(() => {
    if (!user) return;
    
    // Set initial default name if available from Google
    setUsername(user.displayName || '');

    // Instant pre-population fallback from localStorage cache
    const cached = localStorage.getItem(`profile_${user.uid}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.username) setUsername(parsed.username);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.location) setLocation(parsed.location);
      } catch (e) {
        console.warn("Local cache parsing failure:", e);
      }
    }
    
    const fetchProfile = async () => {
      try {
        const profileRef = doc(db, 'profiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          if (data.username) setUsername(data.username);
          if (data.phone) setPhone(data.phone);
          if (data.location) setLocation(data.location);
        } else {
          // Auto create initial blank profile record if not found
          await setDoc(profileRef, {
            email: user.email || '',
            username: user.displayName || '',
            phone: '',
            location: '',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      } catch (err) {
        console.warn("Client profile load failure:", err);
      }
    };

    fetchProfile();

    // Subscribe to client's real orders in real-time
    setIsLoadingLogs(true);
    const orderQuery = query(collection(db, 'orders'), where('userId', '==', user.uid));

    const unsubOrders = onSnapshot(orderQuery, (snapshot) => {
      const orderItems: any[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.isMembershipJoinRequest) return;
        
        orderItems.push({
          id: docSnap.id,
          userId: data.userId,
          message: data.message || `Booking order submitted and directed to WhatsApp chat.`,
          type: data.type || "Bespoke Order Sent",
          status: data.status || "pending",
          items: data.items || [],
          total: data.total || 0,
          createdAt: data.createdAt,
          source: 'orders'
        });
      });
      // Sort orders newest first
      orderItems.sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1005 : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      setWhatsappLogs(orderItems);
      setIsLoadingLogs(false);
    }, (err) => {
      console.error("Orders subscription error:", err);
      setIsLoadingLogs(false);
    });

    return () => {
      unsubOrders();
    };
  }, [user]);

  // Handle Profile saving persistently
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const profileRef = doc(db, 'profiles', user.uid);
      const isExisting = (await getDoc(profileRef)).exists();
      
      const payload = {
        username: username.trim(),
        phone: phone.trim(),
        location: location.trim(),
        updatedAt: new Date()
      };

      if (isExisting) {
        await updateDoc(profileRef, payload);
      } else {
        await setDoc(profileRef, {
          email: user.email || '',
          createdAt: new Date(),
          ...payload
        });
      }

      // Also set standard user details in localStorage to allow seamless pre-populating on checkout forms
      localStorage.setItem(`profile_${user.uid}`, JSON.stringify(payload));
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error("Save profile incident:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const formatTimestamp = (ts: any) => {
    if (!ts) return 'Just now';
    const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl border-l border-[#BA9A5D]/20 bg-[#152D25] shadow-2xl flex flex-col text-white font-sans overflow-hidden">
        
        {/* Header Ribbon */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-white/10 bg-black/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#BA9A5D]/10 border border-[#BA9A5D]/30 shadow-[0_0_12px_rgba(186,154,93,0.15)] overflow-hidden">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={username || "Profile"} 
                  referrerPolicy="no-referrer" 
                  className="h-full w-full object-cover" 
                />
              ) : (
                <UserIcon className="h-4.5 w-4.5 text-[#DFCE9F]" />
              )}
            </div>
            <div>
              <h2 className="font-sans text-sm font-black uppercase tracking-widest text-[#DFCE9F] leading-none">Your Dashboard</h2>
              <p className="text-[9px] text-[#BA9A5D]/60 font-mono tracking-wider mt-1 uppercase">Bliss Elle Ghana</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 border border-white/5 bg-white/[0.02] hover:bg-white/[0.08] hover:border-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 select-none">
          
          {/* Welcome Plaque */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-[#152D25]/45 via-black/35 to-transparent border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-40 w-40 bg-[#BA9A5D]/5 rounded-full blur-2xl" />
            <div className="relative z-10 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
              <div>
                <span className="font-mono text-[8px] tracking-[0.25em] text-[#BA9A5D] uppercase block mb-1">Authenticated Account</span>
                <h3 className="font-sans text-sm font-black uppercase text-white tracking-widest">{username || user?.displayName || 'VIP Client'}</h3>
                <p className="font-mono text-[10px] text-zinc-400 mt-1">{user?.email}</p>
              </div>
              <div className="flex gap-2.5 shrink-0 w-full sm:w-auto">
                <button
                  onClick={onLogout}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-300 hover:text-red-200 transition-all text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="h-3 w-3" />
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Sparkles className="h-3.5 w-3.5 text-[#BA9A5D]" />
              <h4 className="font-sans text-xs font-black uppercase tracking-widest text-[#DFCE9F]">Profile Information & Order History</h4>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-[8px] font-bold uppercase tracking-widest text-[#DFCE9F] mb-1.5 flex items-center gap-1.5">
                    <UserIcon className="h-2.5 w-2.5 text-[#BA9A5D]" /> Username / Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. Lady Seraphina"
                    className="w-full bg-black/45 border border-white/10 focus:border-[#BA9A5D] text-xs px-4 py-3 rounded-xl text-white outline-none transition-all placeholder:text-zinc-800"
                  />
                </div>

                <div>
                  <label className="block text-[8px] font-bold uppercase tracking-widest text-[#DFCE9F] mb-1.5 flex items-center gap-1.5">
                    <Phone className="h-2.5 w-2.5 text-[#BA9A5D]" /> WhatsApp Contact Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +233 24 567 8910"
                    className="w-full bg-black/45 border border-white/10 focus:border-[#BA9A5D] text-xs px-4 py-3 rounded-xl text-white outline-none transition-all placeholder:text-zinc-800 font-mono"
                  />
                </div>

              </div>

              <div>
                <label className="block text-[8px] font-bold uppercase tracking-widest text-[#DFCE9F] mb-1.5 flex items-center gap-1.5">
                  <MapPin className="h-2.5 w-2.5 text-[#BA9A5D]" /> Delivery Address
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Airport Residential Area Near Marriot, Accra"
                  className="w-full bg-black/45 border border-white/10 focus:border-[#BA9A5D] text-xs px-4 py-3 rounded-xl text-white outline-none transition-all placeholder:text-zinc-800"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-3 rounded-full bg-[#BA9A5D] text-[10px] font-bold uppercase tracking-[0.2em] text-[#040e0a] hover:bg-[#DFCE9F] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Processing...' : 'Save Profile Details'}
                </button>
              </div>

              {saveSuccess && (
                <div className="p-3 bg-emerald-950/20 border border-emerald-500/25 rounded-xl text-[10px] tracking-widest text-emerald-300 font-bold uppercase text-center animate-pulse mt-2">
                  ✓ Profile coordinates updated and secured persistently on account records.
                </div>
              )}
            </form>
          </div>          {/* Historical Order history log of client */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-[#BA9A5D]" />
                <h4 className="font-sans text-xs font-black uppercase tracking-widest text-[#DFCE9F]">Your Order History</h4>
              </div>
              <span className="font-mono text-[9px] bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-full text-zinc-400">
                {whatsappLogs.length} {whatsappLogs.length === 1 ? 'order' : 'orders'}
              </span>
            </div>

            {isLoadingLogs ? (
              <div className="text-center py-10">
                <div className="animate-spin h-5 w-5 border-2 border-t-transparent border-[#BA9A5D] rounded-full mx-auto" />
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mt-3">Verifying boutique order coordinates...</p>
              </div>
            ) : whatsappLogs.length === 0 ? (
              <div className="p-8 text-center border border-white/[0.03] bg-white/[0.01] rounded-2xl max-w-sm mx-auto">
                <ShoppingBag className="h-6 w-6 text-[#BA9A5D]/40 mx-auto mb-2.5" />
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-black">No Orders Saved Yet</p>
                <p className="text-[8.5px] text-zinc-550 mt-1.5 leading-relaxed">Whenever you submit an order request (for sizing or customized heels), detailed logs of your selections will be saved here in your secure order history.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {whatsappLogs.map((log) => {
                  const statusInfo = getStatusBadge(log.status || (log.source === 'whatsapp_logs' ? 'completed' : 'pending'));
                  return (
                    <motion.div 
                      key={log.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-white/5 hover:border-[#BA9A5D]/20 bg-gradient-to-br from-black/55 to-black/35 hover:from-black/75 hover:to-black/55 overflow-hidden text-xs flex flex-col justify-between transition-all duration-300 relative group"
                    >
                      {/* Accent highlight on hover */}
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#BA9A5D]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Card Header details */}
                      <div className="p-4 pb-2.5 border-b border-white/[0.03] space-y-2.5">
                        <div className="flex justify-between items-start gap-1">
                          <div className="space-y-0.5">
                            <span className="font-mono text-[9px] text-[#DFCE9F] uppercase tracking-widest font-black block">
                              Order ID #{log.id ? log.id.slice(0, 6).toUpperCase() : 'VIP'}
                            </span>
                            <span className="text-[8px] text-[#BA9A5D]/60 uppercase tracking-wider font-semibold block">
                              {log.type || 'Bespoke Sizing Request'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Glowing custom status badge */}
                            <span className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-widest rounded-full border ${statusInfo.classes} inline-flex items-center gap-1`}>
                              <span className="h-1 w-1 rounded-full bg-current animate-pulse shrink-0" />
                              {statusInfo.label}
                            </span>

                            {/* Delete order history log record option */}
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (window.confirm("Verify: Do you want to remove this order permanently from your profile history?")) {
                                  try {
                                    await deleteDoc(doc(db, 'orders', log.id));
                                    try {
                                      const profileRef = doc(db, 'profiles', user.uid);
                                      const profileSnap = await getDoc(profileRef);
                                      if (profileSnap.exists()) {
                                        const pData = profileSnap.data();
                                        const updatedHistory = (pData.orderHistory || []).filter((o: any) => o.orderId !== log.id && o.id !== log.id);
                                        const updatedList = (pData.ordersList || []).filter((o: any) => o.orderId !== log.id && o.id !== log.id);
                                        await updateDoc(profileRef, {
                                          orderHistory: updatedHistory,
                                          ordersList: updatedList
                                        });
                                      }
                                    } catch (errProfile) {
                                      console.warn("Profile arrays update failed:", errProfile);
                                    }
                                  } catch (err: any) {
                                    console.error("Could not remove order record:", err);
                                  }
                                }
                              }}
                              className="p-1 px-1.5 bg-red-950/20 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 text-red-400 rounded-md transition-all cursor-pointer inline-flex items-center"
                              title="Delete history log record"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {/* Order registration date */}
                        <div className="flex items-center gap-1.5 text-[8.5px] text-zinc-400 font-mono">
                          <Calendar className="h-3 w-3 text-[#BA9A5D]/80" />
                          <span>{formatDateLabel(log.createdAt)}</span>
                        </div>
                      </div>

                      {/* Item showcases with graphics/previews */}
                      <div className="p-4 flex-1 space-y-3">
                        {log.items && log.items.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5 scrollbar-thin">
                            {log.items.map((it: any, idx: number) => {
                              const img = getItemImage(it, idx);
                              return (
                                <div key={idx} className="flex gap-3 items-center justify-between bg-black/25 hover:bg-black/45 p-1.5 rounded-xl border border-white/[0.02] hover:border-white/5 transition-colors">
                                  <div className="flex items-center gap-2.5 overflow-hidden">
                                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-zinc-900 border border-white/5 shadow-inner shrink-0 relative">
                                      <img 
                                        src={img} 
                                        alt={it.name || "Heels"} 
                                        referrerPolicy="no-referrer" 
                                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-110" 
                                      />
                                    </div>
                                    <div className="text-left overflow-hidden">
                                      <p className="text-[9.5px] text-white font-extrabold uppercase tracking-wide truncate">{it.name}</p>
                                      <p className="text-[7.5px] text-zinc-400 font-mono uppercase tracking-wider mt-0.5">{it.category || 'Luxury Footwear'}</p>
                                    </div>
                                  </div>
                                  <span className="font-mono text-[9px] text-[#DFCE9F]/90 font-bold shrink-0">{it.price}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          // Fallback detail when order has no item metadata
                          <div className="text-[9.5px] text-zinc-400 whitespace-pre-line leading-relaxed italic bg-black/25 p-3 rounded-xl border border-white/[0.02] text-left">
                            {log.message || "Bespoke service consultation coordinates registered successfully."}
                          </div>
                        )}
                      </div>

                      {/* Card Footer details */}
                      {log.total ? (
                        <div className="px-4 py-3 border-t border-white/[0.03] bg-zinc-950/20 flex justify-between items-center shrink-0">
                          <span className="text-[8px] uppercase tracking-widest text-[#BA9A5D]/60 font-mono font-bold">Valuation Summary</span>
                          <span className="text-[11px] text-white font-black tracking-widest font-mono">
                            {log.total.toString().startsWith('GHS') || log.total.toString().startsWith('$') 
                              ? log.total 
                              : `GHS ${log.total.toLocaleString()}`
                            }
                          </span>
                        </div>
                      ) : null}

                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer brand stamp */}
        <div className="p-5 border-t border-white/10 bg-black/40 text-center select-none text-[8.5px] uppercase tracking-[0.25em] text-[#BA9A5D]/40 font-mono shrink-0">
          ✦ Bliss Elle Ghana ✦ Connected to Cloud Run Container
        </div>

      </div>
    </AnimatePresence>
  );
}
