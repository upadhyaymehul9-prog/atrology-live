import { useMemo, useState } from 'react';
import { PersonCard } from './components/PersonCard';
import { PersonForm } from './components/PersonForm';
import { YogaFilter } from './components/YogaFilter';
import {
  buildWhatsAppUrl,
  buildYogaReminderMessage,
  enrichAll,
  exportData,
  importData,
  loadPersons,
} from './lib/storage';
import { getYogaCatalog } from './lib/yogas';
import type { Person, YogaId } from './types';

type View = 'list' | 'add' | 'edit' | 'yoga-info';

export function App() {
  const [persons, setPersons] = useState<Person[]>(() => loadPersons());
  const [view, setView] = useState<View>('add');
  const [editId, setEditId] = useState<string | null>(null);
  const [yogaFilter, setYogaFilter] = useState<YogaId | 'all' | 'any-dosha'>('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const enriched = useMemo(() => enrichAll(persons), [persons]);

  const refresh = () => setPersons(loadPersons());

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: enriched.length, 'any-dosha': 0 };
    for (const p of enriched) {
      if (p.activeYogas.some((y) => y.category === 'dosha')) {
        result['any-dosha'] = (result['any-dosha'] ?? 0) + 1;
      }
      for (const y of p.activeYogas) {
        result[y.id] = (result[y.id] ?? 0) + 1;
      }
    }
    return result;
  }, [enriched]);

  const filtered = useMemo(() => {
    let list = enriched;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          p.placeName.toLowerCase().includes(q),
      );
    }
    if (yogaFilter === 'all') return list;
    if (yogaFilter === 'any-dosha') {
      return list.filter((p) => p.activeYogas.some((y) => y.category === 'dosha'));
    }
    return list.filter((p) => p.activeYogas.some((y) => y.id === yogaFilter));
  }, [enriched, search, yogaFilter]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkWhatsApp = () => {
    const selected = filtered.filter((p) => selectedIds.has(p.id));
    if (selected.length === 0) {
      alert('Select at least one yajmaan using the checkboxes.');
      return;
    }

    selected.forEach((person, index) => {
      const yogas =
        yogaFilter === 'all'
          ? person.activeYogas
          : yogaFilter === 'any-dosha'
            ? person.activeYogas.filter((y) => y.category === 'dosha')
            : person.activeYogas.filter((y) => y.id === yogaFilter);

      if (yogas.length === 0) return;

      const message = buildYogaReminderMessage(person.name, yogas);
      setTimeout(() => {
        window.open(buildWhatsAppUrl(person.phone, message), '_blank');
      }, index * 800);
    });
  };

  const handleExport = () => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yoga-jyotish-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const count = importData(text);
        refresh();
        alert(`Imported ${count} yajmaan successfully.`);
      } catch {
        alert('Failed to import. Please check the file format.');
      }
    };
    input.click();
  };

  const editPerson = editId ? persons.find((p) => p.id === editId) : null;

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <div>
            <h1>☸ Yoga Jyotish</h1>
            <p className="subtitle">Vedic Yoga & Dosha Finder · Data stays on your phone</p>
          </div>
        </div>
        <nav className="nav-tabs">
          <button
            type="button"
            className={view === 'add' || view === 'edit' ? 'active' : ''}
            onClick={() => {
              setEditId(null);
              setView('add');
            }}
          >
            + Add Yajmaan
          </button>
          <button
            type="button"
            className={view === 'list' ? 'active' : ''}
            onClick={() => setView('list')}
          >
            Yajmaan ({persons.length})
          </button>
          <button
            type="button"
            className={view === 'yoga-info' ? 'active' : ''}
            onClick={() => setView('yoga-info')}
          >
            Yoga List
          </button>
        </nav>
      </header>

      <main className="main">
        {view === 'list' && (
          <>
            <div className="toolbar">
              <input
                className="search"
                placeholder="Search yajmaan name, phone, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <YogaFilter value={yogaFilter} onChange={setYogaFilter} counts={counts} />
            </div>

            <div className="bulk-bar">
              <span>{filtered.length} shown · {selectedIds.size} selected</span>
              <div className="bulk-actions">
                <button type="button" className="btn whatsapp" onClick={bulkWhatsApp}>
                  Remind Selected on WhatsApp
                </button>
                <button type="button" className="btn secondary small" onClick={handleExport}>
                  Backup
                </button>
                <button type="button" className="btn secondary small" onClick={handleImport}>
                  Restore
                </button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="empty">
                <p>No yajmaan found.</p>
                <button type="button" className="btn primary" onClick={() => setView('add')}>
                  Add your first yajmaan
                </button>
              </div>
            ) : (
              <div className="person-list">
                {filtered.map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    selectedYogaFilter={yogaFilter}
                    onEdit={(id: string) => {
                      setEditId(id);
                      setView('edit');
                    }}
                    onDelete={refresh}
                    isSelected={selectedIds.has(person.id)}
                    onToggleSelect={toggleSelect}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {(view === 'add' || view === 'edit') && (
          <PersonForm
            editPerson={editPerson}
            onSaved={() => {
              refresh();
              setView('list');
              setEditId(null);
            }}
            onCancel={() => {
              setView('list');
              setEditId(null);
            }}
          />
        )}

        {view === 'yoga-info' && <YogaInfoPanel />}
      </main>

      <footer className="footer">
        <p>🔒 All data stored locally on this device · No server · Free PWA</p>
        <p>Install: Share → Add to Home Screen (iPhone) or Install App (Android)</p>
      </footer>
    </div>
  );
}

function YogaInfoPanel() {
  const catalog = getYogaCatalog();

  return (
    <div className="yoga-info">
      <h2>Supported Yogas & Doshas</h2>
      <p className="hint">
        Each yajmaan&apos;s chart is calculated using Lahiri ayanamsa and whole-sign houses.
      </p>
      <ul className="yoga-catalog">
        {catalog.map((y) => (
          <li key={y.id} className={`catalog-item severity-${y.severity}`}>
            <div className="catalog-header">
              <strong>{y.name}</strong>
              <span className="hi">{y.nameHi}</span>
              <span className={`badge ${y.category}`}>{y.category}</span>
            </div>
            <p>{y.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
