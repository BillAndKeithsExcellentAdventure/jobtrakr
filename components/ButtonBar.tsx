import React, { useMemo } from 'react';
import { TouchableOpacity, StyleSheet, GestureResponderEvent } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from './useColorScheme';
import { Colors } from '@/constants/Colors';

export interface ActionButtonProps {
  icon?: React.ReactNode;
  favoriteIcon?: React.ReactNode;
  label?: string;
  onPress: (event: GestureResponderEvent, actionContext: any) => void;
}

interface ButtonBarProps {
  buttons: ActionButtonProps[];
  actionContext: any;
  isFavorite?: boolean;
  vertical?: boolean;
}

export const ButtonBar: React.FC<ButtonBarProps> = ({
  buttons,
  actionContext,
  isFavorite,
  vertical = false,
}) => {
  const colorScheme = useColorScheme();

  // Define colors based on the color scheme (dark or light)
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            listBackground: Colors.dark.listBackground,
            itemBackground: Colors.dark.itemBackground,
            iconColor: Colors.dark.iconColor,
            shadowColor: Colors.dark.shadowColor,
            borderColor: Colors.dark.borderColor,
          }
        : {
            listBackground: Colors.light.listBackground,
            itemBackground: Colors.light.itemBackground,
            iconColor: Colors.light.iconColor,
            shadowColor: Colors.light.shadowColor,
            borderColor: Colors.light.borderColor,
          },
    [colorScheme],
  );

  return (
    <View
      style={[
        styles.buttonBarContainer,
        !vertical && styles.buttonBarContainerHorizontal,
        !vertical && { borderTopColor: colors.borderColor },
        vertical && styles.buttonBarContainerVertical,
      ]}
    >
      {buttons.map((button, index) => (
        <TouchableOpacity key={index} style={styles.button} onPress={(e) => button.onPress(e, actionContext)}>
          <View style={[styles.buttonContent, vertical && styles.buttonContentVertical]}>
            {isFavorite && button.favoriteIcon ? (
              <>{button.favoriteIcon}</>
            ) : (
              button.icon && <>{button.icon}</>
            )}
            {button.label && <Text style={styles.buttonText}>{button.label}</Text>}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  buttonBarContainer: {
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  buttonBarContainerHorizontal: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 5,
    borderTopWidth: 1,
    marginTop: 5,
  },
  buttonBarContainerVertical: {
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 5,
  },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 5,
  },
  buttonContentVertical: {
    marginTop: 10,
  },

  buttonText: {
    fontSize: 10,
    marginLeft: 5,
  },
});
