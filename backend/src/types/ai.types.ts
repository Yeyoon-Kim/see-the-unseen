export type CourseType = "undergraduate" | "graduate" | "seminar" | "research";
export type Priority = "low" | "medium" | "high";

export interface AiCourse {
  courseName: string;
  professorName?: string;
  semester?: string;
  classTime?: string;
  classroom?: string;
  courseType?: CourseType;
  color?: string;
}

export interface AiAssignment {
  title: string;
  description?: string;
  dueDate?: string;
  submissionFormat?: string;
  priority?: Priority;
}

export interface AiExam {
  title: string;
  examDate?: string;
  scope?: string;
  format?: string;
  weight?: number;
}

export interface AiPresentation {
  title: string;
  presentationDate?: string;
  topic?: string;
  teamMembers?: string;
  myRole?: string;
}

export interface AiReading {
  title: string;
  authors?: string;
  year?: string;
  source?: string;
  dueDate?: string;
}

export interface WeeklyTopic {
  week: number;
  topic: string;
}

export interface SyllabusAnalysis {
  course: AiCourse;
  evaluation?: string;
  attendancePolicy?: string;
  assignments: AiAssignment[];
  exams: AiExam[];
  presentations: AiPresentation[];
  readings: AiReading[];
  weeklyTopics: WeeklyTopic[];
  requiredReadings?: string[];
  recommendedReadings?: string[];
  majorDeadlines?: Array<{ title: string; date?: string; type?: string }>;
}

export interface AssignmentExtraction {
  assignments: AiAssignment[];
}

export interface ChecklistResult {
  checklist: string[];
}

export interface StudyPlanResult {
  studyPlan: string;
  checklist: string[];
}

export interface SummaryResult {
  summary: string;
  tags?: string[];
}

export interface QuestionsResult {
  questions: string[];
  keyConcepts?: string[];
}

