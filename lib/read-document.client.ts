"use client";

import { MAX_DOCUMENT_CHARS, type UploadedDocument } from "./documents.shared";

export const MAX_DOCUMENT_FILE_BYTES = 5 * 1024 * 1024;

let pdfWorkerConfigured = false;

async function configurePdfWorker() {
  if (pdfWorkerConfigured) return;
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  pdfWorkerConfigured = true;
}

async function extractPdfText(file: File): Promise<string> {
  await configurePdfWorker();
  const pdfjs = await import("pdfjs-dist");
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;

  const parts: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .trim();
    if (pageText) parts.push(pageText);
  }

  return parts.join("\n\n").trim();
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value.trim();
}

function normalizeExtractedText(content: string, fileName: string): string {
  const trimmed = content.replace(/\r\n/g, "\n").trim();
  if (!trimmed) {
    throw new Error(`No readable text found in ${fileName}.`);
  }
  if (trimmed.length > MAX_DOCUMENT_CHARS) {
    throw new Error(
      `Document is too long (${trimmed.length} chars). Max is ${MAX_DOCUMENT_CHARS} characters.`,
    );
  }
  return trimmed;
}

export async function readDocumentFileClient(file: File): Promise<UploadedDocument> {
  if (file.size > MAX_DOCUMENT_FILE_BYTES) {
    throw new Error("File is too large. Maximum size is 5 MB.");
  }

  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".doc")) {
    throw new Error(
      "Legacy .doc files are not supported. Please save as .docx or PDF and upload again.",
    );
  }

  let content: string;

  if (lowerName.endsWith(".pdf")) {
    content = await extractPdfText(file);
  } else if (lowerName.endsWith(".docx")) {
    content = await extractDocxText(file);
  } else {
    content = (await file.text()).trim();
  }

  return {
    name: file.name,
    content: normalizeExtractedText(content, file.name),
  };
}
