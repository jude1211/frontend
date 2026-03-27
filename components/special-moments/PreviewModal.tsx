import React, { useState, useCallback } from 'react';
import BirthdayTemplate from './BirthdayTemplate';
import MomentTemplate from './MomentTemplate';
import ValentineTemplate from './ValentineTemplate';

// ─── Template Routing ─────────────────────────────────────────────────────────
const BIRTHDAY_IDS = new Set(['bday-1', 'bday-2', 'bday-3']);
const MOMENT_IDS   = new Set(['moment-1', 'moment-2']);
const VALENTINE_IDS = new Set(['val-1', 'val-2']);

function getOccasion(templateId: string): 'birthday' | 'moment' | 'valentine' | null {
  if (BIRTHDAY_IDS.has(templateId)) return 'birthday';
  if (MOMENT_IDS.has(templateId)) return 'moment';
  if (VALENTINE_IDS.has(templateId)) return 'valentine';
  return null;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  templateId: string;
  templateName: string;
  templatePreviewImage: string;
  recipientName: string;
  senderName: string;
  message: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'none';
  onClose: () => void;
  onProceed: () => void;
}

const PreviewModal: React.FC<Props> = ({
  open,
  templateId,
  templateName,
  recipientName,
  senderName,
  message,
  mediaUrl,
  mediaType,
  onClose,
  onProceed,
}) => {
  const [replayKey, setReplayKey] = useState(0);

  const handleReplay = useCallback(() => {
    setReplayKey(k => k + 1);
  }, []);

  if (!open) return null;

  const occasion = getOccasion(templateId);

  const sharedProps = {
    recipientName,
    senderName,
    message,
    mediaUrl,
    mediaType,
    replayKey,
  };

  return (
    <>
      <style>{`
        .pmv-overlay {
          position: fixed; inset: 0; z-index: 2000;
          background: rgba(0,0,0,0.92);
          display: flex; flex-direction: column;
          animation: pmv-overlay-in 0.3s ease;
          overflow: hidden;
        }
        @keyframes pmv-overlay-in { from { opacity: 0; } to { opacity: 1; } }

        /* ── Header ─────────────────────────────────────────────────── */
        .pmv-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 20px; background: rgba(0,0,0,0.75);
          border-bottom: 1px solid #1e1e1e; flex-shrink: 0; z-index: 10;
        }
        .pmv-header-name {
          font-size: 0.9rem; font-weight: 700; color: #FF2D78;
          text-transform: uppercase; letter-spacing: .06em;
        }
        .pmv-header-actions { display: flex; gap: 10px; }
        .pmv-icon-btn {
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(255,255,255,0.07); border: 1px solid #333;
          color: #ccc; cursor: pointer; font-size: 1.1rem;
          display: flex; align-items: center; justify-content: center;
          transition: all .15s; line-height: 1;
        }
        .pmv-icon-btn:hover { background: #FF2D78; border-color: #FF2D78; color: #fff; }

        /* ── Stage ──────────────────────────────────────────────────── */
        .pmv-stage {
          flex: 1; position: relative; overflow: hidden; min-height: 0;
        }

        /* ── Footer ─────────────────────────────────────────────────── */
        .pmv-footer {
          padding: 16px 20px; background: rgba(0,0,0,0.75);
          border-top: 1px solid #1e1e1e; display: flex;
          justify-content: center; flex-shrink: 0; z-index: 10;
        }
        .pmv-proceed-btn {
          padding: 13px 36px; background: #FF2D78; color: #fff;
          border: none; border-radius: 12px; font-size: 1rem;
          font-weight: 700; cursor: pointer; transition: all .15s;
          box-shadow: 0 4px 24px rgba(255,45,120,0.45);
        }
        .pmv-proceed-btn:hover { background: #c2185b; transform: translateY(-1px); }

        .pmv-fallback {
          width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
          background: #111; color: #888; font-size: 1rem;
        }
      `}</style>

      <div className="pmv-overlay">
        {/* Header */}
        <div className="pmv-header">
          <span className="pmv-header-name">✨ {templateName}</span>
          <div className="pmv-header-actions">
            <button className="pmv-icon-btn" title="Replay animations" onClick={handleReplay}>↺</button>
            <button className="pmv-icon-btn" title="Close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Template Stage */}
        <div className="pmv-stage">
          {occasion === 'birthday' && <BirthdayTemplate {...sharedProps} />}
          {occasion === 'moment'   && <MomentTemplate   {...sharedProps} />}
          {occasion === 'valentine' && <ValentineTemplate {...sharedProps} />}
          {!occasion && (
            <div className="pmv-fallback">No preview available for this template.</div>
          )}
        </div>

        {/* Footer */}
        <div className="pmv-footer">
          <button className="pmv-proceed-btn" onClick={() => { onClose(); onProceed(); }}>
            Looks good! Proceed →
          </button>
        </div>
      </div>
    </>
  );
};

export default PreviewModal;
