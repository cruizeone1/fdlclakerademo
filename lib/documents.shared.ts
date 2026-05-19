export const ACCEPTED_DOCUMENT_EXTENSIONS = [
  ".txt",
  ".md",
  ".csv",
  ".json",
  ".pdf",
  ".docx",
] as const;

export const ACCEPTED_DOCUMENT_MIME_TYPES = [
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const MAX_DOCUMENT_CHARS = 8_000;

export interface UploadedDocument {
  name: string;
  content: string;
}

export function isAcceptedDocumentFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  return ACCEPTED_DOCUMENT_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

export function getDocumentAcceptAttribute(): string {
  return [...ACCEPTED_DOCUMENT_EXTENSIONS, ...ACCEPTED_DOCUMENT_MIME_TYPES].join(",");
}

export function formatAcceptedDocumentTypes(): string {
  return ".txt, .md, .csv, .json, .pdf, .docx";
}
