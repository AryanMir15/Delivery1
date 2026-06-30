import { Platform } from 'react-native';

const base = (elevation = 2) => ({
  shadowColor: '#000',
  shadowOffset: { width: 0, height: elevation / 2 },
  shadowOpacity: 0.15,
  shadowRadius: elevation,
  elevation: Platform.OS === 'android' ? elevation : 0,
});

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: base(1),
  md: base(3),
  lg: base(6),
  xl: base(10),
  card: base(2),
  float: base(8),
};
