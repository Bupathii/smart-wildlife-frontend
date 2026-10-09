import { useEffect, useMemo } from 'react';

import {
  CircleMarker,
  MapContainer,
  Polygon,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';

import 'leaflet/dist/leaflet.css';

import { MAP_COLORS, coverageColor, formatTime } from '../config/patrolUi';
import { OfflineBadge } from './PatrolWidgets';

const toLatLng = (point) => [point.latitude, point.longitude];
const FALLBACK_CENTRE = [6.39, 81.44];

/** Zooms the map so that everything drawn on it is visible. */
function FitToContent({ points }) {
  const map = useMap();

  useEffect(() => {
    if (points.length > 0) map.fitBounds(points, { padding: [24, 24] });
  }, [map, points]);

  return null;
}

/** Explains the colours used on the map. */
function MapLegend() {
  const items = [
    ['Good coverage', MAP_COLORS.good],
    ['Low coverage', MAP_COLORS.medium],
    ['Under-patrolled', MAP_COLORS.low],
    ['Ranger online', MAP_COLORS.online],
    ['Ranger offline', MAP_COLORS.offline],
  ];
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
      {items.map(([label, color]) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
          {label}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <span className="h-0.5 w-5" style={{ backgroundColor: MAP_COLORS.route }} />
        Patrol route
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-0.5 w-5" style={{ backgroundColor: MAP_COLORS.track }} />
        Recorded track
      </span>
    </div>
  );
}

/**
 * The park map: zones coloured by coverage, patrol routes, ranger positions
 * (grey when offline) and optionally one patrol's recorded track.
 *
 * SOLID-S: it only draws what it is given - it never fetches data itself.
 */
export default function PatrolMap({
  zones = [],
  zoneCoverage = [],
  routes = [],
  rangers = [],
  track = [],
  onRetry,
  retryingId = null,
  height = 380,
}) {
  const coverageByZone = useMemo(
    () => new Map(zoneCoverage.map((zone) => [zone.zoneId, zone])),
    [zoneCoverage]
  );
  const bounds = useMemo(() => {
    const zonePoints = zones.flatMap((zone) => zone.boundary.map(toLatLng));
    const routePoints = routes.flatMap((route) => route.waypoints.map(toLatLng));
    return zonePoints.length > 0 ? zonePoints : [...routePoints, ...track.map(toLatLng)];
  }, [zones, routes, track]);

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-slate-200" style={{ height }}>
        <MapContainer center={FALLBACK_CENTRE} zoom={11} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitToContent points={bounds} />

          {zones.map((zone) => {
            const stat = coverageByZone.get(zone.zoneId);
            const color = stat ? coverageColor(stat.percentage) : MAP_COLORS.offline;
            return (
              <Polygon
                key={zone.zoneId}
                positions={zone.boundary.map(toLatLng)}
                pathOptions={{ color, weight: stat?.underPatrolled ? 3 : 1.5, fillOpacity: 0.18 }}
              >
                <Tooltip sticky>
                  {zone.name}
                  {stat ? ` – ${stat.percentage}% coverage` : ''}
                  {stat?.underPatrolled ? ' (under-patrolled)' : ''}
                </Tooltip>
              </Polygon>
            );
          })}

          {routes.map((route) => (
            <Polyline
              key={route.routeId}
              positions={route.waypoints.map(toLatLng)}
              pathOptions={{ color: MAP_COLORS.route, weight: 3, dashArray: '6 6' }}
            >
              <Tooltip sticky>{route.name}</Tooltip>
            </Polyline>
          ))}

          {track.length > 1 && (
            <Polyline
              positions={track.map(toLatLng)}
              pathOptions={{ color: MAP_COLORS.track, weight: 4 }}
            />
          )}

          {rangers
            .filter((ranger) => ranger.location)
            .map((ranger) => {
              const offline = ranger.trackingStatus === 'OFFLINE';
              const color = offline ? MAP_COLORS.offline : MAP_COLORS.online;
              return (
                <CircleMarker
                  key={ranger.rangerId}
                  center={toLatLng(ranger.location)}
                  radius={9}
                  pathOptions={{ color: '#ffffff', weight: 2, fillColor: color, fillOpacity: 1 }}
                >
                  <Popup>
                    <div className="space-y-1.5 text-sm">
                      <p className="font-bold text-slate-900">{ranger.name}</p>
                      <p className="text-slate-600">
                        {ranger.rank}
                        {ranger.patrolId ? ` · ${ranger.patrolId}` : ''}
                      </p>
                      {offline ? (
                        <OfflineBadge
                          ranger={ranger}
                          onRetry={onRetry}
                          retrying={retryingId === ranger.rangerId}
                        />
                      ) : (
                        <p className="text-emerald-700">
                          Online · updated {formatTime(ranger.lastSyncTime)}
                        </p>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
        </MapContainer>
      </div>
      <MapLegend />
    </div>
  );
}
