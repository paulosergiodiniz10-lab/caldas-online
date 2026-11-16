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
  placement: string; // 'home' ou o slug da categoria
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
  // Hero e Textos da Home
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

  // Grupo VIP e Banner Anuncie
  vipGroupUrl: string;
  vipGroupBadge: string;
  vipGroupTitle: string;
  vipGroupSubtitle: string;
  advertiseTitle: string;
  advertiseSubtitle: string;
  masterWhatsApp: string;
}
