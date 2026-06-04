import OpenAI from "openai";
import { env } from "../config/env";
import type {
  AssignmentExtraction,
  ChecklistResult,
  QuestionsResult,
  StudyPlanResult,
  SummaryResult,
  SyllabusAnalysis
} from "../types/ai.types";

let client: OpenAI | null = null;

function getClient() {
  if (!env.openAiApiKey) return null;
  if (!client) {
    client = new OpenAI({ apiKey: env.openAiApiKey });
  }
  return client;
}

async function callJson<T>(prompt: string, fallback: T): Promise<T> {
  const openai = getClient();
  if (!openai) return fallback;

  try {
    const completion = await openai.chat.completions.create({
      model: env.openAiModel,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You extract planning and schedule-management data. Return valid JSON only. Use ISO date strings when dates are present. Never include markdown."
        },
        { role: "user", content: prompt }
      ]
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return fallback;
    return JSON.parse(content) as T;
  } catch (error) {
    console.warn("OpenAI call failed, using mock response.", error);
    return fallback;
  }
}

export const mockSyllabusAnalysis: SyllabusAnalysis = {
  course: {
    courseName: "Introduction to Linguistics",
    professorName: "Professor Kim",
    semester: "2026 Spring",
    classTime: "Mon/Wed 10:30-12:00",
    classroom: "Building A 301",
    courseType: "undergraduate",
    color: "#5E6B73"
  },
  evaluation: "Attendance 10%, Assignments 30%, Midterm 30%, Final 30%",
  attendancePolicy: "Attendance affects 10% of the final grade.",
  assignments: [
    {
      title: "Final Essay",
      description: "Write a 3000-word essay on a course topic.",
      dueDate: "2026-06-20",
      submissionFormat: "PDF upload",
      priority: "high"
    },
    {
      title: "Weekly Response Note",
      description: "Submit a one-page response to the assigned reading.",
      dueDate: "2026-06-10",
      submissionFormat: "Online text submission",
      priority: "medium"
    }
  ],
  exams: [
    {
      title: "Midterm Exam",
      examDate: "2026-04-15",
      scope: "Weeks 1-7",
      format: "Written exam",
      weight: 30
    },
    {
      title: "Final Exam",
      examDate: "2026-06-24",
      scope: "Weeks 8-14",
      format: "Written exam",
      weight: 30
    }
  ],
  presentations: [
    {
      title: "Group Presentation",
      presentationDate: "2026-06-12",
      topic: "Language and Society",
      teamMembers: "",
      myRole: ""
    }
  ],
  readings: [
    {
      title: "Course Reading Week 1",
      authors: "Saussure",
      year: "1916",
      source: "Course packet",
      dueDate: "2026-03-10"
    }
  ],
  weeklyTopics: [
    { week: 1, topic: "Introduction" },
    { week: 2, topic: "Phonetics and Phonology" },
    { week: 3, topic: "Morphology" },
    { week: 4, topic: "Syntax" }
  ],
  requiredReadings: ["Course Reading Week 1"],
  recommendedReadings: ["Selected journal articles"],
  majorDeadlines: [
    { title: "Final Essay", date: "2026-06-20", type: "assignment" },
    { title: "Final Exam", date: "2026-06-24", type: "exam" }
  ]
};

export async function analyzeSyllabus(text: string) {
  return callJson<SyllabusAnalysis>(
    `Analyze this syllabus and return the exact JSON shape requested by the app:
{
  "course": {"courseName": "", "professorName": "", "semester": "", "classTime": "", "classroom": "", "courseType": "undergraduate", "color": "#5E6B73"},
  "evaluation": "",
  "attendancePolicy": "",
  "assignments": [{"title": "", "description": "", "dueDate": "YYYY-MM-DD", "submissionFormat": "", "priority": "medium"}],
  "exams": [{"title": "", "examDate": "YYYY-MM-DD", "scope": "", "format": "", "weight": 0}],
  "presentations": [{"title": "", "presentationDate": "YYYY-MM-DD", "topic": "", "teamMembers": "", "myRole": ""}],
  "readings": [{"title": "", "authors": "", "year": "", "source": "", "dueDate": "YYYY-MM-DD"}],
  "weeklyTopics": [{"week": 1, "topic": ""}],
  "requiredReadings": [],
  "recommendedReadings": [],
  "majorDeadlines": [{"title": "", "date": "YYYY-MM-DD", "type": ""}]
}

Syllabus text:
${text}`,
    mockSyllabusAnalysis
  );
}

