export interface Coupon {
  active: boolean;
  title: string;
  code: string;
  rules: string;
}

export type DayKey = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";

export interface DaySchedule {
  open: boolean;
  start: string; // Ex: "08:00"
  end: string;   // Ex: "18:00"
}

export interface BusinessHours {
  enabled: boolean; // Se a empresa ativou controle de horário
  is24h?: boolean;  // Se atende 24 horas todos os dias
  days: Record<DayKey, DaySchedule>;
}

export interface Business {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  category: string;
  subcategory: string;
  description: string;
  neighborhood: string;
  address: string;
  cep?: string;
  googleMapsUrl?: string;
  lat: number | null;
  lng: number | null;
  whatsapp: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  logoUrl: string;
  showcaseUrl?: string; // Foto Vitrine (Card da Home/Categorias - 1536x1024px)
  coverUrl: string;     // Banner Capa (Topo da página interna - 1200x400px)
  gallery: string[];
  maxPhotos?: number; // Master pode aumentar por cliente
  maxVideos?: number; // Master pode aumentar até 4 por cliente
  youtubeHorizontal?: string; // 1 vídeo horizontal (exibe primeiro)
  youtubeVerticals?: string[]; // Até 3 vídeos verticais (Shorts/YouTube)
  coupon?: Coupon;
  showCouponOnCard?: boolean; // Moderador libera ou bloqueia exibição do cupom no card da Home/Categorias
  businessHours?: BusinessHours; // Horário de funcionamento semanal
  planId?: string; // Identificador do plano contratado (ex: gratis, vitrine, destaque, master, full-banner)
  planName?: string; // Nome do plano vinculado pelo moderador
  isVerified?: boolean; // Selo Empresa Verificada (controlado no Master)
  isFeatured: boolean;
  isApproved: boolean;
  acceptedTerms?: boolean;
  acceptedTermsAt?: number;
  approvedAt?: number;
  viewsCount: number;
  whatsappClicks: number;
  createdAt: number;
}

export interface PlanDoc {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  priceDisplay?: string; // Exibição exata digitada no Master (ex: "157" ou "157,00")
  billingPeriod: string;
  maxPhotos: number;
  maxVideos: number;
  hasFeaturedHome: boolean;
  hasBannerHome: boolean;
  hasBannerSegment: boolean;
  badgeText?: string;
  highlight: boolean;
  features: string[];
  buttonText: string;
  order: number;
  active: boolean;
}

export interface PromoBanner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  placement: string;
  actionType?: "link" | "whatsapp";
  whatsappNumber?: string;
  whatsappMessage?: string;
  buttonText?: string;
  active: boolean;
  order: number;
}

export interface CategoryDoc {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  iconName: string;
  customIconUrl?: string;
  bgColor: string;
  quickTags?: string[]; // Temas rápidos do segmento (Ex: ["Pizzarias", "Hambúrguer", "Restaurantes"])
  order: number;
  active: boolean;
}

export interface UtilityDoc {
  id: string;
  name: string;
  number: string;
  color: string;
  iconName: string;
  customIconUrl?: string;
  order: number;
  active: boolean;
}

export interface MostSearchedItem {
  label: string;
  query: string;
}

export interface SiteSettings {
  heroBadge: string;
  heroTitlePrefix: string;
  heroTitleHighlight: string;
  searchPlaceholder: string;
  showMostSearched?: boolean;
  mostSearchedTitle: string;
  mostSearchedSubtitle: string;
  featuredTitle: string;
  featuredSubtitle: string;
  utilitiesTitle: string;
  utilitiesSubtitle: string;
  mostSearchedItems: MostSearchedItem[];

  vipGroupBadge: string;
  vipGroupTitle: string;
  vipGroupSubtitle: string;
  vipGroupButtonText: string;
  vipGroupUrl: string;
  vipGroupMessage: string;

  advertiseTitle: string;
  advertiseSubtitle: string;
  advertiseRegisterText: string;
  advertiseRegisterUrl: string;
  advertiseWhatsappText: string;
  masterWhatsApp: string;
  advertiseWhatsappMessage: string;
}
