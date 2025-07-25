'use client'

import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import {
  // Core Navigation & Actions
  Home,
  Settings,
  User,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
  Search,
  Filter,
  MoreHorizontal,
  MoreVertical,
  
  // AI & Generation Specific
  Sparkles,
  Wand2,
  Brain,
  Cpu,
  Zap,
  Target,
  Layers,
  Palette,
  Image,
  Camera,
  Video,
  Mic,
  Volume2,
  
  // File & Media
  Upload,
  Download,
  Save,
  Copy,
  Share,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  FileImage,
  FolderOpen,
  Archive,
  Send,
  
  // UI & Interaction
  Heart,
  Star,
  Bookmark,
  ThumbsUp,
  MessageSquare,
  Bell,
  Clock,
  Calendar,
  Globe,
  Lock,
  Unlock,
  Shield,
  Monitor,
  DollarSign,
  Square,
  Tag,
  Key,

  // Status & Feedback
  Check,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  Loader2,
  RefreshCw,
  Lightbulb,
  Expand,
  ArrowUp,
  ArrowDown,
  
  // Layout & Organization
  Grid,
  List,
  Columns,
  Sidebar,
  Maximize,
  Minimize,
  Move,
  // Resize, // Not available in current Lucide version
  
  // Social & Sharing
  Link,
  ExternalLink,
  Mail,
  Phone,
  Github,
  Twitter,
  
  // Advanced Features
  Sliders,
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  Database,
  Server,
  Cloud,
  
  type LucideIcon,
} from 'lucide-react'

// Premium Icon Wrapper with Enhanced Styling
const premiumIconVariants = cva(
  "inline-flex items-center justify-center transition-all duration-200 ease-out",
  {
    variants: {
      variant: {
        default: "text-text-secondary",
        primary: "text-primary-500",
        secondary: "text-text-tertiary",
        muted: "text-text-muted",
        accent: "text-gradient",
        success: "text-success-500",
        warning: "text-warning-500",
        error: "text-error-500",
        glass: "text-text-primary drop-shadow-sm",
      },
      size: {
        xs: "w-3 h-3",
        sm: "w-4 h-4", 
        md: "w-5 h-5",
        lg: "w-6 h-6",
        xl: "w-8 h-8",
        "2xl": "w-10 h-10",
      },
      animation: {
        none: "",
        pulse: "animate-pulse",
        spin: "animate-spin",
        bounce: "animate-bounce",
        hover: "hover:scale-110 hover:text-primary-400",
        glow: "hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]",
      },
      background: {
        none: "",
        subtle: "bg-surface-glass/50 rounded-lg p-1",
        glass: "glass-effect rounded-xl p-2",
        primary: "bg-primary-500/20 text-primary-300 rounded-xl p-2",
        circle: "bg-surface-glass rounded-full p-2",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      animation: "none",
      background: "none",
    },
  }
)

export interface PremiumIconProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof premiumIconVariants> {
  icon: LucideIcon
  strokeWidth?: number
}

const PremiumIcon = forwardRef<HTMLDivElement, PremiumIconProps>(
  ({ className, variant, size, animation, background, icon: Icon, strokeWidth = 2, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(premiumIconVariants({ variant, size, animation, background }), className)}
        {...props}
      >
        <Icon strokeWidth={strokeWidth} className="w-full h-full" />
      </div>
    )
  }
)
PremiumIcon.displayName = "PremiumIcon"

// Predefined Premium Icon Components for Common Use Cases
export const Icons = {
  // Navigation & Core
  dashboard: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Home} {...props} />,
  generator: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Sparkles} {...props} />,
  gallery: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Image} {...props} />,
  prompts: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={FileImage} {...props} />,
  settings: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Settings} {...props} />,
  menu: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Menu} {...props} />,
  close: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={X} {...props} />,
  
  // AI & Generation
  sparkles: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Sparkles} {...props} />,
  magicWand: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Wand2} {...props} />,
  magic: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Wand2} {...props} />,
  brain: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Brain} {...props} />,
  cpu: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Cpu} {...props} />,
  zap: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Zap} {...props} />,
  target: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Target} {...props} />,
  layers: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Layers} {...props} />,
  palette: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Palette} {...props} />,
  lightbulb: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Lightbulb} {...props} />,

  // Media
  image: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Image} {...props} />,
  video: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Video} {...props} />,
  
  // Actions
  upload: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Upload} {...props} />,
  download: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Download} {...props} />,
  save: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Save} {...props} />,
  copy: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Copy} {...props} />,
  share: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Share} {...props} />,
  delete: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Trash2} {...props} />,
  edit: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Edit} {...props} />,
  send: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Send} {...props} />,
  
  // Status & Feedback
  check: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Check} {...props} />,
  checkCircle: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={CheckCircle} {...props} />,
  alert: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={AlertCircle} {...props} />,
  warning: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={AlertTriangle} {...props} />,
  info: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Info} {...props} />,
  help: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={HelpCircle} {...props} />,
  loading: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Loader2} animation="spin" {...props} />,
  refresh: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={RefreshCw} {...props} />,
  
  // Layout & Organization
  grid: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Grid} {...props} />,
  list: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={List} {...props} />,
  columns: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Columns} {...props} />,
  sidebar: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Sidebar} {...props} />,
  maximize: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Maximize} {...props} />,
  minimize: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Minimize} {...props} />,
  
  // Navigation
  chevronDown: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={ChevronDown} {...props} />,
  chevronUp: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={ChevronUp} {...props} />,
  chevronLeft: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={ChevronLeft} {...props} />,
  chevronRight: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={ChevronRight} {...props} />,
  arrowLeft: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={ArrowLeft} {...props} />,
  arrowRight: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={ArrowRight} {...props} />,
  
  // Advanced
  sliders: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Sliders} {...props} />,
  chart: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={BarChart3} {...props} />,
  trending: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={TrendingUp} {...props} />,
  activity: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Activity} {...props} />,
  
  // Social & External
  link: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Link} {...props} />,
  externalLink: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={ExternalLink} {...props} />,
  github: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Github} {...props} />,
  
  // Utility
  search: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Search} {...props} />,
  filter: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Filter} {...props} />,
  more: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={MoreHorizontal} {...props} />,
  moreVertical: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={MoreVertical} {...props} />,
  plus: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Plus} {...props} />,
  minus: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Minus} {...props} />,
  star: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Star} {...props} />,
  expand: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Expand} {...props} />,
  loader: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Loader2} animation="spin" {...props} />,
  sortAsc: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={ArrowUp} {...props} />,
  database: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Database} {...props} />,
  cloud: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Cloud} {...props} />,
  sortDesc: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={ArrowDown} {...props} />,
  monitor: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Monitor} {...props} />,
  dollar: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={DollarSign} {...props} />,
  clock: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Clock} {...props} />,
  folder: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={FolderOpen} {...props} />,
  heart: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Heart} {...props} />,
  eye: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Eye} {...props} />,
  trash: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Trash2} {...props} />,
  square: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Square} {...props} />,
  tag: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Tag} {...props} />,
  user: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={User} {...props} />,
  key: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Key} {...props} />,
  eyeOff: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={EyeOff} {...props} />,
  bell: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Bell} {...props} />,
  shield: (props: Omit<PremiumIconProps, 'icon'>) => <PremiumIcon icon={Shield} {...props} />,
}

export { PremiumIcon, premiumIconVariants }
