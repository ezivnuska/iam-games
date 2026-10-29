// app/ui/icons.tsx

type IconProps = {
    className?: string
    strokeWidth?: number
}

export function ChevronUpIcon({ className = 'w-5 h-5', strokeWidth = 2 }: IconProps) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={strokeWidth}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
    )
}

export function ChevronDownIcon({ className = 'w-5 h-5', strokeWidth = 2 }: IconProps) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={strokeWidth}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
    )
}

export function ChevronLeftIcon({ className = 'w-5 h-5', strokeWidth = 2 }: IconProps) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={strokeWidth}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
    )
}

export function TrashIcon({ className = 'w-5 h-5', strokeWidth = 2 }: IconProps) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={strokeWidth}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    )
}

export function CloseIcon({ className = 'text-2xl leading-none' }: { className?: string }) {
    return <span className={className}>✕</span>
}
