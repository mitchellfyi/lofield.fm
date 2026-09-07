/** Return the configured private Supabase endpoint. */
export function supabaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const invalid = () => new Error("Configure a private Supabase base URL");
  let url: URL;
  try {
    url = new URL(value || "");
  } catch {
    throw invalid();
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  const cloud = ["supabase.co", "supabase.com"].some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  );
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
  if (
    cloud ||
    (url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  ) {
    throw invalid();
  }
  return value!;
}
