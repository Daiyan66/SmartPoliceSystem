import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, LogOut, User, Building, Award, Search, 
  FileText, PlusCircle, Radio, Sparkles, MapPin, 
  Briefcase, BookOpen, Lock, BarChart3, Star, ArrowRightLeft
} from 'lucide-react';
import GuestTrackingModal from './GuestTrackingModal';

export default function Navbar() {
  const { user, login, logout, isOfficer, isShoOrAbove, isIo, isAdminOrSP } = useAuth();
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [switching, setSwitching] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleFastSwitch = async (phone, password, targetRoute) => {
    setSwitching(true);
    const res = await login(phone, password);
    setSwitching(false);
    if (res.success) {
      navigate(targetRoute);
    }
  };

  const isCitizen = user && user.role === 'ROLE_CITIZEN';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      {/* Tiranga Indian National Color Stripe */}
      <div className="h-1 w-full flex">
        <div className="h-full w-1/3 bg-[#FF9933]"></div>
        <div className="h-full w-1/3 bg-white"></div>
        <div className="h-full w-1/3 bg-[#138808]"></div>
      </div>

      {/* Quick Role Switcher Banner (Instant Role Preview for User) */}
      <div className="bg-slate-900 text-slate-200 px-4 py-1.5 text-xs border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-bold text-amber-400">
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Fast Persona Preview:</span>
            </span>
            <span className="hidden md:inline text-slate-400 text-[11px]">
              Switch instantly to test different interfaces:
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => handleFastSwitch('9988776644', 'Citizen@123', '/citizen/complaints')}
              disabled={switching}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition flex items-center gap-1 ${
                isCitizen
                  ? 'bg-emerald-500 text-slate-950 ring-1 ring-emerald-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="Citizen Rohan Gowda (Bengaluru)"
            >
              <span>👤 Citizen (Bengaluru)</span>
            </button>

            <button
              onClick={() => handleFastSwitch('9876543222', 'Police@123', '/officer/thana-desk')}
              disabled={switching}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition flex items-center gap-1 ${
                user?.role === 'ROLE_SHO'
                  ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="Inspector Manjunath Swamy, SHO Cubbon Park PS"
            >
              <span>👮 SHO (Cubbon Park)</span>
            </button>

            <button
              onClick={() => handleFastSwitch('9876543223', 'Police@123', '/officer/case-diary')}
              disabled={switching}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition flex items-center gap-1 ${
                user?.role === 'ROLE_SUB_INSPECTOR'
                  ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="SI Praveen Kumar, Investigating Officer"
            >
              <span>🕵️ IO (Sub-Inspector)</span>
            </button>

            <button
              onClick={() => handleFastSwitch('9876543220', 'Police@123', '/officer/command')}
              disabled={switching}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition flex items-center gap-1 ${
                user?.role === 'ROLE_SP_SSP' || user?.role === 'ROLE_DIG_DGP'
                  ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="Dr. Alok Mohan, IPS - DG & IGP, Karnataka State Police"
            >
              <span>🏛️ DGP (KSP) / CP</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="p-2 bg-amber-400 rounded-xl shadow group-hover:scale-105 transition-transform">
              <Shield className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold tracking-tight text-lg text-slate-900">SMART POLICE</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                  KSP &amp; ICJS Core
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Karnataka State Police &amp; Indian Police Service • Karnataka-First | India-Ready</p>
            </div>
          </Link>

          {/* Right Navigation */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowTrackModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 transition"
            >
              <Search className="w-3.5 h-3.5" />
              Track FIR / OTP
            </button>

            {user ? (
              <div className="flex items-center space-x-4">
                {/* User Role Badge */}
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-semibold text-slate-800 flex items-center justify-end space-x-1">
                    {isOfficer() ? (
                      <>
                        <Award className="w-4 h-4 text-amber-600 inline" />
                        <span className="text-slate-900 font-bold">{user.rankDesignation || user.role}</span>
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4 text-emerald-600 inline" />
                        <span className="text-slate-900 font-bold">{user.fullName}</span>
                      </>
                    )}
                  </span>
                  <div className="text-xs text-slate-500 flex items-center justify-end space-x-2">
                    {user.badgeNumber && (
                      <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold">
                        {user.badgeNumber}
                      </span>
                    )}
                    {user.stationName && (
                      <span className="flex items-center">
                        <Building className="w-3 h-3 mr-1 text-slate-400" />
                        {user.stationName}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-xs font-bold text-slate-700 hover:text-slate-950 px-3.5 py-2 rounded-lg hover:bg-slate-100 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 px-4 py-2 rounded-lg shadow-sm hover:shadow transition"
                >
                  Citizen Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Multi-View Navigation Ribbon */}
      {user && (
        <div className={`${isCitizen ? 'bg-amber-50/80 border-t border-amber-200' : 'bg-slate-900 border-t border-slate-800 text-white'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2 text-xs font-bold scrollbar-none">
              {isCitizen ? (
                // Citizen Portal Tabs
                <>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-800 px-2 flex items-center gap-1 border-r border-amber-200 mr-1">
                    <Shield className="w-3 h-3" /> Citizen Desk:
                  </span>
                  <Link
                    to="/citizen/complaints"
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap ${
                      location.pathname === '/citizen/complaints' || (location.pathname === '/dashboard' && location.search.includes('MY_COMPLAINTS'))
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'text-slate-700 hover:bg-amber-100'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    My Complaints
                  </Link>

                  <Link
                    to="/citizen/file-fir"
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap ${
                      location.pathname === '/citizen/file-fir' || (location.pathname === '/dashboard' && location.search.includes('FILE_COMPLAINT'))
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'text-slate-700 hover:bg-amber-100'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    File e-FIR / Zero-FIR
                  </Link>

                  <Link
                    to="/citizen/sos"
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap ${
                      location.pathname === '/citizen/sos' || (location.pathname === '/dashboard' && location.search.includes('SOS_CITIZEN'))
                        ? 'bg-red-500 text-white shadow-sm'
                        : 'text-red-700 hover:bg-red-50'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5" />
                    112 SOS Distress
                  </Link>

                  <Link
                    to="/citizen/rakshak-ai"
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap ${
                      location.pathname === '/citizen/rakshak-ai' || (location.pathname === '/dashboard' && location.search.includes('AI_ADVISOR'))
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'text-slate-700 hover:bg-amber-100'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Rakshak AI Legal Guide
                  </Link>

                  <Link
                    to="/citizen/safety-map"
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap ${
                      location.pathname === '/citizen/safety-map' || (location.pathname === '/dashboard' && location.search.includes('SAFETY_MAP'))
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'text-slate-700 hover:bg-amber-100'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Public Safety Map
                  </Link>
                </>
              ) : (
                // Police Personnel Tactical Tabs
                <>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-400 px-2 flex items-center gap-1 border-r border-slate-700 mr-1">
                    <Award className="w-3 h-3 text-amber-400" /> Police Desk:
                  </span>

                  {isShoOrAbove() && (
                    <Link
                      to="/officer/thana-desk"
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap ${
                        location.pathname === '/officer/thana-desk' || (location.pathname === '/dashboard' && location.search.includes('THANA_DESK'))
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                      Thana Desk (SHO)
                    </Link>
                  )}

                  {isIo() && (
                    <Link
                      to="/officer/case-diary"
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap ${
                        location.pathname === '/officer/case-diary' || (location.pathname === '/dashboard' && location.search.includes('IO_WORKSPACE'))
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                      Case Diary &amp; IO Desk
                    </Link>
                  )}

                  <Link
                    to="/officer/dispatch"
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap ${
                      location.pathname === '/officer/dispatch' || (location.pathname === '/dashboard' && location.search.includes('SOS_DISPATCH'))
                        ? 'bg-red-500 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5 text-red-400" />
                    112 CAD Dispatch
                  </Link>

                  <Link
                    to="/officer/evidence"
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap ${
                      location.pathname === '/officer/evidence' || (location.pathname === '/dashboard' && location.search.includes('EVIDENCE_LOCKER'))
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    DEMS Evidence Vault
                  </Link>

                  <Link
                    to="/officer/analytics"
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap ${
                      location.pathname === '/officer/analytics' || (location.pathname === '/dashboard' && location.search.includes('CRIME_HOTSPOTS'))
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                    DBSCAN Analytics
                  </Link>

                  {isAdminOrSP() && (
                    <Link
                      to="/officer/command"
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap ${
                        location.pathname === '/officer/command' || (location.pathname === '/dashboard' && location.search.includes('EXECUTIVE_COMMAND'))
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'text-amber-300 hover:bg-slate-800'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      HQ Command
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <GuestTrackingModal isOpen={showTrackModal} onClose={() => setShowTrackModal(false)} />
    </header>
  );
}
