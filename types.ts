export enum EventCategory {
  WORK = 'Work',
  PERSONAL = 'Personal',
  HEALTH = 'Health',
  LEARNING = 'Learning',
  MEETING = 'Meeting',
  OTHER = 'Other'
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  category: EventCategory;
}

export interface AnalyticsData {
  summary: string;
  productivityScore: number;
  moodEmoji: string;
  suggestions: string[];
  categoryBreakdown: Record<string, number>; // Category name -> hours
}

export type ViewMode = 'calendar' | 'analytics';
export type AnalyticsPeriod = 'day' | 'week';
