import React, { useState, useEffect, useCallback } from 'react';
import { Search, Book, Hash, AlignLeft, Sun, Moon, Languages, BookOpen, BookMarked, Heart, HelpCircle, Loader2, Play, Pause, Mic2, X, Menu } from 'lucide-react';
import { AnimatedLogo } from './components/icons/AnimatedLogo';
import { NavigationSwitch } from './components/layout/NavigationSwitch';
import { MobileMenu } from './components/layout/MobileMenu';
import { QuranReader } from './components/QuranReader';
import { AudioPlayer } from './components/AudioPlayer';
import { HighlightedText } from './components/HighlightedText';
import { Dictionary } from './components/modals/Dictionary';
import { Bookmarks } from './components/modals/Bookmarks';
import { Notes } from './components/modals/Notes';
import HelpPage from './components/modals/HelpPage';
import { VerseDetailsModal } from './components/modals/VerseDetailsModal';
import { advancedArabicSearch } from './utils/arabicNormalization';
import axios from 'axios';
import useGlobalAudioState from './hooks/useGlobalAudioState';
import AudioManager from './utils/AudioManager';

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

function App() {
  // États principaux
  const [currentView, setCurrentView] = useState<'search' | 'reader'>('search');
  const [searchType, setSearchType] = useState<'surah' | 'verse' | 'text'>('surah');
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState<'fr' | 'ar'>('fr');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentReciter, setCurrentReciter] = useState('ar.alafasy');

  // États de recherche
  const [surahResults, setSurahResults] = useState<QuranVerse[]>([]);
  const [verseResults, setVerseResults] = useState<QuranVerse[]>([]);
  const [textSearchResults, setTextSearchResults] = useState<QuranVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // États des modales
  const [showDictionary, setShowDictionary] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [notesAyahRef, setNotesAyahRef] = useState('');
  const [dictionaryWord, setDictionaryWord] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // États pour la modale de détails du verset
  const [showVerseDetails, setShowVerseDetails] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<QuranVerse | null>(null);
  const [basmalaSeparate, setBasmalaSeparate] = useState<Record<number, string>>({});

  // État audio global
  const globalAudioState = useGlobalAudioState();
  const audioManager = AudioManager.getInstance();

  // Options de recherche texte
  const [searchOptions, setSearchOptions] = useState({
    exactMatch: false,
    caseSensitive: false,
    ignoreDiacritics: true,
    arabicSearchMode: 'words' as 'words' | 'partial' | 'exact'
  });

  // Données des sourates
  const [surahList, setSurahList] = useState<SurahInfo[]>([]);
  const [allVerses, setAllVerses] = useState<QuranVerse[]>([]);

  // Initialisation
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedLanguage = localStorage.getItem('language');
    
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    
    if (savedLanguage === 'ar') {
      setLanguage('ar');
    }

    loadSurahList();
  }, []);

  // Charger la liste des sourates
  const loadSurahList = async () => {
    try {
      const response = await axios.get('https://api.alquran.cloud/v1/surah');
      if (response.data.code === 200) {
        setSurahList(response.data.data);
      }
    } catch (err) {
      console.error('Error loading surah list:', err);
    }
  };

  // Charger tous les versets pour la recherche texte
  const loadAllVerses = useCallback(async () => {
    if (allVerses.length > 0) return allVerses;

    try {
      console.log('🔄 Loading all verses for text search...');
      setLoading(true);
      setError(null);

      const [arabicResponse, frenchResponse, basmalaSeparateResponse] = await Promise.all([
        axios.get('https://api.alquran.cloud/v1/quran/ar.asad'),
        axios.get('https://api.alquran.cloud/v1/quran/fr.hamidullah'),
        axios.get('https://api.alquran.cloud/v1/quran/quran-uthmani')
      ]);

      if (arabicResponse.data.code !== 200 || frenchResponse.data.code !== 200) {
        throw new Error('Failed to load Quran data');
      }

      // Check if the response data structure is valid
      if (!arabicResponse.data.data || !frenchResponse.data.data) {
        throw new Error('Invalid API response structure');
      }

      // The API returns surahs array, each containing ayahs
      const arabicSurahs = arabicResponse.data.data.surahs;
      const frenchSurahs = frenchResponse.data.data.surahs;
      const basmalaSeparateData = basmalaSeparateResponse.data.data;

      if (!Array.isArray(arabicSurahs) || !Array.isArray(frenchSurahs)) {
        throw new Error('Invalid surahs data structure');
      }

      // Créer un mapping des Basmalas séparées par sourate
      const basmalas: Record<number, string> = {};
      basmalaSeparateData.surahs.forEach((surah: any) => {
        if (surah.number !== 1 && surah.number !== 9) {
          // Pour les sourates autres que 1 et 9, extraire la Basmala du premier verset
          const firstVerse = surah.ayahs[0];
          if (firstVerse && firstVerse.text.includes('بِسْمِ')) {
            const basmalatMatch = firstVerse.text.match(/^(بِسْمِ\s+ٱللَّهِ\s+ٱلرَّحْمَٰنِ\s+ٱلرَّحِيمِ)/);
            if (basmalatMatch) {
              basmalas[surah.number] = basmalatMatch[1];
            }
          }
        }
      });
      setBasmalaSeparate(basmalas);

      // Construire les versets en préservant les informations de sourate correctes
      const combinedVerses: QuranVerse[] = [];
      
      // Itérer sur chaque sourate pour construire les versets avec les bonnes informations
      for (let i = 0; i < arabicSurahs.length; i++) {
        const arabicSurah = arabicSurahs[i];
        const frenchSurah = frenchSurahs[i];
        
        if (!arabicSurah || !frenchSurah) continue;
        
        // Informations de la sourate
        const surahInfo = {
          number: arabicSurah.number,
          name: arabicSurah.name,
          englishName: arabicSurah.englishName,
          englishNameTranslation: arabicSurah.englishNameTranslation,
          numberOfAyahs: arabicSurah.numberOfAyahs
        };
        
        // Traiter chaque verset de cette sourate
        const arabicAyahs = arabicSurah.ayahs || [];
        const frenchAyahs = frenchSurah.ayahs || [];
        
        for (let j = 0; j < arabicAyahs.length; j++) {
          const arabicVerse = arabicAyahs[j];
          const frenchVerse = frenchAyahs[j];
          
          if (!arabicVerse) continue;
          
          // Nettoyer le texte arabe en supprimant la Basmala du premier verset (sauf sourate 1 et 9)
          let cleanedArabicText = arabicVerse.text;
          
          // Supprimer la Basmala du premier verset (sauf sourates 1 et 9)
          if (j === 0 && i !== 0 && i !== 8) { // i 0 = sourate 1, i 8 = sourate 9
            const basmalas = [
              'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
              'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
              'بِسْمِ اللهِ الرَّحْمنِ الرَّحِيمِ',
              'بسم الله الرحمن الرحيم'
            ];
            
            for (const basmala of basmalas) {
              if (cleanedArabicText.startsWith(basmala)) {
                cleanedArabicText = cleanedArabicText.replace(basmala, '').trim();
                console.log(`🗑️ Basmala supprimée de la sourate ${arabicSurah.number}, verset ${j + 1}`);
                break;
              }
            }
          }
          
          combinedVerses.push({
            number: arabicVerse.number,
            text: cleanedArabicText,
            translation: frenchVerse?.text || '',
            surah: surahInfo,
            numberInSurah: arabicVerse.numberInSurah
          });
        }
      }

      console.log(`✅ Loaded ${combinedVerses.length} verses successfully`);
      setAllVerses(combinedVerses);
      return combinedVerses;
    } catch (err) {
      console.error('❌ Error loading all verses:', err);
      const errorMessage = language === 'fr' 
        ? 'Erreur lors du chargement des versets'
        : 'خطأ في تحميل الآيات';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [allVerses, language]);

  // Fonction de recherche par texte - ENTIÈREMENT RÉÉCRITE
  const performTextSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setTextSearchResults([]);
      return;
    }

    try {
      console.log('🔍 Starting text search for:', searchQuery);
      setLoading(true);
      setError(null);
      setTextSearchResults([]);

      // Charger tous les versets si nécessaire
      const verses = await loadAllVerses();
      
      if (!verses || verses.length === 0) {
        throw new Error('No verses loaded');
      }

      console.log(`📚 Searching in ${verses.length} verses...`);

      // Effectuer la recherche
      const results = verses.filter(verse => {
        try {
          // Recherche dans le texte arabe avec plus de précision
          let arabicMatch = false;
          if (verse.text) {
            if (searchOptions.exactMatch) {
              // Recherche exacte
              arabicMatch = advancedArabicSearch(verse.text, searchQuery, {
                searchMode: 'exact',
                ignoreDiacritics: searchOptions.ignoreDiacritics,
                caseSensitive: searchOptions.caseSensitive
              });
            } else {
              // Recherche selon le mode sélectionné
              arabicMatch = advancedArabicSearch(verse.text, searchQuery, {
                searchMode: searchOptions.arabicSearchMode,
                ignoreDiacritics: searchOptions.ignoreDiacritics,
                fuzzyThreshold: 0.7, // Réduire le seuil pour plus de précision
                caseSensitive: searchOptions.caseSensitive
              });
            }
          }

          // Recherche dans la traduction française
          let translationMatch = false;
          if (verse.translation) {
            const processedTranslation = searchOptions.caseSensitive 
              ? verse.translation 
              : verse.translation.toLowerCase();
            const processedQuery = searchOptions.caseSensitive 
              ? searchQuery 
              : searchQuery.toLowerCase();

            if (searchOptions.exactMatch) {
              // Pour la recherche exacte, chercher le terme exact dans la phrase
              const words = processedTranslation.split(/\s+/);
              translationMatch = words.some(word => 
                word.replace(/[.,!?;:]/g, '') === processedQuery
              );
            } else {
              // Recherche de mots entiers ou partiels selon les options
              if (searchOptions.arabicSearchMode === 'words') {
                // Recherche de mots entiers
                const regex = new RegExp(`\\b${processedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                translationMatch = regex.test(processedTranslation);
              } else {
                // Recherche partielle
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

      console.log(`✅ Found ${results.length} matching verses`);
      setTextSearchResults(results);

      if (results.length === 0) {
        setError(language === 'fr' 
          ? `Aucun résultat trouvé pour "${searchQuery}"`
          : `لم يتم العثور على نتائج لـ "${searchQuery}"`);
      }

    } catch (err) {
      console.error('❌ Text search error:', err);
      const errorMessage = language === 'fr'
        ? 'Erreur lors de la recherche textuelle'
        : 'خطأ في البحث النصي';
      setError(errorMessage);
      setTextSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Fonction de recherche par sourate
  const performSurahSearch = async (surahNumber: string) => {
    if (!surahNumber.trim()) {
      setSurahResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSurahResults([]);

      const surahNum = parseInt(surahNumber);
      if (isNaN(surahNum) || surahNum < 1 || surahNum > 114) {
        throw new Error('Invalid surah number');
      }

      const [arabicResponse, frenchResponse, basmalaSeparateResponse] = await Promise.all([
        axios.get(`https://api.alquran.cloud/v1/surah/${surahNum}/ar.asad`),
        axios.get(`https://api.alquran.cloud/v1/surah/${surahNum}/fr.hamidullah`),
        axios.get(`https://api.alquran.cloud/v1/surah/${surahNum}/quran-uthmani`)
      ]);

      if (arabicResponse.data.code !== 200 || frenchResponse.data.code !== 200) {
        throw new Error('Failed to load surah');
      }

      const arabicVerses = arabicResponse.data.data.ayahs;
      const frenchVerses = frenchResponse.data.data.ayahs;
      const surahInfo = arabicResponse.data.data;
      const basmalaSeparateData = basmalaSeparateResponse.data.data;

      const combinedVerses: QuranVerse[] = arabicVerses.map((arabicVerse: any, index: number) => {
        const frenchVerse = frenchVerses[index];
        const basmalaSeparateAyah = basmalaSeparateData.ayahs[index];
        
        const verse = {
          number: arabicVerse.number,
          text: arabicVerse.text,
          translation: frenchVerse?.text || '',
          surah: {
            number: surahInfo.number,
            name: surahInfo.name,
            englishName: surahInfo.englishName,
            englishNameTranslation: surahInfo.englishNameTranslation,
            numberOfAyahs: surahInfo.numberOfAyahs
          },
          numberInSurah: arabicVerse.numberInSurah
        };

        // Supprimer la Basmala du premier verset (sauf sourates 1 et 9)
        if (index === 0 && surahNum !== 1 && surahNum !== 9) {
          const basmalas = [
            'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
            'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
            'بِسْمِ اللهِ الرَّحْمنِ الرَّحِيمِ',
            'بسم الله الرحمن الرحيم'
          ];
          
          for (const basmala of basmalas) {
            if (verse.text.startsWith(basmala)) {
              verse.text = verse.text.replace(basmala, '').trim();
              console.log(`🗑️ Basmala supprimée de la sourate ${surahNum}, verset ${index + 1}`);
              break;
            }
          }
        }

        return verse;
      });

      setSurahResults(combinedVerses);
    } catch (err) {
      console.error('Error in surah search:', err);
      const errorMessage = language === 'fr'
        ? `Erreur lors du chargement de la sourate ${surahNumber}`
        : `خطأ في تحميل السورة ${surahNumber}`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fonction de recherche par verset
  const performVerseSearch = async (verseRef: string) => {
    if (!verseRef.trim()) {
      setVerseResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setVerseResults([]);

      const parts = verseRef.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid verse format');
      }

      const surahNum = parseInt(parts[0]);
      const verseNum = parseInt(parts[1]);

      if (isNaN(surahNum) || isNaN(verseNum) || surahNum < 1 || surahNum > 114 || verseNum < 1) {
        throw new Error('Invalid verse reference');
      }

      const [arabicResponse, frenchResponse] = await Promise.all([
        axios.get(`https://api.alquran.cloud/v1/ayah/${surahNum}:${verseNum}/quran-uthmani`),
        axios.get(`https://api.alquran.cloud/v1/ayah/${surahNum}:${verseNum}/fr.hamidullah`)
      ]);

      if (arabicResponse.data.code !== 200 || frenchResponse.data.code !== 200) {
        throw new Error('Verse not found');
      }

      const arabicVerse = arabicResponse.data.data;
      const frenchVerse = frenchResponse.data.data;

      const verse: QuranVerse = {
        number: arabicVerse.number,
        text: arabicVerse.text,
        translation: frenchVerse?.text || '',
        surah: {
          number: arabicVerse.surah?.number || surahNum,
          name: arabicVerse.surah?.name || '',
          englishName: arabicVerse.surah?.englishName || '',
          englishNameTranslation: arabicVerse.surah?.englishNameTranslation || '',
          numberOfAyahs: arabicVerse.surah?.numberOfAyahs || 0
        },
        numberInSurah: arabicVerse.numberInSurah
      };

      setVerseResults([verse]);
    } catch (err) {
      console.error('Error in verse search:', err);
      const errorMessage = language === 'fr'
        ? `Verset ${verseRef} non trouvé`
        : `الآية ${verseRef} غير موجودة`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Gestionnaire de recherche principal
  const handleSearch = async () => {
    if (!query.trim()) return;
    
    // Arrêter l'écoute d'une sourate complète si on fait une recherche
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

  // Obtenir les résultats à afficher
  const getDisplayResults = (): QuranVerse[] => {
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

  // Fonctions utilitaires
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'fr' ? 'ar' : 'fr';
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  const getAudioUrl = (globalAyahNumber: number): string => {
    const reciterMap: Record<string, string> = {
      'ar.alafasy': 'https://cdn.islamic.network/quran/audio/128/ar.alafasy',
      'ar.abdulbasit': 'https://cdn.islamic.network/quran/audio/128/ar.abdulbasit.warsh',
      'ar.husary': 'https://cdn.islamic.network/quran/audio/128/ar.husary',
      'ar.minshawi': 'https://cdn.islamic.network/quran/audio/128/ar.minshawi',
      'ar.sudais': 'https://cdn.islamic.network/quran/audio/128/ar.abdurrahmaansudais',
      'ar.shaatree': 'https://cdn.islamic.network/quran/audio/128/ar.shaatree'
    };
    
    const baseUrl = reciterMap[currentReciter] || reciterMap['ar.alafasy'];
    return `${baseUrl}/${globalAyahNumber}.mp3`;
  };

  const loadSurah = async (surahNumber: number): Promise<QuranVerse[]> => {
    const [arabicResponse, frenchResponse, basmalaSeparateResponse] = await Promise.all([
      axios.get(`https://api.alquran.cloud/v1/surah/${surahNumber}/ar.asad`),
      axios.get(`https://api.alquran.cloud/v1/surah/${surahNumber}/fr.hamidullah`),
      axios.get(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`)
    ]);

    if (arabicResponse.data.code !== 200 || frenchResponse.data.code !== 200) {
      throw new Error('Failed to load surah');
    }

    const arabicVerses = arabicResponse.data.data.ayahs;
    const frenchVerses = frenchResponse.data.data.ayahs;
    const surahInfo = arabicResponse.data.data;
    const basmalaSeparateData = basmalaSeparateResponse.data.data;

    return arabicVerses.map((arabicVerse: any, index: number) => {
      const frenchVerse = frenchVerses[index];
      const basmalaSeparateAyah = basmalaSeparateData.ayahs[index];
      
      const verse = {
        number: arabicVerse.number,
        text: arabicVerse.text,
        translation: frenchVerse?.text || '',
        surah: {
          number: surahInfo.number,
          name: surahInfo.name,
          englishName: surahInfo.englishName,
          englishNameTranslation: surahInfo.englishNameTranslation,
          numberOfAyahs: surahInfo.numberOfAyahs
        },
        numberInSurah: arabicVerse.numberInSurah
      };

      // Supprimer la Basmala du premier verset (sauf sourates 1 et 9)
      if (index === 0 && surahNumber !== 1 && surahNumber !== 9) {
        const basmalas = [
          'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
          'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
          'بِسْمِ اللهِ الرَّحْمنِ الرَّحِيمِ',
          'بسم الله الرحمن الرحيم'
        ];
        
        for (const basmala of basmalas) {
          if (verse.text.startsWith(basmala)) {
            verse.text = verse.text.replace(basmala, '').trim();
            console.log(`🗑️ Basmala supprimée de la sourate ${surahNumber}, verset ${index + 1}`);
            break;
          }
        }
      }

      return verse;
    });
  };

  const isBookmarked = (ayahRef: string): boolean => {
    try {
      const bookmarks = JSON.parse(localStorage.getItem('quranBookmarks') || '[]');
      return bookmarks.some((bookmark: any) => bookmark.ayahRef === ayahRef);
    } catch {
      return false;
    }
  };

  const toggleBookmark = (verse: QuranVerse) => {
    try {
      const ayahRef = `${verse.surah.number}:${verse.numberInSurah}`;
      const bookmarks = JSON.parse(localStorage.getItem('quranBookmarks') || '[]');
      
      const existingIndex = bookmarks.findIndex((bookmark: any) => bookmark.ayahRef === ayahRef);
      
      if (existingIndex >= 0) {
        bookmarks.splice(existingIndex, 1);
      } else {
        bookmarks.push({
          ayahRef,
          text: verse.text,
          surahName: verse.surah.name,
          surahNumber: verse.surah.number,
          ayahNumber: verse.numberInSurah,
          timestamp: Date.now()
        });
      }
      
      localStorage.setItem('quranBookmarks', JSON.stringify(bookmarks));
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  const openNotesForAyah = (ayahRef: string) => {
    setNotesAyahRef(ayahRef);
    setShowNotes(true);
  };

  const openDictionaryWithWord = (word: string) => {
    setDictionaryWord(word);
    setShowDictionary(true);
  };
  
  // Fonction pour ouvrir les détails d'un verset
  const handleVerseClick = (verse: QuranVerse) => {
    setSelectedVerse(verse);
    setShowVerseDetails(true);
  };

  // Fonction pour obtenir le nom d'affichage de la sourate
  const getSurahDisplayName = (surahNumber: number): string => {
    const surahInfo = surahList.find(s => s.number === surahNumber);
    if (surahInfo) {
      if (language === 'fr') {
        return surahInfo.englishName || surahInfo.englishNameTranslation || `Sourate ${surahNumber}`;
      } else {
        return surahInfo.name || `سورة ${surahNumber}`;
      }
    }
    return language === 'fr' ? `Sourate ${surahNumber}` : `سورة ${surahNumber}`;
  };

  const displayResults = getDisplayResults();

  // Composant de contrôle audio global
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
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center min-w-0 flex-shrink-0">
              <AnimatedLogo isDarkMode={isDarkMode} className="h-8 w-8 sm:h-10 sm:w-10" />
              <h1 className="ml-2 sm:ml-3 text-sm sm:text-xl font-bold text-teal-800 dark:text-teal-300 truncate">
                {language === 'fr' ? 'Le Jardin du Coran' : 'حديقة القرآن'}
              </h1>
            </div>

            {/* Navigation Switch */}
            <div className="hidden sm:flex flex-1 justify-center mx-2 sm:mx-4">
              <NavigationSwitch
                currentView={currentView}
                onViewChange={setCurrentView}
                language={language}
              />
            </div>

            {/* Actions */}
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

            {/* Mobile Menu Button */}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {currentView === 'search' ? (
          <div className="space-y-6">
            {/* Search Interface */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 transition-colors duration-200">
              {/* Search Type Tabs */}
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

              {/* Search Input */}
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

              {/* Search Options for Text Search */}
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
                  
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    <p>
                      {language === 'fr' 
                        ? '💡 Conseil: Utilisez "Mots entiers" pour une recherche plus précise, ou "Correspondance partielle" pour des résultats plus larges.'
                        : '💡 نصيحة: استخدم "كلمات كاملة" للبحث الدقيق، أو "مطابقة جزئية" للنتائج الأوسع.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Results */}
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
                      onClick={() => handleVerseClick(verse)}
                    >
                      {/* Verse Header */}
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

                      {/* Arabic Text */}
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

                      {/* French Translation */}
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

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-700">
                        <button
                          onClick={() => toggleBookmark(verse)}
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
                          onClick={() => openNotesForAyah(ayahRef)}
                          className="flex items-center px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <BookMarked size={14} className={`sm:w-4 sm:h-4 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
                          <span className="hidden sm:inline">
                            {language === 'fr' ? 'Notes' : 'ملاحظات'}
                          </span>
                        </button>

                        <button
                          onClick={() => openDictionaryWithWord('')}
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
            ) : query && !loading ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sm:p-8 text-center transition-colors duration-200">
                <Search size={32} className="sm:w-12 sm:h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  {language === 'fr' ? 'Aucun résultat trouvé' : 'لم يتم العثور على نتائج'}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {language === 'fr' 
                    ? 'Essayez avec des termes différents ou vérifiez l\'orthographe'
                    : 'جرب مصطلحات مختلفة أو تحقق من الإملاء'}
                </p>
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
        ) : (
          <QuranReader
            language={language}
            currentReciter={currentReciter}
            onReciterChange={setCurrentReciter}
            getAudioUrl={getAudioUrl}
            loadSurah={loadSurah}
            isBookmarked={isBookmarked}
            toggleBookmark={toggleBookmark}
            openNotesForAyah={openNotesForAyah}
            openDictionaryWithWord={openDictionaryWithWord}
            onVerseClick={handleVerseClick}
          />
        )}
      </main>

      {/* Modals */}
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

      {/* Verse Details Modal */}
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

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
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
        onReciterChange={setCurrentReciter}
      />
      
      {/* Contrôle audio global */}
      <GlobalAudioControl />
    </div>
  );
}

export default App;