import { CategoryDoc, UtilityDoc, SiteSettings, PlanDoc } from "@/types";

export const ICON_OPTIONS = [
  { name: "Utensils", label: "Alimentação / Prato" },
  { name: "Pizza", label: "Pizzaria" },
  { name: "Coffee", label: "Café / Padaria" },
  { name: "ShoppingBag", label: "Comércio / Sacola" },
  { name: "Store", label: "Loja / Mercado" },
  { name: "Shirt", label: "Moda / Roupas" },
  { name: "BedDouble", label: "Hotel / Pousada" },
  { name: "Palmtree", label: "Turismo / Parques" },
  { name: "Ticket", label: "Ingressos / Cupons" },
  { name: "Cross", label: "Saúde / Cruz" },
  { name: "Pill", label: "Farmácia" },
  { name: "Stethoscope", label: "Clínica / Médico" },
  { name: "Car", label: "Automotivo / Carro" },
  { name: "Wrench", label: "Oficina / Mecânica" },
  { name: "Fuel", label: "Posto de Combustível" },
  { name: "Home", label: "Casa / Imóveis" },
  { name: "Hammer", label: "Construção / Reforma" },
  { name: "Settings", label: "Serviços / Engrenagem" },
  { name: "Briefcase", label: "Negócios / Escritório" },
  { name: "Laptop", label: "Informática / Celular" },
  { name: "Sparkles", label: "Beleza / Estética" },
  { name: "Scissors", label: "Salão / Barbearia" },
  { name: "Dumbbell", label: "Academia / Esporte" },
  { name: "PartyPopper", label: "Lazer / Eventos" },
  { name: "Music", label: "Música / Shows" },
  { name: "Camera", label: "Fotografia / Vídeo" },
  { name: "GraduationCap", label: "Educação / Cursos" },
  { name: "PawPrint", label: "Pet Shop / Veterinária" },
  { name: "PhoneCall", label: "Telefone / Contato" },
  { name: "Shield", label: "Polícia / Segurança" },
  { name: "Flame", label: "Bombeiros / Emergência" },
  { name: "Ambulance", label: "Ambulância / SAMU" },
  { name: "Hospital", label: "Hospital / UPA" },
  { name: "Landmark", label: "Prefeitura / Órgão" },
  { name: "Zap", label: "Energia / Elétrica" },
  { name: "Droplets", label: "Água / Saneamento" },
  { name: "Bus", label: "Rodoviária / Ônibus" },
  { name: "CarTaxiFront", label: "Táxi / Transporte" },
];

export const COLOR_OPTIONS = [
  { label: "Laranja", value: "bg-orange-500" },
  { label: "Vermelho", value: "bg-red-500" },
  { label: "Vermelho Escuro", value: "bg-red-700" },
  { label: "Azul", value: "bg-blue-600" },
  { label: "Azul Marinho", value: "bg-blue-900" },
  { label: "Azul Claro", value: "bg-sky-500" },
  { label: "Verde Esmeralda", value: "bg-emerald-500" },
  { label: "Verde Escuro", value: "bg-emerald-600" },
  { label: "Roxo", value: "bg-purple-600" },
  { label: "Âmbar", value: "bg-amber-500" },
  { label: "Grafite", value: "bg-slate-600" },
  { label: "Rosa", value: "bg-pink-500" },
  { label: "Turquesa", value: "bg-teal-500" },
  { label: "Índigo", value: "bg-indigo-600" },
  { label: "Amarelo", value: "bg-yellow-500" },
];

