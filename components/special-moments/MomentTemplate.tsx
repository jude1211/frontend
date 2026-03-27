import React, { useEffect, useState } from 'react';

interface Props {
  recipientName: string;
  senderName: string;
  message: string;
  mediaUrl?: string;
  mediaType?: string;
  replayKey: number;
}

const MomentTemplate: React.FC<Props> = ({ recipientName, senderName, message, mediaUrl, mediaType, replayKey }) => {
  const fullText = `A Special Moment for ${recipientName || 'You'}`;
  const letters = Array.from(fullText);

  return (
    <div className="mom-root" key={replayKey}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Cinzel:wght@700&display=swap');

        .mom-root {
          width: 100%; height: 100%; position: relative; overflow: hidden;
          background: linear-gradient(160deg, #040c1a 0%, #050d22 60%, #020810 100%);
          font-family: 'Playfair Display', serif;
        }

        /* ─── Stage 1: Film grain flicker ────────────────────────── */
        .mom-grain {
          position: absolute; inset: 0; z-index: 1; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E");
          animation: mom-grain-flicker 0.08s steps(1) infinite;
          mix-blend-mode: overlay; opacity: 0.07;
        }
        @keyframes mom-grain-flicker {
          0%   { opacity: 0.05; transform: translate(0,0); }
          25%  { opacity: 0.09; transform: translate(-2px,1px); }
          50%  { opacity: 0.06; transform: translate(1px,-2px); }
          75%  { opacity: 0.10; transform: translate(-1px,-1px); }
          100% { opacity: 0.07; transform: translate(2px,1px); }
        }

        /* ─── Stage 2: Spotlight sweep ────────────────────────────── */
        .mom-spotlight {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          animation: mom-spotlight-pan 8s ease-in-out 1s infinite alternate;
        }
        @keyframes mom-spotlight-pan {
          from {
            background: radial-gradient(ellipse 420px 320px at -10% 0%,
              rgba(255,210,80,0.22) 0%, transparent 70%);
          }
          to {
            background: radial-gradient(ellipse 420px 320px at 110% 65%,
              rgba(255,210,80,0.15) 0%, transparent 70%);
          }
        }

        /* ─── Stage 1: Filmstrip ────────────────────────────────────── */
        .mom-filmstrip {
          position: absolute; top: 50%; transform: translateY(-50%);
          display: flex; align-items: center;
          background: #080808; z-index: 3;
          border-top: 14px solid #111; border-bottom: 14px solid #111;
          padding: 6px 0; left: -600px; width: 200%;
          animation: mom-film-slide 1.6s cubic-bezier(.25,.46,.45,.94) 0.5s forwards;
        }
        @keyframes mom-film-slide {
          from { left: -600px; opacity: 0.4; }
          to   { left: -10px; opacity: 1; }
        }
        .mom-film-segment {
          display: flex; align-items: center; gap: 3px; padding: 0 3px; flex-shrink: 0;
        }
        .mom-film-hole-col {
          display: flex; flex-direction: column; gap: 8px; padding: 4px;
        }
        .mom-film-hole {
          width: 14px; height: 14px; background: #1a1a1a; border-radius: 3px; flex-shrink: 0;
        }
        .mom-film-frame {
          width: 110px; height: 80px; border: 2px solid #222; background: #0a0a0a;
          position: relative; overflow: hidden; flex-shrink: 0;
        }
        .mom-film-frame.glow { border-color: #C9A84C; box-shadow: 0 0 12px rgba(201,168,76,0.5); }
        .mom-film-frame img {
          width: 100%; height: 100%; object-fit: cover;
          filter: sepia(1) brightness(0.85);
          animation: mom-sepia-clear 2.5s ease 7s forwards;
        }
        @keyframes mom-sepia-clear {
          from { filter: sepia(1) brightness(0.85); }
          to   { filter: sepia(0) brightness(1); }
        }
        .mom-film-glow-inner {
          position: absolute; inset: 0; background: radial-gradient(ellipse at center, rgba(201,168,76,0.15) 0%, transparent 70%);
          animation: mom-frame-glow 2s ease-in-out infinite alternate;
        }
        @keyframes mom-frame-glow {
          from { opacity: 0.5; } to { opacity: 1; }
        }

        /* ─── Stage 3: Marquee sign ───────────────────────────────── */
        .mom-marquee {
          position: absolute; top: -150px; left: 50%; transform: translateX(-50%);
          background: #0d0b00; border: 3px solid #C9A84C; border-radius: 6px;
          padding: 18px 32px 14px; text-align: center; z-index: 12;
          min-width: 300px; max-width: 90vw;
          box-shadow: 0 0 40px rgba(201,168,76,0.35), inset 0 0 30px rgba(0,0,0,0.5);
          animation: mom-marquee-drop 0.9s cubic-bezier(.34,1.56,.64,1) 2.5s forwards;
        }
        @keyframes mom-marquee-drop {
          from { top: -150px; opacity: 0; }
          to   { top: 20px; opacity: 1; }
        }
        .mom-marquee-label {
          font-family: 'Cinzel', serif; font-size: 0.62rem; color: #C9A84C;
          letter-spacing: .25em; text-transform: uppercase; margin-bottom: 10px;
        }
        .mom-marquee-title {
          font-family: 'Playfair Display', serif; font-size: 1.05rem; color: #fff;
          display: flex; flex-wrap: wrap; justify-content: center;
          line-height: 1.4; gap: 0;
        }
        .mom-char {
          display: inline-block;
          opacity: 0;
          animation: mom-char-appear 0.08s ease forwards;
        }
        @keyframes mom-char-appear {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .mom-bulbs {
          display: flex; justify-content: space-between; margin-top: 12px; gap: 4px;
        }
        .mom-bulb {
          flex: 1; height: 8px; border-radius: 4px; background: #C9A84C;
          animation: mom-bulb-pulse 1.4s ease-in-out infinite alternate;
        }
        @keyframes mom-bulb-pulse {
          from { opacity: 1; box-shadow: 0 0 6px #C9A84C; }
          to   { opacity: 0.25; box-shadow: none; }
        }

        /* ─── Stage 4: Content (message + sender) ─────────────────── */
        .mom-content {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 20px 28px; text-align: center; z-index: 10;
          animation: mom-content-in 1s ease 6.5s both;
        }
        @keyframes mom-content-in {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .mom-message {
          font-family: 'Playfair Display', serif; font-style: italic;
          color: #ddd; font-size: 1.05rem; line-height: 1.6;
          text-shadow: 0 2px 10px rgba(0,0,0,0.95);
        }
        .mom-from {
          font-family: 'Cinzel', serif; color: #C9A84C; font-size: 0.92rem;
          margin-top: 10px; letter-spacing: .1em;
          animation: mom-content-in 1s ease 7.5s both;
        }

        /* stagger bulbs */
        .mom-bulb:nth-child(2)  { animation-delay: 0.25s; }
        .mom-bulb:nth-child(3)  { animation-delay: 0.5s; }
        .mom-bulb:nth-child(4)  { animation-delay: 0.75s; }
        .mom-bulb:nth-child(5)  { animation-delay: 1.0s; }
        .mom-bulb:nth-child(6)  { animation-delay: 0.15s; }
        .mom-bulb:nth-child(7)  { animation-delay: 0.4s; }
        .mom-bulb:nth-child(8)  { animation-delay: 0.65s; }
        .mom-bulb:nth-child(9)  { animation-delay: 0.9s; }
        .mom-bulb:nth-child(10) { animation-delay: 1.1s; }
      `}</style>

      {/* Film grain */}
      <div className="mom-grain" />

      {/* Spotlight */}
      <div className="mom-spotlight" />

      {/* Stage 1: Filmstrip */}
      <div className="mom-filmstrip">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="mom-film-segment">
            <div className="mom-film-hole-col">
              <div className="mom-film-hole" />
              <div className="mom-film-hole" />
            </div>
            <div className={`mom-film-frame ${i === 2 ? 'glow' : ''}`}>
              {i === 2 && mediaUrl && mediaType === 'image'
                ? <img src={mediaUrl} alt="moment" />
                : <div className="mom-film-glow-inner" />
              }
            </div>
            <div className="mom-film-hole-col">
              <div className="mom-film-hole" />
              <div className="mom-film-hole" />
            </div>
          </div>
        ))}
      </div>

      {/* Stage 3: Marquee sign */}
      <div className="mom-marquee">
        <div className="mom-marquee-label">★ Now Presenting ★</div>
        <div className="mom-marquee-title">
          {letters.map((ch, i) => (
            <span
              key={i}
              className="mom-char"
              style={{ animationDelay: `${3.0 + i * 0.055}s` }}
            >
              {ch === ' ' ? '\u00A0' : ch}
            </span>
          ))}
        </div>
        <div className="mom-bulbs">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="mom-bulb" />
          ))}
        </div>
      </div>

      {/* Stage 4: Message + sender */}
      <div className="mom-content">
        {message && <p className="mom-message">"{message}"</p>}
        <p className="mom-from">— From {senderName || 'Someone Special'}</p>
      </div>
    </div>
  );
};

export default MomentTemplate;
