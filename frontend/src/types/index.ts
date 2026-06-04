export interface Course {
  id: string;
  courseName: string;
  professorName?: string | null;
  semester?: string | null;
  classTime?: string | null;
  classroom?: string | null;
  courseType: "undergraduate" | "graduate" | "seminar" | "research" | string;
  color: string;
  createdAt: string;
  updatedAt: string;
  assignments?: Assignment[];
  exams?: Exam[];
  presentations?: PresentationItem[];
  readings?: ReadingItem[];
  materials?: Material[];
  scheduleItems?: ScheduleItem[];
  tasks?: Task[];
  uploadedFiles?: UploadedFile[];
  notices?: CourseNotice[];
  _count?: Record<string, number>;
}

export interface Task {
  id: string;
  courseId?: string | null;
  assignmentId?: string | null;
  examId?: string | null;
  presentationId?: string | null;
  readingItemId?: string | null;
  title: string;
  status: string;
  dueDate?: string | null;
  priority?: string | null;
  tag?: string | null;
  completionTotal?: number | null;
  completionLeft?: number | null;
  sourceType?: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  course?: Course;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  submissionFormat?: string | null;
  priority?: string | null;
  tag?: string | null;
  completionTotal?: number | null;
  completionLeft?: number | null;
  status: "not_started" | "in_progress" | "completed" | string;
  sourceType: string;
  createdAt: string;
  updatedAt: string;
  course?: Course;
  tasks?: Task[];
}

export interface Exam {
  id: string;
  courseId: string;
  title: string;
  examDate?: string | null;
  scope?: string | null;
  format?: string | null;
  weight?: number | null;
  studyPlan?: string | null;
  status: string;
  course?: Course;
  tasks?: Task[];
}

export interface PresentationItem {
  id: string;
  courseId: string;
  title: string;
  presentationDate?: string | null;
  topic?: string | null;
  teamMembers?: string | null;
  myRole?: string | null;
  checklist?: string | null;
  status: string;
  course?: Course;
  tasks?: Task[];
}

export interface ReadingItem {
  id: string;
  courseId: string;
  title: string;
  authors?: string | null;
  year?: string | null;
  source?: string | null;
  dueDate?: string | null;
  readingStatus: string;
  summary?: string | null;
  keyQuestions?: string | null;
  notes?: string | null;
  course?: Course;
  tasks?: Task[];
}

export interface Material {
  id: string;
  courseId: string;
  title: string;
  fileName?: string | null;
  fileType?: string | null;
  uploadedAt: string;
  aiSummary?: string | null;
  tags?: string | null;
  course?: Course;
}

export interface ScheduleItem {
  id: string;
  courseId: string;
  title: string;
  type: string;
  startsAt?: string | null;
  endsAt?: string | null;
  description?: string | null;
}

export interface UploadedFile {
  id: string;
  courseId?: string | null;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  sourceType: string;
  createdAt: string;
}

export interface CourseNotice {
  id: string;
  courseId: string;
  title: string;
  body?: string | null;
  sourceType: string;
  extractedText?: string | null;
  uploadedFileId?: string | null;
  postedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  course?: Course;
}

export interface SyllabusAnalysis {
  course: Partial<Course>;
  evaluation?: string;
  attendancePolicy?: string;
  assignments: Array<Partial<Assignment>>;
  exams: Array<Partial<Exam>>;
  presentations: Array<Partial<PresentationItem>>;
  readings: Array<Partial<ReadingItem>>;
  weeklyTopics: Array<{ week: number; topic: string }>;
  requiredReadings?: string[];
  recommendedReadings?: string[];
  majorDeadlines?: Array<{ title: string; date?: string; type?: string }>;
}
