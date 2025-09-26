import React, { useState, useEffect } from 'react';
import { Search, Book, BookOpen, BookMarked, HelpCircle, Languages, Sun, Moon, Menu, X } from 'lucide-react';
import axios from 'axios';
import { AudioPlayer } from './components/AudioPlayer';
import { Notes } from './components/modals/Notes';
import { Bookmarks } from './components/modals/Bookmarks';
import { Dictionary } from './components/modals/Dictionary';
import HelpPage from './components/modals/HelpPage';
import { MobileMenu } from './components/layout/MobileMenu';
import { NavigationSwitch } from './components/layout/NavigationSwitch';
import { AnimatedLogo } from './components/icons/AnimatedLogo';
import { QuranReader } from './components/QuranReader';
import { HighlightedText } from './components/HighlightedText';
import { advancedArabicSearch, containsArabic } from './utils/arabicNormalization';

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

interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

function App() {
  // États principaux
  const [currentView, setCurrentView] = useState<'search' | 'reader'>('search');
  const [searchType, setSearchType] = useState<'text' | 'surah' | 'ayah'>('text');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<QuranVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'fr' | 'ar'>('fr');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentReciter, setCurrentReciter] = useState('ar.alafasy');

  // États des modals
  const [showNotes, setShowNotes] = useState(false);
  const [showAllNotes, setShowAllNotes] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showDictionary, setShowDictionary] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentAyahForNotes, setCurrentAyahForNotes] = useState('');
  const [dictionaryWord, setDictionaryWord] = useState('');

  // États pour la lecture
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<number>(1);
  const [surahVerses, setSurahVerses] = useState<QuranVerse[]>([]);
  const [loadingSurah, setLoadingSurah] = useState(false);

  // Options de recherche
  const [searchOptions, setSearchOptions] = useState({
    ignoreDiacritics: true,
    caseSensitive: false,
    exactMatch: false,
    arabicSearchMode: 'words' as 'words' | 'partial' | 'exact'
  });

  // Charger le thème depuis localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDarkMode(shouldUseDark);
    document.documentElement.classList.toggle('dark', shouldUseDark);
  }, []);

  // Charger la langue depuis localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as 'fr' | 'ar';
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Charger le récitateur depuis localStorage
  useEffect(() => {
    const savedReciter = localStorage.getItem('currentReciter');
    if (savedReciter) {
      setCurrentReciter(savedReciter);
    }
  }, []);

  // Charger la liste des sourates
  useEffect(() => {
    const loadSurahs = async () => {
      try {
        const response = await axios.get('https://api.alquran.cloud/v1/surah');
        setSurahs(response.data.data);
      } catch (err) {
        console.error('Erreur lors du chargement des sourates:', err);
      }
    };
    loadSurahs();
  }, []);

  // Charger les versets de la sourate sélectionnée
  useEffect(() => {
    if (currentView === 'reader' && selectedSurah) {
      loadSurahVerses(selectedSurah);
    }
  }, [currentView, selectedSurah]);

  const loadSurahVerses = async (surahNumber: number) => {
    setLoadingSurah(true);
    try {
      const [arabicResponse, frenchResponse] = await Promise.all([
        axios.get(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`),
        axios.get(`https://api.alquran.cloud/v1/surah/${surahNumber}/fr.hamidullah`)
      ]);

      const arabicVerses = arabicResponse.data.data.ayahs;
      const frenchVerses = frenchResponse.data.data.ayahs;

      const combinedVerses: QuranVerse[] = arabicVerses.map((arabicVerse: any, index: number) => ({
        number: arabicVerse.number,
        text: arabicVerse.text,
        translation: frenchVerses[index]?.text || '',
        surah: {
          number: arabicResponse.data.data.number,
          name: arabicResponse.data.data.name,
          englishName: arabicResponse.data.data.englishName,
          englishNameTranslation: arabicResponse.data.data.englishNameTranslation,
          numberOfAyahs: arabicResponse.data.data.numberOfAyahs
        },
        numberInSurah: arabicVerse.numberInSurah
      }));

      setSurahVerses(combinedVerses);
    } catch (err) {
      console.error('Erreur lors du chargement des versets:', err);
      setError(language === 'fr' 
        ? 'Erreur lors du chargement des versets' 
        : 'خطأ في تحميل الآيات');
    } finally {
      setLoadingSurah(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'fr' ? 'ar' : 'fr';
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  const handleReciterChange = (reciter: string) => {
    setCurrentReciter(reciter);
    localStorage.setItem('currentReciter', reciter);
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      let searchResults: QuranVerse[] = [];

      if (searchType === 'surah') {
        const surahNumber = parseInt(searchQuery);
        if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
          throw new Error(language === 'fr' 
            ? 'Numéro de sourate invalide (1-114)' 
            : 'رقم السورة غير صحيح (١-١١٤)');
        }

        const [arabicResponse, frenchResponse] = await Promise.all([
          axios.get(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`),
          axios.get(`https://api.alquran.cloud/v1/surah/${surahNumber}/fr.hamidullah`)
        ]);

        const arabicVerses = arabicResponse.data.data.ayahs;
        const frenchVerses = frenchResponse.data.data.ayahs;

        searchResults = arabicVerses.map((arabicVerse: any, index: number) => ({
          number: arabicVerse.number,
          text: arabicVerse.text,
          translation: frenchVerses[index]?.text || '',
          surah: {
            number: arabicResponse.data.data.number,
            name: arabicResponse.data.data.name,
            englishName: arabicResponse.data.data.englishName,
            englishNameTranslation: arabicResponse.data.data.englishNameTranslation,
            numberOfAyahs: arabicResponse.data.data.numberOfAyahs
          },
          numberInSurah: arabicVerse.numberInSurah
        }));

      } else if (searchType === 'ayah') {
        const parts = searchQuery.split(':');
        if (parts.length !== 2) {
          throw new Error(language === 'fr' 
            ? 'Format invalide. Utilisez: sourate:verset (ex: 2:255)' 
            : 'تنسيق غير صحيح. استخدم: سورة:آية (مثال: ٢:٢٥٥)');
        }

        const surahNumber = parseInt(parts[0]);
        const ayahNumber = parseInt(parts[1]);

        if (isNaN(surahNumber) || isNaN(ayahNumber)) {
          throw new Error(language === 'fr' 
            ? 'Numéros invalides' 
            : 'أرقام غير صحيحة');
        }

        const [arabicResponse, frenchResponse] = await Promise.all([
          axios.get(`https://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNumber}/quran-uthmani`),
          axios.get(`https://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNumber}/fr.hamidullah`)
        ]);

        const arabicVerse = arabicResponse.data.data;
        const frenchVerse = frenchResponse.data.data;

        searchResults = [{
          number: arabicVerse.number,
          text: arabicVerse.text,
          translation: frenchVerse.text || '',
          surah: {
            number: arabicVerse.surah.number,
            name: arabicVerse.surah.name,
            englishName: arabicVerse.surah.englishName,
            englishNameTranslation: arabicVerse.surah.englishNameTranslation,
            numberOfAyahs: arabicVerse.surah.numberOfAyahs
          },
          numberInSurah: arabicVerse.numberInSurah
        }];

      } else {
        const [arabicResponse, frenchResponse] = await Promise.all([
          axios.get('https://api.alquran.cloud/v1/quran/quran-uthmani'),
          axios.get('https://api.alquran.cloud/v1/quran/fr.hamidullah')
        ]);

        const arabicVerses = arabicResponse.data.data.ayahs;
        const frenchVerses = frenchResponse.data.data.ayahs;

        const allVerses: QuranVerse[] = arabicVerses.map((arabicVerse: any, index: number) => ({
          number: arabicVerse.number,
          text: arabicVerse.text,
          translation: frenchVerses[index]?.text || '',
          surah: {
            number: arabicVerse.surah.number,
            name: arabicVerse.surah.name,
            englishName: arabicVerse.surah.englishName,
            englishNameTranslation: arabicVerse.surah.englishNameTranslation,
            numberOfAyahs: arabicVerse.surah.numberOfAyahs
          },
          numberInSurah: arabicVerse.numberInSurah
        }));

        const isArabicSearch = containsArabic(searchQuery);
        
        searchResults = allVerses.filter(verse => {
          if (isArabicSearch) {
            return advancedArabicSearch(verse.text, searchQuery, searchOptions.arabicSearchMode, {
              ignoreDiacritics: searchOptions.ignoreDiacritics,
              fuzzyThreshold: 0.8
            });
          } else {
            if (!verse.translation) return false;
            
            if (searchOptions.exactMatch) {
              return searchOptions.caseSensitive 
                ? verse.translation === searchQuery
                : verse.translation.toLowerCase() === searchQuery.toLowerCase();
            }
            
            const text = searchOptions.caseSensitive ? verse.translation : verse.translation.toLowerCase();
            const query = searchOptions.caseSensitive ? searchQuery : searchQuery.toLowerCase();
            
            return text.includes(query);
          }
        });
      }

      setResults(searchResults);
      
      if (searchResults.length === 0) {
        setError(language === 'fr' 
          ? 'Aucun résultat trouvé' 
          : 'لم يتم العثور على نتائج');
      }

    } catch (err: any) {
      console.error('Erreur de recherche:', err);
      setError(err.message || (language === 'fr' 
        ? 'Erreur lors de la recherche' 
        : 'خطأ في البحث'));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const getAudioUrl = (globalAyahNumber: number): string => {
    const paddedNumber = globalAyahNumber.toString().padStart(3, '0');
    return `https://cdn.islamic.network/quran/audio-surah/128/${currentReciter}/${paddedNumber}.mp3`;
  };

  const isBookmarked = (ayahRef: string): boolean => {
    const bookmarks = JSON.parse(localStorage.getItem('quranBookmarks') || '[]');
    return bookmarks.some((bookmark: any) => bookmark.ayahRef === ayahRef);
  };

  const toggleBookmark = (verse: QuranVerse) => {
    const ayahRef = `${verse.surah.number}:${verse.numberInSurah}`;
    const bookmarks = JSON.parse(localStorage.getItem('quranBookmarks') || '[]');
    
    const existingIndex = bookmarks.findIndex((bookmark: any) => bookmark.ayahRef === ayahRef);
    
    if (existingIndex >= 0) {
      bookmarks.splice(existingIndex, 1);
    } else {
      bookmarks.push({
        ayahRef,
        text: verse.translation || verse.text,
        surahName: verse.surah.name,
        surahNumber: verse.surah.number,
        ayahNumber: verse.numberInSurah,
        timestamp: Date.now()
      });
    }
    
    localStorage.setItem('quranBookmarks', JSON.stringify(bookmarks));
  };

  const openNotesForAyah = (ayahRef: string) => {
    setCurrentAyahForNotes(ayahRef);
    setShowNotes(true);
    setShowAllNotes(false);
  };

  const openAllNotes = () => {
    setShowAllNotes(true);
    setShowNotes(true);
    setCurrentAyahForNotes('');
  };

  const openDictionaryWithWord = (word: string) => {
    setDictionaryWord(word);
    setShowDictionary(true);
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo et titre */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10">
                <AnimatedLogo isDarkMode={isDarkMode} className="w-full h-full" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {language === 'fr' ? 'Le Jardin du Coran' : 'حديقة القرآن'}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {language === 'fr' ? 'Recherche et lecture du Saint Coran' : 'البحث وقراءة القرآن الكريم'}
                </p>
              </div>
            </div>

            {/* Navigation centrale - Desktop */}
            <div className="hidden md:flex items-center">
              <NavigationSwitch
                currentView={currentView}
                onViewChange={setCurrentView}
                language={language}
              />
            </div>

            {/* Actions - Desktop */}
            <div className="hidden md:flex items-center space-x-2">
              <button
                onClick={() => setShowDictionary(true)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={language === 'fr' ? 'Dictionnaire' : 'القاموس'}
              >
                <BookOpen size={20} />
              </button>

              <button
                onClick={() => setShowBookmarks(true)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={language === 'fr' ? 'Favoris' : 'المفضلة'}
              >
                <BookMarked size={20} />
              </button>

              <button
                onClick={openAllNotes}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={language === 'fr' ? 'Notes' : 'الملاحظات'}
              >
                <BookMarked size={20} />
              </button>

              <button
                onClick={() => setShowHelp(true)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={language === 'fr' ? 'Aide' : 'المساعدة'}
              >
                <HelpCircle size={20} />
              </button>

              <button
                onClick={toggleLanguage}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={language === 'fr' ? 'العربية' : 'Français'}
              >
                <Languages size={20} />
              </button>

              <button
                onClick={toggleTheme}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={language === 'fr' ? 'Changer le thème' : 'تغيير المظهر'}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>

            {/* Menu mobile */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={toggleLanguage}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Languages size={18} />
              </button>
              
              <button
                onClick={() => setShowMobileMenu(true)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>

          {/* Navigation mobile */}
          <div className="md:hidden pb-4">
            <NavigationSwitch
              currentView={currentView}
              onViewChange={setCurrentView}
              language={language}
            />
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentView === 'search' ? (
          <div className="space-y-6">
            {/* Interface de recherche */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
              <div className="space-y-4">
                {/* Type de recherche */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'text', label: language === 'fr' ? 'Texte' : 'نص', icon: Search },
                    { value: 'surah', label: language === 'fr' ? 'Sourate' : 'سورة', icon: Book },
                    { value: 'ayah', label: language === 'fr' ? 'Verset' : 'آية', icon: BookOpen }
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setSearchType(value as any)}
                      className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        searchType === value
                          ? 'bg-[#43ada4] text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Icon size={16} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Barre de recherche */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={
                        searchType === 'text' 
                          ? (language === 'fr' ? 'Rechercher dans le Coran...' : 'البحث في القرآن...')
                          : searchType === 'surah'
                          ? (language === 'fr' ? 'Numéro de sourate (1-114)' : 'رقم السورة (١-١١٤)')
                          : (language === 'fr' ? 'Format: sourate:verset (ex: 2:255)' : 'تنسيق: سورة:آية (مثال: ٢:٢٥٥)')
                      }
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#43ada4] transition-colors duration-200"
                      dir={containsArabic(searchQuery) ? 'rtl' : 'ltr'}
                    />
                  </div>
                  <button
                    onClick={performSearch}
                    disabled={loading || !searchQuery.trim()}
                    className="px-6 py-3 bg-[#43ada4] text-white rounded-lg hover:bg-[#3a9690] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[120px]"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Search size={18} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                        {language === 'fr' ? 'Rechercher' : 'بحث'}
                      </>
                    )}
                  </button>
                </div>

                {/* Options de recherche pour le texte */}
                {searchType === 'text' && (
                  <div className="flex flex-wrap gap-4 text-sm">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={searchOptions.ignoreDiacritics}
                        onChange={(e) => setSearchOptions(prev => ({ ...prev, ignoreDiacritics: e.target.checked }))}
                        className="mr-2 text-[#43ada4] focus:ring-[#43ada4]"
                      />
                      {language === 'fr' ? 'Ignorer les diacritiques' : 'تجاهل التشكيل'}
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={searchOptions.exactMatch}
                        onChange={(e) => setSearchOptions(prev => ({ ...prev, exactMatch: e.target.checked }))}
                        className="mr-2 text-[#43ada4] focus:ring-[#43ada4]"
                      />
                      {language === 'fr' ? 'Correspondance exacte' : 'مطابقة تامة'}
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Résultats */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {results.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {language === 'fr' 
                      ? `${results.length} résultat${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''}`
                      : `تم العثور على ${results.length} نتيجة`}
                  </h2>
                </div>
                <div className="max-h-[70vh] overflow-y-auto scrollbar-thin">
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {results.map((verse) => {
                      const ayahRef = `${verse.surah.number}:${verse.numberInSurah}`;
                      return (
                        <div key={verse.number} className="p-6 ayah-verse hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <span className="inline-block px-3 py-1 bg-[#43ada4]/10 dark:bg-[#43ada4]/20 text-[#43ada4] dark:text-[#43ada4] rounded-full text-sm font-medium mb-2">
                                {ayahRef}
                              </span>
                              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {verse.surah.name} - {verse.surah.englishName}
                              </h3>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="text-right">
                              <p className="text-2xl sm:text-3xl leading-relaxed font-arabic text-gray-900 dark:text-white" dir="rtl">
                                {searchQuery && searchType === 'text' ? (
                                  <HighlightedText
                                    text={verse.text}
                                    searchTerm={searchQuery}
                                    searchOptions={searchOptions}
                                    language="ar"
                                    enableBilingualHighlighting={true}
                                    otherLanguageText={verse.translation}
                                  />
                                ) : (
                                  verse.text
                                )}
                              </p>
                            </div>

                            {verse.translation && (
                              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                                  {searchQuery && searchType === 'text' ? (
                                    <HighlightedText
                                      text={verse.translation}
                                      searchTerm={searchQuery}
                                      searchOptions={searchOptions}
                                      language="fr"
                                      enableBilingualHighlighting={true}
                                      otherLanguageText={verse.text}
                                    />
                                  ) : (
                                    verse.translation
                                  )}
                                </p>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center space-x-3">
                                <AudioPlayer
                                  audioUrl={getAudioUrl(verse.number)}
                                  minimal={true}
                                  currentReciter={currentReciter}
                                  onReciterChange={handleReciterChange}
                                  language={language}
                                />
                              </div>

                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => toggleBookmark(verse)}
                                  className={`p-2 rounded-full transition-colors ${
                                    isBookmarked(ayahRef)
                                      ? 'text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/20'
                                      : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                                  }`}
                                  title={language === 'fr' ? 'Ajouter aux favoris' : 'إضافة إلى المفضلة'}
                                >
                                  <svg className="w-5 h-5" fill={isBookmarked(ayahRef) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                </button>

                                <button
                                  onClick={() => openNotesForAyah(ayahRef)}
                                  className="p-2 text-gray-400 hover:text-[#43ada4] hover:bg-[#43ada4]/10 dark:hover:bg-[#43ada4]/20 rounded-full transition-colors"
                                  title={language === 'fr' ? 'Ajouter une note' : 'إضافة ملاحظة'}
                                >
                                  <BookMarked size={20} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <QuranReader
            surahs={surahs}
            selectedSurah={selectedSurah}
            onSurahChange={setSelectedSurah}
            verses={surahVerses}
            loading={loadingSurah}
            language={language}
            currentReciter={currentReciter}
            onReciterChange={handleReciterChange}
            getAudioUrl={getAudioUrl}
            isBookmarked={isBookmarked}
            toggleBookmark={toggleBookmark}
            openNotesForAyah={openNotesForAyah}
            openDictionaryWithWord={openDictionaryWithWord}
          />
        )}
      </main>

      {/* Modals */}
      <Notes
        isOpen={showNotes}
        onClose={() => setShowNotes(false)}
        ayahReference={currentAyahForNotes}
        language={language}
        viewAll={showAllNotes}
      />

      <Bookmarks
        isOpen={showBookmarks}
        onClose={() => setShowBookmarks(false)}
        language={language}
      />

      <Dictionary
        isOpen={showDictionary}
        onClose={() => setShowDictionary(false)}
        initialWord={dictionaryWord}
        language={language}
      />

      <HelpPage
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        language={language}
      />

      <MobileMenu
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        currentView={currentView}
        onViewChange={setCurrentView}
        language={language}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        toggleLanguage={toggleLanguage}
        setShowDictionary={setShowDictionary}
        setShowBookmarks={setShowBookmarks}
        setShowHelp={setShowHelp}
        currentReciter={currentReciter}
        onReciterChange={handleReciterChange}
      />
    </div>
  );
}

export default App;