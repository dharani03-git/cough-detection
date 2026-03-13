import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, Upload, Play, Square, RefreshCw,
    Activity, Shield, Heart, Star, Baby,
    Music, Trophy, Lightbulb,
    Volume2, CheckCircle2, AlertCircle, Sparkles,
    BarChart3, TrendingUp, Download
} from 'lucide-react';
import axios from 'axios';
import { encodeWAV } from './utils/wav-utils';
import API_BASE_URL from './api-config';

const VoiceDevPage: React.FC = () => {
    const [step, setStep] = useState(1);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [progressData] = useState([
        { day: 'Mon', score: 65 },
        { day: 'Tue', score: 68 },
        { day: 'Wed', score: 72 },
        { day: 'Thu', score: 70 },
        { day: 'Fri', score: 75 },
        { day: 'Sat', score: 82 },
        { day: 'Sun', score: 85 },
    ]);

    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const audioChunks = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        if (isRecording) {
            timerRef.current = window.setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
            setRecordingTime(0);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isRecording]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            audioChunks.current = [];
            mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
            mediaRecorder.current.onstop = async () => {
                const audioBlob = new Blob(audioChunks.current, { type: mediaRecorder.current?.mimeType });
                const arrayBuffer = await audioBlob.arrayBuffer();
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                try {
                    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                    const channelData = audioBuffer.getChannelData(0);
                    const wavBlob = encodeWAV(channelData, audioBuffer.sampleRate);
                    setAudioFile(new File([wavBlob], "voice_dev_sample.wav", { type: 'audio/wav' }));
                } catch (e) {
                    console.error("WAV Encoding Error:", e);
                } finally {
                    await audioCtx.close();
                }
            };
            mediaRecorder.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Mic error:", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current) {
            mediaRecorder.current.stop();
            setIsRecording(false);
            mediaRecorder.current.stream.getTracks().forEach(t => t.stop());
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setAudioFile(e.target.files[0]);
        }
    };

    const runAnalysis = async () => {
        if (!audioFile) return;
        setIsAnalyzing(true);
        setError(null);
        setStep(2);

        const formData = new FormData();
        formData.append('file', audioFile);

        try {
            const response = await axios.post(`${API_BASE_URL}/api/voice-dev/analyze`, formData);
            if (response.data.status === 'error') {
                throw new Error(response.data.message || 'Analysis failed');
            }
            setResult(response.data);
            setStep(3);
        } catch (err: any) {
            console.error("Voice Analysis failed:", err);
            setError(err.response?.data?.detail || err.message || "Failed to connect to backend server.");
            setStep(1);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-400';
        if (score >= 60) return 'text-amber-400';
        return 'text-rose-400';
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter flex items-center gap-4">
                        <Baby className="text-indigo-500" size={48} />
                        Voice<span className="text-indigo-500">Explorer</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-sm md:text-base mt-2">Pediatric Vocal Strength & Development Module.</p>
                </div>
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${step === i ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500'}`}>
                            Step {i}
                        </div>
                    ))}
                </div>
            </header>

            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                    >
                        <div className="lg:col-span-12">
                            <div className="bg-[#030712] border border-white/10 rounded-[2.5rem] p-8 md:p-12 text-center space-y-8 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -mr-32 -mt-32" />
                                
                                <div className="max-w-2xl mx-auto space-y-6">
                                    <div className="w-24 h-24 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                                        <Mic className="text-indigo-500" size={40} />
                                    </div>
                                    <h2 className="text-3xl font-black tracking-tight">Vocal Recording</h2>
                                    <p className="text-slate-400 text-lg leading-relaxed">
                                        Have the child say "Aaaaaa" or read a short sentence clearly into the microphone.
                                    </p>
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="max-w-xl mx-auto p-6 bg-rose-500/10 border border-rose-500/20 rounded-[1.5rem] flex items-center gap-4 text-rose-400"
                                    >
                                        <AlertCircle size={24} />
                                        <div className="text-left">
                                            <p className="text-sm font-black uppercase tracking-widest">Analysis Error</p>
                                            <p className="text-xs font-bold mt-1 opacity-80">{error}</p>
                                        </div>
                                    </motion.div>
                                )}

                                <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-12">
                                    {!isRecording ? (
                                        <button
                                            onClick={startRecording}
                                            className="group relative px-10 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                                        >
                                            <span className="flex items-center gap-3">
                                                <Mic size={24} /> START RECORDING
                                            </span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={stopRecording}
                                            className="px-10 py-6 bg-rose-500 hover:bg-rose-400 text-white rounded-[2rem] font-black uppercase tracking-widest transition-all shadow-xl shadow-rose-600/20 animate-pulse active:scale-95"
                                        >
                                            <span className="flex items-center gap-3">
                                                <Square size={24} fill="white" /> STOP ({recordingTime}s)
                                            </span>
                                        </button>
                                    )}

                                    <div className="relative">
                                        <label className="flex items-center gap-3 px-10 py-6 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 rounded-[2rem] font-black uppercase tracking-widest transition-all cursor-pointer active:scale-95">
                                            <Upload size={24} /> UPLOAD AUDIO
                                            <input type="file" className="hidden" accept="audio/*" onChange={handleFileUpload} />
                                        </label>
                                    </div>
                                </div>

                                {audioFile && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="mt-12 p-8 bg-indigo-500/5 border border-indigo-500/20 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center text-white">
                                                <Volume2 size={24} />
                                            </div>
                                            <div className="text-left">
                                                <div className="text-sm font-black tracking-tight text-white">{audioFile.name}</div>
                                                <div className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1">Ready for developmental analysis</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 w-full md:w-auto">
                                            <button
                                                onClick={() => setAudioFile(null)}
                                                className="flex-1 md:flex-none p-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all"
                                            >
                                                <RefreshCw size={20} />
                                            </button>
                                            <button
                                                onClick={runAnalysis}
                                                className="flex-1 md:flex-none px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg"
                                            >
                                                ANALYZE NOW
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { icon: Shield, title: "Pediatric Safe", desc: "Built with child-safety standards and HIPAA-grade encryption." },
                                { icon: Heart, title: "Developmental", desc: "Focused on identifying voice strength milestones for children." },
                                { icon: Music, title: "Vocal Clarity", desc: "Advanced acoustic modeling for early coarse voice detection." }
                            ].map((info, i) => (
                                <div key={i} className="bg-white/5 border border-white/5 p-8 rounded-[2rem] space-y-4">
                                    <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                                        <info.icon className="text-indigo-500" size={24} />
                                    </div>
                                    <h3 className="text-lg font-black tracking-tight">{info.title}</h3>
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed">{info.desc}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-24 space-y-8"
                    >
                        <div className="relative">
                            <div className="w-32 h-32 border-4 border-indigo-500/20 rounded-full animate-spin border-t-indigo-500" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Activity className="text-indigo-500 animate-pulse" size={40} />
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-black tracking-tight animate-pulse text-white">Extracting Acoustic Features</h2>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Jitter · Shimmer · MFCC · Spectral Flux</p>
                        </div>
                    </motion.div>
                )}

                {step === 3 && result && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-12"
                    >
                        {/* Main Analysis Result */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Score Card */}
                            <div className="lg:col-span-4">
                                <div className="bg-[#030712] border border-white/10 rounded-[2.5rem] p-8 h-full shadow-2xl flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">
                                     <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/10 blur-[60px] -ml-16 -mt-16" />
                                     <Star className="text-amber-400 animate-bounce" size={48} fill="currentColor" />
                                     <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Strength Score</p>
                                        <h3 className={`text-7xl font-black ${getScoreColor(result.strength_score)}`}>{result.strength_score}</h3>
                                     </div>
                                     <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl">
                                        <p className="text-sm font-black tracking-tight">{result.classification}</p>
                                     </div>
                                </div>
                            </div>

                            {/* Detailed Metrics */}
                            <div className="lg:col-span-8">
                                <div className="bg-[#030712] border border-white/10 rounded-[2.5rem] p-8 h-full shadow-2xl space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-black tracking-tight">Acoustic Signatures</h3>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-3 py-1.5 rounded-lg border border-emerald-400/20">
                                            <Sparkles size={12} /> Analysis Complete
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                        {[
                                            { label: 'Pitch (F0)', value: `${result.metrics.pitch} Hz`, icon: Music },
                                            { label: 'Jitter', value: `${(result.metrics.jitter * 100).toFixed(2)}%`, icon: TrendingUp },
                                            { label: 'Shimmer', value: `${(result.metrics.shimmer * 100).toFixed(2)}%`, icon: Activity },
                                            { label: 'Vocal Energy', value: result.metrics.energy, icon: Volume2 }
                                        ].map((m, i) => (
                                            <div key={i} className="space-y-2">
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <m.icon size={14} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                                                </div>
                                                <p className="text-xl font-black text-white">{m.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* MFCC Spectrum Chart (Simplified Representation) */}
                                    <div className="pt-6 border-t border-white/5">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">MFCC Spectrum Signature</p>
                                        <div className="flex items-end gap-2 h-24">
                                            {result.metrics.mfcc.map((v: number, i: number) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${Math.abs(v) / 2 + 10}%` }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className={`flex-1 rounded-t-lg bg-gradient-to-t ${v > 0 ? 'from-indigo-600 to-indigo-400' : 'from-rose-600 to-rose-400'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Progress and Exercises */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Recommendations */}
                            <div className="lg:col-span-7">
                                <div className="bg-[#030712] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-amber-400/10 rounded-2xl flex items-center justify-center text-amber-400">
                                            <Lightbulb size={24} />
                                        </div>
                                        <h3 className="text-xl font-black tracking-tight">Vocal Training Exercises</h3>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {result.recommendations.map((rec: string, i: number) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="flex items-center gap-4 p-5 bg-white/5 border border-white/5 rounded-[1.5rem] group hover:bg-indigo-500/10 hover:border-indigo-500/20 transition-all"
                                            >
                                                <div className="w-8 h-8 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 font-bold text-xs group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                                    {i + 1}
                                                </div>
                                                <p className="text-sm font-bold text-slate-300 group-hover:text-white transition-all">{rec}</p>
                                                <button className="ml-auto p-2 text-slate-500 hover:text-indigo-400">
                                                    <Play size={16} fill="currentColor" />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Progress Tracking */}
                            <div className="lg:col-span-5">
                                <div className="bg-[#030712] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
                                                <TrendingUp size={24} />
                                            </div>
                                            <h3 className="text-xl font-black tracking-tight">Development Tracker</h3>
                                        </div>
                                        <Trophy className="text-amber-400" size={24} />
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-end justify-between gap-2 h-40 pt-4">
                                            {progressData.map((d, i) => (
                                                <div key={i} className="flex-1 flex flex-col items-center gap-3">
                                                    <div className="relative w-full flex-grow flex items-end">
                                                        <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${d.score}%` }}
                                                            className={`w-full rounded-t-xl bg-indigo-500/20 border-t-2 border-indigo-500/50 relative group cursor-pointer hover:bg-indigo-500/40 transition-all`}
                                                        >
                                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2 opacity-0 group-hover:opacity-100 transition-all bg-indigo-600 text-white px-2 py-1 rounded text-[10px] font-black">{d.score}</div>
                                                        </motion.div>
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{d.day}</span>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <div className="p-5 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Weekly Growth</p>
                                                <p className="text-lg font-black text-white">+12.4% <span className="text-emerald-400 text-sm">↑</span></p>
                                            </div>
                                            <button className="px-5 py-2.5 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">
                                                VIEW HISTORY
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col md:flex-row items-center justify-center gap-6 pb-12">
                            <button
                                onClick={() => { setStep(1); setResult(null); setAudioFile(null); }}
                                className="px-10 py-5 bg-white/5 border border-white/10 text-slate-300 rounded-[2rem] font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
                            >
                                NEW ASSESSMENT
                            </button>
                            <button
                                className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center gap-3"
                            >
                                <Download size={20} /> EXPORT RECORD
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VoiceDevPage;
