import { VIDEO_CATEGORIES } from "./videoLibrary";

export interface ResistanceExercise {
  name: string;
  sets: string;
}

export interface StretchExercise {
  name: string;
  duration: string;
}

export interface BreathworkExercise {
  name: string;
  duration: string;
  description: string;
}

export const CARDIO_OPTIONS = VIDEO_CATEGORIES.filter((c) =>
  ["zumba-studio", "zumba-outdoor", "bellydance", "inperson-zumba", "livestream"].includes(c.id)
);

export const RESISTANCE_EXERCISES: ResistanceExercise[] = [
  { name: "Bodyweight Squats", sets: "3 sets x 12 reps" },
  { name: "Push-Ups (knee or full)", sets: "3 sets x 10 reps" },
  { name: "Glute Bridges", sets: "3 sets x 15 reps" },
  { name: "Walking Lunges", sets: "3 sets x 10 reps per leg" },
  { name: "Dumbbell Rows", sets: "3 sets x 12 reps" },
  { name: "Plank Hold", sets: "3 sets x 30-45 sec" },
  { name: "Wall Sit", sets: "3 sets x 30 sec" },
  { name: "Standing Calf Raises", sets: "3 sets x 15 reps" },
  { name: "Resistance Band Rows", sets: "3 sets x 12 reps" },
  { name: "Bicycle Crunches", sets: "3 sets x 20 reps" },
];

export const STRETCHES: StretchExercise[] = [
  { name: "Standing Forward Fold", duration: "45 sec" },
  { name: "Cat-Cow Stretch", duration: "1 min" },
  { name: "Seated Spinal Twist", duration: "30 sec per side" },
  { name: "Hip Flexor Lunge Stretch", duration: "30 sec per side" },
  { name: "Child's Pose", duration: "1 min" },
  { name: "Shoulder & Chest Opener", duration: "45 sec" },
  { name: "Hamstring Stretch", duration: "30 sec per side" },
  { name: "Figure-Four Glute Stretch", duration: "30 sec per side" },
];

export const BREATHWORK: BreathworkExercise[] = [
  {
    name: "Box Breathing",
    duration: "3 min",
    description: "Inhale 4, hold 4, exhale 4, hold 4. Repeat to settle the nervous system.",
  },
  {
    name: "4-7-8 Breath",
    duration: "3 min",
    description: "Inhale for 4, hold for 7, exhale slowly for 8. Great for winding down.",
  },
  {
    name: "Diaphragmatic Breathing",
    duration: "5 min",
    description: "Slow belly breaths to restore calm and improve oxygen flow after movement.",
  },
  {
    name: "Alternate Nostril Breathing",
    duration: "4 min",
    description: "Balance your energy with this classic mindfulness breathing pattern.",
  },
];

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export interface WorkoutPlan {
  cardio: (typeof VIDEO_CATEGORIES)[number];
  resistance: ResistanceExercise[];
  stretches: StretchExercise[];
  breathwork: BreathworkExercise;
}

export function generateWorkout(): WorkoutPlan {
  return {
    cardio: pickRandom(CARDIO_OPTIONS, 1)[0],
    resistance: pickRandom(RESISTANCE_EXERCISES, 5),
    stretches: pickRandom(STRETCHES, 4),
    breathwork: pickRandom(BREATHWORK, 1)[0],
  };
}
