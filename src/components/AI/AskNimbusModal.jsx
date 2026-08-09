import React, { useState } from 'react';

const DISCLAIMER_KEY = 'nimbus.ai.disclaimerAcceptedAt';
const MAX_PROMPT_LENGTH = 2000;

const DIAGRAM_TYPES = [
    {
        id: 'HLD',
        label: 'Architecture (HLD)',
        hint: 'Clients, gateways, services, caches, databases and queues.',
        placeholder: 'e.g. scalable HLD for a URL shortener',
    },
    {
        id: 'FLOWCHART',
        label: 'Flowchart',
        hint: 'Steps and decisions for a process or user journey.',
        placeholder: 'e.g. user onboarding flow with email verification',
    },
    {
        id: 'CLASS',
        label: 'Class diagram',
        hint: 'UML classes with attributes, methods and relationships.',
        placeholder: 'e.g. class diagram for an e-commerce order system',
    },
];

const hasAcceptedDisclaimer = () => {
    try {
        return Boolean(window.localStorage.getItem(DISCLAIMER_KEY));
    } catch {
        return false;
    }
};

const rememberDisclaimer = () => {
    try {
        window.localStorage.setItem(DISCLAIMER_KEY, new Date().toISOString());
    } catch {
        // Private mode or storage disabled — the disclaimer simply shows again next time.
    }
};

const AskNimbusModal = ({ isOpen, onClose, onGenerate, isLoading = false, error = null }) => {
    const [prompt, setPrompt] = useState('');
    const [diagramType, setDiagramType] = useState('HLD');
    // The parent unmounts this modal when closed, so the disclaimer is re-evaluated on each open.
    const [showDisclaimer, setShowDisclaimer] = useState(() => !hasAcceptedDisclaimer());
    const [dontShowAgain, setDontShowAgain] = useState(false);

    if (!isOpen) return null;

    const activeType = DIAGRAM_TYPES.find((t) => t.id === diagramType) || DIAGRAM_TYPES[0];
    const trimmed = prompt.trim();
    const tooLong = trimmed.length > MAX_PROMPT_LENGTH;

    const acceptDisclaimer = () => {
        if (dontShowAgain) rememberDisclaimer();
        setShowDisclaimer(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!trimmed || tooLong || isLoading) return;
        onGenerate(trimmed, diagramType);
    };

    return (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 p-4">
            <div
                className="bg-surface rounded-[10px] p-4 sm:p-5 w-full max-w-md max-h-[90dvh] overflow-y-auto border border-hairline"
                style={{ boxShadow: 'var(--shadow-soft)' }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="ask-nimbus-title"
            >
                <div className="flex justify-between items-center mb-4">
                    <h3
                        id="ask-nimbus-title"
                        className="font-display text-[16px] font-semibold tracking-tight text-ink"
                    >
                        {showDisclaimer ? 'Before you start' : 'Ask ThinkBoard'}
                    </h3>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-8 h-8 rounded-[6px] text-ink-faint hover:text-ink hover:bg-surface-raised disabled:opacity-50 flex items-center justify-center"
                        aria-label="Close"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {showDisclaimer ? (
                    <div>
                        <p className="text-[13px] text-ink-muted leading-relaxed">
                            Ask ThinkBoard is a diagram generator, not a general assistant. It can draw:
                        </p>
                        <ul className="mt-3 space-y-1.5">
                            {DIAGRAM_TYPES.map((type) => (
                                <li key={type.id} className="flex gap-2 text-[13px] text-ink">
                                    <span className="text-accent mt-[2px]">•</span>
                                    <span>
                                        <span className="font-medium">{type.label}</span>
                                        <span className="text-ink-muted"> — {type.hint}</span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-3 text-[13px] text-ink-muted leading-relaxed">
                            Anything else — general questions, writing, code, or unsafe requests — will be declined.
                            Generated diagrams are a starting point and should be reviewed before you rely on them.
                        </p>

                        <label className="mt-4 flex items-center gap-2 text-[12px] text-ink-muted cursor-pointer">
                            <input
                                type="checkbox"
                                checked={dontShowAgain}
                                onChange={(e) => setDontShowAgain(e.target.checked)}
                                className="accent-accent"
                            />
                            Don&apos;t show this again
                        </label>

                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="h-9 px-3.5 rounded-[8px] text-[13px] font-medium text-ink-muted hover:bg-surface-raised"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={acceptDisclaimer}
                                className="h-9 px-3.5 rounded-[8px] text-[13px] font-medium bg-ink text-surface hover:bg-ink/90"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {error && (
                            <div
                                role="alert"
                                className="mb-4 rounded-[8px] border border-danger/30 bg-danger/5 px-3 py-2 text-[13px] text-danger"
                            >
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <div className="flex gap-1 p-0.5 rounded-[8px] bg-surface-raised border border-hairline">
                                    {DIAGRAM_TYPES.map((type) => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setDiagramType(type.id)}
                                            disabled={isLoading}
                                            aria-pressed={diagramType === type.id}
                                            className={`flex-1 h-8 rounded-[6px] text-[12px] font-medium transition-colors disabled:opacity-50 ${
                                                diagramType === type.id
                                                    ? 'bg-surface text-ink border border-hairline'
                                                    : 'text-ink-muted hover:text-ink'
                                            }`}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                                <p className="mt-1.5 text-[12px] text-ink-faint">{activeType.hint}</p>
                            </div>

                            <textarea
                                className="w-full border border-hairline rounded-[8px] p-3 text-[14px] text-ink bg-paper placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent"
                                rows="4"
                                placeholder={activeType.placeholder}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                disabled={isLoading}
                                autoFocus
                            />

                            <div className="mt-1 flex items-center justify-between text-[12px]">
                                <span className="text-ink-faint">Diagrams only — other requests are declined.</span>
                                <span className={tooLong ? 'text-danger' : 'text-ink-faint'}>
                                    {trimmed.length}/{MAX_PROMPT_LENGTH}
                                </span>
                            </div>

                            <div className="mt-4 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="h-9 px-3.5 rounded-[8px] text-[13px] font-medium text-ink-muted hover:bg-surface-raised disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading || !trimmed || tooLong}
                                    className="h-9 px-3.5 rounded-[8px] text-[13px] font-medium bg-ink text-surface hover:bg-ink/90 disabled:opacity-50"
                                >
                                    {isLoading ? 'Generating…' : 'Generate'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default AskNimbusModal;
