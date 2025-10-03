import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext, QuranVerse } from '../contexts/AppContext';
import {
  BookOpen, Heart, BookMarked, ArrowLeft, ChevronLeft, ChevronRight,
  Loader2, Search, PlayCircle, Target, Settings, X, SkipBack, SkipForward,
  Play, Repeat1, Repeat
} from 'lucide-react';
import { AudioPlayer } from '../components/AudioPlayer';
import AudioManager from '../utils/AudioManager';

export default function SurahPage() {
  const { surahNumber } = useParams<{ surahNumber: string }>();
  const navigate = useNavigate();
  const {
    language,
    currentReciter,
    setCurrentReciter,
    surahList,
    getAudioUrl,
    loadSurah,
    isBookmarked,
    toggleBookmark,
    openNotesForAyah,
    openDictionaryWithWord,
    globalAudioState
  } = useAppContext();

  const [verses, setVerses] = useState<QuranVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFollowModeEnabled, setIsFollowModeEnabled] = useState(false);
  const [showAdvancedControls, setShowAdvancedControls] = useState<string | null>(null);

  const audioManager = AudioManager.getInstance();
  const verseRefs = React.useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (surahNumber) {
      loadSurahData(parseInt(surahNumber));
    }
  }, [surahNumber]);

  useEffect(() => {
    if (!isFollowModeEnabled || !globalAudioState.currentPlayingUrl || !globalAudioState.isPlaying || verses.length === 0) {
      return;
    }

    const currentPlayingVerse = verses.find(verse =>
      getAudioUrl(verse.number) === globalAudioState.currentPlayingUrl
    );

    if (currentPlayingVerse) {
      const verseElement = verseRefs.current.get(currentPlayingVerse.number);

      if (verseElement) {
        const headerHeight = 120;
        const elementTop = verseElement.offsetTop;
        const elementHeight = verseElement.offsetHeight;
        const windowHeight = window.innerHeight;
        const scrollPosition = elementTop - (windowHeight / 2) + (elementHeight / 2) - headerHeight;

        window.scrollTo({
          top: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
      }
    }
  }, [globalAudioState.currentPlayingUrl, globalAudioState.isPlaying, isFollowModeEnabled, verses, getAudioUrl]);

  const loadSurahData = async (num: number) => {
    try {
      setLoading(true);
      setError(null);

      if (num < 1 || num > 114) {
        throw new Error('Invalid surah number');
      }

      const loadedVerses = await loadSurah(num);
      setVerses(loadedVerses);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error loading surah:', err);
      setError(language === 'fr'
        ? `Erreur lors du chargement de la sourate ${num}`
        : `خطأ في تحميل السورة ${num}`);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentSurahInfo = () => {
    if (!surahNumber) return null;
    return surahList.find(s => s.number === parseInt(surahNumber)) || null;
  };

  const goToPreviousSurah = () => {
    const num = parseInt(surahNumber || '1');
    if (num > 1) {
      navigate(`/surah/${num - 1}`);
    }
  };

  const goToNextSurah = () => {
    const num = parseInt(surahNumber || '1');
    if (num < 114) {
      navigate(`/surah/${num + 1}`);
    }
  };

  const handlePlaylistToggle = () => {
    if (verses.length === 0) return;

    if (audioManager.isInPlaylistMode()) {
      audioManager.clearPlaylist();
    } else {
      const audioUrls = verses.map(verse => getAudioUrl(verse.number));
      audioManager.setPlaylist(audioUrls, 0);
      if (audioUrls.length > 0) {
        audioManager.toggle(audioUrls[0]);
      }
    }
  };

  const handleNext = () => {
    audioManager.playNext();
  };

  const handlePrevious = () => {
    audioManager.playPrevious();
  };

  const handleRepeatModeChange = (mode: 'none' | 'one' | 'all') => {
    if (mode === 'all' && !audioManager.isInPlaylistMode() && verses.length > 0) {
      const audioUrls = verses.map(verse => getAudioUrl(verse.number));
      audioManager.setPlaylist(audioUrls, 0);
    }

    audioManager.setRepeatMode(mode);
  };

  const handlePlaybackRateChange = (rate: number) => {
    audioManager.setPlaybackRate(rate);
  };

  const cleanVerseText = (text: string, surahNum: number, verseNum: number): string => {
    if (!text) return text;

    if (surahNum === 1 || surahNum === 9) {
      return text;
    }

    let cleanedText = text;
    const BASMALA_REMOVAL_REGEX = /^[\u064B-\u065F\u0670\u0651\s]*بِسْمِ[\u064B-\u065F\u0670\u0651\s]*ٱ?للَّهِ[\u064B-\u065F\u0670\u0651\s]*ٱ?لرَّحْمَٰنِ[\u064B-\u065F\u0670\u0651\s]*ٱ?لرَّحِيمِ[\u064B-\u065F\u0670\u0651\s]*/;

    if (BASMALA_REMOVAL_REGEX.test(cleanedText)) {
      cleanedText = cleanedText.replace(BASMALA_REMOVAL_REGEX, '').trim();

      if (!cleanedText || cleanedText.length < 5) {
        return text;
      }
    }

    return cleanedText;
  };

  const isVerseCurrentlyPlaying = (verse: QuranVerse): boolean => {
    return globalAudioState.currentPlayingUrl === getAudioUrl(verse.number) &&
           globalAudioState.isPlaying &&
           isFollowModeEnabled;
  };

  const filteredVerses = searchTerm.trim()
    ? verses.filter(verse =>
        verse.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (verse.translation && verse.translation.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : verses;

  const currentSurahInfo = getCurrentSurahInfo();
  const currentNum = parseInt(surahNumber || '1');

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sm:p-8 text-center transition-colors duration-200">
        <Loader2 size={24} className="sm:w-8 sm:h-8 mx-auto text-[#43ada4] dark:text-[#43ada4] animate-spin mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          {language === 'fr' ? 'Chargement...' : 'تحميل...'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sm:p-8 text-center transition-colors duration-200">
        <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-[#43ada4] text-white rounded-lg hover:bg-[#3a9690] transition-colors"
        >
          {language === 'fr' ? 'Retour à l\'accueil' : 'العودة إلى الصفحة الرئيسية'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-6 transition-colors duration-200">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/reader')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-[#43ada4] dark:hover:text-[#43ada4] transition-colors text-sm sm:text-base"
          >
            <ArrowLeft size={16} className={`sm:w-5 sm:h-5 ${language === 'ar' ? 'ml-1 sm:ml-2' : 'mr-1 sm:mr-2'}`} />
            {language === 'fr' ? 'Retour à la liste' : 'العودة إلى القائمة'}
          </button>

          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={goToPreviousSurah}
              disabled={currentNum === 1}
              className="p-1.5 sm:p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-[#43ada4] dark:hover:text-[#43ada4] hover:bg-[#43ada4]/5 dark:hover:bg-[#43ada4]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title={language === 'fr' ? 'Sourate précédente' : 'السورة السابقة'}
            >
              <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
            </button>

            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-2 sm:px-3">
              {currentNum}/114
            </span>

            <button
              onClick={goToNextSurah}
              disabled={currentNum === 114}
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

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <button
                onClick={handlePlaylistToggle}
                className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium transition-all duration-200 shadow-sm ${
                  audioManager.isInPlaylistMode()
                    ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30'
                    : 'bg-[#43ada4]/10 dark:bg-[#43ada4]/20 text-[#43ada4] dark:text-[#43ada4] hover:bg-[#43ada4]/20 dark:hover:bg-[#43ada4]/30'
                }`}
              >
                <PlayCircle size={10} className={`sm:w-3 sm:h-3 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                {audioManager.isInPlaylistMode()
                  ? (language === 'fr' ? 'Arrêter' : 'إيقاف')
                  : (language === 'fr' ? 'Écouter' : 'استمع')
                }
              </button>

              <button
                onClick={() => setIsFollowModeEnabled(!isFollowModeEnabled)}
                className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium transition-all duration-200 shadow-sm ${
                  isFollowModeEnabled
                    ? 'bg-[#43ada4]/20 dark:bg-[#43ada4]/30 text-[#43ada4] dark:text-[#43ada4]'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Target size={10} className={`sm:w-3 sm:h-3 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                {language === 'fr' ? 'Suivi' : 'متابعة'}
              </button>

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
                    onClick={() => setSearchTerm('')}
                    className="absolute right-1.5 sm:right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {currentSurahInfo && (
        <div className="bg-gradient-to-r from-[#43ada4]/5 to-[#43ada4]/10 dark:from-[#43ada4]/10 dark:to-[#43ada4]/20 rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 text-center border border-[#43ada4]/20 dark:border-[#43ada4]/30">
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
        {filteredVerses.map((verse, index) => {
          const ayahRef = `${verse.surah.number}:${verse.numberInSurah}`;
          const isBookmarkedVerse = isBookmarked(ayahRef);
          const isCurrentlyPlaying = isVerseCurrentlyPlaying(verse);

          return (
            <div
              ref={(el) => {
                if (el) {
                  verseRefs.current.set(verse.number, el);
                }
              }}
              key={`${verse.number}-${index}`}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-6 transition-all duration-200 cursor-pointer hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-750 border border-transparent hover:border-[#43ada4]/20 ${
                isCurrentlyPlaying ? 'is-active-verse' : ''
              }`}
              onClick={() => navigate(`/verse/${verse.surah.number}/${verse.numberInSurah}`)}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#43ada4]/10 dark:bg-[#43ada4]/20 text-[#43ada4] dark:text-[#43ada4] rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold mr-2 sm:mr-3">
                    {verse.numberInSurah}
                  </div>
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {language === 'fr' ? 'Verset' : 'آية'} {verse.numberInSurah}
                  </span>
                </div>

                <div className="relative">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <AudioPlayer
                      audioUrl={getAudioUrl(verse.number)}
                      minimal={true}
                      currentReciter={currentReciter}
                      onReciterChange={setCurrentReciter}
                      language={language}
                    />

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAdvancedControls(prev => prev === `${verse.number}` ? null : `${verse.number}`);
                      }}
                      className="p-1 sm:p-1.5 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                      title={language === 'fr' ? 'Contrôles avancés' : 'تحكم متقدم'}
                    >
                      <Settings size={12} className="sm:w-4 sm:h-4 text-[#43ada4] dark:text-[#43ada4]" />
                    </button>
                  </div>

                  {showAdvancedControls === `${verse.number}` && (
                    <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 z-50 min-w-[200px] sm:min-w-[250px]">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm sm:text-base">
                          {language === 'fr' ? 'Contrôles Audio' : 'تحكم الصوت'}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAdvancedControls(null);
                          }}
                          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          <X size={14} className="sm:w-4 sm:h-4" />
                        </button>
                      </div>

                      <div className="space-y-2 sm:space-y-3">
                        <div>
                          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1 sm:mb-2">
                            {language === 'fr' ? 'Navigation' : 'التنقل'}
                          </label>
                          <div className="flex justify-center space-x-1 sm:space-x-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
                              className="p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                              <SkipBack size={14} className="sm:w-4 sm:h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleNext(); }}
                              className="p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                              <SkipForward size={14} className="sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1 sm:mb-2">
                            {language === 'fr' ? 'Répétition' : 'التكرار'}
                          </label>
                          <div className="flex justify-center space-x-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRepeatModeChange('none'); }}
                              className={`p-1.5 sm:p-2 rounded text-xs ${
                                audioManager.getRepeatMode() === 'none'
                                  ? 'bg-[#43ada4]/10 dark:bg-[#43ada4]/20 text-[#43ada4] dark:text-[#43ada4]'
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              <Play size={12} className="sm:w-4 sm:h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRepeatModeChange('one'); }}
                              className={`p-1.5 sm:p-2 rounded text-xs ${
                                audioManager.getRepeatMode() === 'one'
                                  ? 'bg-[#43ada4]/10 dark:bg-[#43ada4]/20 text-[#43ada4] dark:text-[#43ada4]'
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              <Repeat1 size={12} className="sm:w-4 sm:h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRepeatModeChange('all'); }}
                              className={`p-1.5 sm:p-2 rounded text-xs ${
                                audioManager.getRepeatMode() === 'all'
                                  ? 'bg-[#43ada4]/10 dark:bg-[#43ada4]/20 text-[#43ada4] dark:text-[#43ada4]'
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              <Repeat size={12} className="sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1 sm:mb-2">
                            {language === 'fr' ? 'Vitesse' : 'السرعة'}: {audioManager.getPlaybackRate()}x
                          </label>
                          <input
                            type="range"
                            min="0.25"
                            max="2"
                            step="0.25"
                            value={audioManager.getPlaybackRate()}
                            onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full h-1 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-3 sm:mb-4">
                <p className="text-lg sm:text-2xl leading-relaxed font-arabic text-gray-900 dark:text-white text-right mb-3 sm:mb-4" dir="rtl">
                  {cleanVerseText(verse.text, verse.surah.number, verse.numberInSurah)}
                </p>

                {verse.translation && (
                  <p className="text-sm sm:text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                    {verse.translation}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1 sm:gap-2 pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleBookmark(verse); }}
                  className={`flex items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    isBookmarkedVerse
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
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
                  onClick={(e) => { e.stopPropagation(); openNotesForAyah(ayahRef); }}
                  className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <BookMarked size={14} className={`sm:w-4 sm:h-4 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                  <span className="hidden sm:inline">
                    {language === 'fr' ? 'Notes' : 'ملاحظات'}
                  </span>
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); openDictionaryWithWord(''); }}
                  className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
    </div>
  );
}
