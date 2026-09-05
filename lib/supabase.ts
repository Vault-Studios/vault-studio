type SupabaseRuntimeEnv = {
  SUPABASE_URL?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
};

function runtimeValue(name: keyof SupabaseRuntimeEnv): string {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

export function getSupabasePublicConfig() {
  const configuredUrl = runtimeValue("SUPABASE_URL");
  const key = runtimeValue("SUPABASE_PUBLISHABLE_KEY");

  if (!configuredUrl || !key) {
    throw new Error(
      "Supabase runtime configuration is missing. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY as Worker secrets."
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(configuredUrl);
  } catch {
    throw new Error("SUPABASE_URL is not a valid absolute URL.");
  }

  if (parsedUrl.protocol !== "https:" || parsedUrl.username || parsedUrl.password) {
    throw new Error("SUPABASE_URL must be an HTTPS origin without embedded credentials.");
  }

  return {
    url: parsedUrl.origin,
    key,
  };
}

export function getSupabaseConfigDiagnostics() {
  try {
    const { url, key } = getSupabasePublicConfig();
    const hostname = new URL(url).hostname;
    return {
      configured: true,
      hostname,
      projectRef: hostname.endsWith(".supabase.co") ? hostname.split(".")[0] : null,
      keyType: key.startsWith("sb_publishable_") ? "publishable" : "legacy-anon",
    } as const;
  } catch {
    return {
      configured: false,
      hostname: null,
      projectRef: null,
      keyType: null,
    } as const;
  }
}

export async function supabaseRest(path: string, init?: RequestInit) {
  const { url, key } = getSupabasePublicConfig();
  const headers = new Headers(init?.headers);
  headers.set("apikey", key);

  return fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers,
  });
}
