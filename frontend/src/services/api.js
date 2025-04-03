import axios from 'axios';

// Use environment variable for API base URL, fallback for development
const API_URL = 'http://127.0.0.1:5000/api';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const createInterview = (questions) => {
    return apiClient.post('/interviews', { questions });
};

export const getInterviewDetails = (linkId) => {
    return apiClient.get(`/interviews/${linkId}`);
};

export const uploadRecording = (linkId, videoBlob, questionIndex) => {
    const formData = new FormData();
    formData.append('video', videoBlob, `recording_q${questionIndex}.webm`); // Filename helps backend identify
    formData.append('questionIndex', questionIndex);

    return apiClient.post(`/upload/${linkId}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};