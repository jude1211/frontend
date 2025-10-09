import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
import SeatLayoutBuilder from '../components/SeatLayoutBuilder';

const DynamicLanding: React.FC = () => {
  const [bundles, setBundles] = useState<Array<any>>([]);
  const [selected, setSelected] = useState<{ movieId?: string; screenId?: string; date?: string } | null>(null);
  const [seatLayout, setSeatLayout] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiService.getActiveMoviesWithShows();
        if (res.success) setBundles(res.data || []);
      } catch (e) {
        console.error('Landing fetch failed', e);
        setBundles([]);
      }
    };
    load();
  }, []);

  const location = useLocation();
  useEffect(() => {
    if (!bundles.length) return;
    const params = new URLSearchParams(location.search);
    const movieId = params.get('movie');
    if (!movieId) return;
    const bundle = bundles.find((b:any)=> String(b.movie._id) === String(movieId));
    if (bundle && bundle.screens?.length) {
      const firstScreen = bundle.screens[0];
      const firstGroup = firstScreen.showGroups?.[0];
      setSelected({ movieId: bundle.movie._id, screenId: firstScreen.screenId, date: firstGroup?.bookingDate });
    }
  }, [location.search, bundles]);

  useEffect(() => {
    const fetchLayout = async () => {
      if (!selected?.screenId) return setSeatLayout(null);
      setLoading(true);
      try {
        const res = await apiService.getScreenLayout(String(selected.screenId));
        if (res.success) setSeatLayout(res.data || null);
        else setSeatLayout(null);
      } catch (e) {
        setSeatLayout(null);
      } finally {
        setLoading(false);
      }
    };
    fetchLayout();
  }, [selected?.screenId, selected?.date]);

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Movies & Live Seat Maps</h1>
      <div className="space-y-6">
        {bundles.map((b: any) => (
          <div key={b.movie._id} className="bg-brand-gray rounded-2xl p-4 border border-brand-dark/40">
            <div className="flex gap-4">
              <img src={b.movie.posterUrl} alt={b.movie.title} className="w-20 h-28 object-cover rounded" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-semibold text-lg">{b.movie.title}</div>
                    <div className="text-xs text-brand-light-gray">{Array.isArray(b.movie.genre) ? b.movie.genre.join(', ') : b.movie.genre}</div>
                    <div className="text-xs text-brand-light-gray">Language: {b.movie.language || 'English'}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {b.screens.map((s: any) => (
                    <div key={s.screenId} className="bg-black/30 rounded-lg p-3 border border-brand-dark/40">
                      <div className="text-white text-sm mb-2">Screen {s.screenId}</div>
                      <div className="flex flex-wrap gap-2">
                        {s.showGroups.map((g: any, idx: number) => (
                          <div key={`${s.screenId}-${idx}`} className="flex items-center gap-2">
                            <span className="text-[11px] text-gray-300">{g.bookingDate || todayIso}</span>
                            {g.showtimes.map((t: string) => (
                              <button
                                key={`${s.screenId}-${g.bookingDate}-${t}`}
                                onClick={() => setSelected({ movieId: b.movie._id, screenId: s.screenId, date: g.bookingDate })}
                                className={`px-2 py-1 rounded-full text-[11px] border ${selected?.screenId === s.screenId && selected?.date === g.bookingDate ? 'bg-red-600 text-white border-red-500' : 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30'}`}
                              >
                                <i className="fas fa-clock mr-1"></i>{t}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
        {bundles.length === 0 && (
          <div className="text-brand-light-gray text-sm">No active movies with assigned shows.</div>
        )}
      </div>

      <div className="bg-brand-gray rounded-2xl p-4 border border-brand-dark/40">
        <h2 className="text-white font-semibold mb-3">Live Seat Layout</h2>
        {!selected?.screenId && <div className="text-brand-light-gray text-sm">Select a showtime to load seat layout.</div>}
        {loading && <div className="text-brand-light-gray text-sm">Loading layout...</div>}
        {seatLayout && (
          <div className="bg-black/40 rounded p-3">
            <SeatLayoutBuilder
              config={{
                numRows: seatLayout?.meta?.rows || 8,
                numCols: seatLayout?.meta?.columns || 12,
                aisleColumns: seatLayout?.meta?.aisles || [5, 9],
                seatClassRules: (seatLayout?.seatClasses || []).map((sc: any) => ({ rows: sc.rows, className: sc.className, price: sc.price, tier: sc.tier, color: sc.color }))
              }}
              processedSeats={new Map()}
              editMode={false}
              onSeatClick={() => {}}
              maxReservableSeats={10}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicLanding;


