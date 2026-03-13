import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
    RefreshCw, Trash2, Hash, CheckCircle2,
    ShieldAlert, Activity, ChevronRight, FileText, Download
} from 'lucide-react';
import { generateFHIRDiagnosticReport } from './utils/fhir-utils';

import API_BASE_URL from './api-config';

interface HistoryItem {
    id: string;
    timestamp: string;
    filename: string;
    prediction: string;
    confidence: number;
    biomarkers: any;
    risk_level?: string;
    uncertainty?: number;
    file_hash: string;
}

const HistoryPage: React.FC = () => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/history`);
            setHistory(response.data);
        } catch (err) {
            console.error("Failed to fetch history:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-12"
        >
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter">AI Risk Report</h1>
                    <p className="text-slate-500 font-medium">Longitudinal diagnostic outcomes and biometric audit logs.</p>
                </div>
                <button
                    onClick={fetchHistory}
                    disabled={isLoading}
                    className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all text-slate-400 hover:text-white"
                >
                    <RefreshCw className={isLoading ? 'animate-spin' : ''} size={16} /> Sync Records
                </button>
            </header>

            <div className="bg-[#030712] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/5">
                            <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Biometric Node</th>
                            <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Classification</th>
                            <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Biomarkers</th>
                            <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Risk Level</th>
                            <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Uncertainty</th>
                            <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Audit Hash</th>
                            <th className="px-10 py-8 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {history.length > 0 ? history.map((item) => (
                            <tr key={item.id} className="group hover:bg-white/[0.02] transition-colors">
                                <td className="px-10 py-8">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-12 h-12 bg-slate-900 border border-white/5 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all">
                                            <Activity className="text-slate-500 group-hover:text-indigo-400" size={20} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-black tracking-tight uppercase">{item.filename}</div>
                                            <div className="text-[10px] text-slate-500 mt-1 font-bold">{item.timestamp}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-8">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1 rounded-full ${item.prediction.includes('Healthy') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {item.prediction.includes('Healthy') ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
                                        </div>
                                        <div>
                                            <div className="text-sm font-black tracking-tight">{item.prediction}</div>
                                            <div className="text-[10px] text-slate-500 mt-1 font-bold">{(item.confidence * 100).toFixed(1)}% CONFIDENCE</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-8">
                                    <div className="flex gap-2">
                                        {item.biomarkers && (
                                            <>
                                                <span className="px-2 py-1 bg-white/5 rounded-lg text-[9px] font-black uppercase text-indigo-400 border border-white/5">FEV1 {item.biomarkers.fev1_fvc_ratio?.toFixed(2)}</span>
                                                <span className="px-2 py-1 bg-white/5 rounded-lg text-[9px] font-black uppercase text-indigo-400 border border-white/5">Resp {item.biomarkers.respiratory_score}</span>
                                            </>
                                        )}
                                    </div>
                                </td>
                                <td className="px-10 py-8">
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${item.risk_level === 'Critical' ? 'bg-red-500/10 text-red-500' : item.risk_level === 'High' ? 'bg-orange-500/10 text-orange-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                        {item.risk_level || "Standard"}
                                    </span>
                                </td>
                                <td className="px-10 py-8 font-mono text-sm text-indigo-400 font-bold">
                                    {item.uncertainty ? `${(item.uncertainty * 100).toFixed(0)}%` : "N/A"}
                                </td>
                                <td className="px-10 py-8">
                                    <div className="flex items-center gap-2 text-slate-600 font-mono text-[9px] group-hover:text-slate-400 transition-colors">
                                        <Hash size={10} /> {item.file_hash?.substring(0, 16).toUpperCase() ?? "UNKNOWN"}
                                    </div>
                                </td>
                                <td className="px-10 py-8 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => generateFHIRDiagnosticReport(item.filename, item, { fever: 'Unknown', breathingDifficulty: 'Unknown', coughType: 'Recorded' })}
                                            className="p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-slate-500 hover:text-indigo-400 group/btn"
                                            title="Export HL7-FHIR"
                                        >
                                            <Download size={16} />
                                        </button>
                                        <button className="p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-slate-500 hover:text-white group/btn">
                                            <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="px-10 py-20 text-center">
                                    <div className="flex flex-col items-center gap-6 opacity-20">
                                        <FileText size={64} className="text-slate-500" />
                                        <div className="space-y-2">
                                            <h4 className="text-2xl font-black uppercase tracking-tighter">Diagnostic history empty</h4>
                                            <p className="text-[10px] font-bold text-slate-500 max-w-[200px] mx-auto uppercase tracking-widest">Audit logs will materialize after signal analysis.</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

export default HistoryPage;
