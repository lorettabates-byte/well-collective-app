import { Music, Radio, Sun, Users, Waves, type LucideIcon } from "lucide-react";

export interface VideoCategory {
  id: string;
  title: string;
  description: string;
  url: string;
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
    icon: Radio,
    color: "#0191CE",
  },
  {
    id: "inperson-zumba",
    title: "In-Person Zumba® Classes",
    description: "Recordings and highlights from in-person Zumba sessions.",
    url: "https://lorettabates.com/videolibrary.lorettabates.com/media_category/inpersonclasses/",
    icon: Users,
    color: "#01519D",
  },
  {
    id: "zumba-studio",
    title: "Zumba® Studio Classes",
    description: "High-energy dance cardio filmed in the studio.",
    url: "https://lorettabates.com/videolibrary.lorettabates.com/media_category/zumbastudioclasses/",
    icon: Music,
    color: "#84D8FD",
    trialLocked: true,
  },
  {
    id: "zumba-outdoor",
    title: "Zumba® Outdoor Classes",
    description: "Take your dance cardio outside with these sessions.",
    url: "https://lorettabates.com/videolibrary.lorettabates.com/media_category/zumba-outdoor-classes/",
    icon: Sun,
    color: "#0191CE",
    trialLocked: true,
  },
  {
    id: "bellydance",
    title: "Fitness Bellydance Classes",
    description: "Sculpt and flow with fitness-focused bellydance routines.",
    url: "https://lorettabates.com/videolibrary.lorettabates.com/media_category/fitnessbellydanceclasses/",
    icon: Waves,
    color: "#84D8FD",
    trialLocked: true,
  },
];
