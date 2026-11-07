import {
  Axe, BookOpen, Car, Castle, CircleDot, CircleHelp, Compass, Crosshair, Dices, Footprints, Gamepad2, Hourglass,
  Joystick, MousePointerClick, Music, Plane, Puzzle, Shield, Sparkles, Swords, Target, Timer, Trophy, Users, WandSparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// IGDB genres have no pictures, so each gets an icon. Bundled, so the sidebar also looks right offline.
const ICONS: Record<string, LucideIcon> = {
  action: Swords,
  adventure: Compass,
  arcade: Joystick,
  'card-and-board-game': Dices,
  fighting: Shield,
  'hack-and-slash-beat-em-up': Axe,
  indie: Sparkles,
  moba: Users,
  music: Music,
  pinball: CircleDot,
  platform: Footprints,
  'point-and-click': MousePointerClick,
  puzzle: Puzzle,
  'quiz-trivia': CircleHelp,
  racing: Car,
  'real-time-strategy-rts': Timer,
  'role-playing-rpg': WandSparkles,
  shooter: Crosshair,
  simulator: Plane,
  sport: Trophy,
  strategy: Castle,
  tactical: Target,
  'turn-based-strategy-tbs': Hourglass,
  'visual-novel': BookOpen,
};

export const genreIcon = (slug: string): LucideIcon => ICONS[slug] ?? Gamepad2;