export const DEFAULT_PLANS: PlanDoc[] = [
  {
    id: "gratis",
    name: "Grátis",
    subtitle: "Presença Básica",
    price: 0,
    billingPeriod: "Grátis para sempre",
    maxPhotos: 6,
    maxVideos: 0,
    hasFeaturedHome: false,
    hasBannerHome: false,
    hasBannerSegment: false,
    badgeText: "",
    highlight: false,
    features: [
      "Página exclusiva no guia comercial",
      "Botão direto para o seu WhatsApp",
      "1 cupom de desconto ativo",
      "Localização no mapa e rotas GPS",
    ],
    buttonText: "Cadastrar Grátis",
    order: 1,
    active: true,
  },
  {
    id: "vitrine",
    name: "Vitrine",
    subtitle: "+ Fotos e Vídeos",
    price: 49.9,
    billingPeriod: "/mês",
    maxPhotos: 20,
    maxVideos: 2,
    hasFeaturedHome: false,
    hasBannerHome: false,
    hasBannerSegment: false,
    badgeText: "",
    highlight: false,
    features: [
      "Tudo do plano Grátis",
      "Links para Instagram, Site e Cardápio",
      "Galeria ampliada para encantar clientes",
      "Vídeos do YouTube e Reels integrados",
    ],
    buttonText: "Contratar Vitrine",
    order: 2,
    active: true,
  },
  {
    id: "destaque",
    name: "Destaque",
    subtitle: "+ Primeira Página e Selo VIP",
    price: 89.9,
    billingPeriod: "/mês",
    maxPhotos: 30,
    maxVideos: 4,
    hasFeaturedHome: true,
    hasBannerHome: false,
    hasBannerSegment: false,
    badgeText: "Mais Escolhido",
    highlight: true,
    features: [
      "Tudo do plano Vitrine",
      "Presença rotativa na Primeira Página (Home)",
      "Selo Dourado ★ Destaque no card",
      "Prioridade no topo da sua categoria",
    ],
    buttonText: "Quero ser Destaque",
    order: 3,
    active: true,
  },
  {
    id: "master",
    name: "Master",
    subtitle: "+ Full Banner Home e Segmento",
    price: 199.9,
    billingPeriod: "/mês",
    maxPhotos: 30,
    maxVideos: 4,
    hasFeaturedHome: true,
    hasBannerHome: true,
    hasBannerSegment: true,
    badgeText: "Vagas Limitadas",
    highlight: false,
    features: [
      "Tudo do plano Destaque",
      "Full Banner no topo da Página Inicial",
      "Full Banner exclusivo no seu Segmento",
      "Botão direto para WhatsApp ou Link no banner",
    ],
    buttonText: "Ser Patrocinador Master",
    order: 4,
    active: true,
  },
];

export const DEFAULT_CATEGORIES: CategoryDoc[] = [
  {
    id: "alimentacao",
    slug: "alimentacao",
    name: "Alimentação",
    subtitle: "Restaurantes, pizzarias, lanchonetes...",
    iconName: "Utensils",
    bgColor: "bg-orange-500",
    order: 1,
    active: true,
  },
  {
    id: "comercio",
    slug: "comercio",
    name: "Comércio",
    subtitle: "Lojas, moda, presentes...",
    iconName: "ShoppingBag",
    bgColor: "bg-red-500",
    order: 2,
    active: true,
  },
  {
    id: "turismo",
    slug: "turismo",
    name: "Turismo",
    subtitle: "Hotéis, pousadas, atrativos...",
    iconName: "BedDouble",
    bgColor: "bg-blue-600",
    order: 3,
    active: true,
  },
  {
    id: "saude",
    slug: "saude",
    name: "Saúde",
    subtitle: "Clínicas, farmácias, laboratórios...",
    iconName: "Cross",
    bgColor: "bg-emerald-500",
    order: 4,
    active: true,
  },
  {
    id: "automotivo",
    slug: "automotivo",
    name: "Automotivo",
    subtitle: "Oficinas, autopeças, lava-jato...",
    iconName: "Car",
    bgColor: "bg-purple-600",
    order: 5,
    active: true,
  },
  {
    id: "construcao",
    slug: "construcao",
    name: "Casa & Construção",
    subtitle: "Materiais, elétrica, hidráulica...",
    iconName: "Home",
    bgColor: "bg-amber-500",
    order: 6,
    active: true,
  },
  {
    id: "servicos",
    slug: "servicos",
    name: "Serviços",
    subtitle: "Contadores, advogados, informática...",
    iconName: "Settings",
    bgColor: "bg-slate-600",
    order: 7,
    active: true,
  },
  {
    id: "beleza",
    slug: "beleza",
    name: "Beleza e Bem-estar",
    subtitle: "Salões, estéticas, academias...",
    iconName: "Sparkles",
    bgColor: "bg-pink-500",
    order: 8,
    active: true,
  },
  {
    id: "lazer",
    slug: "lazer",
    name: "Lazer e Eventos",
    subtitle: "Casas de festas, esportes, clubes...",
    iconName: "PartyPopper",
    bgColor: "bg-teal-500",
    order: 9,
    active: true,
  },
  {
    id: "utilidades",
    slug: "utilidades",
    name: "Utilidades",
    subtitle: "Polícia, bombeiros, hospital, prefeitura...",
    iconName: "PhoneCall",
    bgColor: "bg-indigo-600",
    order: 10,
    active: true,
  },
];

