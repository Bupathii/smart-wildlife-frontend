import {
  MapPin,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';

import {
  createRiskZone,
  deleteRiskZone,
  getRiskZones,
  updateRiskZone,
} from '../api/riskZones';
import { getCurrentUser } from '../config/roleAccess';

const DEFAULT_CENTER = { lat: 7.8731, lng: 80.7718 };

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  return null;
}

function MapCenterUpdater({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: false });
  }, [center, map]);

  return null;
}

export default function RiskZones() {
  const canManageZones = ['ADMIN', 'PARK_MANAGER', 'RANGER_SUPERVISOR']
    .includes(getCurrentUser()?.role);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(DEFAULT_CENTER);
  const [latitude, setLatitude] = useState(String(DEFAULT_CENTER.lat));
  const [longitude, setLongitude] = useState(String(DEFAULT_CENTER.lng));
  const [name, setName] = useState('');
  const [radiusMeters, setRadiusMeters] = useState('500');
  const [riskLevel, setRiskLevel] = useState('HIGH');
  const [editingZoneId, setEditingZoneId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingZoneId, setDeletingZoneId] = useState('');

  const loadZones = async () => {
    try {
      setLoading(true);
      const response = await getRiskZones();
      setZones(Array.isArray(response?.zones) ? response.zones : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load risk zones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadZones();
  }, []);

  const mapCenter = useMemo(
    () => [selectedLocation.lat, selectedLocation.lng],
    [selectedLocation]
  );

  function updateLocation(location) {
    setSelectedLocation(location);
    setLatitude(location.lat.toFixed(6));
    setLongitude(location.lng.toFixed(6));
  }

  function handleCoordinateChange(field, value) {
    const nextLatitude = field === 'latitude' ? value : latitude;
    const nextLongitude = field === 'longitude' ? value : longitude;

    if (field === 'latitude') setLatitude(value);
    else setLongitude(value);

    const lat = Number(nextLatitude);
    const lng = Number(nextLongitude);
    if (
      nextLatitude.trim() !== '' &&
      nextLongitude.trim() !== '' &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180
    ) {
      setSelectedLocation({ lat, lng });
    }
  }

  function resetForm() {
    setEditingZoneId('');
    setName('');
    setRadiusMeters('500');
    setRiskLevel('HIGH');
    updateLocation(DEFAULT_CENTER);
  }

  function handleEdit(zone) {
    setEditingZoneId(zone.zoneId);
    setName(zone.name);
    setRadiusMeters(String(zone.radiusMeters));
    setRiskLevel(zone.riskLevel);
    updateLocation({ lat: Number(zone.latitude), lng: Number(zone.longitude) });
    setError('');
    setSuccess('');
  }

  async function handleDelete(zone) {
    if (!window.confirm(`Delete the “${zone.name}” risk zone?`)) return;

    try {
      setDeletingZoneId(zone.zoneId);
      setError('');
      await deleteRiskZone(zone.zoneId);
      setZones((current) => current.filter((item) => item.zoneId !== zone.zoneId));
      if (editingZoneId === zone.zoneId) resetForm();
      setSuccess(`High-risk zone “${zone.name}” deleted.`);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to delete risk zone.');
    } finally {
      setDeletingZoneId('');
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!name.trim()) {
      setError('Zone name is required.');
      return;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    if (
      !latitude.trim() ||
      !longitude.trim() ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      setError('Enter a valid latitude (-90 to 90) and longitude (-180 to 180).');
      return;
    }

    const radius = Number(radiusMeters);
    if (!Number.isFinite(radius) || radius < 50 || radius > 50000) {
      setError('Radius must be between 50 and 50,000 meters.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        name: name.trim(),
        latitude: lat,
        longitude: lng,
        radiusMeters: radius,
        riskLevel,
      };

      const result = editingZoneId
        ? await updateRiskZone(editingZoneId, payload)
        : await createRiskZone(payload);

      if (editingZoneId) {
        setZones((current) => current.map((zone) => (
          zone.zoneId === editingZoneId ? result.zone : zone
        )));
        setSuccess(`High-risk zone “${result.zone.name}” updated successfully.`);
      } else {
        setZones((current) => [result.zone, ...current]);
        setSuccess(`High-risk zone “${result.zone.name}” saved successfully.`);
      }
      resetForm();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to save risk zone.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">High-Risk Zones</h2>
        <p className="mt-1 text-sm text-slate-500">
          Define protected danger areas by selecting a location on the map.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <MapPin size={16} className="text-emerald-600" />
            Zone location map
          </div>

          <div className="h-[440px] overflow-hidden rounded-2xl border border-slate-200">
            <MapContainer center={mapCenter} zoom={14} scrollWheelZoom className="h-full w-full">
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapCenterUpdater center={mapCenter} />
              <MapClickHandler onSelect={updateLocation} />

              {Number.isFinite(Number(radiusMeters)) && Number(radiusMeters) > 0 && (
                <Circle
                  center={mapCenter}
                  radius={Number(radiusMeters)}
                  pathOptions={{
                    color: '#ef4444',
                    fillColor: '#fca5a5',
                    fillOpacity: 0.12,
                    dashArray: '8 6',
                    weight: 2,
                  }}
                >
                  <Popup>New zone preview. Drag the pin to move this area.</Popup>
                </Circle>
              )}

              <Marker
                position={mapCenter}
                draggable
                eventHandlers={{
                  dragend(event) {
                    const point = event.target.getLatLng();
                    updateLocation({ lat: point.lat, lng: point.lng });
                  },
                }}
              >
                <Popup>Drag this marker to set the risk zone center</Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
            {editingZoneId ? (
              <Pencil size={16} className="text-emerald-600" />
            ) : (
              <Plus size={16} className="text-emerald-600" />
            )}
            {editingZoneId ? 'Edit high-risk zone' : 'Add high-risk zone'}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Zone name</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Village Boundary"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Latitude</label>
                <input
                  type="number"
                  min="-90"
                  max="90"
                  step="any"
                  value={latitude}
                  onChange={(event) => handleCoordinateChange('latitude', event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Longitude</label>
                <input
                  type="number"
                  min="-180"
                  max="180"
                  step="any"
                  value={longitude}
                  onChange={(event) => handleCoordinateChange('longitude', event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Radius (m)</label>
                <input
                  type="number"
                  min="50"
                  max="50000"
                  value={radiusMeters}
                  onChange={(event) => setRadiusMeters(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
                />
                <input
                  type="range"
                  min="50"
                  max="50000"
                  step="50"
                  value={Math.min(50000, Math.max(50, Number(radiusMeters) || 50))}
                  onChange={(event) => setRadiusMeters(event.target.value)}
                  aria-label="Adjust risk zone radius"
                  className="mt-2 w-full accent-emerald-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Risk level</label>
                <select
                  value={riskLevel}
                  onChange={(event) => setRiskLevel(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
            >
              {saving
                ? (editingZoneId ? 'Updating zone...' : 'Saving zone...')
                : (editingZoneId ? 'Update high-risk zone' : 'Save high-risk zone')}
            </button>
            {editingZoneId && (
              <button
                type="button"
                onClick={resetForm}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <X size={16} />
                Cancel editing
              </button>
            )}
          </form>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <ShieldAlert size={16} className="text-red-500" />
          Configured zones
        </div>

        {loading ? (
          <div className="text-sm text-slate-500">Loading zones...</div>
        ) : zones.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            No high-risk zones configured yet.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {zones.map((zone) => (
              <div key={zone.zoneId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-800">{zone.name}</p>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-700">
                    {zone.status}
                  </span>
                </div>

                {canManageZones && (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(zone)}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-500 hover:text-emerald-700"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(zone)}
                      disabled={deletingZoneId === zone.zoneId}
                      className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      {deletingZoneId === zone.zoneId ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                )}

                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  <p>Zone ID: {zone.zoneId}</p>
                  <p>Risk: {zone.riskLevel}</p>
                  <p>Radius: {zone.radiusMeters} m</p>
                  <p>Lat/Lng: {Number(zone.latitude).toFixed(5)}, {Number(zone.longitude).toFixed(5)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}