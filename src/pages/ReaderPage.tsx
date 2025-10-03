import React from 'react';
import { QuranReader } from '../components/QuranReader';
import { useAppContext } from '../contexts/AppContext';

export default function ReaderPage() {
  const {
    language,
    currentReciter,
    setCurrentReciter,
    getAudioUrl,
    loadSurah,
    isBookmarked,
    toggleBookmark,
    openNotesForAyah,
    openDictionaryWithWord,
    handleVerseClick
  } = useAppContext();

  return (
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
  );
}
