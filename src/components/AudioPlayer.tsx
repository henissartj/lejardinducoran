import React from 'react';
import { Play, Pause, Loader2, Mic2, X, Search, SkipBack, SkipForward, Repeat, Repeat1, PlayCircle, Settings } from 'lucide-react';
import useAudioPlayer from '../hooks/useAudioPlayer';
import AudioManager from '../utils/AudioManager';
import useGlobalAudioState from '../hooks/useGlobalAudioState';

const RECITERS = {
  'ar.alafasy': 'Mishary Alafasy',
  'ar.abdulbasit': 'Abdul Basit Abdus-Samad',
  'ar.husary': 'Mahmoud Khalil Al-Husary',
  'ar.minshawi': 'Mohamed Siddiq El-Minshawi',
  'ar.sudais': 'Abdur-Rahman As-Sudais',
  'ar.shaatree': 'Abu Bakr Ash-Shaatree'
};

interface AudioPlayerProps {
  audioUrl: string;
  isArabic?: boolean;
  minimal?: boolean;
  className?: string;
  onReciterChange?: (reciter: string) => void;
  currentReciter?: string;
  language?: string;
  showPlaylistControls?: boolean;
  onPlaylistToggle?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onRepeatModeChange?: (mode: 'none' | 'one' | 'all') => void;
  onPlaybackRateChange?: (rate: number) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  isArabic = false,
  minimal = false,
  className = '',
  onReciterChange,
  currentReciter = 'ar.alafasy',
  language = 'fr',
  showPlaylistControls = false,
  onPlaylistToggle,
  onNext,
  onPrevious,
  onRepeatModeChange,
  onPlaybackRateChange
}) => {
  const { 
    playing, 
    loading, 
    error, 
    togglePlayback, 
    isPlaylistMode, 
    repeatMode, 
    playbackRate,
    currentIndex,
    playlistLength
  } = useAudioPlayer(audioUrl);
  
  const globalAudioState = useGlobalAudioState();
  const audioManager = AudioManager.getInstance();
  
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showReciters, setShowReciters] = React.useState(false);
  const [showAdvancedControls, setShowAdvancedControls] = React.useState(false);

  React.useEffect(() => {
    return () => setShowReciters(false);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Si une sourate complète est en cours d'écoute, l'arrêter avant de jouer un verset individuel
    if (globalAudioState.isSurahPlaying && globalAudioState.playlistType === 'surah') {
      audioManager.stopSurahPlayback();
    }
    
    // Pour les versets individuels, s'assurer qu'il n'y a pas de playlist active
    if (!globalAudioState.isSurahPlaying) {
      audioManager.clearPlaylist();
    }
    
    togglePlayback();
  };

  const filteredReciters = Object.entries(RECITERS).filter(([_, name]) => 
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReciterChange = (id: string) => {
    onReciterChange?.(id);
    setShowReciters(false);
  };

  if (minimal) {
    return (
      <div className={`inline-flex items-center space-x-2 ${className}`}>
        <div className="relative">
          <button
            onClick={() => setShowReciters(!showReciters)}
            className="flex items-center gap-1 px-2 py-1.5 text-xs text-[#43ada4] dark:text-[#43ada4] hover:bg-[#43ada4]/5 dark:hover:bg-[#43ada4]/10 rounded transition-colors"
            aria-label="Changer de récitateur"
            title={RECITERS[currentReciter]}
          >
            <Mic2 size={14} />
          </button>
          {showReciters && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {language === 'fr' ? 'Choisir un récitateur' : 'اختيار القارئ'}
                  </h2>
                  <button 
                    onClick={() => setShowReciters(false)}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={language === 'fr' ? 'Rechercher un récitateur...' : 'البحث عن قارئ...'}
                      className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>

                <div className="max-h-[50vh] overflow-y-auto p-2">
                  <div className="grid grid-cols-1 gap-2">
                    {filteredReciters.map(([id, name]) => (
                      <button
                        key={id}
                        onClick={() => handleReciterChange(id)}
                        className={`flex items-center p-3 rounded-lg transition-colors text-left ${
                          currentReciter === id 
                            ? 'bg-[#43ada4]/10 dark:bg-[#43ada4]/20 text-[#43ada4] dark:text-[#43ada4] font-medium' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <Mic2 size={16} className={currentReciter === id ? 'text-[#43ada4] dark:text-[#43ada4]' : 'text-gray-400'} />
                        <span className="ml-2 text-sm flex-1">{name}</span>
                        {currentReciter === id && (
                          <div className="w-2 h-2 bg-[#43ada4] dark:bg-[#43ada4] rounded-full ml-2"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                  <button
                    onClick={() => setShowReciters(false)}
                    className="w-full px-4 py-2 bg-[#43ada4] text-white rounded-lg hover:bg-[#3a9690] transition-colors"
                  >
                    {language === 'fr' ? 'Fermer' : 'إغلاق'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        {error ? (
          <div className="text-red-500 dark:text-red-400 text-xs px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded" title={error}>
            {error}
          </div>
        ) : (
          <button
            onClick={handleClick}
            disabled={loading}
            className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center ${
              loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {loading ? (
              <Loader2 size={16} className="text-[#43ada4] dark:text-[#43ada4] animate-spin" />
            ) : playing ? (
              <Pause size={16} className="text-[#43ada4] dark:text-[#43ada4]" />
            ) : (
              <Play size={16} className="text-[#43ada4] dark:text-[#43ada4]" />
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className} ${isArabic ? 'flex-row-reverse space-x-reverse' : ''}`}>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center ${
          loading ? 'opacity-50 cursor-wait' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        title={error ? error : playing ? 'Pause' : 'Play'}
      >
        {loading ? (
          <Loader2 size={20} className="text-[#43ada4] dark:text-[#43ada4] animate-spin" />
        ) : error ? (
          <div className="text-red-500 dark:text-red-400 text-xs px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded">
            {error}
          </div>
        ) : playing ? (
          <Pause size={20} className="text-[#43ada4] dark:text-[#43ada4]" />
        ) : (
          <Play size={20} className="text-[#43ada4] dark:text-[#43ada4]" />
        )}
      </button>
    </div>
  );
};