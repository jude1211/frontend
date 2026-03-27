import React, { useState, useEffect } from 'react';

interface ShowtimeSlot {
  showtimeId: string;
  startTime: string;
  availableSlots: number;
}

interface ScreenGroup {
  screen: string;
  showtimes: ShowtimeSlot[];
}

interface Props {
  theatreId: string;
  theatreName: string;
  onBack: () => void;
  onSelect: (data: { showDate: string; screen: string; showtimeId: string; showTime: string }) => void;
}

const API_BASE: string = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5000';

const today = new Date();
const maxDate = new Date(today);
maxDate.setDate(today.getDate() + 30);

const fmt = (d: Date) => d.toISOString().split('T')[0];

const ShowtimePickerStep: React.FC<Props> = ({ theatreId, theatreName, onBack, onSelect }) => {
  const [selectedDate, setSelectedDate] = useState(fmt(today));
  const [screens, setScreens] = useState<ScreenGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeScreen, setActiveScreen] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<ShowtimeSlot | null>(null);

  const fetchShowtimes = async (date: string) => {
    setLoading(true);
    setSelectedSlot(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/special-moments/theatres/${theatreId}/showtimes?date=${date}`
      );
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setScreens(data.data);
        setActiveScreen(data.data[0].screen);
      } else {
        setScreens([]);
      }
    } catch (e) {
      console.error('Showtime fetch error:', e);
      setScreens([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShowtimes(selectedDate); }, [selectedDate]);

  const currentScreen = screens.find(s => s.screen === activeScreen);

  return (
    <div className="smb-step">
      <button className="smb-back-btn" onClick={onBack}>
        ← Back
      </button>
      <div className="smb-step-header">
        <h2 className="smb-step-title">{theatreName}</h2>
        <p className="smb-step-subtitle">Pick date and showtime</p>
      </div>

      {/* Date Picker */}
      <div className="smb-date-wrap">
        <label className="smb-label">Select Date</label>
        <input
          type="date"
          value={selectedDate}
          min={fmt(today)}
          max={fmt(maxDate)}
          onChange={e => setSelectedDate(e.target.value)}
          className="smb-date-input"
        />
      </div>

      {loading && <div className="smb-loading"><div className="smb-spinner-lg" /><span>Loading showtimes…</span></div>}

      {!loading && screens.length === 0 && (
        <div className="smb-empty">No showtimes available for this date.</div>
      )}

      {!loading && screens.length > 0 && (
        <>
          {/* Screen Tabs */}
          {screens.length > 1 && (
            <div className="smb-screen-tabs">
              {screens.map(s => (
                <button
                  key={s.screen}
                  className={`smb-screen-tab ${activeScreen === s.screen ? 'active' : ''}`}
                  onClick={() => { setActiveScreen(s.screen); setSelectedSlot(null); }}
                >
                  {s.screen}
                </button>
              ))}
            </div>
          )}

          {/* Showtime Pills */}
          <div className="smb-screen-label">{currentScreen?.screen}</div>
          <div className="smb-showtime-grid">
            {currentScreen?.showtimes.map(slot => (
              <button
                key={slot.showtimeId}
                className={`smb-showtime-pill ${selectedSlot?.showtimeId === slot.showtimeId ? 'selected' : ''}`}
                onClick={() => setSelectedSlot(slot)}
              >
                <span className="smb-showtime-time">{slot.startTime}</span>
              </button>
            ))}
          </div>

          <button
            className="smb-primary-btn"
            disabled={!selectedSlot}
            onClick={() => {
              if (!selectedSlot || !currentScreen) return;
              onSelect({
                showDate: selectedDate,
                screen: currentScreen.screen,
                showtimeId: selectedSlot.showtimeId,
                showTime: selectedSlot.startTime,
              });
            }}
          >
            Continue →
          </button>
        </>
      )}
    </div>
  );
};

export default ShowtimePickerStep;
