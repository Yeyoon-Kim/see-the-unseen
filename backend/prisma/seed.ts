import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.task.deleteMany();
  await prisma.scheduleItem.deleteMany();
  await prisma.uploadedFile.deleteMany();
  await prisma.courseNotice.deleteMany();
  await prisma.material.deleteMany();
  await prisma.readingItem.deleteMany();
  await prisma.presentation.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.course.deleteMany();

  const linguistics = await prisma.course.create({
    data: {
      courseName: "Introduction to Linguistics",
      professorName: "Professor Kim",
      semester: "2026 Spring",
      classTime: "Mon/Wed 10:30-12:00",
      classroom: "Building A 301",
      courseType: "undergraduate",
      color: "#5E6B73"
    }
  });

  const seminar = await prisma.course.create({
    data: {
      courseName: "Graduate Research Seminar",
      professorName: "Professor Lee",
      semester: "2026 Spring",
      classTime: "Thu 14:00-17:00",
      classroom: "Seminar Room 204",
      courseType: "graduate",
      color: "#059669"
    }
  });

  const assignment = await prisma.assignment.create({
    data: {
      courseId: linguistics.id,
      title: "Final Essay",
      description: "Write a 3000-word essay on a course topic.",
      dueDate: new Date("2026-06-06T09:00:00+09:00"),
      submissionFormat: "PDF upload",
      priority: "high",
      status: "in_progress",
      sourceType: "syllabus"
    }
  });

  const responseNote = await prisma.assignment.create({
    data: {
      courseId: seminar.id,
      title: "Methodology Response Memo",
      description: "Summarize the methods section and prepare critique points.",
      dueDate: new Date("2026-06-10T18:00:00+09:00"),
      submissionFormat: "Online text submission",
      priority: "medium",
      status: "not_started",
      sourceType: "notice"
    }
  });

  const exam = await prisma.exam.create({
    data: {
      courseId: linguistics.id,
      title: "Final Exam",
      examDate: new Date("2026-06-24T10:30:00+09:00"),
      scope: "Weeks 8-14",
      format: "Written exam",
      weight: 30,
      status: "not_started"
    }
  });

  const presentation = await prisma.presentation.create({
    data: {
      courseId: seminar.id,
      title: "Article Presentation",
      presentationDate: new Date("2026-06-12T14:00:00+09:00"),
      topic: "AI-assisted literature review",
      teamMembers: "Jiyoon, Minho",
      myRole: "Discussion lead",
      checklist: JSON.stringify(["주제 확정", "자료 조사", "PPT 초안 제작"]),
      status: "in_progress"
    }
  });

  const reading = await prisma.readingItem.create({
    data: {
      courseId: seminar.id,
      title: "Attention Is All You Need",
      authors: "Vaswani et al.",
      year: "2017",
      source: "NeurIPS",
      dueDate: new Date("2026-06-09T23:59:00+09:00"),
      readingStatus: "reading",
      notes: "Transformer architecture and attention mechanisms."
    }
  });

  await prisma.material.create({
    data: {
      courseId: linguistics.id,
      title: "Week 12 Syntax Slides",
      fileName: "week12-syntax.txt",
      fileType: "text/plain",
      aiSummary: "Syntax review material covering phrase structure and transformations.",
      tags: JSON.stringify(["syntax", "review"])
    }
  });

  await prisma.courseNotice.create({
    data: {
      courseId: linguistics.id,
      title: "Final Essay submission reminder",
      body: "Please submit your final essay as a PDF by June 6.",
      postedAt: new Date("2026-06-03T09:00:00+09:00"),
      sourceType: "screenshot",
      extractedText: "Final Essay submission reminder. Please submit your final essay as a PDF by June 6."
    }
  });

  const scheduleData = [
    {
      courseId: linguistics.id,
      title: assignment.title,
      type: "assignment",
      startsAt: assignment.dueDate,
      description: assignment.description,
      sourceModel: "Assignment",
      sourceId: assignment.id
    },
    {
      courseId: seminar.id,
      title: responseNote.title,
      type: "assignment",
      startsAt: responseNote.dueDate,
      description: responseNote.description,
      sourceModel: "Assignment",
      sourceId: responseNote.id
    },
    {
      courseId: linguistics.id,
      title: exam.title,
      type: "exam",
      startsAt: exam.examDate,
      description: exam.scope,
      sourceModel: "Exam",
      sourceId: exam.id
    },
    {
      courseId: seminar.id,
      title: presentation.title,
      type: "presentation",
      startsAt: presentation.presentationDate,
      description: presentation.topic,
      sourceModel: "Presentation",
      sourceId: presentation.id
    },
    {
      courseId: seminar.id,
      title: reading.title,
      type: "reading",
      startsAt: reading.dueDate,
      description: reading.source,
      sourceModel: "ReadingItem",
      sourceId: reading.id
    }
  ];

  for (const item of scheduleData) {
    await prisma.scheduleItem.create({ data: item });
  }

  await prisma.task.createMany({
    data: [
      {
        courseId: linguistics.id,
        assignmentId: assignment.id,
        title: "Essay outline",
        dueDate: new Date("2026-06-04T23:59:00+09:00"),
        sortOrder: 1
      },
      {
        courseId: linguistics.id,
        assignmentId: assignment.id,
        title: "Draft and citation check",
        dueDate: new Date("2026-06-05T23:59:00+09:00"),
        sortOrder: 2
      },
      {
        courseId: seminar.id,
        presentationId: presentation.id,
        title: "Prepare discussion questions",
        dueDate: new Date("2026-06-11T23:59:00+09:00"),
        sortOrder: 1
      }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
