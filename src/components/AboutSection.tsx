import React from 'react';
import { Ruler, Globe } from 'lucide-react';
import { siteConfig } from '../data';
import './AboutSection.css';

export const AboutSection: React.FC = () => {
  const { about, agencies, modelName, locationBase } = siteConfig;
  const { measurements } = about;

  return (
    <section className="about-section" id="about" aria-label="About Nancy Leone">
      <div className="container">
        <div className="about-grid">
          {/* Portrait Card */}
          <div className="about-portrait-card">
            <div className="about-portrait-wrapper">
              <img
                src={about.portraitImage}
                alt={`${modelName} portrait`}
                className="about-portrait-img"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="about-portrait-caption">
              <span>Portrait</span>
              <span>{locationBase}</span>
            </div>
          </div>

          {/* Biography & Presentation */}
          <div className="about-text-content">
            <span className="section-tag">{about.label}</span>
            <h2 className="section-title">{about.heading}</h2>

            <div className="about-bio-paragraphs">
              {about.biography.map((p, idx) => (
                <p key={idx} className="about-bio-text">
                  {p}
                </p>
              ))}
            </div>

            {/* Measurements Comp-Card (Only rendered if authentic specs provided) */}
            {measurements && Object.keys(measurements).length > 0 && (
              <div className="measurements-container" id="measurements">
                <h3 className="measurements-title">
                  <Ruler size={16} />
                  <span>Model Specifications</span>
                </h3>

                <div className="measurements-grid">
                  {Object.entries(measurements).map(([key, value]) => (
                    <div key={key} className="measurement-item">
                      <span className="measurement-label">{key}</span>
                      <span className="measurement-val">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agency Representation (Only rendered if confirmed) */}
            {agencies && agencies.length > 0 && (
              <div className="agencies-section-block" id="agencies">
                <div className="agencies-title">
                  <Globe size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                  <span>Representation</span>
                </div>
                <div className="agencies-list">
                  {agencies.map((agency) => (
                    <div key={agency.city} className="agency-card">
                      <span className="agency-city">{agency.city}</span>
                      <span className="agency-name">{agency.agency}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
