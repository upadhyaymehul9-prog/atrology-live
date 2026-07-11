import { useCallback, useEffect, useRef, useState } from 'react';
import { searchLocalCities } from '../data/cities';
import { geocodePlace, type GeocodedPlace } from '../lib/geocode';
import { addPerson, updatePerson } from '../lib/storage';
import type { Person } from '../types';

interface PersonFormProps {
  onSaved: () => void;
  editPerson?: Person | null;
  onCancel?: () => void;
}

export function PersonForm({ onSaved, editPerson, onCancel }: PersonFormProps) {
  const [name, setName] = useState(editPerson?.name ?? '');
  const [phone, setPhone] = useState(editPerson?.phone ?? '');
  const [birthDate, setBirthDate] = useState(editPerson?.birthDate ?? '');
  const [birthTime, setBirthTime] = useState(editPerson?.birthTime ?? '');
  const [placeName, setPlaceName] = useState(editPerson?.placeName ?? '');
  const [resolvedPlace, setResolvedPlace] = useState<GeocodedPlace | null>(
    editPerson
      ? {
          name: editPerson.placeName,
          displayName: editPerson.placeName,
          lat: editPerson.latitude,
          lng: editPerson.longitude,
          source: 'local',
        }
      : null,
  );
  const [suggestions, setSuggestions] = useState(searchLocalCities('', 8));
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState(editPerson?.notes ?? '');
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resolvePlace = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q) {
      setResolvedPlace(null);
      return null;
    }
    setGeoLoading(true);
    const result = await geocodePlace(q);
    setGeoLoading(false);
    if (result) setResolvedPlace(result);
    return result;
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!placeName.trim()) {
      setResolvedPlace(null);
      setSuggestions(searchLocalCities('', 8));
      return;
    }

    setSuggestions(searchLocalCities(placeName, 8));

    debounceRef.current = setTimeout(() => {
      void resolvePlace(placeName);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [placeName, resolvePlace]);

  const selectSuggestion = (city: { name: string; state?: string; lat: number; lng: number }) => {
    setPlaceName(city.name);
    setResolvedPlace({
      name: city.name,
      displayName: city.state ? `${city.name}, ${city.state}` : city.name,
      lat: city.lat,
      lng: city.lng,
      source: 'local',
    });
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('Name is required');
    if (!phone.trim()) return setError('WhatsApp number is required');
    if (!birthDate) return setError('Birth date is required');
    if (!birthTime) return setError('Birth time is required');
    if (!placeName.trim()) return setError('Birth place is required');

    setSubmitting(true);
    let place = resolvedPlace;
    if (!place || place.name.toLowerCase() !== placeName.trim().toLowerCase()) {
      place = await resolvePlace(placeName);
    }
    setSubmitting(false);

    if (!place) {
      return setError(
        'Could not find this place. Try a nearby city name (e.g. Bharuch, Mumbai) or check spelling.',
      );
    }

    const data = {
      name: name.trim(),
      phone: phone.trim(),
      birthDate,
      birthTime,
      latitude: place.lat,
      longitude: place.lng,
      placeName: place.displayName,
      notes: notes.trim() || undefined,
    };

    if (editPerson) {
      updatePerson(editPerson.id, data);
    } else {
      addPerson(data);
    }

    onSaved();
  };

  return (
    <form className="person-form" onSubmit={(e) => void handleSubmit(e)}>
      <h2>{editPerson ? 'Edit Yajmaan' : 'Add New Yajmaan'}</h2>
      <p className="hint form-intro">Enter birth details — the app auto-detects yogas and fetches place coordinates.</p>

      <label>
        Full Name *
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rajesh Kumar" />
      </label>

      <label>
        WhatsApp Number (with country code) *
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="919876543210"
          inputMode="tel"
        />
        <small>Example: 91 for India + 10-digit mobile</small>
      </label>

      <div className="form-row">
        <label>
          Birth Date *
          <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        </label>
        <label>
          Birth Time *
          <input type="time" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} />
        </label>
      </div>
      <small className="hint">Use exact local birth time for accurate yoga detection</small>

      <div className="place-field">
        <label>
          Birth Place (City / Town) *
          <input
            value={placeName}
            onChange={(e) => {
              setPlaceName(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="e.g. Bharuch, Mumbai, Delhi"
            autoComplete="off"
          />
        </label>

        {showSuggestions && suggestions.length > 0 && (
          <ul className="suggestions">
            {suggestions.map((city) => (
              <li key={`${city.name}-${city.lat}`}>
                <button type="button" onMouseDown={() => selectSuggestion(city)}>
                  <strong>{city.name}</strong>
                  {city.state && <span>{city.state}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}

        {geoLoading && <p className="geo-status loading">🔍 Finding coordinates…</p>}
        {!geoLoading && resolvedPlace && (
          <p className="geo-status success">
            📍 {resolvedPlace.displayName}
            <span className="coords">
              ({resolvedPlace.lat.toFixed(4)}, {resolvedPlace.lng.toFixed(4)})
            </span>
          </p>
        )}
      </div>

      <div className="city-chips">
        {['Bharuch', 'Mumbai', 'Ahmedabad', 'Surat', 'Delhi', 'Ujjain', 'Varanasi'].map((cityName) => (
          <button
            key={cityName}
            type="button"
            className={`chip ${placeName === cityName ? 'active' : ''}`}
            onClick={() => {
              setPlaceName(cityName);
              setShowSuggestions(false);
            }}
          >
            {cityName}
          </button>
        ))}
      </div>

      <label>
        Notes (optional)
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional notes..."
          rows={2}
        />
      </label>

      {error && <p className="error">{error}</p>}

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn primary" disabled={submitting || geoLoading}>
          {submitting ? 'Saving…' : editPerson ? 'Save Changes' : 'Add & Calculate Yogas'}
        </button>
      </div>
    </form>
  );
}
