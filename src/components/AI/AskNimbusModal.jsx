import React, { useState } from 'react';

const AskNimbusModal = ({ isOpen, onClose, onGenerate, isLoading = false, error = null }) => {
    const [prompt, setPrompt] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!prompt.trim() || isLoading) return;
        onGenerate(prompt);
    };

    return (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 p-4">
            <div
                className="bg-surface rounded-[10px] p-5 w-full max-w-md border border-hairline"
                style={{ boxShadow: 'var(--shadow-soft)' }}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-display text-[16px] font-semibold tracking-tight text-ink">
                        Ask NimbusBoard
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

                {error && (
                    <div className="mb-4 rounded-[8px] border border-danger/30 bg-danger/5 px-3 py-2 text-[13px] text-danger">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <textarea
                        className="w-full border border-hairline rounded-[8px] p-3 text-[14px] text-ink bg-paper placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent"
                        rows="4"
                        placeholder="Describe what you want to add to the board…"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={isLoading}
                        autoFocus
                    />

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
                            disabled={isLoading || !prompt.trim()}
                            className="h-9 px-3.5 rounded-[8px] text-[13px] font-medium bg-ink text-surface hover:bg-ink/90 disabled:opacity-50"
                        >
                            {isLoading ? 'Generating…' : 'Generate'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AskNimbusModal;
