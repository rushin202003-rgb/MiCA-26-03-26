import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  // Which letter index (0-3) is currently expanding, or -1 for none
  const [expandedIdx, setExpandedIdx] = useState(-1);

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
        <span key={i} className="inline-flex items-baseline overflow-hidden">
          {/* The bold letter */}
          <span
            className="font-black text-[#FF6600]"
            style={{
              fontSize: 'clamp(56px, 6vw, 80px)',
              lineHeight: 1,
              ...(letter.isLowercase ? { fontSize: 'clamp(44px, 5vw, 64px)' } : {}),
            }}
          >
            {letter.char}
          </span>

          {/* The expanding full word */}
          <AnimatePresence>
            {expandedIdx === i && (
              <motion.span
                className="font-light text-[#FF6600]/70 whitespace-nowrap"
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
          {i < LETTERS.length - 1 && expandedIdx !== i && (
            <span style={{ width: '2px' }} />
          )}
        </span>
      ))}
    </div>
  );
}
