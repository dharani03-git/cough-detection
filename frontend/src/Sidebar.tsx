import React from 'react';
import {
    LayoutDashboard, UserPlus, Mic, FileText,
    Calendar, Users, FolderHeart, BarChart3,
    ShieldCheck, Settings, Activity, Zap, Lock, ChevronRight, X,
    Baby
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { id: 'register', icon: UserPlus, label: 'Register Patient', path: '/register-patient' },
    { id: 'screening', icon: Mic, label: 'Cough Screening', path: '/cough-screening' },
    { id: 'history', icon: FileText, label: 'AI Risk Report', path: '/history' },
    { id: 'followup', icon: Calendar, label: 'Follow-Up', path: '/follow-up' },
    { id: 'referrals', icon: Users, label: 'Referrals', path: '/referrals' },
    { id: 'records', icon: FolderHeart, label: 'Patient Records', path: '/records' },
    { id: 'analytics', icon: Activity, label: 'Analytics', path: '/analytics' },
    { id: 'voice-dev', label: 'Voice Dev', icon: Baby, path: '/voice-dev' }
];

interface SidebarProps {
    backendOnline: boolean;
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ backendOnline, isOpen, onClose }) => {
    const location = useLocation();

    return (
        <>
            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
                    />
                )}
            </AnimatePresence>

            <aside className={`
                fixed inset-y-0 left-0 w-80 border-r border-white/5 bg-[#030712]/80 backdrop-blur-3xl flex flex-col p-8 gap-10 z-[70]
                transition-transform duration-300 lg:translate-x-0 lg:static lg:block
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20">
                            <Activity className="text-white" size={28} />
                        </div>
                        <div>
                            <span className="text-2xl font-black tracking-tighter">Resono<span className="text-indigo-500">Hack</span></span>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-indigo-400/60 font-black">Voice Biometrics</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="lg:hidden p-2 text-slate-500 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex flex-col gap-1 flex-grow overflow-y-auto custom-scrollbar pr-2">
                    {navItems.map(item => (
                        <NavLink
                            key={item.id}
                            to={item.path}
                            onClick={() => onClose()}
                            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-xl' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <item.icon size={20} className={location.pathname === item.path ? 'animate-pulse' : ''} />
                            <span className="font-bold text-sm tracking-tight">{item.label}</span>
                            {location.pathname === item.path && <ChevronRight size={14} className="ml-auto opacity-50" />}
                        </NavLink>
                    ))}
                </nav>

                <div className="space-y-6">
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/30 border border-white/5 space-y-4">
                        <div className="flex items-center gap-2">
                            <Lock size={12} className="text-indigo-400" />
                            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Compliance Status</p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[11px] font-bold">
                                <span className="text-slate-500">HIPAA Readiness</span>
                                <span className="text-emerald-400">92%</span>
                            </div>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="w-[92%] h-full bg-emerald-500 rounded-full" />
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-500 italic leading-relaxed">
                            On-device encryption active. All data anonymized prior to transmission.
                        </p>
                    </div>

                    <div className="px-5 py-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'} shadow-[0_0_10px_rgba(16,185,129,0.5)]`} />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Engine Status</span>
                        </div>
                        <span className={`text-[10px] font-black ${backendOnline ? 'text-emerald-400' : 'text-red-400'} uppercase tracking-widest`}>
                            {backendOnline ? 'ONLINE' : 'OFFLINE'}
                        </span>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
