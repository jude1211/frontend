import React, { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import { apiService } from '../services/api';

const ManageScreensAndShows: React.FC = () => {
  const [ownerMovies, setOwnerMovies] = useState<any[]>([]);
  const [ownerScreens, setOwnerScreens] = useState<any[]>([]);
  const [selectedMovieId, setSelectedMovieId] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [selectedScreenId, setSelectedScreenId] = useState<string>('');
  const [showtimesInput, setShowtimesInput] = useState<string>('');
  const [shows, setShows] = useState<any[]>([]);
  const [showtimeError, setShowtimeError] = useState<string | null>(null);
  const [bookingDate, setBookingDate] = useState<string>(''); // YYYY-MM-DD
  const [maxAdvanceDays, setMaxAdvanceDays] = useState<number>(3);
  const [popupOpen, setPopupOpen] = useState<boolean>(false);
  const [popupContent, setPopupContent] = useState<{ title?: string; message: string }>({ message: '' });
  const [movieFilter, setMovieFilter] = useState<'all' | 'now_showing' | 'coming_soon'>('all');

  const openPopup = (message: string, title?: string) => {
    setPopupContent({ title, message });
    setPopupOpen(true);
  };
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMovieId, setEditMovieId] = useState<string>('');
  const [editScreenId, setEditScreenId] = useState<string>('');
  const [editShowtimesInput, setEditShowtimesInput] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        // Prefer authenticated theatre owner profile to obtain the correct owner id
        const profile = await apiService.getTheatreOwnerProfile?.();
        const ownerId = profile?.success ? (profile.data?.id || profile.data?._id) : null;
        let resolvedOwnerId = ownerId;
        if (!resolvedOwnerId) {
          // Fallbacks
          const ownerLocal = localStorage.getItem('theatreOwnerData');
          if (ownerLocal) {
            try { resolvedOwnerId = JSON.parse(ownerLocal)?._id || JSON.parse(ownerLocal)?.id; } catch {}
          }
        }
        if (!resolvedOwnerId) {
          const user = localStorage.getItem('user');
          if (user) {
            try { resolvedOwnerId = JSON.parse(user)?._id || JSON.parse(user)?.id; } catch {}
          }
        }
        if (!resolvedOwnerId) return;

        const [moviesRes, screensRes] = await Promise.all([
          apiService.getTheatreOwnerMovies(resolvedOwnerId as string),
          apiService.getOwnerScreens(resolvedOwnerId as string)
        ]);
        if (moviesRes.success) setOwnerMovies(moviesRes.data || []);
        if (screensRes.success) setOwnerScreens(screensRes.data?.screens || []);
      } catch {}
    };
    load();
  }, []);

  // When movie selection changes, derive duration and selectedMovie
  useEffect(() => {
    if (!selectedMovieId) {
      setDuration('');
      return;
    }
    const movie = ownerMovies.find((m: any) => String(m._id) === String(selectedMovieId));
    if (movie) {
      const raw = (movie.duration ?? movie.runtime ?? '');
      if (raw === '' || raw === undefined || raw === null) {
        setDuration('Not Available');
      } else if (typeof raw === 'number') {
        setDuration(`${raw} min`);
      } else if (typeof raw === 'string' && raw.trim().length > 0) {
        setDuration(raw);
      } else {
        setDuration('Not Available');
      }
    } else {
      setDuration('');
    }
  }, [selectedMovieId, ownerMovies]);

  useEffect(() => {
    const loadShows = async () => {
      if (!selectedScreenId) return setShows([]);
      try {
        // Fetch ALL shows for the selected screen, not just for a specific date
        const res = await apiService.getScreenShows(selectedScreenId);
        if (res.success) setShows(res.data || []);
      } catch {}
    };
    loadShows();
  }, [selectedScreenId]);
  // --- Booking date helpers ---
  const getTodayIso = (): string => new Date().toISOString().slice(0,10);
  const addDaysIso = (base: string, days: number): string => {
    const d = new Date(base + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0,10);
  };

  // --- Movie status and runtime helpers ---
  const calculateMovieStatus = (movie: any): { status: string; runtimeDays: number; isAdvanceBooking: boolean } => {
    const today = new Date();
    const releaseDate = movie.releaseDate ? new Date(movie.releaseDate) : null;
    const firstShowDate = movie.firstShowDate ? new Date(movie.firstShowDate) : null;
    
    let status = 'Coming Soon';
    let runtimeDays = 0;
    let isAdvanceBooking = false;
    
    if (releaseDate && releaseDate <= today) {
      status = 'Now Showing';
      if (firstShowDate) {
        runtimeDays = Math.max(1, Math.ceil((today.getTime() - firstShowDate.getTime()) / (1000 * 60 * 60 * 24)));
      } else if (releaseDate) {
        runtimeDays = Math.max(1, Math.ceil((today.getTime() - releaseDate.getTime()) / (1000 * 60 * 60 * 24)));
      }
    } else if (releaseDate && releaseDate > today && movie.advanceBookingEnabled) {
      isAdvanceBooking = true;
    }
    
    return { status, runtimeDays, isAdvanceBooking };
  };

  const filteredMovies = ownerMovies.filter(movie => {
    if (movieFilter === 'all') return true;
    const { status } = calculateMovieStatus(movie);
    if (movieFilter === 'now_showing') return status === 'Now Showing';
    if (movieFilter === 'coming_soon') return status === 'Coming Soon';
    return true;
  });
  useEffect(() => {
    if (!bookingDate) setBookingDate(getTodayIso());
  }, []);

  // Derived chips preview and time validation helper
  const plannedChips = showtimesInput.split(',').map(s => s.trim()).filter(Boolean);

  const parseAndValidateShowtimes = (raw: string): string[] | null => {
    const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
    if (!parts.length) return [];
    const time12 = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;
    const time24 = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    for (const p of parts) {
      const token = p.toUpperCase().replace(/\s+/g, ' ').trim();
      if (!(time12.test(token) || time24.test(token))) {
        setShowtimeError(`Invalid time: "${p}". Use formats like 10:00 AM or 13:45.`);
        return null;
      }
    }
    setShowtimeError(null);
    return parts;
  };

  // --- Time & duration utilities ---
  const parseDurationToMinutes = (raw: string | number | undefined | null): number | null => {
    if (raw === undefined || raw === null) return null;
    if (typeof raw === 'number') return raw > 0 ? Math.round(raw) : null;
    const s = String(raw).trim().toLowerCase();
    if (!s) return null;
    // Patterns: "130", "130m", "130 min", "2h 10m", "2:10", "2h", "150 minutes"
    const justNum = s.match(/^\d+$/);
    if (justNum) return parseInt(justNum[0], 10);
    const minutesOnly = s.match(/(\d+)\s*(m|min|minutes?)\b/);
    const hoursOnly = s.match(/(\d+)\s*(h|hr|hrs|hour|hours)\b/);
    const hoursMinutes = s.match(/(\d+)\s*(h|hr|hrs|hour|hours)\s*(\d+)\s*(m|min|minutes?)?/);
    const clockLike = s.match(/^(\d{1,2}):(\d{2})$/); // 2:10 meaning 2h10m
    if (hoursMinutes) {
      const h = parseInt(hoursMinutes[1], 10);
      const m = parseInt(hoursMinutes[3] || '0', 10);
      return h * 60 + m;
    }
    if (hoursOnly) {
      const h = parseInt(hoursOnly[1], 10);
      return h * 60;
    }
    if (minutesOnly) {
      return parseInt(minutesOnly[1], 10);
    }
    if (clockLike) {
      const h = parseInt(clockLike[1], 10);
      const m = parseInt(clockLike[2], 10);
      return h * 60 + m;
    }
    // Fallback: try to extract all numbers and assume the first is minutes
    const anyNum = s.match(/\d+/);
    return anyNum ? parseInt(anyNum[0], 10) : null;
  };

  const parseTimeToMinutes = (token: string): number => {
    const t = token.trim();
    const ampm = /(am|pm)$/i.test(t);
    if (ampm) {
      const m = t.toUpperCase().replace(/\s+/g, '').match(/^(\d{1,2}):(\d{2})(AM|PM)$/);
      if (!m) return NaN;
      let hh = parseInt(m[1], 10);
      const mm = parseInt(m[2], 10);
      const isPM = m[3] === 'PM';
      if (hh === 12) hh = isPM ? 12 : 0; else if (isPM) hh += 12;
      return hh * 60 + mm;
    } else {
      const m = t.match(/^(\d{1,2}):(\d{2})$/);
      if (!m) return NaN;
      const hh = parseInt(m[1], 10);
      const mm = parseInt(m[2], 10);
      return hh * 60 + mm;
    }
  };

  const detectInternalOverlaps = (times: string[], durationMin: number): string | null => {
    const intervals = times.map(tok => {
      const start = parseTimeToMinutes(tok);
      return { start, end: start + durationMin, label: tok };
    }).sort((a,b)=> a.start - b.start);
    for (const it of intervals) {
      if (isNaN(it.start)) return `Invalid time detected: ${it.label}`;
      if (it.end > 24*60) return `Showtime ${it.label} exceeds the day given duration (${durationMin}m)`;
    }
    for (let i=1;i<intervals.length;i++) {
      if (intervals[i].start < intervals[i-1].end) {
        return `Overlapping times within plan: ${intervals[i-1].label} and ${intervals[i].label}`;
      }
    }
    return null;
  };

  const getExistingShowIntervals = (list: any[]): Array<{ start:number; end:number; label:string; showId:string }> => {
    const result: Array<{ start:number; end:number; label:string; showId:string }> = [];
    for (const sh of list || []) {
      const durRaw = (sh.movieId?.duration ?? sh.movieId?.runtime ?? sh.duration ?? sh.runtime ?? null);
      const durMin = parseDurationToMinutes(durRaw) ?? 0;
      if (!Array.isArray(sh.showtimes) || durMin <= 0) continue;
      for (const t of sh.showtimes) {
        const start = parseTimeToMinutes(String(t));
        if (isNaN(start)) continue;
        const end = start + durMin;
        result.push({ start, end, label: String(t), showId: String(sh._id || '') });
      }
    }
    return result;
  };

  const detectOverlapAgainstExisting = (times: string[], durationMin: number, existing: Array<{ start:number; end:number; label:string; showId:string }>, excludeShowId?: string): string | null => {
    const plan = times.map(tok => {
      const s = parseTimeToMinutes(tok);
      return { start: s, end: s + durationMin, label: tok };
    });
    for (const p of plan) {
      if (isNaN(p.start)) return `Invalid time detected: ${p.label}`;
      if (p.end > 24*60) return `Showtime ${p.label} exceeds the day given duration (${durationMin}m)`;
      for (const ex of existing) {
        if (excludeShowId && ex.showId && String(ex.showId) === String(excludeShowId)) continue;
        // overlap if start < other.end and end > other.start
        if (p.start < ex.end && p.end > ex.start) {
          return `Overlaps with existing show at ${ex.label}`;
        }
      }
    }
    return null;
  };

  const normalizeTimeLabel = (t: string): string => {
    const s = t.trim().toUpperCase().replace(/\s+/g, ' ');
    // Convert 24h to 12h for stable equality comparison
    const m24 = s.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (m24) {
      let hh = parseInt(m24[1], 10);
      const mm = m24[2];
      const ampm = hh >= 12 ? 'PM' : 'AM';
      if (hh === 0) hh = 12; else if (hh > 12) hh -= 12;
      return `${hh}:${mm} ${ampm}`;
    }
    const m12 = s.match(/^(0?[1-9]|1[0-2]):([0-5]\d)\s?(AM|PM)$/);
    if (m12) {
      const h = String(parseInt(m12[1], 10));
      return `${h}:${m12[2]} ${m12[3]}`;
    }
    return s;
  };

  const hasExactDuplicateAgainstExisting = (times: string[], existingShows: any[], excludeShowId?: string): string | null => {
    const planned = new Set(times.map(normalizeTimeLabel));
    for (const sh of existingShows || []) {
      if (excludeShowId && String(sh._id) === String(excludeShowId)) continue;
      if (!Array.isArray(sh.showtimes)) continue;
      for (const t of sh.showtimes) {
        if (planned.has(normalizeTimeLabel(String(t)))) {
          return `Exact duplicate with existing showtime: ${String(t)}`;
        }
      }
    }
    return null;
  };

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">Manage Screens & Shows</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Movie</label>
              <div className="mb-2">
                <div className="flex gap-2 text-xs">
                  <button 
                    onClick={() => setMovieFilter('all')}
                    className={`px-2 py-1 rounded ${movieFilter === 'all' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setMovieFilter('now_showing')}
                    className={`px-2 py-1 rounded ${movieFilter === 'now_showing' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  >
                    Now Showing
                  </button>
                  <button 
                    onClick={() => setMovieFilter('coming_soon')}
                    className={`px-2 py-1 rounded ${movieFilter === 'coming_soon' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  >
                    Coming Soon
                  </button>
                </div>
              </div>
              <select value={selectedMovieId} onChange={(e)=>setSelectedMovieId(e.target.value)} className="w-full bg-black/40 border border-gray-700 text-white rounded-lg px-3 py-2">
                <option value="">Select a movie</option>
                {filteredMovies.map((m:any)=> {
                  const { status, runtimeDays, isAdvanceBooking } = calculateMovieStatus(m);
                  const statusText = status === 'Now Showing' ? `(Now Showing - Day ${runtimeDays})` : 
                                   isAdvanceBooking ? '(Coming Soon - Advance Booking)' : 
                                   '(Coming Soon)';
                  return (
                    <option key={m._id} value={m._id}>
                      {m.title} {statusText}
                    </option>
                  );
                })}
              </select>
              {filteredMovies.length === 0 && (
                <div className="text-xs text-gray-400 mt-2">
                  {movieFilter === 'all' ? 'No movies found. Add one in ' : `No ${movieFilter.replace('_', ' ')} movies found. `}
                  {movieFilter === 'all' && <a href="#/theatre-owner/movies" className="text-red-400 underline">Movie Management</a>}
                </div>
              )}
              <div className="mt-3">
                <label className="block text-xs text-gray-400 mb-1">Duration</label>
                <input
                  value={duration}
                  onChange={(e)=>setDuration(e.target.value)}
                  placeholder={selectedMovieId ? 'Not Available' : ''}
                  disabled={!selectedMovieId}
                  className="w-full bg-black/40 border border-gray-700 text-white rounded-lg px-3 py-2 disabled:opacity-60"
                />
              </div>
              {selectedMovieId && (() => {
                const selectedMovie = ownerMovies.find(m => m._id === selectedMovieId);
                if (selectedMovie && selectedMovie.releaseDate && new Date(selectedMovie.releaseDate) > new Date()) {
                  return (
                    <div className="mt-3">
                      <label className="flex items-center gap-2 text-xs text-gray-400">
                        <input
                          type="checkbox"
                          checked={selectedMovie.advanceBookingEnabled || false}
                          onChange={async (e) => {
                            try {
                              const res = await apiService.updateMovieAdvanceBooking(selectedMovieId, e.target.checked);
                              if (res.success) {
                                // Update local state
                                setOwnerMovies(prev => prev.map(m => 
                                  m._id === selectedMovieId 
                                    ? { ...m, advanceBookingEnabled: e.target.checked }
                                    : m
                                ));
                              }
                            } catch (error) {
                              console.error('Failed to update advance booking:', error);
                            }
                          }}
                          className="rounded"
                        />
                        Enable Advance Booking
                      </label>
                      <div className="text-xs text-gray-500 mt-1">
                        Allow bookings before release date ({selectedMovie.releaseDate})
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Screen</label>
              <select value={selectedScreenId} onChange={(e)=>setSelectedScreenId(e.target.value)} className="w-full bg-black/40 border border-gray-700 text-white rounded-lg px-3 py-2">
                <option value="">Select a screen</option>
                {ownerScreens.map((s:any)=> (
                  <option key={s.screenNumber} value={String(s.screenNumber)}>Screen {s.screenNumber}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Booking Date</label>
              <input
                type="date"
                value={bookingDate}
                min={getTodayIso()}
                max={addDaysIso(getTodayIso(), Math.max(0, maxAdvanceDays))}
                onChange={(e)=> setBookingDate(e.target.value)}
                className="w-full bg-black/40 border border-gray-700 text-white rounded-lg px-3 py-2"
              />
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                <span>Limit days:</span>
                <input type="number" min={0} max={14} value={maxAdvanceDays} onChange={(e)=> setMaxAdvanceDays(Math.min(14, Math.max(0, parseInt(e.target.value||'0',10))))} className="w-16 bg-black/40 border border-gray-700 text-white rounded px-2 py-1" />
              </div>
              {selectedMovieId && (() => {
                const selectedMovie = ownerMovies.find(m => m._id === selectedMovieId);
                if (selectedMovie) {
                  const { status, isAdvanceBooking } = calculateMovieStatus(selectedMovie);
                  const isAdvanceBookingDate = selectedMovie.releaseDate && new Date(bookingDate) < new Date(selectedMovie.releaseDate);
                  
                  return (
                    <div className="mt-2 space-y-1">
                      {status === 'Coming Soon' && isAdvanceBooking && isAdvanceBookingDate && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="bg-green-600 text-white px-2 py-1 rounded-full">Advance Booking</span>
                          <span className="text-gray-400">Releases: {selectedMovie.releaseDate}</span>
                        </div>
                      )}
                      {status === 'Now Showing' && (
                        <div className="text-xs text-gray-400">
                          <i className="fas fa-play-circle mr-1"></i>
                          Currently showing in theatres
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Showtimes</label>
              <input value={showtimesInput} onChange={(e)=>setShowtimesInput(e.target.value)} placeholder="e.g. 10:00 AM, 1:30 PM" className="w-full bg-black/40 border border-gray-700 text-white rounded-lg px-3 py-2" />
              {showtimeError && <div className="text-xs text-red-400 mt-1">{showtimeError}</div>}
              {plannedChips.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {plannedChips.map((t, idx) => (
                    <span key={`${t}-${idx}`} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] bg-emerald-500/15 text-emerald-200 border border-emerald-400/30">
                      <i className="fas fa-clock"></i>{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button onClick={async ()=>{
            if (!selectedMovieId || !selectedScreenId) { openPopup('Please select both a movie and a screen.', 'Missing selection'); return; }
            const times = parseAndValidateShowtimes(showtimesInput);
            if (times === null) return; // invalid format
            // Determine duration from selected movie
            const selectedMovie = ownerMovies.find((m:any)=> String(m._id) === String(selectedMovieId));
            const durationMin = parseDurationToMinutes(selectedMovie?.duration ?? selectedMovie?.runtime ?? duration);
            if (!durationMin || durationMin <= 0) {
              setShowtimeError('Movie duration not available. Please enter duration or update the movie.');
              return;
            }
            // Internal overlaps within planned times
            const internalErr = detectInternalOverlaps(times, durationMin);
            if (internalErr) { setShowtimeError(internalErr); return; }
            // Against existing shows on this screen
            const existing = getExistingShowIntervals(shows);
            const extErr = detectOverlapAgainstExisting(times, durationMin, existing) || hasExactDuplicateAgainstExisting(times, shows);
            if (extErr) { setShowtimeError(extErr); return; }
            const res = await apiService.saveScreenShows(selectedScreenId, selectedMovieId, times, bookingDate || getTodayIso(), maxAdvanceDays);
            if (res.success) {
              setShowtimesInput('');
              try {
                // Refresh ALL shows for the screen after successful assignment
                const list = await apiService.getScreenShows(selectedScreenId);
                if (list.success) setShows(list.data || []);
              } catch {}
            } else {
              openPopup(res.error || 'Failed to save shows', 'Save failed');
            }
          }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">Assign Movie to Screen</button>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Existing Shows {selectedScreenId && `- Screen ${selectedScreenId}`}
          </h2>
          {(!shows || shows.length === 0) && (
            <p className="text-gray-400">
              {selectedScreenId ? `No shows assigned to Screen ${selectedScreenId}.` : 'Select a screen to view its shows.'}
            </p>
          )}
          <div className="space-y-3">
            {shows.map((sh:any)=> (
              <div key={sh._id} className="flex items-start justify-between bg-black/30 border border-gray-700 rounded-lg px-4 py-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="h-12 w-9 rounded overflow-hidden bg-gray-700 flex items-center justify-center flex-shrink-0">
                    {sh.movieId?.posterUrl ? (
                      <img src={sh.movieId.posterUrl} alt={sh.movieId?.title || 'poster'} className="h-full w-full object-cover" />
                    ) : (
                      <i className="fas fa-film text-gray-400"></i>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {editingId === sh._id ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Movie</label>
                          <select value={editMovieId} onChange={(e)=>setEditMovieId(e.target.value)} className="w-full bg-black/40 border border-gray-700 text-white rounded px-2 py-1">
                            {ownerMovies.map((m:any)=> (
                              <option key={m._id} value={m._id}>{m.title}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Screen</label>
                          <select value={editScreenId} onChange={(e)=>setEditScreenId(e.target.value)} className="w-full bg-black/40 border border-gray-700 text-white rounded px-2 py-1">
                            {ownerScreens.map((s:any)=> (
                              <option key={s.screenNumber} value={String(s.screenNumber)}>Screen {s.screenNumber}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Showtimes</label>
                          <input value={editShowtimesInput} onChange={(e)=>setEditShowtimesInput(e.target.value)} className="w-full bg-black/40 border border-gray-700 text-white rounded px-2 py-1" placeholder="e.g. 10:00 AM, 1:30 PM" />
                        </div>
                        {showtimeError && (
                          <div className="md:col-span-3 text-xs text-red-400">{showtimeError}</div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                        <div className="text-white font-medium truncate">{sh.movieId?.title || 'Movie'}</div>
                          {(() => {
                            const movie = ownerMovies.find(m => m._id === sh.movieId?._id || sh.movieId);
                            if (movie) {
                              const { status, isAdvanceBooking } = calculateMovieStatus(movie);
                              const isAdvanceBookingDate = movie.releaseDate && new Date(sh.bookingDate) < new Date(movie.releaseDate);
                              
                              return (
                                <div className="flex gap-1">
                                  {status === 'Now Showing' && (
                                    <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                                      Now Showing
                                    </span>
                                  )}
                                  {status === 'Coming Soon' && isAdvanceBooking && isAdvanceBookingDate && (
                                    <span className="bg-green-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                                      Advance Booking
                                    </span>
                                  )}
                                  {status === 'Coming Soon' && !isAdvanceBookingDate && (
                                    <span className="bg-yellow-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                                      Coming Soon
                                    </span>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <div className="mt-1 text-xs text-gray-400 mb-2 space-y-1">
                          <div>
                            <i className="fas fa-calendar mr-1"></i>
                            Booking Date: {sh.bookingDate || 'Not specified'}
                          </div>
                          {(() => {
                            const movie = ownerMovies.find(m => m._id === sh.movieId?._id || sh.movieId);
                            if (movie) {
                              const { status, runtimeDays } = calculateMovieStatus(movie);
                              if (status === 'Now Showing' && runtimeDays > 0) {
                                return (
                                  <div>
                                    <i className="fas fa-clock mr-1"></i>
                                    Running for {runtimeDays} day{runtimeDays !== 1 ? 's' : ''}
                                  </div>
                                );
                              }
                              if (status === 'Coming Soon' && movie.releaseDate) {
                                return (
                                  <div>
                                    <i className="fas fa-star mr-1"></i>
                                    Releases: {movie.releaseDate}
                                  </div>
                                );
                              }
                            }
                            return null;
                          })()}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(sh.showtimes||[]).map((t:string, idx:number)=> (
                            <span key={`${sh._id}-t-${idx}`} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] bg-emerald-500/15 text-emerald-200 border border-emerald-400/30"><i className="fas fa-clock"></i>{t}</span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1 ml-3">
                  {editingId === sh._id ? (
                    <>
                      <button onClick={async()=>{
                        const parsed = parseAndValidateShowtimes(editShowtimesInput);
                        if (parsed === null) return;
                        const originalMovieId = (typeof sh.movieId === 'string') ? sh.movieId : (sh.movieId?._id || sh.movieId?.id);
                        const originalScreenId = String(sh.screenId || selectedScreenId);
                        const newMovieId = editMovieId || originalMovieId;
                        const newScreenId = editScreenId || originalScreenId;
                        // Pull duration for the (possibly) new movie
                        let newMovie = ownerMovies.find((m:any)=> String(m._id) === String(newMovieId));
                        if (!newMovie && typeof sh.movieId === 'object') newMovie = sh.movieId;
                        const durationMin = parseDurationToMinutes(newMovie?.duration ?? newMovie?.runtime ?? null);
                        if (!durationMin || durationMin <= 0) {
                          setShowtimeError('Movie duration not available for validation.');
                          return;
                        }
                        // Validate overlaps within plan
                        const internalErr = detectInternalOverlaps(parsed, durationMin);
                        if (internalErr) { setShowtimeError(internalErr); return; }
                        // Load existing shows for target screen (if changed, fetch fresh)
                        let existingShowsForTarget = shows;
                        if (String(newScreenId) !== String(selectedScreenId)) {
                          try {
                            const list = await apiService.getScreenShows(newScreenId);
                            if (list.success) existingShowsForTarget = list.data || [];
                          } catch {}
                        }
                        const existing = getExistingShowIntervals(existingShowsForTarget);
                        const extErr = detectOverlapAgainstExisting(parsed, durationMin, existing, String(sh._id)) || hasExactDuplicateAgainstExisting(parsed, existingShowsForTarget, String(sh._id));
                        if (extErr) { setShowtimeError(extErr); return; }
                        setShowtimeError(null);
                        // If movie or screen changed, remove the old doc to avoid unique clash
                        if (newMovieId !== originalMovieId || newScreenId !== originalScreenId) {
                          try { await apiService.deleteScreenShow(originalScreenId, sh._id); } catch {}
                        }
                        const save = await apiService.saveScreenShows(newScreenId, newMovieId, parsed, bookingDate || getTodayIso(), maxAdvanceDays);
                        if (save.success) {
                          setEditingId(null);
                          try {
                            // Refresh ALL shows for the screen after successful edit
                            const list = await apiService.getScreenShows(newScreenId);
                            if (list.success) setShows(list.data || []);
                          } catch {}
                        }
                      }} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded">Save</button>
                      <button onClick={()=>{ setEditingId(null); setShowtimeError(null); }} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded">Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={()=>{
                        setEditingId(sh._id);
                        const movieKey = (typeof sh.movieId === 'string') ? sh.movieId : (sh.movieId?._id || '');
                        setEditMovieId(String(movieKey));
                        setEditScreenId(String(sh.screenId || selectedScreenId || '1'));
                        setEditShowtimesInput(Array.isArray(sh.showtimes) ? sh.showtimes.join(', ') : '');
                      }} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded">Edit</button>
                      <button onClick={async()=>{
                        const res = await apiService.deleteScreenShow(String(sh.screenId || selectedScreenId), sh._id);
                        if (res.success) setShows(prev=>prev.filter(x=>x._id!==sh._id));
                      }} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded">Delete</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Modal isOpen={popupOpen} onClose={()=>setPopupOpen(false)}>
        <div className="text-gray-900">
          {popupContent.title && <h3 className="text-lg font-semibold mb-2">{popupContent.title}</h3>}
          <p className="text-sm">{popupContent.message}</p>
          <div className="mt-4 flex justify-end">
            <button onClick={()=>setPopupOpen(false)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded">OK</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManageScreensAndShows;

