import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EyeCharacter from './EyeCharacter';

/**
 * MiCA Logo — bold text where individual letters randomly expand 
 * to reveal the acronym:
 *   M = Marketing
 *   i = intelligence
 *   C = Creative
 *   A = Automation
 */

interface LetterDef {
  char: string;
  fullWord: string;
  isLowercase?: boolean;
}

const LETTERS: LetterDef[] = [
  { char: 'M', fullWord: 'arketing' },
  { char: 'i', fullWord: 'ntelligence', isLowercase: true },
  { char: 'C', fullWord: 'reative' },
  { char: 'A', fullWord: 'utomation' },
];

export default function MiCALogo() {
  // Which letter index (0-3) is randomly expanding, or -1 for none
  const [expandedIdx, setExpandedIdx] = useState(-1);
  // Which letter index is currently being hovered
  const [hoveredIdx, setHoveredIdx] = useState(-1);

  // The index to actually display (hover takes precedence)
  const displayIdx = hoveredIdx !== -1 ? hoveredIdx : expandedIdx;

  useEffect(() => {
    const cycle = () => {
      // Pick a random letter to expand
      const idx = Math.floor(Math.random() * LETTERS.length);
      setExpandedIdx(idx);

      // Collapse after 2.5s
      setTimeout(() => {
        setExpandedIdx(-1);
      }, 2500);

      // Schedule the next expansion 5-10s later
      setTimeout(cycle, 5000 + Math.random() * 5000);
    };

    // First expansion after 3s
    const t = setTimeout(cycle, 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex items-baseline gap-0 select-none" style={{ fontFamily: "'Inter', sans-serif" }}>
      {LETTERS.map((letter, i) => (
        <span
          key={i}
          className="inline-flex items-baseline relative cursor-default transition-transform duration-300 hover:scale-110"
          onMouseEnter={() => setHoveredIdx(i)}
          onMouseLeave={() => setHoveredIdx(-1)}
        >
          {/* The bold letter */}
          <span
            className="font-black text-[#FF7A00] text-glow relative inline-block"
            style={{
              fontSize: 'clamp(90px, 11vw, 140px)', /* Greatly increased */
              lineHeight: 1,
              ...(letter.isLowercase ? { fontSize: 'clamp(70px, 8vw, 110px)' } : {}),
            }}
          >
            {letter.char === 'i' ? (
              <>
                {/* Dotless 'i' */}
                <span className="relative z-10">ı</span>
                {/* Custom Eyeball Dot */}
                <div className="absolute top-[0.08em] left-[52%] -translate-x-1/2 flex items-center justify-center z-20 pointer-events-auto" style={{ width: '0.25em', height: '0.25em' }}>
                  <div className="scale-[0.3] md:scale-[0.4] lg:scale-[0.45] origin-center">
                    <EyeCharacter size={90} />
                  </div>
                </div>
              </>
            ) : (
              letter.char
            )}
          </span>

          {/* The expanding full word */}
          <AnimatePresence>
            {displayIdx === i && (
              <motion.span
                className="font-light text-[#FF7A00]/70 whitespace-nowrap overflow-hidden"
                style={{
                  fontSize: 'clamp(28px, 3vw, 42px)',
                  lineHeight: 1,
                }}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{
                  duration: 0.5,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                {letter.fullWord}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Add slight spacing between letter groups, but not after last */}
          {i < LETTERS.length - 1 && displayIdx !== i && (
            <span style={{ width: '2px' }} />
          )}
        </span>
      ))}
    </div>
  );
}
