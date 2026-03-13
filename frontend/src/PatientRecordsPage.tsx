import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Activity, ShieldAlert, CheckCircle2, Search,
    User, FileText, Download, Trash2, Edit, Eye, X,
    Phone, MapPin, Calendar, ActivitySquare, Paperclip,
    Mic, FilePieChart, Stethoscope
} from 'lucide-react';
import axios from 'axios';

interface PatientRecord {
    id: string;
    patientId: string;
    name: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    phone: string;
    address: string;
    lastScreeningDate: string;
    riskLevel: 'Low' | 'Medium' | 'High';
    screeningStatus: 'Completed' | 'Pending' | 'In Progress';
    followUpStatus: 'Scheduled' | 'Pending' | 'None';
    smokingHistory: string;
    existingConditions: string[];
    screeningHistory: {
        date: string;
        coughType: string;
        riskScore: number;
        riskLevel: string;
        uncertainty: number;
        result: string;
    }[];
    attachments: { name: string; type: 'audio' | 'pdf' | 'doc' }[];
}

const mockPatients: PatientRecord[] = [
    {
        id: '1', patientId: 'RH-7721', name: 'James Wilson', age: 45, gender: 'Male', phone: '+1 (555) 019-2831', address: '124 Medical Way, Techville, CA 90210', lastScreeningDate: '2026-03-05', riskLevel: 'High', screeningStatus: 'Completed', followUpStatus: 'Scheduled',
        smokingHistory: 'Former Smoker (Quit 2020)', existingConditions: ['Hypertension'],
        screeningHistory: [{ date: '2026-03-05', coughType: 'Wet/Productive', riskScore: 0.88, result: 'Pneumonia Risk High', riskLevel: 'Critical', uncertainty: 0.12 }],
        attachments: [{ name: 'Cough_Sample_Mar05.wav', type: 'audio' }, { name: 'AI_Screening_Report_Mar05.pdf', type: 'pdf' }]
    },
    {
        id: '2', patientId: 'RH-8832', name: 'Elena Rodriguez', age: 32, gender: 'Female', phone: '+1 (555) 832-1100', address: '452 Pine Street, Apt 3B, New York, NY 10001', lastScreeningDate: '2026-02-28', riskLevel: 'Medium', screeningStatus: 'Completed', followUpStatus: 'Pending',
        smokingHistory: 'Never Smoked', existingConditions: ['Asthma'],
        screeningHistory: [{ date: '2026-02-28', coughType: 'Dry/Hacking', riskScore: 0.65, result: 'COPD Management Required', riskLevel: 'High', uncertainty: 0.35 }],
        attachments: [{ name: 'Cough_Sample_Feb28.wav', type: 'audio' }, { name: 'Referral_Dr_Vogt.doc', type: 'doc' }]
    },
    {
        id: '3', patientId: 'RH-9012', name: 'Robert Chen', age: 58, gender: 'Male', phone: '+1 (555) 332-9988', address: '88 Long Avenue, Riverside, TX 75001', lastScreeningDate: '2026-03-01', riskLevel: 'High', screeningStatus: 'Completed', followUpStatus: 'Scheduled',
        smokingHistory: 'Current Smoker', existingConditions: ['Diabetes', 'Chronic Bronchitis'],
        screeningHistory: [{ date: '2026-03-01', coughType: 'Chronic/Wheezing', riskScore: 0.92, result: 'TB Screening Required', riskLevel: 'Critical', uncertainty: 0.08 }],
        attachments: [{ name: 'AI_Screening_Report_Mar01.pdf', type: 'pdf' }]
    },
    {
        id: '4', patientId: 'RH-4451', name: 'Linda Thompson', age: 29, gender: 'Female', phone: '+1 (555) 776-5544', address: '1102 Maple Drive, Colorado Springs, CO 80903', lastScreeningDate: '2026-03-09', riskLevel: 'Low', screeningStatus: 'Completed', followUpStatus: 'None',
        smokingHistory: 'Never Smoked', existingConditions: ['None'],
        screeningHistory: [{ date: '2026-03-09', coughType: 'Clear', riskScore: 0.22, result: 'Routine Check Normal', riskLevel: 'Low', uncertainty: 0.05 }],
        attachments: [{ name: 'Cough_Sample_Mar09.wav', type: 'audio' }]
    },
];

import { generateFHIRDiagnosticReport } from './utils/fhir-utils';

import API_BASE_URL from './api-config';

