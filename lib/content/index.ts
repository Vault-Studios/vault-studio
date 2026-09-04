import type { Locale } from "../i18n";
import { localProjects } from "./local";
import { supabaseProjects } from "./supabase";

export async function getProjects(locale: Locale) {
  try {
    const projects = await supabaseProjects(locale);
    return projects?.length ? projects : localProjects(locale);
  } catch (error) {
    console.error("Supabase CMS unavailable; using local portfolio content", error);
    return localProjects(locale);
  }
}
