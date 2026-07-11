import { useState } from 'react';
import { INDIAN_CITIES } from '../data/cities';
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
  const [latitude, setLatitude] = useState(editPerson?.latitude?.toString() ?? '');
  const [longitude, setLongitude] = useState(editPerson?.longitude?.toString() ?? '');
  const [notes, setNotes] = useState(editPerson?.notes ?? '');
  const [error, setError] = useState('');

  const selectCity = (city: (typeof INDIAN_CITIES)[number]) => {
    setPlaceName(city.name);
    setLatitude(city.lat.toString());
    setLongitude(city.lng.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('Name is required');
    if (!phone.trim()) return setError('WhatsApp number is required');
    if (!birthDate) return setError('Birth date is required');
    if (!birthTime) return setError('Birth time is required');
    if (!latitude || !longitude) return setError('Birth place coordinates are required');

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return setError('Invalid coordinates');

    const data = {
      name: name.trim(),
      phone: phone.trim(),
      birthDate,
      birthTime,
      latitude: lat,
      longitude: lng,
      placeName: placeName.trim() || 'Custom location',
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
    <form className="person-form" onSubmit={handleSubmit}>
      <h2>{editPerson ? 'Edit Person' : 'Add New Person'}</h2>

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

      <label>
        Birth Place
        <input
          value={placeName}
          onChange={(e) => setPlaceName(e.target.value)}
          placeholder="City name"
        />
      </label>

      <div className="city-chips">
        {INDIAN_CITIES.slice(0, 8).map((city) => (
          <button
            key={city.name}
            type="button"
            className={`chip ${placeName === city.name ? 'active' : ''}`}
            onClick={() => selectCity(city)}
          >
            {city.name}
          </button>
        ))}
      </div>

      <div className="form-row">
        <label>
          Latitude *
          <input
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="28.6139"
            inputMode="decimal"
          />
        </label>
        <label>
          Longitude *
          <input
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="77.2090"
            inputMode="decimal"
          />
        </label>
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
        <button type="submit" className="btn primary">
          {editPerson ? 'Save Changes' : 'Add & Calculate Yogas'}
        </button>
      </div>
    </form>
  );
}
