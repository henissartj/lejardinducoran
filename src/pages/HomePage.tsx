import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Book, Hash, AlignLeft, Loader2, X, Heart, BookMarked, BookOpen } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { HighlightedText } from '../components/HighlightedText';
import { AudioPlayer } from '../components/AudioPlayer';
import { advancedArabicSearch } from '../utils/arabicNormalization';
import AudioManager from '../utils/AudioManager';

export default function HomePage() {
  const navigate = useNavigate();
  const {
    language,
    currentReciter,
    setCurrentReciter,
    allVerses,
    loadAllVerses,
    getAudioUrl,
    isBookmarked,
    toggleBookmark,
    openNotesForAyah,
    openDictionaryWithWord,
    handleVerseClick,
    getSurahDisplayName,
    globalAudioState,
    audioManager
  } = useAppContext();

  const [searchType, setSearchType] = useState<'surah' | 'verse' | 'text'>('surah');
  const [query, setQuery] = useState('');
  const [surahResults, setSurahResults] = useState<any[]>([]);
  const [verseResults, setVerseResults] = useState<any[]>([]);
  const [textSearchResults, setTextSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchOptions, setSearchOptions] = useState({
    exactMatch: false,
    caseSensitive: false,
    ignoreDiacritics: true,
    arabicSearchMode: 'words' as 'words' | 'partial' | 'exact'
  });

  const performSurahSearch = async (surahNumber: string) => {
    if (!surahNumber.trim()) {
      setSurahResults([]);
      return;
    }

    const surahNum = parseInt(surahNumber);
    if (isNaN(surahNum) || surahNum < 1 || surahNum > 114) {
      setError(language === 'fr' ? 'Numéro de sourate invalide (1-114)' : 'رقم سورة غير صالح (١-١١٤)');
      return;
    }

    navigate(`/surah/${surahNum}`);
  };

  const performVerseSearch = async (verseRef: string) => {
    if (!verseRef.trim()) {
      setVerseResults([]);
      return;
    }

    const parts = verseRef.split(':');
    if (parts.length !== 2) {
      setError(language === 'fr' ? 'Format invalide (ex: 2:255)' : 'تنسيق غير صالح (مثال: ٢:٢٥٥)');
      return;
    }

    const surahNum = parseInt(parts[0]);
    const verseNum = parseInt(parts[1]);

    if (isNaN(surahNum) || isNaN(verseNum) || surahNum < 1 || surahNum > 114 || verseNum < 1) {
      setError(language === 'fr' ? 'Référence invalide' : 'مرجع غير صالح');
      return;
    }

    navigate(`/verse/${surahNum}/${verseNum}`);
  };

  const performTextSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setTextSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setTextSearchResults([]);

      const verses = await loadAllVerses();

      if (!verses || verses.length === 0) {
        throw new Error('No verses loaded');
      }

      const results = verses.filter(verse => {
        try {
          let arabicMatch = false;
          if (verse.text) {
            if (searchOptions.exactMatch) {
              arabicMatch = advancedArabicSearch(verse.text, searchQuery, {
                searchMode: 'exact',
                ignoreDiacritics: searchOptions.ignoreDiacritics,
                caseSensitive: searchOptions.caseSensitive
              });
            } else {
              arabicMatch = advancedArabicSearch(verse.text, searchQuery, {
                searchMode: searchOptions.arabicSearchMode,
                ignoreDiacritics: searchOptions.ignoreDiacritics,
                fuzzyThreshold: 0.7,
                caseSensitive: searchOptions.caseSensitive
              });
            }
          }

          let translationMatch = false;
          if (verse.translation) {
            const processedTranslation = searchOptions.caseSensitive
              ? verse.translation
              : verse.translation.toLowerCase();
            const processedQuery = searchOptions.caseSensitive
              ? searchQuery
              : searchQuery.toLowerCase();

            if (searchOptions.exactMatch) {
              const words = processedTranslation.split(/\s+/);
              translationMatch = words.some(word =>
                word.replace(/[.,!?;:]/g, '') === processedQuery
              );
            } else {
              if (searchOptions.arabicSearchMode === 'words') {
                const regex = new RegExp(`\\b${processedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                translationMatch = regex.test(processedTranslation);
              } else {
                translationMatch = processedTranslation.includes(processedQuery);
              }
            }
          }

          return arabicMatch || translationMatch;
        } catch (searchError) {
          console.warn('Search error for verse:', verse.number, searchError);
          return false;
        }
      });

      setTextSearchResults(results);

      if (results.length === 0) {
        setError(language === 'fr'
          ? `Aucun résultat trouvé pour "${searchQuery}"`
          : `لم يتم العثور على نتائج لـ "${searchQuery}"`);
      }

    } catch (err) {
      console.error('Text search error:', err);
      const errorMessage = language === 'fr'
        ? 'Erreur lors de la recherche textuelle'
        : 'خطأ في البحث النصي';
      setError(errorMessage);
      setTextSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    if (globalAudioState.isSurahPlaying) {
      audioManager.stopSurahPlayback();
    }

    setError(null);

    switch (searchType) {
      case 'surah':
        await performSurahSearch(query);
        break;
      case 'verse':
        await performVerseSearch(query);
        break;
      case 'text':
        await performTextSearch(query);
        break;
    }
  };

  const getDisplayResults = () => {
    switch (searchType) {
      case 'surah':
        return surahResults;
      case 'verse':
        return verseResults;
      case 'text':
        return textSearchResults;
      default:
        return [];
    }
  };

  const displayResults = getDisplayResults();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 transition-colors duration-200">
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 sm:mb-6">
          <button
            onClick={() => setSearchType('surah')}
            className={`flex items-center px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              searchType === 'surah'
                ? 'bg-[#43ada4] text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Book size={16} className={language === 'ar' ? 'ml-1 sm:ml-2' : 'mr-1 sm:mr-2'} />
            {language === 'fr' ? 'Sourate' : 'سورة'}
          </button>

          <button
            onClick={() => setSearchType('verse')}
            className={`flex items-center px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              searchType === 'verse'
                ? 'bg-[#43ada4] text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Hash size={16} className={language === 'ar' ? 'ml-1 sm:ml-2' : 'mr-1 sm:mr-2'} />
            {language === 'fr' ? 'Verset' : 'آية'}
          </button>

          <button
            onClick={() => setSearchType('text')}
            className={`flex items-center px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              searchType === 'text'
                ? 'bg-[#43ada4] text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <AlignLeft size={16} className={language === 'ar' ? 'ml-1 sm:ml-2' : 'mr-1 sm:mr-2'} />
            {language === 'fr' ? 'Texte' : 'نص'}
          </button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={
                searchType === 'surah'
                  ? (language === 'fr' ? 'Numéro de sourate (1-114)' : 'رقم السورة (١-١١٤)')
                  : searchType === 'verse'
                  ? (language === 'fr' ? 'Référence (ex: 2:255)' : 'المرجع (مثال: ٢:٢٥٥)')
                  : (language === 'fr' ? 'Rechercher un mot ou une phrase...' : 'البحث عن كلمة أو عبارة...')
              }
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#43ada4] text-base sm:text-lg"
              dir={searchType === 'text' && language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-[#43ada4] text-white rounded-lg hover:bg-[#3a9690] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[100px] sm:min-w-[120px] text-sm sm:text-base"
          >
            {loading ? (
              <Loader2 size={16} className="sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <>
                <Search size={16} className={`sm:w-5 sm:h-5 ${language === 'ar' ? 'ml-1 sm:ml-2' : 'mr-1 sm:mr-2'}`} />
                <span className="hidden sm:inline">
                  {language === 'fr' ? 'Rechercher' : 'بحث'}
                </span>
              </>
            )}
          </button>
        </div>

        {searchType === 'text' && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {language === 'fr' ? 'Options de recherche' : 'خيارات البحث'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={searchOptions.exactMatch}
                  onChange={(e) => setSearchOptions(prev => ({ ...prev, exactMatch: e.target.checked }))}
                  className="rounded border-gray-300 text-[#43ada4] focus:ring-[#43ada4]"
                />
                <span className="ml-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  {language === 'fr' ? 'Correspondance exacte' : 'مطابقة تامة'}
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={searchOptions.caseSensitive}
                  onChange={(e) => setSearchOptions(prev => ({ ...prev, caseSensitive: e.target.checked }))}
                  className="rounded border-gray-300 text-[#43ada4] focus:ring-[#43ada4]"
                />
                <span className="ml-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  {language === 'fr' ? 'Sensible à la casse' : 'حساس للأحرف'}
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={searchOptions.ignoreDiacritics}
                  onChange={(e) => setSearchOptions(prev => ({ ...prev, ignoreDiacritics: e.target.checked }))}
                  className="rounded border-gray-300 text-[#43ada4] focus:ring-[#43ada4]"
                />
                <span className="ml-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  {language === 'fr' ? 'Ignorer les diacritiques' : 'تجاهل التشكيل'}
                </span>
              </label>

              <div>
                <select
                  value={searchOptions.arabicSearchMode}
                  onChange={(e) => setSearchOptions(prev => ({ ...prev, arabicSearchMode: e.target.value as any }))}
                  className="w-full px-2 sm:px-3 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#43ada4]"
                >
                  <option value="words">{language === 'fr' ? 'Mots entiers (recommandé)' : 'كلمات كاملة (موصى به)'}</option>
                  <option value="partial">{language === 'fr' ? 'Correspondance partielle' : 'مطابقة جزئية'}</option>
                  <option value="exact">{language === 'fr' ? 'Correspondance exacte' : 'مطابقة تامة'}</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400 text-center">{error}</p>
        </div>
      ) : displayResults.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200">
              {language === 'fr' ? 'Résultats' : 'النتائج'} ({displayResults.length})
            </h2>
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setSurahResults([]);
                  setVerseResults([]);
                  setTextSearchResults([]);
                  setError(null);
                }}
                className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center"
              >
                <X size={14} className={`sm:w-4 sm:h-4 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                {language === 'fr' ? 'Effacer' : 'مسح'}
              </button>
            )}
          </div>

          {displayResults.map((verse, index) => {
            const ayahRef = `${verse.surah.number}:${verse.numberInSurah}`;
            const isBookmarkedVerse = isBookmarked(ayahRef);

            return (
              <div
                key={`${verse.number}-${index}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 transition-all duration-200 cursor-pointer hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-750 border border-transparent hover:border-[#43ada4]/20"
                onClick={() => navigate(`/verse/${verse.surah.number}/${verse.numberInSurah}`)}
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center">
                    <span className="text-xs font-medium bg-[#43ada4]/10 dark:bg-[#43ada4]/20 text-[#43ada4] dark:text-[#43ada4] px-2 py-0.5 sm:py-1 rounded-full">
                      {ayahRef}
                    </span>
                    {verse.surah && (
                      <span className="ml-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                        {getSurahDisplayName(verse.surah.number)}
                      </span>
                    )}
                  </div>
                  <AudioPlayer
                    audioUrl={getAudioUrl(verse.number)}
                    minimal={true}
                    currentReciter={currentReciter}
                    onReciterChange={setCurrentReciter}
                    language={language}
                    enableBilingualHighlighting={true}
                    otherLanguageText={verse.translation}
                  />
                </div>

                <div className="mb-3 sm:mb-4">
                  <p className="text-lg sm:text-2xl leading-relaxed font-arabic text-gray-900 dark:text-white text-right" dir="rtl">
                    {searchType === 'text' && query ? (
                      <HighlightedText
                        text={verse.text}
                        searchTerm={query}
                        searchOptions={searchOptions}
                        language="ar"
                        enableBilingualHighlighting={true}
                        otherLanguageText={verse.translation || ''}
                      />
                    ) : (
                      verse.text
                    )}
                  </p>
                </div>

                {verse.translation && (
                  <div className="mb-3 sm:mb-4">
                    <p className="text-sm sm:text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                      {searchType === 'text' && query ? (
                        <HighlightedText
                          text={verse.translation}
                          searchTerm={query}
                          searchOptions={searchOptions}
                          language="fr"
                          enableBilingualHighlighting={true}
                          otherLanguageText={verse.text || ''}
                        />
                      ) : (
                        verse.translation
                      )}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-1 sm:gap-2 pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleBookmark(verse); }}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
                    className="flex items-center px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <BookMarked size={14} className={`sm:w-4 sm:h-4 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                    <span className="hidden sm:inline">
                      {language === 'fr' ? 'Notes' : 'ملاحظات'}
                    </span>
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); openDictionaryWithWord(''); }}
                    className="flex items-center px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
      ) : !query && !loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sm:p-8 text-center transition-colors duration-200">
          <div className="max-w-md mx-auto">
            <Search size={32} className="sm:w-12 sm:h-12 mx-auto text-[#43ada4] dark:text-[#43ada4] mb-4" />
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              {language === 'fr' ? 'Bienvenue dans le Jardin du Coran' : 'مرحباً بك في حديقة القرآن'}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
              {language === 'fr'
                ? 'Recherchez dans le Coran par sourate, verset ou mot-clé. La recherche arabe propose plusieurs modes de précision pour de meilleurs résultats.'
                : 'ابحث في القرآن بالسورة أو الآية أو الكلمة المفتاحية. يوفر البحث العربي عدة أوضاع دقة للحصول على أفضل النتائج.'}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
