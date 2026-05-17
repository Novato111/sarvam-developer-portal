import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/components/ToastProvider';

const MIN_RECORDING_MS = 800;
const MIN_AUDIO_BYTES = 900;

export function useAudioRecord(onTranscriptionComplete: (text: string) => void) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  
  // The recorder and chunks need to survive re-renders without changing the UI.
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    setAudioError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingStartedAtRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const recordedMs = Date.now() - recordingStartedAtRef.current;
        stream.getTracks().forEach(track => track.stop());
        mediaRecorderRef.current = null;

        // Very short recordings usually produce empty transcripts.
        if (
          recordedMs < MIN_RECORDING_MS ||
          audioChunksRef.current.length === 0 ||
          audioBlob.size < MIN_AUDIO_BYTES
        ) {
          const message = 'Recording was too short. Hold the mic and speak for a moment.';
          setAudioError(message);
          toast({
            title: 'Recording too short',
            description: 'Hold the mic and speak for a moment.',
            variant: 'warning',
          });
          return;
        }

        setIsTranscribing(true);

        try {
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
          const transcript = typeof data.transcript === 'string' ? data.transcript.trim() : '';
          
          if (transcript) {
             onTranscriptionComplete(transcript);
             toast({
               title: 'Audio transcribed',
               description: 'Transcript added to the prompt.',
               variant: 'success',
             });
          } else {
             setAudioError('No speech detected. Try a slightly longer recording.');
             toast({
               title: 'No speech detected',
               description: 'Try a slightly longer recording.',
               variant: 'warning',
             });
          }

        } catch (error) {
          console.error("Audio Transcription failed:", error); 
          setAudioError("Couldn't transcribe audio. Please try again.");
          toast({
            title: 'Transcription failed',
            description: 'Please try recording again.',
            variant: 'destructive',
          });
        } finally {
          setIsTranscribing(false);
        }
      };
      mediaRecorder.start();
      setIsRecording(true);

    } catch (err) {
      console.error("Mic access denied or failed", err);
      setAudioError("Microphone access denied. Please check your browser settings.");
      toast({
        title: 'Microphone blocked',
        description: 'Check your browser permissions.',
        variant: 'destructive',
      });
    }
  }, [onTranscriptionComplete, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  return { startRecording, stopRecording, isRecording, isTranscribing, audioError };
}
