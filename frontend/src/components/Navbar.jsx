import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, ShieldAlert, LogOut, User, Building, Award } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isOfficer } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800 shadow-xl">
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
            <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-700 rounded-lg shadow-lg group-hover:scale-105 transition-transform">
              <Shield className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold tracking-wide text-lg text-white">SMART POLICE</span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  CCTNS &amp; BNS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">State Police &amp; Citizen Safety Portal</p>
            </div>
          </Link>

          {/* Right Navigation */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {/* User Role Badge */}
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-semibold text-slate-200 flex items-center justify-end space-x-1">
                    {isOfficer() ? (
                      <>
                        <Award className="w-4 h-4 text-amber-400 inline" />
                        <span className="text-amber-300">{user.rankDesignation || user.role}</span>
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4 text-emerald-400 inline" />
                        <span>{user.fullName}</span>
                      </>
                    )}
                  </span>
                  <div className="text-xs text-slate-400 flex items-center justify-end space-x-2">
                    {user.badgeNumber && (
                      <span className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-200 font-mono text-[10px]">
                        {user.badgeNumber}
                      </span>
                    )}
                    {user.stationName && (
                      <span className="flex items-center">
                        <Building className="w-3 h-3 mr-1 text-slate-500" />
                        {user.stationName}
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  to="/dashboard"
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                >
                  Dashboard
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition"
                >
                  Citizen Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
