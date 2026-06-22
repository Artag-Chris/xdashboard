export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly path: string,
  ) {
    super(`${status} ${message} — ${path}`);
    this.name = "ApiError";
  }
}
