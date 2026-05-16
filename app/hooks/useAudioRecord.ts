// src/hooks/useAudioRecord.ts
import { useState, useRef, useCallback } from 'react';

export function useAudioRecord(onTranscriptionComplete: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  
  // We use refs to hold onto the recorder and audio chunks across renders
  // without triggering unnecessary re-renders.
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    setAudioError(null);
    try {
      // 1. Request microphone access from the browser
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 2. Initialize the MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = []; // Clear previous recordings

      // 3. Collect audio chunks as they are generated
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // 4. Handle what happens when we stop recording
      // src/hooks/useAudioRecord.ts (Updated segment)

      mediaRecorder.onstop = async () => {
        setIsTranscribing(true);
        
        // Let the browser decide the blob type based on the recorded chunks to avoid mime-type crashes
     // Explicitly force the webm type so it matches our backend route
const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());

        try {
          // Send to our secure Next.js route instead of Sarvam directly
          const formData = new FormData();
          formData.append('file', audioBlob);

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
             throw new Error('Backend failed to transcribe');
          }

          const data = await response.json();
          
          if (data.transcript) {
             onTranscriptionComplete(data.transcript);
          } else {
             throw new Error('No transcript returned');
          }

        } catch (error) {
          // I added console.error here so if it fails again, check your browser console (F12)!
          console.error("Audio Transcription failed:", error); 
          setAudioError("Failed to transcribe audio. Check console for details.");
        } finally {
          setIsTranscribing(false);
        }
      };
      // 5. Start the recording process
      mediaRecorder.start();
      setIsRecording(true);

    } catch (err) {
      console.error("Mic access denied or failed", err);
      setAudioError("Microphone access denied. Please check your browser settings.");
    }
  }, [onTranscriptionComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  return { startRecording, stopRecording, isRecording, isTranscribing, audioError };
}