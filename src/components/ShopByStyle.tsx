import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ShoppingBag, Eye, Star, Share2, ChevronLeft, ChevronRight, X, Copy, Check, MessageSquare, ShieldCheck, ArrowRight, Award, Trash2 } from 'lucide-react';
import { Hotspot } from '../types';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export interface StyleProduct {
  id: string;
  name: string;
  category: string;
  price: number; // GHS
  rating: number;
  reviewCount: number;
  badge?: string;
  images: string[];
  description: string;
  material: string;
  quality: string;
  styling: string;
  colors: string[];
  sizes: string[];
  inStock: boolean;
  featured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  createdAt?: number;
}

export const STYLE_PRODUCTS: StyleProduct[] = [
  {
    id: 'prod-gold-stiletto',
    name: 'Royal Gold Belle Stiletto',
    category: 'Heels',
    price: 890,
    rating: 4.9,
    reviewCount: 142,
    badge: 'Best Seller',
    images: [
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=600&h=750',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=600&h=750',
      'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&q=80&w=600&h=750'
    ],
    description: 'An architectural wonder wrapped in high-impact metallic gold leaf. Meticulously designed for a striking posture, this stiletto features dual-cushioned Italian insoles and an elegant ankle fastener to ensure confidence at every gala step.',
    material: 'Full-Grain Calf Leather, Sovereign Metallic Gold Foil, Mulberry Silk lining.',
    quality: 'Hand-stretched over wooden molds by certified Florence artisans using 22 individual comfort-stitch points.',
    styling: 'Pairs exceptionally well with emerald silk evening gowns or precision-tailored high-rise ivory tuxedo pants.',
    colors: ['Empress Gold', 'Midnight Obsidian', 'Forest Emerald'],
    sizes: ['EU 36', 'EU 37', 'EU 38', 'EU 39', 'EU 40', 'EU 41'],
    inStock: true,
    featured: true
  },
  {
    id: 'prod-emerald-pump',
    name: 'Aurelia Satin Emerald Pump',
    category: 'Heels',
    price: 1150,
    rating: 5.0,
    reviewCount: 88,
    badge: 'New',
    images: [
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=600&h=750',
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=600&h=750',
      'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&q=80&w=600&h=750'
    ],
    description: 'Sophisticated elegance realized in premium French crushed satin. Featuring a glittering Swarovski crystal surround at the toe, the Aurelia pump represents the pinnacle of premium bespoke statement footwear.',
    material: 'French Crushed Silk Satin, Swarovski Crystals, Premium Lambskin Sole.',
    quality: 'Each crystal is individually prong-set into non-tarnish silver casing. Rated for premium comfort across extended wear.',
    styling: 'Designed to complement monochromatic black cocktail attire or structural velvet wrap suits.',
    colors: ['Forest Emerald', 'Champagne Nude', 'Royal Burgundy'],
    sizes: ['EU 37', 'EU 38', 'EU 39', 'EU 40'],
    inStock: true,
    featured: true
  },
  {
    id: 'prod-leath-tote',
    name: 'Signature Grain Leather Tote',
    category: 'Handbags',
    price: 1450,
    rating: 4.8,
    reviewCount: 204,
    badge: 'Best Seller',
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600&h=750',
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600&h=750',
      'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&q=80&w=600&h=750'
    ],
    description: 'Designed as a timeless daily masterpiece, this tote features structured, hand-painted edge seams, a secure magnetic monogram closure, and an meticulously lined interior that accommodates tablets and daily essentials.',
    material: 'Double-Tanned Pebbled Calfskin Leather, Solid Brass custom hardware.',
    quality: 'Meticulous attention to detail with five layers of edge paint applied for premium scuff resistance.',
    styling: 'The ultimate professional accomplice; coordinates beautifully with luxury linen shirts and gold jewelry.',
    colors: ['Earthy Chestnut', 'Ivory Cream', 'VVIP Noir'],
    sizes: ['Maison Medium', 'Bespoke Large'],
    inStock: true,
    featured: true
  },
  {
    id: 'prod-belle-luxe',
    name: 'Belle Luxe Shoulder Handbag',
    category: 'Handbags',
    price: 1250,
    rating: 4.9,
    reviewCount: 165,
    badge: 'Limited Edition',
    images: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600&h=750',
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600&h=750',
      'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&q=80&w=600&h=750'
    ],
    description: 'A striking structural shoulder bag, showcasing a sophisticated brass chain buckle system and premium suede lining. Its unique trapezoid structure retains a luxurious presence regardless of volume.',
    material: 'Sartorial Nappa Leather, Gold Electroplated Chain details.',
    quality: 'Features highly precise dual-thread lockstitching across load stress points for decades of high-fashion resilience.',
    styling: 'Drapes elegantly on the shoulder. Designed for high-society tea circles or exclusive rooftop meetups.',
    colors: ['Oatmeal Ivory', 'Mint Sage', 'Gilded Onyx'],
    sizes: ['One Size Fits All'],
    inStock: true,
    featured: false
  },
  {
    id: 'prod-clasp-clutch',
    name: 'Sovereign Gold-Clasp Bag',
    category: 'Handbags',
    price: 980,
    rating: 4.7,
    reviewCount: 92,
    badge: 'Trending',
    images: [
      'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&q=80&w=600&h=750',
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600&h=750',
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600&h=750'
    ],
    description: 'A magnificent structured clutch utilizing a geometric gold latch clasp, symbolic of Bliss Elle’s architectural approach. Packaged in a velvet keepsake case.',
    material: 'Polished Patent Leather, Handcrafted Solid Alloy Clasp.',
    quality: 'Rust-proof plating process ensures the metallic gold frame retains pristine reflection under intense ambient light.',
    styling: 'Clutch by hand or wear crossbody via the concealed jewelry cable strap.',
    colors: ['Gilded Onyx', 'Burgundy Satin', 'Alabaster White'],
    sizes: ['Concert Mini'],
    inStock: true,
    featured: false
  },
  {
    id: 'prod-silk-slipper',
    name: 'Confiance Embellished Silk Slipper',
    category: 'Slippers',
    price: 650,
    rating: 4.9,
    reviewCount: 112,
    badge: 'Trending',
    images: [
      'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&q=80&w=600&h=750',
      'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&q=80&w=600&h=750',
      'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&q=80&w=600&h=750'
    ],
    description: 'Bespoke indoor-outdoor slipper flats made from Mulberry silk, accented with intricate gold metallic embroidery patterns.',
    material: '100% Organic Italian Mulberry Silk, Leather Sole with Rubber anti-slide inserts.',
    quality: 'Intricate threadwork demands six continuous hours of artisan focus per shoe pair.',
    styling: 'Sublime lounge luxury. Perfect for home entertaining or paired with premium silk robes.',
    colors: ['Oatmeal Ivory', 'Sage Green', 'Midnight Ink'],
    sizes: ['EU 36', 'EU 37', 'EU 38', 'EU 39', 'EU 40', 'EU 41'],
    inStock: true,
    featured: false
  },
  {
    id: 'prod-comfort-slide',
    name: 'Elite Comfort Boulevard Slide',
    category: 'Slippers',
    price: 520,
    rating: 4.8,
    reviewCount: 198,
    badge: 'Best Seller',
    images: [
      'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&q=80&w=600&h=750',
      'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&q=80&w=600&h=750',
      'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&q=80&w=600&h=750'
    ],
    description: 'An ergonomically structured leather band slide with signature padded diamond quilting, offering ultimate comfort for metropolitan walks.',
    material: 'Quilted Lambskin Upper, Memory-foam Molded Leather Arch.',
    quality: 'Shock-absorbing orthotic support integrated seamlessly into ultra-shallow designer silhouettes.',
    styling: 'Coordinates perfectly with neutral beachwear, oversized sun hats, and designer swimwear.',
    colors: ['Sable Beige', 'Pure Cream', 'Ebony Jet'],
    sizes: ['EU 36', 'EU 37', 'EU 38', 'EU 39', 'EU 40', 'EU 41', 'EU 42'],
    inStock: true,
    featured: true
  },
  {
    id: 'prod-gold-anklet',
    name: 'Golden Hour Linked Anklet',
    category: 'Accessories',
    price: 450,
    rating: 5.0,
    reviewCount: 76,
    badge: 'New',
    images: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600&h=750',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600&h=750',
      'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&q=80&w=600&h=750'
    ],
    description: 'A delicate, heavy-gold plated chains structured anklet carrying a singular freshwater pearl to shimmer cleanly over the foot.',
    material: '18K Double-Plated Solid Brass, Baroque South-Sea Cultured Pearl.',
    quality: 'Hypoallergenic, water-safe chain treatment avoids discoloration or skin irritations.',
    styling: 'Specially created to draw attention to our Confiance Silk Slipper or Aurelia Pump silhouettes.',
    colors: ['18K Gilded Gold', 'Platinum Silver Coat'],
    sizes: ['Adjustable Lock (21cm - 26cm)'],
    inStock: true,
    featured: false
  },
  {
    id: 'prod-silk-scarf',
    name: 'Signature Monogram Silk Scarf',
    category: 'Accessories',
    price: 390,
    rating: 4.8,
    reviewCount: 54,
    badge: 'Trending',
    images: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600&h=750',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600&h=750',
      'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&q=80&w=600&h=750'
    ],
    description: 'Square pure silk satin scarf displaying iconic hand-illustrated motifs of premium botanical luxury, finished with exquisite hand-rolled hems.',
    material: '100% Twill Silk.',
    quality: 'Edges meticulously rolled and sewn entirely by hand using ultra-fine silk filaments.',
    styling: 'Wrap elegantly around the handles of your Signature Leather Tote or wear classically around the neck.',
    colors: ['Signature Emerald & Gold', 'Champagne & Rose Gold'],
    sizes: ['90cm x 90cm Squared'],
    inStock: true,
    featured: false
  }
];

