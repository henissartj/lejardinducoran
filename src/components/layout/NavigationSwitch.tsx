import React from 'react';
import { Search, Book } from 'lucide-react';

interface NavigationSwitchProps {
  currentView: 'search' | 'reader';
  onViewChange: (view: 'search' | 'reader') => void;
  language: string;
}

export const NavigationSwitch: React.FC<NavigationSwitchProps> = ({
  currentView,
  onViewChange,
  language
}) => {
  return (
    <div className="relative bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 sm:p-1 flex transition-colors duration-200 w-full max-w-[200px] sm:max-w-xs mx-auto">
      {/* Indicateur de sélection qui glisse */}
      <div 
        className={`absolute top-0.5 sm:top-1 bottom-0.5 sm:bottom-1 w-1/2 bg-white dark:bg-gray-600 rounded-md shadow-sm transition-all duration-300 ease-in-out ${
          currentView === 'search' ? 'left-0.5 sm:left-1' : 'left-1/2'
        }`}
      />
      
      {/* Bouton Recherche */}
      <button
        onClick={() => onViewChange('search')}
        className={`relative z-10 flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 flex-1 min-h-[36px] ${
          currentView === 'search'
            ? 'text-[#43ada4] dark:text-white'
            : 'text-gray-600 dark:text-gray-400'
        } focus:outline-none focus:ring-0 focus:border-none focus:shadow-none`}
        style={{ outline: 'none', boxShadow: 'none' }}
      >
        <Search size={14} className={`sm:w-4 sm:h-4 ${language === 'ar' ? 'ml-1 sm:ml-2' : 'mr-1 sm:mr-2'}`} />
        {language === 'fr' ? 'Recherche' : 'البحث'}
      </button>
      
      {/* Bouton Lecture */}
      <button
        onClick={() => onViewChange('reader')}
        className={`relative z-10 flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 flex-1 min-h-[36px] ${
          currentView === 'reader'
            ? 'text-[#43ada4] dark:text-white'
            : 'text-gray-600 dark:text-gray-400'
        } focus:outline-none focus:ring-0 focus:border-none focus:shadow-none`}
        style={{ outline: 'none', boxShadow: 'none' }}
      >
        <Book size={14} className={`sm:w-4 sm:h-4 ${language === 'ar' ? 'ml-1 sm:ml-2' : 'mr-1 sm:mr-2'}`} />
        {language === 'fr' ? 'Lecture' : 'القراءة'}
      </button>
    </div>
  );
};