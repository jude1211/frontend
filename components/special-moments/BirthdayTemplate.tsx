import React, { useEffect, useState } from 'react';

interface Piece {
  id: number;
  left: string;
  size: string;
  delay: string;
  duration: string;
  color: string;
  rotate: string;
  shape: 'rect' | 'circle' | 'ribbon';
}
interface Balloon {
  id: number;
  left: string;
  size: string;
  delay: string;
  duration: string;
  color: string;
  wobbleDuration: string;
  wobbleDelay: string;
}
interface Spark {
  id: number;
  angle: number;
  delay: string;
  duration: string;
}

const CONFETTI_COLORS = ['#FF2D78', '#FFD700', '#00BCD4', '#76FF03', '#FF6B6B', '#C77DFF', '#FFE066', '#FF7043', '#FFFFFF'];
const BALLOON_COLORS = ['#FF2D78', '#FFD93D', '#6BCB77', '#4D96FF', '#C77DFF', '#FF7043', '#FF80AB'];

interface Props {
  recipientName: string;
  senderName: string;
  message: string;
  mediaUrl?: string;
  mediaType?: string;
  replayKey: number;
}

const BirthdayTemplate: React.FC<Props> = ({ recipientName, senderName, message, mediaUrl, mediaType, replayKey }) => {
  const [confetti, setConfetti] = useState<Piece[]>([]);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [sparks, setSparks] = useState<Spark[]>([]);

  useEffect(() => {
    const shapes: Array<'rect' | 'circle' | 'ribbon'> = ['rect', 'circle', 'ribbon'];
    setConfetti(Array.from({ length: 45 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: `${6 + Math.random() * 10}px`,
      delay: `${Math.random() * 6}s`,
      duration: `${3.5 + Math.random() * 4}s`,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotate: `${Math.random() * 360}deg`,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    })));
    setBalloons(Array.from({ length: 14 }, (_, i) => ({
      id: i,
      left: `${3 + Math.random() * 94}%`,
      size: `${32 + Math.random() * 22}px`,
      delay: `${1.5 + Math.random() * 2.5}s`,
      duration: `${4 + Math.random() * 4}s`,
      color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
      wobbleDuration: `${1.5 + Math.random() * 1.5}s`,
      wobbleDelay: `${Math.random() * 1.5}s`,
    })));
    setSparks(Array.from({ length: 12 }, (_, i) => ({
      id: i,
      angle: i * 30,
      delay: `${6 + Math.random() * 1}s`,
      duration: `${0.7 + Math.random() * 0.5}s`,
    })));
  }, [replayKey]);

  return (
    <div className="bday-root" key={replayKey}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Pacifico&family=Caveat:wght@700&display=swap');

        .bday-root {
          width: 100%; height: 100%; position: relative; overflow: hidden;
          background: radial-gradient(ellipse at 50% 50%, #2a0020 0%, #0d000a 100%);
          font-family: 'Caveat', cursive;
        }

        /* ─── Stage 1: Rotating sunburst ──────────────────────────── */
        .bday-sunburst {
          position: absolute; inset: -30%; z-index: 0;
          background: conic-gradient(
            from 0deg,
            transparent 0deg, #FF2D7820 12deg, transparent 24deg,
            transparent 36deg, #FF6B9D18 48deg, transparent 60deg,
            transparent 72deg, #FF2D7815 84deg, transparent 96deg,
            transparent 108deg, #C2185B1A 120deg, transparent 132deg,
            transparent 144deg, #FF2D7820 156deg, transparent 168deg,
            transparent 180deg, #FF6B9D18 192deg, transparent 204deg,
            transparent 216deg, #FF2D7815 228deg, transparent 240deg,
            transparent 252deg, #C2185B1A 264deg, transparent 276deg,
            transparent 288deg, #FF2D7820 300deg, transparent 312deg,
            transparent 324deg, #FF6B9D18 336deg, transparent 348deg,
            transparent 360deg
          );
          animation: bday-spin 12s linear infinite;
        }
        @keyframes bday-spin { to { transform: rotate(360deg); } }

        /* ─── Stage 1: Confetti ──────────────────────────────────── */
        .bday-confetti {
          position: absolute; top: -16px; pointer-events: none; z-index: 1;
          animation: bday-confetti-fall linear infinite;
        }
        .bday-conf-rect { border-radius: 2px; }
        .bday-conf-circle { border-radius: 50%; }
        .bday-conf-ribbon { border-radius: 0; width: 4px !important; height: 18px !important; }
        @keyframes bday-confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          85%  { opacity: 0.8; }
          100% { transform: translateY(108vh) rotate(800deg); opacity: 0; }
        }

        /* ─── Stage 2: Balloons ──────────────────────────────────── */
        .bday-balloon-wrap {
          position: absolute; bottom: -80px; z-index: 2;
          display: flex; flex-direction: column; align-items: center; gap: 0;
          animation: bday-balloon-rise ease-out forwards;
        }
        @keyframes bday-balloon-rise {
          0%   { bottom: -80px; opacity: 0; }
          10%  { opacity: 1; }
          100% { bottom: 88vh; opacity: 0.5; }
        }
        .bday-balloon-body {
          border-radius: 50%; position: relative;
        }
        .bday-balloon-body::after {
          content: ''; display: block; width: 1px; height: 28px;
          background: rgba(255,255,255,0.4); margin: 0 auto;
        }
        .bday-balloon-wobble { animation: bday-wobble ease-in-out infinite alternate; }
        @keyframes bday-wobble {
          0%   { transform: rotate(-6deg) translateX(-4px); }
          100% { transform: rotate(6deg) translateX(4px); }
        }

        /* ─── Stage 2: Cake ──────────────────────────────────────── */
        .bday-cake {
          position: absolute; bottom: -140px; left: 50%; transform: translateX(-50%);
          font-size: 5.5rem; line-height: 1; z-index: 3; text-align: center;
          filter: drop-shadow(0 8px 28px rgba(255,45,120,0.7));
          animation: bday-cake-slide 1s cubic-bezier(.34,1.56,.64,1) 2s forwards;
        }
        @keyframes bday-cake-slide {
          from { bottom: -140px; opacity: 0; }
          to   { bottom: 14px; opacity: 1; }
        }

        /* ─── Stage 3: Starburst speech bubble ──────────────────── */
        .bday-star-wrap {
          position: absolute; inset: 0; display: flex;
          align-items: center; justify-content: center; z-index: 10;
          animation: bday-star-pop 0.8s cubic-bezier(.34,1.56,.64,1) 4s both;
          pointer-events: none;
        }
        @keyframes bday-star-pop {
          0%   { opacity: 0; transform: scale(0) rotate(-20deg); }
          70%  { transform: scale(1.08) rotate(3deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        .bday-starburst {
          width: 320px; height: 320px; position: relative;
          display: flex; align-items: center; justify-content: center;
          background: #FFE000;
          clip-path: polygon(
            50% 0%, 55% 34%, 79% 9%, 63% 38%,
            93% 26%, 69% 47%, 100% 50%,
            69% 53%, 93% 74%, 63% 62%,
            79% 91%, 55% 66%, 50% 100%,
            45% 66%, 21% 91%, 37% 62%,
            7% 74%, 31% 53%, 0% 50%,
            31% 47%, 7% 26%, 37% 38%,
            21% 9%, 45% 34%
          );
          animation: bday-star-pulse 2s ease-in-out 4.8s infinite alternate;
        }
        @keyframes bday-star-pulse {
          from { filter: drop-shadow(0 0 16px #FFE000BB); }
          to   { filter: drop-shadow(0 0 36px #FF2D78BB); }
        }
        .bday-star-text {
          font-family: 'Pacifico', cursive; font-size: 1.15rem;
          color: #1a0011; text-align: center; padding: 0 32px; line-height: 1.35;
        }
        .bday-star-text strong { display: block; font-size: 1.45rem; margin-top: 6px; }

        /* ─── Stage 4: Polaroid ─────────────────────────────────── */
        .bday-polaroid-wrap {
          position: absolute; inset: 0; display: flex; flex-direction: column;
          align-items: center; justify-content: center; z-index: 15;
          animation: bday-polaroid-in 1.1s ease 6.2s both;
        }
        @keyframes bday-polaroid-in {
          from { opacity: 0; transform: translateY(40px) rotate(-6deg); }
          to   { opacity: 1; transform: translateY(0) rotate(-2deg); }
        }
        .bday-polaroid {
          background: #fff; padding: 12px 12px 44px;
          box-shadow: 0 12px 50px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.1);
          position: relative;
        }
        .bday-polaroid-img {
          width: 180px; height: 180px; object-fit: cover; display: block;
        }
        .bday-polaroid-placeholder {
          width: 180px; height: 180px; display: flex; align-items: center;
          justify-content: center; font-size: 3.5rem;
          background: linear-gradient(135deg, #FF2D78, #C77DFF);
        }

        /* Sparks around polaroid */
        .bday-spark {
          position: absolute; width: 2px; height: 44px;
          background: linear-gradient(to top, #FFD700, #FF2D78, transparent);
          transform-origin: 50% 100%; border-radius: 2px;
          animation: bday-spark-burst ease-out forwards infinite;
        }
        @keyframes bday-spark-burst {
          0%   { opacity: 0; transform: rotate(var(--ba)) scaleY(0); }
          30%  { opacity: 1; transform: rotate(var(--ba)) scaleY(1) translateY(-20px); }
          100% { opacity: 0; transform: rotate(var(--ba)) scaleY(0.5) translateY(-55px); }
        }

        .bday-message {
          font-family: 'Caveat', cursive; font-size: 1.15rem; color: #fff;
          text-align: center; max-width: 300px; margin-top: 14px; line-height: 1.5;
          text-shadow: 0 2px 10px rgba(0,0,0,0.95);
          animation: bday-fade-up 1s ease 7.2s both;
        }
        .bday-from {
          font-family: 'Pacifico', cursive; font-size: 1.1rem; color: #FF2D78;
          margin-top: 8px; text-shadow: 0 0 20px #FF2D7899;
          animation: bday-fade-up 1s ease 7.8s both;
        }
        @keyframes bday-fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Stage 1 — Sunburst */}
      <div className="bday-sunburst" />

      {/* Stage 1 — Confetti */}
      {confetti.map(p => (
        <div
          key={p.id}
          className={`bday-confetti bday-conf-${p.shape}`}
          style={{
            left: p.left,
            width: p.shape === 'ribbon' ? '4px' : p.size,
            height: p.shape === 'ribbon' ? '18px' : p.size,
            backgroundColor: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
            transform: `rotate(${p.rotate})`,
          }}
        />
      ))}

      {/* Stage 2 — Balloons */}
      {balloons.map(b => (
        <div
          key={b.id}
          className="bday-balloon-wrap"
          style={{ left: b.left, animationDelay: b.delay, animationDuration: b.duration }}
        >
          <div className="bday-balloon-wobble" style={{ animationDuration: b.wobbleDuration, animationDelay: b.wobbleDelay }}>
            <div className="bday-balloon-body" style={{ width: b.size, height: b.size, backgroundColor: b.color }} />
          </div>
        </div>
      ))}

      {/* Stage 2 — Cake */}
      <div className="bday-cake">🎂</div>

      {/* Stage 3 — Starburst speech bubble */}
      <div className="bday-star-wrap">
        <div className="bday-starburst">
          <div className="bday-star-text">
            Happy Birthday
            <strong>{recipientName || 'You'}!</strong>
          </div>
        </div>
      </div>

      {/* Stage 4 — Polaroid + sparks + message */}
      <div className="bday-polaroid-wrap">
        <div className="bday-polaroid">
          {mediaUrl && mediaType === 'image'
            ? <img className="bday-polaroid-img" src={mediaUrl} alt="uploaded" />
            : <div className="bday-polaroid-placeholder">🎉</div>
          }
          {/* Spark ring */}
          {sparks.map(s => (
            <div
              key={s.id}
              className="bday-spark"
              style={{
                top: '50%', left: '50%',
                animationDelay: s.delay,
                animationDuration: s.duration,
                ['--ba' as any]: `${s.angle}deg`,
              }}
            />
          ))}
        </div>
        {message && <p className="bday-message">"{message}"</p>}
        <p className="bday-from">— From {senderName || 'Someone Special'}</p>
      </div>
    </div>
  );
};

export default BirthdayTemplate;
