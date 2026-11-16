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

  // Banner 1: Grupo VIP
  vipGroupBadge: string;
  vipGroupTitle: string;
  vipGroupSubtitle: string;
  vipGroupButtonText: string;
  vipGroupUrl: string;
  vipGroupMessage: string;

  // Banner 2: Anuncie no Caldas Online
  advertiseTitle: string;
  advertiseSubtitle: string;
  advertiseRegisterText: string;
  advertiseRegisterUrl: string;
  advertiseWhatsappText: string;
  masterWhatsApp: string;
  advertiseWhatsappMessage: string;
}
