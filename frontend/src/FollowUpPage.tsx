import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, AlertCircle, User, MessageSquare, Mail,
    Smartphone, Search, Filter, ShieldAlert, MoreHorizontal,
    ChevronRight, X, UserPlus, Building2, Stethoscope,
    CheckCircle2, Clock, AlertTriangle, Zap
} from 'lucide-react';

interface PatientFollowUp {
    id: string;
    patientId: string;
    name: string;
    riskLevel: 'Low' | 'Medium' | 'High';
    lastScreening: string;
    nextFollowUp: string;
    doctor: string;
    status: 'Scheduled' | 'Pending' | 'Completed';
    daysOverdue?: number;
    riskScore?: number;
    condition?: string;
    priority?: 'Critical' | 'High' | 'Moderate';
    lastContact?: string;
}

const mockFollowUps: PatientFollowUp[] = [
    { id: '1', patientId: 'RH-7721', name: 'James Wilson', riskLevel: 'High', lastScreening: '2026-03-05', nextFollowUp: '2026-03-12', doctor: 'Dr. Sarah Chen', status: 'Scheduled', riskScore: 0.88, condition: 'Pneumonia Risk', priority: 'Critical', lastContact: '2026-03-06' },
    { id: '2', patientId: 'RH-8832', name: 'Elena Rodriguez', riskLevel: 'Medium', lastScreening: '2026-02-28', nextFollowUp: '2026-03-07', doctor: 'Dr. Michael Vogt', status: 'Pending', daysOverdue: 4, riskScore: 0.65, condition: 'COPD Management', priority: 'High', lastContact: '2026-03-01' },
    { id: '3', patientId: 'RH-9012', name: 'Robert Chen', riskLevel: 'High', lastScreening: '2026-03-01', nextFollowUp: '2026-03-08', doctor: 'Dr. Sarah Chen', status: 'Scheduled', daysOverdue: 3, riskScore: 0.92, condition: 'TB Screening', priority: 'Critical', lastContact: '2026-03-02' },
    { id: '4', patientId: 'RH-4451', name: 'Linda Thompson', riskLevel: 'Low', lastScreening: '2026-03-09', nextFollowUp: '2026-03-16', doctor: 'Dr. Emily Blunt', status: 'Scheduled', riskScore: 0.22, condition: 'Routine Check', priority: 'Moderate', lastContact: '2026-03-09' },
    { id: '5', patientId: 'RH-1120', name: 'Arthur Morgan', riskLevel: 'Medium', lastScreening: '2026-03-02', nextFollowUp: '2026-03-15', doctor: 'Dr. Michael Vogt', status: 'Scheduled', riskScore: 0.58, condition: 'Asthma Follow-up', priority: 'Moderate', lastContact: '2026-03-03' },
];

