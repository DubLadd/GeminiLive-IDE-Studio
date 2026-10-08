export interface GalleryApp {
  id: string;
  userId?: string;
  title: string;
  description: string;
  category: 'prototype' | 'tool' | 'game' | 'utility' | 'experiment';
  tags: string[];
  htmlContent: string;
  sourceFiles?: Array<{ name: string; content: string; language: string }>;
  createdAt: string;
  updatedAt: string;
  isCloudSynced?: boolean;
}
