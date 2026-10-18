import React from 'react';
import { siteConfig } from '../data';
import './PressSection.css';

export const PressSection: React.FC = () => {
  const press = siteConfig.press;
  if (!press || press.length === 0) return null;

  return (
    <section className="press-section" id="press" aria-label="Press and Editorial Features">
      <div className="container">
        <div className="press-header">
          <span className="section-tag">Editorial Archive</span>
          <h2 className="section-title">Selected Publications & Press</h2>
          <p className="section-subtitle">
            Notable covers, feature editorials, and international campaigns documented across premier publications.
          </p>
        </div>

        <div className="press-grid">
          {press.map((item, idx) => (
            <article key={idx} className="press-card">
              <div>
                <h3 className="press-pub-name">{item.publication}</h3>
                <div className="press-issue">{item.issue}</div>
              </div>

              <div>
                <div className="press-feature-title">“{item.title}”</div>
                <div className="press-role-badge">{item.role}</div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
