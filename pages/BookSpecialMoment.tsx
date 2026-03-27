import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import TheatreSearchStep     from '../components/special-moments/TheatreSearchStep';
import ShowtimePickerStep    from '../components/special-moments/ShowtimePickerStep';
import ConfirmationModal     from '../components/special-moments/ConfirmationModal';
import OccasionSelectStep    from '../components/special-moments/OccasionSelectStep';
import TemplateSelectStep    from '../components/special-moments/TemplateSelectStep';
import DetailsFormStep       from '../components/special-moments/DetailsFormStep';
import SpecialMomentPayment  from '../components/special-moments/SpecialMomentPayment';
import SpecialMomentConfirmed from '../components/special-moments/SpecialMomentConfirmed';

interface BookingState {
  theatre:      { _id: string; name: string; address: string } | null;
  showDate:     string;
  screen:       string;
  showtimeId:   string;
  showTime:     string;
  confirmationSeen: boolean;
  occasion:     'birthday' | 'moment' | 'valentine' | '';
  templateId:   string;
  templateName: string;
  templatePreviewImage: string;
  templateFields: string[];
  recipientName: string;
  senderName:    string;
  message:       string;
  mediaUrl:      string;
  mediaType:     'image' | 'video' | 'none';
  bookingId:     string;
  totalAmount:   number;
}

const EMPTY_STATE: BookingState = {
  theatre: null, showDate: '', screen: '', showtimeId: '', showTime: '',
  confirmationSeen: false, occasion: '', templateId: '', templateName: '',
  templatePreviewImage: '', templateFields: [], recipientName: '', senderName: '', message: '',
  mediaUrl: '', mediaType: 'none', bookingId: '', totalAmount: 0,
};

const STEP_LABELS = ['Theatre', 'Showtime', 'Occasion', 'Template', 'Details'];
// map visual step index (1-5) → actual step number
const VISUAL_STEP_MAP = [1, 2, 4, 5, 6];

