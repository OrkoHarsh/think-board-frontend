import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { authApi } from '../services/api';
import { logout } from '../state/authSlice';
import BrandMark from '../components/brand/BrandMark';
import { useTheme } from '../hooks/useTheme';

const fieldClass =
    'w-full h-11 px-3.5 rounded-[8px] border border-hairline bg-surface text-ink text-[14px] placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-[box-shadow,background-color]';

const ChangePassword = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [isDark, toggleTheme] = useTheme();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirm) {
            setError('New passwords do not match.');
            return;
        }
        if (newPassword === currentPassword) {
            setError('New password must be different from the current password.');
            return;
        }

        setStatus('loading');
        try {
            const res = await authApi.changePassword({ currentPassword, newPassword });
            setMessage(res.data || 'Password updated successfully.');
            setStatus('success');
            setCurrentPassword('');
            setNewPassword('');
            setConfirm('');
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Unable to change password');
            setStatus('idle');
        }
    };

    return (
        <div className="min-h-screen bg-paper text-ink relative">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[280px] nimbus-atmosphere-dash" />

            {/* Same workspace chrome as Dashboard */}
            <header className="relative h-14 border-b border-hairline/80 bg-surface/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 sticky top-0 z-20">
                <div className="flex items-center gap-2.5 min-w-0">
                    <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0">
                        <BrandMark className="w-7 h-7" />
                        <span className="font-display text-[15px] font-semibold tracking-tight truncate">
                            NimbusBoard
                        </span>
                    </Link>
                    <span className="hidden sm:inline text-ink-faint text-[13px] mx-0.5">/</span>
                    <span className="hidden sm:inline text-[13px] text-ink-muted font-medium truncate">
                        Account
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="h-8 w-8 rounded-[6px] border border-hairline text-ink-muted hover:bg-surface-raised flex items-center justify-center"
                        title={isDark ? 'Light mode' : 'Dark mode'}
                    >
                        {isDark ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="5" />
                                <line x1="12" y1="1" x2="12" y2="3" />
                                <line x1="12" y1="21" x2="12" y2="23" />
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                <line x1="1" y1="12" x2="3" y2="12" />
                                <line x1="21" y1="12" x2="23" y2="12" />
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </svg>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                        )}
                    </button>
                    <div className="flex items-center gap-2.5 pl-1 border-l border-hairline ml-1">
                        <div className="w-8 h-8 rounded-full bg-accent text-on-accent text-[12px] font-semibold flex items-center justify-center">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="hidden sm:block leading-tight">
                            <p className="text-[12px] font-medium text-ink truncate max-w-[120px]">{user?.name}</p>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="text-[11px] text-ink-faint hover:text-ink-muted"
                            >
                                Log out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="relative max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-10">
                {/* In-app trail */}
                <nav className="flex items-center gap-1.5 text-[13px] text-ink-faint mb-6">
                    <Link to="/dashboard" className="hover:text-ink-muted transition-colors">
                        Workspace
                    </Link>
                    <span aria-hidden="true">/</span>
                    <span className="text-ink-muted font-medium">Change password</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6 lg:gap-8 items-start">
                    {/* Settings panel */}
                    <section
                        className="rounded-[12px] border border-hairline bg-surface overflow-hidden"
                        style={{ boxShadow: 'var(--shadow-soft)' }}
                    >
                        <div className="px-5 sm:px-6 py-5 border-b border-hairline">
                            <h1 className="font-display text-[22px] sm:text-[24px] font-semibold tracking-tight">
                                Change password
                            </h1>
                            <p className="text-[14px] text-ink-muted mt-1.5 leading-relaxed">
                                You&apos;re signed in as{' '}
                                <span className="text-ink font-medium">{user?.email || 'your account'}</span>.
                                This updates how you sign in — your boards stay put.
                            </p>
                        </div>

                        <div className="px-5 sm:px-6 py-6">
                            {status === 'success' && (
                                <div className="mb-6 rounded-[10px] border border-accent/25 bg-accent-soft/70 px-4 py-3.5 flex items-start gap-3">
                                    <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M20 6L9 17l-5-5" />
                                        </svg>
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[14px] font-medium text-ink">Password updated</p>
                                        <p className="text-[13px] text-ink-muted mt-0.5">{message}</p>
                                    </div>
                                </div>
                            )}

                            <form className="space-y-5 max-w-md" onSubmit={handleSubmit}>
                                <div className="space-y-1.5">
                                    <label htmlFor="current-password" className="block text-[13px] font-medium text-ink">
                                        Current password
                                    </label>
                                    <input
                                        id="current-password"
                                        type="password"
                                        required
                                        autoComplete="current-password"
                                        className={fieldClass}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="new-password" className="block text-[13px] font-medium text-ink">
                                        New password
                                    </label>
                                    <input
                                        id="new-password"
                                        type="password"
                                        required
                                        minLength={6}
                                        autoComplete="new-password"
                                        className={fieldClass}
                                        placeholder="At least 6 characters"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="confirm-password" className="block text-[13px] font-medium text-ink">
                                        Confirm new password
                                    </label>
                                    <input
                                        id="confirm-password"
                                        type="password"
                                        required
                                        minLength={6}
                                        autoComplete="new-password"
                                        className={fieldClass}
                                        value={confirm}
                                        onChange={(e) => setConfirm(e.target.value)}
                                    />
                                </div>

                                {error && (
                                    <p className="text-[13px] text-danger" role="alert">
                                        {error}
                                    </p>
                                )}

                                <div className="flex flex-wrap items-center gap-3 pt-1">
                                    <button
                                        type="submit"
                                        disabled={status === 'loading'}
                                        className="h-10 px-5 rounded-[8px] bg-ink text-surface text-[13px] font-medium hover:bg-ink/90 disabled:opacity-50 transition-colors"
                                    >
                                        {status === 'loading' ? 'Saving…' : 'Save password'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/dashboard')}
                                        className="h-10 px-4 rounded-[8px] border border-hairline text-[13px] font-medium text-ink-muted hover:bg-surface-raised transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>

                            {status === 'success' && (
                                <button
                                    type="button"
                                    onClick={() => navigate('/dashboard')}
                                    className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:text-accent-hover"
                                >
                                    Return to workspace
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
                                        <path d="M5 12h14M13 6l6 6-6 6" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </section>

                    {/* Context rail — settings, not marketing */}
                    <aside className="space-y-4 lg:pt-1">
                        <div
                            className="rounded-[12px] border border-hairline bg-surface p-4"
                            style={{ boxShadow: 'var(--shadow-soft)' }}
                        >
                            <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-accent mb-2">
                                Signed in
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-accent text-on-accent text-[14px] font-semibold flex items-center justify-center shrink-0">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[14px] font-medium text-ink truncate">{user?.name}</p>
                                    <p className="text-[12px] text-ink-faint truncate">{user?.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[12px] border border-hairline bg-surface/80 p-4">
                            <p className="text-[13px] font-medium text-ink mb-2">What this does</p>
                            <ul className="space-y-2 text-[12px] text-ink-muted leading-relaxed">
                                <li className="flex gap-2">
                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-accent shrink-0" />
                                    Updates your sign-in password only
                                </li>
                                <li className="flex gap-2">
                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-accent shrink-0" />
                                    Other sessions will need to sign in again
                                </li>
                                <li className="flex gap-2">
                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-accent shrink-0" />
                                    Boards and canvas content are unchanged
                                </li>
                            </ul>
                        </div>

                        <p className="text-[12px] text-ink-faint px-1 leading-relaxed">
                            Can&apos;t remember your current password?{' '}
                            <Link to="/forgot-password" className="text-accent hover:text-accent-hover font-medium">
                                Reset via email
                            </Link>
                            — you&apos;ll leave this session.
                        </p>
                    </aside>
                </div>
            </main>
        </div>
    );
};

export default ChangePassword;
