import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useBoardData } from '../hooks/useBoardData';
import { usePresence, getUserColor } from '../hooks/usePresence';
import { useTheme } from '../hooks/useTheme';
import CanvasStage from '../components/Canvas/CanvasStage';
import Toolbar, { PLACE_TOOLS, STICKY_PASTELS } from '../components/Canvas/Toolbar';
import LineToolPicker from '../components/Canvas/LineToolPicker';
import EmptyBoardCoach from '../components/Canvas/EmptyBoardCoach';
import { umlClassHeight } from '../utils/umlClass';
import AskNimbusModal from '../components/AI/AskNimbusModal';
import IconPalette from '../components/Icons/IconPalette';
import ShareBoardModal from '../components/Share/ShareBoardModal';
import { generateId } from '../utils/helpers';
import { aiApi } from '../services/api';
import { preprocessMermaid } from '../utils/preprocessor';
import { mermaidToBoardObjects } from '../utils/mermaidMapper';
import { classDiagramToBoardObjects } from '../utils/classDiagramMapper';

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

    const { board, status, error, updateObject, addObject, deleteObject, replaceAllObjects, sendCursor, sendRaw } =
        useBoardData(boardId, presenceCallbacks);

    const pastRef = useRef([]);
    const futureRef = useRef([]);
    const objectsSnapshotRef = useRef([]);
    const [historyTick, setHistoryTick] = useState(0);

    useEffect(() => {
        objectsSnapshotRef.current = board?.objects || [];
    }, [board?.objects]);

    const pushHistory = useCallback(() => {
        pastRef.current = [
            ...pastRef.current.slice(-40),
            JSON.parse(JSON.stringify(objectsSnapshotRef.current || [])),
        ];
        futureRef.current = [];
        setHistoryTick((t) => t + 1);
    }, []);

    const handleUndo = useCallback(() => {
        if (!pastRef.current.length) return;
        const prev = pastRef.current.pop();
        futureRef.current.push(JSON.parse(JSON.stringify(objectsSnapshotRef.current || [])));
        replaceAllObjects(prev);
        setHistoryTick((t) => t + 1);
    }, [replaceAllObjects]);

    const handleRedo = useCallback(() => {
        if (!futureRef.current.length) return;
        const next = futureRef.current.pop();
        pastRef.current.push(JSON.parse(JSON.stringify(objectsSnapshotRef.current || [])));
        replaceAllObjects(next);
        setHistoryTick((t) => t + 1);
    }, [replaceAllObjects]);

    const canUndo = historyTick >= 0 && pastRef.current.length > 0;
    const canRedo = historyTick >= 0 && futureRef.current.length > 0;

    const addObjectTracked = useCallback((obj) => {
        pushHistory();
        addObject(obj);
    }, [addObject, pushHistory]);

    const deleteObjectTracked = useCallback((id) => {
        pushHistory();
        deleteObject(id);
    }, [deleteObject, pushHistory]);

    const updateObjectTracked = useCallback((id, updates) => {
        // Snapshot once per style/content edit, not continuous drag coords-only
        const keys = Object.keys(updates || {});
        const isMoveOnly = keys.length > 0 && keys.every((k) => k === 'x' || k === 'y' || k === 'points');
        if (!isMoveOnly) pushHistory();
        updateObject(id, updates);
    }, [updateObject, pushHistory]);

    // Ref to track current objects for immediate access
    const currentObjectsRef = useRef([]);
    useEffect(() => {
        currentObjectsRef.current = board?.objects || [];
    }, [board?.objects]);

    // Clear all objects from the board
    const clearBoard = useCallback(() => {
        const objects = currentObjectsRef.current;
        if (objects.length > 0) {
            console.log(`>>> Clearing ${objects.length} existing objects`);
            objects.forEach(obj => deleteObject(obj.id));
        }
    }, [deleteObject]);

    // Send user.join with name to collaborators (after sendRaw is defined)
    useEffect(() => {
        if (boardId && currentUser?.id && currentUser?.name && sendRaw) {
            sendRaw('user.join', { userId: currentUser.id, name: currentUser.name });
        }
    }, [boardId, currentUser?.id, currentUser?.name, sendRaw]);

    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState(null);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [stageScale, setStageScale] = useState(1);
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [activeTool, setActiveTool] = useState('select');
    const [selectedColor, setSelectedColor] = useState('#FEF3C7');
    const [showIconPalette, setShowIconPalette] = useState(false);
    const [animKey, setAnimKey] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [showLinePicker, setShowLinePicker] = useState(false);
    const [connectorDefaults, setConnectorDefaults] = useState({
        lineStyle: 'solid',
        startMarker: 'none',
        endMarker: 'none',
        strokeWidth: 2,
    });

    // When Line/Arrow tool is chosen, open style picker with sensible defaults
    useEffect(() => {
        if (activeTool === 'line') {
            setConnectorDefaults({
                lineStyle: 'solid',
                startMarker: 'none',
                endMarker: 'none',
                strokeWidth: 2,
            });
            setShowLinePicker(true);
        } else if (activeTool === 'arrow') {
            setConnectorDefaults({
                lineStyle: 'solid',
                startMarker: 'none',
                endMarker: 'arrow',
                strokeWidth: 2,
            });
            setShowLinePicker(true);
        } else {
            setShowLinePicker(false);
        }
    }, [activeTool]);

    // Toggle play/pause for all animations
    const toggleAnimation = useCallback(() => {
        setIsAnimating(prev => {
            if (!prev) {
                // Starting: reset all components to trigger entrance animation
                setAnimKey(k => k + 1);
            }
            return !prev;
        });
    }, []);

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

    const handleExportVideo = async () => {
        if (!canvasRef.current || isRecording) return;
        setIsRecording(true);
        setIsExportOpen(false);

        const stage = canvasRef.current.getStage();
        const layers = stage.getLayers();

        // Create an offscreen canvas matching the stage size
        const width = stage.width();
        const height = stage.height();
        const offscreen = document.createElement('canvas');
        offscreen.width = width;
        offscreen.height = height;
        const ctx = offscreen.getContext('2d');

        // Check supported MIME types
        let mimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm;codecs=vp8';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm';
        }

        const stream = offscreen.captureStream(30);
        const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2500000 });
        const chunks = [];

        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `board-${boardId}-animation.webm`;
            link.click();
            URL.revokeObjectURL(url);
            setIsRecording(false);
            setIsAnimating(false);
        };

        // Trigger animations
        setAnimKey(k => k + 1);
        setIsAnimating(true);

        // Wait for entrance animations to start
        await new Promise(r => setTimeout(r, 300));
        recorder.start();

        // Render frames continuously while recording
        const duration = 8000; // 8 seconds
        const startTime = performance.now();

        const renderFrame = () => {
            const elapsed = performance.now() - startTime;
            if (elapsed >= duration) {
                recorder.stop();
                return;
            }

            // Clear and re-render each Konva layer onto offscreen canvas
            ctx.clearRect(0, 0, width, height);
            layers.forEach(layer => {
                // Get the layer's canvas and draw it
                const layerCanvas = layer.getCanvas()._canvas;
                ctx.drawImage(layerCanvas, 0, 0, width, height);
            });

            // Draw background (grid)
            ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#111827' : '#f9fafb';
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillRect(0, 0, width, height);
            ctx.globalCompositeOperation = 'source-over';

            requestAnimationFrame(renderFrame);
        };

        renderFrame();
    };

    const handleExportGIF = async () => {
        if (!canvasRef.current || isRecording) return;
        setIsRecording(true);
        setIsExportOpen(false);

        const stage = canvasRef.current.getStage();
        const layers = stage.getLayers();

        const width = stage.width();
        const height = stage.height();

        // Keep GIF small — quantization is CPU-heavy in the browser
        const maxSide = 480;
        const scale = Math.min(1, maxSide / Math.max(width, height));
        const gifWidth = Math.max(1, Math.round(width * scale));
        const gifHeight = Math.max(1, Math.round(height * scale));

        const offscreen = document.createElement('canvas');
        offscreen.width = gifWidth;
        offscreen.height = gifHeight;
        const ctx = offscreen.getContext('2d', { willReadFrequently: true });

        setAnimKey((k) => k + 1);
        setIsAnimating(true);

        // Let entrance animations start before capture
        await new Promise((r) => setTimeout(r, 400));

        const duration = 2000;
        const fps = 5;
        const frameDelay = Math.round(1000 / fps);
        const totalFrames = Math.max(1, Math.floor(duration / frameDelay));

        try {
            const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
            const gif = GIFEncoder();
            const startTime = performance.now();

            for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
                // Pace capture to roughly match animation timeline
                const targetTime = startTime + frameIndex * frameDelay;
                const wait = targetTime - performance.now();
                if (wait > 0) {
                    await new Promise((r) => setTimeout(r, wait));
                }

                ctx.clearRect(0, 0, gifWidth, gifHeight);
                ctx.save();
                ctx.scale(scale, scale);
                layers.forEach((layer) => {
                    const layerCanvas = layer.getCanvas()?._canvas;
                    if (layerCanvas) ctx.drawImage(layerCanvas, 0, 0);
                });
                ctx.restore();

                // Background under content
                ctx.globalCompositeOperation = 'destination-over';
                ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#111827' : '#f9fafb';
                ctx.fillRect(0, 0, gifWidth, gifHeight);
                ctx.globalCompositeOperation = 'source-over';

                const { data } = ctx.getImageData(0, 0, gifWidth, gifHeight);
                // Faster format for UI diagrams; 64 colors keeps encode snappy
                const palette = quantize(data, 64, { format: 'rgb444' });
                const index = applyPalette(data, palette, 'rgb444');

                gif.writeFrame(index, gifWidth, gifHeight, {
                    palette,
                    delay: frameDelay,
                    ...(frameIndex === 0 ? { repeat: 0 } : {}),
                });

                // Yield so the UI can update ("Recording...") and remain responsive
                await new Promise((r) => setTimeout(r, 0));
            }

            gif.finish();
            const bytes = gif.bytes();
            const blob = new Blob([bytes], { type: 'image/gif' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `board-${boardId}-animation.gif`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('GIF export error:', err);
            alert('Failed to generate GIF. Try the Video export instead.');
        } finally {
            setIsRecording(false);
            setIsAnimating(false);
        }
    };

    const getCenterPos = useCallback(() => ({
        x: (window.innerWidth / 2 - stagePos.x) / stageScale,
        y: (window.innerHeight / 2 - stagePos.y) / stageScale,
    }), [stagePos.x, stagePos.y, stageScale]);

    const openAI = useCallback(() => {
        setAiError(null);
        setIsAIModalOpen(true);
    }, []);

    /** Build + place an object at world coords; returns id for selection */
    const handlePlaceObject = useCallback(
        (tool, worldX, worldY) => {
            const id = generateId();
            const color = selectedColor;

            if (tool === 'note') {
                const fill =
                    !color || color === 'transparent'
                        ? STICKY_PASTELS[0]
                        : color;
                addObjectTracked({
                    id,
                    type: 'sticky',
                    x: worldX - 75,
                    y: worldY - 75,
                    width: 150,
                    height: 150,
                    text: '',
                    fill,
                    fontFamily: 'Geist Sans, system-ui, sans-serif',
                    fontSize: 16,
                    fontStyle: 'normal',
                    textDecoration: '',
                    align: 'left',
                });
                return id;
            }

            if (tool === 'text') {
                addObjectTracked({
                    id,
                    type: 'text',
                    x: worldX - 100,
                    y: worldY - 25,
                    width: 200,
                    height: 50,
                    text: 'Type here',
                    fill: (!color || color === 'transparent') ? '#0c0f12' : color,
                    fontFamily: 'Geist Sans, system-ui, sans-serif',
                    fontSize: 20,
                    fontStyle: 'normal',
                    textDecoration: '',
                    align: 'center',
                });
                return id;
            }

            if (tool === 'umlClass') {
                const umlWidth = 220;
                const node = {
                    className: 'ClassName',
                    attributes: ['- id: UUID', '- name: String'],
                    methods: ['+ getName(): String'],
                };
                const umlHeight = umlClassHeight(node);
                addObjectTracked({
                    id,
                    type: tool,
                    x: worldX - umlWidth / 2,
                    y: worldY - umlHeight / 2,
                    width: umlWidth,
                    height: umlHeight,
                    fill: (!color || color === 'transparent') ? '#FFFFFF' : color,
                    stroke: '#94A3B8',
                    fontFamily: 'Geist Sans, system-ui, sans-serif',
                    fontSize: 13,
                    ...node,
                });
                return id;
            }

            const width = tool === 'ellipse' ? 160 : 100;
            const height = tool === 'ellipse' ? 90 : 100;
            addObjectTracked({
                id,
                type: tool,
                x: worldX - width / 2,
                y: worldY - height / 2,
                width,
                height,
                fill: (!color || color === 'transparent') ? '#3B82F6' : color,
                fontFamily: 'Geist Sans, system-ui, sans-serif',
                fontSize: 14,
                fontStyle: 'normal',
                textDecoration: '',
                align: 'center',
            });
            return id;
        },
        [addObjectTracked, selectedColor]
    );

    const handleAddNoteAtCenter = useCallback(() => {
        const center = getCenterPos();
        setActiveTool('note');
        handlePlaceObject('note', center.x, center.y);
        setActiveTool('select');
    }, [getCenterPos, handlePlaceObject]);

    const handleAddIcon = useCallback((icon) => {
        const center = getCenterPos();
        addObjectTracked({
            id: generateId(),
            type: 'icon',
            x: center.x - 32,
            y: center.y - 32,
            width: 64,
            height: 64,
            iconKey: icon.key,
            label: icon.label,
        });
    }, [addObjectTracked, getCenterPos]);

    const handleSetActiveTool = useCallback((id) => {
        setActiveTool(id);
        if (id === 'line' || id === 'arrow') setShowLinePicker(true);
        // Prefer sticky pastel when switching to Note
        if (id === 'note' && (!selectedColor || selectedColor === 'transparent' || selectedColor === '#3B82F6')) {
            setSelectedColor(STICKY_PASTELS[0]);
        }
    }, [selectedColor]);

    if (status === 'loading') {
        return <div className="flex items-center justify-center h-screen bg-paper text-ink-faint text-[13px]">Loading board…</div>;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-paper">
                <div className="text-danger mb-4 text-[14px]">{error}</div>
                <button onClick={() => navigate('/dashboard')} className="text-accent hover:text-accent-hover text-[13px] font-medium">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    if (!board) return null;

    const remoteUsers = Object.values(presence).filter((u) => u.userId !== currentUser?.id);
    // Only other users' cursors — drawing our own causes the lagging double-cursor
    const remoteCursors = Object.fromEntries(remoteUsers.map((u) => [u.userId, u]));
    const myInitial = currentUser?.name?.charAt(0)?.toUpperCase() || '?';
    const myColor = getUserColor(currentUser?.id);
    const userRole = board?.currentUserRole;
    const isOwner =
        userRole === 'OWNER' ||
        (board?.ownerId != null && String(board.ownerId) === String(currentUser?.id));
    const canEdit = isOwner || userRole === 'EDIT';
    const isReadOnly = !canEdit;

    return (
        <div
            className="flex flex-col h-screen w-full overflow-hidden bg-canvas text-ink"
            /* 100dvh tracks a mobile browser's collapsing URL bar; h-screen is the fallback. */
            style={{ height: '100dvh' }}
        >
            {/* Top Navigation Bar — recessed chrome */}
            <div className="h-10 shrink-0 border-b border-hairline flex items-center gap-1.5 px-2 sm:px-3 bg-surface/90 z-20">
                {/* Left — back + title + undo */}
                <div className="flex items-center gap-1 min-w-0 shrink">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-1.5 hover:bg-surface-raised rounded-[6px] text-ink-faint hover:text-ink transition-colors shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        title="Back to Dashboard"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                    </button>
                    <h1 className="text-[13px] font-medium text-ink truncate max-w-[88px] md:max-w-[140px] lg:max-w-[200px]">
                        {board.title || 'Untitled Board'}
                    </h1>
                    {!isReadOnly && (
                        <div className="flex items-center gap-0.5 ml-0.5">
                            <button
                                type="button"
                                onClick={handleUndo}
                                disabled={!canUndo}
                                className="h-7 w-7 rounded-[6px] text-ink-muted hover:bg-surface-raised hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                                title="Undo (Ctrl+Z)"
                                aria-label="Undo"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 7v6h6" />
                                    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.36 2.64L3 13" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={handleRedo}
                                disabled={!canRedo}
                                className="h-7 w-7 rounded-[6px] text-ink-muted hover:bg-surface-raised hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                                title="Redo (Ctrl+Y)"
                                aria-label="Redo"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 7v6h-6" />
                                    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6.36 2.64L21 13" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* Right — presence + primary actions */}
                <div className="flex items-center gap-0.5 lg:gap-1 shrink-0 ml-auto">
                    {remoteUsers.length > 0 && (
                        <div className="flex items-center -space-x-1.5 mr-0.5 sm:mr-1">
                            {remoteUsers.slice(0, 5).map((u, idx) => (
                                <div
                                    key={u.userId}
                                    title={u.name}
                                    className={`nimbus-animate-presence w-6 h-6 rounded-full items-center justify-center text-white text-[10px] font-medium ring-2 ring-surface ${
                                        idx >= 3 ? 'hidden sm:flex' : 'flex'
                                    }`}
                                    style={{ backgroundColor: u.color }}
                                >
                                    {u.name.charAt(0).toUpperCase()}
                                </div>
                            ))}
                            {remoteUsers.length > 3 && (
                                <div className="sm:hidden w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium bg-surface-raised text-ink-muted ring-2 ring-surface">
                                    +{remoteUsers.length - 3}
                                </div>
                            )}
                            {remoteUsers.length > 5 && (
                                <div className="hidden sm:flex w-6 h-6 rounded-full items-center justify-center text-[10px] font-medium bg-surface-raised text-ink-muted ring-2 ring-surface">
                                    +{remoteUsers.length - 5}
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={openAI}
                        disabled={isReadOnly}
                        className={`h-7 w-7 lg:w-auto lg:px-2.5 rounded-[6px] text-[12px] font-medium flex items-center justify-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                            isReadOnly
                                ? 'text-ink-faint cursor-not-allowed'
                                : 'text-ink-muted hover:bg-accent-soft hover:text-accent'
                        }`}
                        title="Ask ThinkBoard"
                        aria-label="Ask AI"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                        <span className="hidden lg:inline">Ask AI</span>
                    </button>

                    <button
                        onClick={toggleTheme}
                        className="h-7 w-7 rounded-[6px] text-ink-faint hover:text-ink-muted hover:bg-surface-raised flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        title={isDark ? 'Light mode' : 'Dark mode'}
                    >
                        {isDark ? (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                        )}
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setIsExportOpen((v) => !v)}
                            disabled={isRecording}
                            className={`h-7 w-7 rounded-[6px] text-[12px] flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                                isRecording
                                    ? 'bg-surface-raised text-ink-faint cursor-not-allowed'
                                    : 'text-ink-faint hover:text-ink-muted hover:bg-surface-raised'
                            }`}
                            aria-label="Export"
                            title="Export"
                        >
                            {isRecording ? (
                                <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" opacity="0.25"/>
                                    <path d="M12 2a10 10 0 0 1 10 10" opacity="1"/>
                                </svg>
                            ) : (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                            )}
                        </button>

                        {isExportOpen && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={() => setIsExportOpen(false)} />
                                <div
                                    className="absolute right-0 top-8 z-40 w-52 bg-surface border border-hairline rounded-[8px] p-1.5"
                                    style={{ boxShadow: 'var(--shadow-soft)' }}
                                >
                                    <button
                                        onClick={handleExportPNG}
                                        className="w-full px-3 py-1.5 text-[13px] text-ink hover:bg-surface-raised rounded-[6px] text-left"
                                    >
                                        Download PNG
                                    </button>
                                    <button
                                        onClick={handleExportJSON}
                                        className="w-full px-3 py-1.5 text-[13px] text-ink hover:bg-surface-raised rounded-[6px] text-left"
                                    >
                                        Download JSON
                                    </button>
                                    <div className="border-t border-hairline my-1" />
                                    <button
                                        onClick={handleExportVideo}
                                        className="w-full px-3 py-1.5 text-[13px] text-accent hover:bg-accent-soft rounded-[6px] text-left flex items-center gap-2"
                                    >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="23 7 16 12 23 17 23 7"/>
                                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                                        </svg>
                                        Download Video (8s)
                                    </button>
                                    <button
                                        onClick={handleExportGIF}
                                        className="w-full px-3 py-1.5 text-[13px] text-ink-muted hover:bg-surface-raised rounded-[6px] text-left flex items-center gap-2"
                                    >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
                                            <line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/>
                                            <line x1="2" y1="12" x2="22" y2="12"/>
                                        </svg>
                                        Download GIF (5s)
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setIsShareOpen((v) => !v)}
                            className="h-7 w-7 lg:w-auto lg:px-2.5 bg-accent hover:bg-accent-hover text-on-accent rounded-[6px] text-[12px] font-medium flex items-center justify-center gap-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                            aria-label="Share board"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                            </svg>
                            <span className="hidden lg:inline">Share</span>
                        </button>

                        {isShareOpen && (
                            <ShareBoardModal
                                boardId={boardId}
                                boardTitle={board.title}
                                isOwner={isOwner}
                                onClose={() => setIsShareOpen(false)}
                            />
                        )}
                    </div>

                    <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-medium ring-2 ring-surface ml-0.5"
                        style={{ backgroundColor: myColor }}
                        title={currentUser?.name || 'You'}
                    >
                        {myInitial}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden relative">
                {isReadOnly && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-[6px] border border-hairline bg-surface text-ink-muted text-[12px] font-medium" style={{ boxShadow: 'var(--shadow-soft)' }}>
                        View only — you can&apos;t edit this board
                    </div>
                )}
                <div className="flex-1 bg-canvas relative">
                    {!isReadOnly && (
                    <Toolbar
                        activeTool={activeTool}
                        setActiveTool={handleSetActiveTool}
                        selectedColor={selectedColor}
                        onColorChange={setSelectedColor}
                        showIconPalette={showIconPalette}
                        onToggleIconPalette={() => setShowIconPalette((v) => !v)}
                        onAnimateAll={toggleAnimation}
                        isAnimating={isAnimating}
                        onAskAI={openAI}
                        aiDisabled={isReadOnly}
                    />
                    )}

                    {!isReadOnly && PLACE_TOOLS.includes(activeTool) && (
                        <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-[6px] border border-hairline bg-surface/95 text-[12px] text-ink-muted" style={{ boxShadow: 'var(--shadow-soft)' }}>
                            Click canvas to place
                        </div>
                    )}

                    {!isReadOnly && (
                        <EmptyBoardCoach
                            boardId={boardId}
                            visible={(board.objects || []).length === 0}
                            onAddSticky={handleAddNoteAtCenter}
                            onAskAI={openAI}
                        />
                    )}

                    {!isReadOnly && showLinePicker && (activeTool === 'line' || activeTool === 'arrow') && (
                        <LineToolPicker
                            tool={activeTool}
                            value={connectorDefaults}
                            onChange={(props) => setConnectorDefaults((prev) => ({ ...prev, ...props }))}
                            onClose={() => setShowLinePicker(false)}
                        />
                    )}

                    {!isReadOnly && showIconPalette && (
                        <IconPalette onAddIcon={handleAddIcon} onClose={() => setShowIconPalette(false)} />
                    )}

                    <CanvasStage
                        ref={canvasRef}
                        objects={board.objects || []}
                        onUpdate={isReadOnly ? () => {} : updateObjectTracked}
                        onDelete={isReadOnly ? () => {} : deleteObjectTracked}
                        onAdd={isReadOnly ? () => {} : addObjectTracked}
                        onPlace={isReadOnly ? undefined : handlePlaceObject}
                        onSelect={(id) => id}
                        activeTool={isReadOnly ? 'hand' : activeTool}
                        drawColor={selectedColor}
                        connectorDefaults={connectorDefaults}
                        stageScale={stageScale}
                        stagePos={stagePos}
                        setStageScale={setStageScale}
                        setStagePos={setStagePos}
                        remoteCursors={remoteCursors}
                        onCursorMove={sendCursor}
                        animKey={animKey}
                        isAnimating={isAnimating}
                        onUndo={isReadOnly ? undefined : handleUndo}
                        onRedo={isReadOnly ? undefined : handleRedo}
                        onBeforeMutate={isReadOnly ? undefined : pushHistory}
                    />
                </div>
            </div>

            {isAIModalOpen && (
                <AskNimbusModal
                    isOpen={isAIModalOpen}
                    isLoading={aiLoading}
                    error={aiError}
                    hasExistingObjects={(board.objects || []).length > 0}
                    onClose={() => {
                        if (!aiLoading) {
                            setAiError(null);
                            setIsAIModalOpen(false);
                        }
                    }}
                    onGenerate={async (prompt, requestedType, placement = 'append') => {
                        setAiLoading(true);
                        setAiError(null);
                        try {
                            if (!board?.id) {
                                throw new Error('Board is still loading. Please wait and try again.');
                            }
                            const response = await aiApi.generate(boardId, prompt, requestedType);
                            const mermaid = response.data?.mermaid;
                            if (!mermaid) {
                                throw new Error('AI returned empty diagram');
                            }
                            const center = getCenterPos();
                            const resolvedType = response.data?.diagramType || requestedType || 'HLD';

                            let mappedObjects;
                            if (resolvedType === 'CLASS') {
                                mappedObjects = classDiagramToBoardObjects(mermaid, center.x, center.y);
                            } else if (resolvedType === 'FLOWCHART') {
                                mappedObjects = await mermaidToBoardObjects(mermaid, center.x, center.y);
                            } else {
                                const cleanedMermaid = preprocessMermaid(mermaid);
                                mappedObjects = await mermaidToBoardObjects(cleanedMermaid, center.x, center.y);
                            }

                            if (!mappedObjects.length) {
                                throw new Error('Could not render diagram from AI response. Try a simpler prompt.');
                            }

                            const runId = Date.now().toString(36);
                            const objects = mappedObjects.map((obj) => ({
                                ...obj,
                                id: `ai-${runId}-${obj.id}`,
                            }));

                            pushHistory();
                            if (placement === 'replace') {
                                replaceAllObjects(objects);
                            } else {
                                const existing = currentObjectsRef.current || [];
                                replaceAllObjects([...existing, ...objects]);
                            }
                            setIsAIModalOpen(false);
                            setAnimKey((k) => k + 1);
                        } catch (err) {
                            console.error('AI generation failed:', err);
                            const status = err.response?.status;
                            const message =
                                status === 429
                                    ? (err.response?.data?.message || 'Daily AI limit reached. Try again tomorrow.')
                                    : (err.response?.data?.message ||
                                        err.message ||
                                        'AI generation failed. Please try again.');
                            setAiError(message);
                        } finally {
                            setAiLoading(false);
                        }
                    }}
                />
            )}
        </div>
    );
};

export default BoardPage;
