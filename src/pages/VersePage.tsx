import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext, QuranVerse } from '../contexts/AppContext';
import { ArrowLeft, Loader2, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import axios from 'axios';

export default function VersePage() {
  const { surahNumber, verseNumber } = useParams<{ surahNumber: string; verseNumber: string }>();
  const navigate = useNavigate();
  const {
    language,
    handleVerseClick
  } = useAppContext();

  const [verse, setVerse] = useState<QuranVerse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (surahNumber && verseNumber) {
      loadVerseData(parseInt(surahNumber), parseInt(verseNumber));
    }
  }, [surahNumber, verseNumber]);

  useEffect(() => {
    if (verse) {
      handleVerseClick(verse);
    }
  }, [verse]);

  const loadVerseData = async (sNum: number, vNum: number) => {
    try {
      setLoading(true);
      setError(null);

      if (sNum < 1 || sNum > 114 || vNum < 1) {
        throw new Error('Invalid verse reference');
      }

      const [arabicResponse, frenchResponse] = await Promise.all([
        axios.get(`https://api.alquran.cloud/v1/ayah/${sNum}:${vNum}/quran-uthmani`),
        axios.get(`https://api.alquran.cloud/v1/ayah/${sNum}:${vNum}/fr.hamidullah`)
      ]);

      if (arabicResponse.data.code !== 200 || frenchResponse.data.code !== 200) {
        throw new Error('Verse not found');
      }

      const arabicVerse = arabicResponse.data.data;
      const frenchVerse = frenchResponse.data.data;

      const loadedVerse: QuranVerse = {
        number: arabicVerse.number,
        text: arabicVerse.text,
        translation: frenchVerse?.text || '',
        surah: {
          number: arabicVerse.surah?.number || sNum,
          name: arabicVerse.surah?.name || '',
          englishName: arabicVerse.surah?.englishName || '',
          englishNameTranslation: arabicVerse.surah?.englishNameTranslation || '',
          numberOfAyahs: arabicVerse.surah?.numberOfAyahs || 0
        },
        numberInSurah: arabicVerse.numberInSurah
      };

      setVerse(loadedVerse);
    } catch (err) {
      console.error('Error loading verse:', err);
      setError(language === 'fr'
        ? `Verset ${sNum}:${vNum} non trouvé`
        : `الآية ${sNum}:${vNum} غير موجودة`);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousVerse = () => {
    if (!verse) return;

    if (verse.numberInSurah > 1) {
      navigate(`/verse/${verse.surah.number}/${verse.numberInSurah - 1}`);
    } else if (verse.surah.number > 1) {
      navigate(`/surah/${verse.surah.number - 1}`);
    }
  };

  const goToNextVerse = () => {
    if (!verse) return;

    if (verse.numberInSurah < verse.surah.numberOfAyahs) {
      navigate(`/verse/${verse.surah.number}/${verse.numberInSurah + 1}`);
    } else if (verse.surah.number < 114) {
      navigate(`/surah/${verse.surah.number + 1}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sm:p-8 text-center transition-colors duration-200">
        <Loader2 size={24} className="sm:w-8 sm:h-8 mx-auto text-[#43ada4] dark:text-[#43ada4] animate-spin mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          {language === 'fr' ? 'Chargement du verset...' : 'تحميل الآية...'}
        </p>
      </div>
    );
  }

  if (error || !verse) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sm:p-8 text-center transition-colors duration-200">
        <p className="text-red-500 dark:text-red-400 mb-4">{error || (language === 'fr' ? 'Verset introuvable' : 'الآية غير موجودة')}</p>
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 transition-colors duration-200">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(`/surah/${verse.surah.number}`)}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-[#43ada4] dark:hover:text-[#43ada4] transition-colors text-sm sm:text-base"
          >
            <ArrowLeft size={16} className={`sm:w-5 sm:h-5 ${language === 'ar' ? 'ml-1 sm:ml-2' : 'mr-1 sm:mr-2'}`} />
            {language === 'fr' ? 'Retour à la sourate' : 'العودة إلى السورة'}
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={goToPreviousVerse}
              disabled={verse.surah.number === 1 && verse.numberInSurah === 1}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-[#43ada4] dark:hover:text-[#43ada4] hover:bg-[#43ada4]/5 dark:hover:bg-[#43ada4]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title={language === 'fr' ? 'Verset précédent' : 'الآية السابقة'}
            >
              <ChevronLeft size={20} />
            </button>

            <button
              onClick={goToNextVerse}
              disabled={verse.surah.number === 114 && verse.numberInSurah === verse.surah.numberOfAyahs}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-[#43ada4] dark:hover:text-[#43ada4] hover:bg-[#43ada4]/5 dark:hover:bg-[#43ada4]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title={language === 'fr' ? 'Verset suivant' : 'الآية التالية'}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <BookOpen size={24} className="text-[#43ada4] dark:text-[#43ada4] mr-3" />
            <h1 className="text-2xl sm:text-3xl font-bold text-[#43ada4] dark:text-[#43ada4]">
              {language === 'fr' ? 'Verset' : 'آية'} {verse.surah.number}:{verse.numberInSurah}
            </h1>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            {verse.surah.name} - {verse.surah.englishName}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {verse.surah.englishNameTranslation}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sm:p-8 transition-colors duration-200">
        <div className="mb-6">
          <p className="text-2xl sm:text-3xl leading-relaxed font-arabic text-gray-900 dark:text-white text-right" dir="rtl">
            {verse.text}
          </p>
        </div>

        {verse.translation && (
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-lg sm:text-xl leading-relaxed text-gray-700 dark:text-gray-300">
              {verse.translation}
            </p>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg shadow-sm p-4 sm:p-6 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
          {language === 'fr'
            ? 'La modale de détails du verset s\'ouvrira automatiquement avec plus d\'informations, d\'options audio et d\'analyses.'
            : 'ستفتح نافذة تفاصيل الآية تلقائيًا مع مزيد من المعلومات وخيارات الصوت والتحليلات.'}
        </p>
      </div>
    </div>
  );
}
