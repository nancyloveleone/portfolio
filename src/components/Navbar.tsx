import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { siteConfig } from '../data';
import './Navbar.css';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobileMenu = () => {
    setIsMobileOpen(false);
  };

  const navItems = [
    { label: 'Portfolio', href: '#portfolio' },
    { label: 'About', href: '#about' },
  ];

  return (
    <>
      <header className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container navbar-container">
          <a href="#" className="brand-link" aria-label={`${siteConfig.modelName} home`}>
            <span className="brand-name">{siteConfig.modelName}</span>
            <span className="brand-sub">{siteConfig.brandSubtitle}</span>
          </a>

          {/* Desktop Navigation */}
          <nav aria-label="Main Navigation">
            <ul className="nav-links-desktop">
              {navItems.map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="nav-item-link">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="nav-actions">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label={isMobileOpen ? 'Close Menu' : 'Open Navigation Menu'}
              aria-expanded={isMobileOpen}
            >
              {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Backdrop */}
      <div
        className={`mobile-drawer-overlay ${isMobileOpen ? 'open' : ''}`}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      {/* Mobile Drawer */}
      <aside className={`mobile-drawer ${isMobileOpen ? 'open' : ''}`} aria-label="Mobile Navigation">
        <div className="mobile-drawer-header">
          <div>
            <div className="brand-name" style={{ fontSize: '1.15rem' }}>{siteConfig.modelName}</div>
            <div className="brand-sub">{siteConfig.locationBase}</div>
          </div>
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={closeMobileMenu}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <ul className="mobile-nav-links">
          {navItems.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className="mobile-nav-link"
                onClick={closeMobileMenu}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
};
