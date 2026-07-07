import React, { useState, useEffect } from 'react';
import { HalftoneCmyk } from '@paper-design/shaders-react';

export interface HalftoneConfig {
  colorBack: string;
  colorC: string;
  colorM: string;
  colorY: string;
  colorK: string;
  size: number;
  gridNoise: number;
  type: 'dots' | 'ink' | 'sharp';
  softness: number;
  contrast: number;
  floodC: number;
  floodM: number;
  floodY: number;
  floodK: number;
  gainC: number;
  gainM: number;
  gainY: number;
  gainK: number;
  grainSize: number;
  grainMixer: number;
  grainOverlay: number;
  fit: 'cover' | 'contain';
  scale: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
}

export const LIGHT_DEFAULT_CONFIG: HalftoneConfig = {
  colorBack: '#000000', // black
  colorC: '#363636',   // dark gray
  colorM: '#8B8B8B',   // mid gray
  colorY: '#B2B2B2',   // gray
  colorK: '#D0D0D0',   // light gray
  size: 0.12,
  gridNoise: 0.05,
  type: 'ink',
  softness: 0.9,
  contrast: 1.15,
  floodC: 0.05,
  floodM: 0.05,
  floodY: 0.05,
  floodK: 0.0,
  gainC: 0.25,
  gainM: 0.25,
  gainY: 0.25,
  gainK: 0.1,
  grainSize: 0.8,
  grainMixer: 0.1,
  grainOverlay: 0.06,
  fit: 'cover',
  scale: 1.0,
  rotation: 15,
  offsetX: 0.0,
  offsetY: 0.0,
};

export const DARK_DEFAULT_CONFIG: HalftoneConfig = {
  colorBack: '#1a1817', // Warm near-black background
  colorC: '#363636',   // dark gray
  colorM: '#8B8B8B',   // mid gray
  colorY: '#B2B2B2',   // gray
  colorK: '#D0D0D0',   // light gray
  size: 0.12,
  gridNoise: 0.05,
  type: 'ink',
  softness: 0.9,
  contrast: 1.2,
  floodC: 0.05,
  floodM: 0.05,
  floodY: 0.05,
  floodK: 0.0,
  gainC: 0.25,
  gainM: 0.25,
  gainY: 0.25,
  gainK: 0.1,
  grainSize: 0.4,
  grainMixer: 0.1,
  grainOverlay: 0.06,
  fit: 'cover',
  scale: 1.0,
  rotation: 15,
  offsetX: 0.0,
  offsetY: 0.0,
};

export interface ScrollEffectConfig {
  sizeFactor?: number;
  softnessFactor?: number;
  gridNoiseFactor?: number;
}

interface HalftoneImageProps {
  src: string;
  alt?: string;
  className?: string;
  config?: Partial<HalftoneConfig>;
  scrollEffect?: ScrollEffectConfig;
}

export default function HalftoneImage({
  src,
  alt = '',
  className = '',
  config = {},
  scrollEffect,
}: HalftoneImageProps) {
  const [isDark, setIsDark] = useState(false);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [hasError, setHasError] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // 1. Track Scroll Progress
  useEffect(() => {
    const handleScroll = () => {
      setScrollProgress(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 1. Synchronize Dark Mode Class
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // 2. Preload Image
  useEffect(() => {
    if (!src) return;
    setHasError(false);
    setImageObj(null);

    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setImageObj(img);
    };

    img.onerror = () => {
      console.error(`Failed to load image: ${src}`);
      setHasError(true);
    };
  }, [src]);

  // Combine configurations based on active theme
  const activeBaseConfig = isDark ? DARK_DEFAULT_CONFIG : LIGHT_DEFAULT_CONFIG;
  const mergedConfig: HalftoneConfig = {
    ...activeBaseConfig,
    ...config,
  };

  // Compute scroll-animated values (animating halftone properties only, keeping image static)
  const scrollSize = scrollProgress * (scrollEffect?.sizeFactor ?? 0.0);
  const scrollSoftness = scrollProgress * (scrollEffect?.softnessFactor ?? 0.0);
  const scrollGridNoise = scrollProgress * (scrollEffect?.gridNoiseFactor ?? 0.0);

  const finalSize = Math.max(0.01, Math.min(1.0, mergedConfig.size + scrollSize));
  const finalSoftness = Math.max(0.0, Math.min(1.0, mergedConfig.softness + scrollSoftness));
  const finalGridNoise = Math.max(0.0, Math.min(1.0, mergedConfig.gridNoise + scrollGridNoise));

  // Fallback if loading failed or source is missing
  if (hasError || !src) {
    return (
      <div 
        className={`flex items-center justify-center bg-muted text-muted-foreground ${className}`}
        style={{ width: '100%', height: '100%' }}
      >
        <span className="text-xs">Bild konnte nicht geladen werden</span>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden transition-opacity duration-700 ease-in-out ${className} ${
        imageObj ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ width: '100%', height: '100%' }}
      role="img"
      aria-label={alt}
    >
      {imageObj && (
        <HalftoneCmyk
          width="100%"
          height="100%"
          image={imageObj}
          colorBack={mergedConfig.colorBack}
          colorC={mergedConfig.colorC}
          colorM={mergedConfig.colorM}
          colorY={mergedConfig.colorY}
          colorK={mergedConfig.colorK}
          size={finalSize}
          gridNoise={finalGridNoise}
          type={mergedConfig.type}
          softness={finalSoftness}
          contrast={mergedConfig.contrast}
          floodC={mergedConfig.floodC}
          floodM={mergedConfig.floodM}
          floodY={mergedConfig.floodY}
          floodK={mergedConfig.floodK}
          gainC={mergedConfig.gainC}
          gainM={mergedConfig.gainM}
          gainY={mergedConfig.gainY}
          gainK={mergedConfig.gainK}
          grainSize={mergedConfig.grainSize}
          grainMixer={mergedConfig.grainMixer}
          grainOverlay={mergedConfig.grainOverlay}
          fit={mergedConfig.fit}
          scale={mergedConfig.scale}
          rotation={mergedConfig.rotation}
          offsetX={mergedConfig.offsetX}
          offsetY={mergedConfig.offsetY}
        />
      )}
    </div>
  );
}
