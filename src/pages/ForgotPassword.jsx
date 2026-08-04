import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';
import AuthSplitShell from '../components/brand/AuthSplitShell';

const fieldClass =
    'w-full h-11 px-3.5 rounded-[8px] border border-hairline bg-paper/80 text-ink text-[14px] placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent focus:bg-surface transition-[box-shadow,background-color]';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setError('');
        setMessage('');
        try {
            const res = await authApi.forgotPassword(email.trim());
            setMessage(res.data || 'If an account exists for that email, we sent a reset link.');
            setStatus('success');
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Something went wrong');
            setStatus('idle');
        }
    };

    return (
        <AuthSplitShell
            headline="We’ll get you back to the canvas."
            support="A calm reset — one email, one link, then your boards are waiting."
            beats={['Secure link', 'Expires in 1 hour', 'Same open canvas']}
        >
            <h1 className="font-display text-[28px] font-semibold tracking-tight mb-1.5">Forgot password</h1>
            <p className="text-[14px] text-ink-muted mb-8">
                Enter the email on your account and we&apos;ll send a reset link.
            </p>

            {status === 'success' ? (
                <div className="space-y-6">
                    <div className="rounded-[10px] border border-accent/25 bg-accent-soft/60 p-4">
                        <div className="flex items-start gap-3">
                            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
                                    <path d="M20 6L9 17l-5-5" />
                                </svg>
                            </span>
                            <div>
                                <p className="text-[14px] font-medium text-ink leading-snug">Check your inbox</p>
                                <p className="text-[13px] text-ink-muted mt-1.5 leading-relaxed">{message}</p>
                                <p className="text-[12px] text-ink-faint mt-2">Look in spam too — the link expires in one hour.</p>
                            </div>
                        </div>
                    </div>
                    <Link
                        to="/login"
                        className="inline-flex w-full h-11 items-center justify-center rounded-[8px] bg-ink text-surface text-[14px] font-medium hover:bg-ink/90"
                    >
                        Back to log in
                    </Link>
                </div>
            ) : (
                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-1.5">
                        <label htmlFor="forgot-email" className="block text-[13px] font-medium text-ink">
                            Email
                        </label>
                        <input
                            id="forgot-email"
                            type="email"
                            required
                            autoComplete="email"
                            className={fieldClass}
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                        {status === 'loading' ? 'Sending…' : 'Send reset link'}
                    </button>
                </form>
            )}

            <p className="mt-8 text-[13px] text-ink-muted">
                Remembered it?{' '}
                <Link to="/login" className="text-accent hover:text-accent-hover font-medium">
                    Log in
                </Link>
            </p>
        </AuthSplitShell>
    );
};

export default ForgotPassword;
