import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Image, Modal, Platform, SafeAreaView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import ZoomPicker from '@/components/ZoomPicker';
import { ActionButton } from '@/components/ActionButton';

interface ProjectCameraViewProps {
  visible: boolean;
  projectName: string;
  onMediaCaptured: (asset: MediaLibrary.Asset) => void;
  onClose: () => void;
  showPreview?: boolean; // Add new prop with default true
  showVideo?: boolean; // Add new prop
}

export const ProjectCameraView: React.FC<ProjectCameraViewProps> = ({
  visible,
  projectName,
  onMediaCaptured,
  onClose,
  showPreview = true, // Set default value
  showVideo = true, // Add default value
}) => {
  // Move ALL hooks to the top, before any conditional logic
  const [type, setType] = useState('back' as CameraType);
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.0);
  const [video, setVideo] = useState<string | undefined>();
  const [videoPromise, setVideoPromise] = useState<Promise<any> | null>(null);
  const [cameraModeSwitch, setCameraModeSwitch] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const colorScheme = useColorScheme();
  const colors = useMemo(
    () =>
      colorScheme === 'dark'
        ? {
            background: Colors.dark.background,
            borderColor: Colors.dark.inputBorder,
            modalOverlayBackgroundColor: Colors.dark.opaqueModalOverlayBackgroundColor,
            transparent: Colors.dark.transparent,
            neutral200: Colors.dark.neutral200,
            buttonBlue: Colors.dark.buttonBlue,
            iconColor: Colors.dark.iconColor,
          }
        : {
            background: Colors.light.background,
            borderColor: Colors.light.inputBorder,
            modalOverlayBackgroundColor: Colors.light.opaqueModalOverlayBackgroundColor,
            transparent: Colors.light.transparent,
            neutral200: Colors.light.neutral200,
            buttonBlue: Colors.light.buttonBlue,
            iconColor: Colors.light.iconColor,
          },
    [colorScheme],
  );

  // Move the callback definition here, before any conditional returns
  const onCameraModeChanged = useCallback(
    (value: boolean) => {
      setCameraModeSwitch(value);
    },
    [cameraModeSwitch],
  );

  useEffect(() => {
    let interval: NodeJS.Timeout;

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
      const photo = await cameraRef.current.takePictureAsync({ exif: true });
      if (photo) {
        if (showPreview) {
          setPreviewUri(photo.uri);
        } else {
          // Direct save without preview
          const asset = await MediaLibrary.createAssetAsync(photo.uri);
          onMediaCaptured(asset);
        }
      }
    } catch (error) {
      console.error('Error taking picture:', error);
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current) return;

    console.log('Starting recording...');
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

    await cameraRef.current.stopRecording();
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

  const handleZoom = (zoomLevel: number) => {
    setZoom(zoomLevel);
  };

  const processCameraAction = async () => {
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

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text txtSize="screen-header">{projectName}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text text="Close" txtSize="screen-header" style={{ marginRight: 5 }} />
              <Ionicons name="close" size={28} color={colors.iconColor} />
            </View>
          </TouchableOpacity>
        </View>

        {previewUri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: previewUri }} style={styles.preview} />
            <View style={styles.previewButtons}>
              <TouchableOpacity style={styles.previewButton} onPress={handleCancelPreview}>
                <Ionicons name="close-circle" size={40} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.previewButton} onPress={handleSavePreview}>
                <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={type}
            zoom={zoom}
            mode={cameraModeSwitch ? 'video' : 'picture'}
          >
            {/* Zooming is not working on IOS so just leave at zoom of 0.0 */}
            {Platform.OS === 'android' && (
              <View style={styles.zoomContainer}>
                <ZoomPicker value={zoom} onZoomChange={(zoomFactor: number) => setZoom(zoomFactor)} />
              </View>
            )}
            <View style={[styles.buttonContainer]}>
              <TouchableOpacity style={[styles.button, { marginTop: 10 }]} onPress={toggleCameraType}>
                <Ionicons name="camera-reverse" size={30} color="white" />
              </TouchableOpacity>

              <View style={[styles.captureContainer, { backgroundColor: 'transparent' }]}>
                {isRecording && <Text style={styles.timerText}>{formatTime(recordingTime)}</Text>}
                <TouchableOpacity
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
                </TouchableOpacity>
              </View>

              {showVideo && (
                <View
                  style={{ flexDirection: 'column', alignItems: 'center', backgroundColor: 'transparent' }}
                >
                  <TouchableOpacity
                    style={[
                      styles.cameraModeButton,
                      { marginTop: 10, width: 70 },
                      !cameraModeSwitch && { backgroundColor: '#007AFF' },
                    ]}
                    onPress={onSetPictureMode}
                  >
                    <Text style={styles.buttonText}>Picture</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.cameraModeButton,
                      { marginTop: 10, width: 70 },
                      cameraModeSwitch && { backgroundColor: '#007AFF' },
                    ]}
                    onPress={onSetVideoMode}
                  >
                    <Text style={styles.buttonText}>Video</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </CameraView>
        )}
      </SafeAreaView>
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
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
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
  zoomPicker: {
    width: '100%',
    color: 'white',
    backgroundColor: 'transparent',
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
});
