import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { motion, useMotionValue, useSpring, animate } from 'framer-motion';
import {
  NODE_POSITIONS,
  NODES,
  SPRING_PAN,
  SPRING_SCALE,
} from './constants';
import type { FormValues } from './types';
import DoodleNode from './DoodleNode';
import NoodleConnections from './NoodleConnections';

interface DoodleCanvasProps {
  visibleNodes: Set<string>;
  drawnEdges: Set<string>;
  activeNode: string;
  step: number;
  values: FormValues;
  yesNoAnswers: Record<string, boolean | null>;
  onValueChange: (key: string, value: string) => void;
  onStart: () => void;
  onAdvance: (nodeId: string) => void;
  onYesNo: (nodeId: string, answer: boolean) => void;
  onChoice: (nodeId: string, value: string) => void;
  onNodeClick: (nodeId: string) => void;
  onFinish: () => void;
  onFileUpload: (file: File) => void;
  isUploading: boolean;
}

const DoodleCanvas: React.FC<DoodleCanvasProps> = ({
  visibleNodes,
  drawnEdges,
  activeNode,
  step,
  values,
  yesNoAnswers,
  onValueChange,
  onStart,
  onAdvance,
  onYesNo,
  onChoice,
  onNodeClick,
  onFinish,
  onFileUpload,
  isUploading,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [isDragging, setIsDragging] = useState(false);
  const userDraggedRef = useRef(false);
  const prevActiveNodeRef = useRef(activeNode);

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const activePos = NODE_POSITIONS[activeNode] || NODE_POSITIONS.start;

  const panX = useMotionValue(viewport.w / 2 - activePos.x);
  const panY = useMotionValue(viewport.h / 2 - activePos.y);
  const springScale = useSpring(1.0, SPRING_SCALE);

  useEffect(() => {
    if (prevActiveNodeRef.current !== activeNode) {
      userDraggedRef.current = false;
      prevActiveNodeRef.current = activeNode;
    }
    if (userDraggedRef.current) return;

    const pos = NODE_POSITIONS[activeNode] || NODE_POSITIONS.start;
    const targetX = viewport.w / 2 - pos.x;
    const targetY = viewport.h / 2 - pos.y;

    animate(panX, targetX, { type: 'spring', stiffness: SPRING_PAN.stiffness, damping: SPRING_PAN.damping });
    animate(panY, targetY, { type: 'spring', stiffness: SPRING_PAN.stiffness, damping: SPRING_PAN.damping });
  }, [activeNode, viewport, panX, panY]);

  useEffect(() => {
    springScale.set(step === 0 ? 1.0 : 1.05);
  }, [activeNode, step, springScale]);

  const handleDragStart = useCallback(() => {
    userDraggedRef.current = true;
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const dragConstraints = useMemo(() => {
    const nodeIds = Array.from(visibleNodes);
    if (nodeIds.length === 0) return { left: 0, right: 0, top: 0, bottom: 0 };

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const id of nodeIds) {
      const n = NODE_POSITIONS[id];
      if (!n) continue;
      minX = Math.min(minX, n.x - n.r);
      maxX = Math.max(maxX, n.x + n.r);
      minY = Math.min(minY, n.y - n.r);
      maxY = Math.max(maxY, n.y + n.r);
    }

    const padX = viewport.w * 0.3;
    const padY = viewport.h * 0.15;

    return {
      left: -(maxX - viewport.w + padX),
      right: -minX + padX,
      top: -(maxY - viewport.h + padY),
      bottom: -minY + padY,
    };
  }, [visibleNodes, viewport]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      <motion.div
        drag
        dragElastic={0.08}
        dragConstraints={dragConstraints}
        dragTransition={{ power: 0.3, timeConstant: 200 }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{
          x: panX,
          y: panY,
          scale: springScale,
          position: 'absolute',
          willChange: 'transform',
        }}
      >
        <NoodleConnections drawnEdges={drawnEdges} yesNoAnswers={yesNoAnswers} />

        {NODES.map((node) => (
          <DoodleNode
            key={node.id}
            node={node}
            isVisible={visibleNodes.has(node.id)}
            isActive={activeNode === node.id}
            values={values}
            yesNoAnswers={yesNoAnswers}
            onValueChange={onValueChange}
            onAdvance={() => onAdvance(node.id)}
            onYesNo={onYesNo}
            onChoice={onChoice}
            onStart={onStart}
            onNodeClick={onNodeClick}
            onFinish={onFinish}
            onFileUpload={onFileUpload}
            isUploading={isUploading}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default DoodleCanvas;
