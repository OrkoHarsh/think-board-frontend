const BrandMark = ({ className = 'w-8 h-8' }) => (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="8" className="fill-accent" />
        <path
            d="M8 18.5c0-4.4 3.1-7.5 7.2-7.5 3.3 0 5.9 1.9 6.9 4.7 1.7-.4 3.4.8 3.4 2.7 0 2.1-1.7 3.6-3.9 3.6H11.2C9.3 22 8 20.5 8 18.5z"
            fill="var(--surface)"
            opacity="0.95"
        />
        <circle cx="13.5" cy="12" r="2.2" fill="var(--surface)" opacity="0.7" />
    </svg>
);

export default BrandMark;
