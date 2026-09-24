import { SignJWT, jwtVerify } from "jose";

const tokenLifetime = "7d";

function secretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET precisa ter pelo menos 32 caracteres");
  }

  return new TextEncoder().encode(secret);
}

export async function signAccessToken(userId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(tokenLifetime)
    .sign(secretKey());
}

export async function readAccessToken(token: string) {
  const { payload } = await jwtVerify(token, secretKey());
  if (!payload.sub) {
    throw new Error("Token sem sujeito");
  }

  return payload.sub;
}
