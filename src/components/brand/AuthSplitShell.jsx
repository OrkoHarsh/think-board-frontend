import { Link } from 'react-router-dom';
import BrandMark from './BrandMark';
import BoardPreview from './BoardPreview';

/**
 * Split auth layout — sky atmosphere + product frame on the left, form on the right.
 */
const AuthSplitShell = ({
    brandTo = '/',
    headline,
    support,
    beats = [],
    children,
}) => (
    <div className="min-h-screen bg-paper text-ink flex flex-col lg:flex-row">
        <aside className="relative lg:w-[52%] lg:min-h-screen overflow-hidden border-b lg:border-b-0 lg:border-r border-hairline">
            <div className="absolute inset-0 nimbus-atmosphere-aside" />
            <div className="absolute inset-0 nimbus-atmosphere-dots" />

            <div className="relative z-10 flex flex-col h-full min-h-[280px] lg:min-h-screen px-8 sm:px-10 lg:px-12 py-8 lg:py-10">
                <Link to={brandTo} className="flex items-center gap-2.5 w-fit nimbus-animate-hero">
                    <BrandMark />
                    <span className="font-display text-xl font-semibold tracking-tight">NimbusBoard</span>
                </Link>

                <div className="flex-1 flex flex-col justify-center py-10 lg:py-12 max-w-lg">
                    <p className="font-display text-[28px] sm:text-[34px] font-semibold tracking-tight leading-[1.15] text-ink nimbus-animate-hero">
                        {headline}
                    </p>
                    <p className="mt-3 text-[15px] text-ink-muted leading-relaxed max-w-md nimbus-animate-hero-delay">
                        {support}
                    </p>
                    <div className="mt-8 hidden sm:block">
                        <BoardPreview size="aside" />
                    </div>
                </div>

                {beats.length > 0 && (
                    <div className="hidden lg:flex items-center gap-6 text-[12px] text-ink-faint pb-2">
                        {beats.map((beat, i) =>
                            i === 0 ? (
                                <span key={beat} className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                                    {beat}
                                </span>
                            ) : (
                                <span key={beat}>{beat}</span>
                            )
                        )}
                    </div>
                )}
            </div>
        </aside>

        <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-10 bg-surface">
            <div className="w-full max-w-[380px] nimbus-animate-hero">{children}</div>
        </div>
    </div>
);

export default AuthSplitShell;
