import React from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

interface PlaceholderPageProps {
    title: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-[60vh] text-center space-y-8"
        >
            <div className="w-32 h-32 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20">
                <Activity className="text-indigo-400 animate-pulse" size={48} />
            </div>
            <div className="space-y-4">
                <h1 className="text-5xl font-black tracking-tighter uppercase">{title}</h1>
                <p className="text-slate-500 max-w-md mx-auto font-medium">
                    This module is currently being integrated into the ResonoHack clinical workflow.
                    Neural weights and database schemas are being synchronized.
                </p>
            </div>
            <div className="flex gap-4">
                <div className="px-6 py-3 bg-white/5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Status: Deploying
                </div>
                <div className="px-6 py-3 bg-white/5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Priority: High
                </div>
            </div>
        </motion.div>
    );
};

export default PlaceholderPage;
