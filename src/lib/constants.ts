export interface CategoryItem {
  id: string;
  name: string;
  subtitle: string;
  iconName: string;
  color: string;
  bgColor: string;
}

export const CATEGORIES: CategoryItem[] = [
  {
    id: "alimentacao",
    name: "Alimentação",
    subtitle: "Restaurantes, pizzarias, lanchonetes...",
    iconName: "Utensils",
    color: "text-orange-600",
    bgColor: "bg-orange-500",
  },
  {
    id: "comercio",
    name: "Comércio",
    subtitle: "Lojas, moda, presentes...",
    iconName: "ShoppingBag",
    color: "text-red-600",
    bgColor: "bg-red-500",
  },
  {
    id: "turismo",
    name: "Turismo",
    subtitle: "Hotéis, pousadas, atrativos...",
    iconName: "BedDouble",
    color: "text-blue-600",
    bgColor: "bg-blue-600",
  },
  {
    id: "saude",
    name: "Saúde",
    subtitle: "Clínicas, farmácias, laboratórios...",
    iconName: "Cross",
    color: "text-emerald-600",
    bgColor: "bg-emerald-500",
  },
  {
    id: "automotivo",
    name: "Automotivo",
    subtitle: "Oficinas, autopeças, lava-jato...",
    iconName: "Car",
    color: "text-purple-600",
    bgColor: "bg-purple-600",
  },
  {
    id: "construcao",
    name: "Casa & Construção",
    subtitle: "Materiais, elétrica, hidráulica...",
    iconName: "Home",
    color: "text-amber-600",
    bgColor: "bg-amber-500",
  },
  {
    id: "servicos",
    name: "Serviços",
    subtitle: "Contadores, advogados, informática...",
    iconName: "Settings",
    color: "text-slate-600",
    bgColor: "bg-slate-600",
  },
  {
    id: "beleza",
    name: "Beleza e Bem-estar",
    subtitle: "Salões, estéticas, academias...",
    iconName: "Sparkles",
    color: "text-pink-600",
    bgColor: "bg-pink-500",
  },
  {
    id: "lazer",
    name: "Lazer e Eventos",
    subtitle: "Casas de festas, esportes, clubes...",
    iconName: "PartyPopper",
    color: "text-teal-600",
    bgColor: "bg-teal-500",
  },
  {
    id: "utilidades",
    name: "Utilidades",
    subtitle: "Polícia, bombeiros, hospital, prefeitura...",
    iconName: "PhoneCall",
    color: "text-indigo-600",
    bgColor: "bg-indigo-600",
  },
];

export const MOST_SEARCHED = [
  { label: "Pizzarias", query: "pizza", category: "alimentacao" },
  { label: "Hotéis", query: "hotel", category: "turismo" },
  { label: "Farmácias", query: "farmacia", category: "saude" },
  { label: "Postos", query: "posto", category: "automotivo" },
  { label: "Oficinas", query: "oficina", category: "automotivo" },
  { label: "Supermercados", query: "supermercado", category: "comercio" },
];

export const PUBLIC_UTILITIES = [
  { name: "Polícia Militar", number: "190", color: "bg-blue-900" },
  { name: "Bombeiros", number: "193", color: "bg-red-600" },
  { name: "SAMU", number: "192", color: "bg-red-700" },
  { name: "Hospital (UPA)", number: "(64) 3454-3500", color: "bg-emerald-600" },
  { name: "Prefeitura", number: "(64) 3454-3500", color: "bg-amber-600" },
  { name: "Energia (Equatorial)", number: "0800 062 0196", color: "bg-yellow-500" },
  { name: "Saneamento (DEMAE)", number: "(64) 3454-7400", color: "bg-sky-500" },
  { name: "Rodoviária", number: "(64) 3453-1144", color: "bg-purple-600" },
  { name: "Ponto de Táxi", number: "(64) 3453-1234", color: "bg-teal-600" },
];

// Fórmula de Haversine para calcular distância em KM entre duas coordenadas
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
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
