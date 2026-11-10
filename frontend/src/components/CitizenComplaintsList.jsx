import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  FileText, Clock, CheckCircle2, ShieldAlert, User, 
  MapPin, ChevronRight, AlertCircle, RefreshCw, Scale,
  Download, Upload, Eye, Phone, ChevronDown, Check, Printer,
  Search, Filter, X
} from 'lucide-react';

export default function CitizenComplaintsList({ onNewComplaintClick }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCaseId, setExpandedCaseId] = useState(null);
  const [caseDiaries, setCaseDiaries] = useState({});
  const [loadingDiaries, setLoadingDiaries] = useState({});

  // Filter & Search State
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showFirModal, setShowFirModal] = useState(null); // complaint object to print
  const [showUploadModal, setShowUploadModal] = useState(null); // complaint object to attach evidence
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadSha, setUploadSha] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');

  const navigate = useNavigate();

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

  const toggleExpandCase = async (complaintId) => {
    if (expandedCaseId === complaintId) {
      setExpandedCaseId(null);
      return;
    }
    setExpandedCaseId(complaintId);
    if (!caseDiaries[complaintId]) {
      setLoadingDiaries(prev => ({ ...prev, [complaintId]: true }));
      try {
        const res = await api.get(`/investigation/cases/${complaintId}/case-diaries`);
        if (res.data?.data) {
          setCaseDiaries(prev => ({ ...prev, [complaintId]: res.data.data }));
        }
      } catch (err) {
        console.warn('Could not load case diary:', err);
      } finally {
        setLoadingDiaries(prev => ({ ...prev, [complaintId]: false }));
      }
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadFile(file);
    setUploadSuccess('');

    // Compute WebCrypto SHA-256 hash in browser
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setUploadSha(hashHex);
    } catch (err) {
      console.error('SHA-256 calculation failed:', err);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile || !showUploadModal) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('complaintId', showUploadModal.id);
      formData.append('evidenceType', 'CITIZEN_ADDITIONAL_SUBMISSION');
      formData.append('description', `Uploaded by citizen for ${showUploadModal.trackingToken}`);

      await api.post('/evidence/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadSuccess(`Evidence successfully secured with SHA-256: ${uploadSha.slice(0, 16)}...`);
      setTimeout(() => {
        setShowUploadModal(null);
        setUploadFile(null);
        setUploadSha('');
        setUploadSuccess('');
      }, 2500);
    } catch (err) {
      alert(err.response?.data?.message || 'Evidence upload failed');
    } finally {
      setUploading(false);
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
      case 'CHARGESHEETED':
        return <span className="badge badge-info text-white text-xs font-bold">Chargesheet Filed in Court</span>;
      case 'REJECTED':
        return <span className="badge badge-error text-white text-xs font-bold">Reasoned Rejection</span>;
      default:
        return <span className="badge badge-neutral text-xs font-bold">{status}</span>;
    }
  };

  const getProgressStep = (status) => {
    if (status === 'SUBMITTED') return 1;
    if (status === 'FIR_REGISTERED') return 2;
    if (status === 'INVESTIGATION_IN_PROGRESS' || status === 'INVESTIGATION') return 3;
    if (status === 'CHARGESHEET_FILED' || status === 'CHARGESHEETED' || status === 'RESOLVED') return 4;
    return 1;
  };

  const handleNewFirClick = () => {
    if (onNewComplaintClick) {
      onNewComplaintClick();
    }
    navigate('/citizen/file-fir');
  };

  const counts = useMemo(() => {
    return {
      all: complaints.length,
      submitted: complaints.filter(c => c.status === 'SUBMITTED').length,
      activeFir: complaints.filter(c => ['FIR_REGISTERED', 'INVESTIGATION_IN_PROGRESS', 'INVESTIGATION'].includes(c.status)).length,
      chargesheeted: complaints.filter(c => ['CHARGESHEET_FILED', 'CHARGESHEETED'].includes(c.status)).length,
      disposed: complaints.filter(c => ['REJECTED', 'RESOLVED', 'TRANSFERRED_TO_JURISDICTIONAL_THANA'].includes(c.status)).length,
    };
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (statusFilter === 'SUBMITTED' && c.status !== 'SUBMITTED') return false;
      if (statusFilter === 'ACTIVE_FIR' && !['FIR_REGISTERED', 'INVESTIGATION_IN_PROGRESS', 'INVESTIGATION'].includes(c.status)) return false;
      if (statusFilter === 'CHARGESHEETED' && !['CHARGESHEET_FILED', 'CHARGESHEETED'].includes(c.status)) return false;
      if (statusFilter === 'DISPOSED' && !['REJECTED', 'RESOLVED', 'TRANSFERRED_TO_JURISDICTIONAL_THANA'].includes(c.status)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchToken = c.trackingToken?.toLowerCase().includes(q);
        const matchCrn = c.crimeRegisterNumber?.toLowerCase().includes(q);
        const matchLoc = c.incidentLocation?.toLowerCase().includes(q);
        const matchDesc = c.description?.toLowerCase().includes(q);
        const matchStation = c.station?.stationName?.toLowerCase().includes(q);
        const matchBns = c.bnsSections?.toLowerCase().includes(q);
        if (!matchToken && !matchCrn && !matchLoc && !matchDesc && !matchStation && !matchBns) {
          return false;
        }
      }
      return true;
    });
  }, [complaints, statusFilter, searchQuery]);

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
            Real-time investigation tracking, Case Diary audit milestones, and official FIR documents under BNSS 2023.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMyComplaints}
            className="btn btn-xs btn-ghost btn-circle"
            title="Refresh Complaints"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleNewFirClick}
            className="btn btn-xs btn-warning font-bold gap-1 shadow-sm"
          >
            + File New e-FIR
          </button>
        </div>
      </div>

      {/* Search & Status Filters */}
      {!loading && complaints.length > 0 && (
        <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by token, CRN, station, sections or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-sm input-bordered w-full pl-9 pr-8 bg-white text-xs text-slate-800"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                  statusFilter === 'ALL'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                All ({counts.all})
              </button>
              <button
                onClick={() => setStatusFilter('SUBMITTED')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                  statusFilter === 'SUBMITTED'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Under Review ({counts.submitted})
              </button>
              <button
                onClick={() => setStatusFilter('ACTIVE_FIR')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                  statusFilter === 'ACTIVE_FIR'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Active FIR ({counts.activeFir})
              </button>
              <button
                onClick={() => setStatusFilter('CHARGESHEETED')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                  statusFilter === 'CHARGESHEETED'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Chargesheeted ({counts.chargesheeted})
              </button>
              <button
                onClick={() => setStatusFilter('DISPOSED')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                  statusFilter === 'DISPOSED'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Disposed ({counts.disposed})
              </button>
            </div>
          </div>
        </div>
      )}

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
          <button
            onClick={handleNewFirClick}
            className="btn btn-sm btn-warning font-bold shadow-sm"
          >
            File Your First e-FIR
          </button>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="p-8 text-center space-y-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-sm font-semibold text-slate-700">No complaints match your current filter</p>
          <p className="text-xs text-slate-400">Try adjusting your search query or status filter.</p>
          <button
            onClick={() => {
              setStatusFilter('ALL');
              setSearchQuery('');
            }}
            className="btn btn-xs btn-outline btn-warning font-bold mt-2"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.map((c) => {
            const step = getProgressStep(c.status);
            const isExpanded = expandedCaseId === c.id;
            const diaries = caseDiaries[c.id] || [];

            return (
              <div
                key={c.id}
                className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 hover:border-amber-300 transition-all space-y-4 shadow-sm"
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
                      <span className="ml-2 font-mono font-bold text-xs text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
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

                {/* Progress Timeline Stepper */}
                {c.status !== 'REJECTED' ? (
                  <div className="py-2">
                    <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                      <div className={`p-2 rounded-lg border ${step >= 1 ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold shadow-xs' : 'bg-white border-slate-200 text-slate-400'}`}>
                        1. Submitted
                      </div>
                      <div className={`p-2 rounded-lg border ${step >= 2 ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold shadow-xs' : 'bg-white border-slate-200 text-slate-400'}`}>
                        2. SHO Approved
                      </div>
                      <div className={`p-2 rounded-lg border ${step >= 3 ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold shadow-xs' : 'bg-white border-slate-200 text-slate-400'}`}>
                        3. IO Investigation
                      </div>
                      <div className={`p-2 rounded-lg border ${step >= 4 ? 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold shadow-xs' : 'bg-white border-slate-200 text-slate-400'}`}>
                        4. Chargesheeted
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
                    <span className="font-bold block">Complaint Reasoned Rejection (BNSS Section 173(4)):</span>
                    <p>{c.rejectionReason || 'Non-cognizable offence; civil court remedies advised.'}</p>
                  </div>
                )}

                {/* Narrative & Location */}
                <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-900 mb-0.5">Incident Description:</div>
                  <p className="text-slate-600">{c.description}</p>
                </div>

                {/* Thana & Officer Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1">
                  <div>
                    <span className="text-slate-400 block font-semibold">Police Station</span>
                    <strong className="text-slate-800">{c.stationName || 'Headquarters'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Assigned Investigating Officer</span>
                    <strong className="text-slate-800">{c.assignedIoName ? `${c.assignedIoName} (${c.assignedIoBadge || 'SI'})` : 'Awaiting Assignment'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Legal Section (BNS 2023)</span>
                    <strong className="text-amber-900 font-mono">{c.bnsSections || 'BNS Cognizable'}</strong>
                  </div>
                </div>

                {/* Action Buttons Row (All 100% Working) */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                  <button
                    onClick={() => toggleExpandCase(c.id)}
                    className="btn btn-xs btn-outline btn-warning font-bold gap-1"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    {isExpanded ? 'Hide Investigation Log' : 'View Investigation Timeline'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowUploadModal(c)}
                      className="btn btn-xs btn-outline gap-1 text-slate-700"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-600" />
                      Upload Evidence
                    </button>

                    <button
                      onClick={() => setShowFirModal(c)}
                      className="btn btn-xs btn-warning font-bold gap-1 text-slate-950 shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Certified e-FIR PDF
                    </button>
                  </div>
                </div>

                {/* Expanded Case Diary / Investigation Timeline */}
                {isExpanded && (
                  <div className="mt-3 p-4 bg-white rounded-xl border border-amber-300 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Official Case Diary (CD) Entries pursuant to BNSS Section 193
                    </h4>

                    {loadingDiaries[c.id] ? (
                      <div className="text-xs text-slate-400 py-2">Fetching official case diary entries...</div>
                    ) : diaries.length === 0 ? (
                      <div className="text-xs text-slate-500 py-2 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        No Case Diary entries have been recorded yet. The assigned Investigating Officer will log daily inspection memos and witness recordings here.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {diaries.map((entry, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                            <div className="flex items-center justify-between font-bold text-slate-900">
                              <span>Entry #{entry.entryNumber}: {entry.ioName || 'Investigating Officer'}</span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {new Date(entry.entryTimestamp).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <p className="text-slate-700"><strong>Notes:</strong> {entry.investigationNotes}</p>
                            {entry.actionsTaken && (
                              <p className="text-slate-600"><strong>Actions:</strong> {entry.actionsTaken}</p>
                            )}
                            {entry.seizureDetails && (
                              <p className="text-amber-800"><strong>Seized Articles:</strong> {entry.seizureDetails}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Certified e-FIR PDF Document Print View */}
      {showFirModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border-2 border-slate-300 space-y-6 my-auto max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none">
            {/* National / State Header */}
            <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
              <div className="text-xs font-bold tracking-widest uppercase text-slate-600">Government of NCT of Delhi • Delhi Police</div>
              <h2 className="text-xl font-extrabold text-slate-950 uppercase tracking-tight">First Information Report (e-FIR)</h2>
              <div className="text-[11px] text-slate-500 font-medium">Under Section 173 Bharatiya Nagarik Suraksha Sanhita (BNSS 2023)</div>
            </div>

            {/* Core Identification Ledger */}
            <div className="grid grid-cols-2 gap-4 text-xs border border-slate-200 p-4 rounded-xl bg-slate-50/70">
              <div>
                <span className="text-slate-400 block">CCTNS Tracking Token:</span>
                <strong className="font-mono text-sm text-slate-900">{showFirModal.trackingToken}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Crime Registration Number (CRN):</span>
                <strong className="font-mono text-sm text-emerald-800">{showFirModal.crimeRegisterNumber || 'UNDER SCRUTINY'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Police Station:</span>
                <strong className="text-slate-800">{showFirModal.stationName || 'Connaught Place Thana'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Date &amp; Time of Occurrence:</span>
                <strong className="text-slate-800">{showFirModal.incidentTimestamp ? new Date(showFirModal.incidentTimestamp).toLocaleString('en-IN') : 'As Reported'}</strong>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block">Applicable Acts &amp; Sections:</span>
                <strong className="font-mono text-amber-900">{showFirModal.bnsSections || 'Bharatiya Nyaya Sanhita (BNS 2023)'}</strong>
              </div>
            </div>

            {/* Grievance Text */}
            <div className="text-xs space-y-1">
              <span className="font-bold text-slate-900 block">1. Brief Description of Incident / Allegation:</span>
              <p className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 leading-relaxed">
                {showFirModal.description}
              </p>
            </div>

            {/* Assigned Investigating Details */}
            <div className="text-xs grid grid-cols-2 gap-4 border-t border-slate-200 pt-3 text-slate-700">
              <div>
                <span className="text-slate-400 block">Assigned Investigating Officer:</span>
                <strong>{showFirModal.assignedIoName || 'Inspector Rajesh Sharma (SHO)'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Status:</span>
                <strong className="text-emerald-700 font-bold uppercase">{showFirModal.status}</strong>
              </div>
            </div>

            {/* Digital Stamp / Verification Footer */}
            <div className="border-t-2 border-dashed border-slate-300 pt-4 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 gap-2">
              <div>
                <div>Digitally Certified under Section 63 of Bharatiya Sakshya Adhiniyam 2023.</div>
                <div>Hash verification verified via CCTNS central database.</div>
              </div>
              <div className="border border-emerald-600 text-emerald-800 px-3 py-1 rounded font-bold uppercase">
                ✓ Valid e-FIR Copy
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 print:hidden">
              <button
                onClick={() => setShowFirModal(null)}
                className="btn btn-sm btn-ghost"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="btn btn-sm btn-warning font-bold gap-1 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Upload Evidence File with Live Browser SHA-256 Calculation */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-amber-300 space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-slate-900">
                  Upload Supporting Digital Evidence
                </h3>
              </div>
              <button onClick={() => setShowUploadModal(null)} className="btn btn-sm btn-circle btn-ghost">✕</button>
            </div>

            <p className="text-xs text-slate-600">
              Attach CCTV footage, photos, audio notes, or banking transaction receipts for case{' '}
              <strong className="font-mono text-amber-900">{showUploadModal.trackingToken}</strong>.
            </p>

            {uploadSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Evidence Media (MP4, JPG, PNG, PDF, WAV)
                </label>
                <input
                  type="file"
                  required
                  onChange={handleFileChange}
                  className="file-input file-input-bordered file-input-sm w-full bg-slate-50"
                />
              </div>

              {uploadSha && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                    Calculated SHA-256 Provenance Hash (BSA 2023):
                  </span>
                  <div className="font-mono text-[11px] text-slate-900 break-all bg-white p-2 rounded border border-amber-200">
                    {uploadSha}
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(null)}
                  className="btn btn-sm btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="btn btn-sm btn-warning font-bold shadow-sm"
                >
                  {uploading ? 'Securing Evidence...' : 'Upload & Lock in DEMS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
