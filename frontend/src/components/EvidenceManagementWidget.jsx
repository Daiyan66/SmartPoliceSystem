import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  FileCheck2, Upload, ShieldCheck, Download, History, Award, 
  FileLock2, AlertCircle, CheckCircle2, Eye, Printer, FileText, Lock
} from 'lucide-react';

export default function EvidenceManagementWidget() {
  const [complaintId, setComplaintId] = useState('1');
  const [file, setFile] = useState(null);
  const [scrubExif, setScrubExif] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  // Evidence list
  const [evidenceList, setEvidenceList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // Certificate Modal
  const [selectedCert, setSelectedCert] = useState(null);
  const [certLoading, setCertLoading] = useState(false);

  // Audit trail Modal
  const [selectedAuditTrail, setSelectedAuditTrail] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    if (complaintId) {
      fetchComplaintEvidence();
    }
  }, [complaintId]);

  const fetchComplaintEvidence = async () => {
    setLoadingList(true);
    try {
      const res = await api.get(`/evidence/complaint/${complaintId}`);
      if (res.data && res.data.data) {
        setEvidenceList(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load evidence items:', err);
    } finally {
      setLoadingList(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('complaintId', complaintId);
    formData.append('scrubExif', scrubExif);

    try {
      const res = await api.post('/evidence/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadStatus({
        success: true,
        message: `Evidence stored with SHA-256: ${res.data.data.sha256Hash}`,
        data: res.data.data
      });
      setFile(null);
      // Reset file input element
      const fileInput = document.getElementById('evidenceFileInput');
      if (fileInput) fileInput.value = '';

      fetchComplaintEvidence();
    } catch (err) {
      setUploadStatus({
        success: false,
        message: err.response?.data?.message || err.message || 'Evidence upload failed'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (id, fileName) => {
    try {
      const response = await api.get(`/evidence/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download evidence file: ' + err.message);
    }
  };

  const viewCertificate = async (id) => {
    setCertLoading(true);
    try {
      const res = await api.get(`/evidence/${id}/bsa-certificate`);
      if (res.data && res.data.data) {
        setSelectedCert(res.data.data);
      }
    } catch (err) {
      alert('Could not generate BSA certificate: ' + err.message);
    } finally {
      setCertLoading(false);
    }
  };

  const viewAuditTrail = async (id) => {
    setAuditLoading(true);
    try {
      const res = await api.get(`/evidence/${id}/audit-trail`);
      if (res.data && res.data.data) {
        setSelectedAuditTrail(res.data.data);
      }
    } catch (err) {
      alert('Could not fetch audit trail: ' + err.message);
    } finally {
      setAuditLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
            <span>Digital Evidence Management System (BSA 2023 Sec 63/65B)</span>
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Forensic cryptographic SHA-256 fingerprinting, whistleblower EXIF scrubbing, and tamper-proof chain of custody
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-600">Case / Complaint ID:</span>
          <input
            type="number"
            min="1"
            value={complaintId}
            onChange={(e) => setComplaintId(e.target.value)}
            className="w-20 px-2.5 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-slate-900 text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Grid: Upload Box + Vault List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Form (5 cols) */}
        <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Upload className="w-4 h-4 text-amber-500" />
            <span>Secure Evidence Ingestion</span>
          </h3>

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Evidence File (CCTV, Audio, Photo, PDF)
              </label>
              <input
                id="evidenceFileInput"
                type="file"
                required
                onChange={(e) => setFile(e.target.files[0] || null)}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-400 file:text-slate-950 hover:file:bg-amber-500 cursor-pointer border border-slate-300 rounded-lg p-1.5 bg-white"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                Direct streaming ingestion prevents JVM memory spikes (Up to 500 MB).
              </span>
            </div>

            {/* Whistleblower Privacy Option */}
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start space-x-3">
              <input
                type="checkbox"
                id="scrubExifCheckbox"
                checked={scrubExif}
                onChange={(e) => setScrubExif(e.target.checked)}
                className="mt-0.5 checkbox checkbox-sm checkbox-warning"
              />
              <label htmlFor="scrubExifCheckbox" className="text-xs cursor-pointer text-slate-800">
                <span className="font-bold text-amber-900 block">Whistleblower Anonymous Tip Mode</span>
                <span className="text-[11px] text-slate-600">
                  Automatically scrubs all EXIF metadata, camera serial numbers, and GPS geotags before permanent storage.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={uploading || !file}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-amber-400 hover:bg-amber-500 text-slate-950 shadow transition disabled:opacity-40 flex items-center justify-center space-x-2"
            >
              {uploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Computing SHA-256 &amp; Storing...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Seal &amp; Fingerprint Evidence</span>
                </>
              )}
            </button>
          </form>

          {uploadStatus && (
            <div
              className={`p-3.5 rounded-xl text-xs border ${
                uploadStatus.success
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-red-50 border-red-300 text-red-900'
              }`}
            >
              <div className="font-bold mb-1">{uploadStatus.message}</div>
              {uploadStatus.data && (
                <div className="text-[11px] font-mono break-all text-slate-700 bg-white/70 p-1.5 rounded border border-emerald-200">
                  SHA-256: {uploadStatus.data.sha256Hash}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Evidence Vault Table (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <FileLock2 className="w-4 h-4 text-amber-500" />
              <span>Evidence Vault (Case #{complaintId})</span>
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              {evidenceList.length} items logged
            </span>
          </div>

          {loadingList ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading evidence files...</div>
          ) : evidenceList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-300 rounded-xl">
              No evidence uploaded yet for Complaint #{complaintId}. Upload CCTV or photo files on the left.
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
              {evidenceList.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        <span>{item.fileName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Size: {(item.fileSizeBytes / 1024).toFixed(1)} KB | MIME: {item.mimeType}
                        {item.isExifStripped && (
                          <span className="ml-2 px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                            EXIF SCRUBBED
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleDownload(item.id, item.fileName)}
                        className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-slate-200 rounded-lg transition"
                        title="Download Evidence"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => viewAuditTrail(item.id)}
                        className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-slate-200 rounded-lg transition"
                        title="View Chain of Custody"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => viewCertificate(item.id)}
                        className="px-2 py-1 text-[11px] font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-md transition flex items-center space-x-1"
                        title="Generate BSA 63/65B Certificate"
                      >
                        <Award className="w-3 h-3" />
                        <span>BSA 65B</span>
                      </button>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-slate-600 bg-white px-2 py-1 rounded border border-slate-200 break-all">
                    SHA-256: {item.sha256Hash}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BSA Certificate Modal */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-300 rounded-2xl shadow-2xl w-full max-w-2xl p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <Award className="w-6 h-6 text-amber-500" />
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Certificate of Electronic Evidence
                  </h3>
                  <span className="text-xs text-slate-600 font-semibold">
                    {selectedCert.legalAct}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCert(null)}
                className="text-slate-400 hover:text-slate-900 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Certificate Header Banner */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1.5 text-slate-800">
              <div><span className="font-bold">Certificate Number:</span> <code className="bg-amber-100 px-1 py-0.5 rounded font-bold">{selectedCert.certificateNumber}</code></div>
              <div><span className="font-bold">Evidence Name:</span> {selectedCert.fileName} ({selectedCert.fileSizeBytes} bytes)</div>
              <div><span className="font-bold">Station:</span> {selectedCert.stationName}</div>
              <div><span className="font-bold">Certifying Officer:</span> {selectedCert.certifyingOfficerName} ({selectedCert.certifyingOfficerBadge})</div>
              <div className="break-all font-mono text-[10px] text-amber-900 pt-1">
                <span className="font-bold font-sans">SHA-256 Digest:</span> {selectedCert.sha256Hash}
              </div>
            </div>

            {/* Legal Declaration */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed text-slate-700 whitespace-pre-line font-serif">
              {selectedCert.statutoryDeclaration}
            </div>

            {/* Chain of Custody in Certificate */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Verified Chain of Custody Audit Trail:
              </h4>
              <div className="space-y-1 text-xs">
                {selectedCert.chainOfCustodyLog.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px]">
                    <span className="font-bold text-amber-700">{log.actionType}</span>
                    <span className="text-slate-600">Officer: {log.accessedBy} ({log.badgeNumber})</span>
                    <span className="text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Certificate</span>
              </button>
              <button
                onClick={() => setSelectedCert(null)}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Trail Modal */}
      {selectedAuditTrail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-300 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[80vh] overflow-y-auto text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <History className="w-4 h-4 text-amber-500" />
                <span>Immutable Chain of Custody History</span>
              </h3>
              <button
                onClick={() => setSelectedAuditTrail(null)}
                className="text-slate-400 hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {selectedAuditTrail.map((entry) => (
                <div key={entry.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-700">{entry.actionType}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-slate-700">
                    Accessed by: <span className="font-semibold">{entry.accessedBy}</span> (Badge: {entry.badgeNumber})
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    IP Address: {entry.ipAddress}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedAuditTrail(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-bold text-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