const PatientRecordsPage: React.FC = () => {
    const [patients, setPatients] = useState<PatientRecord[]>(mockPatients);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/patients`);

                // Map DB schema to frontend PatientRecord format
                const dbPatients = response.data.map((p: any) => ({
                    id: p.patient_id.toString(),
                    patientId: `RH-${1000 + p.patient_id}`,
                    name: p.full_name,
                    age: p.age || 25,
                    gender: p.gender || 'Unknown',
                    phone: p.phone_number || 'N/A',
                    address: p.address || 'N/A',
                    lastScreeningDate: 'Pending',
                    riskLevel: p.risk_level || 'Low',
                    screeningStatus: p.screening_status || 'Pending',
                    followUpStatus: p.followup_status || 'None',
                    smokingHistory: p.smoking_history || 'Unknown',
                    existingConditions: p.existing_conditions ? p.existing_conditions.split(',') : [],
                    screeningHistory: [],
                    attachments: []
                }));

                // Combine with mock patients for demo purposes, or just use DB
                // We'll use DB patients + mock ones as fallback/demo
                setPatients([...dbPatients, ...mockPatients]);
            } catch (err) {
                console.error("Failed to load patients", err);
            }
        };
        fetchPatients();
    }, []);

    const showNotification = (msg: string) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 3000);
    };

    const filteredData = patients.filter(p => {
        return p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.phone.includes(searchQuery);
    });

    const stats = [
        { label: 'Total Patients', value: '1,248', icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
        { label: 'Active Cases', value: '342', icon: Activity, color: 'text-amber-400', bg: 'bg-amber-400/10' },
        { label: 'High Risk Patients', value: '45', icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-400/10' },
        { label: 'Completed Screenings', value: '892', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    ];

    const getRiskBadge = (level: string) => {
        const colors = {
            High: 'bg-red-500/10 text-red-500 border-red-500/20',
            Medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
            Low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        };
        return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${colors[level as keyof typeof colors]}`}>{level}</span>;
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            Completed: 'text-emerald-400',
            Pending: 'text-amber-400',
            'In Progress': 'text-indigo-400',
            Scheduled: 'text-blue-400',
            None: 'text-slate-500'
        };
        return <span className={`font-bold text-sm ${colors[status] || 'text-slate-400'}`}>{status}</span>;
    };

    const getAttachmentIcon = (type: string) => {
        switch (type) {
            case 'audio': return <Mic size={16} className="text-indigo-400" />;
            case 'pdf': return <FilePieChart size={16} className="text-red-400" />;
            case 'doc': return <FileText size={16} className="text-blue-400" />;
            default: return <Paperclip size={16} className="text-slate-400" />;
        }
    };

    return (
        <div className="space-y-12 pb-20">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter">Patient Records</h1>
                    <p className="text-slate-500 font-medium">Comprehensive respiratory health database.</p>
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
                <div className="flex items-center gap-4 flex-grow max-w-md">
                    <div className="relative flex-grow">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search Patients by Name, ID or Phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#030712] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner placeholder:text-slate-600"
                        />
                    </div>
                </div>
            </div>

            {/* Database Table */}
            <div className="bg-[#030712] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/5">
                            <th className="px-6 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Patient ID</th>
                            <th className="px-6 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Patient Name</th>
                            <th className="px-6 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Age</th>
                            <th className="px-6 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Gender</th>
                            <th className="px-6 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Phone Number</th>
                            <th className="px-6 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Screening</th>
                            <th className="px-6 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Risk Level</th>
                            <th className="px-6 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Screening Status</th>
                            <th className="px-6 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Follow-Up</th>
                            <th className="px-6 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
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
                                    <td className="px-6 py-4">
                                        <div className="text-[12px] text-indigo-400 font-black uppercase tracking-widest">{patient.patientId}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-500 font-bold group-hover:border-indigo-500/30 transition-all">
                                                <User size={16} />
                                            </div>
                                            <div className="text-sm font-black tracking-tight">{patient.name}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-300">{patient.age}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-300">{patient.gender}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-400">{patient.phone}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-300">{patient.lastScreeningDate}</td>
                                    <td className="px-6 py-4">{getRiskBadge(patient.riskLevel)}</td>
                                    <td className="px-6 py-4">{getStatusBadge(patient.screeningStatus)}</td>
                                    <td className="px-6 py-4">{getStatusBadge(patient.followUpStatus)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedPatient(patient);
                                                    setIsProfileModalOpen(true);
                                                }}
                                                className="p-2 bg-white/5 border border-white/5 text-slate-500 rounded-lg hover:bg-indigo-500/10 hover:text-indigo-400 transition-all" title="View Record">
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => showNotification('Edit functionality pending...')}
                                                className="p-2 bg-white/5 border border-white/5 text-slate-500 rounded-lg hover:bg-amber-500/10 hover:text-amber-400 transition-all" title="Edit Patient">
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => showNotification(`Downloading report for ${patient.name}...`)}
                                                className="p-2 bg-white/5 border border-white/5 text-slate-500 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-400 transition-all" title="Download Report">
                                                <Download size={16} />
                                            </button>
                                            <div className="w-px h-5 bg-white/5 mx-1" />
                                            <button
                                                onClick={() => showNotification(`Deleted record for ${patient.name}`)}
                                                className="p-2 bg-white/5 border border-white/5 text-slate-500 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-all" title="Delete Record">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            {/* Patient Profile Modal */}
            <AnimatePresence>
                {isProfileModalOpen && selectedPatient && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#030712] border border-white/10 rounded-[2.5rem] w-full max-w-5xl h-[85vh] flex flex-col shadow-[0_30px_100px_-20px_rgba(99,102,241,0.2)] overflow-hidden relative"
                        >
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-600 to-violet-400" />

                            {/* Modal Header */}
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                        <User size={32} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black tracking-tighter">{selectedPatient.name}</h2>
                                        <p className="text-sm text-indigo-400 font-bold uppercase tracking-widest mt-1">{selectedPatient.patientId}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsProfileModalOpen(false)}
                                    className="p-3 bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors hover:bg-white/10"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Modal Content - Scrollable */}
                            <div className="flex-grow overflow-y-auto custom-scrollbar p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                    {/* Left Column Group */}
                                    <div className="space-y-8">
                                        {/* Patient Information */}
                                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                                            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                <User size={14} className="text-indigo-400" /> Patient Information
                                            </h3>
                                            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                                <div>
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Age</p>
                                                    <p className="text-sm font-bold text-slate-200 mt-1">{selectedPatient.age} years</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Gender</p>
                                                    <p className="text-sm font-bold text-slate-200 mt-1">{selectedPatient.gender}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Phone</p>
                                                    <p className="text-sm flex items-center gap-2 font-bold text-slate-200 mt-1">
                                                        <Phone size={14} className="text-slate-400" /> {selectedPatient.phone}
                                                    </p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Address</p>
                                                    <p className="text-sm flex items-start gap-2 font-bold text-slate-200 mt-1">
                                                        <MapPin size={14} className="text-slate-400 mt-0.5" /> {selectedPatient.address}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Medical History */}
                                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                                            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                <ActivitySquare size={14} className="text-amber-400" /> Medical History
                                            </h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Smoking History</p>
                                                    <p className="text-sm font-bold text-slate-200 mt-1 bg-white/5 px-3 py-2 rounded-xl inline-block">{selectedPatient.smokingHistory}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Existing Conditions</p>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {selectedPatient.existingConditions.length > 0 ? selectedPatient.existingConditions.map((cond, idx) => (
                                                            <span key={idx} className="bg-indigo-500/10 text-indigo-300 px-3 py-1 rounded-lg text-xs font-bold border border-indigo-500/20">
                                                                {cond}
                                                            </span>
                                                        )) : <span className="text-sm text-slate-500 italic">None reported</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column Group */}
                                    <div className="space-y-8">
                                        {/* Screening History */}
                                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                                            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                <Stethoscope size={14} className="text-emerald-400" /> Screening History
                                            </h3>
                                            <div className="space-y-4">
                                                {selectedPatient.screeningHistory.map((sh, idx) => (
                                                    <div key={idx} className="bg-[#030712] border border-white/5 p-4 rounded-2xl relative overflow-hidden group">
                                                        <div className={`absolute top-0 left-0 w-1 h-full ${sh.riskScore > 0.7 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                                                <Calendar size={12} className="text-indigo-400" /> {sh.date}
                                                            </div>
                                                            <div className="flex flex-col items-end gap-1">
                                                                <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded ${sh.riskScore > 0.7 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                                    Score: {(sh.riskScore * 100).toFixed(0)}%
                                                                </span>
                                                                <span className="text-[9px] font-bold text-slate-500 uppercase">Uncertainty: {(sh.uncertainty * 100).toFixed(0)}%</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm font-medium text-slate-300">Classification: <span className="text-white font-bold">{sh.riskLevel}</span></p>
                                                        <p className="text-sm font-medium text-slate-300 mt-1">Cough: <span className="text-white font-bold">{sh.coughType}</span></p>
                                                        
                                                        <button 
                                                            onClick={() => generateFHIRDiagnosticReport(selectedPatient.name, { prediction: sh.result, confidence: sh.riskScore, risk_level: sh.riskLevel, uncertainty: sh.uncertainty }, { coughType: sh.coughType })}
                                                            className="mt-4 w-full py-2 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-400 transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <Download size={12} /> Export Event FHIR
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Attachments */}
                                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                                            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                <Paperclip size={14} className="text-blue-400" /> Attachments
                                            </h3>
                                            <div className="space-y-3">
                                                {selectedPatient.attachments.map((att, idx) => (
                                                    <div key={idx} className="flex items-center justify-between bg-[#030712] border border-white/5 p-3 rounded-xl hover:border-indigo-500/30 transition-colors group cursor-pointer">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center border border-white/5">
                                                                {getAttachmentIcon(att.type)}
                                                            </div>
                                                            <span className="text-sm font-medium text-slate-300 group-hover:text-indigo-300 transition-colors">{att.name}</span>
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); showNotification(`Downloading ${att.name}...`); }}
                                                            className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-white/5 rounded-lg transition-colors">
                                                            <Download size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {selectedPatient.attachments.length === 0 && (
                                                    <p className="text-sm text-slate-500 italic text-center py-4">No attachments found.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-end gap-4">
                                <button
                                    onClick={() => showNotification('Generating full PDF report...')}
                                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-sm tracking-tight rounded-xl flex items-center gap-2 transition-colors border border-white/5"
                                >
                                    <Download size={16} /> Export Full Profile
                                </button>
                                <button
                                    onClick={() => showNotification('Editing patient profile...')}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm tracking-tight rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
                                >
                                    <Edit size={16} /> Edit Patient Details
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

export default PatientRecordsPage;
