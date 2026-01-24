'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface DocumentViewerProps {
    imageUrl: string;
    highlightBounds?: {
        minY: number;
        maxY: number;
    };
    pageHeight?: number;
}

export function DocumentViewer({ imageUrl, highlightBounds, pageHeight = 1000 }: DocumentViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Zoom controls
    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
    const handleZoomFit = () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    };

    // Mouse/touch drag for panning
    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoom > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            });
        }
    }, [isDragging, dragStart]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // Scroll to highlighted row when bounds change
    useEffect(() => {
        if (highlightBounds && containerRef.current && imageLoaded) {
            const scrollRatio = highlightBounds.minY / pageHeight;
            const containerHeight = containerRef.current.clientHeight;
            const scrollTarget = scrollRatio * containerHeight * zoom - containerHeight / 4;

            containerRef.current.scrollTop = Math.max(0, scrollTarget);
        }
    }, [highlightBounds, pageHeight, zoom, imageLoaded]);

    // Calculate highlight overlay position
    const getHighlightStyle = () => {
        if (!highlightBounds || !pageHeight) return null;

        const topPercent = (highlightBounds.minY / pageHeight) * 100;
        const heightPercent = ((highlightBounds.maxY - highlightBounds.minY) / pageHeight) * 100;

        return {
            top: `${topPercent}%`,
            height: `${Math.max(heightPercent, 3)}%`,
        };
    };

    const highlightStyle = getHighlightStyle();

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-xl h-full flex flex-col">
            {/* Header with zoom controls */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Document Preview</h3>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleZoomOut}
                        className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition"
                        title="Zoom out"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                    </button>
                    <span className="text-xs text-gray-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <button
                        onClick={handleZoomIn}
                        className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition"
                        title="Zoom in"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                    <button
                        onClick={handleZoomFit}
                        className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition ml-1"
                        title="Fit to view"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Image container */}
            <div
                ref={containerRef}
                className="flex-1 overflow-auto relative bg-gray-100"
                onMouseDown={handleMouseDown}
                style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
            >
                {imageError ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                            <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm">Failed to load image</p>
                        </div>
                    </div>
                ) : (
                    <div
                        className="relative min-h-full"
                        style={{
                            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                            transformOrigin: 'top left',
                        }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imageUrl}
                            alt="Scanned register document"
                            className="w-full h-auto"
                            onLoad={() => setImageLoaded(true)}
                            onError={() => setImageError(true)}
                            draggable={false}
                        />

                        {/* Row highlight overlay */}
                        {highlightStyle && imageLoaded && (
                            <div
                                className="absolute left-0 right-0 bg-yellow-400/30 border-y-2 border-yellow-500 pointer-events-none transition-all duration-300"
                                style={highlightStyle}
                            >
                                <div className="absolute -left-1 top-0 bottom-0 w-1 bg-yellow-500" />
                            </div>
                        )}
                    </div>
                )}

                {/* Loading indicator */}
                {!imageLoaded && !imageError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                        <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-black rounded-full" />
                    </div>
                )}
            </div>

            {/* Footer info */}
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-500">
                    {highlightBounds ? (
                        <span className="flex items-center gap-1">
                            <span className="inline-block w-3 h-3 bg-yellow-400/50 border border-yellow-500 rounded-sm" />
                            Current row highlighted
                        </span>
                    ) : (
                        <span>Scroll to view document</span>
                    )}
                </p>
            </div>
        </div>
    );
}
