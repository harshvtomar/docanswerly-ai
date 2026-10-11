export interface PageText {
  page: number;
  text: string;
  method: "text" | "ocr" | "error";
  confidence?: number;
  error?: string;
}
export interface DocumentRecord {
  id: string;
  name: string;
  size: number;
  url: string;
  pages: PageText[];
  createdAt: string;
}
export interface Chunk {
  id: string;
  documentId: string;
  documentName: string;
  page: number;
  text: string;
  start: number;
  end: number;
}
export interface SearchHit {
  chunk: Chunk;
  score: number;
}
export interface EmbeddingProvider {
  model: string;
  embed(texts: string[]): Promise<number[][]>;
}
export interface AnswerProvider {
  answer(
    question: string,
    evidence: Chunk[],
    language: "auto" | "en" | "hi",
  ): Promise<{ text: string; citations: string[] }>;
}
