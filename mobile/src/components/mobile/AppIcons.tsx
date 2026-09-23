import type { TextStyle } from 'react-native';
import {
  ArrowUpDown,
  BadgeCheck,
  CalendarDays,
  Check,
  ChefHat,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CookingPot,
  CircleQuestionMark,
  ExternalLink,
  Eye,
  Globe,
  Heart,
  House,
  Info,
  Leaf,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Pizza,
  RotateCcw,
  Salad,
  Sandwich,
  Search,
  Share2,
  ShoppingCart,
  SlidersHorizontal,
  Soup,
  Sprout,
  Star,
  Tag,
  Truck,
  User,
  Users,
  UtensilsCrossed,
  ConciergeBell,
  X,
} from 'lucide-react-native';

/**
 * Single consistent icon system: Lucide (guide §39).
 * Expo SDK 57 compatible (lucide-react-native + react-native-svg).
 */
const ICONS = {
  home: House,
  search: Search,
  calendar: CalendarDays,
  user: User,
  heart: Heart,
  heartFilled: Heart,
  share: Share2,
  pin: MapPin,
  star: Star,
  sliders: SlidersHorizontal,
  badgeCheck: BadgeCheck,
  users: Users,
  tag: Tag,
  truck: Truck,
  cart: ShoppingCart,
  back: ChevronLeft,
  forward: ChevronRight,
  leaf: Leaf,
  bowl: Soup,
  pot: CookingPot,
  pizza: Pizza,
  salad: Salad,
  sandwich: Sandwich,
  sprout: Sprout,
  utensils: UtensilsCrossed,
  cloche: ConciergeBell,
  check: Check,
  clock: Clock,
  question: CircleQuestionMark,
  info: Info,
  phone: Phone,
  mail: Mail,
  globe: Globe,
  navigation: Navigation,
  external: ExternalLink,
  refresh: RotateCcw,
  sort: ArrowUpDown,
  chevronDown: ChevronDown,
  chef: ChefHat,
  close: X,
  eye: Eye,
} as const;

export type IconName = keyof typeof ICONS;

const FILLED = new Set<IconName>(['heartFilled', 'star']);

export function AppIcon({
  name,
  size = 18,
  color = '#172126',
  filled,
  strokeWidth = 2,
  style,
}: {
  name: IconName;
  size?: number;
  color?: string;
  filled?: boolean;
  strokeWidth?: number;
  style?: TextStyle;
}) {
  const Cmp = ICONS[name];
  const useFill = filled ?? FILLED.has(name);
  return (
    <Cmp
      size={size}
      color={color}
      fill={useFill ? color : 'transparent'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style as never}
    />
  );
}
