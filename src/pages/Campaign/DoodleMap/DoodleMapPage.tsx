import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import MiCALogo from '../../../components/MiCALogo';
import DoodleCanvas from './DoodleCanvas';
import { MICA_ORANGE, STEP_TOTAL } from './constants';
import type { FormValues } from './types';
import { DEMO_MODE_ENABLED, DEMO_CAMPAIGN } from '../../../data/demoData';

import '../../../App.css';

const DoodleMapPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [visibleNodes, setVisibleNodes] = useState<Set<string>>(new Set(['start']));
  const [drawnEdges, setDrawnEdges] = useState<Set<string>>(new Set());
  const [activeNode, setActiveNode] = useState('start');
  const [step, setStep] = useState(0);
  const [yesNoAnswers, setYesNoAnswers] = useState<Record<string, boolean | null>>({});
  const [values, setValues] = useState<FormValues>({
    name: '', desc: '', audience: '', date: '', budgetAmount: '', location: '', tone: '',
    attachedDocUrl: '', attachedDocName: '',
  });
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const showNode = useCallback((nodeId: string, edgeId?: string) => {
    setVisibleNodes((prev) => new Set([...prev, nodeId]));
    if (edgeId) setDrawnEdges((prev) => new Set([...prev, edgeId]));
    requestAnimationFrame(() => setActiveNode(nodeId));
  }, []);

  const hideNodes = useCallback((nodeIds: string[], edgeIds: string[], valuesToClear: string[]) => {
    setVisibleNodes((prev) => {
      const next = new Set(prev);
      nodeIds.forEach((id) => next.delete(id));
      return next;
    });
    setDrawnEdges((prev) => {
      const next = new Set(prev);
      edgeIds.forEach((id) => next.delete(id));
      return next;
    });
    if (valuesToClear.length > 0) {
      setValues((prev) => {
        const next = { ...prev };
        valuesToClear.forEach((key) => { (next as Record<string, string>)[key] = ''; });
        return next;
      });
    }
  }, []);

  const handleValueChange = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleStart = useCallback(() => {
    if (step !== 0) return;
    showNode('productName', 'e1');
    setStep(1);
  }, [step, showNode]);

  const handleAdvance = useCallback((nodeId: string) => {
    switch (nodeId) {
      case 'productName':
        if (!values.name.trim()) return;
        showNode('whatDoesItDo', 'e2');
        setStep(2);
        break;
      case 'whatDoesItDo':
        if (!values.desc.trim()) return;
        showNode('whoIsItFor', 'e3');
        setStep(3);
        break;
      case 'whoIsItFor':
        if (!values.audience.trim()) return;
        showNode('hasDate', 'e4');
        setStep(4);
        break;
      case 'datePicker':
        if (!values.date) return;
        showNode('hasBudget', 'e6');
        setStep(6);
        break;
      case 'howMuch': {
        const num = Number(values.budgetAmount);
        if (!values.budgetAmount.trim() || isNaN(num) || num < 100 || num > 1000000) return;
        showNode('location', 'e9');
        setStep(8);
        break;
      }
      default:
        break;
    }
  }, [values, showNode]);

  const handleYesNo = useCallback((nodeId: string, answer: boolean) => {
    setYesNoAnswers((prev) => ({ ...prev, [nodeId]: answer }));

    switch (nodeId) {
      case 'hasDate':
        if (answer) {
          hideNodes([], ['e7'], []);
          showNode('datePicker', 'e5');
          setStep(5);
        } else {
          hideNodes(['datePicker'], ['e5', 'e6'], ['date']);
          showNode('hasBudget', 'e7');
          setStep(6);
        }
        break;
      case 'hasBudget':
        if (answer) {
          hideNodes([], ['e10'], []);
          showNode('howMuch', 'e8');
          setStep(7);
        } else {
          hideNodes(['howMuch'], ['e8', 'e9'], ['budgetAmount']);
          showNode('location', 'e10');
          setStep(8);
        }
        break;
      case 'attachDoc':
        showNode('letsGo', 'e13');
        setStep(11);
        break;
      default:
        break;
    }
  }, [showNode, hideNodes]);

  const handleChoice = useCallback((nodeId: string, value: string) => {
    const nodeDef = { location: 'location', tone: 'tone' } as Record<string, string>;
    const valueKey = nodeDef[nodeId];
    if (valueKey) {
      setValues((prev) => ({ ...prev, [valueKey]: value }));
    }

    switch (nodeId) {
      case 'location':
        showNode('tone', 'e11');
        setStep(9);
        break;
      case 'tone':
        showNode('attachDoc', 'e12');
        setStep(10);
        break;
      default:
        break;
    }
  }, [showNode]);

  const handleNodeClick = useCallback((nodeId: string) => {
    if (nodeId !== 'datePicker' && visibleNodes.has('datePicker') && !values.date) {
      hideNodes(['datePicker'], ['e5', 'e6'], []);
      setYesNoAnswers((prev) => ({ ...prev, hasDate: null }));
    }
    if (nodeId !== 'howMuch' && visibleNodes.has('howMuch') && !values.budgetAmount) {
      hideNodes(['howMuch'], ['e8', 'e9'], []);
      setYesNoAnswers((prev) => ({ ...prev, hasBudget: null }));
    }
    setActiveNode(nodeId);
  }, [visibleNodes, values, hideNodes]);

  const handleFinish = useCallback(() => {
    setFinished(true);
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!user?.id) return;
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop() || 'bin';
      const path = `${user.id}/${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage
        .from('product-documents')
        .upload(path, file);
      if (error) {
        console.error('File upload failed:', error);
        setIsUploading(false);
        return;
      }
      setValues((prev) => ({
        ...prev,
        attachedDocUrl: path,
        attachedDocName: file.name,
      }));
      setYesNoAnswers((prev) => ({ ...prev, attachDoc: true }));
      showNode('letsGo', 'e13');
      setStep(11);
    } catch (err) {
      console.error('File upload error:', err);
    } finally {
      setIsUploading(false);
    }
  }, [user, showNode]);

  const handleLaunch = useCallback(async () => {
    if (submitting || !user) return;
    setSubmitting(true);
    setLaunchError(null);

    if (DEMO_MODE_ENABLED()) {
      navigate(`/campaign/${DEMO_CAMPAIGN.id}/tone-preview`);
      setSubmitting(false);
      return;
    }

    if (values.date) {
      const launchDateObj = new Date(values.date);
      launchDateObj.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((launchDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 1) {
        setLaunchError('Launch date must be at least 1 day in the future.');
        setSubmitting(false);
        return;
      }
      if (diffDays > 45) {
        setLaunchError('Launch date must be within 45 days from today.');
        setSubmitting(false);
        return;
      }
    }

    const budgetNum = parseFloat(values.budgetAmount.replace(/[^0-9.]/g, '')) || 0;
    const insertPayload = {
      user_id: user.id,
      product_name: values.name,
      product_description: values.desc,
      product_document_url: values.attachedDocUrl || null,
      target_audience: values.audience,
      launch_date: values.date || null,
      budget: budgetNum,
      location: values.location || null,
      product_links: '',
      tone: values.tone || 'Professional',
      tone_custom_words: null,
      creator_name: user?.user_metadata?.full_name || 'Business Owner',
      status: 'tone_preview',
    };

    try {
      const { data, error } = await supabase.from('campaigns').insert(insertPayload).select().single();
      if (error) throw error;
      if (data?.id) {
        navigate(`/campaign/${data.id}/tone-preview`);
      }
    } catch (err: unknown) {
      console.error('Failed to create campaign:', err);
      setLaunchError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [user, values, navigate, submitting]);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div className="bg-smoke-layer" />

      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(ellipse 60% 55% at 28% 55%, rgba(255,90,0,0.06) 0%, transparent 70%),
          radial-gradient(ellipse 50% 45% at 74% 32%, rgba(100,50,255,0.04) 0%, transparent 70%)
        `,
      }} />

      <div style={{
        position: 'fixed',
        top: 32,
        left: 32,
        zIndex: 100,
        pointerEvents: 'auto',
        fontSize: 22,
        lineHeight: 1.3,
      }}>
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 400,
          color: '#FFFFFF',
        }}>
          crafting{' '}
        </span>
        <span style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontStyle: 'italic',
          fontWeight: 400,
          color: '#FFFFFF',
        }}>
          your strategy.
        </span>
      </div>

      <div style={{
        position: 'fixed',
        top: 24,
        right: 32,
        zIndex: 100,
        pointerEvents: 'auto',
        transform: 'scale(0.35)',
        transformOrigin: 'top right',
      }}>
        <MiCALogo variant="header" />
      </div>

      <div style={{
        position: 'fixed',
        bottom: 26,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 9,
        zIndex: 100,
      }}>
        {Array.from({ length: STEP_TOTAL }, (_, i) => i + 1).map((i) => (
          <div
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: step >= i ? MICA_ORANGE : 'rgba(255,255,255,0.13)',
              transform: step === i ? 'scale(1.45)' : 'scale(1)',
              boxShadow: step === i ? '0 0 10px rgba(255,90,0,0.65)' : 'none',
              transition: 'all 0.4s',
            }}
          />
        ))}
      </div>

      <DoodleCanvas
        visibleNodes={visibleNodes}
        drawnEdges={drawnEdges}
        activeNode={activeNode}
        step={step}
        values={values}
        yesNoAnswers={yesNoAnswers}
        onValueChange={handleValueChange}
        onStart={handleStart}
        onAdvance={handleAdvance}
        onYesNo={handleYesNo}
        onChoice={handleChoice}
        onNodeClick={handleNodeClick}
        onFinish={handleFinish}
        onFileUpload={handleFileUpload}
        isUploading={isUploading}
      />

      <AnimatePresence>
        {finished && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 200,
              background: 'rgba(6,6,14,0.93)',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <motion.div
              initial={{ scale: 0.5, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.15 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontSize: 52, marginBottom: 18 }}>✨</div>
              <div style={{ fontSize: 34, fontWeight: 800, color: '#fff', marginBottom: 6, letterSpacing: '-1px' }}>
                Your campaign is ready.
              </div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', marginBottom: 36 }}>
                MiCA is building your 4-week plan…
              </div>
              <button
                type="button"
                onClick={handleLaunch}
                disabled={submitting}
                style={{
                  padding: '13px 36px',
                  background: MICA_ORANGE,
                  borderRadius: 32,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: submitting ? 'wait' : 'pointer',
                  boxShadow: '0 0 30px rgba(255,90,0,0.45)',
                  border: 'none',
                  fontFamily: "'Inter', sans-serif",
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? 'Creating…' : 'View Campaign →'}
              </button>
              {launchError && (
                <div style={{ fontSize: 13, color: '#ff6666', marginTop: 14, fontWeight: 500 }}>
                  {launchError}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DoodleMapPage;
