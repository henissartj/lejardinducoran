import React, { useState, useEffect } from 'react';
import { Search, Book, BookOpen, BookMarked, Heart, HelpCircle, Menu, X, Hash, AlignLeft, Languages, Settings, BookOpenCheck, Sun, Moon, ArrowUp, Eye, EyeOff } from 'lucide-react';
import { AudioPlayer } from './components/AudioPlayer';
import { Dictionary } from './components/Dictionary';
import { Bookmarks } from './components/Bookmarks';
import { Notes } from './components/Notes';
import { HighlightedText } from './components/HighlightedText';
import { QuranReader } from './components/QuranReader';
import HelpPage from './components/HelpPage';
import { prepareArabicSearchQuery, containsArabic, performArabicSearch } from './utils/arabicNormalization';
import axios, { AxiosError } from 'axios';

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

interface SearchResult {
  verses: QuranVerse[];
  total: number;
}

// Cache spécifique par langue
interface LanguageCache {
  fr: Map<number, QuranVerse[]>;
  ar: Map<number, QuranVerse[]>;
}

function App() {
  const [language, setLanguage] = useState('fr');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'search' | 'read'>('search');
  const [searchType, setSearchType] = useState<'surah' | 'ayah' | 'text'>('surah');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSearchTerm, setCurrentSearchTerm] = useState(''); // Pour le surlignage
  const [searchResults, setSearchResults] = useState<QuranVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentReciter, setCurrentReciter] = useState('ar.alafasy');
  const [showSearchNavigation, setShowSearchNavigation] = useState(true);
  
  // Modal states
  const [dictionaryOpen, setDictionaryOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [selectedAyahForNotes, setSelectedAyahForNotes] = useState('');
  const [selectedWordForDict, setSelectedWordForDict] = useState('');

  // Search options
  const [exactMatch, setExactMatch] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [ignoreDiacritics, setIgnoreDiacritics] = useState(true);
  const [arabicSearchMode, setArabicSearchMode] = useState<'words' | 'partial' | 'exact'>('words');

  // Cache pour stocker les sourates chargées par langue
  const [suraCache, setSuraCache] = useState<LanguageCache>({
    fr: new Map(),
    ar: new Map()
  });

  // Stocker la dernière recherche pour la recharger lors du changement de langue
  const [lastSearch, setLastSearch] = useState<{
    type: 'surah' | 'ayah' | 'text';
    query: string;
  } | null>(null);

  // Gestion du thème
  useEffect(() => {
    // Lire la préférence de thème depuis localStorage au chargement
    const savedTheme = localStorage.getItem('quranAppTheme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Détecter la préférence système si aucune préférence sauvegardée
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  // Appliquer le thème au document et sauvegarder dans localStorage
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('quranAppTheme', theme);
  }, [theme]);

  // Fonction pour basculer le thème
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleReciterChange = (reciter: string) => {
    setCurrentReciter(reciter);
  };

  const getAudioUrl = (globalAyahNumber: number) => {
    const quality = '128';
    return `https://cdn.islamic.network/quran/audio/${quality}/${currentReciter}/${globalAyahNumber}.mp3`;
  };

  // Fonction pour filtrer la basmala (sauf pour Al-Fatiha)
  const filterBasmala = (verses: QuranVerse[], surahNumber: number): QuranVerse[] => {
    // Ne pas filtrer la basmala pour Al-Fatiha (sourate 1)
    if (surahNumber === 1) {
      return verses;
    }

    // Filtrer la basmala pour toutes les autres sourates
    return verses.filter(verse => {
      const text = verse.text.trim();
      
      // Patterns pour identifier la basmala
      const basmallaPatterns = [
        /^بِسْمِ\s*اللَّهِ\s*الرَّحْمَنِ\s*الرَّحِيمِ/,
        /^Au nom d'Allah/i,
        /^Au nom de Dieu/i,
        /^بسم الله الرحمن الرحيم/
      ];
      
      // Vérifier si le verset commence par une basmala
      const isBasmala = basmallaPatterns.some(pattern => pattern.test(text));
      
      // Si c'est une basmala et que ce n'est pas le premier verset d'Al-Fatiha, on la filtre
      if (isBasmala && verse.numberInSurah === 1 && surahNumber !== 1) {
        return false;
      }
      
      return true;
    });
  };

  // Recherche côté client dans les versets chargés - Version améliorée
  const searchInLoadedVerses = (verses: QuranVerse[], searchTerm: string): QuranVerse[] => {
    if (!searchTerm.trim()) return [];
    
    const filteredVerses = verses.filter(verse => {
      const text = verse.text;
      
      if (containsArabic(searchTerm)) {
        // Pour les recherches arabes, utiliser le nouveau système de recherche précis
        return performArabicSearch(text, searchTerm, arabicSearchMode, {
          ignoreDiacritics
        });
      } else {
        // Pour les recherches françaises
        const processedText = caseSensitive ? text : text.toLowerCase();
        const processedSearch = caseSensitive ? searchTerm : searchTerm.toLowerCase();
        
        if (exactMatch) {
          const words = processedText.split(/\s+/);
          const searchWords = processedSearch.trim().split(/\s+/);
          return searchWords.some(searchWord => 
            words.some(word => word === searchWord)
          );
        } else {
          return processedText.includes(processedSearch);
        }
      }
    });

    return filteredVerses;
  };

  // Charger plusieurs sourates pour la recherche textuelle
  const loadMultipleSurasForSearch = async (): Promise<QuranVerse[]> => {
    const allVerses: QuranVerse[] = [];
    const maxSurasToLoad = 15;
    const currentCache = suraCache[language as keyof LanguageCache];
    
    try {
      // Charger les sourates une par une pour éviter la surcharge
      for (let i = 1; i <= maxSurasToLoad; i++) {
        if (!currentCache.has(i)) {
          const verses = await loadSurah(i);
          allVerses.push(...verses);
          
          // Petite pause pour éviter de surcharger l'API
          if (i % 3 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } else {
          allVerses.push(...(currentCache.get(i) || []));
        }
      }
      
      return allVerses;
    } catch (error) {
      console.error('Error loading suras for search:', error);
      return allVerses;
    }
  };

  // Charger une sourate spécifique
  const loadSurah = async (surahNumber: number): Promise<QuranVerse[]> => {
    const currentCache = suraCache[language as keyof LanguageCache];
    
    if (currentCache.has(surahNumber)) {
      return currentCache.get(surahNumber) || [];
    }

    try {
      const url = `https://api.alquran.cloud/v1/surah/${surahNumber}/${language === 'ar' ? 'ar' : 'fr.hamidullah'}`;
      const response = await axios.get(url);
      
      if (response.data.code === 200) {
        const data = response.data.data;
        let verses = data.ayahs.map((ayah: any) => ({
          number: ayah.number,
          text: ayah.text,
          surah: {
            number: data.number,
            name: data.name,
            englishName: data.englishName,
            englishNameTranslation: data.englishNameTranslation,
            numberOfAyahs: data.numberOfAyahs
          },
          numberInSurah: ayah.numberInSurah
        }));
        
        // Filtrer la basmala si nécessaire
        verses = filterBasmala(verses, surahNumber);
        
        // Mettre en cache selon la langue
        setSuraCache(prev => ({
          ...prev,
          [language]: new Map(prev[language as keyof LanguageCache]).set(surahNumber, verses)
        }));
        
        return verses;
      }
    } catch (error) {
      console.error(`Error loading surah ${surahNumber}:`, error);
    }
    
    return [];
  };

  // Effet pour recharger les données quand la langue change
  useEffect(() => {
    // Si on a des résultats de recherche et qu'on change de langue, recharger
    if (lastSearch && searchResults.length > 0 && currentView === 'search') {
      console.log('Language changed, reloading search results...');
      
      // Délai court pour laisser le temps au state de se mettre à jour
      setTimeout(() => {
        performSearch(lastSearch.type, lastSearch.query);
      }, 100);
    }
  }, [language]);

  // Fonction unifiée pour effectuer une recherche
  const performSearch = async (type: string, query: string) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    // Sauvegarder la recherche pour pouvoir la recharger lors du changement de langue
    setLastSearch({ type: type as any, query });
    
    // Sauvegarder le terme de recherche pour le surlignage
    setCurrentSearchTerm(query.trim());
    
    try {
      let url = '';
      let processedQuery = query.trim();
      
      if (type === 'surah') {
        const surahNumber = parseInt(query);
        if (surahNumber < 1 || surahNumber > 114) {
          throw new Error(language === 'fr' ? 'Numéro de sourate invalide (1-114)' : 'رقم سورة غير صحيح (١-١١٤)');
        }
        
        const verses = await loadSurah(surahNumber);
        setSearchResults(verses);
        setCurrentSearchTerm(''); // Pas de surlignage pour les sourates complètes
        
      } else if (type === 'ayah') {
        const [surah, ayah] = query.split(':').map(n => parseInt(n));
        if (!surah || !ayah) {
          throw new Error(language === 'fr' ? 'Format invalide. Utilisez sourate:verset (ex: 1:1)' : 'تنسيق غير صحيح. استخدم سورة:آية (مثال: ١:١)');
        }
        
        url = `https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/${language === 'ar' ? 'ar' : 'fr.hamidullah'}`;
        const response = await axios.get(url);
        
        if (response.data.code === 200) {
          const data = response.data.data;
          const verses = [{
            number: data.number,
            text: data.text,
            surah: data.surah,
            numberInSurah: data.numberInSurah
          }];
          setSearchResults(verses);
          setCurrentSearchTerm(''); // Pas de surlignage pour les versets spécifiques
        } else {
          throw new Error(language === 'fr' ? 'Verset non trouvé' : 'الآية غير موجودة');
        }
        
      } else {
        // Recherche textuelle - approche améliorée
        console.log('Starting text search for:', query);
        
        if (containsArabic(query)) {
          console.log('Arabic search detected, mode:', arabicSearchMode);
          
          // Pour l'arabe, utiliser la recherche côté client améliorée
          const allVerses = await loadMultipleSurasForSearch();
          console.log('Loaded verses:', allVerses.length);
          
          const matchingVerses = searchInLoadedVerses(allVerses, query);
          console.log('Matching verses found:', matchingVerses.length);
          
          if (matchingVerses.length > 0) {
            setSearchResults(matchingVerses);
          } else {
            // Essayer de charger plus de sourates si aucun résultat
            console.log('No results found, loading more suras...');
            const additionalVerses: QuranVerse[] = [];
            
            for (let i = 16; i <= 30; i++) {
              const verses = await loadSurah(i);
              additionalVerses.push(...verses);
              
              // Vérifier si on trouve des résultats au fur et à mesure
              const currentMatches = searchInLoadedVerses([...allVerses, ...additionalVerses], query);
              if (currentMatches.length > 0) {
                setSearchResults(currentMatches);
                return;
              }
            }
            
            const finalMatches = searchInLoadedVerses([...allVerses, ...additionalVerses], query);
            if (finalMatches.length > 0) {
              setSearchResults(finalMatches);
            } else {
              setError(language === 'fr' 
                ? `Aucun résultat trouvé pour "${query}". Essayez de changer le mode de recherche arabe ou utilisez d'autres mots-clés.`
                : `لم يتم العثور على نتائج لـ "${query}". جرب تغيير نمط البحث العربي أو استخدم كلمات مفتاحية أخرى.`);
              setSearchResults([]);
            }
          }
          
        } else {
          // Pour les recherches françaises, essayer d'abord l'API
          try {
            url = `https://api.alquran.cloud/v1/search/${encodeURIComponent(processedQuery)}/all/fr.hamidullah`;
            const response = await axios.get(url);
            
            if (response.data.code === 200 && response.data.data.matches) {
              // Filtrer la basmala des résultats de recherche textuelle
              const filteredMatches = response.data.data.matches.filter((verse: QuranVerse) => {
                const text = verse.text.trim();
                const basmallaPatterns = [
                  /^Au nom d'Allah/i,
                  /^Au nom de Dieu/i
                ];
                return !basmallaPatterns.some(pattern => pattern.test(text));
              });
              
              setSearchResults(filteredMatches);
            } else {
              throw new Error('API search failed');
            }
          } catch (apiError) {
            // Si l'API échoue, utiliser la recherche côté client
            console.log('API search failed, using client-side search');
            const allVerses = await loadMultipleSurasForSearch();
            const matchingVerses = searchInLoadedVerses(allVerses, query);
            
            if (matchingVerses.length > 0) {
              setSearchResults(matchingVerses);
            } else {
              setError(language === 'fr' 
                ? `Aucun résultat trouvé pour "${query}"`
                : `لم يتم العثور على نتائج لـ "${query}"`);
              setSearchResults([]);
            }
          }
        }
      }
      
    } catch (err) {
      console.error('Search error:', err);
      
      let errorMessage = language === 'fr' ? 'Erreur lors de la recherche' : 'خطأ في البحث';
      
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError;
        
        if (axiosError.response?.status === 404) {
          if (type === 'surah') {
            errorMessage = language === 'fr' 
              ? 'Sourate non trouvée. Vérifiez le numéro de sourate (1-114).'
              : 'السورة غير موجودة. تحقق من رقم السورة (١-١١٤).';
          } else if (type === 'ayah') {
            errorMessage = language === 'fr'
              ? 'Verset non trouvé. Le numéro de verset est peut-être invalide pour cette sourate.'
              : 'الآية غير موجودة. قد يكون رقم الآية غير صحيح لهذه السورة.';
          } else {
            errorMessage = language === 'fr'
              ? 'Aucun résultat trouvé pour cette recherche. Essayez avec d\'autres mots-clés.'
              : 'لم يتم العثور على نتائج لهذا البحث. جرب كلمات مفتاحية أخرى.';
          }
        } else if (axiosError.response?.status === 400) {
          errorMessage = language === 'fr'
            ? 'Requête invalide. Vérifiez votre saisie.'
            : 'طلب غير صحيح. تحقق من إدخالك.';
        } else if (axiosError.response?.status >= 500) {
          errorMessage = language === 'fr'
            ? 'Erreur du serveur. Veuillez réessayer plus tard.'
            : 'خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً.';
        } else if (axiosError.code === 'NETWORK_ERROR' || !axiosError.response) {
          errorMessage = language === 'fr'
            ? 'Erreur de connexion. Vérifiez votre connexion internet.'
            : 'خطأ في الاتصال. تحقق من اتصالك بالإنترنت.';
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setSearchResults([]);
      setCurrentSearchTerm(''); // Effacer le terme de recherche en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  const searchQuran = async () => {
    await performSearch(searchType, searchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchQuran();
    }
  };

  // Fonction pour changer de langue avec nettoyage du cache et rechargement
  const handleLanguageChange = (newLanguage: string) => {
    console.log(`Changing language from ${language} to ${newLanguage}`);
    setLanguage(newLanguage);
    
    // Effacer les erreurs
    setError(null);
  };

  const isBookmarked = (ayahRef: string): boolean => {
    try {
      const bookmarks = JSON.parse(localStorage.getItem('quranBookmarks') || '[]');
      return bookmarks.some((b: any) => b.ayahRef === ayahRef);
    } catch {
      return false;
    }
  };

  const toggleBookmark = (verse: QuranVerse) => {
    try {
      const ayahRef = `${verse.surah.number}:${verse.numberInSurah}`;
      const bookmarks = JSON.parse(localStorage.getItem('quranBookmarks') || '[]');
      
      if (isBookmarked(ayahRef)) {
        const updatedBookmarks = bookmarks.filter((b: any) => b.ayahRef !== ayahRef);
        localStorage.setItem('quranBookmarks', JSON.stringify(updatedBookmarks));
      } else {
        const newBookmark = {
          ayahRef,
          text: verse.text,
          surahName: verse.surah.name,
          surahNumber: verse.surah.number,
          ayahNumber: verse.numberInSurah,
          timestamp: Date.now()
        };
        bookmarks.push(newBookmark);
        localStorage.setItem('quranBookmarks', JSON.stringify(bookmarks));
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const openNotesForAyah = (ayahRef: string) => {
    console.log('Opening notes for ayah:', ayahRef);
    setSelectedAyahForNotes(ayahRef);
    setNotesOpen(true);
  };

  const openDictionaryWithWord = (word: string) => {
    console.log('Opening dictionary with word:', word);
    setSelectedWordForDict(word);
    setDictionaryOpen(true);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigation items
  const navItems = [
    { id: 'dictionary', label: language === 'fr' ? 'Dictionnaire' : 'القاموس', icon: BookOpen, action: () => setDictionaryOpen(true) },
    { id: 'bookmarks', label: language === 'fr' ? 'Favoris' : 'المفضلة', icon: Heart, action: () => setBookmarksOpen(true) },
    { 
      id: 'notes', 
      label: language === 'fr' ? 'Mes notes' : 'ملاحظاتي', 
      icon: BookMarked, 
      action: () => { 
        console.log('Notes button clicked');
        setSelectedAyahForNotes(''); 
        setNotesOpen(true); 
      } 
    },
    { 
      id: 'help', 
      label: language === 'fr' ? 'Aide' : 'المساعدة', 
      icon: HelpCircle, 
      action: () => {
        console.log('Help button clicked');
        setHelpOpen(true);
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            {/* Logo et titre */}
            <div className="flex items-center">
              <div className="flex items-center">
                <img 
                  src={theme === 'light' ? '/sombredoncclair.svg' : '/clair.svg'} 
                  alt="Logo Le Jardin du Coran" 
                  className="h-8 w-8 mr-2 transition-all duration-200 ease-in-out" 
                />
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-200">
                  <span className="hidden sm:inline">
                    {language === 'fr' ? 'Le Jardin du Coran' : 'حديقة القرآن'}
                  </span>
                  <span className="sm:hidden">
                    {language === 'fr' ? 'Jardin du Coran' : 'حديقة القرآن'}
                  </span>
                </h1>
              </div>
            </div>

            {/* Mode toggle buttons */}
            <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mr-4 transition-colors duration-200">
              <button
                onClick={() => setCurrentView('search')}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'search'
                    ? 'bg-white dark:bg-gray-600 text-teal-700 dark:text-teal-300 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400'
                }`}
              >
                <Search size={16} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                {language === 'fr' ? 'Recherche' : 'بحث'}
              </button>
              <button
                onClick={() => setCurrentView('read')}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'read'
                    ? 'bg-white dark:bg-gray-600 text-teal-700 dark:text-teal-300 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400'
                }`}
              >
                <BookOpenCheck size={16} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                {language === 'fr' ? 'Lecture' : 'قراءة'}
              </button>
            </div>

            {/* Navigation Desktop */}
            <nav className="hidden md:flex items-center space-x-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <item.icon size={18} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                  <span className="hidden lg:inline">{item.label}</span>
                </button>
              ))}
              
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={theme === 'light' 
                  ? (language === 'fr' ? 'Mode sombre' : 'الوضع المظلم')
                  : (language === 'fr' ? 'Mode clair' : 'الوضع المضيء')
                }
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                <span className="hidden lg:inline ml-2">
                  {theme === 'light' 
                    ? (language === 'fr' ? 'Sombre' : 'مظلم')
                    : (language === 'fr' ? 'Clair' : 'مضيء')
                  }
                </span>
              </button>
              
              {/* Language Switch */}
              <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg p-1 transition-colors duration-200">
                <button
                  onClick={() => handleLanguageChange('fr')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    language === 'fr' ? 'bg-teal-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400'
                  }`}
                >
                  FR
                </button>
                <button
                  onClick={() => handleLanguageChange('ar')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    language === 'ar' ? 'bg-teal-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400'
                  }`}
                >
                  AR
                </button>
              </div>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Theme Toggle Mobile */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-gray-700 transition-colors"
                title={theme === 'light' 
                  ? (language === 'fr' ? 'Mode sombre' : 'الوضع المظلم')
                  : (language === 'fr' ? 'Mode clair' : 'الوضع المضيء')
                }
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>

              {/* Language Switch Mobile */}
              <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-md p-0.5 transition-colors duration-200">
                <button
                  onClick={() => handleLanguageChange('fr')}
                  className={`px-1.5 py-0.5 text-xs font-medium rounded transition-colors ${
                    language === 'fr' ? 'bg-teal-600 text-white' : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  FR
                </button>
                <button
                  onClick={() => handleLanguageChange('ar')}
                  className={`px-1.5 py-0.5 text-xs font-medium rounded transition-colors ${
                    language === 'ar' ? 'bg-teal-600 text-white' : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  AR
                </button>
              </div>
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-gray-700 transition-colors"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-gray-200 dark:border-gray-700 transition-colors duration-200">
              {/* Mode toggle mobile */}
              <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mt-4 mb-4 mx-4 transition-colors duration-200">
                <button
                  onClick={() => {
                    setCurrentView('search');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center ${
                    currentView === 'search'
                      ? 'bg-white dark:bg-gray-600 text-teal-700 dark:text-teal-300 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Search size={16} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                  {language === 'fr' ? 'Recherche' : 'بحث'}
                </button>
                <button
                  onClick={() => {
                    setCurrentView('read');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center ${
                    currentView === 'read'
                      ? 'bg-white dark:bg-gray-600 text-teal-700 dark:text-teal-300 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <BookOpenCheck size={16} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                  {language === 'fr' ? 'Lecture' : 'قراءة'}
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2 pt-4">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.action();
                      setMobileMenuOpen(false);
                    }}
                    className="flex flex-col items-center p-3 text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <item.icon size={20} className="mb-1" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {currentView === 'search' ? (
          <>
            {/* Search Interface */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 mb-6 transition-colors duration-200">
              {/* Search Type Selector */}
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { key: 'surah', label: language === 'fr' ? 'Sourate' : 'سورة', icon: Book },
                  { key: 'ayah', label: language === 'fr' ? 'Verset' : 'آية', icon: Hash },
                  { key: 'text', label: language === 'fr' ? 'Texte' : 'نص', icon: AlignLeft }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setSearchType(key as any)}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      searchType === key
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Icon size={16} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-grow">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      searchType === 'surah' ? (language === 'fr' ? 'Numéro de sourate (1-114)' : 'رقم السورة (١-١١٤)') :
                      searchType === 'ayah' ? (language === 'fr' ? 'sourate:verset (ex: 1:1)' : 'سورة:آية (مثال: ١:١)') :
                      (language === 'fr' ? 'Rechercher un mot ou une phrase...' : 'البحث عن كلمة أو عبارة...')
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-base transition-colors duration-200"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  />
                </div>
                <button
                  onClick={searchQuran}
                  disabled={loading || !searchQuery.trim()}
                  className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[120px]"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Search size={18} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                      <span className="hidden sm:inline">{language === 'fr' ? 'Rechercher' : 'بحث'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Search Options for Text Search */}
              {searchType === 'text' && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors duration-200">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'fr' ? 'Options de recherche' : 'خيارات البحث'}
                  </h4>
                  
                  {/* Options pour le français */}
                  {!containsArabic(searchQuery) && (
                    <div className="flex flex-wrap gap-4 mb-3">
                      <label className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <input
                          type="checkbox"
                          checked={exactMatch}
                          onChange={(e) => setExactMatch(e.target.checked)}
                          className="mr-2 rounded"
                        />
                        {language === 'fr' ? 'Recherche exacte' : 'بحث دقيق'}
                      </label>
                      <label className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <input
                          type="checkbox"
                          checked={caseSensitive}
                          onChange={(e) => setCaseSensitive(e.target.checked)}
                          className="mr-2 rounded"
                        />
                        {language === 'fr' ? 'Sensible à la casse' : 'حساس للحالة'}
                      </label>
                    </div>
                  )}
                  
                  {/* Options pour l'arabe */}
                  {containsArabic(searchQuery) && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <input
                            type="checkbox"
                            checked={ignoreDiacritics}
                            onChange={(e) => setIgnoreDiacritics(e.target.checked)}
                            className="mr-2 rounded"
                          />
                          {language === 'fr' ? 'Ignorer les signes diacritiques' : 'تجاهل التشكيل'}
                        </label>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {language === 'fr' ? 'Mode de recherche arabe' : 'نمط البحث العربي'}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { key: 'words', label: language === 'fr' ? 'Mots entiers' : 'كلمات كاملة' },
                            { key: 'partial', label: language === 'fr' ? 'Recherche partielle' : 'بحث جزئي' },
                            { key: 'exact', label: language === 'fr' ? 'Correspondance exacte' : 'تطابق تام' }
                          ].map(({ key, label }) => (
                            <button
                              key={key}
                              onClick={() => setArabicSearchMode(key as any)}
                              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                                arabicSearchMode === key
                                  ? 'bg-teal-600 text-white'
                                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Indicateur de normalisation pour le texte arabe */}
                  {searchQuery && containsArabic(searchQuery) && (
                    <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <Settings size={16} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                        </div>
                        <div className="ml-2">
                          <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                            {language === 'fr' ? `Recherche arabe en mode "${arabicSearchMode === 'words' ? 'mots entiers' : arabicSearchMode === 'partial' ? 'partielle' : 'exacte'}"` : `البحث العربي في نمط "${arabicSearchMode === 'words' ? 'كلمات كاملة' : arabicSearchMode === 'partial' ? 'جزئي' : 'تام'}"`}
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            {language === 'fr' 
                              ? `Recherche optimisée pour "${prepareArabicSearchQuery(searchQuery, { ignoreDiacritics })}"`
                              : `بحث محسن لـ "${prepareArabicSearchQuery(searchQuery, { ignoreDiacritics })}"`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation flottante pour la recherche */}
              {(searchType === 'text' && searchResults.length > 0) ? (
                // Navigation complète pour la recherche textuelle avec résultats
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-lg rounded-full px-3 py-2 border border-gray-200/50 dark:border-gray-600/50">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={scrollToTop}
                          className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                          title={language === 'fr' ? 'Remonter en haut' : 'العودة إلى الأعلى'}
                        >
                          <ArrowUp size={14} />
                        </button>
                        
                        <div className="px-2 py-1">
                          <div className="text-xs text-gray-500 dark:text-gray-400 text-center min-w-[60px]">
                            {searchResults.length} {language === 'fr' ? 'résultats' : 'نتائج'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (searchType !== 'text' && (
                // Bouton simple pour remonter en haut (autres types de recherche)
                <ScrollToTopButton language={language} />
              ))}
            </div>

            {/* Indicateur de changement de langue */}
            {loading && lastSearch && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                <div className="flex items-center">
                  <Languages size={16} className="text-blue-600 dark:text-blue-400 mr-2" />
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    {language === 'fr' 
                      ? 'Rechargement des données dans la nouvelle langue...'
                      : 'إعادة تحميل البيانات باللغة الجديدة...'}
                  </p>
                </div>
              </div>
            )}

            {/* Search Results */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-4">
                {/* Indicateur de surlignage */}
                {currentSearchTerm && searchType === 'text' && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                    <div className="flex items-center">
                      <Search size={16} className="text-yellow-600 dark:text-yellow-400 mr-2" />
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        {language === 'fr' 
                          ? `Terme recherché "${currentSearchTerm}" surligné en jaune dans les résultats (${searchResults.length} résultat${searchResults.length > 1 ? 's' : ''}) • Basmala filtrée`
                          : `المصطلح المبحوث عنه "${currentSearchTerm}" مميز بالأصفر في النتائج (${searchResults.length} نتيجة) • تم تصفية البسملة`}
                        {containsArabic(currentSearchTerm) && (
                          <span className="block mt-1 text-xs">
                            {language === 'fr' 
                              ? `Mode: ${arabicSearchMode === 'words' ? 'mots entiers' : arabicSearchMode === 'partial' ? 'partiel' : 'exact'}`
                              : `النمط: ${arabicSearchMode === 'words' ? 'كلمات كاملة' : arabicSearchMode === 'partial' ? 'جزئي' : 'تام'}`}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
                
                {searchResults.map((verse, index) => {
                  const ayahRef = `${verse.surah.number}:${verse.numberInSurah}`;
                  const isBookmarkedVerse = isBookmarked(ayahRef);
                  
                  return (
                    <div key={`${verse.number}-${index}`} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 ayah-card transition-colors duration-200">
                      {/* Verse Header */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                        <div>
                          <h3 className="text-lg font-semibold text-teal-700 dark:text-teal-300">
                            {verse.surah.name} ({verse.surah.number}:{verse.numberInSurah})
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {verse.surah.englishNameTranslation} - {verse.surah.englishName}
                          </p>
                        </div>
                        
                        {/* Audio Player */}
                        <div className="flex items-center gap-2">
                          <AudioPlayer
                            audioUrl={getAudioUrl(verse.number)}
                            minimal={true}
                            currentReciter={currentReciter}
                            onReciterChange={handleReciterChange}
                            language={language}
                          />
                        </div>
                      </div>

                      {/* Verse Text avec surlignage */}
                      <div className={`mb-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                        {currentSearchTerm && searchType === 'text' ? (
                          <HighlightedText
                            text={verse.text}
                            searchTerm={currentSearchTerm}
                            searchOptions={{ 
                              ignoreDiacritics, 
                              caseSensitive, 
                              exactMatch,
                              arabicSearchMode 
                            }}
                            language={language}
                            className={`text-lg leading-relaxed ${
                              language === 'ar' ? 'font-arabic text-2xl' : 'text-gray-800 dark:text-gray-200'
                            }`}
                          />
                        ) : (
                          <p className={`text-lg leading-relaxed ${
                            language === 'ar' ? 'font-arabic text-2xl' : 'text-gray-800 dark:text-gray-200'
                          }`}>
                            {verse.text}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <button
                          onClick={() => toggleBookmark(verse)}
                          className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isBookmarkedVerse
                              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                              : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                          title={isBookmarkedVerse 
                            ? (language === 'fr' ? 'Retirer des favoris' : 'إزالة من المفضلة')
                            : (language === 'fr' ? 'Ajouter aux favoris' : 'إضافة إلى المفضلة')
                          }
                        >
                          <Heart size={16} className={`${language === 'ar' ? 'ml-1' : 'mr-1'} ${isBookmarkedVerse ? 'fill-current' : ''}`} />
                          <span className="hidden sm:inline">
                            {isBookmarkedVerse 
                              ? (language === 'fr' ? 'Favoris' : 'مفضل')
                              : (language === 'fr' ? 'Favori' : 'مفضلة')
                            }
                          </span>
                        </button>

                        <button
                          onClick={() => openNotesForAyah(ayahRef)}
                          className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title={language === 'fr' ? 'Notes personnelles' : 'ملاحظات شخصية'}
                        >
                          <BookMarked size={16} className={language === 'ar' ? 'ml-1' : 'mr-1'} />
                          <span className="hidden sm:inline">
                            {language === 'fr' ? 'Notes' : 'ملاحظات'}
                          </span>
                        </button>

                        <button
                          onClick={() => openDictionaryWithWord('')}
                          className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title={language === 'fr' ? 'Consulter le dictionnaire' : 'الاطلاع على القاموس'}
                        >
                          <BookOpen size={16} className={language === 'ar' ? 'ml-1' : 'mr-1'} />
                          <span className="hidden sm:inline">
                            {language === 'fr' ? 'Dictionnaire' : 'قاموس'}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Welcome Message */}
            {searchResults.length === 0 && !loading && !error && (
              <div className="text-center py-12">
                <div className="mb-6">
                  <Search size={64} className="mx-auto text-teal-300 dark:text-teal-600 mb-4" />
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    {language === 'fr' ? 'Bienvenue dans le Jardin du Coran' : 'مرحباً بكم في حديقة القرآن'}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    {language === 'fr' 
                      ? 'Recherchez dans le Coran par sourate, verset ou mot-clé. La recherche arabe propose plusieurs modes de précision pour de meilleurs résultats.'
                      : 'ابحث في القرآن بالسورة أو الآية أو الكلمة المفتاحية. يقدم البحث العربي عدة أنماط دقة للحصول على أفضل النتائج.'
                    }
                  </p>
                </div>
                
                {/* Support Button - Only on search page */}
                <div className="mt-8 flex justify-center">
                  <a
                    href="https://paypal.me/frappe9nz?country.x=FR&locale.x=fr_FR"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 bg-gray-50 dark:bg-gray-800 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 group"
                  >
                    <Heart size={16} className="mr-2 text-red-500 group-hover:animate-pulse" />
                    <span className="font-medium">
                      {language === 'fr' ? 'Soutenir le projet' : 'دعم المشروع'}
                    </span>
                  </a>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Reading Mode */
          <QuranReader
            language={language}
            currentReciter={currentReciter}
            onReciterChange={handleReciterChange}
            getAudioUrl={getAudioUrl}
            loadSurah={loadSurah}
            isBookmarked={isBookmarked}
            toggleBookmark={toggleBookmark}
            openNotesForAyah={openNotesForAyah}
            openDictionaryWithWord={openDictionaryWithWord}
          />
        )}
      </main>
      {/* Modals */}
      {console.log('Rendering modals - dictionaryOpen:', dictionaryOpen, 'bookmarksOpen:', bookmarksOpen, 'notesOpen:', notesOpen, 'helpOpen:', helpOpen)}
      <Dictionary
        isOpen={dictionaryOpen}
        onClose={() => {
          console.log('Closing dictionary');
          setDictionaryOpen(false);
        }}
        initialWord={selectedWordForDict}
        language={language}
      />

      <Bookmarks
        isOpen={bookmarksOpen}
        onClose={() => {
          console.log('Closing bookmarks');
          setBookmarksOpen(false);
        }}
        language={language}
      />

      <Notes
        isOpen={notesOpen}
        onClose={() => {
          console.log('Closing notes');
          setNotesOpen(false);
        }}
        ayahReference={selectedAyahForNotes}
        language={language}
        viewAll={!selectedAyahForNotes}
      />

      <HelpPage
        isOpen={helpOpen}
        onClose={() => {
          console.log('Closing help');
          setHelpOpen(false);
        }}
        language={language}
      />
    </div>
  );
}

// Composant pour le bouton de retour en haut simple
const ScrollToTopButton: React.FC<{ language: string }> = ({ language }) => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!showButton) return null;

  return (
    <div className="fixed bottom-4 right-4 z-30">
      <button
        onClick={scrollToTop}
        className="bg-white dark:bg-gray-800 shadow-lg rounded-full p-3 border border-gray-200 dark:border-gray-600 hover:shadow-xl transition-all duration-200 text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400"
        title={language === 'fr' ? 'Remonter en haut' : 'العودة إلى الأعلى'}
      >
        <ArrowUp size={18} />
      </button>
    </div>
  );
};

export default App;