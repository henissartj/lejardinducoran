import React, { useState, useEffect } from 'react';
import { X, BookOpen, BookMarked, Heart, Copy, Share2, Info, Volume2, Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Settings, ChevronDown, ChevronUp, Search, Star, Clock, MapPin, Users, Lightbulb, MessageSquare, FileText, Globe, Zap, Hash } from 'lucide-react';
import { AudioPlayer } from '../AudioPlayer';
import { HighlightedText } from '../HighlightedText';

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

interface VerseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  verse: QuranVerse | null;
  language: string;
  currentReciter: string;
  onReciterChange: (reciter: string) => void;
  getAudioUrl: (globalAyahNumber: number) => string;
  isBookmarked: (ayahRef: string) => boolean;
  toggleBookmark: (verse: QuranVerse) => void;
  openNotesForAyah: (ayahRef: string) => void;
  openDictionaryWithWord: (word: string) => void;
}

// Données simulées pour le Tafsir et les informations enrichies
const VERSE_ENRICHED_DATA: Record<string, any> = {
  '1:1': {
    tafsir: {
      fr: "La Basmala est la formule d'ouverture du Coran. Elle exprime la recherche de la bénédiction divine avant toute entreprise. 'Bismillah' signifie 'Au nom d'Allah', invoquant ainsi la protection et la guidance divine.",
      ar: "البسملة هي فاتحة القرآن الكريم، وهي استعاذة وطلب للبركة من الله تعالى قبل البدء في أي عمل. 'بسم الله' تعني طلب العون والتوفيق من الله سبحانه وتعالى."
    },
    context: {
      revelation: { place: 'Mecque', period: 'Première période', circumstances: 'Révélation initiale' },
      themes: ['Invocation divine', 'Miséricorde', 'Compassion', 'Ouverture'],
      keywords: [
        { word: 'الله', meaning: 'Allah - Le nom propre de Dieu en Islam' },
        { word: 'الرحمن', meaning: 'Ar-Rahman - Le Tout Miséricordieux' },
        { word: 'الرحيم', meaning: 'Ar-Rahim - Le Très Miséricordieux' }
      ]
    },
    linguistics: {
      grammar: "Structure nominale avec préposition 'bi' (avec/au nom de)",
      rhetoric: "Assonance et rythme harmonieux des noms divins",
      etymology: "Racines sémitiques anciennes exprimant la miséricorde"
    }
  },
  '2:255': {
    tafsir: {
      fr: "Ayat al-Kursi (le Verset du Trône) est considéré comme l'un des versets les plus puissants du Coran. Il décrit la grandeur, l'omniscience et l'omnipotence d'Allah. Ce verset affirme l'unicité divine et la souveraineté absolue d'Allah sur toute la création.",
      ar: "آية الكرسي من أعظم آيات القرآن الكريم، تصف عظمة الله وعلمه المطلق وقدرته اللامحدودة. تؤكد هذه الآية وحدانية الله وسيادته المطلقة على كل الخلق."
    },
    context: {
      revelation: { place: 'Médine', period: 'Deuxième année de l\'Hégire', circumstances: 'Consolidation de la communauté musulmane' },
      themes: ['Unicité divine', 'Omniscience', 'Omnipotence', 'Souveraineté'],
      keywords: [
        { word: 'الكرسي', meaning: 'Al-Kursi - Le Trône, symbole de la souveraineté divine' },
        { word: 'الحي', meaning: 'Al-Hayy - Le Vivant éternel' },
        { word: 'القيوم', meaning: 'Al-Qayyum - Celui qui subsiste par Lui-même' }
      ]
    },
    linguistics: {
      grammar: "Phrases nominales exprimant la permanence et l'éternité",
      rhetoric: "Gradation ascendante dans la description des attributs divins",
      etymology: "Vocabulaire théologique sophistiqué"
    }
  }
};

