import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HRPage from './pages/HRPage';
import CandidatePage from './pages/CandidatePage';

function App() {
    return (
        <Router>
            {/* Optional: Basic Nav for testing */}
            {/* <nav className="bg-gray-100 p-4 mb-4">
                <Link to="/hr-setup" className="mr-4 hover:text-indigo-600">HR Setup</Link>
            </nav> */}
            <Routes>
                <Route path="/hr-setup" element={<HRPage />} />
                <Route path="/interview/:linkId" element={<CandidatePage />} />
                {/* Optional: Default route */}
                <Route path="/" element={
                    <div className="container mx-auto p-8 text-center">
                        <h1 className="text-2xl font-bold mb-4">Video Interview Platform</h1>
                        <p>Navigate to <Link to="/hr-setup" className="text-accent-1 hover:underline">/hr-setup</Link> to create an interview.</p>
                     </div>
                } />
                 <Route path="*" element={<p>404 Not Found</p>} /> {/* Handle invalid paths */}
            </Routes>
        </Router>
    );
}

export default App;
