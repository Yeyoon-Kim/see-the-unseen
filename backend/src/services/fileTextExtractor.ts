import { execFile } from "child_process";
import fs from "fs/promises";
import { createRequire } from "module";
import path from "path";
import pdf from "pdf-parse";
import { createWorker, PSM } from "tesseract.js";
import { promisify } from "util";

const tessdataDir = path.join(process.cwd(), ".tessdata");
const requireFromHere = createRequire(__filename);
const execFileAsync = promisify(execFile);

async function copyLanguageData(language: "kor" | "eng") {
  const packageRoot = path.dirname(
    requireFromHere.resolve(`@tesseract.js-data/${language}/package.json`)
  );
  const source = path.join(
    packageRoot,
    "4.0.0",
    `${language}.traineddata.gz`
  );
  const target = path.join(tessdataDir, `${language}.traineddata.gz`);

  await fs.mkdir(tessdataDir, { recursive: true });
  try {
    await fs.access(target);
  } catch {
    await fs.copyFile(source, target);
  }
}

async function ensureKoreanOcrData() {
  await Promise.all([copyLanguageData("kor"), copyLanguageData("eng")]);
}

function scoreText(text: string) {
  const korean = text.match(/[가-힣]/g)?.length ?? 0;
  const latin = text.match(/[A-Za-z]/g)?.length ?? 0;
  const digits = text.match(/\d/g)?.length ?? 0;
  return korean * 3 + latin + digits + text.trim().length * 0.2;
}

async function recognizeKoreanScreenshot(filePath: string) {
  await ensureKoreanOcrData();

  const worker = await createWorker("kor+eng", 1, {
    langPath: tessdataDir,
    cachePath: tessdataDir,
    gzip: true
  });

  try {
    await worker.setParameters({
      preserve_interword_spaces: "1",
      user_defined_dpi: "300"
    });

    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SPARSE_TEXT
    });
    const sparse = await worker.recognize(filePath);

    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK
    });
    const block = await worker.recognize(filePath);

    const candidates = [sparse.data.text, block.data.text]
      .map((text) => text.replace(/[ \t]+\n/g, "\n").trim())
      .filter(Boolean);

    return candidates.sort((a, b) => scoreText(b) - scoreText(a))[0] ?? "";
  } finally {
    await worker.terminate();
  }
}

function decodeXmlEntities(text: string) {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([\da-fA-F]+);/g, (_match, code) =>
      String.fromCharCode(Number.parseInt(code, 16))
    );
}

function extractTextFromWordXml(xml: string) {
  return decodeXmlEntities(
    xml
      .replace(/<w:tab\s*\/>/g, "\t")
      .replace(/<w:br\s*\/>/g, "\n")
      .replace(/<\/w:p>/g, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractWordWithTextutil(filePath: string) {
  try {
    const { stdout } = await execFileAsync("textutil", ["-convert", "txt", "-stdout", filePath], {
      maxBuffer: 10 * 1024 * 1024
    });
    return String(stdout).trim();
  } catch {
    return "";
  }
}

async function extractDocxWithUnzip(filePath: string) {
  try {
    const { stdout } = await execFileAsync("unzip", ["-p", filePath, "word/document.xml"], {
      maxBuffer: 10 * 1024 * 1024
    });
    return extractTextFromWordXml(String(stdout));
  } catch {
    return "";
  }
}

async function extractTextFromWordDocument(filePath: string, ext: string) {
  const converted = await extractWordWithTextutil(filePath);
  if (converted) return converted;

  if (ext === ".docx") {
    return extractDocxWithUnzip(filePath);
  }

  return "";
}

export async function extractTextFromFile(file: Express.Multer.File) {
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.mimetype === "text/plain" || ext === ".txt") {
    return fs.readFile(file.path, "utf-8");
  }

  if (file.mimetype === "application/pdf" || ext === ".pdf") {
    const buffer = await fs.readFile(file.path);
    const result = await pdf(buffer);
    return result.text;
  }

  if (file.mimetype.startsWith("image/")) {
    return recognizeKoreanScreenshot(file.path);
  }

  if (
    file.mimetype === "application/msword" ||
    file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === ".doc" ||
    ext === ".docx"
  ) {
    return extractTextFromWordDocument(file.path, ext);
  }

  return "";
}
