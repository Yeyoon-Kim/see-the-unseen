import type { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { AppError } from "../middleware/errorHandler";
import { generatePresentationChecklist } from "../services/aiService";
import {
  jsonString,
  optionalDate,
  optionalString,
  requireString
} from "./controllerUtils";

export async function listPresentations(req: Request, res: Response) {
  const presentations = await prisma.presentation.findMany({
    where: req.query.courseId ? { courseId: String(req.query.courseId) } : undefined,
    include: { course: true, tasks: { orderBy: { sortOrder: "asc" } } },
    orderBy: [{ presentationDate: "asc" }, { createdAt: "desc" }]
  });
  res.json(presentations);
}

export async function createPresentation(req: Request, res: Response) {
  const courseId = requireString(req.body.courseId, "courseId");
  const presentation = await prisma.presentation.create({
    data: {
      courseId,
      title: requireString(req.body.title, "title"),
      presentationDate: optionalDate(req.body.presentationDate),
      topic: optionalString(req.body.topic),
      teamMembers: optionalString(req.body.teamMembers),
      myRole: optionalString(req.body.myRole),
      checklist: jsonString(req.body.checklist),
      status: optionalString(req.body.status) ?? "not_started"
    }
  });

  if (presentation.presentationDate) {
    await prisma.scheduleItem.create({
      data: {
        courseId,
        title: presentation.title,
        type: "presentation",
        startsAt: presentation.presentationDate,
        description: presentation.topic,
        sourceModel: "Presentation",
        sourceId: presentation.id
      }
    });
  }

  res.status(201).json(presentation);
}

export async function updatePresentation(req: Request, res: Response) {
  const id = requireString(req.params.id, "id");
  const presentation = await prisma.presentation.update({
    where: { id },
    data: {
      courseId: optionalString(req.body.courseId),
      title: optionalString(req.body.title),
      presentationDate: optionalDate(req.body.presentationDate),
      topic: optionalString(req.body.topic),
      teamMembers: optionalString(req.body.teamMembers),
      myRole: optionalString(req.body.myRole),
      checklist: jsonString(req.body.checklist),
      status: optionalString(req.body.status)
    }
  });

  await prisma.scheduleItem.deleteMany({
    where: { sourceModel: "Presentation", sourceId: presentation.id }
  });
  if (presentation.presentationDate) {
    await prisma.scheduleItem.create({
      data: {
        courseId: presentation.courseId,
        title: presentation.title,
        type: "presentation",
        startsAt: presentation.presentationDate,
        description: presentation.topic,
        sourceModel: "Presentation",
        sourceId: presentation.id
      }
    });
  }

  res.json(presentation);
}

export async function deletePresentation(req: Request, res: Response) {
  const id = requireString(req.params.id, "id");
  await prisma.scheduleItem.deleteMany({
    where: { sourceModel: "Presentation", sourceId: id }
  });
  await prisma.presentation.delete({ where: { id } });
  res.status(204).send();
}

export async function generatePresentationTasks(req: Request, res: Response) {
  const id = requireString(req.params.id, "id");
  const presentation = await prisma.presentation.findUnique({
    where: { id },
    include: { course: true }
  });
  if (!presentation) throw new AppError(404, "발표를 찾을 수 없습니다.");

  const result = await generatePresentationChecklist(presentation);
  const updated = await prisma.presentation.update({
    where: { id: presentation.id },
    data: { checklist: JSON.stringify(result.checklist) }
  });

  await prisma.task.deleteMany({ where: { presentationId: presentation.id } });
  const tasks = await Promise.all(
    result.checklist.map((title, index) =>
      prisma.task.create({
        data: {
          courseId: presentation.courseId,
          presentationId: presentation.id,
          title,
          dueDate: presentation.presentationDate,
          sortOrder: index
        }
      })
    )
  );

  res.json({ presentation: updated, checklist: result.checklist, tasks });
}
