import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Shield, UserPlus, Building, Award, CheckCircle, 
  Cpu, Database, Activity, RefreshCw, FileText, 
  Briefcase, Radio, Flame, FolderLock, Scale, Users 
} from 'lucide-react';
import ComplaintAiAnalyzer from '../components/ComplaintAiAnalyzer';
import EvidenceManagementWidget from '../components/EvidenceManagementWidget';
import ComplaintRegistrationWidget from '../components/ComplaintRegistrationWidget';
import ShoConsoleWidget from '../components/ShoConsoleWidget';
import IoInvestigationWorkspace from '../components/IoInvestigationWorkspace';
import SosEmergencyWidget from '../components/SosEmergencyWidget';
import StationSosConsoleWidget from '../components/StationSosConsoleWidget';
import CrimeHotspotsWidget from '../components/CrimeHotspotsWidget';
import ExecutiveCommandCenter from '../components/ExecutiveCommandCenter';
import CitizenComplaintsList from '../components/CitizenComplaintsList';

export default function DashboardPage({ defaultTab }) {
  const { user, isOfficer, isShoOrAbove, isIo, isAdminOrSP } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Normalize route tabs to internal tab keys
  const normalizeTab = (tab) => {
    if (!tab) return null;
    if (tab === 'SOS_CITIZEN') return 'SOS_EMERGENCY';
    if (tab === 'AI_ADVISOR') return 'AI_LEGAL_ASSIST';
    if (tab === 'SAFETY_MAP') return 'CRIME_HOTSPOTS';
    if (tab === 'EVIDENCE_LOCKER') return 'DEMS_EVIDENCE';
    return tab;
  };

  // Active Tab State (Role-specific default with URL sync)
  const getInitialTab = () => {
    const rawTab = searchParams.get('tab') || defaultTab;
    const queryTab = normalizeTab(rawTab);
    if (queryTab) return queryTab;
    if (!user || user.role === 'ROLE_CITIZEN') return 'MY_COMPLAINTS';
    if (user.role === 'ROLE_SUB_INSPECTOR' || user.role === 'ROLE_ASI') return 'IO_WORKSPACE';
    if (user.role === 'ROLE_SHO') return 'THANA_DESK';
    if (user.role === 'ROLE_SP_SSP' || user.role === 'ROLE_DIG_DGP' || user.role === 'ROLE_ADMIN') return 'EXECUTIVE_COMMAND';
    return 'SOS_DISPATCH';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    const rawTab = searchParams.get('tab') || defaultTab;
    const queryTab = normalizeTab(rawTab);
    if (queryTab && queryTab !== activeTab) {
      setActiveTab(queryTab);
    }
  }, [searchParams, defaultTab]);

  const handleTabChange = (tabKey) => {
    const normalized = normalizeTab(tabKey);
    setActiveTab(normalized);
    setSearchParams({ tab: normalized });
  };

  // State for stations & provisioning
  const [stations, setStations] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loadingOfficers, setLoadingOfficers] = useState(false);
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [provisionForm, setProvisionForm] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    role: 'ROLE_SUB_INSPECTOR',
    stationId: '',
    rankDesignation: 'Sub-Inspector / Investigating Officer',
    temporaryPassword: 'Police@' + Math.floor(1000 + Math.random() * 9000),
  });
  const [provisionStatus, setProvisionStatus] = useState(null);
  const [provisionLoading, setProvisionLoading] = useState(false);

  useEffect(() => {
    fetchStations();
    if (isAdminOrSP()) {
      fetchOfficers();
    }
  }, [user]);

  const fetchStations = async () => {
    try {
      const res = await api.get('/public/stations');
      if (res.data?.data) {
        setStations(res.data.data);
        if (res.data.data.length > 0 && !provisionForm.stationId) {
          setProvisionForm(prev => ({ ...prev, stationId: res.data.data[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch stations:', err);
    }
  };

  const fetchOfficers = async () => {
    setLoadingOfficers(true);
    try {
      const res = await api.get('/admin/officers');
      if (res.data?.data) {
        setOfficers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch officers:', err);
    } finally {
      setLoadingOfficers(false);
    }
  };

  const handleProvisionSubmit = async (e) => {
    e.preventDefault();
    setProvisionLoading(true);
    setProvisionStatus(null);

    try {
      const res = await api.post('/admin/officers/provision', {
        ...provisionForm,
        stationId: Number(provisionForm.stationId),
      });

      setProvisionStatus({
        success: true,
        message: `Officer provisioned successfully! Badge Number: ${res.data.data.badgeNumber}`,
        officer: res.data.data
      });

      setProvisionForm({
        fullName: '',
        phoneNumber: '',
        email: '',
        role: 'ROLE_SUB_INSPECTOR',
        stationId: stations[0]?.id || '',
        rankDesignation: 'Sub-Inspector / Investigating Officer',
        temporaryPassword: 'Police@' + Math.floor(1000 + Math.random() * 9000),
      });

      fetchOfficers();
    } catch (err) {
      setProvisionStatus({
        success: false,
        message: err.response?.data?.message || err.message || 'Provisioning failed',
      });
    } finally {
      setProvisionLoading(false);
    }
  };

  const isCitizen = !isOfficer();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-slate-50">
      {/* ============================================================== */}
      {/* 1. ROLE-SPECIFIC WELCOME BANNER                                */}
      {/* ============================================================== */}
      {isCitizen ? (
        // CITIZEN BANNER
        <div className="relative overflow-hidden rounded-2xl bg-white border border-amber-300 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-400 flex items-center justify-center flex-shrink-0 text-slate-950 shadow-sm border border-amber-300">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-extrabold text-slate-900">
                    Welcome, {user?.fullName}
                  </h1>
                  <span className="badge badge-success text-white text-xs font-bold py-2">
                    Verified Citizen
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Citizen Public Safety Desk • Direct e-FIR filing, live complaint tracking, and 112 SOS protection
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTabChange('FILE_COMPLAINT')}
                className="btn btn-warning btn-sm font-bold shadow-sm"
              >
                + File New e-FIR
              </button>
            </div>
          </div>
        </div>
      ) : (
        // POLICE OFFICER COMMAND BANNER
        <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 text-white p-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-400 flex items-center justify-center flex-shrink-0 text-slate-950 shadow-sm font-extrabold text-xl">
                🏛️
              </div>
              <div>
                <div className="flex items-center space-x-2 flex-wrap">
                  <h1 className="text-2xl font-extrabold text-white">
                    {user?.fullName}
                  </h1>
                  <span className="badge badge-warning text-slate-950 font-bold font-mono text-xs">
                    {user?.badgeNumber || 'POLICE-HQ'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-amber-300 border border-amber-400/40">
                    {user?.rankDesignation || user?.role}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                  <span>Thana: <strong>{user?.stationName || 'Headquarters'}</strong></span>
                  <span>•</span>
                  <span>System: <strong>CCTNS &amp; BSA 2023 Certified</strong></span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAdminOrSP() && (
                <button
                  onClick={() => setShowProvisionModal(true)}
                  className="btn btn-warning btn-sm font-bold text-slate-950 gap-1.5 shadow"
                >
                  <UserPlus className="w-4 h-4" />
                  Provision Officer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. ROLE-SPECIFIC NAVIGATION TABS                               */}
      {/* ============================================================== */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-2 overflow-x-auto pb-1" aria-label="Tabs">
          {isCitizen ? (
            // Citizen Tab Choices
            <>
              <button
                onClick={() => handleTabChange('MY_COMPLAINTS')}
                className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition ${
                  activeTab === 'MY_COMPLAINTS'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                My Filed Complaints &amp; e-FIRs
              </button>

              <button
                onClick={() => handleTabChange('FILE_COMPLAINT')}
                className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition ${
                  activeTab === 'FILE_COMPLAINT'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Shield className="w-4 h-4" />
                File e-FIR / Zero-FIR
              </button>

              <button
                onClick={() => handleTabChange('SOS_EMERGENCY')}
                className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition ${
                  activeTab === 'SOS_EMERGENCY'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-white text-red-600 hover:bg-red-50'
                }`}
              >
                <Radio className="w-4 h-4" />
                112 Emergency SOS
              </button>

              <button
                onClick={() => handleTabChange('AI_LEGAL_ASSIST')}
                className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition ${
                  activeTab === 'AI_LEGAL_ASSIST'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Scale className="w-4 h-4" />
                AI Legal Guide ("Rakshak")
              </button>

              <button
                onClick={() => handleTabChange('CRIME_HOTSPOTS')}
                className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition ${
                  activeTab === 'CRIME_HOTSPOTS'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Flame className="w-4 h-4" />
                Public Safety Hotspot Map
              </button>
            </>
          ) : (
            // Police Personnel Tab Choices
            <>
              {isAdminOrSP() && (
                <button
                  onClick={() => handleTabChange('EXECUTIVE_COMMAND')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition ${
                    activeTab === 'EXECUTIVE_COMMAND'
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Award className="w-4 h-4 text-amber-800" />
                  State HQ Command &amp; GIS
                </button>
              )}

              {isShoOrAbove() && (
                <button
                  onClick={() => handleTabChange('THANA_DESK')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition ${
                    activeTab === 'THANA_DESK'
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Building className="w-4 h-4 text-amber-800" />
                  SHO Thana Desk (FIR Approval)
                </button>
              )}

              {isIo() && (
                <button
                  onClick={() => handleTabChange('IO_WORKSPACE')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition ${
                    activeTab === 'IO_WORKSPACE'
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-amber-800" />
                  IO Case Diary &amp; Chargesheet
                </button>
              )}

              <button
                onClick={() => handleTabChange('SOS_DISPATCH')}
                className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition ${
                  activeTab === 'SOS_DISPATCH'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-white text-red-600 hover:bg-red-50'
                }`}
              >
                <Radio className="w-4 h-4" />
                Station 112 SOS Dispatch
              </button>

              <button
                onClick={() => handleTabChange('DEMS_EVIDENCE')}
                className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition ${
                  activeTab === 'DEMS_EVIDENCE'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FolderLock className="w-4 h-4 text-amber-800" />
                DEMS Evidence Locker (BSA 2023)
              </button>

              <button
                onClick={() => handleTabChange('CRIME_HOTSPOTS')}
                className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition ${
                  activeTab === 'CRIME_HOTSPOTS'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Flame className="w-4 h-4 text-amber-800" />
                DBSCAN Hotspots &amp; Analytics
              </button>

              <button
                onClick={() => handleTabChange('AI_ANALYZER')}
                className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition ${
                  activeTab === 'AI_ANALYZER'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Scale className="w-4 h-4 text-amber-800" />
                BNS Legal Section Triage
              </button>
            </>
          )}
        </nav>
      </div>

      {/* ============================================================== */}
      {/* 3. ACTIVE TAB VIEW CONTENT                                     */}
      {/* ============================================================== */}
      <div className="space-y-6">
        {/* CITIZEN VIEWS */}
        {isCitizen && (
          <>
            {(activeTab === 'MY_COMPLAINTS' || !activeTab) && (
              <CitizenComplaintsList onNewComplaintClick={() => handleTabChange('FILE_COMPLAINT')} />
            )}
            {activeTab === 'FILE_COMPLAINT' && (
              <ComplaintRegistrationWidget onComplaintCreated={() => handleTabChange('MY_COMPLAINTS')} />
            )}
            {(activeTab === 'SOS_EMERGENCY' || activeTab === 'SOS_CITIZEN') && (
              <SosEmergencyWidget />
            )}
            {(activeTab === 'AI_LEGAL_ASSIST' || activeTab === 'AI_ADVISOR') && (
              <ComplaintAiAnalyzer />
            )}
            {(activeTab === 'CRIME_HOTSPOTS' || activeTab === 'SAFETY_MAP') && (
              <CrimeHotspotsWidget />
            )}
          </>
        )}

        {/* POLICE PERSONNEL VIEWS */}
        {!isCitizen && (
          <>
            {activeTab === 'EXECUTIVE_COMMAND' && isAdminOrSP() && (
              <ExecutiveCommandCenter />
            )}
            {activeTab === 'THANA_DESK' && isShoOrAbove() && (
              <ShoConsoleWidget stationId={user?.stationId} />
            )}
            {activeTab === 'IO_WORKSPACE' && isIo() && (
              <IoInvestigationWorkspace />
            )}
            {activeTab === 'SOS_DISPATCH' && (
              <StationSosConsoleWidget stationId={user?.stationId} />
            )}
            {(activeTab === 'DEMS_EVIDENCE' || activeTab === 'EVIDENCE_LOCKER') && (
              <EvidenceManagementWidget />
            )}
            {(activeTab === 'CRIME_HOTSPOTS' || activeTab === 'SAFETY_MAP') && (
              <CrimeHotspotsWidget />
            )}
            {(activeTab === 'AI_ANALYZER' || activeTab === 'AI_LEGAL_ASSIST' || activeTab === 'AI_ADVISOR') && (
              <ComplaintAiAnalyzer />
            )}
          </>
        )}
      </div>

      {/* ============================================================== */}
      {/* 4. MODAL: OFFICER PROVISIONING (FOR SP / DGP / ADMIN)           */}
      {/* ============================================================== */}
      {showProvisionModal && isAdminOrSP() && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-amber-300 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-slate-900">
                  Provision Police Officer (CCTNS)
                </h3>
              </div>
              <button
                onClick={() => setShowProvisionModal(false)}
                className="btn btn-sm btn-circle btn-ghost"
              >
                ✕
              </button>
            </div>

            {provisionStatus && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${provisionStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                {provisionStatus.message}
              </div>
            )}

            <form onSubmit={handleProvisionSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={provisionForm.fullName}
                  onChange={(e) => setProvisionForm({ ...provisionForm, fullName: e.target.value })}
                  className="input input-bordered input-sm w-full bg-slate-50 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    required
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={provisionForm.phoneNumber}
                    onChange={(e) => setProvisionForm({ ...provisionForm, phoneNumber: e.target.value })}
                    className="input input-bordered input-sm w-full bg-slate-50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
                  <input
                    required
                    type="email"
                    placeholder="officer@police.gov.in"
                    value={provisionForm.email}
                    onChange={(e) => setProvisionForm({ ...provisionForm, email: e.target.value })}
                    className="input input-bordered input-sm w-full bg-slate-50 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department Role</label>
                  <select
                    value={provisionForm.role}
                    onChange={(e) => {
                      const role = e.target.value;
                      let desig = 'Police Officer';
                      if (role === 'ROLE_CONSTABLE') desig = 'Beat Constable';
                      if (role === 'ROLE_HEAD_CONSTABLE') desig = 'Head Constable';
                      if (role === 'ROLE_ASI') desig = 'Assistant Sub-Inspector';
                      if (role === 'ROLE_SUB_INSPECTOR') desig = 'Sub-Inspector / Investigating Officer';
                      if (role === 'ROLE_SHO') desig = 'Station House Officer (SHO)';
                      if (role === 'ROLE_SP_SSP') desig = 'Superintendent of Police';
                      setProvisionForm({ ...provisionForm, role, rankDesignation: desig });
                    }}
                    className="select select-bordered select-sm w-full bg-slate-50 text-xs"
                  >
                    <option value="ROLE_CONSTABLE">Constable</option>
                    <option value="ROLE_HEAD_CONSTABLE">Head Constable</option>
                    <option value="ROLE_ASI">Assistant Sub-Inspector</option>
                    <option value="ROLE_SUB_INSPECTOR">Sub-Inspector (IO)</option>
                    <option value="ROLE_SHO">Station House Officer (SHO)</option>
                    <option value="ROLE_SP_SSP">Superintendent of Police (SP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Police Station</label>
                  <select
                    value={provisionForm.stationId}
                    onChange={(e) => setProvisionForm({ ...provisionForm, stationId: e.target.value })}
                    className="select select-bordered select-sm w-full bg-slate-50 text-xs"
                  >
                    {stations.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.stationName} ({st.stationCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Password</label>
                <input
                  required
                  type="text"
                  value={provisionForm.temporaryPassword}
                  onChange={(e) => setProvisionForm({ ...provisionForm, temporaryPassword: e.target.value })}
                  className="input input-bordered input-sm w-full bg-slate-50 text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProvisionModal(false)}
                  className="btn btn-sm btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={provisionLoading}
                  className="btn btn-sm btn-warning font-bold text-xs"
                >
                  {provisionLoading ? 'Provisioning...' : 'Provision Officer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
