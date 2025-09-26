import React from 'react';
import { X, BookOpen, BookMarked, HelpCircle, Languages, Sun, Moon, Menu, Mic2, Settings, Volume2, PlayCircle, Repeat, SkipForward, SkipBack } from 'lucide-react';
import { NavigationSwitch } from './NavigationSwitch';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: 'search' | 'reader';
  onViewChange: (view: 'search' | 'reader') => void;
  language: string;
  isDarkMode: boolean;
  toggleTheme: () => void;
  toggleLanguage: () => void;
  setShowDictionary: (show: boolean) => void;
  setShowBookmarks: (show: boolean) => void;
  setShowHelp: (show: boolean) => void;
  currentReciter?: string;
  onReciterChange?: (reciter: string) => void;
}

const RECITERS = {
  'ar.alafasy': 'Mishary Alafasy',
  'ar.abdulbasit': 'Abdul Basit Abdus-Samad',
  'ar.husary': 'Mahmoud Khalil Al-Husary',
  'ar.minshawi': 'Mohamed Siddiq El-Minshawi',
  'ar.sudais': 'Abdur-Rahman As-Sudais',
  'ar.shaatree': 'Abu Bakr Ash-Shaatree'
};

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  currentView,
  onViewChange,
  language,
  isDarkMode,
  toggleTheme,
  toggleLanguage,
  setShowDictionary,
  setShowBookmarks,
  setShowHelp,
  currentReciter = 'ar.alafasy',
  onReciterChange
}) => {
  const [showReciterSelection, setShowReciterSelection] = React.useState(false);

  const handleMenuItemClick = (action: () => void) => {
    action();
    onClose();
  };

  const handleReciterSelect = (reciterId: string) => {
    if (onReciterChange) {
      onReciterChange(reciterId);
    }
    setShowReciterSelection(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-[70] transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-[85vw] sm:max-w-sm bg-white dark:bg-gray-800 shadow-xl z-[80] transform transition-transform duration-300 ease-in-out overflow-y-auto ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 z-10">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            {language === 'fr' ? 'Menu' : 'القائمة'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
            aria-label={language === 'fr' ? 'Fermer le menu' : 'إغلاق القائمة'}
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="p-4 sm:p-6 space-y-6 pb-20">
          {/* Navigation Switch */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <Menu size={16} className="mr-2 flex-shrink-0" />
              {language === 'fr' ? 'Navigation' : 'التنقل'}
            </h3>
            <NavigationSwitch
              currentView={currentView}
              onViewChange={(view) => handleMenuItemClick(() => onViewChange(view))}
              language={language}
            />
          </div>

          {/* Tools Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <BookOpen size={16} className="mr-2 flex-shrink-0" />
              {language === 'fr' ? 'Outils d\'étude' : 'أدوات الدراسة'}
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => handleMenuItemClick(() => setShowDictionary(true))}
                className="w-full flex items-center gap-x-3 p-3 sm:p-4 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[48px] mobile-menu-item"
              >
                <BookOpen size={20} className="flex-shrink-0" />
                <div className="flex-1 text-left">
                  <div className="font-medium">{language === 'fr' ? 'Dictionnaire' : 'القاموس'}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {language === 'fr' ? 'Définitions des mots arabes' : 'تعريفات الكلمات العربية'}
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleMenuItemClick(() => setShowBookmarks(true))}
                className="w-full flex items-center gap-x-3 p-3 sm:p-4 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[48px] mobile-menu-item"
              >
                <BookMarked size={20} className="flex-shrink-0" />
                <div className="flex-1 text-left">
                  <div className="font-medium">{language === 'fr' ? 'Favoris' : 'المفضلة'}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {language === 'fr' ? 'Versets sauvegardés' : 'الآيات المحفوظة'}
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleMenuItemClick(() => setShowHelp(true))}
                className="w-full flex items-center gap-x-3 p-3 sm:p-4 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[48px] mobile-menu-item"
              >
                <HelpCircle size={20} className="flex-shrink-0" />
                <div className="flex-1 text-left">
                  <div className="font-medium">{language === 'fr' ? 'Aide' : 'المساعدة'}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {language === 'fr' ? 'Guide d\'utilisation' : 'دليل الاستخدام'}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Audio Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <Volume2 size={16} className="mr-2 flex-shrink-0" />
              {language === 'fr' ? 'Audio et récitation' : 'الصوت والتلاوة'}
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setShowReciterSelection(!showReciterSelection)}
                className="w-full flex items-center gap-x-3 p-3 sm:p-4 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[48px] mobile-menu-item"
              >
                <Mic2 size={20} className="flex-shrink-0" />
                <div className="flex-1 text-left">
                  <div className="font-medium">{language === 'fr' ? 'Récitateur' : 'القارئ'}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {RECITERS[currentReciter as keyof typeof RECITERS] || 'Mishary Alafasy'}
                  </div>
                </div>
                <div className={`transform transition-transform ${showReciterSelection ? 'rotate-90' : ''}`}>
                  <SkipForward size={16} className="text-gray-400" />
                </div>
              </button>

              {/* Reciter Selection */}
              {showReciterSelection && (
                <div className="ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600 space-y-1">
                  {Object.entries(RECITERS).map(([id, name]) => (
                    <button
                      key={id}
                      onClick={() => handleReciterSelect(id)}
                      className={`w-full text-left p-2 rounded text-sm transition-colors ${
                        currentReciter === id
                          ? 'bg-[#43ada4]/10 dark:bg-[#43ada4]/20 text-[#43ada4] dark:text-[#43ada4] font-medium'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {name}
                      {currentReciter === id && (
                        <span className="ml-2 text-[#43ada4] dark:text-[#43ada4]">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {language === 'fr' ? 'Contrôles audio' : 'تحكم الصوت'}
                </div>
                <div className="flex items-center justify-center space-x-4">
                  <button className="p-2 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                    <SkipBack size={16} />
                  </button>
                  <button className="p-3 rounded-full bg-[#43ada4] text-white hover:bg-[#3a9690] transition-colors">
                    <PlayCircle size={20} />
                  </button>
                  <button className="p-2 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                    <SkipForward size={16} />
                  </button>
                  <button className="p-2 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                    <Repeat size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <Settings size={16} className="mr-2 flex-shrink-0" />
              {language === 'fr' ? 'Paramètres' : 'الإعدادات'}
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => handleMenuItemClick(toggleLanguage)}
                className="w-full flex items-center gap-x-3 p-3 sm:p-4 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[48px] mobile-menu-item"
              >
                <Languages size={20} className="flex-shrink-0" />
                <div className="flex-1 text-left">
                  <div className="font-medium">
                    {language === 'fr' ? 'Langue' : 'اللغة'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {language === 'fr' ? 'العربية' : 'Français'}
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleMenuItemClick(toggleTheme)}
                className="w-full flex items-center gap-x-3 p-3 sm:p-4 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[48px] mobile-menu-item"
              >
                {isDarkMode ? (
                  <Sun size={20} className="flex-shrink-0" />
                ) : (
                  <Moon size={20} className="flex-shrink-0" />
                )}
                <div className="flex-1 text-left">
                  <div className="font-medium">
                    {language === 'fr' ? 'Apparence' : 'المظهر'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {isDarkMode 
                      ? (language === 'fr' ? 'Mode clair' : 'الوضع المضيء')
                      : (language === 'fr' ? 'Mode sombre' : 'الوضع المظلم')
                    }
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {language === 'fr' ? 'Le Jardin du Coran' : 'حديقة القرآن'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};