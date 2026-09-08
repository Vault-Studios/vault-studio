function findImage(projects, imageId) {
  for (const project of projects) {
    const image = project.gallery.find((candidate) => candidate.id === imageId);
    if (image) return { image, project };
  }
}

export function resolveLandingImageValue(slots, projects, key, locale, fallback) {
  const slot = slots.find((candidate) => candidate.slot_key === key && candidate.active);
  if (!slot?.image_id) return fallback;

  const resolved = findImage(projects, slot.image_id);
  if (!resolved) return fallback;
  if (slot.project_id && resolved.image.projectId !== slot.project_id) return fallback;

  const configuredAlt = locale === "sw" ? slot.alt_text_sw : slot.alt_text_en;
  return {
    src: resolved.image.src,
    alt: configuredAlt?.trim() || resolved.image.alt || fallback.alt,
    sourceLabel: resolved.project.client,
    imageId: resolved.image.id,
    projectId: resolved.image.projectId,
  };
}

export function resolveLandingProjectValue(slots, projects, fallback) {
  const slot = slots.find((candidate) => candidate.slot_key === "featured_project" && candidate.active);
  if (!slot?.project_id) return fallback;
  return projects.find((project) => project.id === slot.project_id) || fallback;
}
