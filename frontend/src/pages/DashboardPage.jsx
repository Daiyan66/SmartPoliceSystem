import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Shield, UserPlus, Building, Phone, Award, CheckCircle, 
  AlertTriangle, Radio, FileText, MapPin, Database, Cpu, Activity, RefreshCw 
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isOfficer, isAdminOrSP } = useAuth();

  // State for stations
  const [stations, setStations] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loadingOfficers, setLoadingOfficers] = useState(false);

  // State for officer provisioning form
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

  // Backend & Python health
  const [backendHealth, setBackendHealth] = useState(null);
  const [pythonHealth, setPythonHealth] = useState(null);

  useEffect(() => {
    fetchStations();
    checkHealth();
    if (isAdminOrSP()) {
      fetchOfficers();
    }
  }, [user]);

  const fetchStations = async () => {
    try {
      const res = await api.get('/public/stations');
      if (res.data && res.data.data) {
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
      if (res.data && res.data.data) {
        setOfficers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch officers:', err);
    } finally {
      setLoadingOfficers(false);
    }
  };

  const checkHealth = async () => {
    try {
      const res = await api.get('/public/health');
      setBackendHealth(res.data.data);
    } catch (err) {
      setBackendHealth({ status: 'OFFLINE' });
    }

    try {
      const pyRes = await fetch('http://localhost:8000/health');
      const pyData = await pyRes.json();
      setPythonHealth(pyData);
    } catch (err) {
      setPythonHealth({ status: 'STANDALONE_AVAILABLE' });
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

      // Reset form
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-police-900 border border-slate-700/80 p-6 sm:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0 text-amber-400">
              <Shield className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {user?.fullName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {user?.role?.replace('ROLE_', '')}
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1 flex items-center space-x-2">
                <span>{user?.rankDesignation || (isOfficer() ? 'Police Personnel' : 'Citizen User')}</span>
                {user?.badgeNumber && (
                  <span className="bg-slate-800 text-amber-200 px-2 py-0.5 rounded text-xs font-mono">
                    Badge: {user.badgeNumber}
                  </span>
                )}
                {user?.stationName && (
                  <span className="text-slate-400">| Station: {user.stationName}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={checkHealth}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center space-x-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Status</span>
            </button>

            {isAdminOrSP() && (
              <button
                onClick={() => setShowProvisionModal(true)}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 flex items-center space-x-2 shadow-lg transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>Provision Police Officer</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* System Infrastructure Architecture Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Backend Status */}
        <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/60 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Java Backend</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-white flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Spring Boot 3.3.4</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Java 21 / Stateless JWT</div>
        </div>

        {/* Database Status */}
        <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/60 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Database</span>
            <Database className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-lg font-bold text-white flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>MySQL 8.0 (Spatial)</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">smart_police_db / SRID 4326</div>
        </div>

        {/* Python Forensic Service */}
        <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/60 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Python Intelligence</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-white flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>FastAPI 0.115</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">BNS Legal Map &amp; EXIF Scrub</div>
        </div>

        {/* Security Zero-Trust */}
        <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/60 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Security Architecture</span>
            <Shield className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-white flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>Zero-Trust RBAC</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Bucket4j Rate-Limited (429)</div>
        </div>
      </div>

      {/* Role-Specific Operation Modules */}
      {isAdminOrSP() && (
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>Executive Command: Provisioned Department Personnel</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Authorized under District SP / State DGP command chain (CCTNS Personnel Ledger)
              </p>
            </div>
            <button
              onClick={() => setShowProvisionModal(true)}
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 transition"
            >
              + New Officer
            </button>
          </div>

          {loadingOfficers ? (
            <div className="py-8 text-center text-slate-400">Loading department personnel...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase bg-slate-900/80 text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Badge Number</th>
                    <th className="px-4 py-3">Officer Name</th>
                    <th className="px-4 py-3">Rank / Designation</th>
                    <th className="px-4 py-3">Official Role</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Police Station</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {officers.map((officer) => (
                    <tr key={officer.id} className="hover:bg-slate-700/30 transition">
                      <td className="px-4 py-3 font-mono font-bold text-amber-300">
                        {officer.badgeNumber || 'PENDING'}
                      </td>
                      <td className="px-4 py-3 font-medium text-white">{officer.fullName}</td>
                      <td className="px-4 py-3 text-slate-300">{officer.rankDesignation || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-700 text-slate-200">
                          {officer.role.replace('ROLE_', '')}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{officer.phoneNumber}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {officer.station?.stationName || 'Headquarters'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center text-xs text-emerald-400 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Police Stations Active Directory */}
      <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <Building className="w-5 h-5 text-amber-400" />
          <span>Active Jurisdictional Police Stations (MySQL Spatial Registered)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stations.map((st) => (
            <div key={st.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/70 hover:border-amber-500/50 transition">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">{st.stationName}</h4>
                  <div className="text-xs text-amber-400 font-mono mt-0.5">{st.stationCode}</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ONLINE
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-3 space-y-1">
                <div><span className="text-slate-500">District:</span> {st.district}, {st.state}</div>
                <div><span className="text-slate-500">In-Charge:</span> {st.inChargeName || 'SHO'}</div>
                <div><span className="text-slate-500">Contact:</span> {st.contactNumber}</div>
                <div className="text-[11px] font-mono text-slate-500">
                  GPS: {st.latitude.toFixed(4)}° N, {st.longitude.toFixed(4)}° E
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Provision Officer Modal */}
      {showProvisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <span>Administrative Officer Provisioning</span>
              </h3>
              <button
                onClick={() => {
                  setShowProvisionModal(false);
                  setProvisionStatus(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {provisionStatus && (
              <div
                className={`p-4 rounded-xl text-xs font-medium border ${
                  provisionStatus.success
                    ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                    : 'bg-red-950/40 border-red-600/50 text-red-200'
                }`}
              >
                {provisionStatus.message}
              </div>
            )}

            <form onSubmit={handleProvisionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={provisionForm.fullName}
                  onChange={(e) => setProvisionForm({ ...provisionForm, fullName: e.target.value })}
                  placeholder="e.g. Sub-Inspector Vikram Gaikwad"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Official Mobile</label>
                  <input
                    type="tel"
                    required
                    value={provisionForm.phoneNumber}
                    onChange={(e) => setProvisionForm({ ...provisionForm, phoneNumber: e.target.value })}
                    placeholder="10-digit mobile"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Official Email</label>
                  <input
                    type="email"
                    value={provisionForm.email}
                    onChange={(e) => setProvisionForm({ ...provisionForm, email: e.target.value })}
                    placeholder="name@police.gov.in"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Department Role</label>
                  <select
                    value={provisionForm.role}
                    onChange={(e) => setProvisionForm({ ...provisionForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="ROLE_CONSTABLE">Constable</option>
                    <option value="ROLE_HEAD_CONSTABLE">Head Constable</option>
                    <option value="ROLE_ASI">Assistant Sub-Inspector</option>
                    <option value="ROLE_SUB_INSPECTOR">Sub-Inspector (IO)</option>
                    <option value="ROLE_SHO">Station House Officer (SHO)</option>
                    <option value="ROLE_DSP_ASP">DSP / Assistant SP</option>
                    <option value="ROLE_SP_SSP">Superintendent of Police</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Posting Station</label>
                  <select
                    value={provisionForm.stationId}
                    onChange={(e) => setProvisionForm({ ...provisionForm, stationId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    {stations.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.stationName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Temporary Initial Password</label>
                <input
                  type="text"
                  required
                  value={provisionForm.temporaryPassword}
                  onChange={(e) => setProvisionForm({ ...provisionForm, temporaryPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-amber-300 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Officer will be prompted to change password upon initial login.
                </span>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowProvisionModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={provisionLoading}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow transition"
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
