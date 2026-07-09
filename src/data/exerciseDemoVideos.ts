export interface ExerciseDemoVideo {
  file: string;
}

export function exerciseDemoSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getExerciseDemoVideo(name: string): ExerciseDemoVideo {
  return { file: `${exerciseDemoSlug(name)}.mp4` };
}
