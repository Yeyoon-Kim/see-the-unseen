import type { Request, Response } from "express";
import {
  analyzeSyllabus,
  extractAssignments,
  generateAssignmentChecklist,
  generatePresentationChecklist,
  generateReadingQuestions,
  generateResearchPlan,
  generateStudyPlan,
  summarizeMaterial
} from "../services/aiService";
import { requireString } from "./controllerUtils";

export async function analyzeSyllabusText(req: Request, res: Response) {
  res.json(await analyzeSyllabus(requireString(req.body.text, "text")));
}

export async function extractAssignmentText(req: Request, res: Response) {
  res.json(await extractAssignments(requireString(req.body.text, "text")));
}

export async function summarizeMaterialText(req: Request, res: Response) {
  res.json(await summarizeMaterial(requireString(req.body.text, "text")));
}

export async function assignmentChecklist(req: Request, res: Response) {
  res.json(await generateAssignmentChecklist(req.body));
}

export async function examStudyPlan(req: Request, res: Response) {
  res.json(await generateStudyPlan(req.body));
}

export async function presentationChecklist(req: Request, res: Response) {
  res.json(await generatePresentationChecklist(req.body));
}

export async function readingQuestions(req: Request, res: Response) {
  res.json(await generateReadingQuestions(requireString(req.body.text, "text")));
}

export async function researchPlan(req: Request, res: Response) {
  res.json(await generateResearchPlan(req.body.readingItems ?? []));
}

