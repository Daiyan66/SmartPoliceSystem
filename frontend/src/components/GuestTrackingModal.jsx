import React, { useState } from 'react';
import api from '../services/api';
import { Search, KeyRound, CheckCircle, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';

export default function GuestTrackingModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Verify OTP, 3: View Result
  const [trackingToken, setTrackingToken] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [simulatedOtpNotice, setSimulatedOtpNotice] = useState('');
  const [complaintDetails, setComplaintDetails] = useState(null);

  if (!isOpen) return null;

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/complaints/track/request-otp', {
        trackingToken: trackingToken.trim(),
        phoneNumber: phoneNumber.trim()
      });
      if (res.data?.data) {
        if (res.data.data.simulatedOtp) {
          setSimulatedOtpNotice(`Dev/Demo Verification Code: ${res.data.data.simulatedOtp}`);
          setOtp(res.data.data.simulatedOtp);
        }
        setStep(2);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Could not verify token and phone number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/complaints/track/verify-otp', {
        trackingToken: trackingToken.trim(),
        phoneNumber: phoneNumber.trim(),
        otp: otp.trim()
      });
      if (res.data?.data) {
        setComplaintDetails(res.data.data);
        setStep(3);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setTrackingToken('');
    setPhoneNumber('');
    setOtp('');
    setErrorMsg('');
    setSimulatedOtpNotice('');
    setComplaintDetails(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-amber-300 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-100 pb-3">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold text-slate-900">
              Track FIR / Complaint Status
            </h3>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="btn btn-sm btn-circle btn-ghost"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-600">
          IDOR-Protected CCTNS Verification: Access is verified via 2-Factor One-Time Password sent to your registered mobile number.
        </p>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Enter Token & Phone */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                FIR Tracking Token <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="e.g. FIR-DL-NDL-2026-X89J2K"
                value={trackingToken}
                onChange={(e) => setTrackingToken(e.target.value.toUpperCase())}
                className="input input-bordered input-sm w-full font-mono bg-slate-50 text-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registered Mobile Number <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="tel"
                placeholder="e.g. 9876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="input input-bordered input-sm w-full bg-slate-50 text-slate-900"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-warning btn-sm w-full font-bold shadow-sm"
              >
                {loading ? 'Dispatching OTP...' : 'Send 6-Digit OTP Verification Code'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Enter OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {simulatedOtpNotice && (
              <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-xs font-mono text-amber-900">
                {simulatedOtpNotice}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Enter 6-Digit OTP Code
              </label>
              <input
                required
                type="text"
                maxLength={6}
                placeholder="••••••"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="input input-bordered input-sm w-full text-center tracking-widest font-mono text-lg font-bold bg-slate-50"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-sm btn-ghost flex-1 text-xs"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-warning btn-sm flex-1 font-bold shadow-sm"
              >
                {loading ? 'Verifying...' : 'Verify OTP & View FIR'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: View Case Details */}
        {step === 3 && complaintDetails && (
          <div className="space-y-4">
            <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-900">{complaintDetails.trackingToken}</span>
                <span className={`badge badge-sm font-bold ${
                  complaintDetails.status === 'FIR_REGISTERED' || complaintDetails.status === 'INVESTIGATION_IN_PROGRESS' ? 'badge-success text-white' :
                  complaintDetails.status === 'CHARGESHEET_FILED' ? 'badge-info text-white' :
                  complaintDetails.status === 'REJECTED' ? 'badge-error text-white' : 'badge-warning'
                }`}>
                  {complaintDetails.status.replace(/_/g, ' ')}
                </span>
              </div>

              {complaintDetails.crimeRegisterNumber && (
                <div className="text-sm font-mono font-bold text-emerald-800">
                  CRN: {complaintDetails.crimeRegisterNumber}
                </div>
              )}

              <div className="text-xs text-slate-700">
                <strong>Thana:</strong> {complaintDetails.stationName} ({complaintDetails.stationCode})
              </div>
              <div className="text-xs text-slate-700">
                <strong>Location:</strong> {complaintDetails.incidentLocation}
              </div>
              <div className="text-xs text-slate-700">
                <strong>BNS Sections:</strong> {complaintDetails.bnsSections || 'Cognizable Offence'}
              </div>
              {complaintDetails.assignedIoName && (
                <div className="text-xs text-slate-700">
                  <strong>Investigating Officer:</strong> {complaintDetails.assignedIoName} ({complaintDetails.assignedIoBadge})
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="btn btn-sm btn-ghost text-xs"
              >
                Track Another Case
              </button>
              <button
                type="button"
                onClick={() => {
                  handleReset();
                  onClose();
                }}
                className="btn btn-warning btn-sm font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
