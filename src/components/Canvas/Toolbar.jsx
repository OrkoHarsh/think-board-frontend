import React from 'react';
import ColorPicker from './ColorPicker';

const Toolbar = ({ activeTool, setActiveTool, onAddShape, onAddNote, onAddText, selectedColor, onColorChange, showIconPalette, onToggleIconPalette }) => {
    const toolSections = [
        {
            label: 'General',
            tools: [
                {
                    id: 'select',
                    label: 'Select (V)',
                    icon: <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />,
                },
                {
                    id: 'hand',
                    label: 'Pan (H)',
                    icon: (
                        <>
                            <path d="M18 11V6a2 2 0 0 0-4 0v5" />
                            <path d="M14 10V4a2 2 0 0 0-4 0v6" />
                            <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
                            <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                        </>
                    ),
                },
            ],
        },
        {
            label: 'Shapes',
            tools: [
                {
                    id: 'rect',
                    label: 'Rectangle',
                    icon: <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />,
                    action: () => onAddShape('rect'),
                },
                {
                    id: 'circle',
                    label: 'Circle',
                    icon: <circle cx="12" cy="12" r="10" />,
                    action: () => onAddShape('circle'),
                },
                {
                    id: 'triangle',
                    label: 'Triangle',
                    icon: <polygon points="12,2 22,22 2,22" />,
                    action: () => onAddShape('triangle'),
                },
                {
                    id: 'diamond',
                    label: 'Diamond',
                    icon: <polygon points="12,2 22,12 12,22 2,12" />,
                    action: () => onAddShape('diamond'),
                },
                {
                    id: 'ellipse',
                    label: 'Ellipse',
                    icon: <ellipse cx="12" cy="12" rx="10" ry="6" />,
                    action: () => onAddShape('ellipse'),
                },
            ],
        },
        {
            label: 'Lines',
            tools: [
                {
                    id: 'line',
                    label: 'Line',
                    icon: <line x1="5" y1="19" x2="19" y2="5" />,
                },
                {
                    id: 'arrow',
                    label: 'Arrow',
                    icon: (
                        <>
                            <line x1="5" y1="19" x2="19" y2="5" />
                            <polyline points="12 5 19 5 19 12" />
                        </>
                    ),
                },
            ],
        },
        {
            label: 'Content',
            tools: [
                {
                    id: 'text',
                    label: 'Text',
                    icon: <path d="M4 7V4h16v3M9 20h6M12 4v16" />,
                    action: () => onAddText(),
                },
                {
                    id: 'note',
                    label: 'Sticky Note',
                    icon: (
                        <>
                            <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
                            <path d="M14 3v4a2 2 0 0 0 2 2h4" />
                        </>
                    ),
                    action: () => onAddNote(),
                },
            ],
        },
        {
            label: 'Drawing',
            tools: [
                {
                    id: 'freehand',
                    label: 'Freehand Pen',
                    icon: <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />,
                },
                {
                    id: 'eraser',
                    label: 'Eraser',
                    icon: (
                        <>
                            <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
                            <path d="M22 21H7" />
                            <path d="m5 11 9 9" />
                        </>
                    ),
                },
            ],
        },
    ];

    return (
        <div className="w-14 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-3 gap-0.5 z-10 overflow-y-auto">
            {toolSections.map((section, sIdx) => (
                <React.Fragment key={section.label}>
                    {sIdx > 0 && (
                        <div className="w-8 border-t border-gray-200 dark:border-gray-700 my-1.5" />
                    )}
                    <div className="text-[9px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">
                        {section.label}
                    </div>
                    {section.tools.map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => {
                                setActiveTool(tool.id);
                                if (tool.action) tool.action();
                            }}
                            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                                activeTool === tool.id
                                    ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                            title={tool.label}
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                {tool.icon}
                            </svg>
                        </button>
                    ))}
                </React.Fragment>
            ))}

            {/* Shape Library toggle */}
            <div className="w-8 border-t border-gray-200 dark:border-gray-700 my-1.5" />
            <div className="text-[9px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">
                Library
            </div>
            <button
                onClick={onToggleIconPalette}
                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                    showIconPalette
                        ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Shape Library"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
            </button>

            {/* Color Picker at bottom */}
            <div className="w-8 border-t border-gray-200 dark:border-gray-700 my-1.5" />
            <div className="text-[9px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">
                Color
            </div>
            <ColorPicker
                selectedColor={selectedColor}
                onChange={onColorChange}
            />
        </div>
    );
};

export default Toolbar;
