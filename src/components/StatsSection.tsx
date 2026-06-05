import { motion } from 'motion/react';
import { Award, ShieldCheck, Sparkles, Star } from 'lucide-react';

interface StatsProps {
  stats: {
    styles: string;
    items: string;
    experience: string;
  };
}

export default function StatsSection({ stats }: StatsProps) {
  const statItems = [
    {
      id: 'stat-styles',
      value: stats.styles.split(' ')[0],
      label: stats.styles.split(' ').slice(1).join(' '),
      icon: <Sparkles className="h-4 w-4 text-[#BA9A5D]" />,
      detail: 'Tailored with premium materials and flawless alignment.'
    },
    {
      id: 'stat-items',
      value: stats.items.split(' ')[0],
      label: stats.items.split(' ').slice(1).join(' '),
      icon: <Award className="h-4 w-4 text-[#BA9A5D]" />,
      detail: 'Exclusive seasonal drops across Milan & Paris fashion.'
    },
    {
      id: 'stat-experience',
      value: '100%',
      label: 'Bespoke Experience',
      icon: <ShieldCheck className="h-4 w-4 text-[#BA9A5D]" />,
      detail: 'Includes complimentary custom fittings & local priority delivery.'
    }
  ];

  return (
    <div className="w-full" id="bliss-stats-panel">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mt-8">
        {statItems.map((item, idx) => (
          <motion.div
            key={item.id}
            id={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 + idx * 0.1, ease: 'easeOut' }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-md transition-all hover:border-[#BA9A5D]/30"
          >
            {/* Background gold glow accent */}
            <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-[#BA9A5D]/5 blur-xl group-hover:bg-[#BA9A5D]/10 transition-colors" />

            <div className="flex items-start gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06] group-hover:border-[#BA9A5D]/20 transition-all">
                {item.icon}
              </div>
              
              <div className="flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-sans-luxury text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-none">
                    {item.value}
                  </span>
                  <span className="text-[#BA9A5D] font-mono text-sm">✦</span>
                </div>
                
                <h4 className="mt-1 font-sans-luxury text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[#DFCE9F]">
                  {item.label}
                </h4>
                
                <p className="mt-2 text-[11px] leading-relaxed text-zinc-400 group-hover:text-zinc-300">
                  {item.detail}
                </p>
              </div>
            </div>

            {/* Accent bottom-border laser light highlight */}
            <div className="absolute bottom-0 right-0 left-0 h-[1.5px] scale-x-0 bg-gradient-to-r from-transparent via-[#BA9A5D]/40 to-transparent transition-transform duration-500 group-hover:scale-x-100" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
