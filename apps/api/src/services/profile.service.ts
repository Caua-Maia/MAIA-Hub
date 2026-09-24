import type { Profile, UpdateProfileInput } from "@maia-hub/shared";
import { Prisma } from "@prisma/client";
import { HttpError } from "../lib/auth-error.js";
import { prisma } from "../lib/prisma.js";
import { notify } from "./notification.service.js";

const profileSelect = {
  id: true,
  name: true,
  email: true,
  bio: true,
  avatarUrl: true,
  skills: {
    select: {
      skill: { select: { id: true, name: true } },
    },
  },
  _count: { select: { followers: true, following: true } },
} as const;

export async function getProfile(userId: string, viewerId: string | null): Promise<Profile> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: profileSelect,
  });

  if (!user) {
    throw new HttpError(404, "Perfil não encontrado");
  }

  const isSelf = viewerId === user.id;
  const follow = viewerId && !isSelf
    ? await prisma.follow.findUnique({
        where: {
          followerId_followingId: { followerId: viewerId, followingId: user.id },
        },
        select: { id: true },
      })
    : null;

  return {
    id: user.id,
    name: user.name,
    email: isSelf ? user.email : null,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    skills: user.skills.map((item) => item.skill),
    followersCount: user._count.followers,
    followingCount: user._count.following,
    isFollowing: Boolean(follow),
    isSelf,
  };
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const uniqueSkillIds = [...new Set(input.skillIds)];
  if (uniqueSkillIds.length > 0) {
    const skills = await prisma.skill.findMany({
      where: { id: { in: uniqueSkillIds } },
      select: { id: true },
    });
    if (skills.length !== uniqueSkillIds.length) {
      throw new HttpError(400, "Habilidade inválida");
    }
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        bio: input.bio.length > 0 ? input.bio : null,
        avatarUrl: input.avatarUrl.length > 0 ? input.avatarUrl : null,
      },
    }),
    prisma.userSkill.deleteMany({ where: { userId } }),
    prisma.userSkill.createMany({
      data: uniqueSkillIds.map((skillId) => ({ userId, skillId })),
    }),
  ]);

  return getProfile(userId, userId);
}

export async function listSkills() {
  return prisma.skill.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function searchCreators(skillId: string) {
  const skill = await prisma.skill.findUnique({ where: { id: skillId }, select: { id: true } });
  if (!skill) {
    throw new HttpError(400, "Habilidade inválida");
  }

  const users = await prisma.user.findMany({
    where: { skills: { some: { skillId } } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      bio: true,
      avatarUrl: true,
      skills: { select: { skill: { select: { id: true, name: true } } } },
    },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    skills: user.skills.map((item) => item.skill),
  }));
}

export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) {
    throw new HttpError(400, "Você não pode seguir a si mesmo");
  }

  const target = await prisma.user.findUnique({ where: { id: followingId }, select: { id: true } });
  if (!target) {
    throw new HttpError(404, "Perfil não encontrado");
  }

  try {
    await prisma.follow.create({ data: { followerId, followingId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return;
    }
    throw error;
  }

  await notify({ userId: followingId, actorId: followerId, type: "follow" });
}

export async function unfollowUser(followerId: string, followingId: string) {
  await prisma.follow.deleteMany({
    where: { followerId, followingId },
  });
}
