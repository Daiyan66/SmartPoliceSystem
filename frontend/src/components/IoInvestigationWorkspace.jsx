import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Briefcase, BookOpen, PlusCircle, FileText, Send, 
  CheckCircle, User, ShieldCheck, Scale, AlertCircle 
} from 'lucide-react';

export default function IoInvestigationWorkspace() {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseDiaries, setCaseDiaries] = useState([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [loadingDiaries, setLoadingDiaries] = useState(false);

  // New Case Diary Form
  const [showCdForm, setShowCdForm] = useState(false);
  const [cdForm, setCdForm] = useState({
    investigationNotes: '',
    actionsTaken: '',
    witnessName: '',
    witnessStatement: '',
    seizureDetails: ''
  });
  const [submittingCd, setSubmittingCd] = useState(false);
  const [cdSuccessMsg, setCdSuccessMsg] = useState('');

  // Chargesheet Modal
  const [showChargesheetModal, setShowChargesheetModal] = useState(false);
  const [chargesheetData, setChargesheetData] = useState(null);
  const [loadingChargesheet, setLoadingChargesheet] = useState(false);
  const [submittingChargesheet, setSubmittingChargesheet] = useState(false);

  useEffect(() => {
    fetchMyCases();
  }, []);

  const fetchMyCases = async () => {
    setLoadingCases(true);
    try {
      const res = await api.get('/investigation/my-cases');
      if (res.data?.data) {
        setCases(res.data.data);
        if (res.data.data.length > 0 && !selectedCase) {
          handleSelectCase(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch IO cases:', err);
    } finally {
      setLoadingCases(false);
    }
  };

  const handleSelectCase = async (c) => {
    setSelectedCase(c);
    setLoadingDiaries(true);
    try {
      const res = await api.get(`/investigation/cases/${c.id}/case-diaries`);
      if (res.data?.data) {
        setCaseDiaries(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch case diaries:', err);
    } finally {
      setLoadingDiaries(false);
    }
  };

  const handleAddCdEntry = async (e) => {
    e.preventDefault();
    if (!selectedCase) return;
    setSubmittingCd(true);
    setCdSuccessMsg('');

    try {
      let witnessJson = null;
      if (cdForm.witnessName || cdForm.witnessStatement) {
        witnessJson = JSON.stringify([{
          name: cdForm.witnessName,
          statement: cdForm.witnessStatement,
          timestamp: new Date().toISOString()
        }]);
      }

      await api.post(`/investigation/cases/${selectedCase.id}/case-diaries`, {
        investigationNotes: cdForm.investigationNotes,
        actionsTaken: cdForm.actionsTaken,
        witnessStatements: witnessJson,
        seizureDetails: cdForm.seizureDetails
      });

      setCdSuccessMsg('Case Diary entry appended with official timestamp.');
      setCdForm({
        investigationNotes: '',
        actionsTaken: '',
        witnessName: '',
        witnessStatement: '',
        seizureDetails: ''
      });
      setShowCdForm(false);
      handleSelectCase(selectedCase);
      setTimeout(() => setCdSuccessMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record Case Diary entry');
    } finally {
      setSubmittingCd(false);
    }
  };

  const handleOpenChargesheet = async () => {
    if (!selectedCase) return;
    setLoadingChargesheet(true);
    setShowChargesheetModal(true);
    try {
      const res = await api.get(`/investigation/cases/${selectedCase.id}/chargesheet`);
      if (res.data?.data) {
        setChargesheetData(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to compile Chargesheet draft');
    } finally {
      setLoadingChargesheet(false);
    }
  };

  const handleSubmitChargesheet = async () => {
    if (!selectedCase) return;
    if (!confirm('Are you sure you want to formally submit this Final Report / Chargesheet to the Learned Magistrate Court?')) {
      return;
    }
    setSubmittingChargesheet(true);
    try {
      const res = await api.post(`/investigation/cases/${selectedCase.id}/chargesheet/submit`);
      if (res.data?.data) {
        alert('Chargesheet formally filed under Section 193 BNSS!');
        setChargesheetData(res.data.data);
        fetchMyCases();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit Chargesheet');
    } finally {
      setSubmittingChargesheet(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-amber-200/80 shadow-md p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-amber-500" />
            Investigating Officer (IO) Digital Case Diary (CD) & Chargesheet Workspace
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Complies with BNSS 2023 Sec 193 & BSA Sec 63/65B • Immutable Chronological Case Diaries
          </p>
        </div>
        <div className="badge badge-warning text-xs font-bold py-3 px-3">
          Field IO Console
        </div>
      </div>

      {cdSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{cdSuccessMsg}</span>
        </div>
      )}

      {/* Main Grid: Cases on Left, Selected Case Diary on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Assigned Cases List */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between">
            <span>My Assigned FIRs</span>
            <span className="badge badge-neutral text-xs">{cases.length}</span>
          </h3>

          {loadingCases ? (
            <div className="text-xs text-slate-400 py-4 text-center">Loading assigned cases...</div>
          ) : cases.length === 0 ? (
            <div className="text-xs text-slate-500 py-6 text-center italic">
              No active FIRs currently assigned to your badge.
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {cases.map((c) => {
                const isSelected = selectedCase?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCase(c)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-100/70 border-amber-400 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono font-bold text-slate-900">
                      <span>{c.crimeRegisterNumber || c.trackingToken}</span>
                      <span className={`badge badge-xs ${
                        c.status === 'CHARGESHEET_FILED' ? 'badge-info' : 'badge-warning'
                      }`}>
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-slate-600 font-medium truncate mt-1">{c.incidentLocation}</div>
                    <div className="text-[11px] text-amber-900 font-mono mt-0.5">{c.bnsSections}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Case Diary Entries & Actions */}
        <div className="lg:col-span-2 border border-slate-200 rounded-xl p-5 space-y-5 bg-white">
          {selectedCase ? (
            <>
              {/* Case Summary Card */}
              <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-500 font-semibold uppercase">Active Case Investigation</div>
                  <div className="text-lg font-bold font-mono text-slate-900">
                    {selectedCase.crimeRegisterNumber || selectedCase.trackingToken}
                  </div>
                  <div className="text-xs text-slate-700 mt-1">
                    <strong>BNS Sections:</strong> {selectedCase.bnsSections || 'General Cognizable Offence'}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    <strong>Location:</strong> {selectedCase.incidentLocation}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowCdForm(!showCdForm)}
                    className="btn btn-xs btn-warning font-bold gap-1 shadow-sm"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    {showCdForm ? 'Close Entry Form' : 'Append CD Entry'}
                  </button>
                  <button
                    onClick={handleOpenChargesheet}
                    className="btn btn-xs btn-outline btn-neutral font-semibold gap-1"
                  >
                    <Scale className="w-3.5 h-3.5 text-amber-500" />
                    Chargesheet / Final Report
                  </button>
                </div>
              </div>

              {/* Append Case Diary Form */}
              {showCdForm && (
                <form onSubmit={handleAddCdEntry} className="p-4 bg-slate-50 rounded-xl border border-amber-300 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    New Daily Case Diary (CD) Entry
                  </h4>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Investigation Notes (Chronological Record) <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Details of investigation conducted today, places visited, cues examined..."
                      value={cdForm.investigationNotes}
                      onChange={(e) => setCdForm({ ...cdForm, investigationNotes: e.target.value })}
                      className="textarea textarea-bordered text-xs w-full bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Actions Taken / Enquiries Conducted <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Questioned local security guards, reviewed surveillance DVR..."
                      value={cdForm.actionsTaken}
                      onChange={(e) => setCdForm({ ...cdForm, actionsTaken: e.target.value })}
                      className="input input-bordered input-sm text-xs w-full bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Witness Name (BNSS Sec 180)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Verma (Eyewitness)"
                        value={cdForm.witnessName}
                        onChange={(e) => setCdForm({ ...cdForm, witnessName: e.target.value })}
                        className="input input-bordered input-sm text-xs w-full bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Witness Statement
                      </label>
                      <input
                        type="text"
                        placeholder="Statement recorded during examination..."
                        value={cdForm.witnessStatement}
                        onChange={(e) => setCdForm({ ...cdForm, witnessStatement: e.target.value })}
                        className="input input-bordered input-sm text-xs w-full bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Seizure Memo / Seized Properties & SHA-256 Evidence Hashes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Seized weapon/mobile phone. Hash: 8b1a9953c4611296a827abf8c47804d7..."
                      value={cdForm.seizureDetails}
                      onChange={(e) => setCdForm({ ...cdForm, seizureDetails: e.target.value })}
                      className="input input-bordered input-sm text-xs w-full bg-white font-mono"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCdForm(false)}
                      className="btn btn-xs btn-ghost"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingCd}
                      className="btn btn-xs btn-warning font-bold"
                    >
                      {submittingCd ? 'Recording Entry...' : 'Save Case Diary Entry'}
                    </button>
                  </div>
                </form>
              )}

              {/* Case Diary Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center justify-between">
                  <span>Chronological Case Diary (CD) Timeline</span>
                  <span className="badge badge-sm badge-outline">{caseDiaries.length} Entries Recorded</span>
                </h4>

                {loadingDiaries ? (
                  <div className="text-xs text-slate-400 py-6 text-center">Loading case diary logs...</div>
                ) : caseDiaries.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    No Case Diary entries recorded yet for this FIR. Click <strong>Append CD Entry</strong> to log today's investigation.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {caseDiaries.map((cd) => (
                      <div key={cd.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded font-mono">
                            CD Entry #{cd.entryNumber}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {new Date(cd.entryTimestamp).toLocaleString()} • Logged by {cd.ioName} ({cd.ioBadgeNumber})
                          </span>
                        </div>

                        <div>
                          <div className="font-semibold text-slate-700">Investigation Notes:</div>
                          <div className="text-slate-600 mt-0.5">{cd.investigationNotes}</div>
                        </div>

                        <div>
                          <div className="font-semibold text-slate-700">Actions Taken:</div>
                          <div className="text-slate-600 mt-0.5">{cd.actionsTaken}</div>
                        </div>

                        {cd.witnessStatements && (
                          <div className="p-2 bg-white rounded border border-slate-200">
                            <span className="font-semibold text-slate-700">Witness Statements: </span>
                            <span className="text-slate-600 font-mono text-[11px]">{cd.witnessStatements}</span>
                          </div>
                        )}

                        {cd.seizureDetails && (
                          <div className="p-2 bg-white rounded border border-slate-200">
                            <span className="font-semibold text-slate-700">Seizure Memo: </span>
                            <span className="text-slate-600 font-mono text-[11px]">{cd.seizureDetails}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 text-sm italic">
              Select an assigned FIR from the left list to review its Case Diary entries.
            </div>
          )}
        </div>
      </div>

      {/* CHARGESHEET MODAL (Form 5 / U/S 193 BNSS 2023) */}
      {showChargesheetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-amber-300 space-y-5">
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-amber-500" />
                  Final Report / Chargesheet (U/S 193 BNSS 2023)
                </h3>
                <p className="text-xs text-slate-500">CCTNS Standard Police Form 5 • In the Court of Learned Judicial Magistrate</p>
              </div>
              <button
                onClick={() => setShowChargesheetModal(false)}
                className="btn btn-sm btn-circle btn-ghost"
              >
                ✕
              </button>
            </div>

            {loadingChargesheet ? (
              <div className="py-12 text-center text-sm text-slate-500">Compiling Chargesheet records...</div>
            ) : chargesheetData ? (
              <div className="space-y-4 text-xs">
                {/* Government Header */}
                <div className="text-center border-b border-slate-200 pb-3">
                  <div className="font-bold text-sm uppercase tracking-wider text-slate-800">
                    State Police Department • {chargesheetData.state}
                  </div>
                  <div className="text-slate-600 text-xs">
                    District: {chargesheetData.district} | Station: {chargesheetData.policeStation} ({chargesheetData.stationCode})
                  </div>
                  <div className="font-mono font-bold text-amber-700 mt-1">
                    FIR CRN: {chargesheetData.crimeRegisterNumber}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div><strong>Complainant:</strong> {chargesheetData.complainantName}</div>
                  <div><strong>Contact:</strong> {chargesheetData.complainantPhone}</div>
                  <div><strong>Occurrence Date:</strong> {new Date(chargesheetData.incidentDate).toLocaleString()}</div>
                  <div><strong>Chargesheet Date:</strong> {new Date(chargesheetData.chargesheetDate).toLocaleDateString()}</div>
                  <div className="col-span-2">
                    <strong>BNS Sections Charged:</strong> <span className="font-mono text-amber-900 font-bold">{chargesheetData.bnsSectionsCharged}</span>
                  </div>
                  <div className="col-span-2">
                    <strong>Investigating Officer:</strong> {chargesheetData.ioName} ({chargesheetData.ioBadgeNumber}) - {chargesheetData.ioRank}
                  </div>
                </div>

                {/* Brief Facts & Findings */}
                <div className="space-y-2">
                  <div className="font-bold text-slate-900">1. Brief Facts of the Case:</div>
                  <div className="p-3 bg-white rounded border border-slate-200 text-slate-700 leading-relaxed">
                    {chargesheetData.briefFacts}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-bold text-slate-900">2. Investigation Findings & Prima Facie Evidence:</div>
                  <div className="p-3 bg-white rounded border border-slate-200 text-slate-700 leading-relaxed">
                    {chargesheetData.investigationFindings}
                  </div>
                </div>

                {/* Seized Evidence & Digital Hashes */}
                <div className="space-y-2">
                  <div className="font-bold text-slate-900">
                    3. Digital Evidence Attachments & BSA Sec 63/65B Hashes:
                  </div>
                  {chargesheetData.digitalEvidenceAttachments?.length > 0 ? (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg p-2 bg-slate-50">
                      {chargesheetData.digitalEvidenceAttachments.map((item, idx) => (
                        <div key={idx} className="py-1 text-[11px] font-mono flex justify-between">
                          <span>{item.evidence.fileName} ({Math.round(item.evidence.fileSizeBytes / 1024)} KB)</span>
                          <span className="text-amber-800 font-bold">SHA-256: {item.evidence.sha256Hash?.substring(0, 16)}...</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-400 italic">No digital attachments filed for this case.</div>
                  )}
                </div>

                {/* Prayer */}
                <div className="space-y-2">
                  <div className="font-bold text-slate-900">4. Prayer Before the Learned Magistrate:</div>
                  <div className="p-3 bg-amber-50 rounded border border-amber-200 text-slate-800 italic leading-relaxed font-serif">
                    "{chargesheetData.magistrateCourtPrayer}"
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <span className={`badge font-bold ${
                    chargesheetData.status === 'CHARGESHEET_FILED' ? 'badge-success text-white' : 'badge-warning'
                  }`}>
                    Status: {chargesheetData.status.replace(/_/g, ' ')}
                  </span>

                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowChargesheetModal(false)}
                      className="btn btn-sm btn-ghost"
                    >
                      Close
                    </button>
                    {chargesheetData.status !== 'CHARGESHEET_FILED' && (
                      <button
                        type="button"
                        onClick={handleSubmitChargesheet}
                        disabled={submittingChargesheet}
                        className="btn btn-sm btn-warning font-bold gap-1 shadow-md"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {submittingChargesheet ? 'Filing to Court...' : 'Submit Chargesheet to Court'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
