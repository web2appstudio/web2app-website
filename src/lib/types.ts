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

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  templateCount: number;
}

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
};

export const CATEGORIES = [
  'productivity',
  'communication',
  'media',
  'design',
  'developer',
  'finance',
  'social',
  'news',
] as const;

export type CategoryId = typeof CATEGORIES[number];
