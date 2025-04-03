import React, { useRef, useEffect } from 'react';

const VideoRecorder = ({ stream, isRecording, recordingTime }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
         // Cleanup srcObject when component unmounts or stream becomes null
         return () => {
             if (videoRef.current) {
                 videoRef.current.srcObject = null;
             }
         };
    }, [stream]);

    // Format time as MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    return (
        <div className="relative bg-black rounded shadow-lg w-full aspect-video">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full rounded"></video>
            {isRecording && (
                <div className="absolute top-2 left-2 flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                     <span className="w-3 h-3 bg-white rounded-full"></span>
                     <span>REC {formatTime(recordingTime)} / 01:00</span>
                 </div>
            )}
            {!stream && !isRecording && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 text-white">
                    Waiting for camera access...
                </div>
            )}
        </div>
    );
};

export default VideoRecorder;