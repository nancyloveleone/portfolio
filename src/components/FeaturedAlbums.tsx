import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowRight, Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAlbums, getCategories } from '../data';
import type { Album, AlbumCategory } from '../types';
import './FeaturedAlbums.css';

interface FeaturedAlbumsProps {
  onOpenAlbum: (album: Album, photoIndex?: number) => void;
}

export const FeaturedAlbums: React.FC<FeaturedAlbumsProps> = ({ onOpenAlbum }) => {
  const [selectedCategory, setSelectedCategory] = useState<AlbumCategory>('All');
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const sliderRef = useRef<HTMLDivElement>(null);
  const allAlbums = getAlbums();
  const categories = getCategories();

  const filteredAlbums =
    selectedCategory === 'All'
      ? allAlbums
      : allAlbums.filter((album) => album.category === selectedCategory);

  // Monitor scroll position to show/fade navigation buttons
  const checkScroll = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;

    // If the content fits within view without overflowing, slider controls are not needed
    if (scrollWidth <= clientWidth + 4) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(checkScroll, 200);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [checkScroll, filteredAlbums]);

  const scrollPrev = () => {
    if (!sliderRef.current) return;
    const scrollAmount = sliderRef.current.clientWidth * 0.8;
    sliderRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  };

  const scrollNext = () => {
    if (!sliderRef.current) return;
    const scrollAmount = sliderRef.current.clientWidth * 0.8;
    sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <section className="albums-section" id="portfolio" aria-label="Featured Photography Albums">
      <div className="container">
        {/* Section Header */}
        <div className="albums-header">
          <div>
            <span className="section-tag">Photo Galleries</span>
            <h2 className="section-title">Featured Photoshoot Albums</h2>
            <p className="section-subtitle">
              Browse full photoshoot collections and galleries. Select an album to launch the interactive high-resolution photo viewer.
            </p>
          </div>

          {/* Filter Categories */}
          <ul className="albums-categories" role="tablist" aria-label="Album Categories">
            {categories.map((cat) => (
              <li key={cat}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedCategory === cat}
                  className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCategory(cat);
                    if (sliderRef.current) {
                      sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                    }
                  }}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Slidable Albums Track with Dynamic Appearing / Fading Controls */}
        <div className="albums-slider-wrapper">
          {/* Previous Button (appears when scrolled right, fades at beginning) */}
          <button
            type="button"
            className={`albums-slider-btn prev ${!canScrollLeft ? 'btn-faded' : ''}`}
            onClick={scrollPrev}
            aria-label="Previous albums"
            title="Previous albums"
            tabIndex={canScrollLeft ? 0 : -1}
          >
            <ChevronLeft size={24} />
          </button>

          {/* Scrollable Track */}
          <div
            ref={sliderRef}
            className="albums-slider-track"
            onScroll={checkScroll}
            role="region"
            aria-label="Album collections horizontal slider"
          >
            {filteredAlbums.map((album) => {
              const photoCount = album.photographs?.length || 0;
              return (
                <article
                  key={album.id}
                  className="album-card"
                  onClick={() => onOpenAlbum(album, 0)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOpenAlbum(album, 0);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open album: ${album.title}, ${photoCount} photographs`}
                >
                  <div className="album-image-wrapper">
                    <img
                      src={album.coverImage}
                      alt={album.title}
                      className="album-cover-img"
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />

                    <div className="album-gradient-scrim" />

                    <div className="album-badge-top">
                      <span>{album.category}</span>
                    </div>

                    <div className="album-badge-count">
                      <Camera size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                      <span>{photoCount} Works</span>
                    </div>

                    <div className="album-overlay-info">
                      {(album.year || album.location) && (
                        <div className="album-meta-line">
                          {album.year && <span>{album.year}</span>}
                          {album.year && album.location && <span>•</span>}
                          {album.location && <span>{album.location}</span>}
                        </div>
                      )}

                      <h3 className="album-title">{album.title}</h3>

                      <p className="album-description">{album.description}</p>

                      <span className="album-card-action">
                        <span>View Album</span>
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Next Button (appears when more content ahead, fades at end) */}
          <button
            type="button"
            className={`albums-slider-btn next ${!canScrollRight ? 'btn-faded' : ''}`}
            onClick={scrollNext}
            aria-label="Next albums"
            title="Next albums"
            tabIndex={canScrollRight ? 0 : -1}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </section>
  );
};

