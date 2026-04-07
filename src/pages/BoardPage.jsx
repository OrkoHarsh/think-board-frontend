import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useBoardData } from '../hooks/useBoardData';
import { usePresence, getUserColor } from '../hooks/usePresence';
import { useTheme } from '../hooks/useTheme';
import CanvasStage from '../components/Canvas/CanvasStage';
import Toolbar from '../components/Canvas/Toolbar';
import AskNimbusModal from '../components/AI/AskNimbusModal';
import IconPalette from '../components/Icons/IconPalette';
import { generateId } from '../utils/helpers';
import { aiApi } from '../services/api';

const BoardPage = () => {
    const { boardId } = useParams();
    const navigate = useNavigate();
    const currentUser = useSelector((state) => state.auth.user);
    const canvasRef = useRef();
    const [isDark, toggleTheme] = useTheme();

    const { presence, addUser, removeUser, updateCursor } = usePresence();

    // Add current user to presence on mount
    useEffect(() => {
        if (currentUser?.id) {
            addUser(currentUser.id, currentUser.name);
        }
    }, [currentUser?.id, currentUser?.name, addUser]);

    const presenceCallbacks = {
        onUserJoin: useCallback((userId, name) => addUser(userId, name), [addUser]),
        onUserLeave: useCallback((userId) => removeUser(userId), [removeUser]),
        onCursorMove: useCallback((userId, x, y) => updateCursor(userId, x, y), [updateCursor]),
    };

    const { board, status, error, updateObject, addObject, deleteObject, sendCursor, sendRaw } =
        useBoardData(boardId, presenceCallbacks);

    // Send user.join with name to collaborators (after sendRaw is defined)
    useEffect(() => {
        if (boardId && currentUser?.id && currentUser?.name && sendRaw) {
            sendRaw('user.join', { userId: currentUser.id, name: currentUser.name });
        }
    }, [boardId, currentUser?.id, currentUser?.name, sendRaw]);

    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [stageScale, setStageScale] = useState(1);
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [activeTool, setActiveTool] = useState('select');
    const [selectedColor, setSelectedColor] = useState('#3B82F6');
    const [showIconPalette, setShowIconPalette] = useState(false);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setShareCopied(true);
            setTimeout(() => setShareCopied(false), 2000);
        });
    };

    const handleExportPNG = () => {
        if (canvasRef.current) {
            const dataUrl = canvasRef.current.exportImage();
            if (dataUrl) {
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `board-${boardId}.png`;
                link.click();
                setIsExportOpen(false);
            }
        }
    };

    const handleExportJSON = () => {
        const data = {
            boardId,
            title: board.title,
            objects: board.objects || [],
            exportedAt: new Date().toISOString(),
        };
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `board-${boardId}.json`;
        link.click();
        URL.revokeObjectURL(url);
        setIsExportOpen(false);
    };

    if (status === 'loading') {
        return <div className="flex items-center justify-center h-screen text-gray-500">Loading Board...</div>;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <div className="text-red-500 mb-4">{error}</div>
                <button onClick={() => navigate('/dashboard')} className="text-indigo-600 hover:text-indigo-500">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    if (!board) return null;

    const getCenterPos = () => ({
        x: (window.innerWidth / 2 - stagePos.x) / stageScale,
        y: (window.innerHeight / 2 - stagePos.y) / stageScale,
    });

    const handleAddShape = (type) => {
        const center = getCenterPos();
        addObject({ id: generateId(), type, x: center.x - 50, y: center.y - 50, width: 100, height: 100, fill: selectedColor });
    };

    const handleAddNote = () => {
        const center = getCenterPos();
        addObject({ id: generateId(), type: 'sticky', x: center.x - 75, y: center.y - 75, text: 'New Idea' });
    };

    const handleAddIcon = (icon) => {
        const center = getCenterPos();
        addObject({ id: generateId(), type: 'icon', x: center.x - 32, y: center.y - 32, width: 64, height: 64, iconKey: icon.key, label: icon.label });
    };

    const handleAddText = () => {
        const center = getCenterPos();
        addObject({ id: generateId(), type: 'text', x: center.x - 100, y: center.y - 25, width: 200, height: 50, text: 'Type here', fill: selectedColor });
    };

    const remoteUsers = Object.values(presence).filter((u) => u.userId !== currentUser?.id);
    const myInitial = currentUser?.name?.charAt(0)?.toUpperCase() || '?';
    const myColor = getUserColor(currentUser?.id);

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-white dark:bg-gray-950">
            {/* Top Navigation Bar */}
            <div className="h-14 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-3 bg-white dark:bg-gray-900 z-20">
                {/* Left — back + title */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 transition-colors"
                        title="Back to Dashboard"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                    </button>
                    <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate max-w-[200px]">
                        {board.title || 'Untitled Board'}
                    </h1>
                </div>

                {/* Right — presence avatars + actions */}
                <div className="flex items-center gap-2">
                    {/* Remote user avatars */}
                    {remoteUsers.length > 0 && (
                        <div className="flex items-center -space-x-1.5 mr-1">
                            {remoteUsers.slice(0, 5).map((u) => (
                                <div
                                    key={u.userId}
                                    title={u.name}
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white shadow-sm ring-1 ring-gray-100"
                                    style={{ backgroundColor: u.color }}
                                >
                                    {u.name.charAt(0).toUpperCase()}
                                </div>
                            ))}
                            {remoteUsers.length > 5 && (
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium bg-gray-200 text-gray-600 border-2 border-white">
                                    +{remoteUsers.length - 5}
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={() => setIsAIModalOpen(true)}
                        className="px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-1.5"
                    >
                        <span>✨</span> Ask ThinkBoard
                    </button>

                    {/* Dark Mode Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-1.5 border border-gray-200 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center"
                        title={isDark ? 'Light mode' : 'Dark mode'}
                    >
                        {isDark ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="5" />
                                <line x1="12" y1="1" x2="12" y2="3" />
                                <line x1="12" y1="21" x2="12" y2="23" />
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                <line x1="1" y1="12" x2="3" y2="12" />
                                <line x1="21" y1="12" x2="23" y2="12" />
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                        )}
                    </button>

                    {/* Export button */}
                    <div className="relative">
                        <button
                            onClick={() => setIsExportOpen((v) => !v)}
                            className="px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-1.5"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Export
                        </button>

                        {isExportOpen && (
                            <>
                                {/* Backdrop */}
                                <div className="fixed inset-0 z-30" onClick={() => setIsExportOpen(false)} />
                                {/* Modal */}
                                <div className="absolute right-0 top-10 z-40 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
                                    <button
                                        onClick={handleExportPNG}
                                        className="w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-left"
                                    >
                                        Download PNG
                                    </button>
                                    <button
                                        onClick={handleExportJSON}
                                        className="w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-left"
                                    >
                                        Download JSON
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Share button */}
                    <div className="relative">
                        <button
                            onClick={() => setIsShareOpen((v) => !v)}
                            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                            </svg>
                            Share
                        </button>

                        {isShareOpen && (
                            <>
                                {/* Backdrop */}
                                <div className="fixed inset-0 z-30" onClick={() => setIsShareOpen(false)} />
                                {/* Modal */}
                                <div className="absolute right-0 top-10 z-40 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-4">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">Share this board</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Anyone with the link can view and edit this board.</p>
                                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 mb-3">
                                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">{window.location.href}</span>
                                    </div>
                                    <button
                                        onClick={handleCopyLink}
                                        className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                                            shareCopied
                                                ? 'bg-green-500 text-white'
                                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                        }`}
                                    >
                                        {shareCopied ? '✓ Link Copied!' : 'Copy Link'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Current user avatar */}
                    <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white ring-1 ring-gray-200 ml-1"
                        style={{ backgroundColor: myColor }}
                        title={currentUser?.name || 'You'}
                    >
                        {myInitial}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden relative">
                <Toolbar
                    activeTool={activeTool}
                    setActiveTool={setActiveTool}
                    onAddShape={handleAddShape}
                    onAddNote={handleAddNote}
                    onAddText={handleAddText}
                    selectedColor={selectedColor}
                    onColorChange={setSelectedColor}
                    showIconPalette={showIconPalette}
                    onToggleIconPalette={() => setShowIconPalette((v) => !v)}
                />

                {showIconPalette && (
                    <IconPalette onAddIcon={handleAddIcon} onClose={() => setShowIconPalette(false)} />
                )}

                <div className="flex-1 bg-gray-50 dark:bg-gray-900 relative">
                    <CanvasStage
                        ref={canvasRef}
                        objects={board.objects || []}
                        onUpdate={updateObject}
                        onDelete={deleteObject}
                        onAdd={addObject}
                        onSelect={(id) => id}
                        activeTool={activeTool}
                        stageScale={stageScale}
                        stagePos={stagePos}
                        setStageScale={setStageScale}
                        setStagePos={setStagePos}
                        remoteCursors={presence}
                        onCursorMove={sendCursor}
                    />
                </div>
            </div>

            {isAIModalOpen && (
                <AskNimbusModal
                    isOpen={isAIModalOpen}
                    onClose={() => setIsAIModalOpen(false)}
                    onGenerate={async (prompt) => {
                        try {
                            const response = await aiApi.generate(boardId, prompt);
                            const { nodes = [] } = response.data;
                            const center = getCenterPos();
                            nodes.forEach((node, i) => {
                                addObject({
                                    id: generateId(),
                                    type: node.type || 'sticky',
                                    x: center.x + (i % 4) * 180,
                                    y: center.y + Math.floor(i / 4) * 180,
                                    text: node.text || node.label || '',
                                    fill: node.fill || '#FEF3C7',
                                    width: node.width || 150,
                                    height: node.height || 150,
                                });
                            });
                        } catch (err) {
                            console.error('AI generation failed:', err);
                            handleAddNote();
                        }
                        setIsAIModalOpen(false);
                    }}
                />
            )}
        </div>
    );
};

export default BoardPage;
