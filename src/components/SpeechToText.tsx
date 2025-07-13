import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from './Themed';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/src/context/ColorsContext';

interface SpeechToTextProps {
  onTranscriptComplete: (text: string) => void;
  placeholder?: string;
}

export const SpeechToText: React.FC<SpeechToTextProps> = ({
  onTranscriptComplete,
  placeholder = 'Tap microphone to start speaking',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');
  const colors = useColors();

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechEnd = onSpeechEnd;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechResults = (e: SpeechResultsEvent) => {
    const text = e.value?.[0] || '';
    setTranscription(text);
  };

  const onSpeechError = (e: SpeechErrorEvent) => {
    console.error('Speech recognition error:', e);
    setIsListening(false);
  };

  const onSpeechEnd = () => {
    setIsListening(false);
    if (transcription) {
      onTranscriptComplete(transcription);
    }
  };

  const startListening = useCallback(async () => {
    try {
      await Voice.start('en-US');
      setIsListening(true);
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.micButton, { backgroundColor: isListening ? colors.primary : colors.card }]}
        onPress={isListening ? stopListening : startListening}
      >
        {isListening ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Ionicons name="mic" size={32} color={colors.text} />
        )}
      </TouchableOpacity>
      <Text style={styles.transcription}>{transcription || placeholder}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  micButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  transcription: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
  },
});
