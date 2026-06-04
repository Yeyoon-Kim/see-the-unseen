import {
  addDays,
  endOfDay,
  isAfter,
  isBefore,
  isSameDay,
  startOfDay
} from "date-fns";
import { prisma } from "../db/prisma";

function isDueWithin(date: Date | null, days: number) {
  if (!date) return false;
  const now = startOfDay(new Date());
  return (
    (isSameDay(date, now) || isAfter(date, now)) &&
    isBefore(date, endOfDay(addDays(now, days)))
  );
}

function matchesTodayClass(classTime?: string | null) {
  if (!classTime) return false;
  const dayTokensByIndex = [
    ["Sun", "Sunday", "일"],
    ["Mon", "Monday", "월"],
    ["Tue", "Tuesday", "화"],
    ["Wed", "Wednesday", "수"],
    ["Thu", "Thursday", "목"],
    ["Fri", "Friday", "금"],
    ["Sat", "Saturday", "토"]
  ];
  const day = new Date().getDay();
  const todayLabel = dayTokensByIndex[day][2];

  try {
    const parsed = JSON.parse(classTime) as { selectedDays?: unknown };
    if (Array.isArray(parsed.selectedDays)) {
      return parsed.selectedDays.map(String).includes(todayLabel);
    }
  } catch {
    // Older schedules were plain strings, so keep the text-based fallback.
  }

  const tokens = dayTokensByIndex[day];
  return tokens.some((token) => classTime.toLowerCase().includes(token.toLowerCase()));
}

export async function getDashboardData() {
  const [courses, assignments, exams, presentations, readings, tasks] =
    await Promise.all([
      prisma.course.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.assignment.findMany({
        include: { course: true },
        orderBy: { dueDate: "asc" }
      }),
      prisma.exam.findMany({ include: { course: true }, orderBy: { examDate: "asc" } }),
      prisma.presentation.findMany({
        include: { course: true },
        orderBy: { presentationDate: "asc" }
      }),
      prisma.readingItem.findMany({
        include: { course: true },
        orderBy: { dueDate: "asc" }
      }),
      prisma.task.findMany({
        include: { course: true },
        orderBy: { dueDate: "asc" }
      })
    ]);

  const today = new Date();
  const todayStart = startOfDay(today);
  const todayClasses = courses.filter((course) => matchesTodayClass(course.classTime));
  const todayTasks = [
    ...assignments.filter(
      (item) =>
        item.dueDate &&
        item.status !== "completed" &&
        (isSameDay(item.dueDate, today) || isBefore(item.dueDate, todayStart))
    ).map((item) => ({
      ...item,
      itemType: "assignment",
      carryoverLabel: item.dueDate && isBefore(item.dueDate, todayStart) ? "어제 미완료" : null
    })),
    ...tasks.filter(
      (item) =>
        item.dueDate &&
        (isSameDay(item.dueDate, today) ||
          (item.status !== "completed" && isBefore(item.dueDate, todayStart)))
    ).map((item) => ({
      ...item,
      itemType: "task",
      carryoverLabel:
        item.status !== "completed" && item.dueDate && isBefore(item.dueDate, todayStart)
          ? "어제 미완료"
          : null
    }))
  ].sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (a.status !== "completed" && b.status === "completed") return -1;
    const aOrder = "sortOrder" in a ? a.sortOrder : 0;
    const bOrder = "sortOrder" in b ? b.sortOrder : 0;
    return aOrder - bOrder;
  });

  const upcomingDeadlines = [
    ...assignments
      .filter((item) => item.status !== "completed" && isDueWithin(item.dueDate, 14))
      .map((item) => ({ ...item, itemType: "assignment" })),
    ...readings
      .filter((item) => item.readingStatus !== "discussed" && isDueWithin(item.dueDate, 14))
      .map((item) => ({ ...item, itemType: "reading" }))
  ].sort((a, b) => {
    const aDate = a.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bDate = b.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return aDate - bDate;
  });

  const weekEvents = [
    ...exams
      .filter((item) => isDueWithin(item.examDate, 7))
      .map((item) => ({ ...item, itemType: "exam" })),
    ...presentations
      .filter((item) => isDueWithin(item.presentationDate, 7))
      .map((item) => ({ ...item, itemType: "presentation" }))
  ];

  const riskAlerts = assignments
    .filter((item) => item.status !== "completed" && isDueWithin(item.dueDate, 3))
    .map((item) => ({
      id: item.id,
      title: item.title,
      courseName: item.course.courseName,
      dueDate: item.dueDate,
      priority: item.priority
    }));

  const deadlineItems = [
    ...assignments.map((item) => ({
      id: item.id,
      title: item.title,
      type: "assignment",
      date: item.dueDate,
      status: item.status,
      priority: item.priority,
      course: item.course
    })),
    ...exams.map((item) => ({
      id: item.id,
      title: item.title,
      type: "exam",
      date: item.examDate,
      status: item.status,
      priority: "high",
      course: item.course
    })),
    ...presentations.map((item) => ({
      id: item.id,
      title: item.title,
      type: "presentation",
      date: item.presentationDate,
      status: item.status,
      priority: "high",
      course: item.course
    })),
    ...readings.map((item) => ({
      id: item.id,
      title: item.title,
      type: "reading",
      date: item.dueDate,
      status: item.readingStatus,
      priority: "medium",
      course: item.course
    }))
  ]
    .filter((item) => item.date)
    .sort((a, b) => {
      const aDate = a.date?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bDate = b.date?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aDate - bDate;
    });

  return {
    todayClasses,
    todayTasks,
    upcomingDeadlines,
    weekEvents,
    readingsToRead: readings.filter((item) => item.readingStatus !== "discussed").slice(0, 8),
    riskAlerts,
    deadlineItems
  };
}
