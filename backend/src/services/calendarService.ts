import { createEvents, type EventAttributes } from "ics";
import { prisma } from "../db/prisma";

function toIcsDate(date: Date): [number, number, number] {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()];
}

function makeEvent(
  title: string,
  date: Date | null,
  type: string,
  courseName: string,
  description?: string | null
): EventAttributes | null {
  if (!date) return null;

  return {
    title: `[${courseName}] ${title}`,
    start: toIcsDate(date),
    duration: { hours: 1 },
    description: description ?? type,
    categories: [type, courseName]
  };
}

export async function buildCalendar({
  courseId,
  type
}: {
  courseId?: string;
  type?: string;
}) {
  const where = courseId ? { courseId } : {};
  const [assignments, exams, presentations] = await Promise.all([
    type && type !== "assignments" && type !== "all"
      ? []
      : prisma.assignment.findMany({ where, include: { course: true } }),
    type && type !== "exams" && type !== "events" && type !== "all"
      ? []
      : prisma.exam.findMany({ where, include: { course: true } }),
    type && type !== "presentations" && type !== "events" && type !== "all"
      ? []
      : prisma.presentation.findMany({ where, include: { course: true } })
  ]);

  const events = [
    ...assignments.map((item) =>
      makeEvent(
        item.title,
        item.dueDate,
        "assignment",
        item.course.courseName,
        item.description
      )
    ),
    ...exams.map((item) =>
      makeEvent(item.title, item.examDate, "exam", item.course.courseName, item.scope)
    ),
    ...presentations.map((item) =>
      makeEvent(
        item.title,
        item.presentationDate,
        "presentation",
        item.course.courseName,
        item.topic
      )
    )
  ].filter(Boolean) as EventAttributes[];

  return new Promise<string>((resolve, reject) => {
    createEvents(events, (error, value) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(value ?? "");
    });
  });
}