export async function extractAssignments(text: string) {
  return callJson<AssignmentExtraction>(
    `Extract assignment notices from this text. Return {"assignments":[{"title":"","description":"","dueDate":"YYYY-MM-DD","submissionFormat":"","priority":"medium"}]}.

Notice:
${text}`,
    {
      assignments: [
        {
          title: "프랑스어 작문 제출",
          description: "공지에서 추출된 작문 과제입니다.",
          dueDate: "2026-06-08",
          submissionFormat: "PDF upload",
          priority: "high"
        }
      ]
    }
  );
}

export async function extractScheduleItems(text: string) {
  return callJson(
    `Extract dated schedule items from this text. Return {"items":[{"title":"","date":"YYYY-MM-DD","type":"assignment|exam|presentation|reading|manual","description":""}]}.
${text}`,
    { items: [] }
  );
}

export async function generateStudyPlan(examInfo: unknown) {
  return callJson<StudyPlanResult>(
    `Create a practical study plan and checklist for this exam. Return {"studyPlan":"","checklist":[]}.
${JSON.stringify(examInfo)}`,
    {
      studyPlan:
        "시험 범위를 세 구간으로 나누고, 남은 기간 동안 개념 정리, 문제 풀이, 오답 복습을 순서대로 진행합니다.",
      checklist: [
        "시험 범위 확인",
        "주차별 핵심 개념 정리",
        "자료 1회독",
        "예상 문제 풀이",
        "오답 노트 작성",
        "시험 전날 최종 복습"
      ]
    }
  );
}

export async function generateAssignmentChecklist(assignmentInfo: unknown) {
  return callJson<ChecklistResult>(
    `Break this assignment into actionable tasks. Return {"checklist":[]}.
${JSON.stringify(assignmentInfo)}`,
    {
      checklist: [
        "요구사항 확인",
        "주제와 제출 형식 확인",
        "초안 작성",
        "자료 보강",
        "문법과 형식 검토",
        "최종본 작성",
        "제출"
      ]
    }
  );
}

export async function generatePresentationChecklist(presentationInfo: unknown) {
  return callJson<ChecklistResult>(
    `Create a presentation preparation checklist. Return {"checklist":[]}.
${JSON.stringify(presentationInfo)}`,
    {
      checklist: [
        "주제 확정",
        "자료 조사",
        "발표 구조 작성",
        "PPT 초안 제작",
        "대본 작성",
        "리허설",
        "최종 제출"
      ]
    }
  );
}

export async function summarizeMaterial(text: string) {
  return callJson<SummaryResult>(
    `Summarize this uploaded material. Return {"summary":"","tags":[]}.
${text}`,
    {
      summary:
        "이 자료는 주요 개념, 예시, 준비 과정에 연결될 수 있는 핵심 포인트를 정리한 내용입니다.",
      tags: ["핵심개념", "복습", "준비"]
    }
  );
}

export async function generateReadingQuestions(text: string) {
  return callJson<QuestionsResult>(
    `Generate seminar discussion questions and key concepts. Return {"questions":[],"keyConcepts":[]}.
${text}`,
    {
      questions: [
        "저자가 해결하려는 핵심 문제는 무엇인가?",
        "논문의 주장과 근거는 어떻게 연결되는가?",
        "현재 준비 중인 일정이나 프로젝트와 연결되는 지점은 무엇인가?"
      ],
      keyConcepts: ["연구문제", "방법론", "핵심논지"]
    }
  );
}

export async function generateResearchPlan(readingItems: unknown) {
  return callJson(
    `Create a reading and research plan. Return {"plan":"","milestones":[]}.
${JSON.stringify(readingItems)}`,
    {
      plan: "읽기, 요약, 질문 정리, 세미나 토론 준비 순서로 진행합니다.",
      milestones: ["논문 1회독", "요약 작성", "토론 질문 작성", "발제문 초안"]
    }
  );
}
