import {
  Home as HomeIcon,
  Search,
  Library,
  Sparkles,
  Users,
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'home', icon: HomeIcon, label: 'Dashboard' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'library', icon: Library, label: 'My Library' },
  { id: 'ai', icon: Sparkles, label: 'AI Assistant' },
  { id: 'community', icon: Users, label: 'Community' },
] as const;

export const RATING_LABELS: Record<number, string> = {
  1: 'Disappointing',
  2: 'Not for me',
  3: 'It was okay',
  4: 'Great Read',
  5: 'Masterpiece',
};

export const PAGE_TITLES: Record<string, string> = {
  home: 'Welcome back',
  search: 'Discover',
  library: 'Your Collection',
  ai: 'AI Companion',
  community: 'Community Insights',
};

export const PAGE_SUBTITLES: Record<string, string> = {
  home: "Here's what's happening in your library today.",
  search: 'Find your next favorite story.',
};

export type TabId = (typeof NAV_ITEMS)[number]['id'];
