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
  {
    name: "Sumo Squats",
    sets: "3 sets x 12 reps",
    description:
      "Stand with feet wider than shoulder-width and toes turned out at 45 degrees. Keeping your chest tall and knees tracking over your toes, lower your hips straight down until thighs are parallel to the floor, then squeeze your inner thighs and glutes to press back up.",
  },
  {
    name: "Reverse Lunges",
    sets: "3 sets x 10 reps per leg",
    description:
      "Stand tall, then step one foot straight back and lower your back knee toward the floor until both knees form 90-degree angles. Keep your front shin vertical and torso upright. Push through your front heel to return to standing, then repeat on the other side.",
  },
  {
    name: "Tricep Dips",
    sets: "3 sets x 12 reps",
    description:
      "Sit on the edge of a sturdy chair or bench with hands gripping the edge beside your hips. Slide your hips off and bend your elbows to lower your body straight down, keeping your back close to the chair. Press through your palms to straighten your arms and return to the start.",
  },
  {
    name: "Side-Lying Leg Lifts",
    sets: "3 sets x 15 reps per side",
    description:
      "Lie on your side with your body in a straight line, head resting on your lower arm. Keeping your top leg straight and foot flexed, lift it toward the ceiling about 12–18 inches, pause, then lower with control. Complete all reps before switching sides.",
  },
  {
    name: "Donkey Kicks",
    sets: "3 sets x 15 reps per side",
    description:
      "Start on your hands and knees in a tabletop position with wrists under your shoulders and knees under your hips. Keeping your knee bent at 90 degrees and core engaged, drive one heel straight up toward the ceiling until your thigh is parallel to the floor. Lower and repeat before switching legs.",
  },
  {
    name: "Dead Bug",
    sets: "3 sets x 10 reps per side",
    description:
      "Lie on your back with arms extended toward the ceiling and knees bent at 90 degrees, shins parallel to the floor. Slowly lower one arm overhead and extend the opposite leg straight, keeping your lower back pressed into the floor throughout. Return and alternate sides in a controlled, deliberate movement.",
  },
  {
    name: "Lateral Band Walks",
    sets: "3 sets x 12 steps each direction",
    description:
      "Place a resistance band just above your knees and stand with feet hip-width apart and a slight bend in your knees. Keeping tension in the band, step sideways with one foot and bring the other to follow, maintaining the same width. Walk in one direction then reverse, staying low throughout.",
  },
  {
    name: "Single-Leg Deadlift",
    sets: "3 sets x 10 reps per side",
    description:
      "Stand on one foot with a soft bend in that knee. Hinge forward from your hips, extending your free leg behind you as your torso comes toward parallel with the floor. Hold a dumbbell in the opposite hand if desired. Squeeze your glute to drive back to standing.",
  },
  {
    name: "Shoulder Press",
    sets: "3 sets x 12 reps",
    description:
      "Hold a dumbbell in each hand at shoulder height with palms facing forward, elbows at 90 degrees. Brace your core to avoid arching your back, then press both weights straight overhead until arms are extended. Lower slowly back to the starting position.",
  },
  {
    name: "Dumbbell Bicep Curls",
    sets: "3 sets x 12 reps",
    description:
      "Stand or sit tall holding a dumbbell in each hand with arms fully extended and palms facing forward. Keep your elbows tucked close to your sides as you curl both weights toward your shoulders, squeezing your biceps at the top. Lower slowly back down.",
  },
  {
    name: "Superman Hold",
    sets: "3 sets x 12 reps",
    description:
      "Lie face down with arms extended overhead. Simultaneously lift your arms, chest, and legs off the floor by squeezing your glutes and back muscles, forming a gentle arc. Hold for 2–3 seconds at the top, then lower back down with control.",
  },
  {
    name: "Step-Ups",
    sets: "3 sets x 12 reps per leg",
    description:
      "Stand in front of a sturdy step or low chair. Place one foot fully on the step, press through that heel to lift your whole body up, then bring the other foot up to meet it. Step back down one foot at a time. Add dumbbells to increase the challenge.",
  },
  {
    name: "Squat to Overhead Press",
    sets: "3 sets x 10 reps",
    description:
      "Hold a dumbbell at each shoulder. Lower into a squat, keeping your chest up and knees tracking your toes. As you drive back to standing, press the weights overhead until arms are fully extended. Lower the weights back to shoulders as you descend into the next squat.",
  },
  {
    name: "Renegade Rows",
    sets: "3 sets x 8 reps per side",
    description:
      "Start in a high plank with each hand gripping a dumbbell, feet slightly wider than hip-width for stability. Keeping your hips square to the floor, pull one dumbbell up toward your ribcage, leading with your elbow. Lower it back down and repeat on the other side, maintaining a tight core throughout.",
  },
  {
    name: "Hip Thrusts",
    sets: "3 sets x 15 reps",
    description:
      "Sit on the floor with your upper back resting against a couch or bench and knees bent, feet flat. Drive through your heels to thrust your hips upward until your body forms a straight line from shoulders to knees. Squeeze your glutes hard at the top, then lower with control.",
  },
  {
    name: "Side Plank",
    sets: "3 sets x 20-30 sec per side",
    description:
      "Lie on your side and prop yourself up on one forearm with elbow directly under your shoulder. Stack your feet or stagger them for balance, then lift your hips to form a straight line from head to heels. Hold without letting your hips drop, then switch sides.",
  },
  {
    name: "Resistance Band Chest Press",
    sets: "3 sets x 12 reps",
    description:
      "Anchor a resistance band behind you at chest height (loop it around a door frame or pole). Hold one end in each hand and step forward until there is tension in the band. With elbows bent at 90 degrees, press both hands forward until arms are extended, then slowly return to the start.",
  },
  {
    name: "Goblet Squat",
    sets: "3 sets x 12 reps",
    description:
      "Hold a single dumbbell vertically at your chest with both hands cupped around the top end. Stand with feet slightly wider than hip-width and toes turned out. Squat down between your knees while keeping your elbows inside your thighs, chest tall, and heels flat. Press back up to standing.",
  },
  {
    name: "Tricep Kickbacks",
    sets: "3 sets x 12 reps",
    description:
      "Hinge forward at the hips with a flat back and hold a dumbbell in each hand. Bring your elbows to your sides at 90 degrees, then extend both forearms straight back until arms are parallel to the floor. Squeeze your triceps at the top, then return slowly to start.",
  },
  {
    name: "Mountain Climbers",
    sets: "3 sets x 20 reps (10 per side)",
    description:
      "Start in a high plank with hands under your shoulders and body in a straight line. Drive one knee toward your chest, then quickly switch legs in a running motion, keeping your hips level and core tight throughout. Move at a steady, controlled pace.",
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
  {
    name: "Neck Rolls",
    duration: "1 min",
    description:
      "Sit or stand tall and slowly drop one ear toward your shoulder, feeling a gentle stretch along the side of your neck. Slowly roll your chin toward your chest, then to the other side. Move through a half circle in each direction at a relaxed, even pace.",
  },
  {
    name: "Supine Twist",
    duration: "30 sec per side",
    description:
      "Lie on your back and draw one knee to your chest. Gently guide that knee across your body to the opposite side, extending your same-side arm out wide and turning your head away from the knee. Let gravity do the work as your spine decompresses.",
  },
  {
    name: "Doorway Chest Stretch",
    duration: "30 sec per side",
    description:
      "Stand in a doorway and place one forearm on the door frame with your elbow at 90 degrees. Step slightly forward until you feel an opening stretch across your chest and the front of your shoulder. Hold, breathe, then switch sides.",
  },
  {
    name: "Seated Butterfly",
    duration: "1 min",
    description:
      "Sit on the floor and bring the soles of your feet together, letting your knees fall out to the sides. Hold your feet and sit tall, then gently fold forward from your hips — not rounding your back — until you feel a stretch through your inner thighs and hips.",
  },
  {
    name: "Thread the Needle",
    duration: "30 sec per side",
    description:
      "Start in tabletop on hands and knees. Slide one arm under your body along the floor, lowering that shoulder toward the ground, and let your head rest with your cheek down. Feel the rotational stretch through your upper back and shoulder. Return and switch sides.",
  },
  {
    name: "Low Lunge Quad Stretch",
    duration: "30 sec per side",
    description:
      "From a low lunge, rest your back knee on the floor and reach back to hold the top of your back foot. Gently draw the heel toward your glute while keeping your hips squared forward, feeling a deep stretch through the front of the thigh and hip.",
  },
  {
    name: "Wide-Leg Seated Fold",
    duration: "45 sec",
    description:
      "Sit on the floor and open your legs as wide as is comfortable. Sit up tall first, then walk your hands forward along the floor between your legs, folding at the hips. Let your upper body relax toward the floor while keeping your knees pointing straight up.",
  },
  {
    name: "Cow Face Arms",
    duration: "30 sec per side",
    description:
      "Reach one arm overhead and bend that elbow to bring your hand down your upper back. Reach the other arm behind your lower back and try to clasp your fingers together (or hold a strap). Keep your chest open and avoid letting the top elbow flare out to the side.",
  },
  {
    name: "Standing Quad Stretch",
    duration: "30 sec per side",
    description:
      "Stand on one foot (hold a wall for balance if needed) and bend your other knee, reaching back to hold the ankle or top of the foot. Draw the heel gently toward your glute while keeping your knees close together and your standing posture tall.",
  },
  {
    name: "Lying Piriformis Stretch",
    duration: "30 sec per side",
    description:
      "Lie on your back with both knees bent. Cross one ankle just above the opposite knee and flex that foot. Lift the bottom foot off the floor and thread your hands around the back of the lower thigh, gently pulling it toward your chest until you feel a deep stretch in the outer hip.",
  },
  {
    name: "Doorway Calf Stretch",
    duration: "30 sec per side",
    description:
      "Stand facing a wall and place one foot about a stride behind the other. Keeping the back heel flat on the floor and the back leg straight, lean your hands into the wall until you feel a stretch through the calf and Achilles tendon. Switch sides.",
  },
  {
    name: "Upper Trapezius Stretch",
    duration: "30 sec per side",
    description:
      "Sit or stand tall and reach one hand behind your back or hold your wrist with the opposite hand. Tilt your ear toward the opposite shoulder and gently apply light pressure with the hand on that side of your head. Feel a long stretch through the side of your neck into your shoulder.",
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

export function generateWorkout(date?: Date): WorkoutPlan {
  // On Tuesdays, always use livestream
  let cardioOption = pickRandom(CARDIO_OPTIONS, 1)[0];
  if (date) {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 2) { // Tuesday
      cardioOption = CARDIO_OPTIONS.find((c) => c.id === "livestream") || cardioOption;
    }
  }

  return {
    cardio: cardioOption,
    resistance: pickRandom(RESISTANCE_EXERCISES, 5),
    stretches: pickRandom(STRETCHES, 4),
    breathwork: pickRandom(BREATHWORK, 1)[0],
  };
}
