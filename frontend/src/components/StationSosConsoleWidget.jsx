import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Radio, AlertOctagon, CheckCircle, Truck, Phone, 
  MapPin, Clock, RefreshCw, Check 
} from 'lucide-react';

export default function StationSosConsoleWidget({ stationId }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'DISPATCH', 'RESOLVE'

  const [pcrUnit, setPcrUnit] = useState('PCR-Van-01');
  const [resolveNotes, setResolveNotes] = useState('Incident site secured. Suspects apprehended/deterred.');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000); // Polling backup for live updates
    return () => clearInterval(interval);
  }, [stationId]);

  const fetchAlerts = async () => {
    try {
      const url = stationId ? `/sos/station/${stationId}` : '/sos/active';
      const res = await api.get(url);
      if (res.data?.data) {
        setAlerts(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load station SOS alerts:', err);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await api.post(`/sos/${alertId}/acknowledge`);
      fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to acknowledge SOS');
    }
  };

  const handleDispatch = async (e) => {
    e.preventDefault();
    if (!selectedAlert) return;
    setActionLoading(true);
    try {
      await api.post(`/sos/${selectedAlert.id}/dispatch?patrolUnit=${encodeURIComponent(pcrUnit)}`);
      setActiveModal(null);
      fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to dispatch patrol unit');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!selectedAlert) return;
    setActionLoading(true);
    try {
      await api.post(`/sos/${selectedAlert.id}/resolve`, {
        status: 'RESOLVED',
        notes: resolveNotes
      });
      setActiveModal(null);
      fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve emergency event');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-red-200 shadow-md p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Radio className="w-6 h-6 text-red-600 animate-pulse" />
            Station Emergency SOS Dispatch Console (Live)
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Real-Time Distress Ingestion • Beat Geofenced Routing • PCR Patrol Unit Allocation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-error text-white font-mono text-xs py-3 px-3">
            {alerts.filter(a => a.status === 'ACTIVE').length} Active Alerts
          </span>
          <button
            onClick={fetchAlerts}
            className="btn btn-xs btn-ghost btn-circle"
            title="Refresh Feed"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Alerts Feed */}
      {alerts.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-300">
          No pending SOS emergency distress calls in this station's beat jurisdiction.
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                alert.status === 'ACTIVE'
                  ? 'bg-red-50/70 border-red-300 shadow-sm'
                  : alert.status === 'PATROL_DISPATCHED'
                  ? 'bg-amber-50/60 border-amber-300'
                  : 'bg-slate-50 border-slate-200 opacity-80'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-extrabold text-slate-900 text-sm">{alert.alertToken}</span>
                  <span className={`badge badge-sm font-bold ${
                    alert.status === 'ACTIVE' ? 'badge-error text-white' :
                    alert.status === 'PATROL_DISPATCHED' ? 'badge-warning' :
                    alert.status === 'RESOLVED' ? 'badge-success text-white' : 'badge-neutral'
                  }`}>
                    {alert.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    {new Date(alert.createdAt).toLocaleTimeString()}
                  </span>
                </div>

                <div className="text-slate-700 font-medium flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  <span>GPS: {alert.latitude?.toFixed(4)}, {alert.longitude?.toFixed(4)}</span>
                  {alert.distanceKm && (
                    <span className="text-amber-900 font-bold">({alert.distanceKm} km from Thana)</span>
                  )}
                </div>

                {alert.phoneNumber && (
                  <div className="text-slate-600 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Caller: <strong>{alert.phoneNumber}</strong></span>
                  </div>
                )}

                {alert.notes && (
                  <div className="text-slate-500 text-[11px] italic mt-0.5">
                    "{alert.notes}"
                  </div>
                )}

                {alert.dispatchedPatrolUnit && (
                  <div className="text-emerald-700 font-bold flex items-center gap-1.5 mt-1">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Assigned Unit: {alert.dispatchedPatrolUnit}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {alert.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="btn btn-xs btn-outline btn-error font-bold"
                  >
                    Acknowledge
                  </button>
                )}

                {alert.status !== 'RESOLVED' && (
                  <button
                    onClick={() => {
                      setSelectedAlert(alert);
                      setActiveModal('DISPATCH');
                    }}
                    className="btn btn-xs btn-warning font-bold gap-1 shadow-sm"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    Dispatch PCR Van
                  </button>
                )}

                {alert.status !== 'RESOLVED' && (
                  <button
                    onClick={() => {
                      setSelectedAlert(alert);
                      setActiveModal('RESOLVE');
                    }}
                    className="btn btn-xs btn-success text-white font-bold gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: DISPATCH PCR VAN */}
      {activeModal === 'DISPATCH' && selectedAlert && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-amber-300 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-500" />
              Dispatch Mobile Patrol Vehicle
            </h3>
            <p className="text-xs text-slate-600">
              Emergency Token: <strong>{selectedAlert.alertToken}</strong>
            </p>

            <form onSubmit={handleDispatch} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patrol Unit / PCR Van Identifier
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. PCR-Van-02 Connaught Place"
                  value={pcrUnit}
                  onChange={(e) => setPcrUnit(e.target.value)}
                  className="input input-bordered input-sm w-full bg-slate-50 text-xs font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="btn btn-sm btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-sm btn-warning font-bold text-xs"
                >
                  {actionLoading ? 'Dispatching...' : 'Confirm Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESOLVE EMERGENCY */}
      {activeModal === 'RESOLVE' && selectedAlert && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-emerald-300 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Resolve Emergency Distress Event
            </h3>

            <form onSubmit={handleResolve} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resolution &amp; Officer Action Notes
                </label>
                <textarea
                  required
                  rows={3}
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  className="textarea textarea-bordered text-xs w-full bg-slate-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="btn btn-sm btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-sm btn-success text-white font-bold text-xs"
                >
                  {actionLoading ? 'Closing...' : 'Confirm Resolved'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
