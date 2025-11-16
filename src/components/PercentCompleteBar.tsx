import { Text, View } from '@/src/components/Themed';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { formatCurrency } from '../utils/formatters';

type LabelPosition = 'above' | 'below' | 'inside' | 'left' | 'right';

interface PercentCompleteProps {
  percent?: number;
  spent?: number | null;
  total?: number | null;
  height?: number;
  backgroundColor?: string;
  fillColor?: string;
  textColor?: string;
  labelColor?: string;
  showPercentageText?: boolean;
  showLabel?: boolean;
  labelPosition?: LabelPosition;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const PercentCompleteBar: React.FC<PercentCompleteProps> = ({
  percent = 0,
  spent = null,
  total = null,
  height = 20,
  backgroundColor = '#e0e0e0',
  fillColor = '#3b82f6',
  textColor = '#fff',
  labelColor = '#333',
  showPercentageText = true,
  showLabel = true,
  labelPosition = 'right',
  style,
  labelStyle,
  textStyle,
}) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const clampedPercent = Math.min(Math.max(percent, 0), 100);

    Animated.timing(animatedWidth, {
      toValue: clampedPercent,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [percent, animatedWidth]);

  const widthInterpolated = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const renderLabel = () => {
    const textStyle = labelPosition === 'inside' ? styles.insideText : styles.label;
    return showLabel && spent != null && total != null ? (
      <Text
        style={[textStyle, { color: labelColor }, labelStyle]}
        text={`Spent: ${formatCurrency(spent, true, false)} of ${formatCurrency(total, true, false)}`}
      />
    ) : null;
  };

  const renderBar = () => (
    <View style={[styles.container, { height, backgroundColor }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: fillColor,
            width: widthInterpolated,
          },
        ]}
      ></Animated.View>
      {labelPosition === 'inside' && renderLabel()}
      {showPercentageText && labelPosition !== 'inside' && (
        <Text style={[styles.insideText, { color: textColor }, textStyle]}>{`${Math.round(percent)}%`}</Text>
      )}
    </View>
  );

  const isHorizontal = labelPosition === 'left' || labelPosition === 'right';

  return (
    <View style={[styles.wrapper, isHorizontal && styles.horizontalWrapper, style]}>
      {labelPosition === 'above' && renderLabel()}
      {labelPosition === 'left' && renderLabel()}
      {renderBar()}
      {labelPosition === 'right' && renderLabel()}
      {labelPosition === 'below' && renderLabel()}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  horizontalWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 14,
    marginVertical: 4,
  },
  container: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: 'bold',
  },
  insideText: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    paddingTop: 6,
    textAlign: 'center',
    alignItems: 'center',
  },
});

export default PercentCompleteBar;
