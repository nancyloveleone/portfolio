import { useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FeaturedAlbums } from './components/FeaturedAlbums';
import { AboutSection } from './components/AboutSection';
import { Footer } from './components/Footer';
import { LightboxViewer } from './components/LightboxViewer';
import type { Album } from './types';
import './App.css';

export function App() {
  const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const handleOpenAlbum = useCallback((album: Album, photoIndex = 0) => {
    setActiveAlbum(album);
    setActivePhotoIndex(photoIndex);
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setActiveAlbum(null);
  }, []);

  const handleExplorePortfolio = useCallback(() => {
    const el = document.getElementById('portfolio');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleLearnMore = useCallback(() => {
    const el = document.getElementById('about');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="portfolio-app-root">
      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main id="main-content">
        <Hero
          onExplorePortfolio={handleExplorePortfolio}
          onLearnMore={handleLearnMore}
        />

        <FeaturedAlbums onOpenAlbum={handleOpenAlbum} />

        <AboutSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Immersive Lightbox Viewer */}
      {activeAlbum && (
        <LightboxViewer
          album={activeAlbum}
          initialIndex={activePhotoIndex}
          onClose={handleCloseLightbox}
        />
      )}
    </div>
  );
}

export default App;

