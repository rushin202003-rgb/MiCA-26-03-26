import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NODE_POSITIONS, MICA_ORANGE, MICA_ORANGE_GLOW } from './constants';
import type { NodeDef, FormValues } from './types';
import { INDIAN_CITIES } from './indianCities';

function alarmArcD(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startDeg));
  const y1 = cy + r * Math.sin(toRad(startDeg));
  const x2 = cx + r * Math.cos(toRad(endDeg));
  const y2 = cy + r * Math.sin(toRad(endDeg));
  return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
}

function seededWobble(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  const r = (min: number, max: number) => {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
    h = (h ^ (h >>> 16)) >>> 0;
    return min + (h % 1000) / 1000 * (max - min);
  };
  return {
    borderRadius: `${r(42, 58)}% ${r(42, 58)}% ${r(42, 58)}% ${r(42, 58)}% / ${r(42, 58)}% ${r(42, 58)}% ${r(42, 58)}% ${r(42, 58)}%`,
  };
}

function getDateBounds() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const future = new Date(now);
  future.setFullYear(future.getFullYear() + 1);
  const maxDate = future.toISOString().split('T')[0];
  return { today, maxDate };
}

function isBudgetValid(val: string): boolean {
  if (!val.trim()) return false;
  const num = Number(val);
  return !isNaN(num) && num >= 100 && num <= 1000000;
}

interface DoodleNodeProps {
  node: NodeDef;
  isVisible: boolean;
  isActive: boolean;
  values: FormValues;
  yesNoAnswers: Record<string, boolean | null>;
  onValueChange: (key: string, value: string) => void;
  onAdvance: () => void;
  onYesNo: (nodeId: string, answer: boolean) => void;
  onChoice: (nodeId: string, value: string) => void;
  onStart: () => void;
  onNodeClick: (nodeId: string) => void;
  onFinish: () => void;
  onFileUpload: (file: File) => void;
  isUploading: boolean;
}

