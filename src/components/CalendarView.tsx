import { useMemo, useState } from 'react';
import { loadPersons } from '../lib/storage';
import {
  addEvent,
  deleteEvent,
  formatDateKey,
  formatDisplayDate,
  formatTimeRange,
  getDatesWithEvents,
  getEventsForDate,
  updateEvent,
} from '../lib/calendarStorage';
import {
  EVENT_TYPE_LABELS,
  type ScheduleEvent,
  type ScheduleEventType,
} from '../types/schedule';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_GU = ['રવિ', 'સોમ', 'મંગળ', 'બુધ', 'ગુરુ', 'શુક્ર', 'શનિ'];

export function CalendarView() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(formatDateKey(today));
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState<ScheduleEvent | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const eventDates = useMemo(
    () => getDatesWithEvents(year, month),
    [year, month, refreshKey],
  );

  const dayEvents = useMemo(
    () => getEventsForDate(selectedDate),
    [selectedDate, refreshKey],
  );

  const calendarDays = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const monthLabel = viewDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToday = () => {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(formatDateKey(now));
  };

  const openAdd = () => {
    setEditEvent(null);
    setShowForm(true);
  };

  const openEdit = (event: ScheduleEvent) => {
    setEditEvent(event);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this schedule item?')) {
      deleteEvent(id);
      refresh();
    }
  };

  return (
    <div className="calendar-view">
      <div className="cal-header">
        <h2>📅 કેલેન્ડર / Schedule</h2>
        <p className="hint">Store meetings, work & full-day plans — saved on your phone</p>
      </div>

      <div className="cal-nav">
        <button type="button" className="btn secondary small" onClick={prevMonth}>
          ‹
        </button>
        <button type="button" className="cal-month-label" onClick={goToday}>
          {monthLabel}
        </button>
        <button type="button" className="btn secondary small" onClick={nextMonth}>
          ›
        </button>
      </div>

      <div className="cal-weekdays">
        {WEEKDAYS.map((d, i) => (
          <span key={d} title={WEEKDAYS_GU[i]}>
            {d}
          </span>
        ))}
      </div>

      <div className="cal-grid">
        {calendarDays.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} className="cal-day empty" />;
          const dateKey = formatDateKey(cell);
          const isToday = dateKey === formatDateKey(today);
          const isSelected = dateKey === selectedDate;
          const hasEvents = eventDates.has(dateKey);
          return (
            <button
              key={dateKey}
              type="button"
              className={`cal-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasEvents ? 'has-events' : ''}`}
              onClick={() => setSelectedDate(dateKey)}
            >
              <span className="cal-day-num">{cell.getDate()}</span>
              {hasEvents && <span className="cal-dot" />}
            </button>
          );
        })}
      </div>

      <div className="cal-day-panel">
        <div className="cal-day-header">
          <div>
            <h3>{formatDisplayDate(selectedDate)}</h3>
            <p className="hint">{dayEvents.length} item(s) scheduled</p>
          </div>
          <button type="button" className="btn primary small" onClick={openAdd}>
            + Add
          </button>
        </div>

        {dayEvents.length === 0 ? (
          <div className="cal-empty">
            <p>No schedule for this day.</p>
            <button type="button" className="btn secondary" onClick={openAdd}>
              Add meeting or work
            </button>
          </div>
        ) : (
          <ul className="cal-event-list">
            {dayEvents.map((event) => (
              <li key={event.id} className={`cal-event type-${event.type}`}>
                <div className="cal-event-icon">{EVENT_TYPE_LABELS[event.type].icon}</div>
                <div className="cal-event-body">
                  <strong>{event.title}</strong>
                  <span className="cal-event-time">{formatTimeRange(event)}</span>
                  <span className="cal-event-type">
                    {EVENT_TYPE_LABELS[event.type].gu} · {EVENT_TYPE_LABELS[event.type].en}
                  </span>
                  {event.yajmaanName && (
                    <span className="cal-event-yajmaan">👤 {event.yajmaanName}</span>
                  )}
                  {event.notes && <p className="cal-event-notes">{event.notes}</p>}
                </div>
                <div className="cal-event-actions">
                  <button type="button" className="btn secondary small" onClick={() => openEdit(event)}>
                    Edit
                  </button>
                  <button type="button" className="btn danger small" onClick={() => handleDelete(event.id)}>
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showForm && (
        <EventFormModal
          date={selectedDate}
          editEvent={editEvent}
          onClose={() => {
            setShowForm(false);
            setEditEvent(null);
          }}
          onSaved={() => {
            refresh();
            setShowForm(false);
            setEditEvent(null);
          }}
        />
      )}
    </div>
  );
}

function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const days: (Date | null)[] = Array(startPad).fill(null);
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

interface EventFormModalProps {
  date: string;
  editEvent: ScheduleEvent | null;
  onClose: () => void;
  onSaved: () => void;
}

function EventFormModal({ date, editEvent, onClose, onSaved }: EventFormModalProps) {
  const persons = loadPersons();
  const [title, setTitle] = useState(editEvent?.title ?? '');
  const [eventDate, setEventDate] = useState(editEvent?.date ?? date);
  const [startTime, setStartTime] = useState(editEvent?.startTime ?? '09:00');
  const [endTime, setEndTime] = useState(editEvent?.endTime ?? '10:00');
  const [type, setType] = useState<ScheduleEventType>(editEvent?.type ?? 'meeting');
  const [notes, setNotes] = useState(editEvent?.notes ?? '');
  const [yajmaanId, setYajmaanId] = useState(editEvent?.yajmaanId ?? '');
  const [error, setError] = useState('');

  const isAllDay = type === 'all-day';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError('Title is required');

    const selectedPerson = persons.find((p) => p.id === yajmaanId);
    const data = {
      title: title.trim(),
      date: eventDate,
      startTime: isAllDay ? '' : startTime,
      endTime: isAllDay ? '' : endTime,
      type,
      notes: notes.trim() || undefined,
      yajmaanId: yajmaanId || undefined,
      yajmaanName: selectedPerson?.name,
    };

    if (editEvent) {
      updateEvent(editEvent.id, data);
    } else {
      addEvent(data);
    }
    onSaved();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-card event-form-modal" onClick={(e) => e.stopPropagation()} role="dialog">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h3>{editEvent ? 'Edit Schedule' : 'Add Schedule'}</h3>

        <form className="event-form" onSubmit={handleSubmit}>
          <label>
            Title *
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Client meeting, puja, etc." />
          </label>

          <label>
            Type
            <select value={type} onChange={(e) => setType(e.target.value as ScheduleEventType)}>
              {(Object.keys(EVENT_TYPE_LABELS) as ScheduleEventType[]).map((t) => (
                <option key={t} value={t}>
                  {EVENT_TYPE_LABELS[t].icon} {EVENT_TYPE_LABELS[t].gu} — {EVENT_TYPE_LABELS[t].en}
                </option>
              ))}
            </select>
          </label>

          <label>
            Date *
            <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          </label>

          {!isAllDay && (
            <div className="form-row">
              <label>
                Start time
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </label>
              <label>
                End time
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </label>
            </div>
          )}

          {persons.length > 0 && (
            <label>
              Link Yajmaan (optional)
              <select value={yajmaanId} onChange={(e) => setYajmaanId(e.target.value)}>
                <option value="">— None —</option>
                {persons.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Address, agenda, remedy details..."
              rows={3}
            />
          </label>

          {error && <p className="error">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn primary">
              {editEvent ? 'Save' : 'Add to Calendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
