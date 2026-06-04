import type { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { AppError } from "../middleware/errorHandler";
import { extractTextFromFile } from "../services/fileTextExtractor";
import { summarizeMaterial } from "../services/aiService";
import { optionalString, requireString } from "./controllerUtils";

export async function listMaterials(req: Request, res: Response) {
  const q = optionalString(req.query.q);
  const materials = await prisma.material.findMany({
    where: {
      ...(req.query.courseId ? { courseId: String(req.query.courseId) } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { tags: { contains: q } },
              { aiSummary: { contains: q } }
            ]
          }
        : {})
    },
    include: { course: true },
    orderBy: { uploadedAt: "desc" }
  });
  res.json(materials);
}

export async function uploadMaterial(req: Request, res: Response) {
  const courseId = requireString(req.body.courseId, "courseId");
  const title = optionalString(req.body.title) ?? req.file?.originalname ?? "Untitled Material";
  let extractedText = optionalString(req.body.text) ?? "";

  if (req.file) {
    try {
      extractedText = await extractTextFromFile(req.file);
    } catch {
      extractedText = optionalString(req.body.text) ?? "";
    }
  }

  const summary = extractedText ? await summarizeMaterial(extractedText) : undefined;
  const material = await prisma.material.create({
    data: {
      courseId,
      title,
      fileName: req.file?.originalname,
      fileType: req.file?.mimetype ?? "text/plain",
      filePath: req.file?.path,
      aiSummary: summary?.summary,
      tags: summary?.tags ? JSON.stringify(summary.tags) : undefined
    }
  });

  if (req.file || extractedText) {
    await prisma.uploadedFile.create({
      data: {
        courseId,
        originalName: req.file?.originalname ?? `${title}.txt`,
        storedName: req.file?.filename ?? `${Date.now()}-manual-material.txt`,
        mimeType: req.file?.mimetype ?? "text/plain",
        size: req.file?.size ?? Buffer.byteLength(extractedText),
        path: req.file?.path,
        extractedText,
        sourceType: "material"
      }
    });
  }

  res.status(201).json(material);
}

export async function summarizeExistingMaterial(req: Request, res: Response) {
  const id = requireString(req.params.id, "id");
  const material = await prisma.material.findUnique({ where: { id } });
  if (!material) throw new AppError(404, "자료를 찾을 수 없습니다.");

  const uploaded = await prisma.uploadedFile.findFirst({
    where: {
      courseId: material.courseId,
      originalName: material.fileName ?? undefined,
      sourceType: "material"
    },
    orderBy: { createdAt: "desc" }
  });

  const result = await summarizeMaterial(uploaded?.extractedText || material.title);
  const updated = await prisma.material.update({
    where: { id: material.id },
    data: {
      aiSummary: result.summary,
      tags: result.tags ? JSON.stringify(result.tags) : material.tags
    }
  });

  res.json({ material: updated, ...result });
}

export async function deleteMaterial(req: Request, res: Response) {
  const id = requireString(req.params.id, "id");
  await prisma.material.delete({ where: { id } });
  res.status(204).send();
}
