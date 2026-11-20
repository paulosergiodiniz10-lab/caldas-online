export interface Coupon {
  active: boolean;
  title: string;
  code: string;
  rules: string;
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
  lat: number | null;
  lng: number | null;
  whatsapp: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  logoUrl: string;
  coverUrl: string;
  gallery: string[];
  maxPhotos?: number; // Master pode aumentar por cliente
  maxVideos?: number; // Master pode aumentar até 4 por cliente
  youtubeHorizontal?: string; // 1 vídeo horizontal (exibe primeiro)
  youtubeVerticals?: string[]; // Até 3 vídeos verticais (Shorts/YouTube)
  coupon?: Coupon;
  planId?: string; // Identificador do plano contratado (opcional)
  isFeatured: boolean;
  isApproved: boolean;
  viewsCount: number;
  whatsappClicks: number;
  createdAt: number;
}

export interface PlanDoc {
  id: string;
  name: string; // Ex: "Grátis", "Vitrine", "Destaque", "Master"
  subtitle: string; // Ex: "Presença Básica", "+ Fotos e Vídeos"
  price: number; // 0 para Grátis, ou valor mensal (ex: 49.9, 89.9, 199.9)
  billingPeriod: string; // Ex: "/mês" ou "Grátis para sempre"
  maxPhotos: number; // Editável no Master (ex: 6, 20, 30)
  maxVideos: number; // Editável no Master (ex: 0, 2, 4)
  hasFeaturedHome: boolean; // Se inclui Empresas em Destaque na Home
  hasBannerHome: boolean; // Se inclui Full Banner na Home
  hasBannerSegment: boolean; // Se inclui Full Banner no Segmento
  badgeText?: string; // Ex: "Mais Escolhido" ou "Vagas Limitadas"
  highlight: boolean; // Destaque visual no card do plano
  features: string[]; // Lista extra de benefícios editáveis
  buttonText: string; // Ex: "Começar Grátis" ou "Contratar no WhatsApp"
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
