import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  FileText, MapPin, Compass, ShieldAlert, CheckCircle, 
  AlertTriangle, Sparkles, Send, Clock, User 
} from 'lucide-react';

export default function ComplaintRegistrationWidget({ onComplaintCreated }) {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);

  const [form, setForm] = useState({
    description: '',
    incidentLocation: '',
    latitude: 28.6315,
    longitude: 77.2167,
    incidentTimestamp: new Date().toISOString().slice(0, 16),
    stationId: '',
    isZeroFir: false,
    citizenName: '',
    citizenPhone: '',
    bnsSections: '',
    aiPredictedCategory: '',
    aiConfidenceScore: 0.85
  });

  const [submissionResult, setSubmissionResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const res = await api.get('/public/stations');
      if (res.data?.data) {
        setStations(res.data.data);
        if (res.data.data.length > 0 && !form.stationId) {
          setForm(prev => ({ ...prev, stationId: res.data.data[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load police stations:', err);
    }
  };

  const handleGpsDetect = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(prev => ({
          ...prev,
          latitude: parseFloat(pos.coords.latitude.toFixed(6)),
          longitude: parseFloat(pos.coords.longitude.toFixed(6)),
        }));
        setDetectingGps(false);
      },
      (err) => {
        console.warn('Geolocation lookup failed:', err);
        setDetectingGps(false);
        alert('Could not detect exact GPS coordinates. Using current input.');
      },
      { timeout: 8000 }
    );
  };

  const handleAiAnalyze = async () => {
    if (!form.description || form.description.trim().length < 15) {
      alert('Please enter at least a brief incident description before running AI analysis.');
      return;
    }
    setAiAnalyzing(true);
    try {
      const res = await api.post('/ai/analyze-complaint', {
        narrativeText: form.description,
        incidentLocation: form.incidentLocation || 'Incident Location'
      });
      if (res.data?.data) {
        const data = res.data.data;
        setAiSuggestions(data);
        const sectionsStr = (data.applicableSections || []).map(s => s.sectionCode).join(', ');
        setForm(prev => ({
          ...prev,
          bnsSections: sectionsStr || data.primaryCategory,
          aiPredictedCategory: data.primaryCategory,
          aiConfidenceScore: 0.95
        }));
      }
    } catch (err) {
      console.warn('AI analysis failed:', err);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSubmissionResult(null);

    try {
      const payload = {
        ...form,
        stationId: form.stationId ? Number(form.stationId) : null,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        incidentTimestamp: form.incidentTimestamp ? `${form.incidentTimestamp}:00` : null
      };

      const res = await api.post('/complaints', payload);
      if (res.data?.data) {
        setSubmissionResult(res.data.data);
        if (onComplaintCreated) onComplaintCreated(res.data.data);
      }
    } catch (err) {
      console.error('Complaint submission failed:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to file complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-amber-200/80 shadow-md p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-500" />
            Citizen e-FIR & Zero-FIR Filing Wizard
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Registered under Bharatiya Nagarik Suraksha Sanhita (BNSS 2023) • Auto-Generates Secure Tracking Token
          </p>
        </div>
        <span className="badge badge-warning text-xs font-semibold py-3 px-3 self-start">
          BNSS Section 173 Compliant
        </span>
      </div>

      {submissionResult ? (
        <div className="bg-amber-50/70 border-2 border-amber-400 rounded-xl p-6 text-center space-y-4">
          <div className="inline-flex p-3 bg-emerald-100 text-emerald-700 rounded-full">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            {submissionResult.isZeroFir ? 'Zero-FIR Filed Successfully!' : 'e-Complaint Registered Successfully!'}
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Your complaint has been submitted to the Station House Officer (SHO) desk. Please preserve your secure tracking token for status updates.
          </p>

          <div className="bg-white p-4 rounded-xl border border-amber-300 max-w-md mx-auto shadow-sm">
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">CCTNS Tracking Token</div>
            <div className="text-2xl font-mono font-extrabold text-amber-600 tracking-wide mt-1">
              {submissionResult.trackingToken}
            </div>
            <div className="mt-2 text-xs text-slate-600 flex justify-between border-t border-slate-100 pt-2">
              <span>Jurisdiction: <strong>{submissionResult.stationName}</strong></span>
              <span>Status: <strong className="text-emerald-700">{submissionResult.status}</strong></span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                setSubmissionResult(null);
                setAiSuggestions(null);
              }}
              className="btn btn-warning btn-sm font-semibold shadow-sm"
            >
              File Another Complaint
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Complainant Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Complainant Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={form.citizenName}
                  onChange={(e) => setForm({ ...form, citizenName: e.target.value })}
                  className="input input-bordered w-full text-sm bg-slate-50/70 border-slate-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Mobile Number (for OTP tracking)
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={form.citizenPhone}
                onChange={(e) => setForm({ ...form, citizenPhone: e.target.value })}
                className="input input-bordered w-full text-sm bg-slate-50/70 border-slate-300"
              />
            </div>
          </div>

          {/* Incident Description with AI Trigger */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Detailed Incident Narrative <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAiAnalyze}
                disabled={aiAnalyzing}
                className="btn btn-xs btn-outline btn-warning gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {aiAnalyzing ? 'Analyzing BNS...' : 'AI Legal Section Triage'}
              </button>
            </div>
            <textarea
              required
              rows={4}
              placeholder="Describe what occurred, time, perpetrator details, vehicle numbers, or stolen items (Supports English, Hindi, Hinglish)..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="textarea textarea-bordered w-full text-sm bg-slate-50/70 border-slate-300 focus:border-amber-400"
            />
          </div>

          {/* AI Suggestions Preview Banner */}
          {aiSuggestions && (
            <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-300 text-xs text-slate-800 space-y-1.5">
              <div className="flex items-center justify-between font-bold text-amber-900">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  AI Suggested Legal Mapping (BNS 2023):
                </span>
                <span className="badge badge-warning text-[10px]">
                  Priority: {aiSuggestions.suggestedPriority || 'HIGH'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(aiSuggestions.applicableSections || []).map((sec, i) => (
                  <span key={i} className="px-2 py-0.5 bg-white border border-amber-300 rounded font-mono font-medium text-amber-800">
                    {sec.sectionCode}: {sec.offenceName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Location & GPS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Incident Location Landmark <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Connaught Place Metro Gate 4, New Delhi"
                value={form.incidentLocation}
                onChange={(e) => setForm({ ...form, incidentLocation: e.target.value })}
                className="input input-bordered w-full text-sm bg-slate-50/70 border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Incident Timestamp <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="datetime-local"
                value={form.incidentTimestamp}
                onChange={(e) => setForm({ ...form, incidentTimestamp: e.target.value })}
                className="input input-bordered w-full text-sm bg-slate-50/70 border-slate-300"
              />
            </div>
          </div>

          {/* Coordinates and Geolocation Button */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Latitude</label>
              <input
                type="number"
                step="0.000001"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                className="input input-bordered input-sm w-full font-mono bg-slate-50/70"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Longitude</label>
              <input
                type="number"
                step="0.000001"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                className="input input-bordered input-sm w-full font-mono bg-slate-50/70"
              />
            </div>
            <div>
              <button
                type="button"
                onClick={handleGpsDetect}
                disabled={detectingGps}
                className="btn btn-sm btn-outline btn-neutral w-full gap-1"
              >
                <MapPin className="w-4 h-4 text-amber-500" />
                {detectingGps ? 'Locating...' : 'Detect GPS Location'}
              </button>
            </div>
          </div>

          {/* Police Station & Zero-FIR Option */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Police Station (Thana)
              </label>
              <select
                value={form.stationId}
                onChange={(e) => setForm({ ...form, stationId: e.target.value })}
                className="select select-bordered select-sm w-full bg-slate-50/70"
              >
                {stations.map(st => (
                  <option key={st.id} value={st.id}>
                    {st.stationName} ({st.stationCode}) - {st.district}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200">
              <input
                type="checkbox"
                id="zeroFirToggle"
                checked={form.isZeroFir}
                onChange={(e) => setForm({ ...form, isZeroFir: e.target.checked })}
                className="checkbox checkbox-warning checkbox-sm"
              />
              <label htmlFor="zeroFirToggle" className="text-xs text-slate-800 cursor-pointer">
                <span className="font-bold text-amber-900 block">File as Zero-FIR</span>
                <span className="text-[11px] text-slate-600">
                  Incident happened outside local jurisdiction; auto-routes to correct station.
                </span>
              </label>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-warning w-full font-bold shadow-md gap-2"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Transmitting e-FIR to Thana...' : 'Submit Official e-Complaint / e-FIR'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
