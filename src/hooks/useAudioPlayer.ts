import { useState, useEffect, useRef } from 'react';
import AudioManager from '../utils/AudioManager';

export default function useAudioPlayer(url: string) {
  const [state, setState] = useState({
    playing: false,
    loading: false,
    error: null as string | null,
    isPlaylistMode: false,
    repeatMode: 'none' as 'none' | 'one' | 'all',
    playbackRate: 1.0,
    currentIndex: 0,
    playlistLength: 0
  });

  const audioManager = AudioManager.getInstance();
  const mountedRef = useRef(true);

  useEffect(() => {
    const cleanup = audioManager.subscribe(url, (newState) => {
      if (mountedRef.current) {
        setState({
          playing: newState.isPlaying,
          loading: newState.isLoading,
          error: newState.error,
          isPlaylistMode: newState.isPlaylistMode || false,
          repeatMode: newState.repeatMode || 'none',
          playbackRate: newState.playbackRate || 1.0,
          currentIndex: newState.currentIndex || 0,
          playlistLength: newState.playlistLength || 0
        });
      }
    });

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [url]);

  return {
    ...state,
    togglePlayback: () => audioManager.toggle(url),
    setPlaylist: (urls: string[], startIndex?: number) => audioManager.setPlaylist(urls, startIndex),
    clearPlaylist: () => audioManager.clearPlaylist(),
    setRepeatMode: (mode: 'none' | 'one' | 'all') => audioManager.setRepeatMode(mode),
    setPlaybackRate: (rate: number) => audioManager.setPlaybackRate(rate),
    playNext: () => audioManager.playNext(),
    playPrevious: () => audioManager.playPrevious(),
    jumpToIndex: (index: number) => audioManager.jumpToIndex(index)
  };
}