export const DEFAULT_UTILITIES: UtilityDoc[] = [
  { id: "pm", name: "Polícia Militar", number: "190", color: "bg-blue-900", iconName: "Shield", order: 1, active: true },
  { id: "bombeiros", name: "Bombeiros", number: "193", color: "bg-red-600", iconName: "Flame", order: 2, active: true },
  { id: "samu", name: "SAMU", number: "192", color: "bg-red-700", iconName: "Ambulance", order: 3, active: true },
  { id: "upa", name: "Hospital (UPA)", number: "(64) 3454-3500", color: "bg-emerald-600", iconName: "Hospital", order: 4, active: true },
  { id: "prefeitura", name: "Prefeitura", number: "(64) 3454-3500", color: "bg-amber-600", iconName: "Landmark", order: 5, active: true },
  { id: "equatorial", name: "Energia (Equatorial)", number: "0800 062 0196", color: "bg-yellow-500", iconName: "Zap", order: 6, active: true },
  { id: "demae", name: "Saneamento (DEMAE)", number: "(64) 3454-7400", color: "bg-sky-500", iconName: "Droplets", order: 7, active: true },
  { id: "rodoviaria", name: "Rodoviária", number: "(64) 3453-1144", color: "bg-purple-600", iconName: "Bus", order: 8, active: true },
  { id: "taxi", name: "Ponto de Táxi", number: "(64) 3453-1234", color: "bg-teal-600", iconName: "CarTaxiFront", order: 9, active: true },
];

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  heroBadge: "Tudo o que você precisa em um só lugar!",
  heroTitlePrefix: "O Guia Comercial de",
  heroTitleHighlight: "Caldas Novas",
  searchPlaceholder: "O que você procura hoje? Ex: pizza, hotel, farmácia...",
  mostSearchedTitle: "Mais Procurados",
  mostSearchedSubtitle: "Acesso rápido aos termos mais buscados em Caldas Novas",
  featuredTitle: "Empresas em Destaque",
  featuredSubtitle: "Conheça empresas e ofertas especiais da nossa cidade",
  utilitiesTitle: "Utilidades Rápidas",
  utilitiesSubtitle: "Contatos importantes de Caldas Novas sempre à mão (clique para ligar)",
  mostSearchedItems: [
    { label: "Pizzarias", query: "pizza" },
    { label: "Hotéis", query: "hotel" },
    { label: "Farmácias", query: "farmacia" },
    { label: "Postos", query: "posto" },
    { label: "Oficinas", query: "oficina" },
    { label: "Supermercados", query: "supermercado" },
  ],

  // Banner 1: Grupo VIP
  vipGroupBadge: "CLUBE EXCLUSIVO",
  vipGroupTitle: "Receba Cupons Secretos em Primeira Mão!",
  vipGroupSubtitle:
    "Entre no Grupo VIP do Caldas Novas Online no WhatsApp e receba ofertas relâmpago de pizzarias, hotéis, parques e lojas da cidade antes de todo mundo.",
  vipGroupButtonText: "ENTRAR NO GRUPO VIP GRÁTIS",
  vipGroupUrl: "https://chat.whatsapp.com/",
  vipGroupMessage:
    "Olá! Quero entrar no Grupo VIP de Ofertas do Caldas Novas Online para receber os cupons exclusivos de Caldas Novas!",

  // Banner 2: Anuncie no Caldas Novas Online
  advertiseTitle: "ANUNCIE NO CALDAS NOVAS ONLINE",
  advertiseSubtitle:
    "Cadastre sua empresa grátis ou destaque sua marca nos banners principais para milhares de clientes!",
  advertiseRegisterText: "Cadastrar Grátis",
  advertiseRegisterUrl: "/painel-empresa",
  advertiseWhatsappText: "Falar no WhatsApp",
  masterWhatsApp: "5564993049090",
  advertiseWhatsappMessage:
    "Olá! Vi o portal Caldas Novas Online e tenho interesse em anunciar e destacar minha empresa em Caldas Novas.",
};

export const CATEGORIES = DEFAULT_CATEGORIES;
export const PUBLIC_UTILITIES = DEFAULT_UTILITIES;
export const MOST_SEARCHED = DEFAULT_SITE_SETTINGS.mostSearchedItems;

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m de você`;
  }
  return `${km.toFixed(1).replace(".", ",")} km`;
}
