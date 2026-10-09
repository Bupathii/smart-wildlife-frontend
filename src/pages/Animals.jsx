import {
  ImagePlus,
  MapPin,
  PawPrint,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react';

import { useCallback, useEffect, useRef, useState } from 'react';

import { createAnimal, getAnimals } from '../api/animals';
import { resolveApiAssetUrl } from '../api/client';
import { getCurrentUser } from '../config/roleAccess';

export default function Animals() {
  const canRegisterAnimals = ['ADMIN', 'PARK_MANAGER'].includes(getCurrentUser()?.role);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [animalId, setAnimalId] = useState('');
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const photoInputRef = useRef(null);

  const loadAnimals = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getAnimals();
      setAnimals(Array.isArray(response?.animals) ? response.animals : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load tracked animals.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnimals();
    const refreshTimer = window.setInterval(() => void loadAnimals(), 15000);
    return () => window.clearInterval(refreshTimer);
  }, [loadAnimals]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const hasLatitude = latitude.trim() !== '';
    const hasLongitude = longitude.trim() !== '';
    if (hasLatitude !== hasLongitude) {
      setError('Enter both latitude and longitude, or leave both blank until GPS starts.');
      return;
    }

    const payload = {
      animalId: animalId.trim().toUpperCase(),
      name: name.trim(),
      species: species.trim(),
    };

    if (hasLatitude && hasLongitude) {
      const parsedLatitude = Number(latitude);
      const parsedLongitude = Number(longitude);
      if (
        !Number.isFinite(parsedLatitude) ||
        parsedLatitude < -90 ||
        parsedLatitude > 90 ||
        !Number.isFinite(parsedLongitude) ||
        parsedLongitude < -180 ||
        parsedLongitude > 180
      ) {
        setError('Enter a valid latitude (-90 to 90) and longitude (-180 to 180).');
        return;
      }
      payload.latitude = parsedLatitude;
      payload.longitude = parsedLongitude;
    }

    try {
      setSaving(true);
      const response = await createAnimal(payload, photo);
      setAnimals((current) => [response.animal, ...current]);
      setAnimalId('');
      setName('');
      setSpecies('');
      setLatitude('');
      setLongitude('');
      setPhoto(null);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview('');
      if (photoInputRef.current) photoInputRef.current.value = '';
      setSuccess(`${response.animal.name} registered for tracking.`);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to register this animal.');
    } finally {
      setSaving(false);
    }
  }

  function handlePhotoChange(event) {
    const selectedPhoto = event.target.files?.[0] || null;
    if (selectedPhoto && selectedPhoto.size > 5 * 1024 * 1024) {
      setError('Animal photo must be 5 MB or smaller.');
      event.target.value = '';
      return;
    }
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(selectedPhoto);
    setPhotoPreview(selectedPhoto ? URL.createObjectURL(selectedPhoto) : '');
    setError('');
  }

  function removePhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(null);
    setPhotoPreview('');
    if (photoInputRef.current) photoInputRef.current.value = '';
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tracked Animals</h2>
          <p className="mt-1 text-sm text-slate-500">
            Register animals and review their latest collar GPS locations.
          </p>
        </div>
        <button
          type="button"
          onClick={loadAnimals}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className={`grid items-start gap-6 ${canRegisterAnimals ? 'xl:grid-cols-[0.8fr_1.2fr]' : ''}`}>
        {canRegisterAnimals && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-5 flex items-center gap-2 text-base font-semibold text-slate-800">
              <Plus size={17} className="text-emerald-600" />
              Register an animal
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="animal-id" className="mb-1 block text-sm font-medium text-slate-700">Animal ID</label>
                <input
                  id="animal-id"
                  required
                  maxLength={32}
                  value={animalId}
                  onChange={(event) => setAnimalId(event.target.value)}
                  placeholder="ELE001"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 uppercase text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="animal-name" className="mb-1 block text-sm font-medium text-slate-700">Name</label>
                  <input
                    id="animal-name"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Kandula"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="animal-species" className="mb-1 block text-sm font-medium text-slate-700">Species</label>
                  <input
                    id="animal-species"
                    required
                    value={species}
                    onChange={(event) => setSpecies(event.target.value)}
                    placeholder="Sri Lankan elephant"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <MapPin size={15} className="text-emerald-600" />
                  Initial GPS location <span className="font-normal text-slate-400">(optional)</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="animal-latitude" className="mb-1 block text-xs text-slate-500">Latitude</label>
                    <input
                      id="animal-latitude"
                      type="number"
                      min="-90"
                      max="90"
                      step="any"
                      value={latitude}
                      onChange={(event) => setLatitude(event.target.value)}
                      placeholder="7.87310"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="animal-longitude" className="mb-1 block text-xs text-slate-500">Longitude</label>
                    <input
                      id="animal-longitude"
                      type="number"
                      min="-180"
                      max="180"
                      step="any"
                      value={longitude}
                      onChange={(event) => setLongitude(event.target.value)}
                      placeholder="80.77180"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  The registered collar will replace this with its latest GPS reading.
                </p>
              </div>

              <div>
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Animal photo <span className="font-normal text-slate-400">(optional, max 5 MB)</span>
                </span>
                <div className="flex items-center gap-3">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Selected animal preview"
                      className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                      <ImagePlus size={22} />
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-500 hover:text-emerald-700">
                      <ImagePlus size={16} />
                      {photo ? 'Change photo' : 'Choose photo'}
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePhotoChange}
                        className="sr-only"
                      />
                    </label>
                    {photo && (
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                      >
                        <X size={15} />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">JPG, PNG or WEBP</p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={16} />
                {saving ? 'Registering...' : 'Register animal'}
              </button>
            </form>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
            <PawPrint size={17} className="text-emerald-600" />
            Registered animals <span className="text-sm font-normal text-slate-400">({animals.length})</span>
          </h3>

          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">Loading animals...</p>
          ) : animals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
              No animals are registered for tracking yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <th className="px-3 py-3 font-semibold">Photo</th>
                    <th className="px-3 py-3 font-semibold">Animal</th>
                    <th className="px-3 py-3 font-semibold">ID</th>
                    <th className="px-3 py-3 font-semibold">Latest GPS</th>
                    <th className="px-3 py-3 font-semibold">Last update</th>
                  </tr>
                </thead>
                <tbody>
                  {animals.map((animal) => {
                    const location = animal.currentLocation;
                    const hasLocation = Number.isFinite(Number(location?.latitude)) &&
                      Number.isFinite(Number(location?.longitude));

                    return (
                      <tr key={animal.animalId} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-4">
                          {animal.photo?.url ? (
                            <img
                              src={resolveApiAssetUrl(animal.photo.url)}
                              alt={`${animal.name} the ${animal.species}`}
                              className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                              <PawPrint size={19} />
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-4">
                          <p className="font-semibold text-slate-800">{animal.name}</p>
                          <p className="mt-0.5 text-sm text-slate-500">{animal.species}</p>
                        </td>
                        <td className="px-3 py-4 text-sm font-medium text-slate-700">{animal.animalId}</td>
                        <td className="px-3 py-4 text-sm text-slate-700">
                          {hasLocation
                            ? `${Number(location.latitude).toFixed(5)}, ${Number(location.longitude).toFixed(5)}`
                            : 'Waiting for GPS'}
                        </td>
                        <td className="px-3 py-4 text-sm text-slate-500">
                          {location?.lastUpdated
                            ? new Date(location.lastUpdated).toLocaleString()
                            : 'Not received'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}