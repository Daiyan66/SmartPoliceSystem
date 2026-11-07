import React, { useState } from 'react';
import api from '../services/api';
import { Sparkles, Shield, AlertTriangle, CheckCircle, FileText, Globe, Layers, ArrowRight } from 'lucide-react';

export default function ComplaintAiAnalyzer() {
  const [complaintText, setComplaintText] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const sampleTexts = [
    {
      title: "Hinglish Mobile Snatching",
      text: "Kal raat kareeb 10:30 baje Rajiv Chowk metro station ke pass do ladke bike par aaye aur mera Samsung Galaxy phone aur 4000 cash chhin kar bhaag gaye.",
      location: "Rajiv Chowk, New Delhi"
    },
    {
      title: "Hindi Cyber Fraud (OTP Scam)",
      text: "Mere bank account se 75,000 rupaye nikal gaye. Kisi ne phone karke bank manager banke baat ki aur mujhse OTP le liya.",
      location: "Pune, Maharashtra"
    },
    {
      title: "English Domestic Harassment",
      text: "My neighbor has been repeatedly stalking my daughter and making threatening remarks outside our apartment gate every evening.",
      location: "Koramangala, Bengaluru"
    }
  ];

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!complaintText.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await api.post('/ai/analyze-complaint', {
        complaintText: complaintText.trim(),
        incidentLocation: location.trim() || undefined
      });

      if (res.data && res.data.data) {
        setResult(res.data.data);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.response?.data?.message || err.message || 'AI Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const loadSample = (sample) => {
    setComplaintText(sample.text);
    setLocation(sample.location);
    setResult(null);
  };

  return (
    <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 p-6 shadow-xl space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>OpenRouter AI: Multilingual Legal Complaint Triage (BNS 2023)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Automated legal section mapping, severity classification, entity extraction &amp; English translation
          </p>
        </div>

        {/* Quick Sample Selector */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[11px] text-slate-400 self-center mr-1">Try samples:</span>
          {sampleTexts.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadSample(s)}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-700/60 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-600/60 transition"
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleAnalyze} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Incident Description (Accepts English, Hindi, Hinglish, Marathi, Tamil, etc.)
          </label>
          <textarea
            rows="3"
            required
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
            placeholder="Describe what occurred, who was involved, time, and lost property..."
            className="w-full p-3.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Incident Location / Landmark (optional)"
              className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !complaintText.trim()}
            className="py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 shadow-lg hover:shadow-amber-500/20 transition disabled:opacity-40 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                <span>Classifying with OpenRouter...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze with AI</span>
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-700/60 text-red-200 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* AI Results Output Card */}
      {result && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/40 shadow-2xl space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase text-slate-400">Classified Offense:</span>
              <span className="text-base font-extrabold text-amber-300">{result.primaryCategory}</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Priority: {result.suggestedPriority}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Severity: {result.severityScore}/5
              </span>
              {result.detectedLanguage && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  <Globe className="w-3 h-3 inline mr-1" />
                  {result.detectedLanguage}
                </span>
              )}
            </div>
          </div>

          {/* Recommended Legal Sections */}
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Recommended BNS (2023) Legal Sections:
            </span>
            <div className="flex flex-wrap gap-2">
              {result.bnsSections && result.bnsSections.length > 0 ? (
                result.bnsSections.map((sec, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-200 border border-amber-500/40 text-xs font-mono font-bold"
                  >
                    {sec}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">General Inquiry (No specific penal section)</span>
              )}
              {result.isCognizable && (
                <span className="px-3 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-semibold">
                  Cognizable Offense (Police can investigate without warrant)
                </span>
              )}
            </div>
          </div>

          {/* Translated English Summary */}
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Standardized English FIR Summary:
            </span>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
              {result.translatedEnglishSummary}
            </div>
          </div>

          {/* Extracted Incident Entities */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Location</span>
              <span className="text-slate-300 font-medium">{result.location || 'Reported Location'}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Suspect Info</span>
              <span className="text-slate-300 font-medium">{result.suspectDescription || 'Unidentified'}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Stolen Property</span>
              <span className="text-slate-300 font-medium">{result.stolenProperty || 'None'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
