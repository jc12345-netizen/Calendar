import { EventCategory } from './types';

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  [EventCategory.WORK]: 'bg-blue-500',
  [EventCategory.PERSONAL]: 'bg-purple-500',
  [EventCategory.HEALTH]: 'bg-green-500',
  [EventCategory.LEARNING]: 'bg-yellow-500',
  [EventCategory.MEETING]: 'bg-orange-500',
  [EventCategory.OTHER]: 'bg-gray-500',
};

export const CATEGORY_BG_COLORS_LIGHT: Record<EventCategory, string> = {
  [EventCategory.WORK]: 'bg-blue-100 text-blue-800',
  [EventCategory.PERSONAL]: 'bg-purple-100 text-purple-800',
  [EventCategory.HEALTH]: 'bg-green-100 text-green-800',
  [EventCategory.LEARNING]: 'bg-yellow-100 text-yellow-800',
  [EventCategory.MEETING]: 'bg-orange-100 text-orange-800',
  [EventCategory.OTHER]: 'bg-gray-100 text-gray-800',
};

export const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
