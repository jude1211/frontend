import React, { useEffect, useState } from 'react';

interface Heart {
  id: number;
  left: string;
  size: string;
  delay: string;
  duration: string;
  color: string;
  wobbleAmp: string;
  wobbleDuration: string;
}

interface Props {
  recipientName: string;
  senderName: string;
  message: string;
  mediaUrl?: string;
  mediaType?: string;
  replayKey: number;
}

const HEART_COLORS = ['#FF2D78', '#FF6B9D', '#FF1744', '#FF69B4', '#E91E63', '#FF80AB', '#FFB7C5', '#C2185B'];

const ValentineTemplate: React.FC<Props> = ({ recipientName, senderName, message, mediaUrl, mediaType, replayKey }) => {
  const [hearts, setHearts] = useState<Heart[]>([]);

  useEffect(() => {
    setHearts(Array.from({ length: 42 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: `${0.7 + Math.random() * 1.8}rem`,
      delay: `${Math.random() * 6}s`,
      duration: `${4 + Math.random() * 5}s`,
      color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
      wobbleAmp: `${6 + Math.random() * 14}px`,
      wobbleDuration: `${1.5 + Math.random() * 2}s`,
    })));
  }, [replayKey]);

  // SVG heart path — viewBox 0 0 300 280
  const heartPath = 'M 150 240 C 80 190 10 145 10 85 C 10 40 45 10 85 10 C 110 10 130 24 150 45 C 170 24 190 10 215 10 C 255 10 290 40 290 85 C 290 145 220 190 150 240 Z';

  return (
    <div className="val-root" key={replayKey}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Dancing+Script:wght@700&display=swap');

        .val-root {
          width: 100%; height: 100%; position: relative; overflow: hidden;
          background: radial-gradient(ellipse at 50% 60%, #3a000f 0%, #1a0009 50%, #0d0005 100%);
          font-family: 'Dancing Script', cursive;
        }

        /* ─── Stage 1: Floating hearts ────────────────────────────── */
        .val-heart {
          position: absolute; bottom: -30px; pointer-events: none; z-index: 1;
          animation: val-heart-rise linear infinite;
          user-select: none;
        }
        @keyframes val-heart-rise {
          0%   { bottom: -30px; opacity: 0; transform: translateX(0) scale(0.8); }
          5%   { opacity: 0.85; }
          80%  { opacity: 0.6; }
          100% { bottom: 105vh; opacity: 0; transform: translateX(var(--val-wobble)) scale(0.6); }
        }
        .val-heart-wobble {
          animation: val-wobble-x ease-in-out infinite alternate;
        }
        @keyframes val-wobble-x {
          from { transform: translateX(var(--val-wobble-neg)); }
          to   { transform: translateX(var(--val-wobble)); }
        }

        /* ─── Shimmer overlay ─────────────────────────────────────── */
        .val-shimmer {
          position: absolute; inset: 0; z-index: 2; pointer-events: none;
          background: linear-gradient(135deg, transparent 25%, rgba(255,45,120,0.08) 50%, transparent 75%);
          background-size: 300% 300%;
          animation: val-shimmer-move 5s linear infinite;
        }
        @keyframes val-shimmer-move {
          0%   { background-position: 0% 0%; }
          100% { background-position: 300% 300%; }
        }

        /* ─── Stage 2: SVG heart frame drawing ────────────────────── */
        .val-svg-wrap {
          position: absolute; inset: 0; display: flex;
          align-items: center; justify-content: center;
          z-index: 5; pointer-events: none;
          animation: val-svg-fadein 0.5s ease 1.5s both;
        }
        @keyframes val-svg-fadein {
          from { opacity: 0; } to { opacity: 1; }
        }
        .val-heart-svg { overflow: visible; }
        .val-heart-path-fill {
          fill: rgba(180, 0, 50, 0.18);
          stroke: none;
          animation: val-fill-pulse 3s ease-in-out 4s infinite alternate;
        }
        @keyframes val-fill-pulse {
          from { fill: rgba(180, 0, 50, 0.18); }
          to   { fill: rgba(255, 45, 120, 0.28); }
        }
        .val-heart-path-stroke {
          fill: none;
          stroke: #FF2D78;
          stroke-width: 4;
          stroke-linecap: round;
          stroke-dasharray: 1100;
          stroke-dashoffset: 1100;
          filter: drop-shadow(0 0 10px #FF2D78) drop-shadow(0 0 20px #FF2D7888);
          animation: val-draw-heart 2.2s ease 2s forwards;
        }
        @keyframes val-draw-heart {
          from { stroke-dashoffset: 1100; }
          to   { stroke-dashoffset: 0; }
        }
        .val-heart-pulse-outer {
          fill: none; stroke: rgba(255,45,120,0.3); stroke-width: 2;
          animation: val-heart-border-pulse 2s ease 4.2s infinite;
          transform-origin: 150px 130px;
        }
        @keyframes val-heart-border-pulse {
          0%   { transform: scale(1); opacity: 0.6; }
          50%  { transform: scale(1.04); opacity: 1; }
          100% { transform: scale(1); opacity: 0.6; }
        }

        /* ─── Stage 3: To [name] inside heart ────────────────────── */
        .val-to-wrap {
          position: absolute; inset: 0;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          z-index: 7;
          animation: val-name-appear 1.2s ease 4.2s both;
        }
        @keyframes val-name-appear {
          from { opacity: 0; transform: scale(0.7); }
          70%  { transform: scale(1.05); }
          to   { opacity: 1; transform: scale(1); }
        }
        .val-to-label {
          font-family: 'Dancing Script', cursive; font-size: 1rem;
          color: #FFB7C5; letter-spacing: .08em; margin-bottom: 2px;
        }
        .val-to-name {
          font-family: 'Great Vibes', cursive; font-size: 2.8rem; color: #fff;
          text-shadow: 0 0 20px rgba(255,45,120,0.8), 0 4px 20px rgba(0,0,0,0.9);
          animation: val-name-glow 2.5s ease-in-out 5.4s infinite alternate;
          line-height: 1;
        }
        @keyframes val-name-glow {
          from { text-shadow: 0 0 16px rgba(255,45,120,0.7), 0 4px 20px rgba(0,0,0,0.9); }
          to   { text-shadow: 0 0 40px rgba(255,45,120,1), 0 0 80px rgba(255,45,120,0.5), 0 4px 20px rgba(0,0,0,0.9); }
        }

        /* ─── Stage 4: Photo in heart + message ─────────────────── */
        .val-photo-wrap {
          position: absolute; inset: 0;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          z-index: 8;
          animation: val-photo-in 1.2s ease 5.8s both;
        }
        @keyframes val-photo-in {
          from { opacity: 0; transform: scale(0.8); }
          to   { opacity: 1; transform: scale(1); }
        }
        .val-photo-frame {
          width: 110px; height: 110px; border-radius: 50%;
          overflow: hidden; border: 3px solid #FF2D78;
          box-shadow: 0 0 0 4px rgba(255,45,120,0.3), 0 8px 30px rgba(0,0,0,0.8);
        }
        .val-photo-frame img {
          width: 100%; height: 100%; object-fit: cover;
        }
        .val-photo-placeholder {
          width: 100%; height: 100%;
          background: linear-gradient(135deg, #C2185B, #FF80AB);
          display: flex; align-items: center; justify-content: center; font-size: 2.4rem;
        }
        .val-message {
          font-family: 'Dancing Script', cursive; font-size: 1.1rem;
          color: #FFD0DC; text-align: center; max-width: 260px; margin-top: 14px;
          line-height: 1.5; letter-spacing: 0.04em;
          text-shadow: 0 2px 10px rgba(0,0,0,0.95);
          animation: val-msg-in 2s ease 6.5s both;
        }
        @keyframes val-msg-in {
          from { opacity: 0; letter-spacing: -0.1em; }
          to   { opacity: 1; letter-spacing: 0.04em; }
        }
        .val-from {
          font-family: 'Great Vibes', cursive; font-size: 1.4rem;
          color: #FF9DB8; margin-top: 8px; font-style: italic;
          text-shadow: 0 0 16px rgba(255,45,120,0.6);
          animation: val-fade-up 1.2s ease 7.4s both;
        }
        @keyframes val-fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Stage 1: Floating hearts */}
      {hearts.map(h => (
        <div
          key={h.id}
          className="val-heart"
          style={{
            left: h.left,
            fontSize: h.size,
            color: h.color,
            animationDelay: h.delay,
            animationDuration: h.duration,
            ['--val-wobble' as any]: h.wobbleAmp,
            ['--val-wobble-neg' as any]: `-${h.wobbleAmp}`,
          }}
        >
          <div
            className="val-heart-wobble"
            style={{ animationDuration: h.wobbleDuration, animationDelay: h.delay }}
          >
            ♥
          </div>
        </div>
      ))}

      {/* Shimmer */}
      <div className="val-shimmer" />

      {/* Stage 2: SVG heart drawing */}
      <div className="val-svg-wrap">
        <svg className="val-heart-svg" width="300" height="260" viewBox="0 0 300 260">
          <path className="val-heart-path-fill" d={heartPath} />
          <path className="val-heart-pulse-outer" d={heartPath} />
          <path className="val-heart-path-stroke" d={heartPath} />
        </svg>
      </div>

      {/* Stage 3: "To [name]" */}
      <div className="val-to-wrap">
        <div className="val-to-label">To…</div>
        <div className="val-to-name">{recipientName || 'My Love'}</div>
      </div>

      {/* Stage 4: Photo + message */}
      <div className="val-photo-wrap">
        {mediaUrl && mediaType === 'image' ? (
          <div className="val-photo-frame">
            <img src={mediaUrl} alt="uploaded" />
          </div>
        ) : (
          <div className="val-photo-frame">
            <div className="val-photo-placeholder">💕</div>
          </div>
        )}
        {message && <p className="val-message">"{message}"</p>}
        <p className="val-from">With love, {senderName || 'Someone Special'}</p>
      </div>
    </div>
  );
};

export default ValentineTemplate;
