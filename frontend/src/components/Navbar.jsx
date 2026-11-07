import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, User, Building, Award, Search } from 'lucide-react';
import GuestTrackingModal from './GuestTrackingModal';

export default function Navbar() {
  const { user, logout, isOfficer } = useAuth();
  const [showTrackModal, setShowTrackModal] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      {/* Tiranga Indian National Color Stripe */}
      <div className="h-1 w-full flex">
        <div className="h-full w-1/3 bg-[#FF9933]"></div>
        <div className="h-full w-1/3 bg-white"></div>
        <div className="h-full w-1/3 bg-[#138808]"></div>
      </div>

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
                  CCTNS &amp; BSA 2023
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">State Police &amp; Citizen Public Safety Network</p>
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

                <Link
                  to="/dashboard"
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
                >
                  Dashboard
                </Link>

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
      <GuestTrackingModal isOpen={showTrackModal} onClose={() => setShowTrackModal(false)} />
    </header>
  );
}
