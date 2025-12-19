import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import React, { useEffect, useRef, useState } from 'react';
import { Image, Modal, StyleSheet } from 'react-native';
import { Text, View } from '@/src/components/Themed';
import ZoomPicker from '@/src/components/ZoomPicker';
import { ActionButton } from '@/src/components/ActionButton';
import { useColors } from '@/src/context/ColorsContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

interface ProjectCameraViewProps {
  visible: boolean;
  projectName: string;
  onMediaCaptured: (asset: MediaLibrary.Asset) => void;
  onClose: () => void;
  showVideo?: boolean; // Add new prop
}

export const ProjectCameraView: React.FC<ProjectCameraViewProps> = ({
  visible,
  projectName,
  onMediaCaptured,
  onClose,
  showVideo = true, // Add default value
}) => {
  // Move ALL hooks to the top, before any conditional logic
  const [type, setType] = useState('back' as CameraType);
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.0);
  const [videoPromise, setVideoPromise] = useState<Promise<any> | null>(null);
  const [cameraModeSwitch, setCameraModeSwitch] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const colors = useColors();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Now handle the permission checks
  if (!permission || !micPermission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <ActionButton type="action" onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  if (!micPermission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <ActionButton type="action" onPress={requestMicPermission} title="Grant Permission" />
      </View>
    );
  }

  const toggleCameraType = () => {
    setType((current) => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({ exif: true, shutterSound: true });
      if (photo) {
        const asset = await MediaLibrary.createAssetAsync(photo.uri);
        onMediaCaptured(asset);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current) return;

    console.log('Starting recording...');

    // Haptic feedback for video recording start
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setIsRecording(true);
    try {
      console.log('Before recordAsync...');

      const promise = cameraRef.current.recordAsync();
      setVideoPromise(promise);

      const v = await promise;

      console.log('After recordAsync...');
      if (v) {
        const asset = await MediaLibrary.createAssetAsync(v.uri);
        asset.creationTime = Date.now();
        onMediaCaptured(asset);
      }
    } catch (error) {
      console.error('Error recording video:', error);
    } finally {
      setIsRecording(false);
      setVideoPromise(null);
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current) return;
    console.log('Stopping recording...');

    // Haptic feedback for video recording stop
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    cameraRef.current.stopRecording();
    console.log('After Stopping recording...');

    if (videoPromise) {
      await videoPromise;
    }
  };

  const handleSavePreview = async () => {
    if (!previewUri) return;

    try {
      const asset = await MediaLibrary.createAssetAsync(previewUri);
      asset.creationTime = Date.now();
      onMediaCaptured(asset);
      setPreviewUri(null);
    } catch (error) {
      console.error('Error saving picture:', error);
    }
  };

  const handleCancelPreview = () => {
    setPreviewUri(null);
  };

  const processCameraAction = async () => {
    // Haptic feedback when button is pressed
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (cameraModeSwitch === false) {
      await takePicture();
    } else {
      if (isRecording) {
        await stopRecording();
      } else {
        await startRecording();
      }
    }
  };

  const onSetPictureMode = () => {
    setCameraModeSwitch(false);
  };

  const onSetVideoMode = () => {
    setCameraModeSwitch(true);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text txtSize="screen-header">{projectName}</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text text="Close" txtSize="screen-header" style={{ marginRight: 5 }} />
              <Ionicons name="close" size={28} color={colors.iconColor} />
            </View>
          </Pressable>
        </View>

        {previewUri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: previewUri }} style={styles.preview} />
            <View style={styles.previewButtons}>
              <Pressable style={styles.previewButton} onPress={handleCancelPreview}>
                <Ionicons name="close-circle" size={40} color="white" />
              </Pressable>
              <Pressable style={styles.previewButton} onPress={handleSavePreview}>
                <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={type}
              zoom={zoom}
              mode={cameraModeSwitch ? 'video' : 'picture'}
            />

            {/* Absolute overlay for controls — CameraView must not have children */}
            <View pointerEvents="box-none" style={styles.overlayContainer}>
              <View style={styles.zoomContainer}>
                <ZoomPicker value={zoom} onZoomChange={(zoomFactor: number) => setZoom(zoomFactor)} />
              </View>

              <View style={[styles.buttonContainer]}>
                <Pressable style={[styles.button, { marginTop: 10 }]} onPress={toggleCameraType}>
                  <Ionicons name="camera-reverse" size={30} color="white" />
                </Pressable>

                <View style={[styles.captureContainer, { backgroundColor: 'transparent' }]}>
                  {isRecording && <Text style={styles.timerText}>{formatTime(recordingTime)}</Text>}
                  <Pressable
                    style={[
                      styles.button,
                      styles.captureButton,
                      isRecording && styles.recording,
                      { marginTop: 10 },
                    ]}
                    onPress={processCameraAction}
                  >
                    {cameraModeSwitch === true ? (
                      <Ionicons name={isRecording ? 'stop-circle' : 'videocam'} size={30} color="white" />
                    ) : (
                      <Ionicons name="camera" size={36} color="white" />
                    )}
                  </Pressable>
                </View>

                {showVideo && (
                  <View
                    style={{ flexDirection: 'column', alignItems: 'center', backgroundColor: 'transparent' }}
                  >
                    <Pressable
                      style={[
                        styles.cameraModeButton,
                        { marginTop: 10, width: 70 },
                        !cameraModeSwitch && { backgroundColor: '#007AFF' },
                      ]}
                      onPress={onSetPictureMode}
                    >
                      <Text style={styles.buttonText}>Picture</Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.cameraModeButton,
                        { marginTop: 10, width: 70 },
                        cameraModeSwitch && { backgroundColor: '#007AFF' },
                      ]}
                      onPress={onSetVideoMode}
                    >
                      <Text style={styles.buttonText}>Video</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

export default ProjectCameraView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 10,
  },
  closeButton: {
    padding: 5,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  button: {
    padding: 15,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  captureButton: {
    padding: 20,
    backgroundColor: '#007AFF',
  },
  recording: {
    backgroundColor: '#FF3B30',
  },
  message: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    paddingBottom: 10,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  preview: {
    flex: 1,
    width: '100%',
  },
  previewButtons: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    paddingHorizontal: 50,
  },
  previewButton: {
    padding: 10,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  zoomContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 15,
    overflow: 'hidden',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    alignSelf: 'center',
  },
  cameraModeButton: {
    padding: 5,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  captureContainer: {
    alignItems: 'center',
  },
  timerText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 5,
    borderRadius: 5,
  },
  overlayContainer: {
    position: 'absolute',
    top: 130,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 10,
  },
});
