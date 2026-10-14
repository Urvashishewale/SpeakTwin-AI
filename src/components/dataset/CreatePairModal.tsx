/**
 * SpeakTwin AI — Create / Edit Speech Pair Modal
 * Couples Good Speech with Speech with Identified Errors to form contrastive pedagogical units.
 */

import React, { useState, useEffect } from 'react';
import { X, GitCompare, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DatasetSampleComposite, SpeechPairRecord } from '../../types/dataset';

interface CreatePairModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPairCreated: () => void;
  existingSamples: DatasetSampleComposite[];
}

export const CreatePairModal: React.FC<CreatePairModalProps> = ({
  isOpen,
  onClose,
  onPairCreated,
  existingSamples,
}) => {
  const [pairId, setPairId] = useState('');
  const [goodSampleId, setGoodSampleId] = useState('');
  const [comparisonSampleId, setComparisonSampleId] = useState('');
  const [intendedGoal, setIntendedGoal] = useState('');
  const [referenceTranscript, setReferenceTranscript] = useState('');
  const [actualGoodTranscript, setActualGoodTranscript] = useState('');
  const [actualComparisonTranscript, setActualComparisonTranscript] = useState('');
  const [primaryErrorCategory, setPrimaryErrorCategory] = useState('Grammar Error');
  const [correctedSentence, setCorrectedSentence] = useState('');
  const [annotationNotes, setAnnotationNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const rnd = Math.floor(100 + Math.random() * 900);
    setPairId(`PAIR_${rnd}`);
    setIntendedGoal('Deliver a crisp candidate self-introduction');
    setPrimaryErrorCategory('Grammar Error');
    setErrorMessage(null);

    // Pick defaults from existing samples
    const goodSamples = existingSamples.filter((s) => s.metadata.sample_category === 'Good Speech');
    const badSamples = existingSamples.filter(
      (s) => s.metadata.sample_category === 'Speech with Identified Errors'
    );

    if (goodSamples.length > 0) {
      setGoodSampleId(goodSamples[0].metadata.sample_id);
      setActualGoodTranscript(goodSamples[0].transcript?.verified_transcript || '');
      setReferenceTranscript(goodSamples[0].transcript?.corrected_transcript || '');
      setCorrectedSentence(goodSamples[0].transcript?.corrected_transcript || '');
    }

    if (badSamples.length > 0) {
      setComparisonSampleId(badSamples[0].metadata.sample_id);
      setActualComparisonTranscript(badSamples[0].transcript?.verified_transcript || '');
    }
  }, [isOpen, existingSamples]);

  // When good sample selection changes, update transcript prefill
  const handleGoodSelect = (id: string) => {
    setGoodSampleId(id);
    const found = existingSamples.find((s) => s.metadata.sample_id === id);
    if (found) {
      const text = found.transcript?.verified_transcript || found.transcript?.original_transcript || '';
      setActualGoodTranscript(text);
      if (!referenceTranscript) setReferenceTranscript(text);
      if (!correctedSentence) setCorrectedSentence(text);
    }
  };

  // When comparison sample selection changes
  const handleComparisonSelect = (id: string) => {
    setComparisonSampleId(id);
    const found = existingSamples.find((s) => s.metadata.sample_id === id);
    if (found) {
      setActualComparisonTranscript(
        found.transcript?.verified_transcript || found.transcript?.original_transcript || ''
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairId.trim()) {
      setErrorMessage('Pair ID is required (e.g. PAIR_002).');
      return;
    }
    if (!goodSampleId || !comparisonSampleId) {
      setErrorMessage('Both a Good Speech sample and Comparison Error sample must be selected.');
      return;
    }
    if (goodSampleId === comparisonSampleId) {
      setErrorMessage('Good sample and Comparison sample must be distinct records.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload: SpeechPairRecord = {
        pair_id: pairId.trim(),
        good_sample_id: goodSampleId,
        comparison_sample_id: comparisonSampleId,
        intended_goal: intendedGoal.trim(),
        reference_transcript: referenceTranscript.trim(),
        actual_good_transcript: actualGoodTranscript.trim(),
        actual_comparison_transcript: actualComparisonTranscript.trim(),
        primary_error_category: primaryErrorCategory,
        corrected_sentence: correctedSentence.trim(),
        annotation_notes: annotationNotes.trim(),
        created_date: new Date().toISOString().split('T')[0],
      };

      const res = await fetch('/api/dataset/pairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to create speech pair');
      }

      onPairCreated();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving speech pair');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const goodSamples = existingSamples.filter((s) => s.metadata.sample_category === 'Good Speech');
  const badSamples = existingSamples.filter(
    (s) => s.metadata.sample_category === 'Speech with Identified Errors'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
              <GitCompare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Create Paired Speech Example</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Couple a Good Speech sample with an Erroneous counterpart under one Reference Pair ID
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-950/40 border border-rose-800/80 rounded-md text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Sample Pair ID <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={pairId}
                onChange={(e) => setPairId(e.target.value)}
                placeholder="e.g. PAIR_002"
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Intended Goal / Communication Context
              </label>
              <input
                type="text"
                value={intendedGoal}
                onChange={(e) => setIntendedGoal(e.target.value)}
                placeholder="e.g. Deliver candidate self-introduction"
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Sample Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-emerald-400 mb-1">
                Good Speech Sample ID <span className="text-rose-400">*</span>
              </label>
              <select
                value={goodSampleId}
                onChange={(e) => handleGoodSelect(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                required
              >
                <option value="">Select Good Sample...</option>
                {goodSamples.map((s) => (
                  <option key={s.metadata.sample_id} value={s.metadata.sample_id}>
                    {s.metadata.sample_id} — {s.metadata.sample_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-rose-400 mb-1">
                Comparison (Error) Sample ID <span className="text-rose-400">*</span>
              </label>
              <select
                value={comparisonSampleId}
                onChange={(e) => handleComparisonSelect(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                required
              >
                <option value="">Select Error Sample...</option>
                {badSamples.map((s) => (
                  <option key={s.metadata.sample_id} value={s.metadata.sample_id}>
                    {s.metadata.sample_id} — {s.metadata.sample_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Transcripts Comparison */}
          <div className="space-y-3 bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5">
            <div>
              <label className="block text-xs font-medium text-emerald-400 mb-1">
                Good Speech Spoken Transcript:
              </label>
              <textarea
                rows={2}
                value={actualGoodTranscript}
                onChange={(e) => setActualGoodTranscript(e.target.value)}
                placeholder='e.g. "My name is Urvashi Shewale."'
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-rose-400 mb-1">
                Speech with Grammar / Delivery Error Transcript:
              </label>
              <textarea
                rows={2}
                value={actualComparisonTranscript}
                onChange={(e) => setActualComparisonTranscript(e.target.value)}
                placeholder='e.g. "My name is the Urvashi is Shewale."'
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-cyan-400 mb-1">
                Expected Ground-Truth Correction:
              </label>
              <textarea
                rows={2}
                value={correctedSentence}
                onChange={(e) => setCorrectedSentence(e.target.value)}
                placeholder='e.g. "My name is Urvashi Shewale."'
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Primary Error Category
              </label>
              <select
                value={primaryErrorCategory}
                onChange={(e) => setPrimaryErrorCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Grammar Error">Grammar Error</option>
                <option value="Incorrect Article">Incorrect Article</option>
                <option value="Incorrect Verb Form">Incorrect Verb Form</option>
                <option value="Incorrect Word Order">Incorrect Word Order</option>
                <option value="Unnecessary Word">Unnecessary Word</option>
                <option value="Repeated Word">Repeated Word</option>
                <option value="Filler Word">Filler Word</option>
                <option value="Long Pause">Long Pause</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Pedagogical Annotation Notes
              </label>
              <input
                type="text"
                value={annotationNotes}
                onChange={(e) => setAnnotationNotes(e.target.value)}
                placeholder="Contrastive notes on article insertion and verb duplication"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded transition-colors disabled:opacity-50 shadow-sm"
            >
              {isSubmitting ? 'Creating Pair...' : 'Save Speech Pair'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
