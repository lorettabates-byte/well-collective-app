import { VIDEO_CATEGORIES } from "./videoLibrary";

export interface ResistanceExercise {
  name: string;
  sets: string;
  description: string;
}

export interface StretchExercise {
  name: string;
  duration: string;
  description: string;
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
  {
    name: "Bodyweight Squats",
    sets: "3 sets x 12 reps",
    description:
      "Stand with feet shoulder-width apart, toes slightly turned out. Bend your knees and push your hips back as if sitting into a chair, keeping your chest lifted and knees tracking over your toes. Lower until thighs are roughly parallel to the floor, then drive through your heels to stand back up.",
  },
  {
    name: "Push-Ups (knee or full)",
    sets: "3 sets x 10 reps",
    description:
      "Start in a plank position with hands slightly wider than shoulders (drop to your knees for an easier version). Keep your core tight and body in a straight line as you bend your elbows to lower your chest toward the floor, then press back up to the starting position.",
  },
  {
    name: "Glute Bridges",
    sets: "3 sets x 15 reps",
    description:
      "Lie on your back with knees bent and feet flat on the floor, hip-width apart. Press through your heels to lift your hips toward the ceiling, squeezing your glutes at the top. Lower back down with control and repeat.",
  },
  {
    name: "Walking Lunges",
    sets: "3 sets x 10 reps per leg",
    description:
      "Step forward with one leg and lower your hips until both knees are bent at about 90 degrees, keeping your front knee over your ankle. Push off your back foot and step forward into the next lunge, alternating legs as you move across the room.",
  },
  {
    name: "Dumbbell Rows",
    sets: "3 sets x 12 reps",
    description:
      "Hinge forward at the hips with a slight bend in your knees, holding a dumbbell in each hand (or one item with handles) with arms extended toward the floor. Pull your elbows back and squeeze your shoulder blades together to bring the weights toward your ribs, then lower with control.",
  },
  {
    name: "Plank Hold",
    sets: "3 sets x 30-45 sec",
    description:
      "Get into a forearm plank with elbows under your shoulders and body forming a straight line from head to heels. Engage your core and glutes, keep your hips level (don't let them sag or pike up), and breathe steadily while holding the position.",
  },
  {
    name: "Wall Sit",
    sets: "3 sets x 30 sec",
    description:
      "Stand with your back against a wall and slide down until your knees are bent at about 90 degrees, like sitting in an invisible chair. Keep your back flat against the wall and your knees aligned over your ankles, holding the position for the full time.",
  },
  {
    name: "Standing Calf Raises",
    sets: "3 sets x 15 reps",
    description:
      "Stand tall with feet hip-width apart, holding onto something for balance if needed. Slowly rise up onto the balls of your feet as high as you can, pause briefly, then lower your heels back down with control.",
  },
  {
    name: "Resistance Band Rows",
    sets: "3 sets x 12 reps",
    description:
      "Loop a resistance band around a sturdy anchor (or your feet if seated) and hold an end in each hand with arms extended. Pull both handles toward your torso, leading with your elbows and squeezing your shoulder blades together, then return slowly to start.",
  },
  {
    name: "Bicycle Crunches",
    sets: "3 sets x 20 reps",
    description:
      "Lie on your back with hands lightly behind your head and knees bent. Lift your shoulders off the floor and bring one knee toward your chest while rotating to touch it with the opposite elbow, then switch sides in a pedaling motion, keeping your lower back pressed into the floor.",
  },
];

export const STRETCHES: StretchExercise[] = [
  {
    name: "Standing Forward Fold",
    duration: "45 sec",
    description:
      "Stand with feet hip-width apart and slowly hinge forward from your hips, letting your head and arms hang toward the floor. Keep a soft bend in your knees and let your spine relax, feeling a gentle stretch along the back of your legs and spine.",
  },
  {
    name: "Cat-Cow Stretch",
    duration: "1 min",
    description:
      "Start on your hands and knees in a tabletop position. Inhale as you drop your belly and lift your chest and tailbone (cow), then exhale as you round your spine toward the ceiling and tuck your chin (cat). Move slowly between the two positions with your breath.",
  },
  {
    name: "Seated Spinal Twist",
    duration: "30 sec per side",
    description:
      "Sit on the floor with legs extended, then bend one knee and place that foot flat on the floor outside the opposite thigh. Twist your torso toward the bent knee, placing one hand behind you for support and the other on the knee, and breathe into the stretch before switching sides.",
  },
  {
    name: "Hip Flexor Lunge Stretch",
    duration: "30 sec per side",
    description:
      "Step one foot forward into a low lunge with your back knee resting on the floor. Keep your front knee over your ankle and gently shift your hips forward until you feel a stretch along the front of your back hip, keeping your torso upright.",
  },
  {
    name: "Child's Pose",
    duration: "1 min",
    description:
      "Kneel on the floor with big toes touching and knees spread wide. Sit your hips back toward your heels and walk your hands forward, lowering your chest toward the floor and resting your forehead down, breathing deeply into your lower back.",
  },
  {
    name: "Shoulder & Chest Opener",
    duration: "45 sec",
    description:
      "Stand or sit tall and clasp your hands behind your lower back (or hold a towel between them if your shoulders are tight). Gently straighten your arms and lift your chest, drawing your shoulder blades together to open the front of your shoulders and chest.",
  },
  {
    name: "Hamstring Stretch",
    duration: "30 sec per side",
    description:
      "Lie on your back and loop a towel or strap around one foot, extending that leg toward the ceiling while keeping the other leg flat on the floor. Gently pull the leg toward you until you feel a stretch along the back of your thigh, keeping your knee soft.",
  },
  {
    name: "Figure-Four Glute Stretch",
    duration: "30 sec per side",
    description:
      "Lie on your back with knees bent. Cross one ankle over the opposite thigh just above the knee, then thread your hands behind the uncrossed thigh and gently pull it toward your chest, feeling a stretch deep in the glute of the crossed leg.",
  },
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

// A user-saved snapshot of a generated WorkoutPlan. Stores the cardio
// category's id rather than the full object, since VIDEO_CATEGORIES entries
// carry a LucideIcon component reference that can't round-trip through
// localStorage/JSON — the icon/color/title are looked up again at render
// time via cardioId.
export interface SavedWorkoutPlan {
  id: string;
  savedAt: string;
  cardioId: string;
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
