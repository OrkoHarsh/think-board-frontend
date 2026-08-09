import { Link } from 'react-router-dom';
import BrandMark from '../components/brand/BrandMark';
import BoardPreview from '../components/brand/BoardPreview';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-paper text-ink overflow-hidden relative">
            <div className="pointer-events-none absolute inset-0 nimbus-atmosphere" />

            <div className="relative z-10 min-h-screen flex flex-col">
                <main className="flex-1 flex flex-col lg:flex-row items-stretch max-w-6xl mx-auto w-full min-w-0 px-5 sm:px-10 pt-10 sm:pt-16 pb-10 gap-10 sm:gap-12 lg:gap-16 lg:items-center">
                    <div className="flex-1 min-w-0 max-w-xl nimbus-animate-hero">
                        <div className="flex items-center gap-2.5 sm:gap-3 mb-6 sm:mb-8">
                            <BrandMark className="w-10 h-10 sm:w-11 sm:h-11" />
                            <span className="font-display text-3xl sm:text-5xl font-semibold tracking-tight text-ink">
                                ThinkBoard
                            </span>
                        </div>

                        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink leading-[1.2] mb-3 text-balance">
                            Think together on an open canvas
                        </h1>
                        <p className="text-base sm:text-[17px] text-ink-muted leading-relaxed max-w-md mb-8">
                            Calm chrome. Bright canvas. Real-time boards for diagrams, stickies, and AI-assisted structure.
                        </p>

                        <div className="flex flex-wrap items-center gap-3 nimbus-animate-hero-delay">
                            <Link
                                to="/signup"
                                className="inline-flex items-center justify-center h-11 px-5 rounded-[10px] bg-ink text-surface text-[15px] font-medium hover:bg-ink/90 transition-colors"
                            >
                                Get started
                            </Link>
                            <Link
                                to="/login"
                                className="inline-flex items-center justify-center h-11 px-5 rounded-[10px] border border-hairline-strong bg-surface/80 text-ink text-[15px] font-medium hover:bg-surface transition-colors"
                            >
                                Log in
                            </Link>
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <BoardPreview size="hero" />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default LandingPage;
