import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Shield, AlertOctagon, MapPin, Building, Flame, Clock } from 'lucide-react';

// Fix for default Leaflet icon paths in Vite bundles
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom station icon
const stationIcon = L.divIcon({
  html: `<div style="background-color: #1e3a8a; color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); font-weight: bold; font-size: 13px;">🏛</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

// Custom SOS alert icon
const sosIcon = L.divIcon({
  html: `<div style="background-color: #dc2626; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 0 10px #ef4444; font-weight: bold; font-size: 14px; animation: pulse 1.5s infinite;">🚨</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

export default function InteractiveCrimeMap({ stations = [], clusters = [], sosAlerts = [] }) {
  // Center default to Delhi (28.6315, 77.2167) or first station
  const defaultCenter = stations.length > 0 && stations[0].latitude && stations[0].longitude
    ? [stations[0].latitude, stations[0].longitude]
    : [28.6315, 77.2167];

  return (
    <div className="w-full h-[450px] rounded-2xl overflow-hidden border border-slate-300 shadow-sm relative z-0">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Police Stations Markers */}
        {stations.map((st) => {
          if (!st.latitude || !st.longitude) return null;
          return (
            <Marker key={`st-${st.id}`} position={[st.latitude, st.longitude]} icon={stationIcon}>
              <Popup>
                <div className="p-1 space-y-1 text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    <span>🏛 {st.stationName}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono">Code: {st.stationCode}</div>
                  <div className="text-[11px] text-slate-600">In-Charge: {st.inChargeName || 'SHO'}</div>
                  <div className="text-[11px] text-slate-600">Contact: {st.contactNumber}</div>
                  <div className="badge badge-sm badge-info text-white font-bold mt-1">
                    Jurisdiction HQ
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Active Emergency SOS Alert Markers */}
        {sosAlerts.map((sos) => {
          if (!sos.latitude || !sos.longitude || sos.status === 'RESOLVED') return null;
          return (
            <React.Fragment key={`sos-${sos.id}`}>
              <Marker position={[sos.latitude, sos.longitude]} icon={sosIcon}>
                <Popup>
                  <div className="p-1 space-y-1 text-xs">
                    <div className="font-extrabold text-red-600 flex items-center gap-1">
                      <span>🚨 ACTIVE DISTRESS BEACON</span>
                    </div>
                    <div className="font-mono font-bold text-slate-900">{sos.alertToken}</div>
                    <div className="text-[11px] text-slate-700">Caller: {sos.phoneNumber || 'Anonymous'}</div>
                    <div className="text-[11px] text-slate-500 italic">"{sos.notes}"</div>
                    <div className="badge badge-sm badge-error text-white font-bold">
                      {sos.status}
                    </div>
                  </div>
                </Popup>
              </Marker>
              <Circle
                center={[sos.latitude, sos.longitude]}
                radius={300}
                pathOptions={{ color: '#ef4444', fillColor: '#f87171', fillOpacity: 0.25 }}
              />
            </React.Fragment>
          );
        })}

        {/* Crime Hotspot Clusters (DBSCAN) Circles */}
        {clusters.map((c) => {
          if (!c.centroidLatitude || !c.centroidLongitude) return null;

          const isCrit = c.riskLevel === 'CRITICAL';
          const isHigh = c.riskLevel === 'HIGH';
          const isMed = c.riskLevel === 'MEDIUM';

          const strokeColor = isCrit ? '#dc2626' : isHigh ? '#ea580c' : isMed ? '#ca8a04' : '#16a34a';
          const fillColor = isCrit ? '#ef4444' : isHigh ? '#f97316' : isMed ? '#eab308' : '#22c55e';

          return (
            <Circle
              key={`cl-${c.clusterId}`}
              center={[c.centroidLatitude, c.centroidLongitude]}
              radius={Math.max(c.radiusMeters || 100, 150)}
              pathOptions={{
                color: strokeColor,
                fillColor: fillColor,
                fillOpacity: 0.35,
                weight: 2
              }}
            >
              <Popup>
                <div className="p-1 space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>Cluster #{c.clusterId}</span>
                    <span
                      style={{ backgroundColor: strokeColor }}
                      className="text-white text-[10px] px-1.5 py-0.5 rounded font-extrabold uppercase"
                    >
                      {c.riskLevel} Risk
                    </span>
                  </div>
                  <div className="font-semibold text-slate-800">{c.primaryLocationLandmark}</div>
                  <div className="text-slate-600 text-[11px]">
                    Density: <strong>{c.incidentCount} crimes</strong> | Radius: {c.radiusMeters}m
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    Peak Danger Time: <strong>{c.peakHours}</strong>
                  </div>
                  {c.topBnsSections?.length > 0 && (
                    <div className="text-amber-900 font-mono text-[10px] font-bold">
                      BNS: {c.topBnsSections.join(', ')}
                    </div>
                  )}
                </div>
              </Popup>
            </Circle>
          );
        })}
      </MapContainer>
    </div>
  );
}
