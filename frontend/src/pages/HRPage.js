import React, { useState } from 'react';
import { createInterview } from '../services/api';

function HRPage() {
    const [questions, setQuestions] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerateLink = async () => {
        const questionList = questions.split('\n').map(q => q.trim()).filter(q => q.length > 0);
        if (questionList.length === 0) {
            setError('Please enter at least one question.');
            return;
        }
        setError('');
        setIsLoading(true);
        setGeneratedLink('');
        try {
            const response = await createInterview(questionList);
            const link = `${window.location.origin}/interview/${response.data.unique_link}`;
            setGeneratedLink(link);
        } catch (err) {
            console.error("Error creating interview:", err);
            setError(err.response?.data?.error || 'Failed to generate link. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-accent-2">
                        Create Video Interview
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Set up your interview questions and generate a unique link for candidates
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
                    <div>
                        <label htmlFor="questions" className="block text-sm font-medium text-gray-700 mb-2">
                            Interview Questions
                        </label>
                        <div className="relative">
                            <textarea
                                id="questions"
                                rows="8"
                                className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent-1 focus:border-accent-1 transition-all resize-none shadow-sm"
                                value={questions}
                                onChange={(e) => setQuestions(e.target.value)}
                                placeholder="Enter each question on a new line, for example:

1. Tell me about your background and experience.
2. What interests you about this position?
3. Describe a challenging project you've worked on."
                            />
                        </div>
                        {error && (
                            <div className="mt-2 p-3 bg-red-50 rounded-md">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-6">
                        <button
                            onClick={handleGenerateLink}
                            disabled={isLoading}
                            className={`w-full flex justify-center items-center py-3 px-4 rounded-lg text-white font-medium transition-all
                                ${isLoading 
                                    ? 'bg-complementary cursor-not-allowed' 
                                    : 'bg-accent-1 hover:bg-accent-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                                }`}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating Link...
                                </>
                            ) : 'Generate Interview Link'}
                        </button>
                    </div>

                    {generatedLink && (
                        <div className="mt-6 p-6 bg-accent-1/5 border border-accent-1/20 rounded-lg space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-accent-2">Interview Link Ready!</h3>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-1/10 text-accent-2">
                                    Ready to Share
                                </span>
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    readOnly
                                    value={generatedLink}
                                    className="w-full p-3 pr-20 bg-white border border-accent-1/20 rounded-lg font-mono text-sm text-gray-800 focus:ring-2 focus:ring-accent-1"
                                    onClick={(e) => e.target.select()}
                                />
                                <button
                                    onClick={() => navigator.clipboard.writeText(generatedLink)}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-accent-1 text-white text-sm rounded hover:bg-accent-2 transition-colors"
                                >
                                    Copy
                                </button>
                            </div>
                            <p className="text-sm text-gray-600">
                                Share this link with your candidate. They will be able to record their responses to your questions.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default HRPage;
