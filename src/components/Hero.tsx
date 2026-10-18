import React from 'react';
import { ArrowDown, Sparkles } from 'lucide-react';
import { siteConfig } from '../data';
import './Hero.css';

interface HeroProps {
  onExplorePortfolio: () => void;
  onLearnMore?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExplorePortfolio, onLearnMore }) => {
  const { hero } = siteConfig;

  return (
    <section className="hero-section" id="home" aria-label="Hero Overview">
      {/* Background Image Container */}
      <div className="hero-background-wrapper" aria-hidden="true">
        <img
          src={hero.backgroundImage}
          alt=""
          className="hero-bg-img"
          loading="eager"
          decoding="async"
        />
        <div className="hero-gradient-overlay" />
        <div className="hero-radial-overlay" />
      </div>

      <div className="container hero-content">
        <div className="hero-inner" style={{ gridTemplateColumns: '1fr', maxWidth: '860px' }}>
          {/* Main Headline & Identity */}
          <div className="hero-text-block">
            <div className="hero-editorial-badge">
              <Sparkles size={13} />
              <span>{hero.badge}</span>
            </div>

            <h1 className="hero-title">{hero.headline}</h1>

            <p className="hero-subheadline">{hero.subheadline}</p>

            <div className="hero-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={onExplorePortfolio}
              >
                <span>{hero.ctaText}</span>
              </button>

              {hero.secondaryCtaText && onLearnMore && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={onLearnMore}
                >
                  <span>{hero.secondaryCtaText}</span>
                </button>
              )}
            </div>

            <button
              type="button"
              className="hero-scroll-indicator"
              onClick={onExplorePortfolio}
              aria-label="Scroll to portfolio albums"
            >
              <div className="scroll-line-animation" />
              <span>Scroll to Photo Albums</span>
              <ArrowDown size={14} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
