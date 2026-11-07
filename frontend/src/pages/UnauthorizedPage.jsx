import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[calc(100vh-4.25rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-slate-800/60 p-8 rounded-2xl border border-red-500/30 shadow-2xl">
        <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-500/30">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">403 Access Prohibited</h1>
          <p className="text-sm text-slate-400 mt-2">
            You do not possess the required departmental police rank or administrative clearance to access this module.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
