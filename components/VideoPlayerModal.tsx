import React, { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, Pressable, Dimensions, SafeAreaView } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Text, View } from '@/components/Themed';
import { useEvent } from 'expo';

interface VideoPlayerModalProps {
  isVisible: boolean;
  videoUri: string;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ isVisible, videoUri, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const player = useVideoPlayer(videoUri, (player) => {
    player.loop = true;
    player.play();
  });
  const { status, error } = useEvent(player, 'statusChange', { status: player.status });

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

  const handlePlayPause = async () => {
    if (player) {
      if (isPlaying) {
        await player.pause();
      } else {
        await player.play();
      }
    }
  };

  //   const handleSliderChange = async (value: number) => {
  //     if (videoRef.current) {
  //       await videoRef.current.setPositionAsync(value);
  //     }
  //   };

  return (
    <Modal visible={isVisible} transparent={true} animationType="fade">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="white" />
          </Pressable>
        </View>

        <View style={styles.videoContainer}>
          <VideoView style={styles.video} player={player} allowsFullscreen />
        </View>

        <View style={styles.controls}>
          <Pressable onPress={handlePlayPause} style={styles.playButton}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="white" />
          </Pressable>

          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={duration}
              value={position}
              onSlidingComplete={(value) => console.log(value)}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="#666666"
              thumbTintColor="#FFFFFF"
            />
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>
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
  sliderContainer: {
    marginTop: 10,
  },
  slider: {
    width: '100%',
    height: 40,
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
