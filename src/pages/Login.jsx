import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../state/authSlice';
import BrandMark from '../components/brand/BrandMark';
import BoardPreview from '../components/brand/BoardPreview';

const fieldClass =
    'w-full h-11 px-3.5 rounded-[8px] border border-hairline bg-paper/80 text-ink text-[14px] placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent focus:bg-surface transition-[box-shadow,background-color]';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { status, error } = useSelector((state) => state.auth);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await dispatch(login({ email, password }));
        if (login.fulfilled.match(result)) {
            navigate('/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-paper text-ink flex flex-col lg:flex-row">
            <aside className="relative lg:w-[52%] lg:min-h-screen overflow-hidden border-b lg:border-b-0 lg:border-r border-hairline">
                <div className="absolute inset-0 nimbus-atmosphere-aside" />
                <div className="absolute inset-0 nimbus-atmosphere-dots" />

                <div className="relative z-10 flex flex-col h-full min-h-[320px] lg:min-h-screen px-8 sm:px-10 lg:px-12 py-8 lg:py-10">
                    <Link to="/" className="flex items-center gap-2.5 w-fit nimbus-animate-hero">
                        <BrandMark />
                        <span className="font-display text-xl font-semibold tracking-tight">NimbusBoard</span>
                    </Link>

                    <div className="flex-1 flex flex-col justify-center py-10 lg:py-12 max-w-lg">
                        <p className="font-display text-[28px] sm:text-[34px] font-semibold tracking-tight leading-[1.15] text-ink nimbus-animate-hero">
                            Pick up where your team left off.
                        </p>
                        <p className="mt-3 text-[15px] text-ink-muted leading-relaxed max-w-md nimbus-animate-hero-delay">
                            Diagrams, stickies, and live presence — one calm workspace that stays in sync.
                        </p>
                        <div className="mt-8 hidden sm:block">
                            <BoardPreview size="aside" />
                        </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-6 text-[12px] text-ink-faint pb-2">
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                            Real-time sync
                        </span>
                        <span>AI-assisted structure</span>
                        <span>Share in one click</span>
                    </div>
                </div>
            </aside>

            <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-10 bg-surface">
                <div className="w-full max-w-[380px] nimbus-animate-hero">
                    <h1 className="font-display text-[28px] font-semibold tracking-tight mb-1.5">Log in</h1>
                    <p className="text-[14px] text-ink-muted mb-8">Continue to your open canvas.</p>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div className="space-y-1.5">
                            <label htmlFor="login-email" className="block text-[13px] font-medium text-ink">
                                Email
                            </label>
                            <input
                                id="login-email"
                                type="email"
                                required
                                autoComplete="email"
                                className={fieldClass}
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label htmlFor="login-password" className="block text-[13px] font-medium text-ink">
                                    Password
                                </label>
                                <Link
                                    to="/forgot-password"
                                    className="text-[12px] text-accent hover:text-accent-hover font-medium"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <input
                                id="login-password"
                                type="password"
                                required
                                autoComplete="current-password"
                                className={fieldClass}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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
                            {status === 'loading' ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>

                    <p className="mt-8 text-[13px] text-ink-muted">
                        Don&apos;t have an account?{' '}
                        <Link to="/signup" className="text-accent hover:text-accent-hover font-medium">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
