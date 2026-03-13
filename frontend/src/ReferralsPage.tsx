import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Clock, Building2, ClipboardCheck, Search,
    Filter, MoreHorizontal, ChevronRight, X, UserPlus,
    Stethoscope, CheckCircle2, AlertTriangle, Zap,
    FileText, ArrowUpRight, Plus, MapPin, Activity
} from 'lucide-react';

interface Referral {
    id: string;
    patientId: string;
    name: string;
    riskLevel: 'Low' | 'Medium' | 'High';
    condition: string;
    referralDate: string;
    hospital: string;
    specialist: string;
    status: 'Pending' | 'Assigned' | 'Under Review' | 'Completed';
    priority: 'Critical' | 'High' | 'Moderate';
    department: string;
}

const mockReferrals: Referral[] = [
    { id: '1', patientId: 'RH-7721', name: 'James Wilson', riskLevel: 'High', condition: 'Pneumonia Risk', referralDate: '2026-03-08', hospital: 'General Hospital', specialist: 'Dr. Sarah Chen', status: 'Assigned', priority: 'Critical', department: 'Pulmonology' },
    { id: '2', patientId: 'RH-8832', name: 'Elena Rodriguez', riskLevel: 'Medium', condition: 'COPD Management', referralDate: '2026-03-09', hospital: 'City Chest Clinic', specialist: 'Dr. Michael Vogt', status: 'Under Review', priority: 'High', department: 'Respiratory Medicine' },
    { id: '3', patientId: 'RH-1011', name: 'Alina Petrova', riskLevel: 'High', condition: 'TB Suspected', referralDate: '2026-03-10', hospital: 'Infectious Disease Center', specialist: 'Pending', status: 'Pending', priority: 'Critical', department: 'Critical Care' },
    { id: '4', patientId: 'RH-4451', name: 'Linda Thompson', riskLevel: 'Low', condition: 'Chronic Cough', referralDate: '2026-03-05', hospital: 'Northside Medical', specialist: 'Dr. Emily Blunt', status: 'Completed', priority: 'Moderate', department: 'Family Medicine' },
];

