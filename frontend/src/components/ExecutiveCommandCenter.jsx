import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Award, Shield, Building, TrendingUp, AlertOctagon, 
  Users, MapPin, Eye, FileText, CheckCircle2, Flame, Search 
} from 'lucide-react';
import InteractiveCrimeMap from './InteractiveCrimeMap';

export default function ExecutiveCommandCenter() {
  const [stations, setStations] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [trends, setTrends] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExecutiveData();
  }, []);

  const loadExecutiveData = async () => {
    setLoading(true);
    try {
      const [stRes, clRes, sosRes, trRes, ofRes] = await Promise.all([
        api.get('/public/stations').catch(() => ({ data: { data: [] } })),
        api.get('/analytics/hotspots?epsMeters=800&minPoints=2').catch(() => ({ data: { data: [] } })),
        api.get('/sos/active').catch(() => ({ data: { data: [] } })),
        api.get('/analytics/temporal-trends').catch(() => ({ data: { data: null } })),
        api.get('/admin/officers').catch(() => ({ data: { data: [] } }))
      ]);

      if (stRes.data?.data) setStations(stRes.data.data);
      if (clRes.data?.data) setClusters(clRes.data.data);
      if (sosRes.data?.data) setSosAlerts(sosRes.data.data);
      if (trRes.data?.data) setTrends(trRes.data.data);
      if (ofRes.data?.data) setOfficers(ofRes.data.data);
    } catch (err) {
      console.warn('Failed to load executive data:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalIncidents = trends?.totalIncidents || 0;
  const criticalClusters = clusters.filter(c => c.riskLevel === 'CRITICAL' || c.riskLevel === 'HIGH').length;

  return (
    <div className="bg-white rounded-2xl border border-amber-300/90 shadow-md p-6 space-y-6">
      {/* Executive Command Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              State Police Executive Command &amp; Strategic Oversight Desk
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Superintendent of Police (SP / SSP) &amp; Director General of Police (DGP) CCTNS Command Level
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-warning text-xs font-bold py-3 px-3">
            State HQ Clearance: Active
          </span>
        </div>
      </div>

      {/* Strategic KPI Metric Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-slate-500 text-xs font-bold uppercase flex items-center justify-between">
            <span>Jurisdiction Thanas</span>
            <Building className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {stations.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Active Police Stations</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-slate-500 text-xs font-bold uppercase flex items-center justify-between">
            <span>Total Crimes Logged</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {totalIncidents}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">CCTNS FIR Registry</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-slate-500 text-xs font-bold uppercase flex items-center justify-between">
            <span>Critical Hotspots</span>
            <Flame className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono mt-1">
            {criticalClusters}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">High / Critical DBSCAN Zones</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-slate-500 text-xs font-bold uppercase flex items-center justify-between">
            <span>Active SOS Distresses</span>
            <AlertOctagon className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-600 font-mono mt-1">
            {sosAlerts.filter(s => s.status === 'ACTIVE').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Live Emergency Beacons</div>
        </div>
      </div>

      {/* Interactive GIS Command Map */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-amber-500" />
            <span>Interactive Department GIS Map: Stations, Clusters &amp; Active SOS Beacons</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-800 inline-block"></span> Thana HQ
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-600 inline-block"></span> High-Risk Cluster
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span> Property Hotspot
            </span>
          </div>
        </div>

        <InteractiveCrimeMap
          stations={stations}
          clusters={clusters}
          sosAlerts={sosAlerts}
        />
      </div>

      {/* Stations Overview & Police Deployment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Police Station Ledger */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center justify-between">
            <span>Police Stations (Thanas) in Jurisdiction</span>
            <span className="badge badge-sm badge-neutral">{stations.length} Active</span>
          </h3>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {stations.map((st) => (
              <div key={st.id} className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{st.stationName}</span>
                  <span className="font-mono text-amber-800 text-[11px]">{st.stationCode}</span>
                </div>
                <div className="text-slate-600 text-[11px] flex justify-between">
                  <span>District: <strong>{st.district}</strong>, {st.state}</span>
                  <span>Contact: <strong>{st.contactNumber}</strong></span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Station House Officer (SHO): <strong>{st.inChargeName || 'Inspector In-Charge'}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Personnel & Roster Stats */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center justify-between">
            <span>Field Officer Roster &amp; Deployments</span>
            <span className="badge badge-sm badge-warning font-bold">{officers.length} Provisioned</span>
          </h3>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {officers.map((of) => (
              <div key={of.id} className="p-3 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{of.fullName}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Badge: {of.badgeNumber} • {of.rankDesignation}
                  </div>
                </div>
                <div className="text-right">
                  <span className="badge badge-xs badge-neutral font-mono">{of.role?.replace('ROLE_', '')}</span>
                  <div className="text-[10px] text-slate-400 mt-1">{of.stationName || 'HQ Assigned'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
