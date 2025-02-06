import React from 'react';
import { TouchableOpacity, StyleSheet, GestureResponderEvent } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from './useColorScheme';
import { Colors } from '@/constants/Colors';

export interface ActionButtonProps {
  icon?: React.ReactNode;
  label?: string;
  onPress: (event: GestureResponderEvent, actionContext: any) => void;
}

interface ButtonBarProps {
  buttons: ActionButtonProps[];
  actionContext: any;
}

const ButtonBar: React.FC<ButtonBarProps> = ({ buttons, actionContext }) => {
  const colorScheme = useColorScheme();

  // Define colors based on the color scheme (dark or light)
  const colors =
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
        };

  return (
    <View style={[styles.buttonBarContainer, { borderTopColor: colors.borderColor }]}>
      {buttons.map((button, index) => (
        <TouchableOpacity key={index} style={styles.button} onPress={(e)=>button.onPress(e, actionContext)}>
          <View style={styles.buttonContent}>
            {button.icon && <>{button.icon}</>}
            {button.label && <Text style={styles.buttonText}>{button.label}</Text>}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  buttonBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderTopWidth: 1,
    marginTop: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 10,
    marginLeft: 5,
  },
});

export default ButtonBar;
