import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

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
import VoiceDevPage from './VoiceDevPage';
import PlaceholderPage from './PlaceholderPage';

import API_BASE_URL from './api-config';

const App: React.FC = () => {
    const [backendOnline, setBackendOnline] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [window.location.pathname]);

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-[#000000] text-slate-200 overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
            {/* Mobile Header */}
            <header className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 bg-black/50 backdrop-blur-xl z-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
                        <Menu className="text-white" size={20} />
                    </div>
                    <span className="text-xl font-black tracking-tighter">Resono<span className="text-indigo-500">Hack</span></span>
                </div>
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 bg-white/5 rounded-lg border border-white/10"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Sidebar */}
            <Sidebar 
                backendOnline={backendOnline} 
                isOpen={isMobileMenuOpen} 
                onClose={() => setIsMobileMenuOpen(false)} 
            />

            {/* Main Surface */}
            <main className="flex-grow overflow-y-auto custom-scrollbar p-6 lg:p-12 bg-gradient-to-br from-black via-slate-950 to-indigo-950/20">
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
                        <Route path="/voice-dev" element={<VoiceDevPage />} />
                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default App;
