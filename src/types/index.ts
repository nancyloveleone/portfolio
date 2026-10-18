export type AlbumCategory = string;

export interface Photograph {
  id: string;
  src: string;
  thumbSrc?: string;
  title: string;
  caption?: string;
  photographer?: string;
  year?: string;
  location?: string;
}

export interface Album {
  id: string;
  slug: string;
  title: string;
  category: string;
  year?: string;
  location?: string;
  photographer?: string;
  description: string;
  coverImage: string;
  featured: boolean;
  sortOrder: number;
  photographs: Photograph[];
  sourceMeta?: {
    importedFrom?: string;
    importDate?: string;
    originalAlbumUrl?: string;
    totalImageCount?: number;
  };
}

export interface Agency {
  city: string;
  agency: string;
  contactEmail?: string;
  website?: string;
}

export interface MeasurementSpecs {
  height?: string;
  bust?: string;
  waist?: string;
  hips?: string;
  shoes?: string;
  hair?: string;
  eyes?: string;
  dress?: string;
}

export interface SiteConfig {
  modelName: string;
  brandTagline: string;
  brandSubtitle: string;
  locationBase: string;
  statusBadge: string;
  hero: {
    badge: string;
    headline: string;
    subheadline: string;
    ctaText: string;
    secondaryCtaText?: string;
    backgroundImage: string;
    alternativeHeroImage?: string;
    highlights?: Array<{ label: string; value: string }>;
  };
  about: {
    label: string;
    heading: string;
    portraitImage: string;
    biography: string[];
    measurements?: MeasurementSpecs;
    careerHighlights?: string[];
  };
  agencies?: Agency[];
  press?: Array<{
    title: string;
    publication: string;
    issue: string;
    role: string;
  }>;
}

