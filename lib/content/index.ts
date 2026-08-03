import type { Locale } from "../i18n";
import { localProjects } from "./local";
import { sanityProjects } from "./sanity";

export async function getProjects(locale: Locale) {
  try {
    const projects = await sanityProjects(locale);
    return projects?.length ? projects : localProjects(locale);
  } catch (error) {
    console.error("CMS content unavailable; using local portfolio content", error);
    return localProjects(locale);
  }
}
