import { useEffect, useMemo, useRef } from 'react';

import L from 'leaflet';
import {
  MapContainer,
  Marker,
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
const MARKER_SIZE = 26;

const roundCoordinate = (value) => Number(value.toFixed(COORDINATE_DECIMALS));

/** Converts a Leaflet position into the waypoint shape used by the app. */
const toWaypoint = (latLng) => ({
  latitude: roundCoordinate(latLng.lat),
  longitude: roundCoordinate(latLng.lng),
});

/** A round, numbered marker for one waypoint. */
function numberedIcon(number, draggable) {
  const style = [
    `width:${MARKER_SIZE}px`,
    `height:${MARKER_SIZE}px`,
    'border-radius:50%',
    `background:${MAP_COLORS.track}`,
    'border:2px solid #ffffff',
    'box-shadow:0 1px 4px rgba(0,0,0,0.45)',
    'color:#ffffff',
    'font-size:12px',
    'font-weight:700',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    `cursor:${draggable ? 'grab' : 'default'}`,
  ].join(';');

  return L.divIcon({
    className: '',
    html: `<div style="${style}">${number}</div>`,
    iconSize: [MARKER_SIZE, MARKER_SIZE],
    iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE / 2],
  });
}

/**
 * Zooms to the whole park at first, and to a route whenever a different
 * route is opened (`focusKey` changes) - not on every waypoint change, so
 * the map stays still while the manager is editing.
 */
function FitView({ zonePoints, waypoints, focusKey }) {
  const map = useMap();
  const latestWaypoints = useRef(waypoints);

  useEffect(() => {
    latestWaypoints.current = waypoints;
  }, [waypoints]);

  useEffect(() => {
    const routePoints = latestWaypoints.current.map(toLatLng);
    const target = routePoints.length > 1 ? routePoints : zonePoints;
    if (target.length > 0) map.fitBounds(target, { padding: [40, 40] });
  }, [map, zonePoints, focusKey]);

  return null;
}

/** Reports each click on the map as a new waypoint. */
function ClickToAdd({ onAdd }) {
  useMapEvents({
    click(event) {
      onAdd(toWaypoint(event.latlng));
    },
  });
  return null;
}

/**
 * SOLID-S: draws routes and reports what the manager did on the map (a
 * click, a dragged waypoint). It does not validate or save anything - the
 * page decides what those actions mean.
 *
 * @param {object[]} zones park zones (outlined so the manager stays inside them)
 * @param {object[]} routes existing routes, drawn in grey
 * @param {object[]} waypoints the route being viewed or edited, numbered in order
 * @param {*} focusKey changes when a different route is opened, to re-centre the map
 * @param {(point: {latitude:number, longitude:number}) => void} [onAddWaypoint]
 *        when given, clicking the map adds a waypoint
 * @param {(index: number, point: {latitude:number, longitude:number}) => void} [onMoveWaypoint]
 *        when given, waypoints can be dragged to a new position
 */
export default function RouteEditorMap({
  zones = [],
  routes = [],
  waypoints = [],
  focusKey = null,
  onAddWaypoint,
  onMoveWaypoint,
  height = 460,
}) {
  const zonePoints = useMemo(
    () => zones.flatMap((zone) => zone.boundary.map(toLatLng)),
    [zones]
  );
  const draggable = Boolean(onMoveWaypoint);
  // Icons depend only on how many waypoints there are, so dragging one
  // does not rebuild them.
  const waypointCount = waypoints.length;
  const icons = useMemo(
    () => Array.from({ length: waypointCount }, (_, index) => numberedIcon(index + 1, draggable)),
    [waypointCount, draggable]
  );
  const moveTo = (index) => (event) => onMoveWaypoint(index, toWaypoint(event.target.getLatLng()));

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
        <FitView zonePoints={zonePoints} waypoints={waypoints} focusKey={focusKey} />
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
            interactive={false}
          />
        )}
        {waypoints.map((waypoint, index) => (
          // The index is the key on purpose: a key built from the position
          // would recreate the marker mid-drag and cancel the drag.
          <Marker
            key={index}
            position={toLatLng(waypoint)}
            icon={icons[index]}
            draggable={draggable}
            eventHandlers={draggable ? { drag: moveTo(index), dragend: moveTo(index) } : undefined}
          >
            {draggable && <Tooltip direction="top" offset={[0, -12]}>Drag to move waypoint {index + 1}</Tooltip>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
