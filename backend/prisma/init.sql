PRAGMA foreign_keys = ON;

CREATE TABLE "Course" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseName" TEXT NOT NULL,
  "professorName" TEXT,
  "semester" TEXT,
  "classTime" TEXT,
  "classroom" TEXT,
  "courseType" TEXT NOT NULL DEFAULT 'undergraduate',
  "color" TEXT NOT NULL DEFAULT '#5E6B73',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Assignment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "dueDate" DATETIME,
  "submissionFormat" TEXT,
  "priority" TEXT,
  "tag" TEXT,
  "status" TEXT NOT NULL DEFAULT 'not_started',
  "completionTotal" INTEGER,
  "completionLeft" INTEGER,
  "sourceType" TEXT NOT NULL DEFAULT 'manual',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Assignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Exam" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "examDate" DATETIME,
  "scope" TEXT,
  "format" TEXT,
  "weight" INTEGER,
  "studyPlan" TEXT,
  "status" TEXT NOT NULL DEFAULT 'not_started',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Exam_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Presentation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "presentationDate" DATETIME,
  "topic" TEXT,
  "teamMembers" TEXT,
  "myRole" TEXT,
  "checklist" TEXT,
  "status" TEXT NOT NULL DEFAULT 'not_started',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Presentation_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ReadingItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "authors" TEXT,
  "year" TEXT,
  "source" TEXT,
  "dueDate" DATETIME,
  "readingStatus" TEXT NOT NULL DEFAULT 'not_started',
  "summary" TEXT,
  "keyQuestions" TEXT,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReadingItem_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Material" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "fileName" TEXT,
  "fileType" TEXT,
  "filePath" TEXT,
  "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "aiSummary" TEXT,
  "tags" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Material_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ScheduleItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "startsAt" DATETIME,
  "endsAt" DATETIME,
  "description" TEXT,
  "sourceModel" TEXT,
  "sourceId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScheduleItem_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Task" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseId" TEXT,
  "assignmentId" TEXT,
  "examId" TEXT,
  "presentationId" TEXT,
  "readingItemId" TEXT,
  "title" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'not_started',
  "dueDate" DATETIME,
  "priority" TEXT,
  "tag" TEXT,
  "completionTotal" INTEGER,
  "completionLeft" INTEGER,
  "sourceType" TEXT NOT NULL DEFAULT 'manual',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Task_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Task_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Task_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Task_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "Presentation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Task_readingItemId_fkey" FOREIGN KEY ("readingItemId") REFERENCES "ReadingItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "UploadedFile" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseId" TEXT,
  "originalName" TEXT NOT NULL,
  "storedName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "path" TEXT,
  "extractedText" TEXT,
  "sourceType" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UploadedFile_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "CourseNotice" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "sourceType" TEXT NOT NULL DEFAULT 'screenshot',
  "extractedText" TEXT,
  "uploadedFileId" TEXT,
  "postedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CourseNotice_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Assignment_courseId_idx" ON "Assignment" ("courseId");
CREATE INDEX "Exam_courseId_idx" ON "Exam" ("courseId");
CREATE INDEX "Presentation_courseId_idx" ON "Presentation" ("courseId");
CREATE INDEX "ReadingItem_courseId_idx" ON "ReadingItem" ("courseId");
CREATE INDEX "Material_courseId_idx" ON "Material" ("courseId");
CREATE INDEX "ScheduleItem_courseId_idx" ON "ScheduleItem" ("courseId");
CREATE INDEX "Task_courseId_idx" ON "Task" ("courseId");
CREATE INDEX "UploadedFile_courseId_idx" ON "UploadedFile" ("courseId");
CREATE INDEX "CourseNotice_courseId_idx" ON "CourseNotice" ("courseId");