const DoodleNode: React.FC<DoodleNodeProps> = ({
  node,
  isVisible,
  isActive,
  values,
  yesNoAnswers,
  onValueChange,
  onAdvance,
  onYesNo,
  onChoice,
  onStart,
  onNodeClick,
  onFinish,
  onFileUpload,
  isUploading,
}) => {
  const pos = NODE_POSITIONS[node.id];
  if (!pos) return null;

  const wobble = useMemo(() => seededWobble(node.id), [node.id]);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isStart = node.id === 'start';
  const isLetsGo = node.id === 'letsGo';
  const isActionButton = isStart || isLetsGo;
  const diameter = isActionButton ? pos.r * 2 : isActive ? 260 : 200;

  const [cityInputMode, setCityInputMode] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const cityInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isActive && inputRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 400);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  useEffect(() => {
    if (cityInputMode && cityInputRef.current) {
      const timer = setTimeout(() => cityInputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [cityInputMode]);

  useEffect(() => {
    if (!isActive && node.id === 'location') {
      setCityInputMode(false);
      setCityQuery('');
    }
  }, [isActive, node.id]);

  const currentValue = node.valueKey ? values[node.valueKey as keyof FormValues] : '';
  const yesNoAnswer = yesNoAnswers[node.id] ?? null;

  const dateBounds = useMemo(() => getDateBounds(), []);

  const citySuggestions = useMemo(() => {
    if (!cityQuery.trim()) return [];
    const q = cityQuery.toLowerCase();
    return INDIAN_CITIES.filter(c => c.toLowerCase().startsWith(q)).slice(0, 5);
  }, [cityQuery]);

  const budgetNum = node.id === 'howMuch' ? Number(currentValue) : 0;
  const budgetOutOfRange = node.id === 'howMuch' && currentValue.trim() !== '' && !isBudgetValid(currentValue);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (node.inputType === 'textarea' && !e.shiftKey) {
        e.preventDefault();
        onAdvance();
      } else if (node.inputType !== 'textarea') {
        if (node.id === 'howMuch' && !isBudgetValid(currentValue)) return;
        onAdvance();
      }
    }
  };

  const handleBudgetChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    if (node.valueKey) onValueChange(node.valueKey, raw);
  }, [node.valueKey, onValueChange]);

  const handleCitySelect = useCallback((city: string) => {
    setCityQuery(city);
    onChoice(node.id, city);
    setCityInputMode(false);
  }, [node.id, onChoice]);

  const handleCityKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && citySuggestions.length > 0) {
      handleCitySelect(citySuggestions[0]);
    }
  }, [citySuggestions, handleCitySelect]);

  const handleNodeBodyClick = () => {
    if (!isActive && isVisible && !isActionButton) {
      onNodeClick(node.id);
    }
  };

  const handleAttachYes = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileUpload(file);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, rotate: -8, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
          style={{
            position: 'absolute',
            left: pos.x - diameter / 2,
            top: pos.y - diameter / 2,
            width: diameter,
            height: diameter,
            transition: 'width 0.4s ease, height 0.4s ease',
          }}
        >
          {/* Ripple highlights the currently active node, including the start node */}
          {isActive && (
            <div className="doodle-ripple" />
          )}

          {/* Alarm-bell wobble arcs while typing */}
          {isActive && !isActionButton && (node.inputType === 'text' || node.inputType === 'textarea') && currentValue.trim() && (
            <svg
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none', zIndex: 5 }}
              viewBox={`0 0 ${diameter} ${diameter}`}
            >
              {/* Upper-left arcs (~45° counter-clockwise from top) */}
              <g className="alarm-arcs-left">
                <path d={alarmArcD(diameter / 2, diameter / 2, diameter * 0.58, 210, 243)} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="3" strokeLinecap="round" />
                <path d={alarmArcD(diameter / 2, diameter / 2, diameter * 0.67, 214, 238)} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round" />
              </g>
              {/* Upper-right arcs (~45° clockwise from top) */}
              <g className="alarm-arcs-right">
                <path d={alarmArcD(diameter / 2, diameter / 2, diameter * 0.58, 297, 330)} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="3" strokeLinecap="round" />
                <path d={alarmArcD(diameter / 2, diameter / 2, diameter * 0.67, 302, 326)} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            </svg>
          )}

          {/* Start node floats gently to feel \"alive\" */}
          {isStart ? (
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
              onClick={handleNodeBodyClick}
              style={{
                width: '100%',
                height: '100%',
                ...wobble,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                background: `linear-gradient(135deg, ${MICA_ORANGE}, #FF4400)`,
                border: 'none',
                boxShadow: `0 0 55px rgba(255,90,0,0.5)`,
                backdropFilter: 'blur(12px)',
                padding: 0,
                cursor: 'pointer',
                transition: 'box-shadow 0.3s ease',
              }}
            >
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div onClick={onStart} style={{ textAlign: 'center', cursor: 'pointer' }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-1px' }}>
                    Start
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
          <div
            onClick={handleNodeBodyClick}
            style={{
              width: '100%',
              height: '100%',
              ...wobble,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: node.id === 'location' && cityInputMode ? 'visible' : 'hidden',
              // All non-start nodes use the same orange/white branding
              background: `linear-gradient(135deg, ${MICA_ORANGE}, #FF4400)`,
              border: isActionButton ? 'none' : `2px solid ${MICA_ORANGE}`,
              boxShadow: isActionButton
                ? `0 0 40px rgba(255,90,0,0.45)`
                : isActive
                  ? `0 0 0 3px ${MICA_ORANGE_GLOW}, 0 0 36px rgba(255,122,0,0.25)`
                  : `0 0 22px rgba(255,122,0,0.18)`,
              backdropFilter: 'blur(12px)',
              padding: isActionButton ? 0 : 20,
              cursor: isActionButton ? 'pointer' : (!isActive ? 'pointer' : 'default'),
              transition: 'box-shadow 0.3s ease',
            }}
          >
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>

            {isLetsGo && (
              <div onClick={onFinish} style={{ textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-0.5px' }}>
                  LET'S GO!
                </div>
              </div>
            )}

            {!isActionButton && (
              <>
                {/* Heading label (e.g. CAMPAIGN NAME, WHAT'S THIS FOR?) – match Start style */}
                <div style={{
                  fontSize: 28,
                  fontWeight: 800,
                  letterSpacing: '-1px',
                  textTransform: 'none',
                  color: '#fff',
                  textAlign: 'center',
                }}>
                  {node.label}
                </div>

                {!isActive && currentValue && (
                  <div style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: '#fff',
                    textAlign: 'center',
                    maxWidth: '85%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: node.inputType === 'textarea' ? 'pre-wrap' : 'nowrap',
                    lineHeight: 1.35,
                  }}>
                    {currentValue}
                  </div>
                )}

                {!isActive && node.inputType === 'yesno' && yesNoAnswer !== null && (
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', textAlign: 'center' }}>
                    {node.id === 'attachDoc'
                      ? (yesNoAnswer ? values.attachedDocName || 'Attached' : 'Skipped')
                      : (yesNoAnswer ? 'Yes' : 'No')
                    }
                  </div>
                )}

                {isActive && node.inputType === 'text' && node.id !== 'howMuch' && (
                  <div style={{ width: '84%', textAlign: 'center' }}>
                    <input
                      ref={inputRef as React.RefObject<HTMLInputElement>}
                      value={currentValue}
                      onChange={(e) => node.valueKey && onValueChange(node.valueKey, e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={node.placeholder}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1.5px solid rgba(255,255,255,0.3)',
                        color: '#fff',
                        fontFamily: "'Inter', sans-serif",
                        textAlign: 'center',
                        outline: 'none',
                        width: '100%',
                        padding: '10px 6px',
                        fontSize: 22,
                        fontWeight: 700,
                      }}
                    />
                    {currentValue.trim() && (
                      <div
                        onClick={onAdvance}
                        style={{ fontSize: 14, color: '#fff', background: 'rgba(0,0,0,0.35)', borderRadius: 9999, padding: '4px 12px', cursor: 'pointer', fontWeight: 700, marginTop: 10, opacity: 0.95 }}
                      >
                        press Enter ↓
                      </div>
                    )}
                  </div>
                )}

                {isActive && node.id === 'howMuch' && (
                  <div style={{ width: '84%', textAlign: 'center' }}>
                    <input
                      ref={inputRef as React.RefObject<HTMLInputElement>}
                      type="text"
                      inputMode="numeric"
                      value={currentValue}
                      onChange={handleBudgetChange}
                      onKeyDown={handleKeyDown}
                      placeholder={node.placeholder}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: `1.5px solid ${budgetOutOfRange ? '#ff4444' : 'rgba(255,255,255,0.3)'}`,
                        color: '#fff',
                        fontFamily: "'Inter', sans-serif",
                        textAlign: 'center',
                        outline: 'none',
                        width: '100%',
                        padding: '8px 4px',
                        fontSize: 20,
                        fontWeight: 600,
                      }}
                    />
                    {budgetOutOfRange && (
                      <div style={{ fontSize: 9, color: '#ff6666', marginTop: 4, fontWeight: 500 }}>
                        {budgetNum < 100 ? 'Min ₹100' : 'Max ₹10,00,000'}
                      </div>
                    )}
                    {isBudgetValid(currentValue) && (
                      <div
                        onClick={onAdvance}
                        style={{ fontSize: 14, color: '#fff', background: 'rgba(0,0,0,0.35)', borderRadius: 9999, padding: '4px 12px', cursor: 'pointer', fontWeight: 700, marginTop: 10, opacity: 0.95 }}
                      >
                        press Enter ↓
                      </div>
                    )}
                  </div>
                )}

                {isActive && node.inputType === 'textarea' && (
                  <div style={{ width: '84%', textAlign: 'center' }}>
                    <textarea
                      ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                      value={currentValue}
                      onChange={(e) => node.valueKey && onValueChange(node.valueKey, e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={node.placeholder}
                      rows={3}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1.5px solid rgba(255,255,255,0.3)',
                        color: '#fff',
                        fontFamily: "'Inter', sans-serif",
                        textAlign: 'center',
                        outline: 'none',
                        width: '100%',
                        padding: '8px 4px',
                        fontSize: 18,
                        lineHeight: 1.55,
                        resize: 'none',
                      }}
                    />
                    {currentValue.trim() && (
                      <div
                        onClick={onAdvance}
                        style={{ fontSize: 14, color: '#fff', background: 'rgba(0,0,0,0.35)', borderRadius: 9999, padding: '4px 12px', cursor: 'pointer', fontWeight: 700, marginTop: 10, opacity: 0.95 }}
                      >
                        next →
                      </div>
                    )}
                  </div>
                )}

                {isActive && node.inputType === 'date' && (
                  <div style={{ width: '84%', textAlign: 'center' }}>
                    <input
                      ref={inputRef as React.RefObject<HTMLInputElement>}
                      type="date"
                      value={currentValue}
                      min={dateBounds.today}
                      max={dateBounds.maxDate}
                      onChange={(e) => node.valueKey && onValueChange(node.valueKey, e.target.value)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1.5px solid rgba(255,255,255,0.3)',
                        color: '#fff',
                        fontFamily: "'Inter', sans-serif",
                        textAlign: 'center',
                        outline: 'none',
                        width: '100%',
                        padding: '8px 4px',
                        fontSize: 18,
                        colorScheme: 'dark',
                      }}
                    />
                    {currentValue && (
                      <div
                        onClick={onAdvance}
                        style={{ fontSize: 14, color: '#fff', background: 'rgba(0,0,0,0.35)', borderRadius: 9999, padding: '4px 14px', cursor: 'pointer', fontWeight: 700, marginTop: 10, opacity: 0.95 }}
                      >
                        confirm →
                      </div>
                    )}
                  </div>
                )}

                {isActive && node.inputType === 'yesno' && node.id !== 'attachDoc' && (
                  <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => onYesNo(node.id, true)}
                      style={{
                        padding: '10px 26px',
                        borderRadius: 9999,
                        border: `1.5px solid ${yesNoAnswer === true ? MICA_ORANGE : 'rgba(255,255,255,0.35)'}`,
                        background: yesNoAnswer === true ? MICA_ORANGE : 'transparent',
                        color: '#fff',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 16,
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => onYesNo(node.id, false)}
                      style={{
                        padding: '10px 26px',
                        borderRadius: 9999,
                        border: `1.5px solid ${yesNoAnswer === false ? MICA_ORANGE : 'rgba(255,255,255,0.35)'}`,
                        background: yesNoAnswer === false ? MICA_ORANGE : 'transparent',
                        color: '#fff',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 16,
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      No
                    </button>
                  </div>
                )}

                {isActive && node.id === 'attachDoc' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    {isUploading ? (
                      <div style={{ fontSize: 12, color: MICA_ORANGE, fontWeight: 600 }}>
                        Uploading…
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button
                          type="button"
                          onClick={handleAttachYes}
                          style={{
                            padding: '7px 20px',
                            borderRadius: 20,
                            border: `1.5px solid ${yesNoAnswer === true ? MICA_ORANGE : 'rgba(255,255,255,0.35)'}`,
                            background: yesNoAnswer === true ? MICA_ORANGE : 'transparent',
                            color: '#fff',
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 12,
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => onYesNo(node.id, false)}
                          style={{
                            padding: '7px 20px',
                            borderRadius: 20,
                            border: `1.5px solid ${yesNoAnswer === false ? MICA_ORANGE : 'rgba(255,255,255,0.35)'}`,
                            background: yesNoAnswer === false ? MICA_ORANGE : 'transparent',
                            color: '#fff',
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 12,
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          Skip
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {isActive && node.inputType === 'choice' && node.id === 'location' && !cityInputMode && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 10, justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setCityInputMode(true)}
                      style={{
                        padding: '10px 26px',
                        borderRadius: 9999,
                        border: '1.5px solid rgba(255,255,255,0.35)',
                        background: 'transparent',
                        color: '#fff',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 16,
                        cursor: 'pointer',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      City
                    </button>
                    <button
                      type="button"
                      onClick={() => onChoice(node.id, 'Online')}
                      style={{
                        padding: '10px 26px',
                        borderRadius: 9999,
                        border: `1.5px solid ${currentValue === 'Online' ? MICA_ORANGE : 'rgba(255,255,255,0.35)'}`,
                        background: currentValue === 'Online' ? MICA_ORANGE : 'transparent',
                        color: '#fff',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 16,
                        cursor: 'pointer',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Online
                    </button>
                  </div>
                )}

                {isActive && node.id === 'location' && cityInputMode && (
                  <div style={{ width: '84%', textAlign: 'center', position: 'relative' }}>
                    <input
                      ref={cityInputRef}
                      value={cityQuery}
                      onChange={(e) => setCityQuery(e.target.value)}
                      onKeyDown={handleCityKeyDown}
                      placeholder="type a city…"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1.5px solid rgba(255,255,255,0.3)',
                        color: '#fff',
                        fontFamily: "'Inter', sans-serif",
                        textAlign: 'center',
                        outline: 'none',
                        width: '100%',
                        padding: '5px 2px',
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    />
                    {citySuggestions.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginTop: 4,
                        background: 'rgba(18,18,36,0.97)',
                        border: `1px solid ${MICA_ORANGE}`,
                        borderRadius: 10,
                        overflow: 'hidden',
                        zIndex: 50,
                        minWidth: 160,
                        backdropFilter: 'blur(16px)',
                      }}>
                        {citySuggestions.map((city) => (
                          <div
                            key={city}
                            onClick={() => handleCitySelect(city)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleCitySelect(city)}
                            style={{
                              padding: '8px 14px',
                              color: '#fff',
                              fontSize: 12,
                              fontWeight: 500,
                              cursor: 'pointer',
                              fontFamily: "'Inter', sans-serif",
                              borderBottom: '1px solid rgba(255,255,255,0.06)',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,122,0,0.2)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            {city}
                          </div>
                        ))}
                      </div>
                    )}
                    <div
                      onClick={() => { setCityInputMode(false); setCityQuery(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && (setCityInputMode(false), setCityQuery(''))}
                      role="button"
                      tabIndex={0}
                      style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', marginTop: 6 }}
                    >
                      ← back
                    </div>
                  </div>
                )}

                {isActive && node.inputType === 'choice' && node.id !== 'location' && node.choices && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6, justifyContent: 'center' }}>
                    {node.choices.map((choice) => (
                      <button
                        key={choice}
                        type="button"
                        onClick={() => onChoice(node.id, choice)}
                        style={{
                          padding: '7px 16px',
                          borderRadius: 20,
                          border: `1.5px solid ${currentValue === choice ? MICA_ORANGE : 'rgba(255,255,255,0.35)'}`,
                          background: currentValue === choice ? MICA_ORANGE : 'transparent',
                          color: '#fff',
                          fontFamily: "'Inter', sans-serif",
                          fontSize: 11,
                          cursor: 'pointer',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            </div>
          </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DoodleNode;
