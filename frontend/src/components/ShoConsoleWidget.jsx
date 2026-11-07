import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Shield, CheckCircle, XCircle, ArrowRightLeft, UserCheck, 
  FileCheck, Clock, Search, Filter, AlertTriangle, Sparkles 
} from 'lucide-react';

export default function ShoConsoleWidget({ stationId }) {
  const [complaints, setComplaints] = useState([]);
  const [availableIos, setAvailableIos] = useState([]);
  const [allStations, setAllStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'APPROVE', 'REJECT', 'ASSIGN_IO', 'TRANSFER'
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);

  // Form states for modals
  const [approveForm, setApproveForm] = useState({ assignedIoId: '', notes: '' });
  const [rejectForm, setRejectForm] = useState({ rejectionReason: '' });
  const [assignForm, setAssignForm] = useState({ ioId: '', instructions: '' });
  const [transferForm, setTransferForm] = useState({ targetStationId: '', transferReason: '' });

  useEffect(() => {
    fetchComplaints();
    fetchAvailableIos();
    fetchStations();
  }, [stationId, statusFilter]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/sho/station-complaints?status=${statusFilter}${stationId ? `&stationId=${stationId}` : ''}`);
      if (res.data?.data) {
        setComplaints(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch station complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableIos = async () => {
    try {
      const res = await api.get(`/sho/available-ios${stationId ? `?stationId=${stationId}` : ''}`);
      if (res.data?.data) {
        setAvailableIos(res.data.data);
        if (res.data.data.length > 0) {
          setApproveForm(prev => ({ ...prev, assignedIoId: res.data.data[0].id }));
          setAssignForm(prev => ({ ...prev, ioId: res.data.data[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch IOs:', err);
    }
  };

  const fetchStations = async () => {
    try {
      const res = await api.get('/public/stations');
      if (res.data?.data) {
        setAllStations(res.data.data);
        if (res.data.data.length > 0) {
          setTransferForm(prev => ({ ...prev, targetStationId: res.data.data[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch stations:', err);
    }
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.post(`/sho/complaints/${selectedComplaint.id}/approve`, {
        assignedIoId: approveForm.assignedIoId ? Number(approveForm.assignedIoId) : null,
        notes: approveForm.notes
      });
      setActionMsg({ success: true, text: `Formal FIR Registered! CRN: ${res.data.data.crimeRegisterNumber}` });
      fetchComplaints();
      setTimeout(() => { setActiveModal(null); setActionMsg(null); }, 1500);
    } catch (err) {
      setActionMsg({ success: false, text: err.response?.data?.message || 'Approval failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post(`/sho/complaints/${selectedComplaint.id}/reject`, {
        rejectionReason: rejectForm.rejectionReason
      });
      setActionMsg({ success: true, text: 'Complaint rejected with reasoned order recorded under BNSS.' });
      fetchComplaints();
      setTimeout(() => { setActiveModal(null); setActionMsg(null); }, 1500);
    } catch (err) {
      setActionMsg({ success: false, text: err.response?.data?.message || 'Rejection failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignIo = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post(`/sho/complaints/${selectedComplaint.id}/assign-io`, {
        ioId: Number(assignForm.ioId),
        instructions: assignForm.instructions
      });
      setActionMsg({ success: true, text: 'Investigating Officer assigned successfully.' });
      fetchComplaints();
      setTimeout(() => { setActiveModal(null); setActionMsg(null); }, 1500);
    } catch (err) {
      setActionMsg({ success: false, text: err.response?.data?.message || 'IO assignment failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post(`/sho/complaints/${selectedComplaint.id}/transfer-zero-fir`, {
        targetStationId: Number(transferForm.targetStationId),
        transferReason: transferForm.transferReason
      });
      setActionMsg({ success: true, text: 'Zero-FIR transferred to jurisdictional Thana.' });
      fetchComplaints();
      setTimeout(() => { setActiveModal(null); setActionMsg(null); }, 1500);
    } catch (err) {
      setActionMsg({ success: false, text: err.response?.data?.message || 'Transfer failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredComplaints = complaints.filter(c => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (c.trackingToken && c.trackingToken.toLowerCase().includes(term)) ||
      (c.crimeRegisterNumber && c.crimeRegisterNumber.toLowerCase().includes(term)) ||
      (c.description && c.description.toLowerCase().includes(term)) ||
      (c.incidentLocation && c.incidentLocation.toLowerCase().includes(term)) ||
      (c.bnsSections && c.bnsSections.toLowerCase().includes(term))
    );
  });

  return (
    <div className="bg-white rounded-2xl border border-amber-200/80 shadow-md p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-500" />
            Station House Officer (SHO) Command Console
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Review incoming e-Complaints • Approve into formal FIRs (CRN Allocation) • Assign IOs • Zero-FIR Transfers
          </p>
        </div>
        <div className="badge badge-warning text-xs font-bold py-3 px-3">
          CCTNS Integrated • Thana Desk
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="tabs tabs-boxed bg-slate-100 p-1 rounded-xl flex-wrap">
          {['ALL', 'SUBMITTED', 'FIR_REGISTERED', 'INVESTIGATION_IN_PROGRESS', 'CHARGESHEET_FILED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`tab tab-sm font-semibold text-xs ${statusFilter === st ? 'tab-active bg-amber-400 text-slate-900 shadow-sm' : 'text-slate-600'}`}
            >
              {st === 'ALL' ? 'All Complaints' : st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Token, CRN, BNS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered input-sm w-full pl-9 bg-slate-50 border-slate-300 text-xs"
          />
        </div>
      </div>

      {/* Complaints List / Table */}
      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm">Loading station complaint records...</div>
      ) : filteredComplaints.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-300">
          No complaints found under filter <strong>{statusFilter}</strong>.
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="table table-sm w-full text-left">
            <thead className="bg-amber-50/70 text-slate-800 text-xs">
              <tr>
                <th>Tracking Token / CRN</th>
                <th>Incident Details</th>
                <th>AI Triage & BNS Sections</th>
                <th>Status</th>
                <th>Assigned IO</th>
                <th className="text-right">SHO Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredComplaints.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  <td>
                    <div className="font-mono font-bold text-slate-900">{c.trackingToken}</div>
                    {c.crimeRegisterNumber && (
                      <div className="text-[11px] font-mono text-emerald-700 font-bold mt-0.5">
                        {c.crimeRegisterNumber}
                      </div>
                    )}
                    {c.isZeroFir && (
                      <span className="badge badge-error text-[10px] font-bold mt-1">Zero-FIR</span>
                    )}
                  </td>
                  <td className="max-w-xs">
                    <div className="font-semibold text-slate-900 truncate">{c.incidentLocation}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{c.description}</div>
                  </td>
                  <td>
                    <div className="font-medium text-amber-900">{c.aiPredictedCategory || 'General Offence'}</div>
                    <div className="text-[11px] font-mono text-slate-600 mt-0.5">{c.bnsSections || 'Pending Classification'}</div>
                  </td>
                  <td>
                    <span className={`badge badge-sm font-semibold ${
                      c.status === 'FIR_REGISTERED' || c.status === 'INVESTIGATION_IN_PROGRESS' ? 'badge-success text-white' :
                      c.status === 'CHARGESHEET_FILED' ? 'badge-info text-white' :
                      c.status === 'REJECTED' ? 'badge-error text-white' : 'badge-warning'
                    }`}>
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    {c.assignedIoName ? (
                      <div>
                        <div className="font-semibold text-slate-900">{c.assignedIoName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{c.assignedIoBadge}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="text-right space-x-1">
                    {c.status === 'SUBMITTED' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedComplaint(c);
                            setActiveModal('APPROVE');
                          }}
                          className="btn btn-xs btn-success text-white font-bold"
                        >
                          Approve FIR
                        </button>
                        <button
                          onClick={() => {
                            setSelectedComplaint(c);
                            setActiveModal('REJECT');
                          }}
                          className="btn btn-xs btn-error text-white font-bold"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {(c.status === 'FIR_REGISTERED' || c.status === 'INVESTIGATION_IN_PROGRESS') && (
                      <button
                        onClick={() => {
                          setSelectedComplaint(c);
                          setActiveModal('ASSIGN_IO');
                        }}
                        className="btn btn-xs btn-outline btn-warning font-semibold"
                      >
                        Assign IO
                      </button>
                    )}
                    {c.isZeroFir && (
                      <button
                        onClick={() => {
                          setSelectedComplaint(c);
                          setActiveModal('TRANSFER');
                        }}
                        className="btn btn-xs btn-neutral font-semibold"
                      >
                        Transfer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: APPROVE FIR */}
      {activeModal === 'APPROVE' && selectedComplaint && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-300 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Register Formal FIR (Allocate CRN)
            </h3>
            <p className="text-xs text-slate-600">
              Complaint: <strong>{selectedComplaint.trackingToken}</strong> ({selectedComplaint.incidentLocation})
            </p>

            {actionMsg && (
              <div className={`p-2.5 rounded-lg text-xs font-semibold ${actionMsg.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {actionMsg.text}
              </div>
            )}

            <form onSubmit={handleApprove} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Investigating Officer (SI / ASI)
                </label>
                <select
                  value={approveForm.assignedIoId}
                  onChange={(e) => setApproveForm({ ...approveForm, assignedIoId: e.target.value })}
                  className="select select-bordered select-sm w-full bg-slate-50"
                >
                  <option value="">-- Assign Later --</option>
                  {availableIos.map(io => (
                    <option key={io.id} value={io.id}>
                      {io.fullName} ({io.badgeNumber}) - {io.rankDesignation}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  SHO Formal Order / Endorsement
                </label>
                <textarea
                  rows={3}
                  placeholder="Record formal reasons for registration of FIR under BNS..."
                  value={approveForm.notes}
                  onChange={(e) => setApproveForm({ ...approveForm, notes: e.target.value })}
                  className="textarea textarea-bordered text-xs w-full bg-slate-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="btn btn-sm btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-sm btn-warning font-bold"
                >
                  {actionLoading ? 'Allocating CRN...' : 'Confirm & Register FIR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REJECT COMPLAINT */}
      {activeModal === 'REJECT' && selectedComplaint && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-300 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              Reject e-Complaint (Mandatory BNSS Order)
            </h3>
            <p className="text-xs text-slate-600">
              Token: <strong>{selectedComplaint.trackingToken}</strong>
            </p>

            {actionMsg && (
              <div className={`p-2.5 rounded-lg text-xs font-semibold ${actionMsg.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {actionMsg.text}
              </div>
            )}

            <form onSubmit={handleReject} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Non-Registration (Mandatory under BNSS 2023)
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="State clear legal grounds (e.g., purely civil dispute, non-cognizable without Magistrate order, false report)..."
                  value={rejectForm.rejectionReason}
                  onChange={(e) => setRejectForm({ ...rejectForm, rejectionReason: e.target.value })}
                  className="textarea textarea-bordered text-xs w-full bg-slate-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="btn btn-sm btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-sm btn-error text-white font-bold"
                >
                  {actionLoading ? 'Recording...' : 'Record Rejection Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN IO */}
      {activeModal === 'ASSIGN_IO' && selectedComplaint && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-300 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-500" />
              Assign Investigating Officer (IO)
            </h3>
            <p className="text-xs text-slate-600">
              FIR: <strong>{selectedComplaint.crimeRegisterNumber || selectedComplaint.trackingToken}</strong>
            </p>

            {actionMsg && (
              <div className={`p-2.5 rounded-lg text-xs font-semibold ${actionMsg.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {actionMsg.text}
              </div>
            )}

            <form onSubmit={handleAssignIo} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Officer (Sub-Inspector / ASI)
                </label>
                <select
                  required
                  value={assignForm.ioId}
                  onChange={(e) => setAssignForm({ ...assignForm, ioId: e.target.value })}
                  className="select select-bordered select-sm w-full bg-slate-50"
                >
                  {availableIos.map(io => (
                    <option key={io.id} value={io.id}>
                      {io.fullName} ({io.badgeNumber}) - {io.rankDesignation}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supervisory Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="Specific investigation directions from SHO..."
                  value={assignForm.instructions}
                  onChange={(e) => setAssignForm({ ...assignForm, instructions: e.target.value })}
                  className="textarea textarea-bordered text-xs w-full bg-slate-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="btn btn-sm btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-sm btn-warning font-bold"
                >
                  {actionLoading ? 'Assigning...' : 'Assign IO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TRANSFER ZERO-FIR */}
      {activeModal === 'TRANSFER' && selectedComplaint && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-300 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-amber-500" />
              Transfer Zero-FIR to Jurisdictional Thana
            </h3>

            {actionMsg && (
              <div className={`p-2.5 rounded-lg text-xs font-semibold ${actionMsg.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {actionMsg.text}
              </div>
            )}

            <form onSubmit={handleTransfer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destination Police Station
                </label>
                <select
                  required
                  value={transferForm.targetStationId}
                  onChange={(e) => setTransferForm({ ...transferForm, targetStationId: e.target.value })}
                  className="select select-bordered select-sm w-full bg-slate-50"
                >
                  {allStations.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.stationName} ({st.stationCode}) - {st.district}, {st.state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Transfer
                </label>
                <textarea
                  rows={3}
                  placeholder="Jurisdictional locus clarification..."
                  value={transferForm.transferReason}
                  onChange={(e) => setTransferForm({ ...transferForm, transferReason: e.target.value })}
                  className="textarea textarea-bordered text-xs w-full bg-slate-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="btn btn-sm btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-sm btn-warning font-bold"
                >
                  {actionLoading ? 'Transferring...' : 'Execute Thana Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
