import type { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { AppError } from "../middleware/errorHandler";
import { optionalString, requireString } from "./controllerUtils";

export async function listCourses(_req: Request, res: Response) {
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          assignments: true,
          exams: true,
          presentations: true,
          readings: true,
          materials: true
        }
      }
    }
  });
  res.json(courses);
}

export async function getCourse(req: Request, res: Response) {
  const id = requireString(req.params.id, "id");
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      assignments: { orderBy: { dueDate: "asc" } },
      exams: { orderBy: { examDate: "asc" } },
      presentations: { orderBy: { presentationDate: "asc" } },
      readings: { orderBy: { dueDate: "asc" } },
      materials: { orderBy: { uploadedAt: "desc" } },
      scheduleItems: { orderBy: { startsAt: "asc" } },
      tasks: { orderBy: [{ dueDate: "asc" }, { sortOrder: "asc" }] },
      uploadedFiles: { orderBy: { createdAt: "desc" } },
      notices: {
        orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }],
        take: 20
      }
    }
  });

  if (!course) throw new AppError(404, "일정을 찾을 수 없습니다.");
  res.json(course);
}

export async function createCourse(req: Request, res: Response) {
  const course = await prisma.course.create({
    data: {
      courseName: requireString(req.body.courseName, "courseName"),
      professorName: optionalString(req.body.professorName),
      semester: optionalString(req.body.semester),
      classTime: optionalString(req.body.classTime),
      classroom: optionalString(req.body.classroom),
      courseType: optionalString(req.body.courseType) ?? "undergraduate",
      color: optionalString(req.body.color) ?? "#5E6B73"
    }
  });

  res.status(201).json(course);
}

export async function updateCourse(req: Request, res: Response) {
  const id = requireString(req.params.id, "id");
  const course = await prisma.course.update({
    where: { id },
    data: {
      courseName: optionalString(req.body.courseName),
      professorName: optionalString(req.body.professorName),
      semester: optionalString(req.body.semester),
      classTime: optionalString(req.body.classTime),
      classroom: optionalString(req.body.classroom),
      courseType: optionalString(req.body.courseType),
      color: optionalString(req.body.color)
    }
  });

  res.json(course);
}

export async function deleteCourse(req: Request, res: Response) {
  const id = requireString(req.params.id, "id");
  await prisma.course.delete({ where: { id } });
  res.status(204).send();
}
