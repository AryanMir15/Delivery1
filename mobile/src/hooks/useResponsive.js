import { useWindowDimensions } from 'react-native';

const BASE_WIDTH = 375;
const MAX_SCALE = 1.25;

export default function useResponsive() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const scale = Math.min(screenWidth / BASE_WIDTH, MAX_SCALE);
  const isTablet = screenWidth >= 600;

  const s = (size) => Math.round(size * scale);

  return { scale, isTablet, screenWidth, screenHeight, s };
}
