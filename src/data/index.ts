import siteConfigRaw from './site-config.json';
import albumsRaw from './albums.json';
import type { SiteConfig, Album, AlbumCategory } from '../types';

export const siteConfig: SiteConfig = siteConfigRaw as SiteConfig;
export const albumsData: Album[] = albumsRaw as Album[];

export function getAlbums(): Album[] {
  return [...albumsData].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getFeaturedAlbums(): Album[] {
  return getAlbums().filter((album) => album.featured);
}

export function getAlbumBySlug(slug: string): Album | undefined {
  return albumsData.find((album) => album.slug === slug);
}

export function getCategories(): AlbumCategory[] {
  const categories = new Set<string>();
  albumsData.forEach((album) => categories.add(album.category));
  return ['All', ...Array.from(categories)] as AlbumCategory[];
}
