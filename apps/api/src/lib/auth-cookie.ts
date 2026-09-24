import type { CookieOptions, Response } from "express";

export const accessTokenCookie = "access_token";

const weekInMs = 7 * 24 * 60 * 60 * 1000;

function cookieOptions(): CookieOptions {
  const crossSite = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    sameSite: crossSite ? "none" : "lax",
    secure: crossSite,
    path: "/",
    maxAge: weekInMs,
  };
}

export function setAccessTokenCookie(response: Response, token: string) {
  response.cookie(accessTokenCookie, token, cookieOptions());
}

export function clearAccessTokenCookie(response: Response) {
  const { maxAge: _maxAge, ...options } = cookieOptions();
  response.clearCookie(accessTokenCookie, options);
}
