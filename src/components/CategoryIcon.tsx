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
        className={`${className} object-contain scale-[1.35] rounded-lg`}
      />
    );
  }

  const iconClass = `${className} scale-[1.18]`;

  switch (name) {
    case "Utensils":
      return <Utensils className={iconClass} />;
    case "Pizza":
      return <Pizza className={iconClass} />;
    case "Coffee":
      return <Coffee className={iconClass} />;
    case "ShoppingBag":
      return <ShoppingBag className={iconClass} />;
    case "Store":
      return <Store className={iconClass} />;
    case "Shirt":
      return <Shirt className={iconClass} />;
    case "BedDouble":
      return <BedDouble className={iconClass} />;
    case "Palmtree":
      return <Palmtree className={iconClass} />;
    case "Ticket":
      return <Ticket className={iconClass} />;
    case "Building2":
      return <Building2 className={iconClass} />;
    case "Cross":
      return <Cross className={iconClass} />;
    case "Pill":
      return <Pill className={iconClass} />;
    case "Stethoscope":
      return <Stethoscope className={iconClass} />;
    case "Car":
      return <Car className={iconClass} />;
    case "Bike":
      return <Bike className={iconClass} />;
    case "Wrench":
      return <Wrench className={iconClass} />;
    case "Fuel":
      return <Fuel className={iconClass} />;
    case "Home":
      return <Home className={iconClass} />;
    case "Hammer":
      return <Hammer className={iconClass} />;
    case "Sun":
      return <Sun className={iconClass} />;
    case "Snowflake":
      return <Snowflake className={iconClass} />;
    case "Settings":
      return <Settings className={iconClass} />;
    case "Briefcase":
      return <Briefcase className={iconClass} />;
    case "Laptop":
      return <Laptop className={iconClass} />;
    case "Sparkles":
      return <Sparkles className={iconClass} />;
    case "Scissors":
      return <Scissors className={iconClass} />;
    case "Dumbbell":
      return <Dumbbell className={iconClass} />;
    case "PartyPopper":
      return <PartyPopper className={iconClass} />;
    case "Music":
      return <Music className={iconClass} />;
    case "Camera":
      return <Camera className={iconClass} />;
    case "GraduationCap":
      return <GraduationCap className={iconClass} />;
    case "PawPrint":
      return <PawPrint className={iconClass} />;
    case "PhoneCall":
      return <PhoneCall className={iconClass} />;
    case "Shield":
      return <Shield className={iconClass} />;
    case "Flame":
      return <Flame className={iconClass} />;
    case "Ambulance":
      return <Ambulance className={iconClass} />;
    case "Hospital":
      return <Hospital className={iconClass} />;
    case "Landmark":
      return <Landmark className={iconClass} />;
    case "Zap":
      return <Zap className={iconClass} />;
    case "Droplets":
      return <Droplets className={iconClass} />;
    case "Bus":
      return <Bus className={iconClass} />;
    case "CarTaxiFront":
      return <CarTaxiFront className={iconClass} />;
    default:
      return <Store className={iconClass} />;
  }
}
