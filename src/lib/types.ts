// Shared types for Web2App Studio

export interface TemplateConfiguration {
  windowStyle: 'normal' | 'menuBar' | 'sidebar';
  windowWidth: number;
  windowHeight: number;
  tabbedBrowsing: boolean;
  notifications: boolean;
  internalLinkBehavior: 'sameWindow' | 'newTab';
  externalLinkBehavior: 'systemBrowser' | 'newTab';
  cookiePolicy: 'persistent' | 'session';
  userAgent: 'default' | 'chrome' | 'safari';
  adBlocking: 'disabled' | 'basic' | 'advanced';
}

export interface TemplateMetadata {
  version: string;
  author: string;
  lastUpdated: string;
  tier: number;
  tags: string[];
}

export type IconShape = 'circular' | 'rounded' | 'square';

export interface Template {
  id: string;
  name: string;
  url: string;
  category: string;
  icon: string;
  iconColor: string;
  iconBackground: string;
  iconUrl?: string;      // URL or path to icon image (e.g., "icons/notion.png")
  iconShape?: IconShape; // Shape for the icon display
  description: string;
  configuration: TemplateConfiguration;
  metadata: TemplateMetadata;
}

// Icon shape corner radius mapping (based on 256px icon size)
export const ICON_SHAPE_RADIUS: Record<IconShape, number> = {
  circular: 128,  // 50% for perfect circle
  rounded: 56,    // ~22% (macOS standard)
  square: 0,
};

// Category configuration - matches Swift AppCategoryConfiguration
export interface CategoryConfiguration {
  windowStyle: 'normal' | 'menuBar' | 'sidebar';
  windowPreset: 'phone' | 'tablet' | 'desktop' | 'fullHD' | 'fourK' | 'custom';
  windowWidth: number | null;  // null = use preset default
  windowHeight: number | null;
  tabbedBrowsing: boolean;
  notifications: boolean;
  internalLinkBehavior: 'sameWindow' | 'newTab' | 'systemBrowser';
  externalLinkBehavior: 'sameWindow' | 'newTab' | 'systemBrowser';
  cookiePersistence: boolean;
  adBlocking: boolean;
  userAgent: 'default' | 'chrome' | 'safari' | null;
  allowMicrophone: boolean | null;
  allowCamera: boolean | null;
}

export interface Category {
  id: string;
  name: string;
  icon: string;           // SF Symbol name (e.g., "chart.bar.fill")
  emoji: string;          // Emoji fallback (e.g., "📋")
  shortDescription: string;  // Brief label (e.g., "Work & Tasks")
  fullDescription: string;   // Detailed description with examples
  description: string;       // Legacy field for manifest compatibility
  templateCount: number;
  configuration: CategoryConfiguration;
}

// Response from /api/categories endpoint
export interface CategoriesResponse {
  version: string;
  lastUpdated: string;
  categories: Category[];
}

// Window preset dimensions (matches Swift WindowPreset)
export const WINDOW_PRESETS: Record<string, { width: number; height: number }> = {
  phone: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1200, height: 800 },
  fullHD: { width: 1920, height: 1080 },
  fourK: { width: 3840, height: 2160 },
  custom: { width: 1200, height: 800 },
};

// Default category configuration
export const DEFAULT_CATEGORY_CONFIG: CategoryConfiguration = {
  windowStyle: 'normal',
  windowPreset: 'desktop',
  windowWidth: null,
  windowHeight: null,
  tabbedBrowsing: true,
  notifications: true,
  internalLinkBehavior: 'sameWindow',
  externalLinkBehavior: 'systemBrowser',
  cookiePersistence: true,
  adBlocking: false,
  userAgent: null,
  allowMicrophone: null,
  allowCamera: null,
};

export interface Manifest {
  version: string;
  lastUpdated: string;
  categories: Category[];
  featuredTemplates: string[];
}

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
}

export interface AdminSession {
  user: GitHubUser;
  accessToken: string;
  expiresAt: number;
}

// Default template configuration
export const DEFAULT_TEMPLATE_CONFIG: TemplateConfiguration = {
  windowStyle: 'normal',
  windowWidth: 1200,
  windowHeight: 800,
  tabbedBrowsing: true,
  notifications: true,
  internalLinkBehavior: 'newTab',
  externalLinkBehavior: 'systemBrowser',
  cookiePolicy: 'persistent',
  userAgent: 'default',
  adBlocking: 'basic',
};

// Category colors for UI
export const CATEGORY_COLORS: Record<string, string> = {
  productivity: '#22c55e',
  communication: '#14b8a6',
  media: '#f97316',
  design: '#6366f1',
  developer: '#06b6d4',
  finance: '#a855f7',
  social: '#ec4899',
  news: '#3b82f6',
  shopping: '#f59e0b',
  education: '#8b5cf6',
  utilities: '#64748b',
  gaming: '#ef4444',
};

export const CATEGORIES = [
  'productivity',
  'communication',
  'media',
  'social',
  'developer',
  'finance',
  'news',
  'shopping',
  'design',
  'education',
  'utilities',
  'gaming',
] as const;

export type CategoryId = typeof CATEGORIES[number];
