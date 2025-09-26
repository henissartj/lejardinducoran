import React from 'react';
import { LogoBlancSvg } from './LogoBlancSvg';
import { ClairSvg } from './ClairSvg';

interface AnimatedLogoProps {
  isDarkMode: boolean;
  className?: string;
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ isDarkMode, className = '' }) => {
  return isDarkMode ? (
    <LogoBlancSvg className={className} />
  ) : (
    <ClairSvg className={className} />
  );
};