import { Music, Radio, Sun, Users, Waves, type LucideIcon } from "lucide-react";

export interface VideoCategory {
  id: string;
  title: string;
  description: string;
  url: string;
  image?: string;
  icon: LucideIcon;
  color: string;
  trialLocked?: boolean;
}

export const VIDEO_CATEGORIES: VideoCategory[] = [
  {
    id: "livestream",
    title: "Livestream Classes",
    description: "Join Loretta live for real-time classes and Q&A sessions.",
    url: "https://lorettabates.com/videolibrary.lorettabates.com/wellcollective/livestream-with-loretta-2/",
    image: "https://lorettabates.com/videolibrary.lorettabates.com/wp-content/uploads/2025/04/IMG_5168-scaled.jpg",
    icon: Radio,
    color: "#0191CE",
  },
  {
    id: "inperson-zumba",
    title: "In-Person Zumba® Classes",
    description: "Recordings and highlights from in-person Zumba sessions.",
    url: "https://lorettabates.com/videolibrary.lorettabates.com/media_category/inpersonclasses/",
    image:
      "https://lorettabates.com/videolibrary.lorettabates.com/wp-content/uploads/2025/04/Screen-Shot-2022-09-27-at-11.06.44-AM.png",
    icon: Users,
    color: "#01519D",
  },
  {
    id: "zumba-studio",
    title: "Zumba® Studio Classes",
    description: "High-energy dance cardio filmed in the studio.",
    url: "https://lorettabates.com/videolibrary.lorettabates.com/media_category/zumbastudioclasses/",
    image:
      "https://lorettabates.com/videolibrary.lorettabates.com/wp-content/uploads/2024/02/Screenshot-2025-04-09-at-3.10.19%E2%80%AFPM.png",
    icon: Music,
    color: "#84D8FD",
    trialLocked: true,
  },
  {
    id: "zumba-outdoor",
    title: "Zumba® Outdoor Classes",
    description: "Take your dance cardio outside with these sessions.",
    url: "https://lorettabates.com/videolibrary.lorettabates.com/media_category/zumba-outdoor-classes/",
    image: "https://lorettabates.com/videolibrary.lorettabates.com/wp-content/uploads/2024/02/DSC_2542-scaled.jpg",
    icon: Sun,
    color: "#0191CE",
    trialLocked: true,
  },
  {
    id: "bellydance",
    title: "Fitness Bellydance Classes",
    description: "Sculpt and flow with fitness-focused bellydance routines.",
    url: "https://lorettabates.com/videolibrary.lorettabates.com/media_category/fitnessbellydanceclasses/",
    image: "https://lorettabates.com/videolibrary.lorettabates.com/wp-content/uploads/2024/02/LDloretta0371-2.jpg",
    icon: Waves,
    color: "#84D8FD",
    trialLocked: true,
  },
];
