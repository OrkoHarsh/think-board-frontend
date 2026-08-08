import { useEffect, useMemo, useRef, useState } from 'react';
import { templateApi } from '../../services/api';
import BoardThumbnail from './BoardThumbnail';

const CATEGORY_LABELS = {
    planning: 'Planning',
    collaboration: 'Collaboration',
    engineering: 'Engineering',
};

// Chip order is fixed so the filter bar never reshuffles between loads.
const CATEGORY_ORDER = ['planning', 'collaboration', 'engineering'];

const BLANK_OPTION = {
    slug: '',
    name: 'Blank board',
    description: 'Start from an empty canvas.',
    objects: [],
};

const DEFAULT_TITLE = 'Untitled board';
const ALL = 'all';

const CheckBadge = () => (
    <span className="absolute top-2 right-2 grid h-6 w-6 place-items-center rounded-full bg-accent text-white shadow-sm">
        <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
            <path
                d="M4.5 10.5l3.5 3.5 7.5-8"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    </span>
);

const TemplateCard = ({ option, isSelected, disabled, onSelect }) => {
    const count = option.objects?.length || 0;

    return (
        <button
            type="button"
            onClick={() => onSelect(option)}
            disabled={disabled}
            aria-pressed={isSelected}
            className={`group flex flex-col overflow-hidden rounded-[12px] border bg-surface text-left transition-all disabled:opacity-60 ${
                isSelected
                    ? 'border-accent ring-2 ring-accent/30'
                    : 'border-hairline hover:border-accent/40 hover:shadow-sm'
            }`}
        >
            <span className="relative block aspect-[16/10] border-b border-hairline">
                <BoardThumbnail objects={option.objects} size="tile" />
                {isSelected && <CheckBadge />}
            </span>
            <span className="flex flex-1 flex-col px-3 py-2.5">
                <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[13px] font-medium text-ink">{option.name}</span>
                    {count > 0 && (
                        <span className="shrink-0 text-[11px] tabular-nums text-ink-faint">
                            {count} items
                        </span>
                    )}
                </span>
                <span className="mt-0.5 line-clamp-2 min-h-[32px] text-[12px] leading-[1.35] text-ink-faint">
                    {option.description}
                </span>
            </span>
        </button>
    );
};

/**
 * Board creation entry point: pick a starter template (or Blank) and name the board.
 * Creation is a single request, so the board arrives already populated.
 */
