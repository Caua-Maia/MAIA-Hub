import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { LoginInput, PublicUser, RegisterInput } from "@maia-hub/shared";
import { AuthError } from "../lib/auth-error.js";
import { prisma } from "../lib/prisma.js";

const passwordRounds = 12;

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
}): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
  };
}

export async function registerUser(input: RegisterInput): Promise<PublicUser> {
  const passwordHash = await bcrypt.hash(input.password, passwordRounds);

  try {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
      },
    });

    return toPublicUser(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AuthError(409, "E-mail já cadastrado");
    }

    throw error;
  }
}

export async function loginUser(input: LoginInput): Promise<PublicUser> {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  const passwordMatches = user ? await bcrypt.compare(input.password, user.passwordHash) : false;
  if (!user || !passwordMatches) {
    throw new AuthError(401, "E-mail ou senha inválidos");
  }

  return toPublicUser(user);
}

export async function findUserById(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return null;
  }

  return toPublicUser(user);
}
