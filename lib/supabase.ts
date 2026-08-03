const fallbackUrl = "https://hxqsnztxokfemmysyjyw.supabase.co";
const fallbackKey = "sb_publishable_eu-_vai9eG2R89we1eIlxw_Quzds9c9";

export function getSupabasePublicConfig() {
  return {
    url: process.env.SUPABASE_URL ?? fallbackUrl,
    key: process.env.SUPABASE_PUBLISHABLE_KEY ?? fallbackKey,
  };
}

export async function supabaseRest(path: string, init?: RequestInit) {
  const { url, key } = getSupabasePublicConfig();
  return fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...init?.headers,
    },
  });
}
