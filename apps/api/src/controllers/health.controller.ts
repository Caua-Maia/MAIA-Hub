import type { Request, Response } from "express";
import { healthResponseSchema } from "@maia-hub/shared";

export function healthController(_request: Request, response: Response) {
  const body = healthResponseSchema.parse({ status: "ok" });
  response.json(body);
}
