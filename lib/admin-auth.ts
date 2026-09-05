import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "./supabase";

export const ADMIN_ACCESS_COOKIE = "vault_admin_access_token";
export const ADMIN_REFRESH_COOKIE = "vault_admin_refresh_token";

type SupabaseUser = {
  id: string;
  email?: string;
};

export type AdminSession = {
  user: SupabaseUser;
  accessToken: string;
};

async function fetchUser(accessToken: string) {
  const { url, key } = getSupabasePublicConfig();
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) return null;
  return (await response.json()) as SupabaseUser;
}

async function isAdmin(userId: string, accessToken: string) {
  const { url, key } = getSupabasePublicConfig();
  const response = await fetch(
    `${url}/rest/v1/admin_users?user_id=eq.${encodeURIComponent(userId)}&select=user_id&limit=1`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) return false;
  const rows = (await response.json()) as Array<{ user_id: string }>;
  return rows.length === 1;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ADMIN_ACCESS_COOKIE)?.value;
  if (!accessToken) return null;

  const user = await fetchUser(accessToken);
  if (!user || !(await isAdmin(user.id, accessToken))) return null;

  return { user, accessToken };
}