export const VerseDetailsModal: React.FC<VerseDetailsModalProps> = ({
  isOpen,
  onClose,
  verse,
  language,
  currentReciter,
  onReciterChange,
  getAudioUrl,
  isBookmarked,
  toggleBookmark,
  openNotesForAyah,
  openDictionaryWithWord
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tafsir' | 'linguistics' | 'context'>('overview');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [searchInVerse, setSearchInVerse] = useState('');
  const [showWordAnalysis, setShowWordAnalysis] = useState(false);

  useEffect(() => {
    if (isOpen && verse) {
      setActiveTab('overview');
      setExpandedSections({});
      setSearchInVerse('');
      setShowWordAnalysis(false);
    }
  }, [isOpen, verse]);

  if (!isOpen || !verse) return null;

  const ayahRef = `${verse.surah.number}:${verse.numberInSurah}`;
  const isBookmarkedVerse = isBookmarked(ayahRef);
  const enrichedData = VERSE_ENRICHED_DATA[ayahRef] || {};

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const copyVerse = async () => {
    const textToCopy = `${verse.text}\n\n${verse.translation || ''}\n\n— ${language === 'fr' ? 'Coran' : 'القرآن'} ${ayahRef}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      // Vous pourriez ajouter une notification ici
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
    }
  };

  const shareVerse = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${language === 'fr' ? 'Verset du Coran' : 'آية من القرآن'} ${ayahRef}`,
          text: `${verse.text}\n\n${verse.translation || ''}`,
          url: window.location.href
        });
      } catch (err) {
        console.error('Erreur lors du partage:', err);
      }
    } else {
      copyVerse();
    }
  };

  const analyzeWord = (word: string) => {
    openDictionaryWithWord(word);
    onClose();
  };

  const renderWordAnalysis = () => {
    if (!showWordAnalysis) return null;

    const words = verse.text.split(/\s+/).filter(word => word.length > 0);
    
    return (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
          <Search size={16} className="mr-2" />
          {language === 'fr' ? 'Analyse mot par mot' : 'تحليل كلمة بكلمة'}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {words.map((word, index) => (
            <button
              key={index}
              onClick={() => analyzeWord(word)}
              className="text-right p-2 bg-white dark:bg-gray-600 rounded border hover:border-[#43ada4] hover:bg-[#43ada4]/5 dark:hover:bg-[#43ada4]/10 transition-colors"
            >
              <span className="font-arabic text-lg text-gray-800 dark:text-gray-200">{word}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Texte principal */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                <BookOpen size={20} className="mr-2" />
                {language === 'fr' ? 'Texte du verset' : 'نص الآية'}
              </h3>
              
              {/* Texte arabe */}
              <div className="mb-4 p-4 bg-gradient-to-r from-[#43ada4]/5 to-[#43ada4]/10 dark:from-[#43ada4]/10 dark:to-[#43ada4]/20 rounded-lg border border-[#43ada4]/20">
                <p className="text-2xl sm:text-3xl leading-relaxed font-arabic text-gray-900 dark:text-white text-right mb-4" dir="rtl">
                  {searchInVerse ? (
                    <HighlightedText
                      text={verse.text}
                      searchTerm={searchInVerse}
                      searchOptions={{
                        ignoreDiacritics: true,
                        caseSensitive: false,
                        exactMatch: false,
                        arabicSearchMode: 'words'
                      }}
                      language="ar"
                    />
                  ) : (
                    verse.text
                  )}
                </p>
                
                {/* Traduction française */}
                {verse.translation && (
                  <div className="border-t border-[#43ada4]/20 pt-4">
                    <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                      {searchInVerse ? (
                        <HighlightedText
                          text={verse.translation}
                          searchTerm={searchInVerse}
                          searchOptions={{
                            ignoreDiacritics: true,
                            caseSensitive: false,
                            exactMatch: false
                          }}
                          language="fr"
                        />
                      ) : (
                        verse.translation
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Recherche dans le verset */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchInVerse}
                    onChange={(e) => setSearchInVerse(e.target.value)}
                    placeholder={language === 'fr' ? 'Rechercher dans ce verset...' : 'البحث في هذه الآية...'}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#43ada4]"
                  />
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  {searchInVerse && (
                    <button
                      onClick={() => setSearchInVerse('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Analyse des mots */}
              <button
                onClick={() => setShowWordAnalysis(!showWordAnalysis)}
                className="flex items-center text-[#43ada4] hover:text-[#3a9690] transition-colors mb-2"
              >
                <Lightbulb size={16} className="mr-2" />
                {language === 'fr' ? 'Analyse mot par mot' : 'تحليل كلمة بكلمة'}
                {showWordAnalysis ? <ChevronUp size={16} className="ml-2" /> : <ChevronDown size={16} className="ml-2" />}
              </button>
              {renderWordAnalysis()}
            </div>

            {/* Informations de base */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                <Info size={20} className="mr-2" />
                {language === 'fr' ? 'Informations' : 'المعلومات'}
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <BookOpen size={16} className="mr-2 text-[#43ada4]" />
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {language === 'fr' ? 'Sourate' : 'السورة'}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {verse.surah.name} ({verse.surah.englishName})
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    {verse.surah.englishNameTranslation}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Hash size={16} className="mr-2 text-[#43ada4]" />
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {language === 'fr' ? 'Position' : 'الموضع'}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {language === 'fr' ? 'Verset' : 'آية'} {verse.numberInSurah} / {verse.surah.numberOfAyahs}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    {language === 'fr' ? 'Numéro global:' : 'الرقم العام:'} {verse.number}
                  </p>
                </div>
              </div>
            </div>

            {/* Thèmes principaux */}
            {enrichedData.context?.themes && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                  <Star size={20} className="mr-2" />
                  {language === 'fr' ? 'Thèmes principaux' : 'المواضيع الرئيسية'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {enrichedData.context.themes.map((theme: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-[#43ada4]/10 dark:bg-[#43ada4]/20 text-[#43ada4] dark:text-[#43ada4] rounded-full text-sm font-medium"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'tafsir':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
              <MessageSquare size={20} className="mr-2" />
              {language === 'fr' ? 'Exégèse (Tafsir)' : 'التفسير'}
            </h3>
            
            {enrichedData.tafsir ? (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                  {enrichedData.tafsir[language] || enrichedData.tafsir.fr}
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg text-center">
                <FileText size={32} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {language === 'fr' 
                    ? 'Tafsir non disponible pour ce verset'
                    : 'التفسير غير متوفر لهذه الآية'}
                </p>
              </div>
            )}

            {/* Mots-clés avec explications */}
            {enrichedData.context?.keywords && (
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                  <Zap size={16} className="mr-2" />
                  {language === 'fr' ? 'Mots-clés et concepts' : 'الكلمات المفتاحية والمفاهيم'}
                </h4>
                <div className="space-y-3">
                  {enrichedData.context.keywords.map((keyword: any, index: number) => (
                    <div key={index} className="bg-white dark:bg-gray-600 p-4 rounded-lg border border-gray-200 dark:border-gray-500">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <span className="font-arabic text-lg text-[#43ada4] dark:text-[#43ada4] font-semibold">
                            {keyword.word}
                          </span>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {keyword.meaning}
                          </p>
                        </div>
                        <button
                          onClick={() => analyzeWord(keyword.word)}
                          className="ml-3 p-2 text-[#43ada4] hover:bg-[#43ada4]/10 rounded-lg transition-colors"
                          title={language === 'fr' ? 'Analyser ce mot' : 'تحليل هذه الكلمة'}
                        >
                          <Search size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'linguistics':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
              <Globe size={20} className="mr-2" />
              {language === 'fr' ? 'Analyse linguistique' : 'التحليل اللغوي'}
            </h3>
            
            {enrichedData.linguistics ? (
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    {language === 'fr' ? 'Grammaire' : 'النحو'}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {enrichedData.linguistics.grammar}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    {language === 'fr' ? 'Rhétorique' : 'البلاغة'}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {enrichedData.linguistics.rhetoric}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    {language === 'fr' ? 'Étymologie' : 'علم الاشتقاق'}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {enrichedData.linguistics.etymology}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg text-center">
                <Globe size={32} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {language === 'fr' 
                    ? 'Analyse linguistique non disponible pour ce verset'
                    : 'التحليل اللغوي غير متوفر لهذه الآية'}
                </p>
              </div>
            )}
          </div>
        );

      case 'context':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
              <Clock size={20} className="mr-2" />
              {language === 'fr' ? 'Contexte historique' : 'السياق التاريخي'}
            </h3>
            
            {enrichedData.context?.revelation ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center mb-2">
                      <MapPin size={16} className="mr-2 text-[#43ada4]" />
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {language === 'fr' ? 'Lieu' : 'المكان'}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {enrichedData.context.revelation.place}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center mb-2">
                      <Clock size={16} className="mr-2 text-[#43ada4]" />
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {language === 'fr' ? 'Période' : 'الفترة'}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {enrichedData.context.revelation.period}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center mb-2">
                      <Users size={16} className="mr-2 text-[#43ada4]" />
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {language === 'fr' ? 'Circonstances' : 'الظروف'}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {enrichedData.context.revelation.circumstances}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg text-center">
                <Clock size={32} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {language === 'fr' 
                    ? 'Contexte historique non disponible pour ce verset'
                    : 'السياق التاريخي غير متوفر لهذه الآية'}
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[80] flex items-center justify-center overflow-auto">
      <div className={`bg-white dark:bg-gray-800 w-full h-full md:max-w-4xl md:max-h-[90vh] md:rounded-lg md:shadow-xl md:m-4 overflow-hidden ${language === 'ar' ? 'rtl' : 'ltr'} transition-colors duration-200 flex flex-col`}>
        {/* Header */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 z-10">
          <div className="flex justify-between items-start">
            <div className="flex-1 mr-4">
              <div className="flex flex-col sm:flex-row sm:items-center mb-2 gap-2">
                <span className="text-sm font-medium bg-[#43ada4]/10 dark:bg-[#43ada4]/20 text-[#43ada4] dark:text-[#43ada4] px-3 py-1 rounded-full self-start">
                  {ayahRef}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
                  {verse.surah.name} - {verse.surah.englishName}
                </h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {verse.surah.englishNameTranslation} • {language === 'fr' ? 'Verset' : 'آية'} {verse.numberInSurah}
              </p>
            </div>
            
            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* Audio Player */}
              <AudioPlayer
                audioUrl={getAudioUrl(verse.number)}
                minimal={true}
                currentReciter={currentReciter}
                onReciterChange={onReciterChange}
                language={language}
              />
              
              <button
                onClick={onClose}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-700 px-4 sm:px-6">
          <div className="flex space-x-1 overflow-x-auto scrollbar-thin">
            {[
              { id: 'overview', label: language === 'fr' ? 'Vue d\'ensemble' : 'نظرة عامة', icon: BookOpen },
              { id: 'tafsir', label: language === 'fr' ? 'Tafsir' : 'التفسير', icon: MessageSquare },
              { id: 'linguistics', label: language === 'fr' ? 'Linguistique' : 'اللغويات', icon: Globe },
              { id: 'context', label: language === 'fr' ? 'Contexte' : 'السياق', icon: Clock }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-3 sm:px-4 py-3 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap min-w-0 ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-800 text-[#43ada4] dark:text-[#43ada4] border-b-2 border-[#43ada4]'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon size={16} className="mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {renderTabContent()}
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              <button
                onClick={() => toggleBookmark(verse)}
                className={`flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                  isBookmarkedVerse
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <Heart size={16} className={`mr-2 ${isBookmarkedVerse ? 'fill-current' : ''}`} />
                <span className="hidden sm:inline">
                  {isBookmarkedVerse 
                    ? (language === 'fr' ? 'Favoris' : 'مفضل')
                    : (language === 'fr' ? 'Favori' : 'مفضلة')
                  }
                </span>
              </button>

              <button
                onClick={() => { openNotesForAyah(ayahRef); onClose(); }}
                className="flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px]"
              >
                <BookMarked size={16} className="mr-2" />
                <span className="hidden sm:inline">
                  {language === 'fr' ? 'Notes' : 'ملاحظات'}
                </span>
              </button>

              <button
                onClick={() => { openDictionaryWithWord(''); onClose(); }}
                className="flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px]"
              >
                <BookOpen size={16} className="mr-2" />
                <span className="hidden sm:inline">
                  {language === 'fr' ? 'Dictionnaire' : 'قاموس'}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2 justify-center sm:justify-end">
              <button
                onClick={copyVerse}
                className="flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px]"
                title={language === 'fr' ? 'Copier le verset' : 'نسخ الآية'}
              >
                <Copy size={16} className="mr-2" />
                <span className="hidden sm:inline">
                  {language === 'fr' ? 'Copier' : 'نسخ'}
                </span>
              </button>

              <button
                onClick={shareVerse}
                className="flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px]"
                title={language === 'fr' ? 'Partager le verset' : 'مشاركة الآية'}
              >
                <Share2 size={16} className="mr-2" />
                <span className="hidden sm:inline">
                  {language === 'fr' ? 'Partager' : 'مشاركة'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};