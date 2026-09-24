import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(72),
});

export const publicUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  bio: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PublicUser = z.infer<typeof publicUserSchema>;
