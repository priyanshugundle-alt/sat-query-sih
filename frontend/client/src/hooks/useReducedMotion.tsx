import { useEffect, useState } from 'react';

/**
 * Hook that returns true when the user prefers reduced motion.
 * It listens for changes to the media query and updates accordingly.
 */
export const useReducedMotion = () => {
  const [reduced, setReduced] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const listener = (e) => setReduced(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  return reduced;
};
