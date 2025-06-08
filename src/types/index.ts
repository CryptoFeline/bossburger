// Types for BossBurger Image Editor

export type AppState = 'EMPTY' | 'EDIT' | 'FINAL';

export interface OverlayLayer {
  type: 'newEyes' | 'originalEyes';
  image: HTMLImageElement;
  x: number; // center x (relative to canvas)
  y: number; // center y (relative to canvas)
  scale: number; // 1 = original size
  rotation: number; // in degrees
}

export interface EditorImage {
  src: string;
  image: HTMLImageElement;
  width: number;
  height: number;
}