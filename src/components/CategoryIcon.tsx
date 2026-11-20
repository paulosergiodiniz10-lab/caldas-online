import {
  Utensils,
  Pizza,
  Coffee,
  ShoppingBag,
  Store,
  Shirt,
  BedDouble,
  Palmtree,
  Ticket,
  Building2,
  Cross,
  Pill,
  Stethoscope,
  Car,
  Bike,
  Wrench,
  Fuel,
  Home,
  Hammer,
  Sun,
  Snowflake,
  Settings,
  Briefcase,
  Laptop,
  Sparkles,
  Scissors,
  Dumbbell,
  PartyPopper,
  Music,
  Camera,
  GraduationCap,
  PawPrint,
  PhoneCall,
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
  customIconUrl?: string;
  className?: string;
}

export function CategoryIcon({
  name,
  customIconUrl,
  className = "w-6 h-6 text-white",
}: Props) {
  if (customIconUrl && customIconUrl.trim() !== "") {
    return (
      <img
        src={customIconUrl}
        alt={name}
        className={`${className} object-contain`}
      />
    );
  }

  switch (name) {
    case "Utensils":
      return <Utensils className={className} />;
    case "Pizza":
      return <Pizza className={className} />;
    case "Coffee":
      return <Coffee className={className} />;
    case "ShoppingBag":
      return <ShoppingBag className={className} />;
    case "Store":
      return <Store className={className} />;
    case "Shirt":
      return <Shirt className={className} />;
    case "BedDouble":
      return <BedDouble className={className} />;
    case "Palmtree":
      return <Palmtree className={className} />;
    case "Ticket":
      return <Ticket className={className} />;
    case "Building2":
      return <Building2 className={className} />;
    case "Cross":
      return <Cross className={className} />;
    case "Pill":
      return <Pill className={className} />;
    case "Stethoscope":
      return <Stethoscope className={className} />;
    case "Car":
      return <Car className={className} />;
    case "Bike":
      return <Bike className={className} />;
    case "Wrench":
      return <Wrench className={className} />;
    case "Fuel":
      return <Fuel className={className} />;
    case "Home":
      return <Home className={className} />;
    case "Hammer":
      return <Hammer className={className} />;
    case "Sun":
      return <Sun className={className} />;
    case "Snowflake":
      return <Snowflake className={className} />;
    case "Settings":
      return <Settings className={className} />;
    case "Briefcase":
      return <Briefcase className={className} />;
    case "Laptop":
      return <Laptop className={className} />;
    case "Sparkles":
      return <Sparkles className={className} />;
    case "Scissors":
      return <Scissors className={className} />;
    case "Dumbbell":
      return <Dumbbell className={className} />;
    case "PartyPopper":
      return <PartyPopper className={className} />;
    case "Music":
      return <Music className={className} />;
    case "Camera":
      return <Camera className={className} />;
    case "GraduationCap":
      return <GraduationCap className={className} />;
    case "PawPrint":
      return <PawPrint className={className} />;
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
