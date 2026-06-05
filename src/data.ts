import { Hotspot, Collection } from './types';

export const collections: Collection[] = [
  {
    id: 'emerald',
    name: 'Bliss Gold',
    subtitle: 'Step into Confidence',
    tagline: 'Step Into Elegance — Own Your Confidence',
    description: 'Discover our exquisite collection of premium female slippers, handcrafted architectural heels, and iconic designer bags, meticulously created for modern women who own their confidence.',
    gradientFrom: 'from-[#0A1A15] via-[#152D25] to-[#0A1A15]',
    gradientTo: 'rgba(186,154,93,0.18)',
    stats: {
      styles: '320+ Luxury Heels',
      items: '180+ Designer Bags',
      experience: '120+ Fine Slippers'
    }
  },
  {
    id: 'champagne',
    name: 'Bliss Green',
    subtitle: 'THE MINIMALIST COLLECTION',
    tagline: 'Soft Elegance Speaks — Quiet Confidence Reigns',
    description: 'Indulge in understated luxury with minimalist satin slippers, fine leather bags, and sleek classic heels, designed for supreme comfort, effortless class, and a confident step.',
    gradientFrom: 'from-[#1E2522] via-[#2F3E38] to-[#1C2320]',
    gradientTo: 'rgba(223,206,159,0.15)',
    stats: {
      styles: '210+ Silk Slippers',
      items: '95+ Handcrafted Bags',
      experience: '160+ Architectural Heels'
    }
  },
  {
    id: 'maison-dor',
    name: 'Bliss Black',
    subtitle: 'THE MIDNIGHT GILT',
    tagline: 'Sovereign Presence — Pure Majestic Splendor',
    description: 'Step into sovereign beauty with gold-embellished crystal heels, premium velvet slippers, and limited-edition chain handbags designed for bold women who command attention.',
    gradientFrom: 'from-[#050D0A] via-[#0E1E19] to-[#050D0A]',
    gradientTo: 'rgba(186,154,93,0.28)',
    stats: {
      styles: '150+ Crystal Heels',
      items: '80+ Gold-Clasp Bags',
      experience: '110+ Suede Mules'
    }
  }
];

export const hotspots: Hotspot[] = [
  {
    id: 'clutch',
    name: 'Elle Signature Gold-Clasp Bag',
    category: 'Luxury Handbags',
    price: '$2,450',
    description: 'Handcrafted premium green calfskin clutch boasting our iconic Bliss Elle solid gold monogram clasp and a fluid chain strap.',
    x: '22%',
    y: '30%',
    tag: 'Iconic Bag'
  },
  {
    id: 'heels',
    name: 'Aurelia 110mm Satin Stiletto Heels',
    category: 'Luxury Footwear',
    price: '$1,350',
    description: 'Exquisite deep forest green silk pumps featuring an architectural gold stiletto rim and custom bespoke arch contours.',
    x: '50%',
    y: '45%',
    tag: 'Luxury Heels'
  },
  {
    id: 'slippers',
    name: 'Confiance Embellished Silk Slippers',
    category: 'Luxury Loungewear',
    price: '$890',
    description: 'Ultra-soft slipper mules lined with Italian mulberry silk, finished with hand-embroidered metallic gold bullion thread.',
    x: '78%',
    y: '30%',
    tag: 'Bespoke Slipper'
  }
];
