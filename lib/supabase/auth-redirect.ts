/** Keep auth returns on the public site when the server listens on an internal address. */
export function authRedirect(request: Request, path: string): URL {
  const origin = new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.NODE_ENV === "production" ? "https://lofield.fm" : request.url)
  ).origin;
  const safePath =
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes("://") &&
    !/[\\\x00-\x20\x7f]/.test(path)
      ? path
      : "/studio";
  return new URL(safePath, origin);
}
