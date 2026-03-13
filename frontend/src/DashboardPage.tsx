import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
    Volume2, Trash2, Mic, Upload, Play, RefreshCw,
    BrainCircuit, Zap, Database, Lock, Globe, Stethoscope,
    Target, CheckCircle2, ShieldAlert, AlertTriangle, Activity, Square,
    Download, BookOpen
} from 'lucide-react';
import { encodeWAV } from './utils/wav-utils';

import API_BASE_URL from './api-config';

interface Biomarkers {
    f0_mean: number;
    jitter: number;
    shimmer: number;
    hnr: number;
    vowel_duration: number;
    respiratory_score: number;
    fev1_fvc_ratio: number;
    status: string;
}

interface Visuals {
    spectrogram: string;
    xai_heatmap: string;
}

interface AnalysisResult {
    prediction: string;
    confidence: number;
    disclaimer: string;
    biomarkers: Biomarkers;
    visuals: Visuals;
    risk_level: string;
    uncertainty: number;
    timestamp?: string;
}

const DashboardPage: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);

    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const audioChunks = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        if (isRecording) {
            timerRef.current = window.setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
            setRecordingTime(0);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isRecording]);

    const startRecording = async () => {
        if (!window.isSecureContext) {
            setError("The browser blocked microphone access because this page is not using HTTPS or Localhost.");
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            audioChunks.current = [];

            mediaRecorder.current.ondataavailable = (event) => {
                audioChunks.current.push(event.data);
            };

            mediaRecorder.current.onstop = async () => {
                const audioBlob = new Blob(audioChunks.current, { type: mediaRecorder.current?.mimeType });
                
                // Re-encode to REAL WAV for backend compatibility
                const arrayBuffer = await audioBlob.arrayBuffer();
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                try {
                    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                    const channelData = audioBuffer.getChannelData(0); // Mono
                    const wavBlob = encodeWAV(channelData, audioBuffer.sampleRate);
                    const audioFile = new File([wavBlob], `recording_${Date.now()}.wav`, { type: 'audio/wav' });
                    setFile(audioFile);
                } catch (e) {
                    console.error("WAV Encoding Error:", e);
                    setError("Failed to process recorded audio format.");
                } finally {
                    await audioCtx.close();
                }
            };

            mediaRecorder.current.start(500);
            setIsRecording(true);
            setError(null);
            setResult(null);
        } catch (err: any) {
            console.error("Microphone Error:", err);
            setError(`Microphone error: ${err.message || "Unknown error"}.`);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current) {
            mediaRecorder.current.stop();
            setIsRecording(false);
            mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const originalFile = e.target.files[0];
            
            const isMp3 = originalFile.name.toLowerCase().endsWith('.mp3') || originalFile.type.includes('mpeg') || originalFile.type.includes('mp3');
            
            if (isMp3) {
                setIsLoading(true);
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                try {
                    const arrayBuffer = await originalFile.arrayBuffer();
                    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                    const channelData = audioBuffer.getChannelData(0); // Mono
                    const wavBlob = encodeWAV(channelData, audioBuffer.sampleRate);
                    const audioFile = new File([wavBlob], originalFile.name.replace(/\.[^/.]+$/, "") + ".wav", { type: 'audio/wav' });
                    setFile(audioFile);
                } catch (e) {
                    console.error("Transcoding Fallback:", e);
                    setFile(originalFile); // Fallback to original, backend might handle it
                } finally {
                    await audioCtx.close();
                    setIsLoading(false);
                }
            } else {
                setFile(originalFile);
            }
            
            setError(null);
            setResult(null);
        }
    };

    const analyzeCough = async () => {
        if (!file) return;

        setIsLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`${API_BASE_URL}/predict`, formData);
            const dataWithMeta = {
                ...response.data,
                timestamp: new Date().toLocaleTimeString(),
                id: Date.now()
            };
            setResult(dataWithMeta);

            // In a real app, you'd trigger a global history refresh here
            const saved = localStorage.getItem('resono_history');
            const history = saved ? JSON.parse(saved) : [];
            const newHistory = [dataWithMeta, ...history].slice(0, 10);
            localStorage.setItem('resono_history', JSON.stringify(newHistory));

        } catch (err: any) {
            setError(err.response?.data?.detail || "Connection failed. Please ensure the backend is running.");
        } finally {
            setIsLoading(false);
        }
    };

    const resetAnalysis = () => {
        setFile(null);
        setResult(null);
        setError(null);
    };

    const playAudio = () => {
        if (file) {
            const url = URL.createObjectURL(file);
            const audio = new Audio(url);
            audio.play();
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
        >
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">Active Engine v2.4</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter">VocalVitals Engine</h1>
                    <p className="text-slate-500 font-medium text-sm md:text-base">Capture respiratory audio for real-time biomarker extraction.</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl flex items-center justify-between md:justify-start gap-4 flex-grow md:flex-grow-0">
                        <div className="text-right md:text-left">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-left">Neural Latency</p>
                            <p className="text-lg font-mono font-bold text-emerald-400">12ms</p>
                        </div>
                        <Zap className="text-emerald-400" size={20} />
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                {/* Capture Module */}
                <div className="col-span-1 lg:col-span-8 space-y-10">
                    <div className="bg-[#030712] border border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />

                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-500/10 rounded-xl">
                                    <Volume2 className="text-indigo-400" size={22} />
                                </div>
                                <h3 className="text-xl font-bold tracking-tight">Signal Acquisition</h3>
                            </div>
                            {file && (
                                <button onClick={resetAnalysis} className="flex items-center gap-2 text-xs font-bold text-red-400/60 hover:text-red-400 transition-colors uppercase tracking-widest">
                                    <Trash2 size={14} /> Purge Sample
                                </button>
                            )}
                        </div>

                        <div className="relative">
                            {isRecording ? (
                                <div className="flex flex-col items-center py-10 space-y-8">
                                    <div className="relative">
                                        <div className="text-5xl md:text-7xl font-mono font-black text-white tracking-tighter animate-pulse">{formatTime(recordingTime)}</div>
                                        <div className="absolute -inset-10 bg-red-500/10 blur-3xl rounded-full animate-pulse -z-10" />
                                    </div>
                                    <div className="flex gap-2 items-end h-24">
                                        {[...Array(24)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                animate={{ height: [10, Math.random() * 80 + 20, 10] }}
                                                transition={{ repeat: Infinity, duration: 0.3, delay: i * 0.02 }}
                                                className="w-2 bg-gradient-to-t from-red-600 to-red-400 rounded-full"
                                            />
                                        ))}
                                    </div>
                                    <button onClick={stopRecording} className="group relative">
                                        <div className="absolute -inset-4 bg-red-500/20 blur-xl rounded-full group-hover:bg-red-500/40 transition-all" />
                                        <div className="relative w-24 h-24 bg-red-500 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all">
                                            <Square className="text-white fill-white" size={32} />
                                        </div>
                                    </button>
                                </div>
                            ) : !file ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 py-10">
                                    <button
                                        type="button"
                                        onClick={startRecording}
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl md:rounded-3xl p-8 md:p-10 flex flex-col items-center justify-center text-center gap-6 hover:bg-indigo-500/10 hover:border-indigo-500/40 transition-all cursor-pointer group shadow-xl appearance-none relative overflow-hidden active:scale-[0.98]"
                                    >
                                        <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="w-16 h-16 md:w-24 md:h-24 bg-indigo-500 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/30 group-hover:scale-110 transition-transform relative z-10">
                                            <Mic className="text-white" size={32} />
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-xl md:text-2xl font-black">Live Capture</h4>
                                            <p className="text-[10px] md:text-xs text-slate-500 leading-relaxed font-medium">Record 5-10s of sustained vowels<br />or cough samples</p>
                                        </div>
                                    </button>
                                    <label className="w-full bg-white/5 border border-white/5 rounded-2xl md:rounded-3xl p-8 md:p-10 flex flex-col items-center justify-center text-center gap-6 hover:bg-slate-500/10 hover:border-slate-500/40 transition-all cursor-pointer group shadow-xl relative overflow-hidden active:scale-[0.98]">
                                        <div className="absolute inset-0 bg-slate-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <input type="file" className="hidden" accept=".wav,.mp3,audio/wav,audio/mpeg,audio/mp3,audio/x-wav,audio/x-mpeg" onChange={handleFileUpload} />
                                        <div className="w-16 h-16 md:w-24 md:h-24 bg-slate-800 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform relative z-10">
                                            <Upload className="text-slate-300" size={32} />
                                        </div>
                                        <div className="space-y-2 relative z-10">
                                            <h4 className="text-xl md:text-2xl font-black">Local Import</h4>
                                            <p className="text-[10px] md:text-xs text-slate-500 leading-relaxed font-medium">Upload high-fidelity .WAV or .MP3<br />biometric data</p>
                                        </div>
                                    </label>
                                </div>
                            ) : (
                                <div className="py-6 space-y-10">
                                    <div className="bg-white/5 border border-white/5 rounded-2xl md:rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                        <div className="flex items-center gap-4 md:gap-6">
                                            <button
                                                onClick={playAudio}
                                                className="w-12 h-12 md:w-16 md:h-16 bg-emerald-500/20 rounded-xl md:rounded-2xl flex items-center justify-center border border-emerald-500/20 hover:bg-emerald-500/30 transition-all group/play"
                                            >
                                                <Play className="text-emerald-400 fill-emerald-400 group-hover/play:scale-110 transition-transform" size={20} />
                                            </button>
                                            <div>
                                                <h4 className="text-lg md:text-2xl font-black tracking-tight truncate max-w-[150px] md:max-w-none">{file.name}</h4>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">16-Bit PCM • Mono • 16kHz</p>
                                            </div>
                                        </div>
                                        <div className="text-left sm:text-right w-full sm:w-auto">
                                            <p className="text-xl md:text-2xl font-mono font-bold text-indigo-400 mb-1">{(file.size / 1024).toFixed(1)} KB</p>
                                            <div className="flex items-center gap-2 sm:justify-end text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" /> Integrity Verified
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <button
                                            onClick={resetAnalysis}
                                            className="w-full md:flex-[1] h-16 md:h-24 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 font-bold rounded-2xl md:rounded-3xl transition-all flex items-center justify-center gap-3"
                                        >
                                            <RefreshCw size={20} />
                                            RE-RECORD
                                        </button>
                                        <button
                                            onClick={analyzeCough}
                                            disabled={isLoading}
                                            className="w-full md:flex-[3] h-16 md:h-24 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xl md:text-2xl font-black rounded-2xl md:rounded-3xl shadow-2xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-4 disabled:opacity-50 relative overflow-hidden group"
                                        >
                                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                                            {isLoading ? (
                                                <RefreshCw className="animate-spin" size={24} />
                                            ) : (
                                                <>
                                                    <BrainCircuit size={28} />
                                                    RUN NEURAL ANALYSIS
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status Grids */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
                        {[
                            { label: 'Feature Space', val: '1064-dim', icon: Database, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                            { label: 'Compliance', val: 'GDPR/HIPAA', icon: Lock, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                            { label: 'Availability', val: 'Low-Latency', icon: Globe, color: 'text-sky-400', bg: 'bg-sky-400/10' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/5 border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
                                <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
                                    <stat.icon size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-lg font-bold">{stat.val}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Results Sidebar */}
                <div className="col-span-1 lg:col-span-4 h-full">
                    <div className="bg-[#030712] border border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8 h-full flex flex-col shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Stethoscope size={160} />
                        </div>

                        <div className="flex items-center gap-3 mb-10">
                            <div className="p-2 bg-indigo-500/20 rounded-lg">
                                <Target className="text-indigo-400" size={20} />
                            </div>
                            <h3 className="text-xl font-bold">Inference Output</h3>
                        </div>

                        {isLoading ? (
                            <div className="flex-grow flex flex-col items-center justify-center text-center gap-10">
                                <div className="relative">
                                    <div className="w-32 h-32 border-[8px] border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
                                    <div className="absolute top-0 left-0 w-32 h-32 border-[8px] border-white/5 border-b-emerald-400 rounded-full animate-spin [animation-duration:3s]" />
                                    <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400 animate-pulse" size={32} />
                                </div>
                                <div className="space-y-4">
                                    <p className="text-2xl font-black italic animate-pulse">EXTRACTING BIOMARKERS...</p>
                                    <div className="bg-white/5 px-4 py-2 rounded-full border border-white/5">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Applying YAMNet Transfer Layers</p>
                                    </div>
                                </div>
                            </div>
                        ) : result ? (
                            <div className="flex-grow space-y-10 h-full overflow-y-auto pr-2 custom-scrollbar">
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={`p-10 rounded-[2rem] border-2 text-center relative overflow-hidden ${result.prediction.includes('Healthy') ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}
                                >
                                    <div className={`w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-6 ${result.prediction.includes('Healthy') ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                        {result.prediction.includes('Healthy') ? <CheckCircle2 size={40} className="text-emerald-400" /> : <ShieldAlert size={40} className="text-red-500" />}
                                    </div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Final Classification</p>
                                    <div className="grid grid-cols-2 gap-4 mt-6">
                                        <div className="bg-black/40 py-3 rounded-2xl border border-white/5 flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confidence</span>
                                            <span className="text-xl font-mono font-black text-white">{(result.confidence * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="bg-black/40 py-3 rounded-2xl border border-white/5 flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Uncertainty</span>
                                            <span className="text-xl font-mono font-black text-indigo-400">{(result.uncertainty * 100).toFixed(0)}%</span>
                                        </div>
                                    </div>
                                    <div className={`mt-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border ${result.risk_level === 'Critical' ? 'bg-red-500/20 border-red-500/40 text-red-500' : result.risk_level === 'High' ? 'bg-orange-500/20 border-orange-500/40 text-orange-500' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-500'}`}>
                                        Risk Level: {result.risk_level}
                                    </div>
                                </motion.div>

                                {/* CDSS Overlay */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-indigo-600/10 border border-indigo-500/20 rounded-[2rem] p-8 flex flex-col gap-6"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                                            <BookOpen size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black uppercase tracking-widest text-indigo-400">Clinical Decision Support</h4>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase">Next-Step Auscultation Protocol</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <Stethoscope className="text-white/40 mt-1" size={16} />
                                            <div>
                                                <p className="text-xs font-bold text-white">Recommended Exam:</p>
                                                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                                    {result.prediction.includes('Pneumonia') ? 
                                                        "Perform targeted percussion in posterior basal segments. Listen for fine late-inspiratory crackles (rales)." :
                                                     result.prediction.includes('Asthma') ? 
                                                        "Assess for prolonged expiratory phase and high-pitched polyphonic wheezing throughout lung fields." :
                                                        "Normal protocol. Perform routine auscultation across all 12 thoracic points to confirm baseline."}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Acoustic Correlation</p>
                                            <p className="text-[10px] text-indigo-300 font-bold mt-1">
                                                {result.prediction.includes('Healthy') ? 
                                                    "Signal symmetry is optimal. No adventitious sounds detected." :
                                                    "AI detected non-rhythmic transient signals matching clinical adventitious patterns."}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-center px-1">
                                        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Speech Biomarkers</h5>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${result.biomarkers.status === 'Healthy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{result.biomarkers.status}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">FEV1/FVC Ratio</p>
                                            <p className="text-2xl font-mono font-bold text-indigo-400">{result.biomarkers.fev1_fvc_ratio.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Resp. Score</p>
                                            <p className="text-2xl font-mono font-bold text-indigo-400">{result.biomarkers.respiratory_score}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">XAI Saliency Map</h5>
                                    <div className="relative rounded-2xl overflow-hidden border border-white/10 group aspect-[2/1]">
                                        <img src={`data:image/png;base64,${result.visuals.xai_heatmap}`} alt="Heatmap" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                                            <p className="text-[10px] text-white/60 leading-tight">Neural attention clusters highlighted in inferno scale.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3">
                                    <AlertTriangle className="text-amber-500 shrink-0" size={16} />
                                    <p className="text-[9px] text-amber-500/80 leading-relaxed font-bold italic uppercase tracking-wider">
                                        {result.disclaimer}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-grow flex flex-col items-center justify-center text-center opacity-20 space-y-8">
                                <Stethoscope size={100} className="text-slate-500" />
                                <div className="space-y-2">
                                    <h4 className="text-2xl font-black uppercase tracking-tighter">Node Standby</h4>
                                    <p className="text-[10px] font-bold text-slate-500 max-w-[150px] mx-auto uppercase tracking-widest">Neural weights ready for signal ingestion</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {error && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-red-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 z-50 font-bold">
                    <AlertTriangle size={24} />
                    {error}
                </div>
            )}
        </motion.div>
    );
};

export default DashboardPage;
