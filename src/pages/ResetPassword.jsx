import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/api';
import AuthSplitShell from '../components/brand/AuthSplitShell';

const fieldClass =
    'w-full h-11 px-3.5 rounded-[8px] border border-hairline bg-paper/80 text-ink text-[14px] placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent focus:bg-surface transition-[box-shadow,background-color]';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = useMemo(() => searchParams.get('token')?.trim() || '', [searchParams]);

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!token) {
            setError('This reset link is missing a token. Request a new one.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }

        setStatus('loading');
        try {
            const res = await authApi.resetPassword({ token, newPassword: password });
            setMessage(res.data || 'Password updated. You can log in with your new password.');
            setStatus('success');
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Unable to reset password');
            setStatus('idle');
        }
    };

    return (
        <AuthSplitShell
            headline="A fresh key to your workspace."
            support="Set a new password and step back onto the same calm canvas."
            beats={['Encrypted', 'One-time link', 'Boards untouched']}
        >
            <h1 className="font-display text-[28px] font-semibold tracking-tight mb-1.5">Set new password</h1>
            <p className="text-[14px] text-ink-muted mb-8">Choose something you&apos;ll remember — then get back to thinking.</p>

            {!token && status !== 'success' ? (
                <div className="space-y-5">
                    <div className="rounded-[10px] border border-danger/30 bg-danger/5 p-4">
                        <p className="text-[14px] font-medium text-ink">This reset link is invalid</p>
                        <p className="text-[13px] text-ink-muted mt-1">It may be incomplete or already used.</p>
                    </div>
                    <Link
                        to="/forgot-password"
                        className="inline-flex w-full h-11 items-center justify-center rounded-[8px] bg-accent text-on-accent text-[14px] font-medium hover:bg-accent-hover"
                    >
                        Request a new reset link
                    </Link>
                </div>
            ) : status === 'success' ? (
                <div className="space-y-6">
                    <div className="rounded-[10px] border border-accent/25 bg-accent-soft/60 p-4">
                        <div className="flex items-start gap-3">
                            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
                                    <path d="M20 6L9 17l-5-5" />
                                </svg>
                            </span>
                            <div>
                                <p className="text-[14px] font-medium text-ink">Password updated</p>
                                <p className="text-[13px] text-ink-muted mt-1.5 leading-relaxed">{message}</p>
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="w-full h-11 rounded-[8px] bg-ink text-surface text-[14px] font-medium hover:bg-ink/90"
                    >
                        Go to log in
                    </button>
                </div>
            ) : (
                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-1.5">
                        <label htmlFor="reset-password" className="block text-[13px] font-medium text-ink">
                            New password
                        </label>
                        <input
                            id="reset-password"
                            type="password"
                            required
                            minLength={6}
                            autoComplete="new-password"
                            className={fieldClass}
                            placeholder="At least 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="reset-confirm" className="block text-[13px] font-medium text-ink">
                            Confirm password
                        </label>
                        <input
                            id="reset-confirm"
                            type="password"
                            required
                            minLength={6}
                            autoComplete="new-password"
                            className={fieldClass}
                            placeholder="••••••••"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                        />
                    </div>

                    {error && (
                        <p className="text-[13px] text-danger" role="alert">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full h-11 rounded-[8px] bg-ink text-surface text-[14px] font-medium hover:bg-ink/90 disabled:opacity-50 transition-colors"
                    >
                        {status === 'loading' ? 'Updating…' : 'Update password'}
                    </button>
                </form>
            )}
        </AuthSplitShell>
    );
};

export default ResetPassword;