export default function BookSpecialMoment() {
  const location = useLocation();
  const navigate = useNavigate();

  const presetOccasion = (location.state?.occasion as 'birthday' | 'moment' | 'valentine') || '';

  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState<BookingState>({
    ...EMPTY_STATE,
    occasion: presetOccasion,
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  function update(fields: Partial<BookingState>) {
    setBooking(prev => ({ ...prev, ...fields }));
  }

  // Restore booking after login redirect
  useEffect(() => {
    const restoredBooking = location.state?.restoredBooking;
    if (restoredBooking) {
      setBooking(restoredBooking);
      setStep(8);
    }
  }, []);

  // Visual progress bar — only shown for steps 1, 2, 4, 5, 6
  const visualStep = VISUAL_STEP_MAP.indexOf(step); // -1 if not in map
  const showProgress = step <= 6;

  return (
    <div className="smb-page">

      {/* ── Inline Styles ─────────────────────────────────────────────────── */}
      <style>{`
        .smb-page { min-height:100vh; background:#111; color:#e5e5e5; padding:24px; font-family:'Segoe UI',sans-serif; }
        .smb-progress { display:flex; justify-content:center; gap:36px; margin-bottom:32px; }
        .smb-step-dot { display:flex; flex-direction:column; align-items:center; gap:6px; }
        .smb-step-dot .dot { width:14px; height:14px; border-radius:50%; background:#333; border:2px solid #555; transition:all .2s; }
        .smb-step-dot.active .dot { background:#e91e8c; border-color:#e91e8c; box-shadow:0 0 8px #e91e8c88; }
        .smb-step-dot.done   .dot { background:#2e7d32; border-color:#2e7d32; }
        .smb-step-dot span { font-size:0.72rem; color:#888; }
        .smb-step-dot.active span { color:#e91e8c; font-weight:600; }
        .smb-step-dot.done   span { color:#4caf50; }

        .smb-step { max-width:900px; margin:0 auto; }
        .smb-step-header { text-align:center; margin-bottom:28px; }
        .smb-step-title { font-size:1.75rem; font-weight:700; color:#fff; }
        .smb-step-subtitle { color:#aaa; margin-top:6px; }
        .smb-back-btn { background:none; border:none; color:#aaa; cursor:pointer; font-size:0.9rem; margin-bottom:16px; padding:4px 0; }
        .smb-back-btn:hover { color:#e91e8c; }
        .smb-back-btn-inline { background:#333; border:none; color:#e5e5e5; padding:10px 20px; border-radius:8px; cursor:pointer; }

        /* Theatre search */
        .smb-search-wrap { margin-bottom:24px; }
        .smb-search-box { position:relative; display:flex; align-items:center; background:#1e1e1e; border:1px solid #333; border-radius:12px; overflow:hidden; }
        .smb-search-icon { position:absolute; left:14px; width:18px; height:18px; color:#888; }
        .smb-search-input { flex:1; background:transparent; border:none; padding:14px 14px 14px 44px; color:#e5e5e5; font-size:1rem; outline:none; }
        .smb-search-input::placeholder { color:#666; }

        .smb-theatre-grid { display:flex; flex-direction:column; gap:12px; }
        .smb-theatre-card { display:flex; align-items:center; gap:14px; background:#1a1a1a; border:1px solid #2a2a2a; border-radius:12px; padding:14px 16px; cursor:pointer; text-align:left; color:inherit; transition:border-color .2s,background .2s; }
        .smb-theatre-card:hover { border-color:#e91e8c44; background:#1e1e1e; }
        .smb-theatre-icon { font-size:1.6rem; flex-shrink:0; }
        .smb-theatre-info { flex:1; min-width:0; }
        .smb-theatre-name { font-weight:700; font-size:1rem; color:#fff; margin:0; }
        .smb-theatre-addr { font-size:0.82rem; color:#888; margin:4px 0 0; }
        .smb-theatre-city { display:inline-block; margin-top:4px; font-size:0.75rem; background:#e91e8c22; color:#e91e8c; padding:2px 8px; border-radius:99px; }
        .smb-theatre-arrow { width:16px; height:16px; color:#555; flex-shrink:0; }
        .smb-empty { text-align:center; color:#666; padding:40px 0; }

        /* Showtime */
        .smb-date-wrap { margin-bottom:24px; }
        .smb-date-input { background:#1e1e1e; border:1px solid #333; border-radius:8px; padding:10px 14px; color:#e5e5e5; font-size:1rem; width:100%; max-width:260px; }
        .smb-screen-tabs { display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap; }
        .smb-screen-tab { padding:8px 18px; border-radius:99px; border:1px solid #333; background:none; color:#888; cursor:pointer; font-size:0.9rem; transition:all .15s; }
        .smb-screen-tab.active { background:#e91e8c; border-color:#e91e8c; color:#fff; }
        .smb-screen-label { font-weight:600; color:#ccc; margin-bottom:12px; font-size:0.9rem; text-transform:uppercase; letter-spacing:.05em; }
        .smb-showtime-grid { display:flex; flex-wrap:wrap; gap:12px; margin-bottom:28px; }
        .smb-showtime-pill { display:flex; flex-direction:column; align-items:center; border:1px solid #333; border-radius:10px; padding:10px 18px; background:#1a1a1a; cursor:pointer; transition:all .15s; min-width:100px; }
        .smb-showtime-pill:hover { border-color:#e91e8c66; }
        .smb-showtime-pill.selected { border-color:#e91e8c; background:#e91e8c18; }
        .smb-showtime-time { font-weight:700; font-size:1rem; color:#fff; }

        /* Confirmation modal */
        .smb-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.75); display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px; }
        .smb-modal { background:#1a1a1a; border:1px solid #333; border-radius:20px; padding:32px; max-width:440px; width:100%; text-align:center; }
        .smb-modal-icon { font-size:2.5rem; margin-bottom:12px; }
        .smb-modal-title { font-size:1.4rem; font-weight:700; color:#fff; margin:0 0 6px; }
        .smb-modal-subtitle { color:#888; font-size:0.9rem; margin:0 0 24px; }
        .smb-modal-details { background:#111; border-radius:12px; padding:16px; margin-bottom:24px; }
        .smb-modal-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #222; }
        .smb-modal-row:last-child { border-bottom:none; }
        .smb-modal-key { color:#888; font-size:0.85rem; }
        .smb-modal-val { color:#e5e5e5; font-weight:600; font-size:0.9rem; text-align:right; max-width:200px; }
        .smb-modal-actions { display:flex; gap:12px; }
        .smb-modal-cancel { flex:1; padding:12px; border:1px solid #333; border-radius:10px; background:none; color:#aaa; cursor:pointer; font-size:0.95rem; }
        .smb-modal-proceed { flex:1; padding:12px; border:none; border-radius:10px; background:#e91e8c; color:#fff; cursor:pointer; font-size:0.95rem; font-weight:700; }

        /* Occasion */
        .smb-occasion-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:20px; }
        .smb-occasion-card { display:flex; flex-direction:column; align-items:center; text-align:center; padding:32px 24px; border-radius:20px; border:1px solid #333; cursor:pointer; transition:border-color .2s,transform .2s; }
        .smb-occasion-card:hover { transform:translateY(-4px); border-color:var(--occ-color,#e91e8c); }
        .smb-occasion-emoji { font-size:3rem; margin-bottom:12px; }
        .smb-occasion-title { font-size:1.3rem; font-weight:700; color:#fff; margin:0 0 8px; }
        .smb-occasion-desc { color:#888; font-size:0.85rem; line-height:1.5; flex:1; }
        .smb-occasion-cta { margin-top:16px; font-weight:700; }

        /* Templates */
        .smb-template-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:20px; margin-bottom:28px; }
        .template-card { background:none; border:2px solid #2a2a2a; border-radius:14px; overflow:hidden; cursor:pointer; text-align:left; transition:border-color .2s,transform .15s; position:relative; }
        .template-card:hover { border-color:#e91e8c55; transform:translateY(-2px); }
        .template-card.selected { border-color:#e91e8c; }
        .template-card-img-wrap { position:relative; width:100%; aspect-ratio:16/9; overflow:hidden; }
        .template-card-img { width:100%; height:100%; object-fit:cover; display:block; }
        .template-checkmark { position:absolute; top:8px; right:8px; background:#e91e8c; color:#fff; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:700; }
        .template-card-footer { padding:10px 12px; background:#1a1a1a; }
        .template-card-name { font-weight:700; color:#fff; font-size:0.9rem; }
        .template-card-tags { display:flex; gap:6px; margin-top:4px; }
        .template-tag { font-size:0.7rem; background:#ffffff12; color:#aaa; padding:2px 8px; border-radius:99px; }

        /* Details / form */
        .smb-details-layout { display:grid; grid-template-columns:1fr 1fr; gap:28px; }
        @media(max-width:700px) { .smb-details-layout { grid-template-columns:1fr; } }
        .smb-field { margin-bottom:18px; }
        .smb-label { display:flex; justify-content:space-between; font-size:0.85rem; color:#aaa; margin-bottom:6px; }
        .smb-char-count { color:#666; font-size:0.78rem; }
        .smb-input, .smb-textarea { width:100%; background:#1a1a1a; border:1px solid #333; border-radius:10px; padding:10px 14px; color:#e5e5e5; font-size:0.95rem; outline:none; resize:none; box-sizing:border-box; }
        .smb-input:focus, .smb-textarea:focus { border-color:#e91e8c; }
        .smb-upload-btn { padding:10px 18px; border:1px dashed #555; border-radius:10px; background:#1a1a1a; color:#aaa; cursor:pointer; font-size:0.9rem; transition:all .15s; }
        .smb-upload-btn:hover { border-color:#e91e8c; color:#e91e8c; }
        .smb-progress-bar { height:4px; background:#2a2a2a; border-radius:99px; margin-top:8px; overflow:hidden; }
        .smb-progress-fill { height:100%; background:#e91e8c; border-radius:99px; transition:width .3s; }
        .smb-upload-done { color:#4caf50; font-size:0.8rem; margin-top:6px; }
        .smb-price-row { display:flex; justify-content:space-between; align-items:center; background:#1a1a1a; border:1px solid #e91e8c44; border-radius:10px; padding:14px 16px; margin-bottom:20px; }
        .smb-price-label { color:#aaa; font-size:0.9rem; }
        .smb-price-val { font-size:1.4rem; font-weight:700; color:#e91e8c; }
        .smb-error { color:#ff6b6b; font-size:0.85rem; margin-bottom:8px; }
        .smb-error-box { background:#2a1111; border:1px solid #5a1a1a; border-radius:12px; padding:20px; text-align:center; color:#ff9999; }

        /* Preview panel */
        .preview-panel { position:relative; border-radius:16px; overflow:hidden; min-height:360px; background:#111; border:1px solid #2a2a2a; }
        .preview-bg { width:100%; height:100%; object-fit:cover; opacity:.45; display:block; }
        .preview-overlay { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:24px; text-align:center; }
        .preview-media-img { width:80px; height:80px; object-fit:cover; border-radius:50%; border:3px solid #fff; margin-bottom:12px; }
        .preview-name { font-size:1.6rem; font-weight:700; color:#fff; text-shadow:0 2px 12px rgba(0,0,0,.9); }
        .preview-message { font-size:0.95rem; color:#e5e5e5; margin-top:10px; text-shadow:0 2px 8px rgba(0,0,0,.8); }

        /* Loading */
        .smb-loading { display:flex; flex-direction:column; align-items:center; gap:14px; padding:60px 0; color:#888; }
        .smb-spinner { width:20px; height:20px; border:2px solid #333; border-top-color:#e91e8c; border-radius:50%; animation:spin .7s linear infinite; position:absolute; right:14px; }
        .smb-spinner-lg { width:40px; height:40px; border:3px solid #333; border-top-color:#e91e8c; border-radius:50%; animation:spin .7s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }

        /* Buttons */
        .smb-primary-btn { padding:13px 28px; border:none; border-radius:10px; background:#e91e8c; color:#fff; font-size:1rem; font-weight:700; cursor:pointer; transition:background .15s; }
        .smb-primary-btn:hover { background:#c2185b; }
        .smb-primary-btn:disabled { background:#444; cursor:not-allowed; }
        .smb-secondary-btn { padding:13px 28px; border:1px solid #555; border-radius:10px; background:none; color:#ccc; font-size:1rem; cursor:pointer; }
        .smb-btn-row { display:flex; gap:12px; flex-wrap:wrap; margin-top:8px; }

        /* Payment */
        .smb-payment-step { min-height:60vh; display:flex; align-items:center; justify-content:center; }

        /* Confirmed */
        .smb-confirmed { max-width:600px; margin:0 auto; text-align:center; padding:20px 0; }
        .smb-confirmed-icon { font-size:4rem; margin-bottom:12px; animation:pop .5s ease; }
        @keyframes pop { 0%{transform:scale(.5);opacity:0} 80%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        .smb-confirmed-title { font-size:2rem; font-weight:700; color:#fff; margin:0 0 8px; }
        .smb-confirmed-id { color:#888; font-size:0.9rem; margin-bottom:28px; }
        .smb-confirmed-id strong { color:#e91e8c; }
        .smb-confirmed-details { background:#1a1a1a; border-radius:16px; padding:20px; margin-bottom:28px; text-align:left; }
        .smb-confirmed-row { display:flex; justify-content:space-between; align-items:flex-start; padding:10px 0; border-bottom:1px solid #2a2a2a; gap:12px; }
        .smb-confirmed-row:last-child { border-bottom:none; }
        .smb-confirmed-key { color:#888; font-size:0.85rem; flex-shrink:0; }
        .smb-confirmed-val { color:#e5e5e5; font-weight:600; font-size:0.9rem; text-align:right; }
        .smb-confirmed-message { font-style:italic; color:#ccc; font-weight:400; }
        .smb-confirmed-total { margin-top:4px; }
        .smb-confirmed-price { color:#e91e8c; font-size:1.2rem; }
        .smb-confirmed-actions { display:flex; justify-content:center; gap:14px; flex-wrap:wrap; }

        /* Label */
        .smb-details-form label.smb-label { font-size:0.85rem; color:#aaa; margin-bottom:6px; display:block; }

        /* Date input color fix for dark bg */
        .smb-date-input::-webkit-calendar-picker-indicator { filter:invert(1); }
      `}</style>

      {/* Progress Bar */}
      {showProgress && (
        <div className="smb-progress">
          {STEP_LABELS.map((label, i) => {
            const stepNum = VISUAL_STEP_MAP[i];
            const isDone = step > stepNum;
            const isActive = step === stepNum;
            return (
              <div key={label} className={`smb-step-dot ${isDone ? 'done' : isActive ? 'active' : ''}`}>
                <div className="dot" />
                <span>{label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Step 1 */}
      {step === 1 && (
        <TheatreSearchStep
          onSelect={(theatre) => { update({ theatre }); setStep(2); }}
        />
      )}

      {/* Step 2 */}
      {step === 2 && (
        <ShowtimePickerStep
          theatreId={booking.theatre!._id}
          theatreName={booking.theatre!.name}
          onBack={() => setStep(1)}
          onSelect={({ showDate, screen, showtimeId, showTime }) => {
            update({ showDate, screen, showtimeId, showTime });
            setShowConfirmModal(true);
          }}
        />
      )}

      {/* Step 3: Confirmation Modal */}
      {showConfirmModal && (
        <ConfirmationModal
          theatre={booking.theatre!.name}
          date={booking.showDate}
          screen={booking.screen}
          time={booking.showTime}
          onClose={() => setShowConfirmModal(false)}
          onProceed={() => {
            setShowConfirmModal(false);
            // Skip Step 4 if occasion was pre-set from BirthdayWishes
            setStep(booking.occasion ? 5 : 4);
          }}
        />
      )}

      {/* Step 4 */}
      {step === 4 && (
        <OccasionSelectStep
          onBack={() => setStep(2)}
          onSelect={(occasion) => { update({ occasion }); setStep(5); }}
        />
      )}

      {/* Step 5 */}
      {step === 5 && (
        <TemplateSelectStep
          occasion={booking.occasion}
          onBack={() => setStep(booking.occasion && location.state?.occasion ? 2 : 4)}
          onSelect={({ templateId, templateName, templatePreviewImage, templateFields }) => {
            update({ templateId, templateName, templatePreviewImage, templateFields });
            setStep(6);
          }}
        />
      )}

      {/* Step 6 */}
      {step === 6 && (
        <DetailsFormStep
          booking={booking}
          onBack={() => setStep(5)}
          onProceed={({ recipientName, senderName, message, mediaUrl, mediaType, totalAmount }) => {
            update({ recipientName, senderName, message, mediaUrl, mediaType, totalAmount });

            // Step 7: Auth guard
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) {
              const snapshot: BookingState = { ...booking, recipientName, senderName, message, mediaUrl, mediaType, totalAmount };
              sessionStorage.setItem('smb_pending', JSON.stringify(snapshot));
              // We can't navigate to /login (it's a modal), so show login modal trigger
              // Store flag so Header can open login modal
              sessionStorage.setItem('smb_wants_login', '1');
              window.dispatchEvent(new CustomEvent('smb:needlogin'));
              return;
            }
            setStep(8);
          }}
        />
      )}

      {/* Step 8 */}
      {step === 8 && (
        <SpecialMomentPayment
          booking={booking}
          onBack={() => setStep(6)}
          onSuccess={(bookingId) => {
            update({ bookingId });
            setStep(9);
          }}
        />
      )}

      {/* Step 9 */}
      {step === 9 && (
        <SpecialMomentConfirmed
          bookingId={booking.bookingId}
          booking={booking}
        />
      )}
    </div>
  );
}
