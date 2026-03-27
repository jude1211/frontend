import React, { useState, useEffect, useRef, useMemo } from 'react';

interface Theatre {
  _id: string;
  name: string;
  city: string;
  address: string;
  state?: string;
  image?: string;
}

interface Props {
  onSelect: (theatre: Theatre) => void;
}

const API_BASE: string = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5000';

/** Wraps every occurrence of `term` inside `text` with a <mark> element */
function Highlight({ text, term }: { text: string; term: string }) {
  if (!term.trim()) return <>{text}</>;
  const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} style={{ background: '#e91e8c33', color: '#e91e8c', borderRadius: 3, padding: '0 2px' }}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

const TheatreSearchStep: React.FC<Props> = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [allTheatres, setAllTheatres] = useState<Theatre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch ALL theatres once on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`${API_BASE}/api/v1/special-moments/theatres`);
        const data = await res.json();
        if (data.success) setAllTheatres(data.data);
        else setError(true);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
        // Auto-focus input once data is ready
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    })();
  }, []);

  // Instant client-side filter — runs synchronously on every keystroke
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return []; // hide all until user types
    return allTheatres.filter(
      t =>
        t.name.toLowerCase().includes(q) ||
        t.city.toLowerCase().includes(q) ||
        t.address.toLowerCase().includes(q) ||
        (t.state && t.state.toLowerCase().includes(q))
    );
  }, [query, allTheatres]);

  return (
    <div className="smb-step">
      <div className="smb-step-header">
        <h2 className="smb-step-title">Select a Theatre</h2>
        <p className="smb-step-subtitle">Search for a theatre to host your special moment</p>
      </div>

      <div className="smb-search-wrap">
        <div className="smb-search-box">
          <svg className="smb-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a theatre name, city, or area..."
            className="smb-search-input"
            autoComplete="off"
            spellCheck={false}
          />
          {/* Clear button */}
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              style={{
                background: 'none', border: 'none', color: '#666', cursor: 'pointer',
                padding: '0 14px', fontSize: '1.1rem', lineHeight: 1, flexShrink: 0,
              }}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
          {loading && <div className="smb-spinner" />}
        </div>

        {/* Live count hint */}
        {!loading && allTheatres.length > 0 && (
          <p style={{ fontSize: '0.78rem', color: '#555', marginTop: 8, marginLeft: 4 }}>
            {query.trim()
              ? `${filtered.length} of ${allTheatres.length} theatres match`
              : `Start typing to search ${allTheatres.length} theatres...`}
          </p>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="smb-error-box">
          Could not load theatres. Please check your connection and refresh.
        </div>
      )}

      {/* No results */}
      {!loading && !error && query.trim() && filtered.length === 0 && (
        <div className="smb-empty">No theatres match "<strong>{query}</strong>". Try a different name or city.</div>
      )}

      {/* Theatre list */}
      <div className="smb-theatre-grid">
        {filtered.map(theatre => (
          <button
            key={theatre._id}
            className="smb-theatre-card"
            onClick={() => onSelect(theatre)}
          >
            <div className="smb-theatre-icon">🎬</div>
            <div className="smb-theatre-info">
              <h3 className="smb-theatre-name">
                <Highlight text={theatre.name} term={query} />
              </h3>
              <p className="smb-theatre-addr">
                <Highlight text={theatre.address} term={query} />
              </p>
              {theatre.city && (
                <span className="smb-theatre-city">
                  <Highlight text={theatre.city} term={query} />
                </span>
              )}
            </div>
            <svg className="smb-theatre-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TheatreSearchStep;
