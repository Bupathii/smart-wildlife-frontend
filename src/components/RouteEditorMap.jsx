import { useEffect, useMemo } from 'react';

import {
  CircleMarker,
  MapContainer,
  Polygon,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';

import 'leaflet/dist/leaflet.css';

import { MAP_COLORS } from '../config/patrolUi';

const toLatLng = (point) => [point.latitude, point.longitude];
const FALLBACK_CENTRE = [6.39, 81.44];
const COORDINATE_DECIMALS = 5;
const ZONE_COLOR = '#0f766e';
const OTHER_ROUTE_COLOR = '#94a3b8';

const roundCoordinate = (value) => Number(value.toFixed(COORDINATE_DECIMALS));

/** Zooms the map to the park once its zones are known. */
function FitToZones({ points }) {
  const map = useMap();

  useEffect(() => {
    if (points.length > 0) map.fitBounds(points, { padding: [24, 24] });
  }, [map, points]);

  return null;
}

/** Reports each click on the map as a new waypoint. */
function ClickToAdd({ onAdd }) {
  useMapEvents({
    click(event) {
      onAdd({
        latitude: roundCoordinate(event.latlng.lat),
        longitude: roundCoordinate(event.latlng.lng),
      });
    },
  });
  return null;
}

/**
 * SOLID-S: draws routes and reports map clicks; it does not validate or
 * save anything - the page decides what a click means.
 *
 * @param {object[]} zones park zones (outlined so the manager stays inside them)
 * @param {object[]} routes existing routes, drawn in grey
 * @param {object[]} waypoints the route being viewed or edited, numbered in order
 * @param {(point: {latitude:number, longitude:number}) => void} [onAddWaypoint]
 *        when given, clicking the map adds a waypoint
 */
export default function RouteEditorMap({
  zones = [],
  routes = [],
  waypoints = [],
  onAddWaypoint,
  height = 460,
}) {
  const zonePoints = useMemo(
    () => zones.flatMap((zone) => zone.boundary.map(toLatLng)),
    [zones]
  );

  return (
    <div
      className={`overflow-hidden rounded-xl border border-slate-200 ${
        onAddWaypoint ? 'cursor-crosshair' : ''
      }`}
      style={{ height }}
    >
      <MapContainer center={FALLBACK_CENTRE} zoom={11} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToZones points={zonePoints} />
        {onAddWaypoint && <ClickToAdd onAdd={onAddWaypoint} />}

        {zones.map((zone) => (
          <Polygon
            key={zone.zoneId}
            positions={zone.boundary.map(toLatLng)}
            pathOptions={{ color: ZONE_COLOR, weight: 1.5, fillOpacity: 0.08 }}
          >
            {!onAddWaypoint && <Tooltip sticky>{zone.name}</Tooltip>}
          </Polygon>
        ))}

        {routes.map((route) => (
          <Polyline
            key={route.routeId}
            positions={route.waypoints.map(toLatLng)}
            pathOptions={{ color: OTHER_ROUTE_COLOR, weight: 3, dashArray: '6 6' }}
          >
            {!onAddWaypoint && <Tooltip sticky>{route.name}</Tooltip>}
          </Polyline>
        ))}

        {waypoints.length > 1 && (
          <Polyline
            positions={waypoints.map(toLatLng)}
            pathOptions={{ color: MAP_COLORS.track, weight: 4 }}
          />
        )}
        {waypoints.map((waypoint, index) => (
          <CircleMarker
            key={`${waypoint.latitude}-${waypoint.longitude}-${index}`}
            center={toLatLng(waypoint)}
            radius={9}
            pathOptions={{ color: '#ffffff', weight: 2, fillColor: MAP_COLORS.track, fillOpacity: 1 }}
          >
            <Tooltip permanent direction="top" offset={[0, -8]}>
              {index + 1}
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
