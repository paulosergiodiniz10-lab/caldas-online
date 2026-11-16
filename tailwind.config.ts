import {
  Utensils,
  ShoppingBag,
  BedDouble,
  Cross,
  Car,
  Home,
  Settings,
  Sparkles,
  PartyPopper,
  PhoneCall,
  Store,
  Shield,
  Flame,
  Ambulance,
  Hospital,
  Landmark,
  Zap,
  Droplets,
  Bus,
  CarTaxiFront,
} from "lucide-react";

interface Props {
  name: string;
  className?: string;
}

export function CategoryIcon({ name, className = "w-6 h-6 text-white" }: Props) {
  switch (name) {
    case "Utensils":
      return <Utensils className={className} />;
    case "ShoppingBag":
      return <ShoppingBag className={className} />;
    case "BedDouble":
      return <BedDouble className={className} />;
    case "Cross":
      return <Cross className={className} />;
    case "Car":
      return <Car className={className} />;
    case "Home":
      return <Home className={className} />;
    case "Settings":
      return <Settings className={className} />;
    case "Sparkles":
      return <Sparkles className={className} />;
    case "PartyPopper":
      return <PartyPopper className={className} />;
    case "PhoneCall":
      return <PhoneCall className={className} />;
    case "Shield":
      return <Shield className={className} />;
    case "Flame":
      return <Flame className={className} />;
    case "Ambulance":
      return <Ambulance className={className} />;
    case "Hospital":
      return <Hospital className={className} />;
    case "Landmark":
      return <Landmark className={className} />;
    case "Zap":
      return <Zap className={className} />;
    case "Droplets":
      return <Droplets className={className} />;
    case "Bus":
      return <Bus className={className} />;
    case "CarTaxiFront":
      return <CarTaxiFront className={className} />;
    default:
      return <Store className={className} />;
  }
}
