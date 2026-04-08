import { z } from 'zod';

const ALLOWED_VIDEO_DOMAINS = [
  'youtube.com',
  'youtu.be',
  'sharepoint.com',
  'microsoftonline.com',
];

const isAllowedVideoUrl = (url: string): boolean => {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_VIDEO_DOMAINS.some((domain) => hostname.includes(domain));
  } catch {
    return false;
  }
};

export const ModuleBaseSchema = z.object({
  courseId:  z.string().min(1, 'Course ID tidak valid'),
  title:     z.string().min(3, 'Judul minimal 3 karakter').max(255),
  order:     z.coerce.number().int().min(0).default(0),
  isActive:  z.coerce.boolean().default(true),
  duration:  z.coerce.number().int().min(1, "Durasi minimal 1 menit"),
  description: z.string().optional(),
});

export const PdfModuleSchema = ModuleBaseSchema.extend({
  type:             z.literal('PDF'),
  tempPath:         z.string().min(1, 'File PDF wajib diunggah'),
  originalFilename: z.string().min(1),
  fileSize:         z.coerce.number().positive(),
});

export const VideoModuleSchema = ModuleBaseSchema.extend({
  type:       z.literal('VIDEO'),
  url:        z.string().url('URL tidak valid').refine(
    isAllowedVideoUrl,
    { message: 'URL hanya diizinkan dari YouTube atau SharePoint' }
  ),
});

// Discriminated union — validasi otomatis sesuai type
export const ModuleSchema = z.discriminatedUnion('type', [
  PdfModuleSchema,
  VideoModuleSchema,
]);

export type ModuleSchemaType = z.infer<typeof ModuleSchema>;
