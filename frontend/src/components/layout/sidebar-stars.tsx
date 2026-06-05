'use client';

import { useMemo } from 'react';

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

type Star = {
  id: number;
  top: string;
  left: string;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  dx: number;
  dy: number;
  variant: 'white' | 'orange' | 'gold';
  twinkle: boolean;
};

export function SidebarStars({ count = 72 }: { count?: number }) {
  const stars = useMemo(() => {
    return Array.from({ length: count }, (_, i): Star => {
      const variantRoll = seededRandom(i * 10.1);
      const variant: Star['variant'] =
        variantRoll > 0.55 ? 'white' : variantRoll > 0.25 ? 'orange' : 'gold';

      return {
        id: i,
        top: `${seededRandom(i * 1.1) * 100}%`,
        left: `${seededRandom(i * 2.3) * 100}%`,
        size: seededRandom(i * 3.7) * 3.2 + 1.2,
        opacity: seededRandom(i * 4.9) * 0.5 + 0.35,
        duration: seededRandom(i * 5.1) * 22 + 10,
        delay: seededRandom(i * 6.3) * 12,
        dx: (seededRandom(i * 7.1) - 0.5) * 120,
        dy: (seededRandom(i * 8.2) - 0.5) * 120,
        variant,
        twinkle: seededRandom(i * 9.4) > 0.5,
      };
    });
  }, [count]);

  return (
    <div className="sidebar-stars" aria-hidden="true">
      {stars.map((star) => (
        <span
          key={star.id}
          className={[
            'sidebar-star',
            `sidebar-star--${star.variant}`,
            star.twinkle ? 'sidebar-star--twinkle' : '',
          ].join(' ')}
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            ['--star-opacity' as string]: String(star.opacity),
            ['--star-dx' as string]: `${star.dx}px`,
            ['--star-dy' as string]: `${star.dy}px`,
            ['--star-duration' as string]: `${star.duration}s`,
            ['--star-delay' as string]: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
