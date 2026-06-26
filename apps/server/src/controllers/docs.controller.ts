import { z } from 'zod';
import { ValidationError } from '../lib/errors.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as docsService from '../services/docs.service.js';
import type { Request, Response, RequestHandler } from 'express';

// ─── Zod Schemas ───────────────────────────────────────────────
const createDocSchema = z.object({
  title: z.string().min(1).max(255).optional(),
});

const updateDocSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    isPublic: z.boolean().optional(),
    publicAccessLevel: z.enum(['read', 'edit']).nullable().optional(),
    yDocState: z.string().optional(), // TEMPORARY for D.4 auto-save
  })
  .strict();

const addMemberSchema = z.object({
  email: z.string().email({ message: 'A valid email address is required' }),
  role: z.enum(['editor', 'viewer']),
});

// ─── Helpers ───────────────────────────────────────────────────
function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new ValidationError(message);
  }
  return result.data;
}

// ─── C.2 — Create Document ─────────────────────────────────────
export const createDocument: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const { title } = parseBody(createDocSchema, req.body);
  const document = await docsService.createDocument(req.user!.id, title);
  res.status(201).json({ data: document });
});

// ─── C.3 — List Documents ──────────────────────────────────────
export const listDocuments: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const documents = await docsService.listDocuments(req.user!.id);
  res.json({ data: documents });
});

// ─── C.4 — Get Single Document ─────────────────────────────────
export const getDocument: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const document = await docsService.getDocument(req.params.id, req.user!.id);
  res.json({ data: document });
});

// ─── C.5 — Update Document ─────────────────────────────────────
export const updateDocument: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = parseBody(updateDocSchema, req.body);
  const document = await docsService.updateDocument(req.params.id, data);
  res.json({ data: document });
});

// ─── C.6 — Delete Document (Soft) ──────────────────────────────
export const deleteDocument: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await docsService.deleteDocument(req.params.id);
  res.json({ data: result });
});

// ─── C.7 — Add Member ──────────────────────────────────────────
export const addMember: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email, role } = parseBody(addMemberSchema, req.body);
  const member = await docsService.addMember(req.params.id, req.user!.id, email, role);
  res.status(201).json({ data: member });
});

// ─── C.8 — Remove Member ───────────────────────────────────────
export const removeMember: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await docsService.removeMember(req.params.id, req.params.userId);
  res.json({ data: result });
});
