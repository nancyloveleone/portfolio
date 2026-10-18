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
  const [showCaptions, setShowCaptions] = useState(true);
  const [showFilmstrip, setShowFilmstrip] = useState(true);
  const [isSlideshowRunning, setIsSlideshowRunning] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
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

  // Listen to fullscreen changes to keep UI state synchronized
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

  // Prevent background scroll
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  // Preload adjacent images for smooth navigation
  useEffect(() => {
    if (totalCount <= 1) return;
    const nextIdx = (currentIndex + 1) % totalCount;
    const prevIdx = (currentIndex - 1 + totalCount) % totalCount;

    if (photographs[nextIdx]?.src) {
      const imgNext = new Image();
      imgNext.src = photographs[nextIdx].src;
    }
    if (photographs[prevIdx]?.src) {
      const imgPrev = new Image();
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

  // Comprehensive keyboard interaction system
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input or textarea
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

  // Mobile Touch Gestures (Swipe navigation)
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartX;
    const diffY = touch.clientY - touchStartY;

    // Only swipe if horizontal move was greater than vertical move
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX < 0) {
        goToNext(); // Swipe left -> next
      } else {
        goToPrev(); // Swipe right -> prev
      }
    }

    setTouchStartX(null);
    setTouchStartY(null);
  };

  const formattedIndex = String(currentIndex + 1).padStart(2, '0');
  const formattedTotal = String(totalCount).padStart(2, '0');

  return (
    <div
      ref={containerRef}
      className="lightbox-portal"
      role="dialog"
      aria-modal="true"
      aria-label={`${album.title} Gallery Viewer`}
    >
      {/* Top Controls Bar */}
      <div className="lightbox-topbar">
        <div className="lightbox-album-info">
          <span className="lightbox-album-badge">{album.category}</span>
          <h2 className="lightbox-album-title">{album.title}</h2>
          <span className="lightbox-counter">
            {formattedIndex} / {formattedTotal}
          </span>
        </div>

        <div className="lightbox-top-actions">
          {/* Slideshow button */}
          <button
            type="button"
            className={`lightbox-action-btn ${isSlideshowRunning ? 'active' : ''}`}
            onClick={() => setIsSlideshowRunning(!isSlideshowRunning)}
            title={isSlideshowRunning ? 'Pause Slideshow (Space)' : 'Play Slideshow (Space)'}
            aria-label={isSlideshowRunning ? 'Pause Slideshow' : 'Play Slideshow'}
          >
            {isSlideshowRunning ? <Pause size={18} /> : <Play size={18} />}
          </button>

          {/* Toggle Caption Details */}
          <button
            type="button"
            className={`lightbox-action-btn ${showCaptions ? 'active' : ''}`}
            onClick={() => setShowCaptions(!showCaptions)}
            title="Toggle Information (W)"
            aria-label="Toggle Details"
          >
            <Info size={18} />
          </button>

          {/* Toggle Filmstrip */}
          <button
            type="button"
            className={`lightbox-action-btn ${showFilmstrip ? 'active' : ''}`}
            onClick={() => setShowFilmstrip(!showFilmstrip)}
            title="Toggle Filmstrip (S)"
            aria-label="Toggle Thumbnail Strip"
          >
            <Grid size={18} />
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            className="lightbox-action-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Enter Fullscreen (F)'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>

          {/* Close Lightbox */}
          <button
            type="button"
            className="lightbox-action-btn"
            onClick={onClose}
            title="Close Viewer (Esc)"
            aria-label="Close Gallery Viewer"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Viewing Stage */}
      <div
        className="lightbox-stage"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Arrow Previous */}
        {totalCount > 1 && (
          <button
            type="button"
            className="lightbox-nav-arrow prev"
            onClick={goToPrev}
            aria-label="Previous photograph (Left Arrow or A)"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        {/* Central Photograph */}
        <div className="lightbox-image-container">
          <img
            key={currentPhoto.id}
            src={currentPhoto.src}
            alt={currentPhoto.title || album.title}
            className="lightbox-main-img"
            loading="eager"
            decoding="async"
          />
        </div>

        {/* Navigation Arrow Next */}
        {totalCount > 1 && (
          <button
            type="button"
            className="lightbox-nav-arrow next"
            onClick={goToNext}
            aria-label="Next photograph (Right Arrow or D)"
          >
            <ChevronRight size={28} />
          </button>
        )}

        {/* Caption Panel */}
        {showCaptions && currentPhoto && (
          <div className="lightbox-caption-panel" aria-live="polite">
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

      {/* Bottom Filmstrip and Desktop Keyboard Hints */}
      <div className="lightbox-bottom-strip">
        {showFilmstrip && totalCount > 1 && (
          <div className="lightbox-filmstrip-scroll" role="tablist" aria-label="Photograph Thumbnails">
            {photographs.map((photo, index) => (
              <button
                key={photo.id}
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
                />
              </button>
            ))}
          </div>
        )}

        {/* Desktop Keyboard Guidance */}
        <div className="lightbox-keyboard-hint">
          <span><span className="kbd-badge">←</span><span className="kbd-badge">→</span> or <span className="kbd-badge">A</span><span className="kbd-badge">D</span> Navigate</span>
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
      </div>
    </div>
  );
};