const FollowUpPage: React.FC = () => {
    const [filter, setFilter] = useState<'Upcoming' | 'Overdue' | 'HighRisk'>('Upcoming');
    const [searchQuery, setSearchQuery] = useState('');
    const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<PatientFollowUp | null>(null);
    const [notification, setNotification] = useState<string | null>(null);

    const showNotification = (msg: string) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 3000);
    };

    const filteredData = mockFollowUps.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.patientId.toLowerCase().includes(searchQuery.toLowerCase());

        if (filter === 'Overdue') return matchesSearch && (p.daysOverdue ?? 0) > 0;
        if (filter === 'HighRisk') return matchesSearch && p.riskLevel === 'High';
        return matchesSearch;
    });

    const stats = [
        { label: 'Upcoming Follow-Ups', value: '24', icon: Calendar, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
        { label: 'Overdue Cases', value: '07', icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-400/10' },
        { label: 'High Risk Patients', value: '12', icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-400/10' },
        { label: 'Reminders Sent Today', value: '45', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    ];

    const getRiskBadge = (level: string) => {
        const colors = {
            High: 'bg-red-500/10 text-red-500 border-red-500/20',
            Medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
            Low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        };
        return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${colors[level as keyof typeof colors]}`}>{level}</span>;
    };

    const getPriorityBadge = (priority: string) => {
        const colors = {
            Critical: 'bg-red-600 text-white',
            High: 'bg-amber-600 text-white',
            Moderate: 'bg-indigo-600 text-white'
        };
        return <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${colors[priority as keyof typeof colors]}`}>{priority}</span>;
    };

    return (
        <div className="space-y-12 pb-20">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter">Follow-Up Management</h1>
                    <p className="text-slate-500 font-medium">Post-screening patient monitoring and condition tracking.</p>
                </div>
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

            {/* Controls & Filters */}
            <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
                    {[
                        { id: 'Upcoming', label: 'Upcoming Cases' },
                        { id: 'Overdue', label: 'Overdue' },
                        { id: 'HighRisk', label: 'High-Risk patients' }
                    ].map(btn => (
                        <button
                            key={btn.id}
                            onClick={() => setFilter(btn.id as any)}
                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === btn.id ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4 flex-grow max-w-md">
                    <div className="relative flex-grow">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search Patient Name or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#030712] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner placeholder:text-slate-600"
                        />
                    </div>
                </div>
            </div>

            {/* Main Table Content */}
            <div className="bg-[#030712] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/5">
                            <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Patient Details</th>

                            {filter === 'Upcoming' && (
                                <>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Risk Level</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Next Follow-Up</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Assigned Specialist</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                </>
                            )}

                            {filter === 'Overdue' && (
                                <>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Days Overdue</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Risk Level</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Contact</th>
                                </>
                            )}

                            {filter === 'HighRisk' && (
                                <>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Risk Score</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Condition detected</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Priority</th>
                                </>
                            )}

                            <th className="px-8 py-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        <AnimatePresence mode='popLayout'>
                            {filteredData.map((patient) => (
                                <motion.tr
                                    key={patient.id}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="group hover:bg-white/[0.02] transition-colors"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-500 font-bold group-hover:border-indigo-500/30 transition-all">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-black tracking-tight">{patient.name}</div>
                                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">{patient.patientId}</div>
                                            </div>
                                        </div>
                                    </td>

                                    {filter === 'Upcoming' && (
                                        <>
                                            <td className="px-8 py-6">{getRiskBadge(patient.riskLevel)}</td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
                                                    <Calendar size={14} className="text-indigo-400" />
                                                    {patient.nextFollowUp}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-sm font-medium text-slate-400">{patient.doctor}</td>
                                            <td className="px-8 py-6">
                                                <span className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${patient.status === 'Completed' ? 'text-emerald-400' : 'text-amber-500'}`}>
                                                    <Clock size={12} /> {patient.status}
                                                </span>
                                            </td>
                                        </>
                                    )}

                                    {filter === 'Overdue' && (
                                        <>
                                            <td className="px-8 py-6 text-center">
                                                <span className={`px-4 py-1 rounded-lg font-mono font-bold text-lg ${patient.daysOverdue! > 3 ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>
                                                    +{patient.daysOverdue}d
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">{getRiskBadge(patient.riskLevel)}</td>
                                            <td className="px-8 py-6 text-sm font-medium text-slate-400">{patient.lastContact}</td>
                                        </>
                                    )}

                                    {filter === 'HighRisk' && (
                                        <>
                                            <td className="px-8 py-6">
                                                <div className="w-full max-w-[100px] h-1.5 bg-white/5 rounded-full overflow-hidden mt-1">
                                                    <div
                                                        className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                                                        style={{ width: `${patient.riskScore! * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest mt-2 inline-block">{(patient.riskScore! * 100).toFixed(0)}% Criticality</span>
                                            </td>
                                            <td className="px-8 py-6 text-sm font-bold text-slate-300 italic">"{patient.condition}"</td>
                                            <td className="px-8 py-6 text-center">{getPriorityBadge(patient.priority!)}</td>
                                        </>
                                    )}

                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => showNotification(`SMS reminder queued for ${patient.name}`)}
                                                className="p-2.5 bg-white/5 border border-white/5 text-slate-500 rounded-xl hover:bg-indigo-500/10 hover:text-indigo-400 transition-all group/btn"
                                                title="Send SMS"
                                            >
                                                <Smartphone size={16} />
                                            </button>
                                            <button
                                                onClick={() => showNotification(`Email reminder sent to ${patient.name}`)}
                                                className="p-2.5 bg-white/5 border border-white/5 text-slate-500 rounded-xl hover:bg-violet-500/10 hover:text-violet-400 transition-all"
                                                title="Send Email"
                                            >
                                                <Mail size={16} />
                                            </button>
                                            <button
                                                onClick={() => showNotification(`WhatsApp notification sent to ${patient.name}`)}
                                                className="p-2.5 bg-white/5 border border-white/5 text-slate-500 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-400 transition-all"
                                                title="WhatsApp Messenger"
                                            >
                                                <MessageSquare size={16} />
                                            </button>
                                            <div className="w-px h-6 bg-white/5 mx-2" />
                                            <button
                                                onClick={() => {
                                                    setSelectedPatient(patient);
                                                    setIsEscalateModalOpen(true);
                                                }}
                                                className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                                            >
                                                ESCALATE
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            {/* Escalation Modal */}
            <AnimatePresence>
                {isEscalateModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#030712] border border-white/10 rounded-[3rem] w-full max-w-xl p-12 shadow-[0_30px_100px_-20px_rgba(239,68,68,0.2)] overflow-hidden relative"
                        >
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 to-red-400" />

                            <button
                                onClick={() => setIsEscalateModalOpen(false)}
                                className="absolute top-8 right-8 p-3 bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="space-y-10">
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                        <AlertTriangle size={36} className="text-red-500" />
                                    </div>
                                    <h2 className="text-3xl font-black tracking-tighter uppercase">Escalate Case</h2>
                                    <p className="text-slate-500 font-medium mt-2">Trigger critical intervention for <strong>{selectedPatient?.name}</strong></p>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {[
                                        { id: 'specialist', label: 'Assign Pulmonary Specialist', desc: 'Dr. Jameson (Senior Consultant)', icon: Stethoscope },
                                        { id: 'hospital', label: 'Refer to General Hospital', desc: 'Emergency Respiratory Ward', icon: Building2 },
                                        { id: 'emergency', label: 'Schedule Emergency Screening', desc: 'Immediate priority re-analysis', icon: Zap }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => {
                                                showNotification(`Case escalated: ${opt.label}`);
                                                setIsEscalateModalOpen(false);
                                            }}
                                            className="flex items-center gap-6 p-6 rounded-3xl bg-white/5 border border-white/5 text-left hover:bg-white/10 hover:border-red-500/30 transition-all group"
                                        >
                                            <div className="w-12 h-12 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-center text-slate-500 group-hover:text-red-400 group-hover:bg-red-500/10 transition-all">
                                                <opt.icon size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black uppercase tracking-tight text-white">{opt.label}</p>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{opt.desc}</p>
                                            </div>
                                            <ChevronRight className="ml-auto text-slate-700 group-hover:text-white transition-colors" size={20} />
                                        </button>
                                    ))}
                                </div>
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

export default FollowUpPage;
