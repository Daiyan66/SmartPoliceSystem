import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Phone, UserCheck, AlertCircle, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('citizen'); // 'citizen' | 'officer'

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(identifier, password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  const setDemoCredentials = (id, pass) => {
    setIdentifier(id);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-[calc(100vh-4.25rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 shadow-xl mb-4 border-2 border-amber-300/30">
            <Shield className="w-9 h-9 text-slate-950 font-bold" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Smart Police Authentication</h2>
          <p className="text-sm text-slate-400 mt-1">
            Indian Police Service &amp; Public Safety Network (BNS &amp; BNSS Aligned)
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-800/80 p-1 rounded-xl mb-6 flex border border-slate-700/60 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setActiveTab('citizen');
              setDemoCredentials('9988776655', 'Citizen@123');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'citizen'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Citizen Portal
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('officer');
              setDemoCredentials('9876543211', 'Police@123');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'officer'
                ? 'bg-slate-700 text-amber-300 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Police Personnel
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/60 shadow-2xl p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-900/30 border border-red-700/50 flex items-start space-x-3 text-red-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
              <div className="text-sm font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                {activeTab === 'citizen' ? 'Mobile Number or Email' : 'Badge Number / Mobile / Email'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={activeTab === 'citizen' ? "e.g. 9988776655" : "e.g. IPS-SP-002 or 9876543211"}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secure password"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 shadow-lg hover:shadow-amber-500/20 transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Sign In to Portal</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Fast Demo Sign In (Phase 1 Testing):
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDemoCredentials('9876543210', 'Police@123')}
                className="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-700/80 text-left transition text-slate-300 hover:text-amber-300"
              >
                <div className="font-bold text-amber-400">DGP (State Head)</div>
                <div className="text-[10px] text-slate-400">9876543210</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('9876543211', 'Police@123')}
                className="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-700/80 text-left transition text-slate-300 hover:text-amber-300"
              >
                <div className="font-bold text-amber-400">District SP</div>
                <div className="text-[10px] text-slate-400">9876543211</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('9876543212', 'Police@123')}
                className="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-700/80 text-left transition text-slate-300 hover:text-amber-300"
              >
                <div className="font-bold text-sky-400">SHO (Inspector)</div>
                <div className="text-[10px] text-slate-400">9876543212</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('9988776655', 'Citizen@123')}
                className="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-700/80 text-left transition text-slate-300 hover:text-emerald-300"
              >
                <div className="font-bold text-emerald-400">Citizen Account</div>
                <div className="text-[10px] text-slate-400">9988776655</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Are you a citizen without an account?{' '}
          <Link to="/register" className="text-amber-400 font-semibold hover:underline">
            Register Citizen Account
          </Link>
        </p>
      </div>
    </div>
  );
}
