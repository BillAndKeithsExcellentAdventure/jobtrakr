import React from 'react';
import { ImageStyle } from 'react-native';
import { Image } from 'expo-image';

// Static mapping of SVG files
const SVG_FILES = {
  'qb-logo': require('@/assets/svg/qb-logo.svg'),
} as const;

type SvgFileName = keyof typeof SVG_FILES;

interface SvgImageProps {
  fileName: SvgFileName; // Name of the SVG file in assets/svg folder (e.g., 'qb-logo')
  width: number;
  height?: number; // Optional, defaults to width if not provided
  style?: ImageStyle;
  contentFit?: 'contain' | 'cover' | 'fill' | 'scale-down';
}

/**
 * Component to display SVG files from the assets/svg folder
 * Uses expo-image for efficient SVG rendering
 *
 * @example
 * <SvgImage fileName="qb-logo" width={30} height={30} />
 */
export const SvgImage: React.FC<SvgImageProps> = ({
  fileName,
  width,
  height = width,
  style,
  contentFit = 'contain',
}) => {
  const svgUri = SVG_FILES[fileName];

  return (
    <Image
      source={svgUri}
      style={[
        {
          width,
          height,
        },
        style,
      ]}
      contentFit={contentFit}
    />
  );
};
