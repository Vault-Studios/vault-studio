// Copy this schema into a Sanity Studio's schemaTypes folder.
type ValidationRule = {
  required: () => ValidationRule;
};

export const project = {
  name: "project",
  title: "Project",
  type: "document",
  fields: [
    { name: "title", type: "string", validation: (rule: ValidationRule) => rule.required() },
    { name: "slug", type: "slug", options: { source: "title" }, validation: (rule: ValidationRule) => rule.required() },
    { name: "language", type: "string", options: { list: [{ title: "English", value: "en" }, { title: "Kiswahili", value: "sw" }] }, validation: (rule: ValidationRule) => rule.required() },
    { name: "featuredOrder", type: "number", initialValue: 10 },
    { name: "client", type: "string", validation: (rule: ValidationRule) => rule.required() },
    { name: "category", type: "string" },
    { name: "year", type: "string" },
    { name: "summary", type: "text", rows: 4 },
    { name: "location", type: "string" },
    { name: "services", type: "string" },
    { name: "coverImage", type: "image", options: { hotspot: true } },
    { name: "gallery", type: "array", of: [{ type: "object", fields: [
      { name: "image", type: "image", options: { hotspot: true } },
      { name: "alt", type: "string" }, { name: "caption", type: "string" },
    ] }] },
    { name: "video", type: "object", fields: [
      { name: "streamUid", title: "Cloudflare Stream UID", type: "string" },
      { name: "mp4Url", title: "Fallback MP4 URL", type: "url" },
      { name: "poster", type: "image" }, { name: "duration", type: "string" },
    ] },
  ],
};
