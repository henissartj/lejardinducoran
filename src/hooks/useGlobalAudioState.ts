import { useState, useEffect, useRef } from 'react';
import AudioManager, { GlobalAudioState } from '../utils/AudioManager';

export default function useGlobalAudioState() {
  const [state, setState] = useState<GlobalAudioState>({
    currentPlayingUrl: null,
    isPlaying: false,
    isLoading: false,
    error: null,
    isPlaylistMode: false,
    playlistType: null,
    repeatMode: 'none',
    playbackRate: 1.0,
    currentIndex: 0,
    playlistLength: 0,
    currentSurahInfo: null
  });

  const audioManager = AudioManager.getInstance();
  const mountedRef = useRef(true);

  useEffect(() => {
    const cleanup = audioManager.subscribeToGlobalState((newState) => {
      if (mountedRef.current) {
        setState(newState);
      }
    });

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, []);

  return state;
}