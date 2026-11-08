import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, AlertOctagon, FileText, Search, Sparkles, 
  PhoneCall, CheckCircle, MapPin, Globe, ArrowRight 
} from 'lucide-react';
import SosEmergencyWidget from '../components/SosEmergencyWidget';
import ComplaintRegistrationWidget from '../components/ComplaintRegistrationWidget';
import CrimeHotspotsWidget from '../components/CrimeHotspotsWidget';
import GuestTrackingModal from '../components/GuestTrackingModal';

export default function CitizenPortalPage() {
  const { user, isOfficer } = useAuth();
  const [lang, setLang] = useState('en'); // 'en' or 'hi'
  const [showTrackModal, setShowTrackModal] = useState(false);

  const t = {
    en: {
      heroBadge: 'Bharatiya Nyaya Sanhita (BNS) & BNSS 2023 Aligned • CCTNS Portal',
      heroTitle: 'Smart Police & Citizen Public Safety Portal',
      heroSubtitle: 'Direct citizen access to digital e-FIR filing, real-time 112 emergency dispatch, forensic evidence custody under BSA 2023, and 24/7 AI legal assistance.',
      emergencySos: 'Emergency SOS',
      fileFir: 'File e-FIR / Zero-FIR',
      trackStatus: 'Track FIR Status',
      dashboardBtn: 'Go to Command Dashboard',
      loginBtn: 'Citizen Sign In',
      registerBtn: 'Citizen Register',
      helpline112: '112 Emergency Dispatch',
      helpline1090: '1090 Women Helpline',
      helpline1930: '1930 Cyber Fraud Helpline',
      featuresTitle: 'Government-Grade Public Safety Architecture',
    },
    hi: {
      heroBadge: 'भारतीय न्याय संहिता (BNS) एवं नागरिक सुरक्षा संहिता (BNSS) 2023 • CCTNS पोर्टल',
      heroTitle: 'स्मार्ट पुलिस एवं नागरिक जन सुरक्षा पोर्टल',
      heroSubtitle: 'ऑनलाइन ई-एफआईआर, तत्काल 112 आपातकालीन सहायता, साक्ष्य सुरक्षा (BSA 2023) और 24/7 कृत्रिम बुद्धिमत्ता (AI) कानूनी मार्गदर्शन।',
      emergencySos: 'आपातकालीन एसओएस',
      fileFir: 'ई-एफआईआर दर्ज करें',
      trackStatus: 'शिकायत की स्थिति जांचें',
      dashboardBtn: 'कमांड डैशबोर्ड पर जाएं',
      loginBtn: 'नागरिक लॉगिन',
      registerBtn: 'नागरिक पंजीकरण',
      helpline112: '112 राष्ट्रीय आपातकाल',
      helpline1090: '1090 महिला हेल्पलाइन',
      helpline1930: '1930 साइबर अपराध हेल्पलाइन',
      featuresTitle: 'सरकारी स्तर की लोक सुरक्षा प्रणाली',
    }
  }[lang];

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Banner with Tiranga Indian Colors & Language Switcher */}
      <section className="relative overflow-hidden bg-white border-b border-amber-200/80 shadow-sm pt-8 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Top Bar: Language Switcher */}
          <div className="flex items-center justify-between">
            <span className="badge badge-warning text-xs font-bold py-2.5 px-3">
              {t.heroBadge}
            </span>

            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-600" />
              <button
                onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
                className="btn btn-xs btn-outline btn-warning font-bold"
              >
                {lang === 'en' ? 'हिंदी में देखें (Hindi)' : 'English'}
              </button>
            </div>
          </div>

          {/* Hero Content */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {t.heroTitle}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {t.heroSubtitle}
            </p>

            {/* Quick Action Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {user ? (
                <Link
                  to="/dashboard"
                  className="btn btn-warning font-bold shadow-md gap-2"
                >
                  <Shield className="w-4 h-4" />
                  {t.dashboardBtn}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="btn btn-warning font-bold shadow-md text-slate-950"
                  >
                    {t.loginBtn}
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-outline btn-neutral font-semibold"
                  >
                    {t.registerBtn}
                  </Link>
                </>
              )}

              <button
                onClick={() => setShowTrackModal(true)}
                className="btn btn-outline btn-warning font-bold gap-1.5"
              >
                <Search className="w-4 h-4" />
                {t.trackStatus}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Real-Time 112 Emergency SOS Dispatch */}
        <section>
          <SosEmergencyWidget />
        </section>

        {/* e-FIR / Zero-FIR Complaint Filing Wizard */}
        <section>
          <ComplaintRegistrationWidget />
        </section>

        {/* Spatial Crime Hotspots & Heatmap Analytics */}
        <section>
          <CrimeHotspotsWidget />
        </section>
      </div>

      {/* IDOR-Safe Guest Tracking Modal */}
      <GuestTrackingModal isOpen={showTrackModal} onClose={() => setShowTrackModal(false)} />
    </div>
  );
}