const ReferralsPage: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
    const [notification, setNotification] = useState<string | null>(null);

    const showNotification = (msg: string) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 3000);
    };

    const stats = [
        { label: 'Total Referrals', value: '128', icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
        { label: 'Pending Referrals', value: '14', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10' },
        { label: 'Hospital Assigned', value: '98', icon: Building2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        { label: 'Feedback Received', value: '62', icon: ClipboardCheck, color: 'text-violet-400', bg: 'bg-violet-400/10' },
    ];

    const filteredReferrals = mockReferrals.filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.patientId.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        const styles = {
            Pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
            Assigned: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
            'Under Review': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
            Completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        };
        return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status as keyof typeof styles]}`}>{status}</span>;
    };

    const getPriorityBadge = (priority: string) => {
        const styles = {
            Critical: 'bg-red-600 text-white',
            High: 'bg-amber-600 text-white',
            Moderate: 'bg-indigo-600 text-white'
        };
        return <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${styles[priority as keyof typeof styles]}`}>{priority}</span>;
    };

    return (
        <div className="space-y-12 pb-20">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter">Patient Referrals</h1>
                    <p className="text-slate-500 font-medium">External healthcare network integration and specialist coordination.</p>
                </div>
                <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl flex items-center gap-3 transition-all shadow-xl shadow-indigo-600/20 uppercase tracking-widest text-[10px]">
                    <Plus size={16} /> New Referral
                </button>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-[#030712] border border-white/5 rounded-3xl p-6 flex items-center gap-6 shadow-xl"
                    >
                        <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                            <stat.icon size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">{stat.label}</p>
                            <p className="text-3xl font-black mt-1">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
                    {['All', 'Pending', 'Assigned', 'Under Review', 'Completed'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${statusFilter === status ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4 flex-grow max-w-md">
                    <div className="relative flex-grow">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search Name, ID or Hospital..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#030712] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner placeholder:text-slate-600"
                        />
                    </div>
                </div>
            </div>

            {/* Referral Table */}
            <div className="bg-[#030712] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/5">
                            <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Patient Details</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Risk & Condition</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Assignment</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                            <th className="px-8 py-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        <AnimatePresence mode='popLayout'>
                            {filteredReferrals.map((referral) => (
                                <motion.tr
                                    key={referral.id}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="group hover:bg-white/[0.02] transition-colors"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-500 font-bold group-hover:border-indigo-500/30 transition-all">
                                                <Activity size={20} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-black tracking-tight">{referral.name}</div>
                                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">{referral.patientId} • {referral.referralDate}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${referral.riskLevel === 'High' ? 'bg-red-500' : referral.riskLevel === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                                <span className="text-xs font-bold text-slate-300 italic">"{referral.condition}"</span>
                                            </div>
                                            {getPriorityBadge(referral.priority)}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm font-bold text-white">
                                                <Building2 size={14} className="text-indigo-400" />
                                                {referral.hospital}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                                <Stethoscope size={12} />
                                                {referral.specialist}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">{getStatusBadge(referral.status)}</td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 text-slate-500">
                                            {referral.status === 'Pending' ? (
                                                <button
                                                    onClick={() => {
                                                        setSelectedReferral(referral);
                                                        setIsAssignModalOpen(true);
                                                    }}
                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                >
                                                    Assign Hospital
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setSelectedReferral(referral);
                                                        setIsFeedbackModalOpen(true);
                                                    }}
                                                    className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                                                >
                                                    Feedback <ArrowUpRight size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            {/* Modal: Assign Hospital */}
            <AnimatePresence>
                {isAssignModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#030712] border border-white/10 rounded-[3rem] w-full max-w-xl p-12 shadow-2xl overflow-hidden relative"
                        >
                            <button onClick={() => setIsAssignModalOpen(false)} className="absolute top-8 right-8 p-3 bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                            <h2 className="text-3xl font-black tracking-tighter uppercase mb-2">Hospital Assignment</h2>
                            <p className="text-slate-500 font-medium mb-10">Select clinical center for <strong>{selectedReferral?.name}</strong></p>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Healthcare Institution</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all">
                                        <option>Select Hospital</option>
                                        <option>City Chest Clinic - Pulmonary Unit</option>
                                        <option>St. Mary's General Hospital</option>
                                        <option>Institute of Respiratory Disease</option>
                                        <option>National Tuberculosis Center</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Department</label>
                                        <input type="text" placeholder="e.g. ICU" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-slate-200" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Referral Priority</label>
                                        <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-slate-200">
                                            <option>Critical</option>
                                            <option>High</option>
                                            <option>Moderate</option>
                                        </select>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        showNotification(`Hospital assigned successfully for ${selectedReferral?.name}`);
                                        setIsAssignModalOpen(false);
                                    }}
                                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl transition-all uppercase tracking-widest text-xs mt-4"
                                >
                                    Confirm Assignment
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: Specialist Feedback */}
            <AnimatePresence>
                {isFeedbackModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#030712] border border-white/10 rounded-[3rem] w-full max-w-2xl p-12 shadow-2xl overflow-hidden relative"
                        >
                            <button onClick={() => setIsFeedbackModalOpen(false)} className="absolute top-8 right-8 p-3 bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                            <h2 className="text-3xl font-black tracking-tighter uppercase mb-2">Specialist Feedback</h2>
                            <p className="text-slate-500 font-medium mb-10">Documentation entry for <strong>{selectedReferral?.name}</strong></p>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Specialist Name</label>
                                        <input type="text" defaultValue={selectedReferral?.specialist} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-slate-200" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Follow-Up Required?</label>
                                        <div className="flex gap-2">
                                            <button className="flex-1 py-3 bg-indigo-500 text-white rounded-xl text-xs font-black uppercase">Yes</button>
                                            <button className="flex-1 py-3 bg-white/5 border border-white/10 text-slate-500 rounded-xl text-xs font-black uppercase">No</button>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Diagnosis Notes</label>
                                    <textarea placeholder="Observation and preliminary findings..." className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-slate-200 resize-none placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all"></textarea>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Treatment & Tests Recommended</label>
                                    <input type="text" placeholder="e.g. Chest X-Ray, Sputum Culture, Antibiotics" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-slate-200" />
                                </div>
                                <button
                                    onClick={() => {
                                        showNotification(`Specialist feedback submitted for ${selectedReferral?.name}`);
                                        setIsFeedbackModalOpen(false);
                                    }}
                                    className="w-full py-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black rounded-2xl shadow-xl transition-all uppercase tracking-widest text-xs mt-4"
                                >
                                    Submit Final Feedback
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Notifications */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200]"
                    >
                        <div className="bg-emerald-500 text-white flex items-center gap-4 px-8 py-4 rounded-2xl shadow-2xl font-black uppercase tracking-widest text-[10px]">
                            <CheckCircle2 size={18} /> {notification}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ReferralsPage;
