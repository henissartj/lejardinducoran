import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, Languages, BookOpen, BookMarked, HelpCircle, Menu } from 'lucide-react';
import { AnimatedLogo } from '../icons/AnimatedLogo';
import { NavigationSwitch } from './NavigationSwitch';
import { MobileMenu } from './MobileMenu';
import { Dictionary } from '../modals/Dictionary';
import { Bookmarks } from '../modals/Bookmarks';
import { Notes } from '../modals/Notes';
import HelpPage from '../modals/HelpPage';
import { VerseDetailsModal } from '../modals/VerseDetailsModal';
import { useAppContext } from '../../contexts/AppContext';
import AudioManager from '../../utils/AudioManager';
import { Play, Pause, X } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    language,
    isDarkMode,
    currentReciter,
    toggleTheme,
    toggleLanguage,
    setCurrentReciter,
    showDictionary,
    showBookmarks,
    showNotes,
    showHelp,
    showVerseDetails,
    selectedVerse,
    notesAyahRef,
    dictionaryWord,
    isMobileMenuOpen,
    setShowDictionary,
    setShowBookmarks,
    setShowNotes,
    setShowHelp,
    setShowVerseDetails,
    setIsMobileMenuOpen,
    getAudioUrl,
    isBookmarked,
    toggleBookmark,
    openNotesForAyah,
    openDictionaryWithWord,
    globalAudioState,
    audioManager
  } = useAppContext();

  const getCurrentView = (): 'search' | 'reader' => {
    if (location.pathname === '/reader') return 'reader';
    return 'search';
  };

  const handleViewChange = (view: 'search' | 'reader') => {
    if (view === 'search') {
      navigate('/');
    } else {
      navigate('/reader');
    }
  };

  const GlobalAudioControl = () => {
    if (!globalAudioState.isSurahPlaying || !globalAudioState.currentSurahInfo) {
      return null;
    }

    return (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 border border-gray-200 dark:border-gray-700 z-50 min-w-[280px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-[#43ada4] rounded-full animate-pulse"></div>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {language === 'fr' ? 'Écoute en cours' : 'جاري الاستماع'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {globalAudioState.currentSurahInfo.name}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => audioManager.toggle(globalAudioState.currentPlayingUrl || '')}
              className="p-2 text-[#43ada4] hover:bg-[#43ada4]/10 rounded-full transition-colors"
              title={globalAudioState.isPlaying ? (language === 'fr' ? 'Pause' : 'إيقاف مؤقت') : (language === 'fr' ? 'Reprendre' : 'استئناف')}
            >
              {globalAudioState.isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              onClick={() => audioManager.stopSurahPlayback()}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
              title={language === 'fr' ? 'Arrêter' : 'إيقاف'}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center min-w-0 flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}>
              <AnimatedLogo isDarkMode={isDarkMode} className="h-8 w-8 sm:h-10 sm:w-10" />
              <h1 className="ml-2 sm:ml-3 text-sm sm:text-xl font-bold text-teal-800 dark:text-teal-300 truncate">
                {language === 'fr' ? 'Le Jardin du Coran' : 'حديقة القرآن'}
              </h1>
            </div>

            <div className="hidden sm:flex flex-1 justify-center mx-2 sm:mx-4">
              <NavigationSwitch
                currentView={getCurrentView()}
                onViewChange={handleViewChange}
                language={language}
              />
            </div>

            <div className="hidden sm:flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <button
                onClick={() => setShowDictionary(true)}
                className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-[#43ada4] dark:hover:text-[#43ada4] transition-colors focus:outline-none focus:ring-0 focus:border-none focus:shadow-none"
                style={{ outline: 'none', boxShadow: 'none' }}
                title={language === 'fr' ? 'Dictionnaire' : 'القاموس'}
              >
                <BookOpen size={16} className="sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={() => setShowBookmarks(true)}
                className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-[#43ada4] dark:hover:text-[#43ada4] transition-colors focus:outline-none focus:ring-0 focus:border-none focus:shadow-none"
                style={{ outline: 'none', boxShadow: 'none' }}
                title={language === 'fr' ? 'Favoris' : 'المفضلة'}
              >
                <BookMarked size={16} className="sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={() => setShowHelp(true)}
                className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-[#43ada4] dark:hover:text-[#43ada4] transition-colors focus:outline-none focus:ring-0 focus:border-none focus:shadow-none"
                style={{ outline: 'none', boxShadow: 'none' }}
                title={language === 'fr' ? 'Aide' : 'المساعدة'}
              >
                <HelpCircle size={16} className="sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={toggleLanguage}
                className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-[#43ada4] dark:hover:text-[#43ada4] transition-colors focus:outline-none focus:ring-0 focus:border-none focus:shadow-none"
                style={{ outline: 'none', boxShadow: 'none' }}
                title={language === 'fr' ? 'العربية' : 'Français'}
              >
                <Languages size={16} className="sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={toggleTheme}
                className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-[#43ada4] dark:hover:text-[#43ada4] transition-colors focus:outline-none focus:ring-0 focus:border-none focus:shadow-none"
                style={{ outline: 'none', boxShadow: 'none' }}
                title={language === 'fr' ? 'Changer de thème' : 'تغيير المظهر'}
              >
                {isDarkMode ? <Sun size={16} className="sm:w-5 sm:h-5" /> : <Moon size={16} className="sm:w-5 sm:h-5" />}
              </button>
            </div>

            <div className="sm:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-[#43ada4] dark:hover:text-[#43ada4] transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]"
                aria-label={language === 'fr' ? 'Ouvrir le menu' : 'فتح القائمة'}
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Outlet />
      </main>

      <Dictionary
        isOpen={showDictionary}
        onClose={() => setShowDictionary(false)}
        initialWord={dictionaryWord}
        language={language}
      />

      <Bookmarks
        isOpen={showBookmarks}
        onClose={() => setShowBookmarks(false)}
        language={language}
      />

      <Notes
        isOpen={showNotes}
        onClose={() => setShowNotes(false)}
        ayahReference={notesAyahRef}
        language={language}
      />

      <HelpPage
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        language={language}
      />

      <VerseDetailsModal
        isOpen={showVerseDetails}
        onClose={() => setShowVerseDetails(false)}
        verse={selectedVerse}
        language={language}
        currentReciter={currentReciter}
        onReciterChange={setCurrentReciter}
        getAudioUrl={getAudioUrl}
        isBookmarked={isBookmarked}
        toggleBookmark={toggleBookmark}
        openNotesForAyah={openNotesForAyah}
        openDictionaryWithWord={openDictionaryWithWord}
      />

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentView={getCurrentView()}
        onViewChange={handleViewChange}
        language={language}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        toggleLanguage={toggleLanguage}
        setShowDictionary={setShowDictionary}
        setShowBookmarks={setShowBookmarks}
        setShowHelp={setShowHelp}
        currentReciter={currentReciter}
        onReciterChange={setCurrentReciter}
      />

      <GlobalAudioControl />
    </div>
  );
};
