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
  maxPhotos?: number; // Nasce com 5 (Master pode aumentar por cliente)
  maxVideos?: number; // Nasce com 1 (Master pode aumentar até 4 por cliente)
  youtubeHorizontal?: string; // 1 vídeo horizontal (exibe primeiro)
  youtubeVerticals?: string[]; // Até 3 vídeos verticais (Shorts/YouTube)
  coupon?: Coupon;
  isFeatured: boolean;
  isApproved: boolean;
  viewsCount: number;
  whatsappClicks: number;
  createdAt: number;
}

export interface PromoBanner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  placement: string;
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
