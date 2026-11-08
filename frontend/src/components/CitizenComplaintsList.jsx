import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  FileText, Clock, CheckCircle2, ShieldAlert, User, 
  MapPin, ChevronRight, AlertCircle, RefreshCw, Scale 
} from 'lucide-react';

export default function CitizenComplaintsList({ onNewComplaintClick }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  const fetchMyComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get('/complaints/my-complaints');
      if (res.data?.data) {
        setComplaints(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load citizen complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return <span className="badge badge-warning text-xs font-bold">Under Review by SHO</span>;
      case 'FIR_REGISTERED':
      case 'INVESTIGATION_IN_PROGRESS':
        return <span className="badge badge-success text-white text-xs font-bold">Formal FIR Active</span>;
      case 'CHARGESHEET_FILED':
        return <span className="badge badge-info text-white text-xs font-bold">Chargesheet Filed in Court</span>;
      case 'REJECTED':
        return <span className="badge badge-error text-white text-xs font-bold">Rejected</span>;
      default:
        return <span className="badge badge-neutral text-xs font-bold">{status}</span>;
    }
  };

  const getProgressStep = (status) => {
    if (status === 'SUBMITTED') return 1;
    if (status === 'FIR_REGISTERED') return 2;
    if (status === 'INVESTIGATION_IN_PROGRESS') return 3;
    if (status === 'CHARGESHEET_FILED' || status === 'RESOLVED') return 4;
    return 1;
  };

  return (
    <div className="bg-white rounded-2xl border border-amber-200/80 shadow-md p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-500" />
            My Registered Complaints &amp; e-FIRs
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Track real-time investigation progress, assigned officers, and formal FIR documents under CCTNS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMyComplaints}
            className="btn btn-xs btn-ghost btn-circle"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {onNewComplaintClick && (
            <button
              onClick={onNewComplaintClick}
              className="btn btn-xs btn-warning font-bold gap-1 shadow-sm"
            >
              + File New e-FIR
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading your complaint records...</div>
      ) : complaints.length === 0 ? (
        <div className="p-10 text-center space-y-3 bg-amber-50/40 rounded-2xl border border-dashed border-amber-200">
          <div className="inline-flex p-3 bg-amber-100 text-amber-700 rounded-full">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Complaints Filed Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You currently have no registered police complaints or e-FIRs. Click below to file an official complaint.
          </p>
          {onNewComplaintClick && (
            <button
              onClick={onNewComplaintClick}
              className="btn btn-sm btn-warning font-bold shadow-sm"
            >
              File Your First e-FIR
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => {
            const step = getProgressStep(c.status);
            return (
              <div
                key={c.id}
                className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-amber-300 transition-all space-y-4"
              >
                {/* Top Row: Tokens & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Tracking Token
                    </span>
                    <span className="text-base font-extrabold font-mono text-slate-900">
                      {c.trackingToken}
                    </span>
                    {c.crimeRegisterNumber && (
                      <span className="ml-2 font-mono font-bold text-xs text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        CRN: {c.crimeRegisterNumber}
                      </span>
                    )}
                    {c.isZeroFir && (
                      <span className="ml-2 badge badge-error text-[10px] font-bold">Zero-FIR</span>
                    )}
                  </div>

                  <div>
                    {getStatusBadge(c.status)}
                  </div>
                </div>

                {/* Progress Timeline */}
                {c.status !== 'REJECTED' ? (
                  <div className="py-2">
                    <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                      <div className={`p-1.5 rounded-lg border ${step >= 1 ? 'bg-amber-100 border-amber-400 text-amber-900' : 'bg-white border-slate-200 text-slate-400'}`}>
                        1. Submitted
                      </div>
                      <div className={`p-1.5 rounded-lg border ${step >= 2 ? 'bg-amber-100 border-amber-400 text-amber-900' : 'bg-white border-slate-200 text-slate-400'}`}>
                        2. SHO Approved
                      </div>
                      <div className={`p-1.5 rounded-lg border ${step >= 3 ? 'bg-amber-100 border-amber-400 text-amber-900' : 'bg-white border-slate-200 text-slate-400'}`}>
                        3. Investigation
                      </div>
                      <div className={`p-1.5 rounded-lg border ${step >= 4 ? 'bg-emerald-100 border-emerald-400 text-emerald-900' : 'bg-white border-slate-200 text-slate-400'}`}>
                        4. Chargesheeted
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
                    <span className="font-bold block">Complaint Non-Registration Reason (BNSS):</span>
                    <p>{c.rejectionReason || 'Non-cognizable offence; civil remedies advised.'}</p>
                  </div>
                )}

                {/* Narrative & Location */}
                <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-900 mb-0.5">Incident Description:</div>
                  <p className="text-slate-600 line-clamp-3">{c.description}</p>
                </div>

                {/* Thana & Officer Footer */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1">
                  <div>
                    <span className="text-slate-400 block font-semibold">Police Station</span>
                    <strong className="text-slate-800">{c.stationName || 'Headquarters'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Assigned Investigating Officer</span>
                    <strong className="text-slate-800">{c.assignedIoName ? `${c.assignedIoName} (${c.assignedIoBadge})` : 'Awaiting Assignment'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Legal Section (BNS 2023)</span>
                    <strong className="text-amber-900 font-mono">{c.bnsSections || 'Cognizable Offence'}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
