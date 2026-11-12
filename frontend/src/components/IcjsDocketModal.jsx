import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Scale, Shield, Database, FileText, CheckCircle2, 
  RefreshCw, Building2, ExternalLink, Calendar, Check,
  AlertTriangle, Lock, Cpu, Globe
} from 'lucide-react';

export default function IcjsDocketModal({ complaintId, isOpen, onClose }) {
  const [docket, setDocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && complaintId) {
      fetchDocket();
    }
  }, [isOpen, complaintId]);

  const fetchDocket = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get(`/icjs/dockets/${complaintId}`);
      if (res.data?.data) {
        setDocket(res.data.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Could not load ICJS legal docket.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncCctns = async () => {
    setSyncing(true);
    setSyncNotice('');
    try {
      const res = await api.post(`/icjs/sync/${complaintId}`);
      if (res.data?.data) {
        setDocket(res.data.data);
        setSyncNotice('Case Hash & Evidence SHA-256 successfully synchronized to National CCTNS & ICJS Network.');
        setTimeout(() => setSyncNotice(''), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to sync with CCTNS.');
    } finally {
      setSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl border border-amber-300 space-y-5 my-auto max-h-[92vh] overflow-y-auto text-slate-800">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-700 rounded-xl border border-amber-300">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                  National ICJS Pipeline
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  Inter-Operable Criminal Justice System
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">
                5-Pillar Judicial Docket &amp; CCTNS Registry
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncCctns}
              disabled={syncing || loading}
              className="btn btn-xs sm:btn-sm btn-warning font-bold gap-1.5 shadow-sm"
              title="Push latest case diary and evidence hash to National CCTNS Node"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync to CCTNS'}
            </button>
            <button
              onClick={onClose}
              className="btn btn-sm btn-circle btn-ghost text-slate-500 hover:text-slate-900"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Sync Alert */}
        {syncNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{syncNotice}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-600">
              Querying National ICJS Hub, e-Courts CIS 3.2, and FSL Forensics Registry...
            </p>
          </div>
        ) : docket ? (
          <div className="space-y-5">
            {/* Case Identifiers Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">CCTNS Tracking Token</span>
                <span className="font-mono font-bold text-xs text-slate-900">{docket.trackingToken}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Crime Register No. (CRN)</span>
                <span className="font-mono font-bold text-xs text-emerald-800">{docket.crimeRegisterNumber || 'Pending SHO Scrutiny'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Police Station</span>
                <span className="font-semibold text-xs text-slate-900 truncate block">{docket.stationName}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Legal Mandate</span>
                <span className="font-bold text-[11px] text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 inline-block">
                  BNSS 2023 &amp; BSA 2023
                </span>
              </div>
            </div>

            {/* 5 ICJS PILLARS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* PILLAR 1: CCTNS Core Registry */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-600" />
                    <h4 className="text-sm font-bold text-slate-900">1. CCTNS National Core Node</h4>
                  </div>
                  <span className="badge badge-success text-white text-[10px] font-bold">
                    {docket.cctnsSyncStatus}
                  </span>
                </div>
                <div className="text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">National FIR ID:</span>
                    <span className="font-bold text-slate-900">{docket.cctnsNationalFirId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Data Center:</span>
                    <span className="font-medium text-slate-700 truncate max-w-[200px]">{docket.stateDataCenter}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Last Synced:</span>
                    <span className="text-slate-800 font-sans text-[11px]">{new Date(docket.cctnsSyncTimestamp).toLocaleString()}</span>
                  </div>
                  <div className="pt-1">
                    <span className="text-slate-500 text-[10px] block mb-0.5">SHA-256 State Ledger Hash:</span>
                    <div className="bg-white p-1.5 rounded border border-slate-200 text-[10px] break-all text-slate-700">
                      {docket.cctnsCoreHash}
                    </div>
                  </div>
                </div>
              </div>

              {/* PILLAR 2: e-Courts Interoperability */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-3">
                <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-bold text-slate-900">2. e-Courts CIS 3.2 Interop</h4>
                  </div>
                  <span className="badge badge-info text-white text-[10px] font-bold">
                    CONNECTED
                  </span>
                </div>
                <div className="text-xs space-y-1.5">
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-500">CNR Number:</span>
                    <span className="font-bold text-blue-900">{docket.cnrNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Designated Court:</span>
                    <span className="font-semibold text-slate-900 block leading-tight">{docket.courtName}</span>
                  </div>
                  <div className="flex justify-between items-center pt-0.5">
                    <span className="text-slate-500">Judicial Officer:</span>
                    <span className="font-medium text-slate-800">{docket.judicialOfficer}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Next Hearing Date:</span>
                    <span className="font-bold text-emerald-800 flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-emerald-600" />
                      {new Date(docket.hearingDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Judicial Stage:</span>
                    <span className="font-bold text-[11px] text-blue-800">{docket.courtStage}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">e-Summons / Notice:</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      {docket.eSummonsStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* PILLAR 3: e-Prosecution */}
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-sm font-bold text-slate-900">3. e-Prosecution Portal</h4>
                  </div>
                  <span className="badge badge-neutral text-xs">
                    ACTIVE
                  </span>
                </div>
                <div className="text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Prosecutor:</span>
                    <span className="font-semibold text-slate-900">{docket.prosecutorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Agency:</span>
                    <span className="text-slate-700 font-medium truncate max-w-[200px]">{docket.prosecutionAgency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Scrutiny Status:</span>
                    <span className="font-bold text-indigo-800">{docket.scrutinyStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Legal Review Date:</span>
                    <span className="text-slate-800 font-mono text-[11px]">{new Date(docket.scrutinyDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* PILLAR 4: e-Forensics (FSL Madiwala) */}
              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 space-y-3">
                <div className="flex items-center justify-between border-b border-purple-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-600" />
                    <h4 className="text-sm font-bold text-slate-900">4. e-Forensics (FSL)</h4>
                  </div>
                  <span className="badge badge-success text-white text-[10px] font-bold">
                    BSA CERTIFIED
                  </span>
                </div>
                <div className="text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">FSL Sample Token:</span>
                    <span className="font-bold text-purple-900">{docket.fslToken}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans block text-[11px]">Laboratory:</span>
                    <span className="font-semibold text-slate-800 font-sans block leading-tight">{docket.fslLaboratory}</span>
                  </div>
                  <div className="flex justify-between items-center font-sans">
                    <span className="text-slate-500">Analysis Status:</span>
                    <span className="font-bold text-purple-800 text-[11px]">{docket.forensicReportStatus}</span>
                  </div>
                  <div className="flex justify-between items-center font-sans">
                    <span className="text-slate-500">Evidence Compliance:</span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      {docket.bsa65BCertificateStatus}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* PILLAR 5: e-Prisons & Custody Status */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-slate-600 flex-shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block">5. e-Prisons Remand &amp; Undertrial Sync</span>
                  <span className="text-slate-600 text-[11px]">{docket.prisonFacility}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block font-sans">Remand Token</span>
                  <span className="font-bold text-slate-800">{docket.undertrialRemandNumber}</span>
                </div>
                <span className="badge badge-outline text-[11px] font-bold">
                  {docket.remandStatus}
                </span>
              </div>
            </div>

            {/* Footer Note */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200 pt-3">
              <span className="flex items-center gap-1 font-mono">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                Integrated under National ICJS Interoperability Framework (MHA / NIC)
              </span>
              <button
                onClick={onClose}
                className="btn btn-xs btn-outline font-bold"
              >
                Close Docket
              </button>
            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
}
