export type ModuleType = 'VIDEO' | 'PDF';

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  type: ModuleType;
  url?: string | null;
  videoUrl?: string | null;
  pdfUrl?: string | null;
  sharepointUrl?: string | null;
  duration: number;
  position: number;
  isPublished: boolean;
  isFree?: boolean;
  originalFilename?: string | null;
  fileSize?: number | bigint | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadPdfResult {
  success: boolean;
  tempPath?: string;
  originalFilename?: string;
  fileSize?: number;
  error?: string;
}

export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: Record<string, string[]>;
}
