import type { PublicUser } from "@maia-hub/shared";

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}

export {};
