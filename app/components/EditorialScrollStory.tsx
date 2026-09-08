"use client";

import { useEffect } from "react";

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export default function EditorialScrollStory() {
  useEffect(() => {
    const stories = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll-story]"));
    if (!stories.length) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;
      const viewport = window.innerHeight;

      stories.forEach((story) => {
        const rect = story.getBoundingClientRect();
        const travel = Math.max(1, rect.height + viewport);
        const progress = motionQuery.matches ? 0 : clamp((viewport - rect.top) / travel);
        const enter = clamp(progress * 2.4);
        const exit = clamp((progress - 0.58) * 2.38);

        story.style.setProperty("--story-progress", progress.toFixed(4));
        story.style.setProperty("--story-enter", enter.toFixed(4));
        story.style.setProperty("--story-exit", exit.toFixed(4));
        story.style.setProperty("--story-reveal", `${((1 - enter) * 100).toFixed(2)}%`);
        story.style.setProperty("--story-shift", `${((progress - 0.5) * 16).toFixed(2)}vw`);
      });
    };

    const queueUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate);
    motionQuery.addEventListener("change", queueUpdate);

    return () => {
      window.removeEventListener("scroll", queueUpdate);
      window.removeEventListener("resize", queueUpdate);
      motionQuery.removeEventListener("change", queueUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
