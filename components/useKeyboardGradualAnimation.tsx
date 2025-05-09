import { useKeyboardHandler } from 'react-native-keyboard-controller';
import { useSharedValue } from 'react-native-reanimated';

export const PADDING_BOTTOM = 20;
export const TOOLBAR_OFFSET = 42;

export const useKeyboardGradualAnimation = () => {
  const height = useSharedValue(PADDING_BOTTOM);

  useKeyboardHandler(
    {
      onMove: (e) => {
        'worklet';
        height.value = Math.max(e.height + TOOLBAR_OFFSET, PADDING_BOTTOM);
      },
      onEnd: (e) => {
        'worklet';
        height.value = e.height + TOOLBAR_OFFSET;
      },
    },
    [],
  );
  return { height };
};
