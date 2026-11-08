import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Flame, MapPin, Compass, AlertTriangle, ShieldAlert, 
  Clock, Sun, Moon, Sunrise, Sunset, BarChart3, RefreshCw 
} from 'lucide-react';

export default function CrimeHotspotsWidget() {
  const [clusters, setClusters] = useState([]);
  const [temporalTrends, setTemporalTrends] = useState(null);
  const [loading, setLoading] = useState(false);
  const [epsMeters, setEpsMeters] = useState(500);
  const [minPoints, setMinPoints] = useState(3);
  const [selectedCluster, setSelectedCluster] = useState(null);

  useEffect(() => {
    fetchHotspots();
    fetchTrends();
  }, []);

  const fetchHotspots = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/analytics/hotspots?epsMeters=${epsMeters}&minPoints=${minPoints}`);
      if (res.data?.data) {
        setClusters(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedCluster(res.data.data[0]);
        }
      }
    } catch (err) {
      console.warn('Failed to compute crime hotspots:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrends = async () => {
    try {
      const res = await api.get('/analytics/temporal-trends');
      if (res.data?.data) {
        setTemporalTrends(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load temporal trends:', err);
    }
  };

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchHotspots();
  };

  return (
    <div className="bg-white rounded-2xl border border-amber-200/80 shadow-md p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Flame className="w-6 h-6 text-amber-600" />
            Geospatial Crime Hotspots &amp; DBSCAN Analytics
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Spherical Haversine Density-Based Clustering • Predicts Risk Levels, Hotspot Centroids &amp; Temporal Patterns
          </p>
        </div>

        <form onSubmit={handleApplyFilter} className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-medium">Radius:</span>
            <select
              value={epsMeters}
              onChange={(e) => setEpsMeters(Number(e.target.value))}
              className="select select-bordered select-xs bg-slate-50 font-mono"
            >
              <option value="300">300m</option>
              <option value="500">500m</option>
              <option value="1000">1 km</option>
              <option value="2000">2 km</option>
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-medium">Min Incidents:</span>
            <select
              value={minPoints}
              onChange={(e) => setMinPoints(Number(e.target.value))}
              className="select select-bordered select-xs bg-slate-50 font-mono"
            >
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="5">5</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-xs btn-warning font-bold gap-1 shadow-sm"
          >
            <RefreshCw className="w-3 h-3" />
            Re-Cluster
          </button>
        </form>
      </div>

      {/* Temporal Incident Trend Strip */}
      {temporalTrends && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-100 text-amber-800">
              <Sunrise className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Morning (06-12)</span>
              <span className="text-base font-extrabold text-slate-900 font-mono">{temporalTrends.morningCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-sky-100 text-sky-800">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Afternoon (12-18)</span>
              <span className="text-base font-extrabold text-slate-900 font-mono">{temporalTrends.afternoonCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-orange-100 text-orange-800">
              <Sunset className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Evening (18-22)</span>
              <span className="text-base font-extrabold text-slate-900 font-mono">{temporalTrends.eveningCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-100 text-purple-800">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Late Night (22-06)</span>
              <span className="text-base font-extrabold text-slate-900 font-mono">{temporalTrends.lateNightCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Hotspots Section */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Computing spatial Haversine clusters...</div>
      ) : clusters.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          No dense crime clusters detected with current parameters (Radius: {epsMeters}m, Min: {minPoints}).
          Incidents are geographically dispersed.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Clusters List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex justify-between">
              <span>Detected Hotspots</span>
              <span className="badge badge-warning text-xs font-mono">{clusters.length} Clusters</span>
            </div>

            {clusters.map((c) => {
              const isSelected = selectedCluster?.clusterId === c.clusterId;
              const isCrit = c.riskLevel === 'CRITICAL';
              const isHigh = c.riskLevel === 'HIGH';
              const isMed = c.riskLevel === 'MEDIUM';

              return (
                <div
                  key={c.clusterId}
                  onClick={() => setSelectedCluster(c)}
                  className={`p-4 rounded-xl border text-xs cursor-pointer transition-all space-y-2 ${
                    isSelected
                      ? 'bg-amber-50/80 border-amber-400 shadow-md ring-1 ring-amber-400'
                      : 'bg-white border-slate-200 hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 font-mono text-sm">
                      Cluster #{c.clusterId}
                    </span>
                    <span className={`badge badge-sm font-bold ${
                      isCrit ? 'badge-error text-white' :
                      isHigh ? 'badge-warning text-slate-900' :
                      isMed ? 'badge-info text-white' : 'badge-success text-white'
                    }`}>
                      {c.riskLevel} RISK
                    </span>
                  </div>

                  <div className="text-slate-700 font-semibold truncate">
                    {c.primaryLocationLandmark}
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500">
                    <div>Density: <strong>{c.incidentCount} incidents</strong></div>
                    <div>Radius: <strong>{c.radiusMeters}m</strong></div>
                    <div className="col-span-2 flex items-center gap-1 text-slate-600">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span>Peak Hours: <strong>{c.peakHours}</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cluster Details & Visual Density Plot */}
          <div className="lg:col-span-2 border border-slate-200 rounded-xl p-5 bg-white space-y-4">
            {selectedCluster ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="text-xs text-slate-400 uppercase font-bold">Selected Cluster Profile</div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <span>Cluster #{selectedCluster.clusterId}: {selectedCluster.primaryLocationLandmark}</span>
                    </h3>
                  </div>
                  <span className={`badge badge-sm font-bold self-start ${
                    selectedCluster.riskLevel === 'CRITICAL' ? 'badge-error text-white' :
                    selectedCluster.riskLevel === 'HIGH' ? 'badge-warning text-slate-900' : 'badge-info text-white'
                  }`}>
                    {selectedCluster.riskLevel} RISK
                  </span>
                </div>

                {/* Spatial Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Centroid GPS</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedCluster.centroidLatitude?.toFixed(4)}, {selectedCluster.centroidLongitude?.toFixed(4)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Incident Density</span>
                    <span className="font-bold text-amber-900">{selectedCluster.incidentCount} Crimes</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Cluster Radius</span>
                    <span className="font-bold text-slate-900">{selectedCluster.radiusMeters} meters</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Peak Danger Time</span>
                    <span className="font-bold text-slate-900">{selectedCluster.peakHours}</span>
                  </div>
                </div>

                {/* Top BNS Sections */}
                <div>
                  <div className="text-xs font-bold text-slate-700 mb-1.5">Prevalent Legal Sections (BNS 2023):</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCluster.topBnsSections?.map((sec, i) => (
                      <span key={i} className="px-2.5 py-1 rounded bg-amber-50 border border-amber-300 font-mono text-xs font-bold text-amber-900">
                        {sec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Visual Spatial Density Scatter Simulation */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Spatial Density Plot (Centroid &amp; Scatter)</span>
                    <span className="text-[10px] text-slate-400 font-mono">Haversine Metric</span>
                  </div>

                  <div className="h-44 w-full bg-white rounded-lg border border-slate-200 relative flex items-center justify-center overflow-hidden">
                    {/* Concentric distance rings */}
                    <div className="absolute w-36 h-36 rounded-full border border-dashed border-amber-300 bg-amber-50/20 animate-pulse"></div>
                    <div className="absolute w-24 h-24 rounded-full border border-dashed border-amber-400 bg-amber-100/30"></div>

                    {/* Centroid Pin */}
                    <div className="absolute z-10 flex flex-col items-center">
                      <div className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
                        <MapPin className="w-3 h-3" />
                      </div>
                      <span className="text-[9px] font-mono font-bold bg-white/90 px-1 rounded shadow-sm border mt-0.5">
                        Centroid
                      </span>
                    </div>

                    {/* Scattered Incidents */}
                    {selectedCluster.sampleIncidents?.map((pt, idx) => {
                      const angle = (idx * (360 / (selectedCluster.sampleIncidents.length || 1))) * (Math.PI / 180);
                      const dist = 30 + (idx % 3) * 18;
                      const x = Math.cos(angle) * dist;
                      const y = Math.sin(angle) * dist;

                      return (
                        <div
                          key={pt.id || idx}
                          style={{ transform: `translate(${x}px, ${y}px)` }}
                          className="absolute w-2.5 h-2.5 rounded-full bg-amber-500 border border-white shadow-sm"
                          title={`${pt.trackingToken} (${pt.category})`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Incident Sample Table */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-700">Incidents Constituting Cluster:</div>
                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="table table-xs w-full text-[11px]">
                      <thead className="bg-slate-100 text-slate-700">
                        <tr>
                          <th>FIR Token</th>
                          <th>Location</th>
                          <th>Category</th>
                          <th>BNS Sections</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCluster.sampleIncidents?.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="font-mono font-bold text-slate-800">{item.trackingToken}</td>
                            <td className="truncate max-w-[150px]">{item.location}</td>
                            <td>{item.category}</td>
                            <td className="font-mono text-amber-800">{item.bnsSections}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-xs text-slate-400">
                Select a cluster to inspect its spatial coordinates and crime breakdown.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
