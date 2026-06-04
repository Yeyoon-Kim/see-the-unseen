export type EventCategoryName = string;

export interface EventCategory {
  id: string;
  name: EventCategoryName;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringEvent {
  id: string;
  category: EventCategoryName;
  title: string;
  selectedDays: string[];
  startTime: string;
  endTime: string;
  description?: string;
  location?: string;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const defaultEventCategories = ["일정", "세미나", "회의", "프로젝트", "업무", "개인 일정"];
