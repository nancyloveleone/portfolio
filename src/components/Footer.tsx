import React from 'react';
import { ArrowUp } from 'lucide-react';
import { siteConfig } from '../data';
import './Footer.css';

const currentYear = new Date().getFullYear();

export const Footer: React.FC = () => {
  const { modelName, brandSubtitle } = siteConfig;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand-block">
            <div className="footer-brand-title">{modelName}</div>
            <p className="footer-brand-desc">
              {brandSubtitle} • Official Photography Portfolio & Photo Albums.
            </p>
          </div>

          <div className="footer-nav-col">
            <span className="footer-col-title">Navigation</span>
            <a href="#portfolio" className="footer-link">Photo Albums</a>
            <a href="#about" className="footer-link">About Nancy</a>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-copyright">
            &copy; {currentYear} {modelName}. All photographs copyright of respective photographers.
          </div>

          <button
            type="button"
            className="back-to-top-btn"
            onClick={scrollToTop}
            aria-label="Scroll to top of page"
          >
            <span>Back to top</span>
            <ArrowUp size={14} />
          </button>
        </div>
      </div>
    </footer>
  );
};

