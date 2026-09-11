import React, { createContext, useContext, useMemo } from 'react';

/**
 * Visibility states for the background Earth/orbital world.
 * Values correspond to the UI phases described in the spec.
 */
export const BackgroundStateContext = createContext(null);

export const BackgroundProvider = ({ phase, children }) => {
  // Map investigation phases → visibilityState strings used by Earth3DCanvas
  const visibilityState = useMemo(() => {
    switch (phase) {
      case 'EMPTY':
        return 'empty';
      case 'IMAGE_LOADED':
        return 'imageLoaded';
      case 'ANALYZING':
        return 'analyzing';
      case 'FINDING_SELECTED':
        return 'findingSelected';
      case 'SHOW_ME_WHY':
        return 'showMeWhy';
      default:
        return 'empty';
    }
  }, [phase]);

  const value = { visibilityState, phase };
  return (
    <BackgroundStateContext.Provider value={value}>
      {children}
    </BackgroundStateContext.Provider>
  );
};

export const useBackground = () => {
  const ctx = useContext(BackgroundStateContext);
  if (!ctx) {
    throw new Error('useBackground must be used within BackgroundProvider');
  }
  return ctx;
};
