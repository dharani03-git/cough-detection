import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { AnimatePresence } from 'framer-motion';

// components
import Sidebar from './Sidebar';
import DashboardPage from './DashboardPage';
import RegisterPatientPage from './RegisterPatientPage';
import HistoryPage from './HistoryPage';
import AnalyticsPage from './AnalyticsPage';
import CoughScreeningPage from './CoughScreeningPage';
import FollowUpPage from './FollowUpPage';
import ReferralsPage from './ReferralsPage';
import PatientRecordsPage from './PatientRecordsPage';
import PlaceholderPage from './PlaceholderPage';

import API_BASE_URL from './api-config';

const App: React.FC = () => {
    const [backendOnline, setBackendOnline] = useState(false);

    useEffect(() => {
        const checkBackend = async () => {
            try {
                await axios.get(`${API_BASE_URL}/api/health`);
                setBackendOnline(true);
            } catch (err) {
                setBackendOnline(false);
            }
        };
        checkBackend();
        const interval = setInterval(checkBackend, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex h-screen bg-[#000000] text-slate-200 overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
            {/* Sidebar */}
            <Sidebar backendOnline={backendOnline} />

            {/* Main Surface */}
            <main className="flex-grow overflow-y-auto custom-scrollbar p-12 bg-gradient-to-br from-black via-slate-950 to-indigo-950/20">
                <AnimatePresence mode="wait">
                    <Routes>
                        <Route path="/" element={<DashboardPage />} />
                        <Route path="/register-patient" element={<RegisterPatientPage />} />
                        <Route path="/cough-screening" element={<CoughScreeningPage />} />
                        <Route path="/history" element={<HistoryPage />} />
                        <Route path="/follow-up" element={<FollowUpPage />} />
                        <Route path="/referrals" element={<ReferralsPage />} />
                        <Route path="/records" element={<PatientRecordsPage />} />
                        <Route path="/analytics" element={<AnalyticsPage />} />
                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default App;
