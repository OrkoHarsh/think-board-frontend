import { useId } from 'react';

/**
 * ThinkBoard mark: a "T" monogram built out of the product's own vocabulary — two idea nodes on a
 * bar, a stem dropping into the larger node they resolve into.
 *
 * Drawn with theme tokens so the mark inverts with the colour scheme instead of needing a
 * second asset. For a fixed-colour copy (favicon, e-mail, social), see public/thinkboard-mark.svg.
 */
const BrandMark = ({ className = 'w-8 h-8' }) => {
    const gradientId = `${useId()}-brand`;

    return (
        <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="color-mix(in srgb, var(--accent) 88%, #ffffff)" />
                    <stop offset="1" stopColor="color-mix(in srgb, var(--accent) 84%, #000000)" />
                </linearGradient>
            </defs>

            <rect width="32" height="32" rx="8.5" fill={`url(#${gradientId})`} />

            <g stroke="var(--surface)" strokeWidth="2.1" strokeLinecap="round" opacity="0.92">
                <path d="M10.5 11h11" />
                <path d="M16 11v9.2" />
            </g>

            <circle cx="10.5" cy="11" r="2.6" fill="var(--surface)" opacity="0.92" />
            <circle cx="21.5" cy="11" r="2.6" fill="var(--surface)" opacity="0.92" />
            <circle cx="16" cy="20.2" r="3" fill="var(--surface)" />
        </svg>
    );
};

export default BrandMark;
