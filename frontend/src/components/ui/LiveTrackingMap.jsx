import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* ── Custom map icons ─────────────────────────────────────────── */
const createIcon = (emoji, size = 36) =>
  L.divIcon({
    className: '',
    html: `<div style="font-size:${size}px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });

const riderIcon = createIcon('🛵', 36);
const destinationIcon = createIcon('📍', 36);
const pharmacyIcon = createIcon('🏥', 32);

/* ── Animated pulse marker for rider ─────────────────────────── */
const pulseRiderIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:44px;height:44px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:rgba(37,99,235,0.2);animation:pulse-ring 2s ease-out infinite;"></div>
      <div style="position:absolute;inset:6px;border-radius:50%;background:rgba(37,99,235,0.15);animation:pulse-ring 2s ease-out infinite 0.5s;"></div>
      <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:28px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🛵</div>
    </div>
    <style>
      @keyframes pulse-ring {
        0% { transform: scale(0.8); opacity: 1; }
        100% { transform: scale(2); opacity: 0; }
      }
    </style>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -22],
});

/* ── Helper: calculate distance between two coords (km) ──────── */
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ── Helper: estimate time ────────────────────────────────────── */
function estimateTime(distKm, speedKmh = 25) {
  const mins = Math.round((distKm / speedKmh) * 60);
  if (mins < 1) return 'Less than a minute';
  if (mins === 1) return '1 minute';
  return `${mins} minutes`;
}

/* ── AutoFitBounds: fit map to all markers ────────────────────── */
function AutoFitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(([lat, lng]) => [lat, lng]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    }
  }, [positions, map]);
  return null;
}

/* ── SmoothMove: animate marker movement ─────────────────────── */
function SmoothMarker({ position, icon, children }) {
  const markerRef = useRef(null);
  const prevPos = useRef(position);

  useEffect(() => {
    if (!markerRef.current) return;
    const marker = markerRef.current;
    const start = prevPos.current;
    const end = position;

    if (start[0] === end[0] && start[1] === end[1]) return;

    const steps = 30;
    let step = 0;
    const dLat = (end[0] - start[0]) / steps;
    const dLng = (end[1] - start[1]) / steps;

    const interval = setInterval(() => {
      step++;
      const newLat = start[0] + dLat * step;
      const newLng = start[1] + dLng * step;
      marker.setLatLng([newLat, newLng]);
      if (step >= steps) {
        clearInterval(interval);
        prevPos.current = end;
      }
    }, 33);

    return () => clearInterval(interval);
  }, [position]);

  return (
    <Marker position={position} icon={icon} ref={markerRef}>
      {children}
    </Marker>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT: LiveTrackingMap
   ══════════════════════════════════════════════════════════════════ */

// Default center: Kathmandu
const DEFAULT_CENTER = [27.7172, 85.324];

// Pharmacy origin (simulated start point)
const PHARMACY_LOCATION = [27.7085, 85.3206]; // Thamel area

export default function LiveTrackingMap({
  orderStatus,
  deliveryLat,
  deliveryLng,
  destinationLat,
  destinationLng,
  shippingAddress,
  onLocationUpdate,
}) {
  const [riderPos, setRiderPos] = useState(
    deliveryLat && deliveryLng ? [deliveryLat, deliveryLng] : null
  );
  const [destPos] = useState(
    destinationLat && destinationLng
      ? [destinationLat, destinationLng]
      : null
  );
  const simulationRef = useRef(null);
  const stepRef = useRef(0);

  // Simulated destination if none set (random point near Kathmandu)
  const effectiveDest = destPos || [27.6915, 85.3420]; // Patan area

  // Update rider position from props
  useEffect(() => {
    if (deliveryLat && deliveryLng) {
      setRiderPos([deliveryLat, deliveryLng]);
    }
  }, [deliveryLat, deliveryLng]);

  /* ── Simulate delivery movement when order is shipped ───────── */
  const simulateDelivery = useCallback(() => {
    if (simulationRef.current) return; // already running

    const origin = riderPos || PHARMACY_LOCATION;
    const dest = effectiveDest;
    const totalSteps = 120; // ~2 min full simulation
    stepRef.current = 0;

    simulationRef.current = setInterval(() => {
      stepRef.current++;
      const t = stepRef.current / totalSteps;

      if (t >= 1) {
        setRiderPos([dest[0], dest[1]]);
        clearInterval(simulationRef.current);
        simulationRef.current = null;
        return;
      }

      // Add slight randomness for realistic movement
      const jitter = () => (Math.random() - 0.5) * 0.0003;
      const lat = origin[0] + (dest[0] - origin[0]) * t + jitter();
      const lng = origin[1] + (dest[1] - origin[1]) * t + jitter();

      setRiderPos([lat, lng]);

      // Report location updates
      if (onLocationUpdate && stepRef.current % 5 === 0) {
        onLocationUpdate({ lat, lng });
      }
    }, 1000);
  }, [riderPos, effectiveDest, onLocationUpdate]);

  // Start/stop simulation based on order status
  useEffect(() => {
    if (orderStatus === 'shipped') {
      if (!riderPos) {
        setRiderPos(PHARMACY_LOCATION);
      }
      // Small delay then start simulation
      const timer = setTimeout(simulateDelivery, 1500);
      return () => clearTimeout(timer);
    }

    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
        simulationRef.current = null;
      }
    };
  }, [orderStatus, simulateDelivery]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
      }
    };
  }, []);

  const isShipped = orderStatus === 'shipped';
  const isDelivered = orderStatus === 'delivered';
  const showRider = (isShipped || isDelivered) && riderPos;

  // Compute distance & ETA
  const distance = riderPos
    ? haversine(riderPos[0], riderPos[1], effectiveDest[0], effectiveDest[1])
    : null;
  const eta = distance !== null ? estimateTime(distance) : null;

  // Route line
  const routeLine = [];
  if (showRider) routeLine.push(riderPos);
  routeLine.push(effectiveDest);

  // All positions for auto-fit
  const allPositions = [PHARMACY_LOCATION, effectiveDest];
  if (riderPos) allPositions.push(riderPos);

  return (
    <div className="rounded-xl border border-charcoal/10 bg-white overflow-hidden">
      {/* ── Info bar ──────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-charcoal/10 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🗺️</span>
          <h3 className="font-fraunces font-semibold text-charcoal text-sm">Live Tracking</h3>
        </div>
        <div className="flex items-center gap-4 text-xs">
          {isShipped && riderPos && (
            <>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-charcoal/70">Rider en route</span>
              </span>
              {distance !== null && (
                <span className="text-charcoal/60">
                  {distance < 1
                    ? `${Math.round(distance * 1000)}m away`
                    : `${distance.toFixed(1)} km away`}
                </span>
              )}
              {eta && (
                <span className="font-medium text-primary">ETA: {eta}</span>
              )}
            </>
          )}
          {isDelivered && (
            <span className="flex items-center gap-1.5 text-green-600 font-medium">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Delivered!
            </span>
          )}
          {!isShipped && !isDelivered && (
            <span className="text-charcoal/50">Tracking activates once shipped</span>
          )}
        </div>
      </div>

      {/* ── Map ──────────────────────────────────────────────────── */}
      <div className="h-[350px] relative">
        <MapContainer
          center={riderPos || DEFAULT_CENTER}
          zoom={14}
          scrollWheelZoom={true}
          className="h-full w-full z-0"
          style={{ background: '#f5f5f5' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <AutoFitBounds positions={allPositions} />

          {/* Pharmacy origin */}
          <Marker position={PHARMACY_LOCATION} icon={pharmacyIcon}>
            <Popup>
              <strong>MediReach Pharmacy</strong>
              <br />
              Order dispatched from here
            </Popup>
          </Marker>

          {/* Destination */}
          <Marker position={effectiveDest} icon={destinationIcon}>
            <Popup>
              <strong>Delivery Destination</strong>
              <br />
              {shippingAddress || 'Customer address'}
            </Popup>
          </Marker>

          {/* Route line */}
          {showRider && (
            <Polyline
              positions={[riderPos, effectiveDest]}
              pathOptions={{
                color: '#2563eb',
                weight: 3,
                opacity: 0.6,
                dashArray: '8, 12',
              }}
            />
          )}

          {/* Completed route line (pharmacy to rider) */}
          {showRider && (
            <Polyline
              positions={[PHARMACY_LOCATION, riderPos]}
              pathOptions={{
                color: '#16a34a',
                weight: 3,
                opacity: 0.8,
              }}
            />
          )}

          {/* Rider marker */}
          {showRider && (
            <SmoothMarker position={riderPos} icon={pulseRiderIcon}>
              <Popup>
                <strong>🛵 Delivery Rider</strong>
                <br />
                {distance !== null && (
                  <>
                    {distance < 1
                      ? `${Math.round(distance * 1000)}m`
                      : `${distance.toFixed(1)} km`}{' '}
                    to destination
                    <br />
                    ETA: {eta}
                  </>
                )}
              </Popup>
            </SmoothMarker>
          )}
        </MapContainer>

        {/* Loading overlay when not shipped yet */}
        {!isShipped && !isDelivered && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-[1000]">
            <div className="text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl mb-2">
                📦
              </div>
              <p className="text-sm font-medium text-charcoal">
                {orderStatus === 'pending' && 'Your order is being processed'}
                {orderStatus === 'verified' && 'Order verified, preparing for packing'}
                {orderStatus === 'packed' && 'Order packed, waiting for pickup'}
                {orderStatus === 'prescription_review' && 'Prescription under review'}
                {orderStatus === 'cancelled' && 'Order cancelled'}
              </p>
              <p className="text-xs text-charcoal/50 mt-1">
                Live tracking will start once the order is shipped
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Legend ────────────────────────────────────────────────── */}
      <div className="px-4 py-2.5 border-t border-charcoal/10 flex items-center gap-5 text-xs text-charcoal/60">
        <span className="flex items-center gap-1.5">
          <span>🏥</span> Pharmacy
        </span>
        <span className="flex items-center gap-1.5">
          <span>🛵</span> Rider
        </span>
        <span className="flex items-center gap-1.5">
          <span>📍</span> Destination
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5 bg-green-500 rounded" /> Completed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5 bg-primary rounded border-dashed" style={{ borderTop: '2px dashed #2563eb', height: 0 }} /> Remaining
        </span>
      </div>
    </div>
  );
}
