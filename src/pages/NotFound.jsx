import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-paper px-4 text-ink">
            <p className="font-display text-7xl font-semibold tracking-tight text-accent">404</p>
            <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight">Page not found</h1>
            <p className="mt-2 text-[15px] text-ink-muted max-w-sm text-center">
                That route doesn&apos;t exist in ThinkBoard.
            </p>
            <Link
                to="/"
                className="mt-6 h-10 px-4 inline-flex items-center rounded-[8px] bg-ink text-surface text-[14px] font-medium hover:bg-ink/90"
            >
                Go home
            </Link>
        </div>
    );
};

export default NotFound;
