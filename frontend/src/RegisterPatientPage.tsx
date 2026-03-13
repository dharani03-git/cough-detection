import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Phone, Mail, MapPin, Cigarette, FileText,
    Thermometer, Wind, Upload, CheckCircle2, X
} from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from './api-config';

const RegisterPatientPage: React.FC = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        age: '',
        gender: '',
        phoneNumber: '',
        email: '',
        address: '',
        smokingHistory: 'No',
        existingConditions: '',
        symptoms: [] as string[],
        coughType: '',
        symptomDuration: '',
        fever: 'No',
        breathingDifficulty: 'No'
    });

    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSymptomToggle = (symptom: string) => {
        setFormData(prev => ({
            ...prev,
            symptoms: prev.symptoms.includes(symptom)
                ? prev.symptoms.filter(s => s !== symptom)
                : [...prev.symptoms, symptom]
        }));
    };

    const clearForm = () => {
        setFormData({
            fullName: '',
            age: '',
            gender: '',
            phoneNumber: '',
            email: '',
            address: '',
            smokingHistory: 'No',
            existingConditions: '',
            symptoms: [],
            coughType: '',
            symptomDuration: '',
            fever: 'No',
            breathingDifficulty: 'No'
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const API_BASE_URL = `http://${window.location.hostname}:8888`;
            await axios.post(`${API_BASE_URL}/api/patients`, formData);
            setIsSubmitted(true);
            setTimeout(() => setIsSubmitted(false), 5000);
            clearForm();
        } catch (error) {
            console.error("Error registering patient:", error);
            alert("Failed to register patient. Please check the console.");
        }
    };

    const inputClasses = "w-full bg-[#030712] border border-white/5 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-600";
    const labelClasses = "text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block";
    const cardClasses = "bg-[#030712] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden h-full";

    const symptomsList = ['Dry Cough', 'Productive Cough', 'Sore Throat', 'Fatigue', 'Chest Pain', 'Headache'];

    return (
        <div className="space-y-12">
            <header>
                <h1 className="text-5xl font-black tracking-tighter">Register Patient</h1>
                <p className="text-slate-500 font-medium">Create a new electronic health record for a patient intake.</p>
            </header>

            <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-8">
                {/* Patient Information */}
                <div className="col-span-12 lg:col-span-8">
                    <div className={cardClasses}>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <User className="text-indigo-400" size={20} />
                            </div>
                            <h3 className="text-xl font-bold">Patient Information</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2 md:col-span-1">
                                <label className={labelClasses}>Full Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    className={inputClasses}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div className="col-span-2 md:col-span-1 grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClasses}>Age</label>
                                    <input
                                        type="number"
                                        name="age"
                                        value={formData.age}
                                        onChange={handleInputChange}
                                        className={inputClasses}
                                        placeholder="25"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className={labelClasses}>Gender</label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleInputChange}
                                        className={inputClasses}
                                        required
                                    >
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="col-span-2 md:col-span-1">
                                <label className={labelClasses}>Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleInputChange}
                                        className={`${inputClasses} pl-12`}
                                        placeholder="+1 (555) 000-0000"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className={labelClasses}>Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className={`${inputClasses} pl-12`}
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className={labelClasses}>Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-3 text-slate-500" size={16} />
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        className={`${inputClasses} pl-12 h-24`}
                                        placeholder="123 Medical St, Health City"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Respiratory & Medical Sidecard */}
                <div className="col-span-12 lg:col-span-4 space-y-8">
                    <div className={cardClasses}>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <Thermometer className="text-indigo-400" size={20} />
                            </div>
                            <h3 className="text-xl font-bold">Respiratory Details</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className={labelClasses}>Current Cough Type</label>
                                <select
                                    name="coughType"
                                    value={formData.coughType}
                                    onChange={handleInputChange}
                                    className={inputClasses}
                                >
                                    <option value="">Select Type</option>
                                    <option value="Dry">Dry</option>
                                    <option value="Wet">Wet / Productive</option>
                                    <option value="Whooping">Whooping</option>
                                    <option value="Barky">Barky</option>
                                </select>
                            </div>

                            <div>
                                <label className={labelClasses}>Duration of Symptoms</label>
                                <input
                                    type="text"
                                    name="symptomDuration"
                                    value={formData.symptomDuration}
                                    onChange={handleInputChange}
                                    className={inputClasses}
                                    placeholder="e.g. 3 days"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClasses}>Fever</label>
                                    <div className="flex gap-2">
                                        {['Yes', 'No'].map(opt => (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, fever: opt }))}
                                                className={`flex-1 py-2 rounded-xl border transition-all text-sm font-bold ${formData.fever === opt ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-500'}`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClasses}>Difficulty Breathing</label>
                                    <div className="flex gap-2">
                                        {['Yes', 'No'].map(opt => (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, breathingDifficulty: opt }))}
                                                className={`flex-1 py-2 rounded-xl border transition-all text-sm font-bold ${formData.breathingDifficulty === opt ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-500'}`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Medical Details */}
                <div className="col-span-12 lg:col-span-8">
                    <div className={cardClasses}>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <FileText className="text-indigo-400" size={20} />
                            </div>
                            <h3 className="text-xl font-bold">Medical Details</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="col-span-2 md:col-span-1">
                                <label className={labelClasses}>Smoking History</label>
                                <div className="flex gap-4">
                                    {['Yes', 'No'].map(opt => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, smokingHistory: opt }))}
                                            className={`flex-1 py-3 rounded-2xl border transition-all flex items-center justify-center gap-3 font-bold ${formData.smokingHistory === opt ? 'bg-indigo-500 border-indigo-500 text-white shadow-xl' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'}`}
                                        >
                                            <Cigarette size={18} />
                                            {opt === 'Yes' ? 'Active Smoker' : 'Non-Smoker'}
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-8">
                                    <label className={labelClasses}>Symptoms (Multi-select)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {symptomsList.map(symptom => (
                                            <button
                                                key={symptom}
                                                type="button"
                                                onClick={() => handleSymptomToggle(symptom)}
                                                className={`px-4 py-2 rounded-full border text-xs font-bold transition-all ${formData.symptoms.includes(symptom) ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'}`}
                                            >
                                                {symptom}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-2 md:col-span-1">
                                <label className={labelClasses}>Existing Conditions</label>
                                <textarea
                                    name="existingConditions"
                                    value={formData.existingConditions}
                                    onChange={handleInputChange}
                                    className={`${inputClasses} h-full min-h-[160px]`}
                                    placeholder="e.g. Asthma, Hypertension, Diabetes..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Uploads */}
                <div className="col-span-12 lg:col-span-4">
                    <div className={cardClasses}>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <Upload className="text-indigo-400" size={20} />
                            </div>
                            <h3 className="text-xl font-bold">Documentation</h3>
                        </div>

                        <div className="space-y-4">
                            <label className="w-full h-32 bg-white/5 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-indigo-500/5 hover:border-indigo-500/30 transition-all cursor-pointer group">
                                <Upload className="text-slate-500 group-hover:text-indigo-400 transition-colors" size={24} />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Upload Patient ID</span>
                                <input type="file" className="hidden" />
                            </label>
                            <label className="w-full h-32 bg-white/5 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-indigo-500/5 hover:border-indigo-500/30 transition-all cursor-pointer group">
                                <FileText className="text-slate-500 group-hover:text-indigo-400 transition-colors" size={24} />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Upload Medical Reports</span>
                                <input type="file" className="hidden" />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Submission Bar */}
                <div className="col-span-12">
                    <div className="flex items-center justify-between bg-indigo-500/5 border border-indigo-500/20 p-6 rounded-[2rem] backdrop-blur-3xl shadow-2xl">
                        <div className="flex items-center gap-4 text-indigo-400">
                            <CheckCircle2 size={24} />
                            <p className="text-sm font-bold italic tracking-tight">Ensure all critical health indicators are documented before submission.</p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={clearForm}
                                className="px-8 py-4 bg-white/5 border border-white/10 text-slate-400 font-bold rounded-2xl hover:bg-white/10 transition-all"
                            >
                                CLEAR FORM
                            </button>
                            <button
                                type="submit"
                                className="px-12 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black rounded-2xl shadow-2xl shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 transition-all"
                            >
                                REGISTER PATIENT
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            <AnimatePresence>
                {isSubmitted && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 100 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 100 }}
                        className="fixed bottom-12 right-12 z-50"
                    >
                        <div className="bg-emerald-500 text-white flex items-center gap-4 px-8 py-5 rounded-3xl shadow-[0_20px_60px_-15px_rgba(16,185,129,0.5)]">
                            <CheckCircle2 size={32} />
                            <div>
                                <h4 className="font-extrabold text-lg leading-tight">Patient Registered Successfully</h4>
                                <p className="text-xs text-white/80 font-bold uppercase tracking-widest mt-1">H record ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                            </div>
                            <button onClick={() => setIsSubmitted(false)} className="ml-4 opacity-50 hover:opacity-100 transition-opacity">
                                <X size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RegisterPatientPage;