interface Review {
  id: string;
  name: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

const DEFAULT_REVIEWS: Record<string, Review[]> = {
  'prod-gold-stiletto': [
    { id: 'rev-1', name: 'Ama Korkor Mensah', rating: 5, date: '2026-05-18', comment: 'Absolutely breathtaking! The fit is true to size and the gold leaf plating shines beautifully. Wowed everyone at the Airport Residential ball last weekend.', verified: true },
    { id: 'rev-2', name: 'Fidelia Osei', rating: 5, date: '2026-05-10', comment: 'I was worried about comfort but the double cushioned insoles truly did wonders. Walked and danced for 5 hours straight.', verified: true }
  ],
  'prod-leath-tote': [
    { id: 'rev-3', name: 'Abena Boateng', rating: 5, date: '2026-05-25', comment: 'Undoubtedly premium leather quality. The edges are painted beautifully. This holds my iPad, essential makeup, diary, and phone easily. Must buy!', verified: true }
  ],
  'prod-emerald-pump': [
    { id: 'rev-4', name: 'Zainab Bello', rating: 5, date: '2026-05-29', comment: 'The crushed silk feels luxurious to the touch. The crystals sparkle magnificently. Highly recommend for special occasions!', verified: true }
  ]
};

interface ShopByStyleProps {
  onAddToBag: (product: Hotspot) => void;
  cartItems: Hotspot[];
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
}

export default function ShopByStyle({ onAddToBag, cartItems, wishlist, onToggleWishlist }: ShopByStyleProps) {
  const [activeTab, setActiveTab] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [liveHotspots, setLiveHotspots] = useState<Hotspot[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'hotspots'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: Hotspot[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as Hotspot);
      });
      setLiveHotspots(list);
      setLoadingDb(false);
    }, (error) => {
      console.warn("Could not synchronize live hotspots collection:", error);
      setLoadingDb(false);
    });
    return () => unsub();
  }, []);

  const [animatingHearts, setAnimatingHearts] = useState<Record<string, boolean>>({});

  const triggerHeartbeat = (productId: string) => {
    setAnimatingHearts(prev => ({ ...prev, [productId]: true }));
    setTimeout(() => {
      setAnimatingHearts(prev => ({ ...prev, [productId]: false }));
    }, 1200);
  };

  const [selectedProduct, setSelectedProduct] = useState<StyleProduct | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [zoomStyle, setZoomStyle] = useState({ scale: 1, originX: 0, originY: 0 });

  // Reviews Local State
  const [reviewsMap, setReviewsMap] = useState<Record<string, Review[]>>(() => {
    try {
      const stored = localStorage.getItem('bliss_reviews');
      return stored ? JSON.parse(stored) : DEFAULT_REVIEWS;
    } catch {
      return DEFAULT_REVIEWS;
    }
  });

  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('bliss_reviews', JSON.stringify(reviewsMap));
  }, [reviewsMap]);

  const toggleWishlist = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onToggleWishlist(id);
  };

  const handleProductClick = (product: StyleProduct) => {
    setSelectedProduct(product);
    setActiveImageIdx(0);
    setSelectedColor(product.colors[0] || '');
    setSelectedSize(product.sizes[0] || '');
    setQuantity(1);
  };

  const handleShareWhatsApp = (product: StyleProduct) => {
    const text = `Take a look at the exquisite "${product.name}" from Bliss Elle Maison. Price: GHS ${product.price}. Explore luxury, configure details, and request allocation: ${window.location.href}`;
    const uri = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(uri, '_blank');
  };

  const handleCopyLink = (product: StyleProduct) => {
    const link = `${window.location.origin}/product/${product.id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(product.id);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const authorName = newReviewName.trim() || "Anonymous Enthusiast";
    const newRev: Review = {
      id: `rev-user-${Date.now()}`,
      name: authorName,
      rating: newReviewRating,
      date: new Date().toISOString().split('T')[0],
      comment: newReviewText.trim() || "No additional commentary was written.",
      verified: false
    };

    const currentRevs = reviewsMap[selectedProduct.id] || [];
    const updatedRevs = [newRev, ...currentRevs];

    setReviewsMap(prev => ({
      ...prev,
      [selectedProduct.id]: updatedRevs
    }));

    // Clear input fields
    setNewReviewName('');
    setNewReviewRating(5);
    setNewReviewText('');
  };

  // Convert StyleProduct format to database compatible hotspot structure so it can integrate seamlessly with the main shopping bag/cart logic!
  const dispatchToBag = (product: StyleProduct, quantityOveride = 1) => {
    // Trigger heartbeat animation on the wishlist/heart icon
    triggerHeartbeat(product.id);

    const item: Hotspot = {
      id: `${product.id}-${selectedColor}-${selectedSize}`,
      name: `${product.name} (${selectedColor || 'Default'} / ${selectedSize || 'Standard'})`,
      category: `Bespoke ${product.category}`,
      price: `GHS ${product.price}`,
      description: product.description,
      x: '50%',
      y: '50%',
      tag: product.badge || 'Bespoke Selection',
      imageUrl: product.images[0]
    };
    
    // Dispatch to bag multiple times according to configured user quantity
    for (let i = 0; i < quantityOveride; i++) {
      onAddToBag(item);
    }

    // Trigger feedback inside selected dialog/card or screen
    if (!selectedProduct) {
      alert(`"${product.name}" added to cart successfully!`);
    }
  };

  const handleCardBagPress = (e: React.MouseEvent, product: StyleProduct) => {
    e.stopPropagation();
    // Trigger heartbeat animation on the wishlist/heart icon
    triggerHeartbeat(product.id);

    const item: Hotspot = {
      id: `${product.id}-default`,
      name: product.name,
      category: `Bespoke ${product.category}`,
      price: `GHS ${product.price}`,
      description: product.description,
      x: '50%',
      y: '50%',
      tag: product.badge || 'Bespoke Selection',
      imageUrl: product.images[0]
    };
    onAddToBag(item);
    alert(`"${product.name}" successfully secured inside cart!`);
  };

  // Convert live items with custom mapped details
  const allLiveProducts: StyleProduct[] = (liveHotspots || []).map(h => {
    let priceNum = 350;
    if (h.price) {
      const cleaned = h.price.replace(/[^\d.]/g, '');
      if (cleaned) priceNum = parseFloat(cleaned);
    }
    
    // Pictures Carousel
    const imageList: string[] = [];
    if (h.imageUrl) imageList.push(h.imageUrl);
    if (h.images && h.images.length > 0) {
      h.images.forEach(img => {
        if (img && img !== h.imageUrl) imageList.push(img);
      });
    }

    // Default placeholders
    if (imageList.length === 0) {
      imageList.push('https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=82&w=600');
    }
    if (imageList.length === 1) {
      imageList.push(imageList[0]); // ensure at least 2 pictures for slider carousel
    }

    let createdMs = 0;
    if (h.createdAt) {
      if (typeof h.createdAt === 'object' && h.createdAt !== null) {
        if ('seconds' in h.createdAt) {
          createdMs = h.createdAt.seconds * 1000;
        } else if ('seconds' in (h.createdAt as any)) {
          createdMs = (h.createdAt as any).seconds * 1000;
        }
      } else if (typeof h.createdAt === 'number') {
        createdMs = h.createdAt;
      } else if (typeof h.createdAt === 'string') {
        createdMs = Date.parse(h.createdAt) || 0;
      }
    }

    const userReviews = reviewsMap[h.id] || [];
    const totalCount = userReviews.length;
    let resolvedRating = h.featured ? 5.0 : 4.8;
    if (totalCount > 0) {
      const totalRatingSum = userReviews.reduce((sum, r) => sum + r.rating, 0);
      resolvedRating = parseFloat((totalRatingSum / totalCount).toFixed(1));
    }

    return {
      id: h.id,
      name: h.name,
      category: h.category || 'Boots',
      price: priceNum,
      rating: resolvedRating,
      reviewCount: totalCount,
      badge: h.tag || (h.featured ? 'Best Seller' : 'New'),
      images: imageList,
      description: h.description || "A gorgeous custom bespoke design with stunning luxury fits.",
      material: h.material || "Premium Hand-stretched Grain Calf Suede and sovereign leather sole.",
      quality: h.quality || "Stitched to perfection, complete with professional orthotic memory cushions.",
      styling: h.styling || "Style with flowy modest slips, linen satin pieces or signature gold items.",
      colors: h.colors && h.colors.length > 0 ? h.colors : ['Deep Emerald', 'Gilded Gold'],
      sizes: h.sizes && h.sizes.length > 0 ? h.sizes : ['37', '38', '39', '40', '41', '42'],
      inStock: h.inStock !== false,
      featured: h.featured || false,
      createdAt: createdMs
    };
  });

  // Display only real custom bespoke creations fetched from the database
  const integratedProducts = allLiveProducts;

  const currentProduct = selectedProduct ? (integratedProducts.find(p => p.id === selectedProduct.id) || selectedProduct) : null;

  // Filter Logic
  const filteredProducts = integratedProducts.filter(prod => {
    if (activeTab === 'All') return true;
    const catUpper = (prod.category || '').toLowerCase();
    const tabUpper = activeTab.toLowerCase();
    
    // Map matching
    if (tabUpper === 'new') return prod.badge?.toLowerCase() === 'new' || prod.badge?.toLowerCase() === 'new arrivals';
    if (tabUpper === 'best seller') return prod.badge?.toLowerCase() === 'best seller' || prod.badge?.toLowerCase() === 'featured';

    // category matching with robust semantic fallbacks
    if (tabUpper === 'heels') {
      return catUpper === 'heels' || 
             catUpper.includes('heel') || 
             catUpper.includes('stiletto') || 
             catUpper.includes('pump') || 
             catUpper.includes('footwear') || 
             catUpper.includes('shoe');
    }
    if (tabUpper === 'handbags') {
      return catUpper === 'handbags' || 
             catUpper.includes('bag') || 
             catUpper.includes('clutch') || 
             catUpper.includes('purse') || 
             catUpper.includes('tote') || 
             catUpper.includes('handbag');
    }
    if (tabUpper === 'slippers') {
      return catUpper === 'slippers' || 
             catUpper === 'slides' || 
             catUpper.includes('slipper') || 
             catUpper.includes('slide') || 
             catUpper.includes('mule') || 
             catUpper.includes('loungewear');
    }
    if (tabUpper === 'accessories') {
      return catUpper === 'accessories' || 
             catUpper === 'veils & modest accessories' || 
             catUpper.includes('accessory') || 
             catUpper.includes('veil') || 
             catUpper.includes('scarf') || 
             catUpper.includes('jewelry') || 
             catUpper.includes('belt');
    }
    if (tabUpper === 'boots') return catUpper === 'boots' || catUpper.includes('boot');
    if (tabUpper === 'dresses') return catUpper === 'dresses' || catUpper.includes('dress');

    return catUpper.includes(tabUpper);
  });

  // Sort Logic applied to filtered products list
  const sortedAndFilteredProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') {
      return a.price - b.price;
    }
    if (sortBy === 'price-high') {
      return b.price - a.price;
    }
    // Newest arrivals first
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  // Zoom magnifier effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({ scale: 2.2, originX: x, originY: y });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ scale: 1, originX: 0, originY: 0 });
  };

  // Related products
  const relatedProducts = currentProduct
    ? integratedProducts.filter(p => p.category === currentProduct.category && p.id !== currentProduct.id).slice(0, 6)
    : [];

  return (
    <motion.section 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-120px" }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full bg-[#152D25] text-white border-t border-[#BA9A5D]/20 z-20 py-28 sm:py-24 px-4 sm:px-6 md:px-8 lg:px-12 flex flex-col items-center"
      id="shop-by-style-section"
    >
      {/* Editorial Decorative Top Border Lines */}
      <div className="w-full max-w-7xl flex flex-col items-center mb-10">
        <div className="w-24 h-[1px] bg-[#BA9A5D] mb-4 opacity-70" />
      </div>

      {/* SECTION HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1.0, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-3xl mb-16 space-y-4 px-2"
      >
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif-luxury font-light tracking-tight text-white leading-tight">
          Shop By <span className="font-serif-luxury italic text-[#BA9A5D]">Style</span>
        </h2>
        <p className="text-sm sm:text-sm md:text-base font-sans tracking-wide leading-relaxed text-[#DFCE9F]/85 max-w-2xl mx-auto font-light">
          Explore our carefully curated selection of luxury heels, thigh-high boots, artisanal handbags, slippers, and premium accessories designed for women who embrace poise, confidence, and elegance.
        </p>
      </motion.div>

      {/* PRODUCT FILTER TABS */}
      <div className="w-full max-w-5xl flex justify-center mb-16 px-4">
        <div className="flex flex-wrap bg-white/[0.05] p-2 sm:p-1.5 rounded-2xl sm:rounded-full border border-white/10 gap-2 sm:gap-1.5 justify-center">
          {(['All', 'Heels', 'Handbags', 'Slippers', 'Accessories', 'New', 'Best Seller'] as const).map(tab => (
            <button
               key={tab}
               id={`filter-tab-${tab.toLowerCase().replace(/\s+/g, '-')}`}
               onClick={() => setActiveTab(tab)}
               className={`px-4 sm:px-5 py-3 sm:py-2.5 rounded-xl sm:rounded-full text-[11px] sm:text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                 activeTab === tab
                   ? 'bg-[#BA9A5D] text-zinc-950 font-black shadow-[0_4px_15px_rgba(186,154,93,0.3)] scale-105'
                   : 'text-white/75 hover:text-white hover:bg-white/15'
               }`}
            >
              {tab === 'All' ? 'All Products' : tab === 'New' ? 'New Arrivals' : tab === 'Best Seller' ? 'Best Sellers' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* SORT BAR */}
      <div className="w-full max-w-5xl flex justify-end mb-10 pb-4 border-b border-white/10 px-4 font-sans">
        <div className="flex items-center gap-3">
          <span className="text-[9px] uppercase tracking-[0.2em] text-[#DFCE9F]/70 font-sans font-bold">Sort By</span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-black/45 border border-white/10 hover:border-[#BA9A5D]/60 text-[#DFCE9F] text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest pl-4 pr-10 py-2.5 rounded-xl outline-none cursor-pointer focus:border-[#BA9A5D] focus:shadow-[0_0_12px_rgba(186,154,93,0.25)] transition-all duration-300 appearance-none font-sans"
            >
              <option value="newest" className="bg-[#152D25] text-white">★ Newest Arrivals</option>
              <option value="price-low" className="bg-[#152D25] text-white font-mono">Price: Low to High</option>
              <option value="price-high" className="bg-[#152D25] text-white font-mono">Price: High to Low</option>
            </select>
            <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-[#BA9A5D]">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCT SHOWCASE GRID */}
      {sortedAndFilteredProducts.length === 0 ? (
        <div className="w-full flex justify-center py-20 px-4 text-center">
          <div className="w-full max-w-md mx-auto py-12 px-6 flex flex-col items-center bg-black/35 border border-white/10 rounded-3xl backdrop-blur-md">
            <div className="relative mb-5">
              <div className="absolute -inset-2 rounded-full bg-[#BA9A5D]/10 blur-md" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-[#BA9A5D]/30 bg-zinc-950 text-[#DFCE9F]">
                <ShoppingBag className="h-6 w-6 stroke-[1.5]" />
              </div>
            </div>
            <p className="text-xs uppercase tracking-[0.2em] font-extrabold text-[#BA9A5D]/80 mb-2">Notice</p>
            <p className="text-sm sm:text-base text-zinc-300 font-medium tracking-wide mb-6">
              there are no goods available here
            </p>
            <button
              onClick={() => setActiveTab('All')}
              className="px-6 py-2.5 rounded-full border border-[#BA9A5D]/30 bg-[#BA9A5D]/10 text-[#DFCE9F] hover:bg-[#BA9A5D]/20 transition-all font-bold text-[10px] uppercase tracking-widest cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.0, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-7xl grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-8 lg:gap-10 px-2 sm:px-0"
        >
          {sortedAndFilteredProducts.map(product => {
          const isLiked = wishlist.includes(product.id);
          return (
            <motion.div
              layout
              key={product.id}
              className="group relative bg-gradient-to-b from-[#1c3c32]/50 to-[#0c1c17]/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:border-[#BA9A5D]/60 transition-all duration-300 flex flex-col h-full hover:-translate-y-2"
              onClick={() => handleProductClick(product)}
            >
              {/* Image Container with zoom-hover effect */}
              <div className="relative aspect-[4/5] overflow-hidden bg-zinc-950/40 shrink-0 cursor-pointer">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                
                {/* Wishlist Button with heart-beat animation when item is added to cart */}
                <motion.button
                  type="button"
                  onClick={(e) => toggleWishlist(e, product.id)}
                  id={`wishlist-heart-${product.id}`}
                  animate={animatingHearts[product.id] ? {
                    scale: [1, 1.45, 1.15, 1.45, 1],
                    borderColor: ["rgba(255,255,255,0.1)", "rgba(186,154,93,0.8)", "rgba(186,154,93,0.4)", "rgba(186,154,93,0.8)", "rgba(255,255,255,0.1)"]
                  } : {}}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute top-4 right-4 z-10 h-9 w-9 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-md border border-white/10 hover:border-[#BA9A5D]/40 transition-[#border-color] cursor-pointer shadow-md group/heart"
                >
                  <Heart 
                    className={`h-4.5 w-4.5 transition-all ${
                      isLiked 
                        ? 'fill-red-500 text-red-500 scale-110 animate-pulse' 
                        : 'text-zinc-300 group-hover/heart:text-[#BA9A5D]'
                    } ${animatingHearts[product.id] ? 'text-red-500 fill-red-500 scale-125' : ''}`} 
                  />
                </motion.button>
 
                {/* Optional Badge */}
                {product.badge && (
                  <span className="absolute top-4 left-4 z-10 shadow-sm border border-[#BA9A5D]/30 bg-[#0c1c17] text-[#DFCE9F] text-[8px] uppercase tracking-[0.2em] font-black px-3.5 py-1 rounded-full font-sans">
                    {product.badge}
                  </span>
                )}
 
                {/* Overlay with Quick View hint */}
                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                  <span className="bg-[#152D25] text-white rounded-full px-5 py-2.5 text-[9px] uppercase tracking-widest font-black flex items-center gap-1.5 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 border border-white/10">
                    <Eye className="h-3 w-3 text-[#BA9A5D]" /> Quick View
                  </span>
                </div>
              </div>
 
              {/* Product Info Description / Translucent Glass Section with white ultra bold uppercase text */}
              <div className="p-3 sm:p-5 flex flex-col flex-1 justify-between bg-black/20 backdrop-blur-sm text-left border-t border-white/[0.05]">
                <div>
                  <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] font-bold text-[#DFCE9F]/70 block font-sans">
                    LUXURY {product.category}
                  </span>
                  <h3 className="font-sans font-black uppercase text-xs sm:text-[15px] text-white tracking-[0.08em] leading-normal line-clamp-1 group-hover:text-[#BA9A5D] transition-colors mt-0.5">
                    {product.name}
                  </h3>

                  {/* Gold Star Ratings - Catchy, Modern design without total review count */}
                  <div className="flex items-center gap-1 sm:gap-2 mt-2">
                    <div className="flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 rounded-full bg-linear-to-r from-[#BA9A5D]/20 via-[#BA9A5D]/10 to-transparent border border-[#BA9A5D]/30 text-[#DFCE9F] shadow-[0_2px_10px_rgba(186,154,93,0.1)]">
                      <Star className="h-2.5 w-2.5 fill-[#BA9A5D] text-[#BA9A5D] animate-pulse" />
                      <span className="text-[9px] sm:text-[10px] font-black tracking-wider leading-none font-sans text-glow-gold">{product.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
 
                <div className="mt-4 sm:mt-5 pt-2.5 sm:pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-sans text-sm sm:text-base font-black text-[#BA9A5D] text-glow-gold">
                    GHS {product.price}
                  </span>
 
                  {/* Add to Cart small button */}
                  <button
                    type="button"
                    onClick={(e) => handleCardBagPress(e, product)}
                    className="h-8 sm:h-8.5 px-2.5 sm:px-4 bg-[#BA9A5D] hover:bg-[#DFCE9F] text-zinc-950 rounded-full text-[8.5px] sm:text-[9px] uppercase tracking-widest font-black inline-flex items-center justify-center gap-1 transition-all duration-300 shadow-[0_4px_12px_rgba(186,154,93,0.2)] hover:scale-105 cursor-pointer w-full sm:w-auto"
                  >
                    <span>Add to cart</span> <ShoppingBag className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
        </motion.div>
      )}

      {/* LUXURY PRODUCT DETAILS MODAL */}
      <AnimatePresence>
        {currentProduct && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            {/* Dark glass backdrop layout */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Modal Body card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="relative w-full max-w-5xl bg-gradient-to-b from-[#132c24] to-[#0a1814] rounded-[32px] overflow-y-auto lg:overflow-hidden shadow-[0_30px_75px_rgba(0,0,0,0.85)] border border-[#BA9A5D]/25 grid grid-cols-1 lg:grid-cols-12 max-h-[90vh] lg:max-h-[85vh]"
            >
              {/* Close Button Pin */}
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="absolute top-6 right-6 z-20 h-10 w-10 flex items-center justify-center rounded-full bg-black/40 text-[#DFCE9F] border border-white/10 hover:bg-[#BA9A5D] hover:text-zinc-950 hover:scale-105 transition-all cursor-pointer shadow-lg outline-none"
                aria-label="Close details"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Responsive Mobile-Only Header - Visible only on mobile, hidden on lg screens */}
              <div className="col-span-1 lg:hidden p-6 pb-2 pr-16 border-b border-white/10 bg-black/10">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-[10px] uppercase tracking-widest font-sans text-[#BA9A5D] font-black">
                    {currentProduct.category}
                  </span>
                  {currentProduct.badge && (
                    <span className="bg-[#BA9A5D]/20 text-[#DFCE9F] font-sans text-[8px] uppercase tracking-[0.2em] px-2 py-0.5 rounded border border-[#BA9A5D]/20">
                      {currentProduct.badge}
                    </span>
                  )}
                </div>

                <h3 className="font-sans font-black uppercase text-2xl text-white tracking-wider leading-tight">
                  {currentProduct.name}
                </h3>

                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="text-xl font-black text-[#BA9A5D] text-glow-gold">GHS {currentProduct.price}</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[8px] uppercase tracking-wider font-sans font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> READY FOR WHOLESALE & RETAIL
                  </span>
                </div>
              </div>

              {/* LEFT SIDE: Image gallery carousel with zoom */}
              <div className="lg:col-span-6 p-5 sm:p-6 lg:p-8 flex flex-col justify-between lg:overflow-y-auto max-h-none lg:max-h-none border-b lg:border-b-0 lg:border-r border-white/10">
                <div className="space-y-3">
                  
                  {/* Aspect zoom master frame */}
                  <div 
                    className="relative aspect-square sm:aspect-[4/5] rounded-2xl overflow-hidden bg-black/40 border border-white/10 cursor-zoom-in"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  >
                    <img
                      src={currentProduct.images[activeImageIdx]}
                      alt={currentProduct.name}
                      referrerPolicy="no-referrer"
                      style={{
                        transform: `scale(${zoomStyle.scale})`,
                        transformOrigin: `${zoomStyle.originX}% ${zoomStyle.originY}%`
                      }}
                      className="w-full h-full object-cover transition-transform duration-100 ease-out"
                    />

                    {/* Left/Right quick chevron icons */}
                    {currentProduct.images.length > 1 && (
                      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageIdx(prev => prev === 0 ? currentProduct.images.length - 1 : prev - 1);
                          }}
                          className="h-8 w-8 rounded-full bg-black/60 hover:bg-[#BA9A5D] hover:text-zinc-950 text-white flex items-center justify-center pointer-events-auto border border-white/10 shadow-md cursor-pointer transition-all"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageIdx(prev => prev === currentProduct.images.length - 1 ? 0 : prev + 1);
                          }}
                          className="h-8 w-8 rounded-full bg-black/60 hover:bg-[#BA9A5D] hover:text-zinc-950 text-white flex items-center justify-center pointer-events-auto border border-white/10 shadow-md cursor-pointer transition-all"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail gallery switcher */}
                  <div className="flex gap-2.5 overflow-x-auto py-1">
                    {currentProduct.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIdx(idx)}
                        className={`w-12 h-16 sm:w-16 sm:h-20 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                          activeImageIdx === idx ? 'border-[#BA9A5D] scale-103 shadow-md' : 'border-transparent outline-none opacity-50 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE: Custom attributes description & Live feedback review list */}
              <div className="lg:col-span-6 p-6 lg:p-10 lg:overflow-y-auto max-h-none lg:max-h-[85vh] flex flex-col justify-between">
                <div>
                  {/* Desktop Only Header Section - Visible only on large screens */}
                  <div className="hidden lg:block">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-[10px] uppercase tracking-widest font-sans text-[#BA9A5D] font-black">
                        {currentProduct.category}
                      </span>
                      {currentProduct.badge && (
                        <span className="bg-black/40 text-[#DFCE9F] font-sans text-[8px] uppercase tracking-[0.2em] px-2 py-0.5 rounded border border-[#BA9A5D]/20">
                          {currentProduct.badge}
                        </span>
                      )}
                    </div>

                    <h3 className="font-sans font-black uppercase text-xl sm:text-2xl text-white tracking-wider leading-tight">
                      {currentProduct.name}
                    </h3>

                    {/* Pricing and stock availability display */}
                    <div className="flex items-center gap-4 mt-3 pb-4 border-b border-white/10">
                      <span className="text-xl font-black text-[#BA9A5D] text-glow-gold">GHS {currentProduct.price}</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[8.5px] uppercase tracking-wider font-sans font-bold">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> READY FOR WHOLESALE & RETAIL
                      </span>
                    </div>
                  </div>

                  {/* Accordion / Tabular Description breakdown */}
                  <div className="mt-6 space-y-4 text-left">
                    <p className="text-xs text-zinc-300 leading-relaxed font-light font-sans tracking-wide">
                      {currentProduct.description}
                    </p>


                  </div>

                  {/* Attributes config (Colors & Sizes) */}
                  <div className="mt-8 space-y-5 text-left border-t border-white/10 pt-6">
                    {/* Color selection */}
                    <div>
                      <span className="text-[9.5px] uppercase tracking-widest font-sans font-bold text-zinc-400 block mb-2">Select Preferred Color</span>
                      <div className="flex gap-2">
                        {currentProduct.colors.map(color => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`px-3.5 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-widest border transition-all cursor-pointer ${
                              selectedColor === color 
                                ? 'bg-[#BA9A5D] text-zinc-950 border-transparent scale-105 shadow-md font-black' 
                                : 'bg-black/30 text-white border-white/10 hover:border-[#BA9A5D]/60'
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Size Selection */}
                    {currentProduct.sizes.length > 0 && currentProduct.sizes[0] !== 'One Size Fits All' && (
                      <div>
                        <span className="text-[9.5px] uppercase tracking-widest font-sans font-bold text-zinc-400 block mb-2">Select Preferred Size</span>
                        <div className="flex flex-wrap gap-2">
                          {currentProduct.sizes.map(size => (
                            <button
                              key={size}
                              onClick={() => setSelectedSize(size)}
                              className={`px-3.5 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-widest border transition-all cursor-pointer ${
                                selectedSize === size 
                                  ? 'bg-[#BA9A5D] text-zinc-950 border-transparent scale-105 shadow-md font-black' 
                                  : 'bg-black/30 text-white border-white/10 hover:border-[#BA9A5D]/60'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quantity selectors */}
                    <div>
                      <span className="text-[9.5px] uppercase tracking-widest font-sans font-bold text-zinc-400 block mb-2">Select Quantity</span>
                      <div className="inline-flex items-center gap-3 bg-black/40 rounded-lg p-1 border border-white/10">
                        <button
                          type="button"
                          onClick={() => setQuantity(prev => Math.max(prev - 1, 1))}
                          className="h-8 w-8 rounded-md bg-white/5 hover:bg-white/15 flex items-center justify-center text-white font-bold transition-all cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-sans font-bold text-white">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity(prev => prev + 1)}
                          className="h-8 w-8 rounded-md bg-white/5 hover:bg-white/15 flex items-center justify-center text-white font-bold transition-all cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Main Call to Actions */}
                  <div className="mt-8">
                    <button
                      type="button"
                      onClick={() => {
                        dispatchToBag(currentProduct, quantity);
                        alert(`Successfully added ${quantity}x "${currentProduct.name}" to cart!`);
                      }}
                      className="w-full bg-[#BA9A5D] text-zinc-950 hover:bg-[#DFCE9F] font-black text-[10px] uppercase tracking-[0.25em] py-4 rounded-full transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(186,154,93,0.25)]"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" /> Add to cart
                    </button>
                  </div>

                  {/* Share option bar with COPY LINK or WHATSAPP dispatch */}
                  <div className="mt-6 flex flex-wrap gap-4 items-center justify-center border-t border-b border-white/10 py-4">
                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(currentProduct)}
                      className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-emerald-400 text-[10px] uppercase tracking-widest font-bold transition-all cursor-pointer"
                    >
                      <Share2 className="h-3.5 w-3.5" /> Share WhatsApp
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyLink(currentProduct)}
                      id={`copy-detail-link-${currentProduct.id}`}
                      className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-[#BA9A5D] text-[10px] uppercase tracking-widest font-bold transition-all cursor-pointer"
                    >
                      {copiedId === currentProduct.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied link!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Copy Product Link
                        </>
                      )}
                    </button>
                  </div>

                  {/* RELATED PRODUCTS SLIDER (Horizontal Carousel/Slider Layout with Up To 6 Items!) */}
                  {relatedProducts.length > 0 && (
                    <div className="mt-10 mb-10 text-left border-t border-white/10 pt-8">
                      <h4 className="text-[9px] uppercase tracking-[0.24em] font-sans font-black text-[#BA9A5D] mb-6 flex items-center justify-between">
                        <span>COORDINATE YOUR LOOK (Related Items)</span>
                        <span className="text-[8px] text-zinc-500 font-sans tracking-widest font-medium">swipe →</span>
                      </h4>
                      
                      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide justify-start items-stretch snap-x">
                        {relatedProducts.map(rel => (
                          <div
                            key={rel.id}
                            onClick={() => {
                              setSelectedProduct(rel);
                              setActiveImageIdx(0);
                              setSelectedColor(rel.colors[0] || '');
                              setSelectedSize(rel.sizes[0] || '');
                            }}
                            className="min-w-[150px] max-w-[150px] bg-[#12241e]/50 border border-white/5 hover:border-[#BA9A5D]/60 rounded-2xl overflow-hidden shadow-md transition-all duration-300 cursor-pointer p-3 flex flex-col justify-between text-left group/rel snap-start"
                          >
                            <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-black/40 mb-3 shrink-0">
                              <img 
                                src={rel.images[0]} 
                                alt={rel.name} 
                                className="w-full h-full object-cover group-hover/rel:scale-110 transition-transform duration-500" 
                              />
                            </div>
                            <div>
                              <span className="text-[8px] uppercase tracking-[0.15em] text-[#DFCE9F]/70 block font-sans truncate">
                                {rel.category}
                              </span>
                              <h5 className="text-[11px] font-black uppercase text-white tracking-wider line-clamp-1 mt-0.5 group-hover/rel:text-[#BA9A5D] transition-colors">
                                {rel.name}
                              </h5>
                            </div>
                            <span className="text-[#BA9A5D] font-sans text-[11px] font-black block mt-2 text-glow-gold">
                              GHS {rel.price}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CUSTOMER RATING & REVIEWS ZONE */}
                  <div className="mt-12 text-left border-t border-white/10 pt-8 font-sans">
                    <h4 className="text-xs uppercase tracking-[0.24em] font-sans font-black text-[#BA9A5D] mb-4 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-[#BA9A5D]" /> REVIEWS ({currentProduct.reviewCount} Reviews)
                    </h4>
                    
                    {/* Submit Review Form */}
                    <form onSubmit={handleAddReview} className="bg-black/45 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-4 mb-8 text-[11px]">
                      <strong className="text-[10px] uppercase tracking-widest text-[#BA9A5D] block font-black border-b border-white/5 pb-2">WRITE A REVIEW</strong>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[8.5px] uppercase tracking-widest text-[#BA9A5D] font-bold block mb-1">Your Name (Optional)</label>
                          <input
                            type="text"
                            placeholder="Ama K. Serwah (Optional)"
                            value={newReviewName}
                            onChange={(e) => setNewReviewName(e.target.value)}
                            className="w-full bg-black/35 border border-white/10 text-white outline-none p-2.5 rounded-xl text-xs font-medium placeholder-zinc-600 focus:border-[#BA9A5D] transition-colors"
                          />
                        </div>

                        <div>
                          <label className="text-[8.5px] uppercase tracking-widest text-zinc-400 font-bold block mb-1">Star Rating</label>
                          <div className="flex gap-1.5 py-2">
                            {[1, 2, 3, 4, 5].map(num => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => setNewReviewRating(num)}
                                className="h-6 w-6 flex items-center justify-center text-[#BA9A5D] cursor-pointer"
                              >
                                <Star className={`h-5 w-5 transition-all duration-200 hover:scale-110 ${num <= newReviewRating ? 'fill-[#BA9A5D] text-[#BA9A5D]' : 'text-zinc-800'}`} />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-[8.5px] uppercase tracking-widest text-zinc-400 font-bold block mb-1">Review Details</label>
                        <textarea
                          rows={3}
                          placeholder="Stitching accuracy was stunning, leather smells amazing, fitting salon session went above expectations..."
                          value={newReviewText}
                          onChange={(e) => setNewReviewText(e.target.value)}
                          className="w-full bg-black/35 border border-white/10 text-white outline-none p-2.5 rounded-xl text-xs font-light placeholder-zinc-600 focus:border-[#BA9A5D] transition-colors"
                        />
                      </div>

                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-[#BA9A5D] text-zinc-950 hover:bg-[#DFCE9F] rounded-full text-[10px] uppercase tracking-widest font-black transition-all cursor-pointer shadow-[0_4px_12px_rgba(186,154,93,0.3)] hover:scale-102"
                      >
                        Submit Review
                      </button>
                    </form>

                    {/* Rendering the Reviews Wall */}
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                      <h5 className="text-[9px] uppercase tracking-[0.2em] font-black text-zinc-400 mb-3">Verified Customer Reviews Wall</h5>
                      {(reviewsMap[currentProduct.id] || []).length === 0 ? (
                        <p className="text-[11px] italic text-zinc-500">Be the first to leave a review for this custom luxury item.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                          {(reviewsMap[currentProduct.id] || []).map(rev => (
                            <div key={rev.id} className="p-4 bg-black/25 border border-white/5 rounded-2xl space-y-2 flex flex-col justify-between h-full">
                              <div>
                                <div className="flex justify-between items-start gap-2">
                                  <div className="min-w-0">
                                    <strong className="text-[11px] font-black text-white block uppercase tracking-wider truncate">{rev.name}</strong>
                                    <span className="text-[8px] text-zinc-500 font-mono block mt-0.5">{rev.date}</span>
                                  </div>
                                  <div className="flex text-[#BA9A5D] shrink-0">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star key={i} className={`h-2.5 w-2.5 fill-current ${i < rev.rating ? 'text-[#BA9A5D]' : 'text-zinc-800'}`} />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-[11px] text-zinc-300 leading-relaxed font-light mt-2 break-words">{rev.comment}</p>
                              </div>
                              {rev.verified && (
                                <span className="inline-flex items-center gap-1 text-[8.5px] text-emerald-400 font-sans font-black uppercase tracking-widest mt-2">
                                  <Award className="h-3.5 w-3.5" /> Verified Signature Sourcing
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
