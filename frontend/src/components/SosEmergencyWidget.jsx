import React, { useState } from 'react';
import api from '../services/api';
import { 
  AlertOctagon, PhoneCall, MapPin, Radio, ShieldCheck, 
  CheckCircle, Clock, Navigation, AlertTriangle, Truck 
} from 'lucide-react';

export default function SosEmergencyWidget() {
  const [triggering, setTriggering] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    latitude: 28.6315,
    longitude: 77.2167,
    phoneNumber: '',
    notes: ''
  });

  const handleGpsDetect = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported by browser');
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(prev => ({
          ...prev,
          latitude: parseFloat(pos.coords.latitude.toFixed(6)),
          longitude: parseFloat(pos.coords.longitude.toFixed(6))
        }));
        setDetectingGps(false);
      },
      (err) => {
        console.warn('GPS detection failed:', err);
        setDetectingGps(false);
        alert('Could not detect location. Using current coordinates.');
      },
      { timeout: 8000 }
    );
  };

  const handleTriggerSos = async () => {
    setTriggering(true);
    setErrorMsg('');
    try {
      const res = await api.post('/sos/trigger', {
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        phoneNumber: form.phoneNumber || undefined,
        notes: form.notes || 'High-Priority Emergency Distress Beacon Activated'
      });
      if (res.data?.data) {
        setActiveAlert(res.data.data);
      }
    } catch (err) {
      console.error('SOS Trigger failed:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to trigger emergency beacon');
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-red-300 shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <AlertOctagon className="w-6 h-6 text-red-600 animate-pulse" />
            112 Emergency SOS Distress Dispatch (Real-Time)
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Geofenced Alerting: Automatically reverse-geocodes to the nearest Police Station &amp; PCR Mobile Patrol Units.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-error text-white font-bold text-xs py-3 px-3">
            Priority Tier 1 • Live Dispatch
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Active Alert Beacon Card */}
      {activeAlert ? (
        <div className="bg-red-50/80 border-2 border-red-400 rounded-2xl p-6 text-center space-y-4">
          <div className="inline-flex p-3 bg-red-100 text-red-700 rounded-full animate-bounce">
            <Radio className="w-8 h-8" />
          </div>

          <div>
            <span className="badge badge-error text-white font-mono font-bold text-xs">
              BEACON LIVE: {activeAlert.alertToken}
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-2">
              Nearest Police Station Alerted &amp; Unit En Route
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
              Distress beacon broadcasted via Police WebSocket network to active patrol vans in your beat sector.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left text-xs bg-white p-4 rounded-xl border border-red-200 shadow-sm">
            <div>
              <span className="text-slate-400 uppercase text-[10px] font-bold block">Nearest Thana</span>
              <span className="font-bold text-slate-900">{activeAlert.assignedStationName || 'Station Headquarters'}</span>
              <span className="text-[10px] text-slate-500 block">Code: {activeAlert.assignedStationCode}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] font-bold block">Distance</span>
              <span className="font-bold text-amber-900">{activeAlert.distanceKm ? `${activeAlert.distanceKm} km` : 'In Vicinity'}</span>
              <span className="text-[10px] text-slate-500 block">ETA: ~3 to 5 mins</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] font-bold block">Status</span>
              <span className="badge badge-sm badge-error text-white font-bold">{activeAlert.status}</span>
              {activeAlert.dispatchedPatrolUnit && (
                <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                  Unit: {activeAlert.dispatchedPatrolUnit}
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <a
              href="tel:112"
              className="btn btn-sm btn-error text-white font-bold gap-1 shadow"
            >
              <PhoneCall className="w-4 h-4" />
              Call 112 Control Room
            </a>
            <button
              onClick={() => setActiveAlert(null)}
              className="btn btn-sm btn-outline btn-neutral text-xs"
            >
              Reset Beacon
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Big Red SOS Button */}
          <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-4">
            <button
              onClick={handleTriggerSos}
              disabled={triggering}
              className="w-36 h-36 rounded-full bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center border-4 border-white ring-4 ring-red-300"
            >
              <AlertOctagon className="w-10 h-10 mb-1" />
              <span className="text-2xl font-black tracking-wider">SOS</span>
              <span className="text-[10px] font-bold tracking-widest uppercase opacity-90">Distress</span>
            </button>
            <p className="text-xs text-slate-500 max-w-xs text-center">
              Tap to trigger instant high-priority emergency dispatch to nearest PCR vehicle.
            </p>
          </div>

          {/* Location & Contact Inputs */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  className="input input-bordered input-sm w-full bg-slate-50 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Emergency Situation Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stalker outside, accident, robbery"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="input input-bordered input-sm w-full bg-slate-50 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">GPS Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  className="input input-bordered input-sm w-full font-mono bg-slate-50 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">GPS Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  className="input input-bordered input-sm w-full font-mono bg-slate-50 text-xs"
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleGpsDetect}
                  disabled={detectingGps}
                  className="btn btn-sm btn-outline btn-neutral w-full gap-1 text-xs"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  {detectingGps ? 'Detecting...' : 'Detect GPS Location'}
                </button>
              </div>
            </div>

            {/* National Emergency Helplines Strip */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <a
                href="tel:112"
                className="p-2.5 rounded-xl border border-amber-300 bg-amber-50/60 hover:bg-amber-100/70 transition text-center"
              >
                <div className="text-[11px] font-bold text-amber-900">National Emergency</div>
                <div className="text-base font-extrabold text-amber-800 font-mono">112</div>
              </a>
              <a
                href="tel:1090"
                className="p-2.5 rounded-xl border border-rose-300 bg-rose-50/60 hover:bg-rose-100/70 transition text-center"
              >
                <div className="text-[11px] font-bold text-rose-900">Women Helpline</div>
                <div className="text-base font-extrabold text-rose-800 font-mono">1090</div>
              </a>
              <a
                href="tel:1930"
                className="p-2.5 rounded-xl border border-sky-300 bg-sky-50/60 hover:bg-sky-100/70 transition text-center"
              >
                <div className="text-[11px] font-bold text-sky-900">Cyber Crime Helpline</div>
                <div className="text-base font-extrabold text-sky-800 font-mono">1930</div>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
