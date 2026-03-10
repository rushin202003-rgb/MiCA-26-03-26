import { useState, useEffect, useRef } from 'react';
import { motion, useSpring } from 'framer-motion';
import EyeCharacter from './EyeCharacter';

interface Props {
  onGiggle: () => void;
}

export default function FloatingHeroEyeball({ onGiggle }: Props) {
  // Start roughly center right
  const [targetPos, setTargetPos] = useState({
    x: typeof window !== 'undefined' ? window.innerWidth * 0.75 : 800,
    y: typeof window !== 'undefined' ? window.innerHeight * 0.5 : 400
  });

  // Is it currently chasing the mouse?
  const isChasingRef = useRef(false);

  // Snappy, enthusiastic spring physics for the entire eyeball's movement across screen
  const springX = useSpring(targetPos.x, { stiffness: 180, damping: 22 });
  const springY = useSpring(targetPos.y, { stiffness: 180, damping: 22 });

  useEffect(() => {
    springX.set(targetPos.x);
    springY.set(targetPos.y);
  }, [targetPos, springX, springY]);

  useEffect(() => {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (isChasingRef.current) {
        setTargetPos({ x: mouseX, y: mouseY });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    // The Autonomous Brain
    const pickNewTarget = () => {
      // 20% chance to chase the mouse enthusiastically to encourage a click
      if (Math.random() < 0.2) {
        isChasingRef.current = true;
        setTargetPos({ x: mouseX, y: mouseY });

        // Stop chasing after 2.5s
        setTimeout(() => {
          isChasingRef.current = false;
        }, 2500);
        return;
      }

      // Otherwise, find areas of interest
      isChasingRef.current = false;
      const interests = document.querySelectorAll('[data-interest]');

      if (interests.length > 0 && Math.random() < 0.7) { // 70% chance to visit an interest
        const targetEl = interests[Math.floor(Math.random() * interests.length)];
        const rect = targetEl.getBoundingClientRect();

        // Pick a point around the element.
        // For buttons, go near them. For the video stack, hover near top or bottom.
        const goTop = Math.random() > 0.5;

        // Calculate a snappy position around the element
        const destX = rect.left + (Math.random() * rect.width);
        const destY = goTop ? Math.max(50, rect.top - 70) : Math.min(window.innerHeight - 50, rect.bottom + 70);

        setTargetPos({ x: destX, y: destY });
      } else {
        // 10% chance to just wander somewhere random but safe
        setTargetPos({
          x: 100 + Math.random() * (window.innerWidth - 200),
          y: 100 + Math.random() * (window.innerHeight - 200)
        });
      }
    };

    // Pick a new target every 3 to 6 seconds
    const intervalCycle = () => {
      pickNewTarget();
      setTimeout(intervalCycle, 3000 + Math.random() * 3000);
    };

    // Start cycle
    const t = setTimeout(intervalCycle, 2000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(t);
    };
  }, []);

  return (
    <motion.div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        x: springX,
        y: springY,
        // offset so the center of the eye is exactly at x,y
        translateX: '-50%',
        translateY: '-50%',
        zIndex: 50,
        pointerEvents: 'auto'
      }}
    >
      <EyeCharacter size={100} onGiggle={onGiggle} />
    </motion.div>
  );
}
