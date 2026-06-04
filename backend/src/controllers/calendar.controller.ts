import type { Request, Response } from "express";
import { buildCalendar } from "../services/calendarService";
import { requireString } from "./controllerUtils";

export async function exportCalendar(req: Request, res: Response) {
  const calendar = await buildCalendar({
    type: String(req.query.type ?? "all")
  });

  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=class-manager.ics");
  res.send(calendar);
}

export async function exportCourseCalendar(req: Request, res: Response) {
  const courseId = requireString(req.params.courseId, "courseId");
  const calendar = await buildCalendar({
    courseId,
    type: String(req.query.type ?? "all")
  });

  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=course-${courseId}.ics`
  );
  res.send(calendar);
}
