import type { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { AppError } from "../middleware/errorHandler";
import { generateStudyPlan } from "../services/aiService";
import {
  jsonString,
  optionalDate,
  optionalNumber,
  optionalString,
  requireString
} from "./controllerUtils";

export async function listExams(req: Request, res: Response) {
  const exams = await prisma.exam.findMany({
    where: req.query.courseId ? { courseId: String(req.query.courseId) } : undefined,
    include: { course: true, tasks: { orderBy: { sortOrder: "asc" } } },
    orderBy: [{ examDate: "asc" }, { createdAt: "desc" }]
  });
  res.json(exams);
}

export async function createExam(req: Request, res: Response) {
  const courseId = requireString(req.body.courseId, "courseId");
  const exam = await prisma.exam.create({
    data: {
      courseId,
      title: requireString(req.body.title, "title"),
      examDate: optionalDate(req.body.examDate),
      scope: optionalString(req.body.scope),
      format: optionalString(req.body.format),
      weight: optionalNumber(req.body.weight),
      studyPlan: jsonString(req.body.studyPlan),
      status: optionalString(req.body.status) ?? "not_started"
    }
  });

  if (exam.examDate) {
    await prisma.scheduleItem.create({
      data: {
        courseId,
        title: exam.title,
        type: "exam",
        startsAt: exam.examDate,
        description: exam.scope,
        sourceModel: "Exam",
        sourceId: exam.id
      }
    });
  }

  res.status(201).json(exam);
}

export async function updateExam(req: Request, res: Response) {
  const id = requireString(req.params.id, "id");
  const exam = await prisma.exam.update({
    where: { id },
    data: {
      courseId: optionalString(req.body.courseId),
      title: optionalString(req.body.title),
      examDate: optionalDate(req.body.examDate),
      scope: optionalString(req.body.scope),
      format: optionalString(req.body.format),
      weight: optionalNumber(req.body.weight),
      studyPlan: jsonString(req.body.studyPlan),
      status: optionalString(req.body.status)
    }
  });

  await prisma.scheduleItem.deleteMany({
    where: { sourceModel: "Exam", sourceId: exam.id }
  });
  if (exam.examDate) {
    await prisma.scheduleItem.create({
      data: {
        courseId: exam.courseId,
        title: exam.title,
        type: "exam",
        startsAt: exam.examDate,
        description: exam.scope,
        sourceModel: "Exam",
        sourceId: exam.id
      }
    });
  }

  res.json(exam);
}

export async function deleteExam(req: Request, res: Response) {
  const id = requireString(req.params.id, "id");
  await prisma.scheduleItem.deleteMany({
    where: { sourceModel: "Exam", sourceId: id }
  });
  await prisma.exam.delete({ where: { id } });
  res.status(204).send();
}

export async function generateExamStudyPlan(req: Request, res: Response) {
  const id = requireString(req.params.id, "id");
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: { course: true }
  });
  if (!exam) throw new AppError(404, "시험을 찾을 수 없습니다.");

  const result = await generateStudyPlan(exam);
  const updated = await prisma.exam.update({
    where: { id: exam.id },
    data: { studyPlan: JSON.stringify(result) }
  });

  await prisma.task.deleteMany({ where: { examId: exam.id } });
  const tasks = await Promise.all(
    result.checklist.map((title, index) =>
      prisma.task.create({
        data: {
          courseId: exam.courseId,
          examId: exam.id,
          title,
          dueDate: exam.examDate,
          sortOrder: index
        }
      })
    )
  );

  res.json({ exam: updated, ...result, tasks });
}
