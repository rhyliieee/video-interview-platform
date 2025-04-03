import { useState, useRef, useCallback } from 'react';

const RECORDING_LIMIT_MS = 60 * 1000; // 1 minute

export const useMediaRecorder = (onRecordingComplete) => {
    const [isRecording, setIsRecording] = useState(false);
    const [mediaStream, setMediaStream] = useState(null);
    const [error, setError] = useState(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const timerRef = useRef(null);
    const [recordingTime, setRecordingTime] = useState(0); // In seconds

    const startRecording = useCallback(async () => {
        setError(null);
        if (!mediaStream) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setMediaStream(stream);
                // Use the stream immediately after getting it
                setupRecorder(stream);
            } catch (err) {
                console.error("Error accessing media devices:", err);
                setError("Could not access camera/microphone. Please check permissions.");
                setIsRecording(false);
                return;
            }
        } else {
            // If stream already exists, just set up the recorder
            setupRecorder(mediaStream);
        }
    }, [mediaStream, onRecordingComplete]); // Dependency added

    // Separate function to setup and start recorder
    const setupRecorder = (stream) => {
        try {
            // Check for browser support
             if (!MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
                 if (!MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
                     if (!MediaRecorder.isTypeSupported('video/webm')) {
                        setError("WebM recording not supported in this browser.");
                        console.error("WebM recording not supported.");
                        setIsRecording(false);
                        return;
                    }
                 }
            }

            // Attempt common mimeTypes
            const mimeTypes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
            let supportedMimeType = '';
            for (const mimeType of mimeTypes) {
                if (MediaRecorder.isTypeSupported(mimeType)) {
                    supportedMimeType = mimeType;
                    break;
                }
            }

             if (!supportedMimeType) {
                 setError("No supported video format found for recording.");
                 console.error("No supported video format found.");
                 setIsRecording(false);
                 return;
             }

            console.log("Using mimeType:", supportedMimeType);
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: supportedMimeType });
            recordedChunksRef.current = [];
            setRecordingTime(0); // Reset time

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: supportedMimeType });
                setIsRecording(false);
                clearInterval(timerRef.current); // Clear interval timer
                clearTimeout(timerRef.current); // Clear timeout timer
                setRecordingTime(0); // Reset time display
                if (onRecordingComplete) {
                    onRecordingComplete(blob);
                }
                recordedChunksRef.current = []; // Clear chunks for next recording
            };

            mediaRecorderRef.current.onerror = (event) => {
                console.error("MediaRecorder error:", event.error);
                setError("An error occurred during recording.");
                setIsRecording(false);
                clearInterval(timerRef.current);
                clearTimeout(timerRef.current);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);

            // Start timer for max duration
            timerRef.current = setTimeout(() => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    console.log("Recording time limit reached.");
                    mediaRecorderRef.current.stop();
                }
            }, RECORDING_LIMIT_MS);

            // Start interval timer for display update
            const startTime = Date.now();
            timerRef.current = setInterval(() => {
                 const elapsed = Math.floor((Date.now() - startTime) / 1000);
                 setRecordingTime(elapsed);
                 if (elapsed >= RECORDING_LIMIT_MS / 1000) {
                     clearInterval(timerRef.current);
                 }
            }, 1000);


        } catch (err) {
            console.error("Error setting up MediaRecorder:", err);
            setError("Failed to start recording.");
            setIsRecording(false);
        }
    }


    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
             // onstop handler will set isRecording to false and call onRecordingComplete
        }
         // Clear timers immediately on manual stop
         clearTimeout(timerRef.current);
         clearInterval(timerRef.current);
         setRecordingTime(0);
    }, []);


    // Cleanup function to stop stream when component unmounts or stream changes
    const cleanupMedia = useCallback(() => {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            setMediaStream(null);
            console.log("Media stream stopped.");
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        clearTimeout(timerRef.current);
        clearInterval(timerRef.current);
        setIsRecording(false);
        setRecordingTime(0);
    }, [mediaStream]);


    return { isRecording, startRecording, stopRecording, mediaStream, cleanupMedia, error, recordingTime };
};