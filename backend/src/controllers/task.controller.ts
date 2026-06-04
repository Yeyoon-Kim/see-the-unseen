import { startOfDay } from "date-fns";
import type { Request, Response } from "express";
import { prisma } from "../db/prisma";
import {
  optionalDate,
  optionalNumber,
  optionalString,
  requireString
} from "./controllerUtils";

function optionalNullableString(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return String(value);
}

function optionalNullableNumber(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const number = Number(value);
  return Number.isNaN(number) ? undefined : number;
}

function taskData(body: Record<string, unknown>) {
  return {
    title: optionalString(body.title),
    status: optionalString(body.status),
    dueDate: optionalDate(body.dueDate),
    priority: optionalNullableString(body.priority),
    tag: optionalNullableString(body.tag),
    completionTotal: optionalNullableNumber(body.completionTotal),
    completionLeft: optionalNullableNumber(body.completionLeft),
    sourceType: optionalString(body.sourceType),
    sortOrder: optionalNumber(body.sortOrder)
  };
}

export async function listTasks(req: Request, res: Response) {
  const tasks = await prisma.task.findMany({
    where: req.query.courseId ? { courseId: String(req.query.courseId) } : undefined,
    include: { course: true },
    orderBy: [{ dueDate: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }]
  });
  res.json(tasks);
}

export async function createTask(req: Request, res: Response) {
  const parsedDueDate = optionalDate(req.body.dueDate);
  const task = await prisma.task.create({
    data: {
      courseId: optionalString(req.body.courseId),
      assignmentId: optionalString(req.body.assignmentId),
      examId: optionalString(req.body.examId),
      presentationId: optionalString(req.body.presentationId),
      readingItemId: optionalString(req.body.readingItemId),
      title: requireString(req.body.title, "title"),
      status: optionalString(req.body.status) ?? "not_started",
      dueDate: parsedDueDate ?? startOfDay(new Date()),
      priority: optionalString(req.body.priority),
      tag: optionalString(req.body.tag),
      completionTotal: optionalNumber(req.body.completionTotal),
      completionLeft: optionalNumber(req.body.completionLeft),
      sourceType: optionalString(req.body.sourceType) ?? "manual",
      sortOrder: optionalNumber(req.body.sortOrder) ?? 0
    },
    include: { course: true }
  });

  res.status(201).json(task);
}

export async function updateTask(req: Request, res: Response) {
  const id = requireString(req.params.id, "id");
  const task = await prisma.task.update({
    where: { id },
    data: taskData(req.body),
    include: { course: true }
  });

  res.json(task);
}

export async function deleteTask(req: Request, res: Response) {
  const id = requireString(req.params.id, "id");
  await prisma.task.delete({ where: { id } });
  res.status(204).send();
}
