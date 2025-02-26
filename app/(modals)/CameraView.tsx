import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  Text,
  Dimensions,
  Button,
  Modal,
  Image,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';

interface JobCameraViewProps {
  visible: boolean;
  jobName: string;
  onMediaCaptured: (asset: MediaLibrary.Asset) => void;
  onClose: () => void;
  showPreview?: boolean; // Add new prop with default true
}

export const JobCameraView: React.FC<JobCameraViewProps> = ({
  visible,
  jobName,
  onMediaCaptured,
  onClose,
  showPreview = true, // Set default value
}) => {
  const [type, setType] = useState('back' as CameraType);
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  const toggleCameraType = () => {
    setType((current) => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (!cameraRef) return;

    try {
      const photo = await cameraRef.takePictureAsync();
      if (photo) {
        if (showPreview) {
          setPreviewUri(photo.uri);
        } else {
          // Direct save without preview
          const asset = await MediaLibrary.createAssetAsync(photo.uri);
          asset.creationTime = Date.now();
          onMediaCaptured(asset);
        }
      }
    } catch (error) {
      console.error('Error taking picture:', error);
    }
  };

  const startRecording = async () => {
    if (!cameraRef) return;

    setIsRecording(true);
    try {
      const video = await cameraRef.recordAsync();
      if (video) {
        const asset = await MediaLibrary.createAssetAsync(video.uri);
        asset.creationTime = Date.now();
        onMediaCaptured(asset);
      }
    } catch (error) {
      console.error('Error recording video:', error);
    }
    setIsRecording(false);
  };

  const stopRecording = () => {
    if (!cameraRef) return;
    cameraRef.stopRecording();
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

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.jobName}>{jobName}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="white" />
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
          <CameraView ref={(ref) => setCameraRef(ref)} style={styles.camera} facing={type}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={toggleCameraType}>
                <Ionicons name="camera-reverse" size={30} color="white" />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.button, styles.captureButton]} onPress={takePicture}>
                <Ionicons name="camera" size={36} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, isRecording && styles.recording]}
                onPress={isRecording ? stopRecording : startRecording}
              >
                <Ionicons name={isRecording ? 'stop-circle' : 'videocam'} size={30} color="white" />
              </TouchableOpacity>
            </View>
          </CameraView>
        )}
      </SafeAreaView>
    </Modal>
  );
};

export default JobCameraView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  jobName: {
    color: 'white',
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
});
