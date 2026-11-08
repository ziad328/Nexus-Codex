import { useState } from 'react';
import type { FC } from 'react';
import { Trophy } from 'lucide-react';
import type { GameDetails } from '../../types';

interface Props {
  achievements: GameDetails['steam_achievements'] | undefined;
}

/** Steam's achievement count and a strip of the ones it highlights; hovering or tapping an icon names it. */
const SteamAchievements: FC<Props> = ({ achievements }) => {
  const [active, setActive] = useState<string | null>(null);
  if (!achievements) return null;
  const { total, highlighted } = achievements;

  return (
    <section aria-labelledby="steam-achievements">
      <h2 id="steam-achievements" className="text-lg font-semibold text-zinc-100 mb-3 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-accent" aria-hidden />
        Achievements
        <span className="text-sm font-normal text-zinc-500">{total} on Steam</span>
      </h2>
      {highlighted.length > 0 && (
        <>
          <ul className="flex flex-wrap gap-2" onMouseLeave={() => setActive(null)}>
            {highlighted.map(({ name, icon }) => (
              <li key={icon}>
                <button
                  type="button"
                  aria-label={name}
                  onMouseEnter={() => setActive(name)}
                  onFocus={() => setActive(name)}
                  // Safari doesn't focus a tapped button, so a tap names it too.
                  onClick={() => setActive(name)}
                  onBlur={() => setActive(null)}
                  className={`block rounded-md overflow-hidden ring-1 transition-all ${
                    active === name ? 'ring-accent scale-105' : 'ring-white/10 opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={icon} alt="" loading="lazy" className="w-10 h-10" />
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 h-5 text-sm text-zinc-400 truncate" aria-live="polite">{active ?? ''}</p>
        </>
      )}
    </section>
  );
};

export default SteamAchievements;
