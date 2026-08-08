import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const initialOf = (user) => {
    const source = (user?.name || user?.email || '').trim();
    return source ? source.charAt(0).toUpperCase() : 'U';
};

const Avatar = ({ user, size }) => (
    <span
        className="grid shrink-0 place-items-center rounded-full bg-accent font-semibold text-on-accent ring-1 ring-black/5"
        style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
        aria-hidden="true"
    >
        {initialOf(user)}
    </span>
);

const ChevronIcon = ({ open }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`h-3 w-3 transition-transform duration-150 ${open ? '-rotate-180' : ''}`}
        aria-hidden="true"
    >
        <path d="M6 9l6 6 6-6" />
    </svg>
);

const KeyIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden="true"
    >
        <rect x="4" y="10" width="16" height="10" rx="2.5" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        <circle cx="12" cy="15" r="1.4" />
    </svg>
);

const LogoutIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden="true"
    >
        <path d="M15 17l5-5-5-5" />
        <path d="M20 12H9" />
        <path d="M12 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" />
    </svg>
);

const ITEM_CLASS =
    'flex w-full items-center gap-2.5 h-9 px-2 rounded-[8px] text-[13px] text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink focus:outline-none focus-visible:bg-surface-raised focus-visible:text-ink';

/**
 * Account menu for the app chrome: avatar trigger with a dropdown holding identity and account actions.
 * Closes on outside click, Escape and item activation; arrow keys move between items.
 */
const UserMenu = ({ user, onLogout }) => {
    const [open, setOpen] = useState(false);
    const [shown, setShown] = useState(false);
    const rootRef = useRef(null);
    const triggerRef = useRef(null);
    const itemsRef = useRef([]);

    useEffect(() => {
        if (!open) return;

        const handlePointerDown = (e) => {
            if (!rootRef.current?.contains(e.target)) setOpen(false);
        };
        const handleKeyDown = (e) => {
            if (e.key !== 'Escape') return;
            setOpen(false);
            triggerRef.current?.focus();
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    // Animate in on the frame after mount so the transition has a starting state to move from.
    useEffect(() => {
        if (!open) {
            setShown(false);
            return;
        }
        const frame = requestAnimationFrame(() => setShown(true));
        return () => cancelAnimationFrame(frame);
    }, [open]);

    const handleTriggerKeyDown = (e) => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        e.preventDefault();
        setOpen(true);
        // The items only exist after the panel renders, so focus on the next frame.
        requestAnimationFrame(() => {
            const items = itemsRef.current.filter(Boolean);
            const target = e.key === 'ArrowDown' ? items[0] : items[items.length - 1];
            target?.focus();
        });
    };

    const handleMenuKeyDown = (e) => {
        if (e.key === 'Tab') {
            setOpen(false);
            return;
        }
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;

        e.preventDefault();
        const items = itemsRef.current.filter(Boolean);
        if (!items.length) return;
        const current = items.indexOf(document.activeElement);
        const step = e.key === 'ArrowDown' ? 1 : -1;
        items[(current + step + items.length) % items.length]?.focus();
    };

    const registerItem = (index) => (node) => {
        itemsRef.current[index] = node;
    };

    const name = user?.name || 'Your account';

    return (
        <div className="relative" ref={rootRef}>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                onKeyDown={handleTriggerKeyDown}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="Account menu"
                className={`flex h-9 items-center gap-2 rounded-full border pl-0.5 pr-1.5 sm:pr-2.5 transition-colors ${
                    open
                        ? 'border-hairline bg-surface-raised'
                        : 'border-transparent hover:border-hairline hover:bg-surface-raised'
                }`}
            >
                <Avatar user={user} size={28} />
                <span className="hidden max-w-[130px] truncate text-[12.5px] font-medium text-ink sm:block">
                    {name}
                </span>
                <span className="hidden text-ink-faint sm:block">
                    <ChevronIcon open={open} />
                </span>
            </button>

            {open && (
                <div
                    role="menu"
                    aria-label="Account"
                    onKeyDown={handleMenuKeyDown}
                    className={`absolute right-0 top-[calc(100%+8px)] z-50 w-[248px] origin-top-right rounded-[12px] border border-hairline bg-surface p-1.5 transition-[opacity,transform] duration-150 ${
                        shown ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                    }`}
                    style={{ boxShadow: 'var(--shadow-soft)' }}
                >
                    <div className="flex items-center gap-2.5 px-2 py-2">
                        <Avatar user={user} size={36} />
                        <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-ink">{name}</p>
                            {user?.email && (
                                <p className="truncate text-[11.5px] text-ink-faint">{user.email}</p>
                            )}
                        </div>
                    </div>

                    <div className="my-1 h-px bg-hairline" />

                    <Link
                        ref={registerItem(0)}
                        to="/change-password"
                        role="menuitem"
                        onClick={() => setOpen(false)}
                        className={ITEM_CLASS}
                    >
                        <span className="text-ink-faint">
                            <KeyIcon />
                        </span>
                        Change password
                    </Link>

                    <button
                        ref={registerItem(1)}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            setOpen(false);
                            onLogout();
                        }}
                        className={`${ITEM_CLASS} hover:text-danger focus-visible:text-danger`}
                    >
                        <span className="text-ink-faint">
                            <LogoutIcon />
                        </span>
                        Log out
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
