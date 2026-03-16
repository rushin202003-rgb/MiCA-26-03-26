import React, { useMemo } from 'react';
import { NODE_POSITIONS, EDGES, MICA_ORANGE } from './constants';

function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
    h = (h ^ (h >>> 16)) >>> 0;
    return (h % 10000) / 10000;
  };
}

function wobblyPath(fromId: string, toId: string, edgeId: string): { d: string; length: number } {
  const a = NODE_POSITIONS[fromId];
  const b = NODE_POSITIONS[toId];
  if (!a || !b) return { d: '', length: 0 };

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const nx = dx / dist;
  const ny = dy / dist;

  const x1 = a.x + nx * a.r;
  const y1 = a.y + ny * a.r;
  const x2 = b.x - nx * b.r;
  const y2 = b.y - ny * b.r;

  const rand = seededRandom(edgeId);
  const px = -ny;
  const py = nx;

  const wobble1 = (rand() - 0.5) * 60;
  const wobble2 = (rand() - 0.5) * 60;

  const cp1x = x1 + (x2 - x1) * 0.33 + px * wobble1;
  const cp1y = y1 + (y2 - y1) * 0.33 + py * wobble1;
  const cp2x = x1 + (x2 - x1) * 0.66 + px * wobble2;
  const cp2y = y1 + (y2 - y1) * 0.66 + py * wobble2;

  const d = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
  const segDist = Math.hypot(x2 - x1, y2 - y1);
  const length = segDist * 1.15;

  return { d, length };
}

interface NoodleConnectionsProps {
  drawnEdges: Set<string>;
  yesNoAnswers: Record<string, boolean | null>;
}

const NoodleConnections: React.FC<NoodleConnectionsProps> = ({ drawnEdges, yesNoAnswers }) => {
  const paths = useMemo(() => {
    return EDGES.map((edge) => ({
      ...edge,
      ...wobblyPath(edge.from, edge.to, edge.id),
    }));
  }, []);

  return (
    <svg
      style={{
        position: 'absolute',
        overflow: 'visible',
        top: 0,
        left: 0,
        width: 1,
        height: 1,
        pointerEvents: 'none',
      }}
    >
      <defs>
        <filter id="noodleGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {paths.map((p) => {
        if (!drawnEdges.has(p.id)) return null;

        if (p.condNode != null && p.condValue != null) {
          const answer = yesNoAnswers[p.condNode];
          if (answer !== p.condValue) return null;
        }

        const dashLen = Math.round(p.length);

        return (
          <path
            key={p.id}
            d={p.d}
            fill="none"
            stroke={MICA_ORANGE}
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#noodleGlow)"
            opacity="0.75"
            strokeDasharray={dashLen}
            strokeDashoffset={dashLen}
            style={{
              animation: `drawNoodle 0.8s ease-out forwards`,
            }}
          />
        );
      })}
    </svg>
  );
};

export default NoodleConnections;