const TemplatePickerModal = ({ onCreate, onClose }) => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [selectedSlug, setSelectedSlug] = useState('');
    const [category, setCategory] = useState(ALL);
    const [title, setTitle] = useState(DEFAULT_TITLE);
    const [titleEdited, setTitleEdited] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const titleRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const res = await templateApi.list();
                if (!cancelled) setTemplates(res.data || []);
            } catch {
                // A template outage should never block board creation.
                if (!cancelled) setLoadError('Templates could not be loaded — you can still start blank.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        titleRef.current?.focus();
        titleRef.current?.select();
    }, []);

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape' && !submitting) onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose, submitting]);

    const chips = useMemo(() => {
        const counts = new Map();
        for (const template of templates) {
            const key = template.category || 'other';
            counts.set(key, (counts.get(key) || 0) + 1);
        }
        const known = CATEGORY_ORDER.filter((key) => counts.has(key));
        const extra = [...counts.keys()].filter((key) => !CATEGORY_ORDER.includes(key));
        return [...known, ...extra].map((key) => ({
            key,
            label: CATEGORY_LABELS[key] || key,
            count: counts.get(key),
        }));
    }, [templates]);

    const visible = useMemo(
        () =>
            category === ALL
                ? templates
                : templates.filter((template) => (template.category || 'other') === category),
        [templates, category]
    );

    const selectedName = useMemo(
        () => templates.find((template) => template.slug === selectedSlug)?.name || BLANK_OPTION.name,
        [templates, selectedSlug]
    );

    const handleSelect = (option) => {
        setSelectedSlug(option.slug);
        // Follow the picked template unless the user has named the board themselves.
        if (!titleEdited) setTitle(option.slug ? option.name : DEFAULT_TITLE);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmed = title.trim();
        if (!trimmed || submitting) return;

        setSubmitting(true);
        setSubmitError(null);

        const created = await onCreate(trimmed, selectedSlug || null);
        if (!created) {
            setSubmitError('Could not create the board. Please try again.');
            setSubmitting(false);
        }
    };

    return (
        <>
            <div
                className="fixed inset-0 z-40 bg-black/40"
                onClick={() => !submitting && onClose()}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <form
                    onSubmit={handleSubmit}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="template-picker-title"
                    className="pointer-events-auto flex max-h-[88vh] w-full max-w-5xl flex-col rounded-[14px] border border-hairline bg-paper"
                    style={{ boxShadow: 'var(--shadow-soft)' }}
                >
                    <div className="px-6 pt-5 pb-3">
                        <p
                            id="template-picker-title"
                            className="font-display text-[18px] font-semibold tracking-tight text-ink"
                        >
                            New board
                        </p>
                        <p className="mt-0.5 text-[12.5px] text-ink-faint">
                            Start blank, or pick a template to get a head start.
                        </p>
                    </div>

                    {(chips.length > 0 || loading) && (
                        <div className="flex flex-wrap items-center gap-1.5 border-b border-hairline px-6 pb-3">
                            <button
                                type="button"
                                onClick={() => setCategory(ALL)}
                                className={`h-7 rounded-full px-3 text-[12px] font-medium transition-colors ${
                                    category === ALL
                                        ? 'bg-ink text-surface'
                                        : 'text-ink-muted hover:bg-surface-raised'
                                }`}
                            >
                                All
                            </button>
                            {chips.map((chip) => (
                                <button
                                    key={chip.key}
                                    type="button"
                                    onClick={() => setCategory(chip.key)}
                                    className={`h-7 rounded-full px-3 text-[12px] font-medium transition-colors ${
                                        category === chip.key
                                            ? 'bg-ink text-surface'
                                            : 'text-ink-muted hover:bg-surface-raised'
                                    }`}
                                >
                                    {chip.label}
                                    <span className="ml-1.5 tabular-nums opacity-60">{chip.count}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        {loadError && <p className="mb-3 text-[12px] text-ink-muted">{loadError}</p>}

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            <TemplateCard
                                option={BLANK_OPTION}
                                isSelected={selectedSlug === ''}
                                disabled={submitting}
                                onSelect={handleSelect}
                            />

                            {loading
                                ? [0, 1, 2, 3, 4].map((i) => (
                                      <div
                                          key={i}
                                          className="overflow-hidden rounded-[12px] border border-hairline bg-surface/60"
                                      >
                                          <div className="aspect-[16/10] animate-pulse bg-surface-raised" />
                                          <div className="space-y-2 px-3 py-3">
                                              <div className="h-3 w-1/2 animate-pulse rounded bg-surface-raised" />
                                              <div className="h-3 w-4/5 animate-pulse rounded bg-surface-raised" />
                                          </div>
                                      </div>
                                  ))
                                : visible.map((template) => (
                                      <TemplateCard
                                          key={template.slug}
                                          option={template}
                                          isSelected={selectedSlug === template.slug}
                                          disabled={submitting}
                                          onSelect={handleSelect}
                                      />
                                  ))}
                        </div>
                    </div>

                    <div className="border-t border-hairline px-6 py-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="flex-1">
                                <input
                                    ref={titleRef}
                                    type="text"
                                    value={title}
                                    onChange={(e) => {
                                        setTitle(e.target.value);
                                        setTitleEdited(true);
                                    }}
                                    disabled={submitting}
                                    placeholder="Name your board"
                                    aria-label="Board name"
                                    className="h-10 w-full rounded-[8px] border border-hairline bg-surface px-3 text-[14px] text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
                                />
                                <p className="mt-1.5 text-[11.5px] text-ink-faint">
                                    Starting from <span className="text-ink-muted">{selectedName}</span>
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2 sm:self-start">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={submitting}
                                    className="h-10 rounded-[8px] border border-hairline px-4 text-[13px] text-ink-muted hover:bg-surface-raised disabled:opacity-60"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !title.trim()}
                                    className="h-10 rounded-[8px] bg-ink px-4 text-[13px] font-medium text-surface disabled:opacity-60"
                                >
                                    {submitting ? 'Creating…' : 'Create board'}
                                </button>
                            </div>
                        </div>

                        {submitError && <p className="mt-2 text-[12px] text-danger">{submitError}</p>}
                    </div>
                </form>
            </div>
        </>
    );
};

export default TemplatePickerModal;
