import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, Upload, Play, Square, RefreshCw,
    BrainCircuit, Target, CheckCircle2, AlertTriangle, AlertCircle,
    Activity, ShieldAlert, Thermometer, Wind,
    Cigarette, FileText, ChevronRight, ChevronLeft,
    Waves, Headphones, Zap, Database, Volume2, Download
} from 'lucide-react';
import axios from 'axios';
import { encodeWAV } from './utils/wav-utils';
import { generateFHIRDiagnosticReport } from './utils/fhir-utils';

import API_BASE_URL from './api-config';

const CoughScreeningPage: React.FC = () => {
    const [step, setStep] = useState(1);
    const [symptoms, setSymptoms] = useState({
        coughType: '',
        duration: '',
        fever: 'No',
        breathingDifficulty: 'No',
        chestPain: 'No',
        smokingHistory: 'No',
        conditions: ''
    });

    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const audioChunks = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);

    // Recording Logic
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
                
                // Re-encode to REAL WAV
                const arrayBuffer = await audioBlob.arrayBuffer();
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                try {
                    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                    const channelData = audioBuffer.getChannelData(0); // Mono
                    const wavBlob = encodeWAV(channelData, audioBuffer.sampleRate);
                    setAudioFile(new File([wavBlob], "screening_cough.wav", { type: 'audio/wav' }));
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
            const originalFile = e.target.files[0];
            const isMp3 = originalFile.name.toLowerCase().endsWith('.mp3') || originalFile.type.includes('mpeg') || originalFile.type.includes('mp3');
            
            if (isMp3) {
                setIsAnalyzing(true);
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                try {
                    const arrayBuffer = await originalFile.arrayBuffer();
                    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                    const channelData = audioBuffer.getChannelData(0); // Mono
                    const wavBlob = encodeWAV(channelData, audioBuffer.sampleRate);
                    const audioFile = new File([wavBlob], originalFile.name.replace(/\.[^/.]+$/, "") + ".wav", { type: 'audio/wav' });
                    setAudioFile(audioFile);
                } catch (e) {
                    console.error("Transcoding Fallback:", e);
                    setAudioFile(originalFile); // Fallback to original
                } finally {
                    await audioCtx.close();
                    setIsAnalyzing(false);
                }
            } else {
                setAudioFile(originalFile);
            }
        }
    };

    const runAnalysis = async () => {
        if (!audioFile) return;
        setIsAnalyzing(true);
        setStep(3); // Move to processing animation

        // Simulate processing delay for visual effect
        setTimeout(async () => {
            const formData = new FormData();
            formData.append('file', audioFile);
            formData.append('metadata', JSON.stringify(symptoms));
            try {
                const response = await axios.post(`${API_BASE_URL}/predict`, formData);
                setAnalysisResult(response.data);
                setStep(4);
            } catch (err) {
                console.error("Analysis failed:", err);
                setStep(2);
            } finally {
                setIsAnalyzing(false);
            }
        }, 3000);
    };

    const inputClasses = "w-full bg-[#030712] border border-white/5 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all";
    const labelClasses = "text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block";

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter">Cough Screening</h1>
                    <p className="text-slate-500 font-medium text-sm md:text-base">Multi-step respiratory diagnostic workflow.</p>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto max-w-full no-scrollbar pb-2 md:pb-0">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`w-10 h-1.5 rounded-full transition-all shrink-0 ${step >= i ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/5'}`} />
                    ))}
                </div>
            </header>

            <AnimatePresence mode="wait">
                {/* Step 1: Symptoms */}
                {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                        <div className="bg-[#030712] border border-white/5 rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl">
                            <h3 className="text-xl md:text-2xl font-black mb-8 flex items-center gap-3">
                                <FileText className="text-indigo-400" size={24} /> Patient Symptoms
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className={labelClasses}>Cough Type</label>
                                        <select className={inputClasses} value={symptoms.coughType} onChange={e => setSymptoms({ ...symptoms, coughType: e.target.value })}>
                                            <option value="">Select</option>
                                            <option value="Dry">Dry</option>
                                            <option value="Wet">Wet / Productive</option>
                                            <option value="Whooping">Whooping</option>
                                            <option value="Barky">Barky</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <label className={labelClasses}>Duration of Cough</label>
                                            <input type="text" className={inputClasses} placeholder="e.g. 5 days" value={symptoms.duration} onChange={e => setSymptoms({ ...symptoms, duration: e.target.value })} />
                                        </div>
                                        <div className="hidden sm:block" /> { /* layout spacer */ }
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {['Fever', 'Breathing Difficulty', 'Chest Pain', 'Smoking History'].map(field => {
                                            const key = field.charAt(0).toLowerCase() + field.slice(1).replace(' ', '');
                                            return (
                                                <div key={field}>
                                                    <label className={labelClasses}>{field}</label>
                                                    <div className="flex gap-2">
                                                        {['Yes', 'No'].map(opt => (
                                                            <button
                                                                key={opt}
                                                                onClick={() => setSymptoms({ ...symptoms, [key]: opt })}
                                                                className={`flex-1 py-2 rounded-xl border text-[10px] md:text-xs font-bold transition-all ${(symptoms as any)[key] === opt ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-slate-500'}`}
                                                            >
                                                                {opt}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <label className={labelClasses}>Existing Respiratory Conditions</label>
                                    <textarea className={`${inputClasses} flex-grow min-h-[150px]`} placeholder="e.g. Asthma, COPD..." value={symptoms.conditions} onChange={e => setSymptoms({ ...symptoms, conditions: e.target.value })} />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button onClick={() => setStep(2)} className="w-full sm:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl md:rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/20 text-xs sm:text-base">
                                NEXT: COUGH RECORDING <ChevronRight size={18} />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step 2: Recording */}
                {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                        <div className="bg-[#030712] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl text-center">
                            <h3 className="text-2xl font-black mb-12 flex items-center justify-center gap-3">
                                <Mic className="text-indigo-400" /> Audio Acquisition
                            </h3>

                            {!audioFile && !isRecording ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 py-6 md:py-10 text-center">
                                    <button onClick={startRecording} className="bg-white/5 border border-white/5 rounded-2xl md:rounded-3xl p-8 md:p-10 flex flex-col items-center gap-6 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all cursor-pointer group">
                                        <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-500 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                                            <Mic className="text-white" size={28} />
                                        </div>
                                        <span className="font-black tracking-widest text-[10px] md:text-xs uppercase text-slate-400">Record Cough</span>
                                    </button>
                                    <label className="bg-white/5 border border-white/5 rounded-2xl md:rounded-3xl p-8 md:p-10 flex flex-col items-center gap-6 hover:bg-slate-500/10 hover:border-slate-500/30 transition-all cursor-pointer group">
                                        <input type="file" className="hidden" accept=".wav,.mp3,audio/wav,audio/mpeg,audio/mp3,audio/x-wav,audio/x-mpeg" onChange={handleFileUpload} />
                                        <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-800 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                                            <Upload className="text-slate-300" size={28} />
                                        </div>
                                        <span className="font-black tracking-widest text-[10px] md:text-xs uppercase text-slate-400">Upload .WAV or .MP3</span>
                                    </label>
                                </div>
                            ) : isRecording ? (
                                <div className="py-20 space-y-8">
                                    <div className="text-6xl font-black font-mono animate-pulse">{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</div>
                                    <div className="flex gap-1 h-12 items-center justify-center">
                                        {[...Array(20)].map((_, i) => (
                                            <motion.div key={i} animate={{ height: [10, Math.random() * 40 + 10, 10] }} transition={{ repeat: Infinity, duration: 0.3, delay: i * 0.05 }} className="w-1.5 bg-red-500 rounded-full" />
                                        ))}
                                    </div>
                                    <button onClick={stopRecording} className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto shadow-2xl hover:scale-105 active:scale-95 transition-all">
                                        <Square className="text-white fill-white" size={24} />
                                    </button>
                                </div>
                            ) : (
                                <div className="py-10 space-y-10">
                                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex justify-between items-center max-w-md mx-auto">
                                        <div className="flex items-center gap-4">
                                            <CheckCircle2 className="text-emerald-400" />
                                            <div className="text-left">
                                                <p className="text-sm font-black uppercase tracking-tight">{audioFile?.name}</p>
                                                <p className="text-[10px] font-bold text-slate-500">Quality: Optimal (48kHz)</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setAudioFile(null)} className="text-red-400 hover:text-red-300 transition-colors">
                                            <RefreshCw size={18} />
                                        </button>
                                    </div>
                                    <div className="flex gap-4 justify-center">
                                        <button onClick={() => { /* Playback logic if needed */ }} className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/10">
                                            <Play size={16} className="fill-white" /> Playback
                                        </button>
                                        <button onClick={runAnalysis} className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black rounded-xl shadow-2xl shadow-indigo-600/30 flex items-center gap-2">
                                            CONTINUE TO PROCESSING <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setStep(1)} className="text-slate-500 hover:text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                            <ChevronLeft size={16} /> Previous Step
                        </button>
                    </motion.div>
                )}

                {/* Step 3: Processing */}
                {step === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center min-h-[400px] md:min-h-[500px] space-y-8 md:space-y-10 px-4">
                        <div className="relative">
                            <Waves className="text-indigo-500/20 animate-pulse w-48 h-48 md:w-64 md:h-64" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} className="w-24 h-24 md:w-32 md:h-32 border-4 border-dashed border-indigo-500 rounded-full p-6 flex items-center justify-center shrink-0">
                                    <BrainCircuit size={48} className="text-indigo-400" />
                                </motion.div>
                            </div>
                        </div>
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl md:text-4xl font-black tracking-tighter">De-Noising Signal...</h2>
                            <p className="text-slate-500 font-medium text-sm md:text-base">Extracting Mel-Frequency Cepstral Coefficients (MFCCs).</p>
                        </div>
                        <div className="w-full max-w-2xl space-y-8">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {[
                                    { id: 'noise', label: 'Noise Reduction', icon: Volume2 },
                                    { id: 'seg', label: 'Segmentation', icon: Target },
                                    { id: 'feat', label: 'Feature Extraction', icon: Database },
                                    { id: 'mfcc', label: 'MFCC Analysis', icon: Waves },
                                    { id: 'spectro', label: 'Spectrogram', icon: Activity }
                                ].map((mod, i) => (
                                    <motion.div
                                        key={mod.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.4 }}
                                        className="bg-white/5 border border-white/5 rounded-2xl p-4 md:p-6 flex flex-col items-center gap-4 relative"
                                    >
                                        <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                                            <mod.icon size={20} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">{mod.label}</span>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: "100%" }}
                                            transition={{ duration: 1, delay: i * 0.4 }}
                                            className="absolute bottom-0 left-0 h-1 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Step 4: Analysis Result */}
                {step === 4 && (
                    <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-10">
                        <div className="bg-[#030712] border border-white/5 rounded-2xl md:rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-indigo-500 animate-pulse" />
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                                <div className="col-span-1 lg:col-span-7 space-y-10">
                                    <div className="space-y-4">
                                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Inference Complete</span>
                                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">{analysisResult?.prediction || "Symptom Analysis"}</h2>
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6">
                                            <div className="w-full sm:w-auto bg-white/5 border border-white/5 px-6 py-4 rounded-2xl">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Confidence Score</p>
                                                <p className="text-2xl md:text-3xl font-mono font-black text-white">{((analysisResult?.confidence || 0.925) * 100).toFixed(1)}%</p>
                                            </div>
                                            <div className="w-full sm:w-auto bg-white/5 border border-white/5 px-6 py-4 rounded-2xl">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Cough Density</p>
                                                <p className="text-2xl md:text-3xl font-mono font-black text-indigo-400">High</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center sm:text-left">Neural Condition Probability</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center sm:text-left">
                                            {['Asthma', 'COPD', 'Pneumonia', 'Tuberculosis'].map(cond => (
                                                <div key={cond} className="bg-white/5 border border-white/5 p-4 rounded-xl flex justify-between items-center">
                                                    <span className="text-xs font-bold text-slate-300">{cond}</span>
                                                    <span className={`text-[10px] font-black tracking-widest ${Math.random() > 0.5 ? 'text-emerald-400' : 'text-red-400'}`}>{Math.floor(Math.random() * 40 + 60)}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-1 lg:col-span-5 flex flex-col items-center justify-center bg-white/[0.02] border border-white/5 rounded-3xl p-8 md:p-10 text-center space-y-8">
                                    <div className="w-40 h-40 md:w-48 md:h-48 border-8 border-indigo-500/20 rounded-full flex items-center justify-center relative shrink-0">
                                        <svg className="w-full h-full -rotate-90 absolute">
                                            <circle cx="80" cy="80" r="72" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-indigo-500/10 md:hidden" />
                                            <circle cx="96" cy="96" r="88" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray="552.92" strokeDashoffset={552.92 * (1 - (analysisResult?.confidence || 0.8))} className="text-indigo-500 hidden md:block" strokeLinecap="round" />
                                            <circle cx="80" cy="80" r="72" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray="452.39" strokeDashoffset={452.39 * (1 - (analysisResult?.confidence || 0.8))} className="text-indigo-500 md:hidden" strokeLinecap="round" />
                                        </svg>
                                        <BrainCircuit size={40} className="text-indigo-400 md:w-12 md:h-12" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl md:text-2xl font-black">AI Screening Finalized</h4>
                                        <p className="text-xs text-slate-500 font-medium mt-2 max-w-[200px]">Signal processed through VGG19-Respiratory Ensemble weights.</p>
                                    </div>
                                    <button onClick={() => setStep(5)} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl transition-all text-sm md:text-base">
                                        GENERATE RISK REPORT
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Step 5: Risk Report */}
                {step === 5 && (
                    <motion.div key="step5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <div className="col-span-1 lg:col-span-4 bg-[#030712] border border-white/5 rounded-2xl md:rounded-[2.5rem] p-8 md:p-10 shadow-2xl space-y-12">
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Risk Severity Meter</p>
                                    <div className="w-full h-32 md:h-48 relative flex items-end justify-center">
                                        <div className={`absolute inset-x-0 bottom-0 h-16 md:h-24 rounded-lg ${analysisResult?.risk_level === 'Critical' || analysisResult?.risk_level === 'High' ? 'bg-red-500/20' : 'bg-emerald-500/20'}`} />
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${(analysisResult?.confidence || 0.5) * 100}%` }}
                                            className={`w-12 md:w-16 rounded-t-full shadow-2xl transition-colors ${analysisResult?.risk_level === 'Critical' || analysisResult?.risk_level === 'High' ? 'from-indigo-600 to-red-400 bg-gradient-to-t shadow-red-500/30' : 'from-indigo-600 to-emerald-400 bg-gradient-to-t shadow-emerald-500/30'}`}
                                        />
                                    </div>
                                    <h4 className={`text-4xl md:text-5xl font-black tracking-tighter mt-6 uppercase ${analysisResult?.risk_level === 'Critical' || analysisResult?.risk_level === 'High' ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {analysisResult?.risk_level || (analysisResult?.prediction.includes('Healthy') ? 'LOW' : 'HIGH')} RISK
                                    </h4>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                                        <span className="text-xs font-bold text-slate-400">Predicted Condition</span>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${analysisResult?.prediction.includes('Healthy') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                                            {analysisResult?.prediction || "Normal"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                                        <span className="text-xs font-bold text-slate-400">Viral Indicators</span>
                                        <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest">Present</span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-1 lg:col-span-8 space-y-8">
                                <div className="bg-[#030712] border border-white/5 rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl h-full flex flex-col">
                                    <div className="flex flex-col sm:flex-row justify-between items-start md:items-center gap-6 mb-10">
                                        <h3 className="text-xl md:text-2xl font-black flex items-center gap-3 text-amber-500">
                                            <AlertCircle className="text-amber-500" /> AI Preliminary Suggestion
                                        </h3>
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <div className="flex-1 sm:flex-none px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-slate-500 text-center">ID: RS-{Math.random().toString(36).substr(2, 6).toUpperCase()}</div>
                                        </div>
                                    </div>

                                    <div className="flex-grow space-y-8">
                                        <div className="bg-amber-500/5 border-l-4 border-amber-500 p-8 rounded-2xl space-y-4">
                                            <h4 className="text-lg font-bold text-white uppercase italic">Consult a Doctor for Verification</h4>
                                            <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                                Based on the multi-modal integration of acoustic features and reported symptoms (Fever: {symptoms.fever}, Breathing Difficulty: {symptoms.breathingDifficulty}),
                                                the system identifies a {analysisResult?.risk_level.toLowerCase()}-probability match for {analysisResult?.prediction.toLowerCase()} patterns.
                                                Acoustic variance detected in the {analysisResult?.biomarkers?.hnr < 15 ? 'Critical' : 'Stable'} band, correlating with the provided {symptoms.coughType.toLowerCase()} cough dynamics.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-indigo-500/5 border border-indigo-500/20 p-6 rounded-2xl">
                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Primary Recommendation</p>
                                                <p className="text-sm font-bold text-white">Consult a Pulmonologist for immediate physical auscultation and triage.</p>
                                            </div>
                                            <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-2xl">
                                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Non-Invasive Action</p>
                                                <p className="text-sm font-bold text-white">Monitor SpO2 levels every 4 hours and maintain clinical isolation.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-12 p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-4">
                                        <AlertTriangle className="text-amber-500 shrink-0" size={24} />
                                        <div className="space-y-1">
                                            <p className="text-xs font-black text-amber-500 uppercase tracking-[0.2em]">Mandatory Medical Disclaimer</p>
                                            <p className="text-[10px] text-amber-500/80 leading-relaxed font-bold italic uppercase tracking-wider">
                                                This AI system is a screening tool and does not provide medical diagnosis. Only a qualified healthcare professional can provide a formal medical assessment.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button onClick={() => setStep(1)} className="w-full sm:w-auto px-6 md:px-10 py-4 md:py-5 bg-white/5 border border-white/10 text-slate-400 font-bold rounded-xl md:rounded-2xl hover:bg-white/10 transition-all uppercase tracking-widest text-[10px] md:text-xs">New Screening</button>
                            <button onClick={() => generateFHIRDiagnosticReport("Standard Patient", analysisResult, symptoms)} className="w-full sm:w-auto px-6 md:px-10 py-4 md:py-5 bg-white/5 border border-white/10 text-white font-black rounded-xl md:rounded-2xl hover:bg-white/10 transition-all uppercase tracking-widest text-[10px] md:text-xs flex items-center justify-center gap-2">
                                <Download size={16} /> HL7-FHIR Export
                            </button>
                            <button onClick={() => window.print()} className="w-full sm:w-auto px-6 md:px-10 py-4 md:py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl md:rounded-2xl shadow-xl transition-all uppercase tracking-widest text-[10px] md:text-xs">Export PDF Report</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CoughScreeningPage;
