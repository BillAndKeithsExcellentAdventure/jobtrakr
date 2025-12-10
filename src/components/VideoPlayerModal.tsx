import { Ionicons } from '@expo/vector-icons';
import { useEventListener } from 'expo';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useCallback, useEffect, useState } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface VideoPlayerModalProps {
  isVisible: boolean;
  videoUri: string;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ isVisible, videoUri, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const player = useVideoPlayer(videoUri, (player) => {
    player.loop = true;
  });

  useEffect(() => {
    console.log(`VideoPlayerModal useEffect isVisible: ${isVisible}`);
    console.log(`VideoPlayerModal uri: ${videoUri}`);
    if (isVisible && videoUri) {
      player.seekBy(0);
      player.play();
      setIsPlaying(true);
    }
  }, [isVisible, videoUri]);

  useEffect(() => {
    if (!isVisible) {
      player.pause();
      setIsPlaying(false);
    }
  }, [isVisible]);

  const handleClose = useCallback(() => {
    player.pause();
    setIsPlaying(false);
    onClose();
  }, [player, onClose]);

  const handlePlayPause = useCallback(async () => {
    if (player) {
      console.log(`handlePlayPause ${isPlaying}`);
      if (isPlaying) {
        await player.pause();
        setIsPlaying(false);
      } else {
        await player.play();
        setIsPlaying(true);
      }
    }
  }, [isPlaying, player]);

  const handleVideoPress = useCallback(() => {
    setShowControls((prev) => !prev);
  }, []);

  useEventListener(player, 'statusChange', ({ status, error }) => {
    console.log('Player status changed: ', status);
    if (error) {
      console.error('Video player error:', error.message);
    }
  });

  useEventListener(player, 'sourceChange', () => {
    console.log('Video metadata loaded, starting playback...');
    player.play();
    setIsPlaying(true);
  });

  return (
    <Modal visible={isVisible} transparent={true} animationType="fade" onRequestClose={handleClose}>
      <SafeAreaView style={styles.container}>
        {/* Close button - top right */}
        {showControls && (
          <Pressable onPress={handleClose} style={styles.closeButton} hitSlop={8}>
            <Ionicons name="close-circle" size={40} color="white" />
          </Pressable>
        )}

        {/* Video container */}
        <Pressable style={styles.videoContainer} onPress={handleVideoPress}>
          <VideoView style={styles.video} player={player} allowsFullscreen />
        </Pressable>

        {/* Play/Pause button - bottom center */}
        {showControls && (
          <Pressable onPress={handlePlayPause} style={styles.playPauseButton} hitSlop={8}>
            <Ionicons name={isPlaying ? 'pause-circle' : 'play-circle'} size={64} color="white" />
          </Pressable>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  playPauseButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 32,
  },
});
