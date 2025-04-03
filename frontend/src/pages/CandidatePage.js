import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInterviewDetails, uploadRecording } from '../services/api';
// Correct casing for VideoRecorder import
import VideoRecorder from '../components/videoRecorder';
import { useMediaRecorder } from '../hooks/useMediaRecorder';

const STATUS_LOADING = 'loading';
const STATUS_READY = 'ready'; // Ready to record next question
const STATUS_RECORDING = 'recording';
const STATUS_REVIEW = 'review';
const STATUS_UPLOADING = 'uploading';
const STATUS_COMPLETE = 'complete';
const STATUS_ERROR = 'error';

function CandidatePage() {
    const { linkId } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState(STATUS_LOADING);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [recordings, setRecordings] = useState([]); // Array of Blobs
    const [error, setError] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0); // Basic progress tracking

    const handleRecordingComplete = useCallback((blob) => {
         console.log(`Recording complete for question ${currentQuestionIndex}, Blob size: ${blob.size}`);
         setRecordings(prev => {
            const newRecordings = [...prev];
            newRecordings[currentQuestionIndex] = blob; // Store blob at the correct index
            return newRecordings;
         });

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setStatus(STATUS_READY);
        } else {
            // Last question recorded, move to review
            setStatus(STATUS_REVIEW);
        }
    }, [currentQuestionIndex, questions.length]);

     const { isRecording, startRecording, stopRecording, mediaStream, cleanupMedia, error: recorderError, recordingTime } = useMediaRecorder(handleRecordingComplete);

     useEffect(() => {
         if (recorderError) {
             setError(recorderError); // Show recorder errors (e.g., permissions)
             setStatus(STATUS_ERROR);
         }
     }, [recorderError]);


    // Fetch interview questions on load
     useEffect(() => {
         const fetchInterview = async () => {
             setStatus(STATUS_LOADING);
             setError('');
             try {
                 const response = await getInterviewDetails(linkId);
                 if (response.data.questions && response.data.questions.length > 0) {
                     setQuestions(response.data.questions);
                     setRecordings(new Array(response.data.questions.length).fill(null)); // Initialize recordings array
                     setStatus(STATUS_READY);
                 } else {
                     setError("No questions found for this interview link.");
                     setStatus(STATUS_ERROR);
                 }
             } catch (err) {
                 console.error("Error fetching interview:", err);
                 setError(err.response?.data?.error || "Invalid or expired interview link.");
                 setStatus(STATUS_ERROR);
             }
         };
         fetchInterview();

         // Cleanup media stream on component unmount
         return () => {
            console.log("CandidatePage unmounting, cleaning up media.");
            cleanupMedia();
         };
     }, [linkId, cleanupMedia]); // Added cleanupMedia dependency

    const handleStartRecording = () => {
        setError(''); // Clear previous errors
        setStatus(STATUS_RECORDING);
        startRecording(); // This will request permission if needed
    };

    const handleStopRecording = () => {
        // Only manual stop needed if user clicks before timeout
        stopRecording();
        // State transition handled by onRecordingComplete callback
    };

    const handleFinishReview = async () => {
         setStatus(STATUS_UPLOADING);
         setError('');
         setUploadProgress(0);
         const totalRecordings = recordings.filter(r => r).length;
         let uploadedCount = 0;

         try {
             // Sequentially upload recordings - easier to manage progress/errors
             for (let i = 0; i < recordings.length; i++) {
                 const blob = recordings[i];
                 if (blob) {
                     console.log(`Uploading recording for question ${i}...`);
                     await uploadRecording(linkId, blob, i);
                     uploadedCount++;
                     setUploadProgress(Math.round((uploadedCount / totalRecordings) * 100));
                     console.log(`Upload successful for question ${i}`);
                 }
             }
             // All uploads successful
              cleanupMedia(); // Stop camera access after successful upload
             setStatus(STATUS_COMPLETE);
         } catch (err) {
             console.error("Error uploading recordings:", err);
             setError(err.response?.data?.error || "An error occurred during upload. Please try submitting again if possible, or contact support.");
             setStatus(STATUS_REVIEW); // Go back to review on error
             // Optionally: Keep track of which failed and allow retry? (More complex)
         }
     };

    // Render different content based on status
    const renderContent = () => {
        switch (status) {
            case STATUS_LOADING:
                // Use inherited text-primary
                return <p className="text-center">Loading interview...</p>;

            case STATUS_READY:
            case STATUS_RECORDING:
                const currentQuestion = questions[currentQuestionIndex];
                return (
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                            <VideoRecorder stream={mediaStream} isRecording={isRecording} recordingTime={recordingTime} />
                            {recorderError && <p className="text-red-500 text-sm mt-2">{recorderError}</p>}
                        </div>
                        <div className="flex-1 md:max-w-md">
                             <h2 className="text-xl font-semibold mb-3">Question {currentQuestionIndex + 1} of {questions.length}</h2>
                             <p className="text-lg mb-6 p-4 bg-complementary/20 rounded border border-complementary">{currentQuestion}</p>
                             <p className="text-sm mb-4">You have a maximum of 1 minute to record your answer.</p>
                            {status === STATUS_READY && (
                                <button
                                    onClick={handleStartRecording}
                                    // Use accent-1 and accent-2 for start button
                                    className="w-full bg-accent-1 hover:bg-accent-2 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
                                >
                                    Start Recording Answer {currentQuestionIndex + 1}
                                </button>
                            )}
                             {status === STATUS_RECORDING && (
                                 <button
                                     onClick={handleStopRecording}
                                     className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
                                 >
                                     Stop Recording
                                 </button>
                             )}
                        </div>
                    </div>
                );

            case STATUS_REVIEW:
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-6 text-center">Review Your Answers</h2>
                        <p className="text-center mb-6">You cannot re-record or delete answers. Click "Submit All Answers" when you are ready.</p>
                        {error && <p className="text-red-500 text-center text-sm mb-4">{error}</p>}
                        <div className="space-y-6">
                            {recordings.map((blob, index) => (
                                <div key={index} className="bg-white p-4 rounded-lg shadow">
                                    <h3 className="font-semibold mb-2">Question {index + 1}: {questions[index]}</h3>
                                    {blob ? (
                                        <video
                                            controls
                                            src={URL.createObjectURL(blob)}
                                            className="w-full max-w-md mx-auto rounded"
                                        ></video>
                                    ) : (
                                        <p className="text-center py-4">No recording available.</p>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={handleFinishReview}
                            // Use accent-1 and accent-2 for submit button
                            className="mt-8 w-full bg-accent-1 hover:bg-accent-2 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
                        >
                            Submit All Answers
                        </button>
                    </div>
                );

            case STATUS_UPLOADING:
                 return (
                     <div className="text-center">
                         <h2 className="text-2xl font-bold mb-4">Submitting Recordings...</h2>
                         <p className="mb-4">Please wait, this may take a few moments.</p>
                         <div className="w-full bg-complementary/30 rounded-full h-4">
                             <div className="bg-accent-1 h-4 rounded-full transition-all duration-500 ease-out" style={{ width: `${uploadProgress}%` }}></div>
                         </div>
                         <p className="mt-2 text-sm text-accent-2 font-semibold">{uploadProgress}% Complete</p>
                     </div>
                 );

            case STATUS_COMPLETE:
                return (
                    <div className="text-center p-6 bg-accent-1/10 rounded-lg shadow">
                        <h2 className="text-2xl font-bold mb-4 text-accent-2">Submission Successful!</h2>
                        <p className="text-accent-2">Your video answers have been successfully submitted.</p>
                        <p className="text-sm mt-4">You may now close this window.</p>
                    </div>
                );

            case STATUS_ERROR:
                return (
                    <div className="text-center p-6 bg-red-100 rounded-lg shadow">
                        <h2 className="text-2xl font-bold mb-4 text-red-800">An Error Occurred</h2>
                        <p className="text-red-700">{error || 'An unexpected error occurred.'}</p>
                        {/* Optionally add a retry button or contact info */}
                     </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col justify-center">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl mx-auto w-full">
               {renderContent()}
            </div>
        </div>
    );
}

export default CandidatePage;
