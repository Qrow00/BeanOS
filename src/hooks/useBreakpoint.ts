import { useWindowDimensions } from 'react-native';
import { BREAKPOINTS } from '../utils/constants';

export interface BreakpointInfo {
  width: number;
  height: number;
  isLandscape: boolean;
  isTablet: boolean;
  isWide: boolean;
  /** POS: persistent side-by-side cart pane */
  posSplitView: boolean;
  /** Master-detail two-pane layouts (history etc.) */
  twoPane: boolean;
}

export function useBreakpoint(): BreakpointInfo {
  const { width, height } = useWindowDimensions();
  const minSide = Math.min(width, height);
  return {
    width,
    height,
    isLandscape: width > height,
    isTablet: minSide >= BREAKPOINTS.tablet,
    isWide: width >= BREAKPOINTS.wide,
    posSplitView: width >= BREAKPOINTS.posSideCart,
    twoPane: width >= BREAKPOINTS.wide,
  };
}
