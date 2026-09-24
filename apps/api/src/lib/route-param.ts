import { HttpError } from "./auth-error.js";

export function routeParam(value: string | string[] | undefined) {
  const param = Array.isArray(value) ? value[0] : value;
  if (!param) {
    throw new HttpError(400, "Identificador inválido");
  }
  return param;
}
