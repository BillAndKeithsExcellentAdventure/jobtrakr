import { Ionicons } from '@expo/vector-icons';
import { useEvent, useEventListener } from 'expo';
import { VideoView, useVideoPlayer } from 'expo-video';
import { View } from '@/src/components/Themed';
import { useCallback, useEffect, useState } from 'react';
import { Dimensions, Modal, Pressable, SafeAreaView, StyleSheet } from 'react-native';

interface VideoPlayerModalProps {
  isVisible: boolean;
  videoUri: string;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ isVisible, videoUri, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [position, setPosition] = useState(0);
  const [playerStatus, setPlayerStatus] = useState('');
  const [playerError, setPlayerError] = useState('');
  const player = useVideoPlayer(videoUri, (player) => {
    player.loop = true;
  });
  const { status, error } = useEvent(player, 'statusChange', { status: player.status });

  useEffect(() => {
    console.log(`VideoPlayerModal useEffect isVisible: ${isVisible}`);
    console.log(`VideoPlayerModal uri: ${videoUri}`);
    player.seekBy(0);
    player.play();
    setIsPlaying(true);

    return () => {
      console.log(`VideoPlayerModal cleanup isVisible: ${isVisible}`);
    };
  }, []);

  useEffect(() => {
    if (!isVisible) {
      setIsPlaying(false);
    }
  }, [isVisible]);

  const formatTime = (timeInMillis: number) => {
    const totalSeconds = Math.floor(timeInMillis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  //   const handlePlaybackStatusUpdate = (status: string) => {
  //     if (status.isLoaded) {
  //       setStatus(status);
  //       setDuration(status.durationMillis || 0);
  //       setPosition(status.positionMillis || 0);
  //       setIsPlaying(status.isPlaying);
  //     }
  //   };

  const handlePlayPause = useCallback(async () => {
    if (player) {
      console.log(`handlePlayPause ${isPlaying}`);
      if (isPlaying) {
        await player.pause();
        setIsPlaying(true);
      } else {
        await player.play();
        setIsPlaying(false);
      }
    }
  }, [isPlaying, player]);

  useEventListener(player, 'statusChange', ({ status, error }) => {
    setPlayerStatus(status);
    setPlayerError(error?.message || '');
    console.log('Player status changed: ', status);
  });

  useEventListener(player, 'sourceChange', () => {
    console.log('Video metadata loaded, starting playback...');
    player.play();
    setIsPlaying(true);
  });

  return (
    <Modal visible={isVisible} transparent={true} animationType="fade">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              onClose();
              player.pause();
              setIsPlaying(false);
            }}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={28} color="white" />
          </Pressable>
        </View>

        <View style={styles.videoContainer}>
          <VideoView style={styles.video} player={player} allowsFullscreen />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  closeButton: {
    padding: 8,
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height - 120,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
  },
  playButton: {
    alignSelf: 'center',
    padding: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  timeText: {
    color: 'white',
    fontSize: 12,
  },
});
