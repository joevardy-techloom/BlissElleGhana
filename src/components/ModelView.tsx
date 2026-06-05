import { useState, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Eye, Plus, ShoppingCart, Check, Info } from 'lucide-react';
import { Hotspot } from '../types';

interface ModelViewProps {
  hotspots: Hotspot[];
  activeHotspotId: string | null;
  setActiveHotspotId: (id: string | null) => void;
  onAddToBag: (item: Hotspot) => void;
  selectedCollectionId: string;
}

export default function ModelView({
  hotspots,
  activeHotspotId,
  setActiveHotspotId,
  onAddToBag,
  selectedCollectionId
}: ModelViewProps) {
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  const handleBagClick = (item: Hotspot, e: MouseEvent) => {
    e.stopPropagation();
    onAddToBag(item);
    
    // Quick success animation toggle
    setAddedItemIds(prev => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItemIds(prev => ({ ...prev, [item.id]: false }));
    }, 2000);
  };

  return (
    <motion.div
      className="relative w-full flex items-center justify-center p-2 lg:p-6"
      id="bliss-model-showcase"
      whileHover={{ scale: 1.035, y: -4 }}
      transition={{ type: "spring", stiffness: 185, damping: 22 }}
    >
      
      {/* 100% Transparent Wrapper - Highly responsive aspect ratio and max-width for both square views and wide PC layouts */}
      <div className="relative w-full max-w-[440px] sm:max-w-[480px] md:max-w-[520px] lg:max-w-[620px] xl:max-w-[700px] 2xl:max-w-[800px] aspect-square lg:aspect-[4/3] xl:aspect-[1.3] rounded-3xl overflow-visible bg-transparent border-none shadow-none" id="model-frame">
        
        {/* Interactive Pulsing Hotspots Layer - floating directly on the transparent video backdrop */}
        {hotspots.map((item) => {
          const isActive = activeHotspotId === item.id;
          const isAdded = addedItemIds[item.id];

          return (
            <div
              key={item.id}
              className="absolute z-20"
              style={{ left: item.x, top: item.y }}
            >
              {/* Pulse Hotspot Point */}
              <button
                id={`hotspot-${item.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveHotspotId(isActive ? null : item.id);
                }}
                className="relative flex h-10 w-10 items-center justify-center cursor-pointer group"
                aria-label={`View details of ${item.name}`}
              >
                {/* Ping rings */}
                <span className={`absolute inline-flex h-full w-full rounded-full bg-[#BA9A5D]/50 opacity-75 transition-all duration-700 animate-ping ${isActive ? 'scale-150' : 'scale-100'}`} />
                
                {/* Glow ring */}
                <span className={`absolute h-8 w-8 rounded-full border border-[#BA9A5D] bg-[#050f0c]/90 shadow-[0_0_12px_rgba(186,154,93,0.4)] transition-transform duration-300 group-hover:scale-125 flex items-center justify-center ${isActive ? 'scale-110 !border-white bg-[#BA9A5D]' : ''}`}>
                  <span className={`h-3 w-3 rounded-full bg-[#BA9A5D] transition-all duration-300 ${isActive ? 'bg-zinc-950 scale-75' : 'bg-[#BA9A5D]'}`} />
                </span>
              </button>

              {/* Detail Glass Floating Card */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    id={`hotspot-card-${item.id}`}
                    initial={{ opacity: 0, scale: 0.9, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 15 }}
                    transition={{ type: 'spring', damping: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute -left-32 sm:-left-36 top-12 z-30 w-68 rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl p-4.5 shadow-2xl"
                  >
                    {/* Glowing Accent line */}
                    <div className="absolute top-0 right-0 left-0 h-[3px] rounded-t-2xl bg-gradient-to-r from-transparent via-[#BA9A5D] to-transparent" />

                    <div className="flex justify-between items-start gap-1">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-[#BA9A5D]">
                        {item.category}
                      </span>
                      <span className="rounded-full bg-[#BA9A5D]/20 border border-[#BA9A5D]/30 px-1.5 py-0.5 font-sans-luxury text-[8px] font-semibold uppercase tracking-widest text-[#DFCE9F]">
                        {item.tag}
                      </span>
                    </div>

                    <h5 className="mt-1.5 font-sans text-xs font-black uppercase tracking-widest text-[#BA9A5D]">
                      {item.name}
                    </h5>

                    <p className="mt-2 font-sans-luxury text-[11px] leading-relaxed text-zinc-300">
                      {item.description}
                    </p>

                    <div className="mt-3.5 flex items-center justify-between border-t border-white/5 pt-3">
                      <div>
                        <span className="text-[10px] text-zinc-400 block uppercase tracking-widest leading-none">Price</span>
                        <span className="font-sans text-xs font-black text-white tracking-widest mt-1 block">
                          {item.price}
                        </span>
                      </div>

                      {/* Add Custom retail bag action */}
                      <button
                        id={`hotspot-add-${item.id}`}
                        onClick={(e) => handleBagClick(item, e)}
                        className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${
                          isAdded
                            ? 'bg-[#BA9A5D]/20 text-[#DFCE9F] border border-[#BA9A5D]/40'
                            : 'bg-white text-zinc-950 hover:bg-[#BA9A5D] hover:text-zinc-950'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="h-3 w-3" />
                            Added
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3" />
                            Add to Bag
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

      </div>
    </motion.div>
  );
}
