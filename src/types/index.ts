export interface BusinessCoupon {
  active: boolean;
  title: string; // Ex: "15% OFF em qualquer Pizza Grande"
  code: string; // Ex: "CALDAS15"
  rules: string; // Ex: "Válido de terça a quinta no salão ou balcão"
}

export interface Business {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  category: string;
  subcategory: string; // Ex: "Pizzaria", "Hotel", "Farmácia"
  description: string;
  neighborhood: string; // Ex: "Centro", "Bairro Turista"
  address: string;
  lat: number | null;
  lng: number | null;
  whatsapp: string;
  phone?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  logoUrl: string;
  coverUrl: string;
  gallery: string[];
  coupon?: BusinessCoupon;
  isFeatured: boolean; // Destaque pago
  isApproved: boolean; // Aprovado pelo Master
  viewsCount: number;
  whatsappClicks: number;
  createdAt: number;
}

export interface PromoBanner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string; // Link para página da empresa ou WhatsApp
  placement: "home" | string; // "home" ou id da categoria (ex: "alimentacao")
  active: boolean;
  order: number;
}

export interface SiteSettings {
  vipGroupUrl: string;
  vipGroupTitle: string;
  vipGroupSubtitle: string;
  masterWhatsApp: string;
}
