import type { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { AppError } from "../middleware/errorHandler";
import { generateAssignmentChecklist } from "../services/aiService";
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

function assignmentData(body: Record<string, unknown>) {
  return {
    courseId: optionalString(body.courseId),
    title: optionalString(body.title),
    description: optionalString(body.description),
    dueDate: optionalDate(body.dueDate),
    submissionFormat: optionalString(body.submissionFormat),
    priority: optionalNullableString(body.priority),
    tag: optionalNullableString(body.tag),
    completionTotal: optionalNullableNumber(body.completionTotal),
    completionLeft: optionalNullableNumber(body.completionLeft),
    status: optionalString(body.status),
    sourceType: optionalString(body.sourceType)
  };
}

export async function listAssignments(req: Request, res: Response) {
  const assignments = await prisma.assignment.findMany({
    where: req.query.courseId ? { courseId: String(req.query.courseId) } : undefined,
    include: { course: true, tasks: { orderBy: { sortOrder: "asc" } } },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }]
  });
  res.json(assignments);
}

export async function createAssignment(req: Request, res: Response) {
  const courseId = requireString(req.body.courseId, "courseId");
  const assignment = await prisma.assignment.create({
    data: {
      courseId,
      title: requireString(req.body.title, "title"),
      description: optionalString(req.body.description),
      dueDate: optionalDate(req.body.dueDate),
      submissionFormat: optionalString(req.body.submissionFormat),
      priority: optionalString(req.body.priority) ?? "medium",
      tag: optionalString(req.body.tag),
      completionTotal: optionalNumber(req.body.completionTotal),
      completionLeft: optionalNumber(req.body.completionLeft),
      status: optionalString(req.body.status) ?? "not_started",
      sourceType: optionalString(req.body.sourceType) ?? "manual"
    }
  });

  if (assignment.dueDate) {
    await prisma.scheduleItem.create({
      data: {
        courseId,
        title: assignment.title,
        type: "assignment",
        startsAt: assignment.dueDate,
        description: assignment.description,
        sourceModel: "Assignment",
        sourceId: assignment.id
      }
    });
  }

  res.status(201).json(assignment);
}

export async function updateAssignment(req: Request, res: Response) {
  const id = requireString(req.params.id, "id");
  const data = assignmentData(req.body);
  const assignment = await prisma.assignment.update({
    where: { id },
    data
  });

  await prisma.scheduleItem.deleteMany({
    where: { sourceModel: "Assignment", sourceId: assignment.id }
  });
  if (assignment.dueDate) {
    await prisma.scheduleItem.create({
      data: {
        courseId: assignment.courseId,
        title: assignment.title,
        type: "assignment",
        startsAt: assignment.dueDate,
        description: assignment.description,
        sourceModel: "Assignment",
        sourceId: assignment.id
      }
    });
  }

  res.json(assignment);
}

export async function deleteAssignment(req: Request, res: Response) {
  const id = requireString(req.params.id, "id");
  await prisma.scheduleItem.deleteMany({
    where: { sourceModel: "Assignment", sourceId: id }
  });
  await prisma.assignment.delete({ where: { id } });
  res.status(204).send();
}

export async function generateChecklist(req: Request, res: Response) {
  const id = requireString(req.params.id, "id");
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: { course: true }
  });
  if (!assignment) throw new AppError(404, "과제를 찾을 수 없습니다.");

  const result = await generateAssignmentChecklist(assignment);
  await prisma.task.deleteMany({ where: { assignmentId: assignment.id } });
  const tasks = await Promise.all(
    result.checklist.map((title, index) =>
      prisma.task.create({
        data: {
          courseId: assignment.courseId,
          assignmentId: assignment.id,
          title,
          dueDate: assignment.dueDate,
          sortOrder: index
        }
      })
    )
  );

  res.json({ checklist: result.checklist, tasks });
}
