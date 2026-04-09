import { useState, useCallback, useRef, useEffect } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, Download } from "lucide-react";

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
}

export function ZoomableImage({ src, alt, className = "", containerClassName = "" }: ZoomableImageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const open = useCallback(() => {
    setIsOpen(true);
    setScale(1);
    setPosition({ x: 0, y: 0 });
    document.body.style.overflow = "hidden";
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    document.body.style.overflow = "";
  }, []);

  const zoomIn = useCallback(() => setScale(s => Math.min(s * 1.5, 8)), []);
  const zoomOut = useCallback(() => setScale(s => Math.max(s / 1.5, 0.25)), []);
  const resetZoom = useCallback(() => { setScale(1); setPosition({ x: 0, y: 0 }); }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? 0.85 : 1.18;
    setScale(s => Math.max(0.25, Math.min(8, s * delta)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    posStart.current = { ...position };
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: posStart.current.x + (e.clientX - dragStart.current.x),
      y: posStart.current.y + (e.clientY - dragStart.current.y),
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    posStart.current = { ...position };
  }, [position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    e.preventDefault();
    setPosition({
      x: posStart.current.x + (e.touches[0].clientX - dragStart.current.x),
      y: posStart.current.y + (e.touches[0].clientY - dragStart.current.y),
    });
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "+" || e.key === "=") zoomIn();
      if (e.key === "-") zoomOut();
      if (e.key === "0") resetZoom();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, close, zoomIn, zoomOut, resetZoom]);

  return (
    <>
      <div
        className={`group relative cursor-zoom-in ${containerClassName}`}
        onClick={open}
        data-testid="zoomable-image-trigger"
      >
        <img src={src} alt={alt} className={className} loading="lazy" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <ZoomIn className="w-8 h-8 text-white drop-shadow-lg" />
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex flex-col"
          data-testid="image-lightbox"
        >
          <div className="flex items-center justify-between px-4 py-2 bg-black/80 border-b border-white/10 shrink-0">
            <span className="text-sm text-white/70 font-mono truncate max-w-[50%]">{alt}</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-white/40 font-mono mr-2">{Math.round(scale * 100)}%</span>
              <button onClick={zoomOut} className="p-2 hover:bg-white/10 rounded transition-colors" data-testid="btn-zoom-out">
                <ZoomOut className="w-4 h-4 text-white/80" />
              </button>
              <button onClick={resetZoom} className="p-2 hover:bg-white/10 rounded transition-colors" data-testid="btn-zoom-reset">
                <RotateCcw className="w-4 h-4 text-white/80" />
              </button>
              <button onClick={zoomIn} className="p-2 hover:bg-white/10 rounded transition-colors" data-testid="btn-zoom-in">
                <ZoomIn className="w-4 h-4 text-white/80" />
              </button>
              <a href={src} download className="p-2 hover:bg-white/10 rounded transition-colors" data-testid="btn-download">
                <Download className="w-4 h-4 text-white/80" />
              </a>
              <button onClick={close} className="p-2 hover:bg-white/10 rounded transition-colors ml-2" data-testid="btn-close-lightbox">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          <div
            ref={containerRef}
            className="flex-1 overflow-hidden select-none"
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={src}
                alt={alt}
                className="max-w-none"
                draggable={false}
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transition: isDragging ? "none" : "transform 0.15s ease-out",
                }}
                data-testid="lightbox-image"
              />
            </div>
          </div>

          <div className="px-4 py-1.5 bg-black/80 border-t border-white/10 shrink-0">
            <p className="text-xs text-white/40 text-center">Scroll to zoom • Drag to pan • +/- keys • Esc to close</p>
          </div>
        </div>
      )}
    </>
  );
}
