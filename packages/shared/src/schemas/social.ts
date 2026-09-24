import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) => value.length === 0 || z.string().url().safeParse(value).success,
    "Informe uma URL válida",
  );

export const skillSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const profileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  bio: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  skills: z.array(skillSchema),
  followersCount: z.number(),
  followingCount: z.number(),
  isFollowing: z.boolean(),
  isSelf: z.boolean(),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(80),
  bio: z.string().trim().max(280, "A bio pode ter no máximo 280 caracteres"),
  avatarUrl: optionalUrl,
  skillIds: z.array(z.string()).max(8),
});

export const creatorSchema = z.object({
  id: z.string(),
  name: z.string(),
  bio: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  skills: z.array(skillSchema),
});

export const contentAuthorSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
});

export const contentImageSchema = z.object({
  id: z.string(),
  url: z.string(),
  order: z.number(),
});

export const contentCardSchema = z.object({
  id: z.string(),
  type: z.enum(["POST", "PROJECT"]),
  title: z.string().nullable(),
  body: z.string(),
  externalLink: z.string().nullable(),
  createdAt: z.string(),
  author: contentAuthorSchema,
  images: z.array(contentImageSchema),
  likeCount: z.number(),
  commentCount: z.number(),
  likedByMe: z.boolean(),
});

export const createContentSchema = z.object({
  type: z.enum(["POST", "PROJECT"]),
  title: z.string().trim().max(120),
  body: z.string().trim().min(1, "Escreva algo").max(4000),
  externalLink: optionalUrl,
  imageUrls: z.array(z.string().trim().url("URL de imagem inválida").max(500)).max(6),
});

export const updateContentSchema = createContentSchema.pick({
  title: true,
  body: true,
  externalLink: true,
});

export const commentSchema = z.object({
  id: z.string(),
  body: z.string(),
  createdAt: z.string(),
  author: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

export const createCommentSchema = z.object({
  body: z.string().trim().min(1, "Escreva um comentário").max(1000),
});

export const contentDetailSchema = contentCardSchema.extend({
  comments: z.array(commentSchema),
});

export const notificationSchema = z.object({
  id: z.string(),
  type: z.enum(["follow", "like", "comment"]),
  read: z.boolean(),
  createdAt: z.string(),
  contentId: z.string().nullable(),
  actor: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

export type Skill = z.infer<typeof skillSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type Creator = z.infer<typeof creatorSchema>;
export type ContentCard = z.infer<typeof contentCardSchema>;
export type CreateContentInput = z.infer<typeof createContentSchema>;
export type UpdateContentInput = z.infer<typeof updateContentSchema>;
export type Comment = z.infer<typeof commentSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ContentDetail = z.infer<typeof contentDetailSchema>;
export type AppNotification = z.infer<typeof notificationSchema>;
