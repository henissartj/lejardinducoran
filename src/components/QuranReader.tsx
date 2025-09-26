import React, { useState, useEffect } from 'react';
import { Book, ChevronLeft, ChevronRight, List, BookOpen, BookMarked, Heart, ArrowLeft, Loader2, ArrowUp, Eye, EyeOff, Search, Filter, PlayCircle, Settings, X, SkipBack, SkipForward, Play, Repeat1, Repeat, Target, TargetIcon } from 'lucide-react';
import { AudioPlayer } from './AudioPlayer';
import { HighlightedText } from './HighlightedText';
import { advancedArabicSearch, normalizeArabicText } from '../utils/arabicNormalization';
import AudioManager from '../utils/AudioManager';
import useGlobalAudioState from '../hooks/useGlobalAudioState';
import axios from 'axios';

interface QuranVerse {
  number: number;
  text: string;
  translation?: string;
  surah: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
  };
  numberInSurah: number;
  audio?: string;
}

interface SurahInfo {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

  language: string;
  currentReciter: string;
  onReciterChange: (reciter: string) => void;
  getAudioUrl: (globalAyahNumber: number) => string;
  loadSurah: (surahNumber: number) => Promise<QuranVerse[]>;
  isBookmarked: (ayahRef: string) => boolean;
  toggleBookmark: (verse: QuranVerse) => void;
  openNotesForAyah: (ayahRef: string) => void;
  openDictionaryWithWord: (word: string) => void;
  onVerseClick: (verse: QuranVerse) => void;
}

  language,
  currentReciter,
  onReciterChange,
  getAudioUrl,
  loadSurah,
  isBookmarked,
  toggleBookmark,
  openNotesForAyah,
  openDictionaryWithWord,
  onVerseClick
}) => {
  // Expression régulière robuste pour détecter et supprimer la Basmala
  // Prend en compte toutes les variations possibles avec diacritiques optionnels
  const BASMALA_REMOVAL_REGEX = /^[\u064B-\u065F\u0670\u0651\s]*بِسْمِ[\u064B-\u065F\u0670\u0651\s]*ٱ?للَّهِ[\u064B-\u065F\u0670\u0651\s]*ٱ?لرَّحْمَٰنِ[\u064B-\u065F\u0670\u0651\s]*ٱ?لرَّحِيمِ[\u064B-\u065F\u0670\u0651\s]*/;
  
  const [view, setView] = useState<'list' | 'surah'>('list');
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [surahList, setSurahList] = useState<SurahInfo[]>([]);
  const [currentVerses, setCurrentVerses] = useState<QuranVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSurahList, setLoadingSurahList] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNavigation, setShowNavigation] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<QuranVerse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [surahFilters, setSurahFilters] = useState({
    revelationType: 'all' as 'all' | 'Meccan' | 'Medinan',
    searchTerm: ''
  });
  const [showAdvancedControls, setShowAdvancedControls] = useState<string | null>(null);

  // Mode suivi
  const [isFollowModeEnabled, setIsFollowModeEnabled] = useState(false);
  const globalAudioState = useGlobalAudioState();
  const verseRefs = React.useRef<Map<number, HTMLDivElement>>(new Map());

  // Charger la liste complète des sourates au montage
  useEffect(() => {
    loadSurahList();
  }, []);

  // Recharger les versets quand la langue change
  useEffect(() => {
    if (selectedSurah && view === 'surah') {
      loadSurahVerses(selectedSurah);
    }
  }, [language, selectedSurah]);

  // Recherche dans les versets de la sourate courante
  useEffect(() => {
    if (searchTerm.trim() && currentVerses.length > 0) {
      setIsSearching(true);
      const filtered = currentVerses.filter(verse => {
        const searchInText = advancedArabicSearch(verse.text, searchTerm, {
          searchMode: 'flexible',
          ignoreDiacritics: true,
          fuzzyThreshold: 0.8,
          caseSensitive: false
        });
        const searchInTranslation = verse.translation ? 
          verse.translation.toLowerCase().includes(searchTerm.toLowerCase()) : false;
        return searchInText || searchInTranslation;
      });
      setSearchResults(filtered);
      setIsSearching(false);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchTerm, currentVerses]);

  // Effet pour le mode suivi - scroll automatique vers le verset en cours de lecture
  useEffect(() => {
    console.log('Follow mode effect:', {
      isFollowModeEnabled,
      currentPlayingUrl: globalAudioState.currentPlayingUrl,
      isPlaying: globalAudioState.isPlaying,
      currentVersesLength: currentVerses.length
    });
    
    if (!isFollowModeEnabled || !globalAudioState.currentPlayingUrl || !globalAudioState.isPlaying || currentVerses.length === 0) {
      return;
    }

    // Trouver le verset correspondant à l'URL audio en cours
    const currentPlayingVerse = currentVerses.find(verse => 
      getAudioUrl(verse.number) === globalAudioState.currentPlayingUrl
    );

    console.log('Current playing verse found:', currentPlayingVerse);

    if (currentPlayingVerse) {
      const verseElement = verseRefs.current.get(currentPlayingVerse.number);
      console.log('Verse element found:', verseElement);
      
      if (verseElement) {
        // Scroll vers le verset avec un offset pour le centrer
        const headerHeight = 120; // Hauteur approximative du header
        const elementTop = verseElement.offsetTop;
        const elementHeight = verseElement.offsetHeight;
        const windowHeight = window.innerHeight;
        const scrollPosition = elementTop - (windowHeight / 2) + (elementHeight / 2) - headerHeight;

        console.log('Scrolling to position:', scrollPosition);

        window.scrollTo({
          top: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
      }
    }
  }, [globalAudioState.currentPlayingUrl, globalAudioState.isPlaying, isFollowModeEnabled, currentVerses, getAudioUrl]);

  const loadSurahList = async () => {
    try {
      setLoadingSurahList(true);
      setError(null);
      
      const response = await axios.get('https://api.alquran.cloud/v1/surah');
      
      if (response.data.code === 200) {
        const surahs = response.data.data.map((surah: any) => ({
          number: surah.number,
          name: surah.name,
          englishName: surah.englishName,
          englishNameTranslation: surah.englishNameTranslation,
          numberOfAyahs: surah.numberOfAyahs,
          revelationType: surah.revelationType
        }));
        setSurahList(surahs);
      } else {
        throw new Error('Failed to load surah list');
      }
    } catch (err) {
      console.error('Error loading surah list:', err);
      setError(language === 'fr' 
        ? 'Erreur lors du chargement de la liste des sourates'
        : 'خطأ في تحميل قائمة السور');
    } finally {
      setLoadingSurahList(false);
    }
  };

  const loadSurahVerses = async (surahNumber: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const verses = await loadSurah(surahNumber);
      setCurrentVerses(verses);
      setSelectedSurah(surahNumber);
      setView('surah');
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error loading surah verses:', err);
      setError(language === 'fr' 
        ? `Erreur lors du chargement de la sourate ${surahNumber}`
        : `خطأ في تحميل السورة ${surahNumber}`);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousSurah = () => {
    if (selectedSurah && selectedSurah > 1) {
      loadSurahVerses(selectedSurah - 1);
    }
  };

  const goToNextSurah = () => {
    if (selectedSurah && selectedSurah < 114) {
      loadSurahVerses(selectedSurah + 1);
    }
  };

  const goBackToList = () => {
    setView('list');
    setSelectedSurah(null);
    setCurrentVerses([]);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCurrentSurahInfo = (): SurahInfo | null => {
    if (!selectedSurah) return null;
    return surahList.find(s => s.number === selectedSurah) || null;
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
  };

  const clearSurahSearch = () => {
    setSurahFilters(prev => ({ ...prev, searchTerm: '' }));
  };

  // Fonction améliorée pour nettoyer le texte du verset
  const cleanVerseText = (text: string, surahNumber: number, verseNumber: number): string => {
    if (!text) return text;
    
    // Ne pas nettoyer pour Al-Fatiha (1) car la Basmala en fait partie intégrante
    // Ne pas nettoyer pour At-Tawbah (9) car elle ne commence pas par la Basmala
    if (surahNumber === 1 || surahNumber === 9) {
      return text;
    }
    
    // Pour toutes les autres sourates, supprimer la Basmala si elle est présente
    // Principalement au premier verset, mais vérifier tous les versets par sécurité
    let cleanedText = text;
    
    // Appliquer la regex de suppression de la Basmala
    if (BASMALA_REMOVAL_REGEX.test(cleanedText)) {
      cleanedText = cleanedText.replace(BASMALA_REMOVAL_REGEX, '').trim();
      
      // Vérification de sécurité : s'assurer qu'il reste du texte après nettoyage
      if (!cleanedText || cleanedText.length < 5) {
        console.warn(`Attention: Le nettoyage de la Basmala a laissé très peu de texte pour le verset ${surahNumber}:${verseNumber}`);
        // En cas de doute, retourner le texte original
        return text;
      }
    }
    
    return cleanedText;
  };

  // Fonction pour déterminer si un verset est actuellement en cours de lecture
  const isVerseCurrentlyPlaying = (verse: QuranVerse): boolean => {
    const isPlaying = globalAudioState.currentPlayingUrl === getAudioUrl(verse.number) && 
           globalAudioState.isPlaying && 
           isFollowModeEnabled;
    
    if (isPlaying) {
      console.log('Verse currently playing:', verse.numberInSurah, 'URL:', getAudioUrl(verse.number));
    }
    
    return isPlaying;
  };

  // Fonctions pour la lecture audio continue
  const handlePlaylistToggle = () => {
    if (currentVerses.length === 0) return;
    
    const audioManager = AudioManager.getInstance();
    
    if (audioManager.isInPlaylistMode()) {
      audioManager.clearPlaylist();
    } else {
      const audioUrls = currentVerses.map(verse => getAudioUrl(verse.number));
      audioManager.setPlaylist(audioUrls, 0);
      // Commencer la lecture du premier verset
      if (audioUrls.length > 0) {
        audioManager.toggle(audioUrls[0]);
      }
    }
  };

  const handleNext = () => {
    const audioManager = AudioManager.getInstance();
    audioManager.playNext();
  };

  const handlePrevious = () => {
    const audioManager = AudioManager.getInstance();
    audioManager.playPrevious();
  };

  const handleRepeatModeChange = (mode: 'none' | 'one' | 'all') => {
    const audioManager = AudioManager.getInstance();
    
    if (mode === 'all' && !audioManager.isInPlaylistMode() && currentVerses.length > 0) {
      // Activer le mode playlist pour répéter toute la sourate
      const audioUrls = currentVerses.map(verse => getAudioUrl(verse.number));
      audioManager.setPlaylist(audioUrls, 0);
    }
    
    audioManager.setRepeatMode(mode);
  };

  const handlePlaybackRateChange = (rate: number) => {
    const audioManager = AudioManager.getInstance();
    audioManager.setPlaybackRate(rate);
  };

  // Filtrer les sourates selon les critères
  const filteredSurahList = surahList.filter(surah => {
    if (surahFilters.revelationType !== 'all' && surah.revelationType !== surahFilters.revelationType) {
      return false;
    }
    if (surahFilters.searchTerm) {
      const searchLower = surahFilters.searchTerm.toLowerCase();
      return surah.name.toLowerCase().includes(searchLower) ||
             surah.englishName.toLowerCase().includes(searchLower) ||
             surah.englishNameTranslation.toLowerCase().includes(searchLower) ||
             surah.number.toString().includes(searchLower);
    }
    return true;
  });

  // Obtenir les versets à afficher (résultats de recherche ou tous les versets)
  const versesToDisplay = searchTerm.trim() ? searchResults : currentVerses;

  // Vue liste des sourates
  if (view === 'list') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-6 transition-colors duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-2xl font-bold text-[#43ada4] dark:text-[#43ada4] flex items-center">
            <List size={20} className={`sm:w-6 sm:h-6 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {language === 'fr' ? 'Sourates du Coran' : 'سور القرآن'}
          </h2>
        </div>

        {/* Filtres et recherche - Mieux organisés */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Barre de recherche des sourates */}
            <div className="relative flex-1">
              <input
                type="text"
                value={surahFilters.searchTerm}
                onChange={(e) => setSurahFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                placeholder={language === 'fr' ? 'Rechercher une sourate...' : 'البحث عن سورة...'}
                className="w-full px-3 sm:px-4 py-2 pl-8 sm:pl-10 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#43ada4] text-sm sm:text-base"
              />
              <Search size={16} className="sm:w-5 sm:h-5 absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              {surahFilters.searchTerm && (
                <button
                  onClick={clearSurahSearch}
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              )}
            </div>
            
            {/* Filtre type de révélation */}
            <div className="min-w-[150px] sm:min-w-[200px]">
              <select
                value={surahFilters.revelationType}
                onChange={(e) => setSurahFilters(prev => ({ ...prev, revelationType: e.target.value as any }))}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#43ada4] text-sm sm:text-base"
              >
                <option value="all">{language === 'fr' ? 'Toutes les sourates' : 'جميع السور'}</option>
                <option value="Meccan">{language === 'fr' ? 'Mecquoises' : 'مكية'}</option>
                <option value="Medinan">{language === 'fr' ? 'Médinoises' : 'مدنية'}</option>
              </select>
            </div>
          </div>
          
          {/* Statistiques des résultats */}
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            {language === 'fr' 
              ? `${filteredSurahList.length} sourate(s) sur 114` 
              : `${filteredSurahList.length} سورة من ١١٤`}
          </div>
        </div>

        {loadingSurahList ? (
          <div className="text-center py-6 sm:py-8">
            <Loader2 size={24} className="sm:w-8 sm:h-8 mx-auto text-[#43ada4] dark:text-[#43ada4] animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {language === 'fr' ? 'Chargement des sourates...' : 'تحميل السور...'}
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-6 sm:py-8">
            <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={loadSurahList}
              className="px-4 py-2 bg-[#43ada4] text-white rounded-lg hover:bg-[#3a9690] transition-colors text-sm sm:text-base"
            >
              {language === 'fr' ? 'Réessayer' : 'إعادة المحاولة'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredSurahList.map((surah) => (
              <button
                key={surah.number}
                onClick={() => loadSurahVerses(surah.number)}
                className="text-left p-3 sm:p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-[#43ada4] dark:hover:border-[#43ada4] hover:bg-[#43ada4]/5 dark:hover:bg-[#43ada4]/10 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-1 sm:mb-2">
                  <div className="flex items-center">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#43ada4] text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold mr-2 sm:mr-3 flex-shrink-0">
                      {surah.number}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base text-gray-800 dark:text-gray-200 group-hover:text-[#43ada4] dark:group-hover:text-[#43ada4] truncate">
                        {surah.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                        {surah.englishName}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500 group-hover:text-[#43ada4] dark:group-hover:text-[#43ada4] transition-colors flex-shrink-0" />
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span className="truncate mr-2">{surah.englishNameTranslation}</span>
                  <span>
                    {surah.numberOfAyahs} {language === 'fr' ? 'versets' : 'آية'}
                  </span>
                </div>
                <div className="mt-1 sm:mt-2 text-xs text-gray-400 dark:text-gray-500">
                  {surah.revelationType === 'Meccan' 
                    ? (language === 'fr' ? 'Mecquoise' : 'مكية')
                    : (language === 'fr' ? 'Médinoise' : 'مدنية')
                  }
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Vue lecture d'une sourate
  const currentSurahInfo = getCurrentSurahInfo();

  return (
    <div className="space-y-6 relative">
      {/* Header de la sourate avec navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-6 transition-colors duration-200">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goBackToList}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-[#43ada4] dark:hover:text-[#43ada4] transition-colors text-sm sm:text-base"
          >
            <ArrowLeft size={16} className={`sm:w-5 sm:h-5 ${language === 'ar' ? 'ml-1 sm:ml-2' : 'mr-1 sm:mr-2'}`} />
            {language === 'fr' ? 'Retour à la liste' : 'العودة إلى القائمة'}
          </button>
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={goToPreviousSurah}
              disabled={!selectedSurah || selectedSurah === 1}
              className="p-1.5 sm:p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-[#43ada4] dark:hover:text-[#43ada4] hover:bg-[#43ada4]/5 dark:hover:bg-[#43ada4]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title={language === 'fr' ? 'Sourate précédente' : 'السورة السابقة'}
            >
              <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
            </button>
            
            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-2 sm:px-3">
              {selectedSurah}/114
            </span>
            
            <button
              onClick={goToNextSurah}
              disabled={!selectedSurah || selectedSurah === 114}
              className="p-1.5 sm:p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-[#43ada4] dark:hover:text-[#43ada4] hover:bg-[#43ada4]/5 dark:hover:bg-[#43ada4]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title={language === 'fr' ? 'Sourate suivante' : 'السورة التالية'}
            >
              <ChevronRight size={16} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {currentSurahInfo && (
          <div className="text-center">
            <h1 className="text-lg sm:text-3xl font-bold text-[#43ada4] dark:text-[#43ada4] mb-2">
              <span className="font-arabic text-2xl sm:text-4xl block mb-1 sm:mb-2">
                {currentSurahInfo.name}
              </span>
              {language === 'fr' && (
                <span className="text-sm sm:text-2xl text-gray-700 dark:text-gray-300">
                  {currentSurahInfo.englishName} - {currentSurahInfo.englishNameTranslation}
                </span>
              )}
            </h1>
            <div className="flex justify-center items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
              <span>
                {language === 'fr' ? 'Sourate' : 'سورة'} {currentSurahInfo.number}
              </span>
              <span>•</span>
              <span>
                {currentSurahInfo.numberOfAyahs} {language === 'fr' ? 'versets' : 'آية'}
              </span>
              <span>•</span>
              <span>
                {currentSurahInfo.revelationType === 'Meccan' 
                  ? (language === 'fr' ? 'Mecquoise' : 'مكية')
                  : (language === 'fr' ? 'Médinoise' : 'مدنية')
                }
              </span>
            </div>
            
            {/* Contrôles de lecture de sourate et recherche - Plus compacts */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              {/* Bouton lecture sourate complète - discret */}
              <button
                onClick={handlePlaylistToggle}
                className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium transition-all duration-200 shadow-sm ${
                  AudioManager.getInstance().isInPlaylistMode()
                    ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30'
                    : 'bg-[#43ada4]/10 dark:bg-[#43ada4]/20 text-[#43ada4] dark:text-[#43ada4] hover:bg-[#43ada4]/20 dark:hover:bg-[#43ada4]/30'
                }`}
                title={AudioManager.getInstance().isInPlaylistMode()
                  ? (language === 'fr' ? 'Arrêter la lecture de la sourate' : 'إيقاف تشغيل السورة')
                  : (language === 'fr' ? 'Écouter toute la sourate' : 'استمع لكامل السورة')
                }
              >
                <PlayCircle size={10} className={`sm:w-3 sm:h-3 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                {AudioManager.getInstance().isInPlaylistMode()
                  ? (language === 'fr' ? 'Arrêter' : 'إيقاف')
                  : (language === 'fr' ? 'Écouter' : 'استمع')
                }
              </button>
              
              {/* Mode suivi */}
              <button
                onClick={() => setIsFollowModeEnabled(!isFollowModeEnabled)}
                className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium transition-all duration-200 shadow-sm ${
                  isFollowModeEnabled
                    ? 'bg-[#43ada4]/20 dark:bg-[#43ada4]/30 text-[#43ada4] dark:text-[#43ada4]'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title={language === 'fr' ? 'Mode suivi des versets' : 'وضع متابعة الآيات'}
              >
                <Target size={10} className={`sm:w-3 sm:h-3 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                {language === 'fr' ? 'Suivi' : 'متابعة'}
              </button>
              
              {/* Barre de recherche dans la sourate - compacte */}
              <div className="relative flex-1 max-w-xs sm:max-w-sm">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={language === 'fr' ? 'Rechercher...' : 'البحث...'}
                  className="w-full px-2 sm:px-3 py-1 sm:py-1.5 pl-6 sm:pl-8 pr-6 sm:pr-8 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#43ada4]"
                />
                <Search size={12} className="sm:w-4 sm:h-4 absolute left-1.5 sm:left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-1.5 sm:right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            
            {/* Résultats de recherche */}
            {searchTerm && (
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                {isSearching ? (
                  language === 'fr' ? 'Recherche...' : 'جاري البحث...'
                ) : (
                  `${searchResults.length} ${language === 'fr' ? 'résultat(s)' : 'نتيجة'}`
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contenu des versets */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sm:p-8 text-center transition-colors duration-200">
          <Loader2 size={24} className="sm:w-8 sm:h-8 mx-auto text-[#43ada4] dark:text-[#43ada4] animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'fr' ? 'Chargement des versets...' : 'تحميل الآيات...'}
          </p>
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sm:p-8 text-center transition-colors duration-200">
          <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => selectedSurah && loadSurahVerses(selectedSurah)}
            className="px-4 py-2 bg-[#43ada4] text-white rounded-lg hover:bg-[#3a9690] transition-colors text-sm sm:text-base"
          >
            {language === 'fr' ? 'Réessayer' : 'إعادة المحاولة'}
          </button>
        </div>
      ) : currentVerses.length > 0 ? (
        <>
          {/* Formules de protection et Basmala */}
          {currentSurahInfo && (
            <div className="bg-gradient-to-r from-[#43ada4]/5 to-[#43ada4]/10 dark:from-[#43ada4]/10 dark:to-[#43ada4]/20 rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 text-center border border-[#43ada4]/20 dark:border-[#43ada4]/30">
              {/* Ta'awudh (refuge) - pour toutes les sourates */}
              <div className="mb-3 sm:mb-4">
                <p className="font-arabic text-lg sm:text-xl text-gray-700 dark:text-gray-300 mb-2" dir="rtl">
                  أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 italic">
                  {language === 'fr' 
                    ? 'Je cherche refuge auprès d\'Allah contre Satan le banni.'
                    : 'أعوذ بالله من الشيطان الرجيم'}
                </p>
              </div>
              
              {/* Basmala - pour toutes les sourates sauf Al-Fatiha (1) et At-Tawbah (9) */}
              {currentSurahInfo.number !== 1 && currentSurahInfo.number !== 9 && (
                <div className="border-t border-[#43ada4]/30 dark:border-[#43ada4]/40 pt-3 sm:pt-4">
                  <p className="font-arabic text-xl sm:text-2xl text-[#43ada4] dark:text-[#43ada4] mb-2" dir="rtl">
                    بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 italic">
                    {language === 'fr' 
                      ? 'Au nom d\'Allah, le Tout Miséricordieux, le Très Miséricordieux.'
                      : 'بسم الله الرحمن الرحيم'}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3 sm:space-y-4 pb-16 sm:pb-20">
            {versesToDisplay.map((verse, index) => {
              const ayahRef = `${verse.surah.number}:${verse.numberInSurah}`;
              const isBookmarkedVerse = isBookmarked(ayahRef);
              const isCurrentlyPlaying = isVerseCurrentlyPlaying(verse);
              
              return (
                <div 
                  className="ayah-verse bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200"
                  }}
                  key={`${verse.number}-${index}`} 
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-6 transition-all duration-200 cursor-pointer hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-750 border border-transparent hover:border-[#43ada4]/20 ${
                    isCurrentlyPlaying ? 'is-active-verse' : ''
                  }`}
                  onClick={() => onVerseClick(verse)}
                >
                  {/* Numéro du verset */}
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#43ada4]/10 dark:bg-[#43ada4]/20 text-[#43ada4] dark:text-[#43ada4] rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold mr-2 sm:mr-3">
                        {verse.numberInSurah}
                      </div>
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {language === 'fr' ? 'Verset' : 'آية'} {verse.numberInSurah}
                      </span>
                    </div>
                    
                    {/* Audio Player avec contrôles avancés */}
                    <div className="relative">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <AudioPlayer
                          audioUrl={getAudioUrl(verse.number)}
                          minimal={true}
                          currentReciter={currentReciter}
                          onReciterChange={onReciterChange}
                          language={language}
                        />
                        
                        <button
                          onClick={() => setShowAdvancedControls(prev => prev === `${verse.number}` ? null : `${verse.number}`)}
                          className="p-1 sm:p-1.5 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                          title={language === 'fr' ? 'Contrôles avancés' : 'تحكم متقدم'}
                        >
                          <Settings size={12} className="sm:w-4 sm:h-4 text-[#43ada4] dark:text-[#43ada4]" />
                        </button>
                      </div>
                      
                      {/* Panneau de contrôles avancés */}
                      {showAdvancedControls === `${verse.number}` && (
                        <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 z-50 min-w-[200px] sm:min-w-[250px]">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm sm:text-base">
                              {language === 'fr' ? 'Contrôles Audio' : 'تحكم الصوت'}
                            </h4>
                            <button
                              onClick={() => setShowAdvancedControls(null)}
                              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                              <X size={14} className="sm:w-4 sm:h-4" />
                            </button>
                          </div>
                          
                          <div className="space-y-2 sm:space-y-3">
                            {/* Navigation audio */}
                            <div>
                              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1 sm:mb-2">
                                {language === 'fr' ? 'Navigation' : 'التنقل'}
                              </label>
                              <div className="flex justify-center space-x-1 sm:space-x-2">
                                <button
                                  onClick={handlePrevious}
                                  className="p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                  title={language === 'fr' ? 'Verset précédent' : 'الآية السابقة'}
                                >
                                  <SkipBack size={14} className="sm:w-4 sm:h-4" />
                                </button>
                                <button
                                  onClick={handleNext}
                                  className="p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                  title={language === 'fr' ? 'Verset suivant' : 'الآية التالية'}
                                >
                                  <SkipForward size={14} className="sm:w-4 sm:h-4" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Mode de répétition */}
                            <div>
                              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1 sm:mb-2">
                                {language === 'fr' ? 'Répétition' : 'التكرار'}
                              </label>
                              <div className="flex justify-center space-x-1">
                                <button
                                  onClick={() => handleRepeatModeChange('none')}
                                  className={`p-1.5 sm:p-2 rounded text-xs ${
                                    AudioManager.getInstance().getRepeatMode() === 'none'
                                      ? 'bg-[#43ada4]/10 dark:bg-[#43ada4]/20 text-[#43ada4] dark:text-[#43ada4]' 
                                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                  }`}
                                  title={language === 'fr' ? 'Aucune répétition' : 'بدون تكرار'}
                                >
                                  <Play size={12} className="sm:w-4 sm:h-4" />
                                </button>
                                <button
                                  onClick={() => handleRepeatModeChange('one')}
                                  className={`p-1.5 sm:p-2 rounded text-xs ${
                                    AudioManager.getInstance().getRepeatMode() === 'one'
                                      ? 'bg-[#43ada4]/10 dark:bg-[#43ada4]/20 text-[#43ada4] dark:text-[#43ada4]' 
                                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                  }`}
                                  title={language === 'fr' ? 'Répéter le verset' : 'تكرار الآية'}
                                >
                                  <Repeat1 size={12} className="sm:w-4 sm:h-4" />
                                </button>
                                <button
                                  onClick={() => handleRepeatModeChange('all')}
                                  className={`p-1.5 sm:p-2 rounded text-xs ${
                                    AudioManager.getInstance().getRepeatMode() === 'all'
                                      ? 'bg-[#43ada4]/10 dark:bg-[#43ada4]/20 text-[#43ada4] dark:text-[#43ada4]' 
                                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                  }`}
                                  title={language === 'fr' ? 'Répéter la sourate' : 'تكرار السورة'}
                                >
                                  <Repeat size={12} className="sm:w-4 sm:h-4" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Vitesse de lecture */}
                            <div>
                              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1 sm:mb-2">
                                {language === 'fr' ? 'Vitesse' : 'السرعة'}: {AudioManager.getInstance().getPlaybackRate()}x
                              </label>
                              <input
                                type="range"
                                min="0.25"
                                max="2"
                                step="0.25"
                                value={AudioManager.getInstance().getPlaybackRate()}
                                onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                                className="w-full h-1 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                              />
                              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <span>0.25x</span>
                                <span>1x</span>
                                <span>2x</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Texte du verset */}
                  <div className="mb-3 sm:mb-4">
                    {/* Texte arabe */}
                    <p className="text-lg sm:text-2xl leading-relaxed font-arabic text-gray-900 dark:text-white text-right mb-3 sm:mb-4" dir="rtl">
                      {searchTerm ? (
                        <HighlightedText
                          text={cleanVerseText(verse.text, verse.surah.number, verse.numberInSurah)}
                          searchTerm={searchTerm}
                          searchOptions={{
                            ignoreDiacritics: true,
                            caseSensitive: false,
                            exactMatch: false,
                            arabicSearchMode: 'words'
                          }}
                          language="ar"
                          enableBilingualHighlighting={true}
                          otherLanguageText={verse.translation || ''}
                        />
                      ) : (
                        cleanVerseText(verse.text, verse.surah.number, verse.numberInSurah)
                      )}
                    </p>
                    
                    {/* Traduction si disponible */}
                    {verse.translation && (
                      <p className="text-sm sm:text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                        {searchTerm ? (
                          <HighlightedText
                            text={verse.translation}
                            searchTerm={searchTerm}
                            searchOptions={{
                              ignoreDiacritics: true,
                              caseSensitive: false,
                              exactMatch: false,
                              arabicSearchMode: 'words'
                            }}
                            language="fr"
                            enableBilingualHighlighting={true}
                            otherLanguageText={cleanVerseText(verse.text, verse.surah.number, verse.numberInSurah)}
                          />
                        ) : (
                          verse.translation
                        )}
                      </p>
                    )}
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => toggleBookmark(verse)}
                      className={`flex items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                        isBookmarkedVerse
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                          : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                      title={isBookmarkedVerse 
                        ? (language === 'fr' ? 'Retirer des favoris' : 'إزالة من المفضلة')
                        : (language === 'fr' ? 'Ajouter aux favoris' : 'إضافة إلى المفضلة')
                      }
                    >
                      <Heart size={14} className={`sm:w-4 sm:h-4 ${language === 'ar' ? 'ml-1' : 'mr-1'} ${isBookmarkedVerse ? 'fill-current' : ''}`} />
                      <span className="hidden sm:inline">
                        {isBookmarkedVerse 
                          ? (language === 'fr' ? 'Favoris' : 'مفضل')
                          : (language === 'fr' ? 'Favori' : 'مفضلة')
                        }
                      </span>
                    </button>

                    <button
                      onClick={() => openNotesForAyah(ayahRef)}
                      className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title={language === 'fr' ? 'Notes personnelles' : 'ملاحظات شخصية'}
                    >
                      <BookMarked size={14} className={`sm:w-4 sm:h-4 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                      <span className="hidden sm:inline">
                        {language === 'fr' ? 'Notes' : 'ملاحظات'}
                      </span>
                    </button>

                    <button
                      onClick={() => openDictionaryWithWord('')}
                      className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title={language === 'fr' ? 'Consulter le dictionnaire' : 'الاطلاع على القاموس'}
                    >
                      <BookOpen size={14} className={`sm:w-4 sm:h-4 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                      <span className="hidden sm:inline">
                        {language === 'fr' ? 'Dictionnaire' : 'قاموس'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation flottante discrète en bas - seulement si pas de recherche active */}
          {!searchTerm && (
          <div className="fixed bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 z-30">
            <div className="flex flex-col items-center space-y-2">
              <button
                onClick={() => setShowNavigation(!showNavigation)}
                className="bg-white dark:bg-gray-800 shadow-lg rounded-full p-1.5 sm:p-2 border border-gray-200 dark:border-gray-600 hover:shadow-xl transition-all duration-200 text-gray-600 dark:text-gray-400 hover:text-[#43ada4] dark:hover:text-[#43ada4] flex items-center justify-center"
                title={showNavigation 
                  ? (language === 'fr' ? 'Masquer la navigation' : 'إخفاء التنقل')
                  : (language === 'fr' ? 'Afficher la navigation' : 'إظهار التنقل')
                }
              >
                {showNavigation ? <EyeOff size={14} className="sm:w-4 sm:h-4" /> : <Eye size={14} className="sm:w-4 sm:h-4" />}
              </button>

              {showNavigation && (
                <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-lg rounded-full px-1.5 sm:px-2 py-1 border border-gray-200/50 dark:border-gray-600/50 animate-in slide-in-from-bottom-2 duration-200">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={goToPreviousSurah}
                      disabled={!selectedSurah || selectedSurah === 1}
                      className="p-1.5 sm:p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-[#43ada4] dark:hover:text-[#43ada4] hover:bg-[#43ada4]/5 dark:hover:bg-[#43ada4]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title={language === 'fr' ? 'Sourate précédente' : 'السورة السابقة'}
                    >
                      <ChevronLeft size={12} className="sm:w-4 sm:h-4" />
                    </button>
                    
                    <div className="px-1 sm:px-2 py-1">
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center min-w-[30px] sm:min-w-[40px]">
                        {selectedSurah}/114
                      </div>
                      <div className="w-12 sm:w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-0.5 mt-1">
                        <div 
                          className="bg-[#43ada4] h-0.5 rounded-full transition-all duration-300" 
                          style={{ width: `${((selectedSurah || 0) / 114) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <button
                      onClick={scrollToTop}
                      className="p-1.5 sm:p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-[#43ada4] dark:hover:text-[#43ada4] hover:bg-[#43ada4]/5 dark:hover:bg-[#43ada4]/10 transition-colors flex items-center justify-center"
                      title={language === 'fr' ? 'Remonter en haut' : 'العودة إلى الأعلى'}
                    >
                      <ArrowUp size={12} className="sm:w-4 sm:h-4" />
                    </button>
                    
                    <button
                      onClick={goBackToList}
                      className="p-1.5 sm:p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-[#43ada4] dark:hover:text-[#43ada4] hover:bg-[#43ada4]/5 dark:hover:bg-[#43ada4]/10 transition-colors"
                      title={language === 'fr' ? 'Retour à la liste' : 'العودة إلى القائمة'}
                    >
                      <List size={12} className="sm:w-4 sm:h-4" />
                    </button>
                    
                    <button
                      onClick={goToNextSurah}
                      disabled={!selectedSurah || selectedSurah === 114}
                      className="p-1.5 sm:p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-[#43ada4] dark:hover:text-[#43ada4] hover:bg-[#43ada4]/5 dark:hover:bg-[#43ada4]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title={language === 'fr' ? 'Sourate suivante' : 'السورة التالية'}
                    >
                      <ChevronRight size={12} className="sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          )}
        </>
      ) : searchTerm ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sm:p-8 text-center transition-colors duration-200">
          <Search size={32} className="sm:w-12 sm:h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            {language === 'fr' ? 'Aucun résultat trouvé' : 'لم يتم العثور على نتائج'}
          </p>
          <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">
            {language === 'fr' 
              ? `Aucun verset ne contient "${searchTerm}"`
              : `لا توجد آيات تحتوي على "${searchTerm}"`}
          </p>
          <button
            onClick={clearSearch}
            className="mt-4 px-4 py-2 bg-[#43ada4] text-white rounded-lg hover:bg-[#3a9690] transition-colors text-sm sm:text-base"
          >
            {language === 'fr' ? 'Effacer la recherche' : 'مسح البحث'}
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sm:p-8 text-center transition-colors duration-200">
          <Book size={32} className="sm:w-12 sm:h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {language === 'fr' ? 'Aucun verset trouvé' : 'لم يتم العثور على آيات'}
          </p>
        </div>
      )}
    </div>
  );
};