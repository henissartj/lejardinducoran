import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import axios from 'axios';
import { advancedArabicSearch } from '../utils/arabicNormalization';
import useGlobalAudioState from '../hooks/useGlobalAudioState';
import AudioManager from '../utils/AudioManager';

export interface QuranVerse {
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

export interface SurahInfo {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

interface AppContextType {
  language: 'fr' | 'ar';
  isDarkMode: boolean;
  currentReciter: string;
  surahList: SurahInfo[];
  allVerses: QuranVerse[];
  loading: boolean;
  error: string | null;

  // Modals
  showDictionary: boolean;
  showBookmarks: boolean;
  showNotes: boolean;
  showHelp: boolean;
  showVerseDetails: boolean;
  selectedVerse: QuranVerse | null;
  notesAyahRef: string;
  dictionaryWord: string;
  isMobileMenuOpen: boolean;

  // Actions
  setLanguage: (lang: 'fr' | 'ar') => void;
  setIsDarkMode: (dark: boolean) => void;
  setCurrentReciter: (reciter: string) => void;
  toggleTheme: () => void;
  toggleLanguage: () => void;

  // Modal actions
  setShowDictionary: (show: boolean) => void;
  setShowBookmarks: (show: boolean) => void;
  setShowNotes: (show: boolean) => void;
  setShowHelp: (show: boolean) => void;
  setShowVerseDetails: (show: boolean) => void;
  setSelectedVerse: (verse: QuranVerse | null) => void;
  setNotesAyahRef: (ref: string) => void;
  setDictionaryWord: (word: string) => void;
  setIsMobileMenuOpen: (open: boolean) => void;

  // Data loading
  loadSurahList: () => Promise<void>;
  loadAllVerses: () => Promise<QuranVerse[]>;
  loadSurah: (surahNumber: number) => Promise<QuranVerse[]>;

  // Utilities
  getAudioUrl: (globalAyahNumber: number) => string;
  isBookmarked: (ayahRef: string) => boolean;
  toggleBookmark: (verse: QuranVerse) => void;
  openNotesForAyah: (ayahRef: string) => void;
  openDictionaryWithWord: (word: string) => void;
  handleVerseClick: (verse: QuranVerse) => void;
  getSurahDisplayName: (surahNumber: number) => string;

  // Audio
  globalAudioState: any;
  audioManager: any;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'fr' | 'ar'>('fr');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentReciter, setCurrentReciter] = useState('ar.alafasy');
  const [surahList, setSurahList] = useState<SurahInfo[]>([]);
  const [allVerses, setAllVerses] = useState<QuranVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showDictionary, setShowDictionary] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showVerseDetails, setShowVerseDetails] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<QuranVerse | null>(null);
  const [notesAyahRef, setNotesAyahRef] = useState('');
  const [dictionaryWord, setDictionaryWord] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const globalAudioState = useGlobalAudioState();
  const audioManager = AudioManager.getInstance();

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

  const loadAllVerses = useCallback(async () => {
    if (allVerses.length > 0) return allVerses;

    try {
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

      const arabicSurahs = arabicResponse.data.data.surahs;
      const frenchSurahs = frenchResponse.data.data.surahs;

      const combinedVerses: QuranVerse[] = [];

      for (let i = 0; i < arabicSurahs.length; i++) {
        const arabicSurah = arabicSurahs[i];
        const frenchSurah = frenchSurahs[i];

        if (!arabicSurah || !frenchSurah) continue;

        const surahInfo = {
          number: arabicSurah.number,
          name: arabicSurah.name,
          englishName: arabicSurah.englishName,
          englishNameTranslation: arabicSurah.englishNameTranslation,
          numberOfAyahs: arabicSurah.numberOfAyahs
        };

        const arabicAyahs = arabicSurah.ayahs || [];
        const frenchAyahs = frenchSurah.ayahs || [];

        for (let j = 0; j < arabicAyahs.length; j++) {
          const arabicVerse = arabicAyahs[j];
          const frenchVerse = frenchAyahs[j];

          if (!arabicVerse) continue;

          let cleanedArabicText = arabicVerse.text;

          if (j === 0 && i !== 0 && i !== 8) {
            const basmalas = [
              'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
              'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
              'بِسْمِ اللهِ الرَّحْمنِ الرَّحِيمِ',
              'بسم الله الرحمن الرحيم'
            ];

            for (const basmala of basmalas) {
              if (cleanedArabicText.startsWith(basmala)) {
                cleanedArabicText = cleanedArabicText.replace(basmala, '').trim();
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

      setAllVerses(combinedVerses);
      return combinedVerses;
    } catch (err) {
      console.error('Error loading all verses:', err);
      const errorMessage = language === 'fr'
        ? 'Erreur lors du chargement des versets'
        : 'خطأ في تحميل الآيات';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [allVerses, language]);

  const loadSurah = async (surahNumber: number): Promise<QuranVerse[]> => {
    const [arabicResponse, frenchResponse] = await Promise.all([
      axios.get(`https://api.alquran.cloud/v1/surah/${surahNumber}/ar.asad`),
      axios.get(`https://api.alquran.cloud/v1/surah/${surahNumber}/fr.hamidullah`)
    ]);

    if (arabicResponse.data.code !== 200 || frenchResponse.data.code !== 200) {
      throw new Error('Failed to load surah');
    }

    const arabicVerses = arabicResponse.data.data.ayahs;
    const frenchVerses = frenchResponse.data.data.ayahs;
    const surahInfo = arabicResponse.data.data;

    return arabicVerses.map((arabicVerse: any, index: number) => {
      const frenchVerse = frenchVerses[index];

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
            break;
          }
        }
      }

      return verse;
    });
  };

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

  const handleVerseClick = (verse: QuranVerse) => {
    setSelectedVerse(verse);
    setShowVerseDetails(true);
  };

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

  const value: AppContextType = {
    language,
    isDarkMode,
    currentReciter,
    surahList,
    allVerses,
    loading,
    error,

    showDictionary,
    showBookmarks,
    showNotes,
    showHelp,
    showVerseDetails,
    selectedVerse,
    notesAyahRef,
    dictionaryWord,
    isMobileMenuOpen,

    setLanguage,
    setIsDarkMode,
    setCurrentReciter,
    toggleTheme,
    toggleLanguage,

    setShowDictionary,
    setShowBookmarks,
    setShowNotes,
    setShowHelp,
    setShowVerseDetails,
    setSelectedVerse,
    setNotesAyahRef,
    setDictionaryWord,
    setIsMobileMenuOpen,

    loadSurahList,
    loadAllVerses,
    loadSurah,

    getAudioUrl,
    isBookmarked,
    toggleBookmark,
    openNotesForAyah,
    openDictionaryWithWord,
    handleVerseClick,
    getSurahDisplayName,

    globalAudioState,
    audioManager
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
