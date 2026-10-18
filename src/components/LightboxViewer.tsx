import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Info,
  Play,
  Pause,
  Grid,
} from 'lucide-react';
import type { Album } from '../types';
import './LightboxViewer.css';

interface LightboxViewerProps {
  album: Album;
  initialIndex?: number;
  onClose: () => void;
}

export const LightboxViewer: React.FC<LightboxViewerProps> = ({
  album,
  initialIndex = 0,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showCaptions, setShowCaptions] = useState(false);
  const [showFilmstrip, setShowFilmstrip] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 900 : true
  );
  const [isSlideshowRunning, setIsSlideshowRunning] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeThumbRef = useRef<HTMLButtonElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isSwipingRef = useRef(false);
  const lastTouchTimeRef = useRef(0);

  const photographs = useMemo(() => album.photographs || [], [album.photographs]);
  const currentPhoto = photographs[currentIndex] || photographs[0];
  const totalCount = photographs.length;

  // Next photo handler
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalCount);
  }, [totalCount]);

  // Previous photo handler
  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalCount) % totalCount);
  }, [totalCount]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any)?.webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen toggle unavailable:', err);
    }
  }, []);

  // Synchronize fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Lock background scroll when open
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (showFilmstrip && activeThumbRef.current) {
      activeThumbRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [currentIndex, showFilmstrip]);

  // Preload adjacent images for instantaneous transition
  useEffect(() => {
    if (totalCount <= 1) return;
    const nextIdx = (currentIndex + 1) % totalCount;
    const prevIdx = (currentIndex - 1 + totalCount) % totalCount;

    if (photographs[nextIdx]?.src) {
      const imgNext = new Image();
      imgNext.referrerPolicy = 'no-referrer';
      imgNext.src = photographs[nextIdx].src;
    }
    if (photographs[prevIdx]?.src) {
      const imgPrev = new Image();
      imgPrev.referrerPolicy = 'no-referrer';
      imgPrev.src = photographs[prevIdx].src;
    }
  }, [currentIndex, photographs, totalCount]);

  // Slideshow auto-advance timer
  useEffect(() => {
    if (!isSlideshowRunning) return;
    const timer = setInterval(() => {
      goToNext();
    }, 4500);
    return () => clearInterval(timer);
  }, [isSlideshowRunning, goToNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          goToNext();
          break;

        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          goToPrev();
          break;

        case 'Escape':
          e.preventDefault();
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          } else {
            onClose();
          }
          break;

        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;

        case 'w':
        case 'W':
          e.preventDefault();
          setShowCaptions((prev) => !prev);
          break;

        case 's':
        case 'S':
          e.preventDefault();
          setShowFilmstrip((prev) => !prev);
          break;

        case 'Home':
          e.preventDefault();
          setCurrentIndex(0);
          break;

        case 'End':
          e.preventDefault();
          setCurrentIndex(totalCount - 1);
          break;

        case ' ': // Spacebar toggles slideshow
          e.preventDefault();
          setIsSlideshowRunning((prev) => !prev);
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, onClose, toggleFullscreen, totalCount]);

  // Touch gesture handling: distinguish between horizontal swipe and tap
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    isSwipingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = touch.clientY - touchStartRef.current.y;
    if (Math.abs(diffX) > 12 || Math.abs(diffY) > 12) {
      isSwipingRef.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = touch.clientY - touchStartRef.current.y;
    const elapsed = Date.now() - touchStartRef.current.time;
    lastTouchTimeRef.current = Date.now();

    // Swipe left / right navigation
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        goToNext();
      } else {
        goToPrev();
      }
    } else if (!isSwipingRef.current && elapsed < 350) {
      // Single tap: toggle overlay controls
      setShowControls((prev) => !prev);
    }

    touchStartRef.current = null;
    isSwipingRef.current = false;
  };

  // Mouse click on stage or image to toggle controls
  const handleStageClick = () => {
    // Avoid double-firing from simulated touch click events
    if (Date.now() - lastTouchTimeRef.current < 450) return;
    setShowControls((prev) => !prev);
  };

  const formattedIndex = String(currentIndex + 1).padStart(2, '0');
  const formattedTotal = String(totalCount).padStart(2, '0');

  return (
    <div
      ref={containerRef}
      className={`lightbox-portal ${!showControls ? 'controls-hidden' : ''} ${!showFilmstrip ? 'no-filmstrip' : ''} ${isFullscreen ? 'is-fullscreen' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={`${album.title} Gallery Viewer`}
    >
      {/* Main Viewing Stage (Full Viewport) */}
      <div
        className="lightbox-stage"
        onClick={handleStageClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="lightbox-image-container">
          <img
            key={currentPhoto.id}
            src={currentPhoto.src}
            alt={currentPhoto.title || album.title}
            className="lightbox-main-img"
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Previous / Next Arrow Controls */}
        {totalCount > 1 && (
          <>
            <button
              type="button"
              className="lightbox-nav-arrow prev"
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              aria-label="Previous photograph"
              title="Previous photograph (Left Arrow)"
            >
              <ChevronLeft size={26} />
            </button>

            <button
              type="button"
              className="lightbox-nav-arrow next"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              aria-label="Next photograph"
              title="Next photograph (Right Arrow)"
            >
              <ChevronRight size={26} />
            </button>
          </>
        )}

        {/* Floating Caption Panel */}
        {showCaptions && currentPhoto && (
          <div
            className="lightbox-caption-panel"
            onClick={(e) => e.stopPropagation()}
            aria-live="polite"
          >
            <h3 className="lightbox-caption-title">{currentPhoto.title}</h3>
            {currentPhoto.caption && (
              <p className="lightbox-caption-desc">{currentPhoto.caption}</p>
            )}
            <div className="lightbox-caption-meta">
              {currentPhoto.photographer && (
                <span>Photo: {currentPhoto.photographer}</span>
              )}
              {currentPhoto.location && (
                <>
                  <span>•</span>
                  <span>{currentPhoto.location}</span>
                </>
              )}
              {currentPhoto.year && (
                <>
                  <span>•</span>
                  <span>{currentPhoto.year}</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Topbar */}
      <header
        className="lightbox-topbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lightbox-album-info">
          <span className="lightbox-counter">
            {formattedIndex} / {formattedTotal}
          </span>
          <span className="lightbox-album-badge">{album.category}</span>
          <h2 className="lightbox-album-title" title={album.title}>
            {album.title}
          </h2>
        </div>

        <div className="lightbox-top-actions">
          {/* Slideshow button (hidden on compact screens) */}
          <button
            type="button"
            className={`lightbox-action-btn action-slideshow ${isSlideshowRunning ? 'active' : ''}`}
            onClick={() => setIsSlideshowRunning(!isSlideshowRunning)}
            title={isSlideshowRunning ? 'Pause Slideshow (Space)' : 'Play Slideshow (Space)'}
            aria-label={isSlideshowRunning ? 'Pause Slideshow' : 'Play Slideshow'}
          >
            {isSlideshowRunning ? <Pause size={18} /> : <Play size={18} />}
          </button>

          {/* Toggle Caption Details */}
          <button
            type="button"
            className={`lightbox-action-btn action-info ${showCaptions ? 'active' : ''}`}
            onClick={() => setShowCaptions(!showCaptions)}
            title="Toggle Information (W)"
            aria-label="Toggle Details"
          >
            <Info size={18} />
          </button>

          {/* Toggle Filmstrip */}
          {totalCount > 1 && (
            <button
              type="button"
              className={`lightbox-action-btn action-filmstrip ${showFilmstrip ? 'active' : ''}`}
              onClick={() => setShowFilmstrip(!showFilmstrip)}
              title="Toggle Filmstrip (S)"
              aria-label="Toggle Thumbnail Strip"
            >
              <Grid size={18} />
            </button>
          )}

          {/* Fullscreen Toggle (hidden on small mobile where browser UI manages viewport) */}
          <button
            type="button"
            className="lightbox-action-btn action-fullscreen"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Enter Fullscreen (F)'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>

          {/* Close Lightbox */}
          <button
            type="button"
            className="lightbox-action-btn action-close"
            onClick={onClose}
            title="Close Viewer (Esc)"
            aria-label="Close Gallery Viewer"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* Floating Bottom Filmstrip & Desktop Keyboard Hints */}
      <footer
        className="lightbox-bottom-strip"
        onClick={(e) => e.stopPropagation()}
      >
        {showFilmstrip && totalCount > 1 && (
          <div
            className="lightbox-filmstrip-scroll"
            role="tablist"
            aria-label="Photograph Thumbnails"
          >
            {photographs.map((photo, index) => (
              <button
                key={photo.id}
                ref={currentIndex === index ? activeThumbRef : null}
                type="button"
                role="tab"
                aria-selected={currentIndex === index}
                aria-label={`Jump to photograph ${index + 1}: ${photo.title}`}
                className={`filmstrip-thumb-btn ${currentIndex === index ? 'active' : ''}`}
                onClick={() => setCurrentIndex(index)}
              >
                <img
                  src={photo.thumbSrc || photo.src}
                  alt=""
                  className="filmstrip-thumb-img"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
              </button>
            ))}
          </div>
        )}

        {/* Desktop Keyboard Guidance */}
        <div className="lightbox-keyboard-hint">
          <span><span className="kbd-badge">Tap / Click</span> Toggle Overlay</span>
          <span>•</span>
          <span><span className="kbd-badge">←</span><span className="kbd-badge">→</span> Navigate</span>
          <span>•</span>
          <span><span className="kbd-badge">F</span> Fullscreen</span>
          <span>•</span>
          <span><span className="kbd-badge">W</span> Info</span>
          <span>•</span>
          <span><span className="kbd-badge">S</span> Thumbnails</span>
          <span>•</span>
          <span><span className="kbd-badge">Space</span> Slideshow</span>
          <span>•</span>
          <span><span className="kbd-badge">Esc</span> Close</span>
        </div>
      </footer>
    </div>
  );
};

