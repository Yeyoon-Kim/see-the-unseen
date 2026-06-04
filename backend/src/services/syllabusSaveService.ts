import { prisma } from "../db/prisma";
import type { SyllabusAnalysis } from "../types/ai.types";
import { optionalDate } from "../controllers/controllerUtils";

function colorOrDefault(color?: string) {
  return color && /^#[0-9a-f]{6}$/i.test(color) ? color : "#5E6B73";
}

export async function saveSyllabusAnalysis(
  analysis: SyllabusAnalysis,
  uploadedFileId?: string
) {
  const course = await prisma.course.create({
    data: {
      courseName: analysis.course.courseName || "Untitled Course",
      professorName: analysis.course.professorName,
      semester: analysis.course.semester,
      classTime: analysis.course.classTime,
      classroom: analysis.course.classroom,
      courseType: analysis.course.courseType ?? "undergraduate",
      color: colorOrDefault(analysis.course.color)
    }
  });

  if (uploadedFileId) {
    await prisma.uploadedFile.update({
      where: { id: uploadedFileId },
      data: { courseId: course.id }
    });
  }

  for (const item of analysis.assignments ?? []) {
    const assignment = await prisma.assignment.create({
      data: {
        courseId: course.id,
        title: item.title,
        description: item.description,
        dueDate: optionalDate(item.dueDate),
        submissionFormat: item.submissionFormat,
        priority: item.priority ?? "medium",
        sourceType: "syllabus"
      }
    });

    await prisma.scheduleItem.create({
      data: {
        courseId: course.id,
        title: assignment.title,
        type: "assignment",
        startsAt: assignment.dueDate,
        description: assignment.description,
        sourceModel: "Assignment",
        sourceId: assignment.id
      }
    });
  }

  for (const item of analysis.exams ?? []) {
    const exam = await prisma.exam.create({
      data: {
        courseId: course.id,
        title: item.title,
        examDate: optionalDate(item.examDate),
        scope: item.scope,
        format: item.format,
        weight: item.weight
      }
    });

    await prisma.scheduleItem.create({
      data: {
        courseId: course.id,
        title: exam.title,
        type: "exam",
        startsAt: exam.examDate,
        description: exam.scope,
        sourceModel: "Exam",
        sourceId: exam.id
      }
    });
  }

  for (const item of analysis.presentations ?? []) {
    const presentation = await prisma.presentation.create({
      data: {
        courseId: course.id,
        title: item.title,
        presentationDate: optionalDate(item.presentationDate),
        topic: item.topic,
        teamMembers: item.teamMembers,
        myRole: item.myRole
      }
    });

    await prisma.scheduleItem.create({
      data: {
        courseId: course.id,
        title: presentation.title,
        type: "presentation",
        startsAt: presentation.presentationDate,
        description: presentation.topic,
        sourceModel: "Presentation",
        sourceId: presentation.id
      }
    });
  }

  for (const item of analysis.readings ?? []) {
    const reading = await prisma.readingItem.create({
      data: {
        courseId: course.id,
        title: item.title,
        authors: item.authors,
        year: item.year,
        source: item.source,
        dueDate: optionalDate(item.dueDate)
      }
    });

    await prisma.scheduleItem.create({
      data: {
        courseId: course.id,
        title: reading.title,
        type: "reading",
        startsAt: reading.dueDate,
        description: reading.source,
        sourceModel: "ReadingItem",
        sourceId: reading.id
      }
    });
  }

  for (const weekly of analysis.weeklyTopics ?? []) {
    await prisma.scheduleItem.create({
      data: {
        courseId: course.id,
        title: `Week ${weekly.week}: ${weekly.topic}`,
        type: "class",
        description: weekly.topic,
        sourceModel: "SyllabusWeeklyTopic"
      }
    });
  }

  return prisma.course.findUnique({
    where: { id: course.id },
    include: {
      assignments: true,
      exams: true,
      presentations: true,
      readings: true,
      scheduleItems: true,
      uploadedFiles: true
    }
  });
}

