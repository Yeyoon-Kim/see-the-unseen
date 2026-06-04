import type { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { AppError } from "../middleware/errorHandler";
import { analyzeSyllabus, extractAssignments } from "../services/aiService";
import { extractTextFromFile } from "../services/fileTextExtractor";
import { saveSyllabusAnalysis } from "../services/syllabusSaveService";
import { optionalDate, optionalString, requireString } from "./controllerUtils";
import type { AssignmentExtraction, SyllabusAnalysis } from "../types/ai.types";

async function getUploadedText(req: Request, sourceType: string) {
  let extractedText = optionalString(req.body.text) ?? "";

  if (req.file) {
    try {
      extractedText = await extractTextFromFile(req.file);
    } catch {
      extractedText = optionalString(req.body.text) ?? "";
    }
  }

  if (!extractedText.trim()) {
    throw new AppError(400, "텍스트를 추출할 수 없습니다. 직접 입력 텍스트가 필요합니다.");
  }

  const uploadedFile = await prisma.uploadedFile.create({
    data: {
      originalName: req.file?.originalname ?? `${sourceType}-manual.txt`,
      storedName: req.file?.filename ?? `${Date.now()}-${sourceType}-manual.txt`,
      mimeType: req.file?.mimetype ?? "text/plain",
      size: req.file?.size ?? Buffer.byteLength(extractedText),
      path: req.file?.path,
      extractedText,
      sourceType
    }
  });

  return { extractedText, uploadedFile };
}

export async function uploadSyllabus(req: Request, res: Response) {
  const { extractedText, uploadedFile } = await getUploadedText(req, "syllabus");
  const analysis = await analyzeSyllabus(extractedText);
  res.json({ uploadedFile, extractedText, analysis });
}

export async function uploadNotice(req: Request, res: Response) {
  const { extractedText, uploadedFile } = await getUploadedText(req, "notice");
  const analysis = await extractAssignments(extractedText);
  res.json({ uploadedFile, extractedText, analysis });
}

export async function saveSyllabus(req: Request, res: Response) {
  const analysis = req.body.analysis as SyllabusAnalysis | undefined;
  if (!analysis?.course) {
    throw new AppError(400, "저장할 계획서 분석 JSON이 필요합니다.");
  }

  const course = await saveSyllabusAnalysis(analysis, optionalString(req.body.uploadedFileId));
  res.status(201).json(course);
}

export async function saveNotice(req: Request, res: Response) {
  const courseId = requireString(req.body.courseId, "courseId");
  const analysis = req.body.analysis as AssignmentExtraction | undefined;
  const uploadedFileId = optionalString(req.body.uploadedFileId);
  const extractedText = optionalString(req.body.extractedText);
  const noticeTitle =
    optionalString(req.body.title) ?? analysis?.assignments?.[0]?.title ?? "공지";
  const noticeBody =
    optionalString(req.body.body) ??
    extractedText ??
    analysis?.assignments?.map((item) => item.description || item.title).join("\n");

  if (uploadedFileId) {
    await prisma.uploadedFile.update({
      where: { id: uploadedFileId },
      data: { courseId }
    });
  }

  const notice = await prisma.courseNotice.create({
    data: {
      courseId,
      title: noticeTitle,
      body: noticeBody,
      extractedText,
      uploadedFileId,
      sourceType: "screenshot",
      postedAt: optionalDate(req.body.postedAt)
    }
  });

  const assignments = [];
  for (const item of analysis?.assignments ?? []) {
    const assignment = await prisma.assignment.create({
      data: {
        courseId,
        title: item.title,
        description: item.description,
        dueDate: optionalDate(item.dueDate),
        submissionFormat: item.submissionFormat,
        priority: item.priority ?? "medium",
        status: "not_started",
        sourceType: "notice"
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

    assignments.push(assignment);
  }

  res.status(201).json({ notice, assignments });
}
