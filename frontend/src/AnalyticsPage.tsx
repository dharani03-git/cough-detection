import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Activity, TrendingUp, Calendar, HeartPulse } from 'lucide-react';

const AnalyticsPage: React.FC = () => {
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('resono_history');
        if (saved) {
            setHistory(JSON.parse(saved).reverse()); // Reverse to show chronologically
        }
    }, []);

    const chartData = history.map((item, i) => ({
        val: item.biomarkers?.fev1_fvc_ratio * 100 || 80,
        score: item.biomarkers?.respiratory_score || 70,
        label: item.timestamp || `T-${i}`
    }));

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-12"
        >
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter">Clinical Analytics</h1>
                    <p className="text-slate-500 font-medium">Longitudinal biomarker trends and population telemetry.</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Live Sync Active</span>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-8">
                {/* Trend Chart */}
                <div className="col-span-12 lg:col-span-8 bg-[#030712] border border-white/5 rounded-[2.5rem] p-10 space-y-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <TrendingUp size={120} />
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Activity className="text-indigo-400" /> Biomarker Recovery Trend
                        </h3>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">FEV1 %</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resp. Score</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-64 flex items-end gap-1 px-2 border-b border-l border-white/5 relative">
                        {chartData.length > 0 ? chartData.map((d, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                                <div className="w-full flex justify-center gap-1">
                                    <motion.div 
                                        initial={{ height: 0 }}
                                        animate={{ height: `${d.val}%` }}
                                        className="w-2 bg-indigo-500 rounded-t-full shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                                    />
                                    <motion.div 
                                        initial={{ height: 0 }}
                                        animate={{ height: `${d.score}%` }}
                                        className="w-2 bg-emerald-500 rounded-t-full shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                    />
                                </div>
                                <div className="absolute -bottom-8 rotate-45 text-[8px] font-bold text-slate-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                    {d.label}
                                </div>
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 -top-4 rounded-xl transition-all flex flex-col items-center justify-start pt-2">
                                    <span className="text-[10px] font-black text-white">{d.val.toFixed(0)}%</span>
                                </div>
                            </div>
                        )) : (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-600 font-black uppercase tracking-widest opacity-20">
                                No longitudinal data recorded
                            </div>
                        )}
                    </div>
                    <div className="pt-6 flex justify-between text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        <span>Baseline</span>
                        <span>Current Assessment Period</span>
                    </div>
                </div>

                {/* KPI Sidebar */}
                <div className="col-span-12 lg:col-span-4 space-y-8">
                    <div className="bg-[#030712] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-8">
                        <div className="bg-white/5 border border-white/5 p-6 rounded-2xl">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <HeartPulse size={12} className="text-red-500" /> Patient Risk Entropy
                            </p>
                            <h4 className="text-4xl font-black tracking-tighter text-white">4.2 <span className="text-sm opacity-30">σ</span></h4>
                            <div className="mt-4 flex gap-1 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="w-[15%] h-full bg-red-500" />
                                <div className="w-[25%] h-full bg-amber-500" />
                                <div className="w-[60%] h-full bg-emerald-500" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Key Diagnostic Indicators</h5>
                            {[
                                { label: 'Median FEV1 Value', val: '78.4%', status: 'Stable' },
                                { label: 'Pathological Convergence', val: 'Low', status: 'Optimal' },
                                { label: 'Model Confidence Avg', val: '92.1%', status: 'Stable' }
                            ].map((kpi, i) => (
                                <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-xl flex justify-between items-center">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{kpi.label}</p>
                                        <p className="text-lg font-bold text-white mt-1">{kpi.val}</p>
                                    </div>
                                    <span className="text-[9px] font-black px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg uppercase border border-emerald-500/20">{kpi.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AnalyticsPage;
