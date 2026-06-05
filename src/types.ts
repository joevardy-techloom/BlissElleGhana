export interface Hotspot {
  id: string;
  name: string;
  category: string;
  price: string;
  description: string;
  x: string; // Percentage for horizontal positioning
  y: string; // Percentage for vertical positioning
  tag: string; // e.g. "Signature Piece", "Limited Edition"
  imageUrl?: string; // Optional custom uploaded base64 data or image URL
  inStock?: boolean; // Optional stock status toggle
  featured?: boolean; // Optional toggle to feature first
  createdAt?: any; // Creation timestamp
  updatedAt?: any; // Last updated timestamp
  images?: string[]; // Supporting multi-image carousel links
  colors?: string[]; // Dynamic available color options
  sizes?: string[]; // Dynamic available sizes
  material?: string; // Material and tailoring details
  quality?: string; // Quality controls
  styling?: string; // Editorial styling advice
}

export interface Collection {
  id: string;
  name: string;
  subtitle: string;
  tagline: string;
  description: string;
  gradientFrom: string;
  gradientTo: string;
  stats: {
    styles: string;
    items: string;
    experience: string;
  };
}
