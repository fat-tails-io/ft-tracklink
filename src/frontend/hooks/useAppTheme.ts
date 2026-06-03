import { useMemo } from 'react';
import { useProductContext } from '@forge/react';

/**
 * Theme key for re-rendering when Jira light/dark changes.
 * useTheme from @forge/react is not yet in this SDK version; product context theme is the supported fallback.
 */
export const useAppTheme = (): string => {
  const productContext = useProductContext();

  return useMemo(() => {
    const colorMode = productContext?.theme?.colorMode;
    return typeof colorMode === 'string' ? colorMode : 'default';
  }, [productContext?.theme?.colorMode]);
};
