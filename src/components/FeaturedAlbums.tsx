import React, { useState } from 'react';
import { ArrowRight, Camera } from 'lucide-react';
import { getAlbums, getCategories } from '../data';
import type { Album, AlbumCategory } from '../types';
import './FeaturedAlbums.css';

interface FeaturedAlbumsProps {
  onOpenAlbum: (album: Album, photoIndex?: number) => void;
}

export const FeaturedAlbums: React.FC<FeaturedAlbumsProps> = ({ onOpenAlbum }) => {
  const [selectedCategory, setSelectedCategory] = useState<AlbumCategory>('All');
  const allAlbums = getAlbums();
  const categories = getCategories();

  const filteredAlbums =
    selectedCategory === 'All'
      ? allAlbums
      : allAlbums.filter((album) => album.category === selectedCategory);

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
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Albums Grid */}
        <div className="albums-grid">
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
      </div>
    </section>
  );
};
