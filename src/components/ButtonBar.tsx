import { Text, View } from '@/src/components/Themed';
import { useColors } from '@/src/context/ColorsContext';
import React from 'react';
import { GestureResponderEvent, StyleSheet, TouchableOpacity } from 'react-native';

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
  const colors = useColors();

  return (
    <View
      style={[
        styles.buttonBarContainer,
        !vertical && styles.buttonBarContainerHorizontal,
        !vertical && { borderTopColor: colors.border },
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
