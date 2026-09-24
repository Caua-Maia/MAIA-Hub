export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class AuthError extends HttpError {
  constructor(status: number, message: string) {
    super(status, message);
    this.name = "AuthError";
  }
}
