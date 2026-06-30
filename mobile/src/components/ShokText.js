import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

export default function ShokText({ fontSize = 60 }) {
  return (
    <View style={styles.container}>
      <Svg width="300" height="90" viewBox="0 0 300 90">
        <Defs>
          <LinearGradient id="textSilver" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#ffffff" />
            <Stop offset="50%" stopColor="#b0b5bc" />
            <Stop offset="100%" stopColor="#7a8088" />
          </LinearGradient>
        </Defs>

        <SvgText
          x="50%"
          y="62"
          textAnchor="middle"
          fontSize={fontSize}
          fontWeight="900"
          letterSpacing={3}
          fill="url(#textSilver)"
          fontFamily="System"
        >
          shOk
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
