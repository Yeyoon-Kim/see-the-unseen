import type { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { AppError } from "../middleware/errorHandler";
import { generateReadingQuestions, summarizeMaterial } from "../services/aiService";
import {
  jsonString,
  optionalDate,
  optionalString,
  requireString
} from "./controllerUtils";

export async function listReadings(req: Request, res: Response) {
  const readings = await prisma.readingItem.findMany({
    where: req.query.courseId ? { courseId: String(req.query.courseId) } : undefined,
    include: { course: true, tasks: { orderBy: { sortOrder: "asc" } } },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }]
  });
  res.json(readings);
}

export async function createReading(req: Request, res: Response) {
  const courseId = requireString(req.body.courseId, "courseId");
  const reading = await prisma.readingItem.create({
    data: {
      courseId,
      title: requireString(req.body.title, "title"),
      authors: optionalString(req.body.authors),
      year: optionalString(req.body.year),
      source: optionalString(req.body.source),
      dueDate: optionalDate(req.body.dueDate),
      readingStatus: optionalString(req.body.readingStatus) ?? "not_started",
      summary: optionalString(req.body.summary),
      keyQuestions: jsonString(req.body.keyQuestions),
      notes: optionalString(req.body.notes)
    }
  });

  if (reading.dueDate) {
    await prisma.scheduleItem.create({
      data: {
        courseId,
        title: reading.title,
        type: "reading",
        startsAt: reading.dueDate,
        description: reading.source,
        sourceModel: "ReadingItem",
        sourceId: reading.id
      }
    });
  }

  res.status(201).json(reading);
}

export async function updateReading(req: Request, res: Response) {
  const id = requireString(req.params.id, "id");
  const reading = await prisma.readingItem.update({
    where: { id },
    data: {
      courseId: optionalString(req.body.courseId),
      title: optionalString(req.body.title),
      authors: optionalString(req.body.authors),
      year: optionalString(req.body.year),
      source: optionalString(req.body.source),
      dueDate: optionalDate(req.body.dueDate),
      readingStatus: optionalString(req.body.readingStatus),
      summary: optionalString(req.body.summary),
      keyQuestions: jsonString(req.body.keyQuestions),
      notes: optionalString(req.body.notes)
    }
  });

  await prisma.scheduleItem.deleteMany({
    where: { sourceModel: "ReadingItem", sourceId: reading.id }
  });
  if (reading.dueDate) {
    await prisma.scheduleItem.create({
      data: {
        courseId: reading.courseId,
        title: reading.title,
        type: "reading",
        startsAt: reading.dueDate,
        description: reading.source,
        sourceModel: "ReadingItem",
        sourceId: reading.id
      }
    });
  }

  res.json(reading);
}

export async function deleteReading(req: Request, res: Response) {
  const id = requireString(req.params.id, "id");
  await prisma.scheduleItem.deleteMany({
    where: { sourceModel: "ReadingItem", sourceId: id }
  });
  await prisma.readingItem.delete({ where: { id } });
  res.status(204).send();
}

export async function generateReadingQuestionList(req: Request, res: Response) {
  const id = requireString(req.params.id, "id");
  const reading = await prisma.readingItem.findUnique({ where: { id } });
  if (!reading) throw new AppError(404, "읽기 항목을 찾을 수 없습니다.");

  const result = await generateReadingQuestions(reading.notes || reading.summary || reading.title);
  const updated = await prisma.readingItem.update({
    where: { id: reading.id },
    data: { keyQuestions: JSON.stringify(result) }
  });

  res.json({ reading: updated, ...result });
}

export async function generateReadingSummary(req: Request, res: Response) {
  const id = requireString(req.params.id, "id");
  const reading = await prisma.readingItem.findUnique({ where: { id } });
  if (!reading) throw new AppError(404, "읽기 항목을 찾을 수 없습니다.");

  const result = await summarizeMaterial(reading.notes || reading.title);
  const updated = await prisma.readingItem.update({
    where: { id: reading.id },
    data: { summary: result.summary, readingStatus: "summarized" }
  });

  res.json({ reading: updated, ...result });
}
