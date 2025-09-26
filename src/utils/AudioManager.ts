class AudioManager {
  private static instance: AudioManager;
  private currentAudio: HTMLAudioElement | null = null;
  private currentUrl: string | null = null;
  private currentPlayingUrl: string | null = null;
  private isPlaying: boolean = false;
  private playlist: string[] = [];
  private currentIndex: number = 0;
  private isPlaylistMode: boolean = false;
  private playlistType: 'surah' | 'single' | null = null;
  private repeatMode: 'none' | 'one' | 'all' = 'none';
  private playbackRate: number = 1.0;
  private listeners = new Map<string, Set<(state: AudioState) => void>>();
  private globalListeners = new Set<(state: GlobalAudioState) => void>();
  private loadingPromise: Promise<void> | null = null;
  private isLoading: boolean = false;
  private currentSurahInfo: { number: number; name: string } | null = null;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private notifyListeners(url: string, state: AudioState) {
    this.listeners.get(url)?.forEach(listener => listener(state));
  }

  private notifyAllListeners(state: Omit<AudioState, 'isPlaying'>) {
    this.listeners.forEach((listeners, url) => {
      listeners.forEach(listener => listener({
        ...state,
        isPlaying: url === this.currentUrl && this.isPlaying,
        isPlaylistMode: this.isPlaylistMode,
        repeatMode: this.repeatMode,
        playbackRate: this.playbackRate,
        currentIndex: this.currentIndex,
        playlistLength: this.playlist.length
      }));
    });
    
    // Notify global listeners
    this.notifyGlobalListeners({
      currentPlayingUrl: this.currentPlayingUrl,
      isPlaying: this.isPlaying,
      isLoading: state.isLoading,
      error: state.error,
      isPlaylistMode: this.isPlaylistMode,
      repeatMode: this.repeatMode,
      playbackRate: this.playbackRate,
      currentIndex: this.currentIndex,
      playlistLength: this.playlist.length
    });
    
    // Notify global listeners
    this.notifyGlobalListeners({
      currentPlayingUrl: this.currentPlayingUrl,
      isPlaying: this.isPlaying,
      isLoading: this.isLoading,
      error: state.error,
      isPlaylistMode: this.isPlaylistMode,
      repeatMode: this.repeatMode,
      playbackRate: this.playbackRate,
      currentIndex: this.currentIndex,
      playlistLength: this.playlist.length
    });
  }

  private notifyGlobalListeners(state: GlobalAudioState) {
    this.globalListeners.forEach(listener => listener(state));
  }

  private isValidAudioFormat(url: string): boolean {
    const supportedFormats = ['.mp3', '.wav', '.m4a', '.aac', '.ogg'];
    return supportedFormats.some(format => url.toLowerCase().endsWith(format));
  }

  subscribe(url: string, callback: (state: AudioState) => void) {
    if (!this.listeners.has(url)) {
      this.listeners.set(url, new Set());
    }
    this.listeners.get(url)!.add(callback);

    callback({
      isPlaying: this.currentUrl === url && this.isPlaying,
      isLoading: this.isLoading && this.currentUrl === url,
      error: null,
      isPlaylistMode: this.isPlaylistMode,
      playlistType: this.playlistType,
      repeatMode: this.repeatMode,
      playbackRate: this.playbackRate,
      currentIndex: this.currentIndex,
      playlistLength: this.playlist.length,
      currentSurahInfo: this.currentSurahInfo
    });

    return () => {
      this.listeners.get(url)?.delete(callback);
      if (this.listeners.get(url)?.size === 0) {
        this.listeners.delete(url);
      }
    };
  }

  async toggle(url: string) {
    try {
      if (!this.isValidAudioFormat(url)) {
        throw new Error('Format audio non supporté');
      }

      if (this.currentUrl === url && this.currentAudio) {
        if (this.currentAudio.paused) {
          this.notifyAllListeners({ isLoading: true, error: null });
          try {
            await this.currentAudio.play();
            this.isPlaying = true;
            this.currentPlayingUrl = url;
            this.notifyAllListeners({ isLoading: false, error: null });
          } catch (error) {
            this.notifyAllListeners({
              isLoading: false,
              error: 'Erreur de lecture'
            });
          }
        } else {
          this.currentAudio.pause();
          this.currentAudio.currentTime = 0;
          this.isPlaying = false;
          this.currentPlayingUrl = null;
          this.notifyAllListeners({ isLoading: false, error: null });
        }
        return;
      }

      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.isPlaying = false;
        this.currentPlayingUrl = null;
      }

      this.isLoading = true;
      this.notifyAllListeners({ isLoading: true, error: null });

      const audio = new Audio(url);

      this.loadingPromise = new Promise((resolve, reject) => {
        audio.addEventListener('canplaythrough', () => {
          resolve();
        }, { once: true });
        
        audio.addEventListener('error', (event) => {
          const error = (event.target as HTMLAudioElement).error;
          let errorMessage = 'Erreur de chargement';
          
          if (error) {
            switch (error.code) {
              case MediaError.MEDIA_ERR_ABORTED:
                errorMessage = 'Chargement audio interrompu';
                break;
              case MediaError.MEDIA_ERR_NETWORK:
                errorMessage = 'Erreur réseau';
                break;
              case MediaError.MEDIA_ERR_DECODE:
                errorMessage = 'Erreur de décodage audio';
                break;
              case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMessage = 'Source audio non supportée';
                break;
              default:
                errorMessage = 'Erreur de chargement audio';
                break;
            }
          }
          reject(new Error(errorMessage));
        }, { once: true });
      });

      try {
        await this.loadingPromise;

        this.currentAudio = audio;
        this.currentUrl = url;

        if (this.playbackRate !== 1.0) {
          audio.playbackRate = this.playbackRate;
        }

        audio.addEventListener('ended', () => {
          this.isPlaying = false;
          this.handleAudioEnded();
        });

        await audio.play();
        this.isPlaying = true;
        this.currentPlayingUrl = url;
        this.notifyAllListeners({ isLoading: false, error: null });
      } catch (error) {
        console.error('Audio loading error:', error);
        this.isPlaying = false;
        this.notifyAllListeners({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Erreur de chargement audio'
        });
        throw error;
      } finally {
        this.loadingPromise = null;
        this.isLoading = false;
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      this.isLoading = false;
      this.notifyAllListeners({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur de lecture audio'
      });
    }
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.isPlaying = false;
      this.currentPlayingUrl = null;
      this.notifyAllListeners({ isLoading: false, error: null });
      this.currentAudio = null;
      this.currentUrl = null;
    }
  }

  setPlaylist(urls: string[], startIndex: number = 0, type: 'surah' | 'single' = 'single', surahInfo?: { number: number; name: string }) {
    this.playlist = urls;
    this.currentIndex = startIndex;
    this.isPlaylistMode = true;
    this.playlistType = type;
    this.currentSurahInfo = surahInfo || null;
    this.notifyAllListeners({
      isLoading: false, 
      error: null
    });
  }

  clearPlaylist() {
    this.playlist = [];
    this.currentIndex = 0;
    this.isPlaylistMode = false;
    this.playlistType = null;
    this.currentSurahInfo = null;
    this.stop();
    this.notifyAllListeners({
      isLoading: false, 
      error: null
    });
  }

  // Nouvelle méthode pour arrêter spécifiquement l'écoute d'une sourate complète
  stopSurahPlayback() {
    if (this.isPlaylistMode && this.playlistType === 'surah') {
      this.clearPlaylist();
    }
  }

  // Nouvelle méthode pour vérifier si une sourate complète est en cours d'écoute
  isSurahPlaying(): boolean {
    return this.isPlaylistMode && this.playlistType === 'surah' && this.isPlaying;
  }

  // Obtenir les informations de la sourate en cours
  getCurrentSurahInfo(): { number: number; name: string } | null {
    return this.currentSurahInfo;
  }

  setRepeatMode(mode: 'none' | 'one' | 'all') {
    this.repeatMode = mode;
    
    this.notifyAllListeners({ 
      isLoading: false, 
      error: null
    });
  }

  setPlaybackRate(rate: number) {
    this.playbackRate = Math.max(0.25, Math.min(2.0, rate));
    if (this.currentAudio) {
      this.currentAudio.playbackRate = this.playbackRate;
    }
    this.notifyAllListeners({ 
      isLoading: false, 
      error: null
    });
  }

  async playNext() {
    if (!this.isPlaylistMode || this.playlist.length === 0) return;

    if (this.currentIndex < this.playlist.length - 1) {
      this.currentIndex++;
      await this.toggle(this.playlist[this.currentIndex]);
    } else if (this.repeatMode === 'all') {
      this.currentIndex = 0;
      await this.toggle(this.playlist[this.currentIndex]);
    } else {
      this.stop();
    }
  }

  async playPrevious() {
    if (!this.isPlaylistMode || this.playlist.length === 0) return;

    if (this.currentIndex > 0) {
      this.currentIndex--;
      await this.toggle(this.playlist[this.currentIndex]);
    } else if (this.repeatMode === 'all') {
      this.currentIndex = this.playlist.length - 1;
      await this.toggle(this.playlist[this.currentIndex]);
    }
  }

  async jumpToIndex(index: number) {
    if (!this.isPlaylistMode || index < 0 || index >= this.playlist.length) return;
    
    this.currentIndex = index;
    await this.toggle(this.playlist[index]);
  }

  private async handleAudioEnded() {
    if (this.repeatMode === 'one') {
      if (this.currentAudio) {
        this.currentAudio.currentTime = 0;
        this.currentPlayingUrl = this.currentUrl;
        try {
          await this.currentAudio.play();
          return;
        } catch (error) {
          console.error('Error repeating audio:', error);
        }
      }
    }

    if (this.isPlaylistMode && this.playlist.length > 0) {
      await this.playNext();
    } else {
      this.currentPlayingUrl = null;
      this.notifyAllListeners({ 
        isLoading: false, 
        error: null
      });
    }
  }

  subscribeToGlobalState(callback: (state: GlobalAudioState) => void) {
    this.globalListeners.add(callback);

    // Immediately call with current state
    callback({
      currentPlayingUrl: this.currentPlayingUrl,
      isPlaying: this.isPlaying,
      isLoading: this.isLoading,
      error: null,
      isPlaylistMode: this.isPlaylistMode,
      playlistType: this.playlistType,
      repeatMode: this.repeatMode,
      playbackRate: this.playbackRate,
      currentIndex: this.currentIndex,
      playlistLength: this.playlist.length,
      currentSurahInfo: this.currentSurahInfo
    });

    return () => {
      this.globalListeners.delete(callback);
    };
  }

  getPlaylist(): string[] {
    return [...this.playlist];
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  getRepeatMode(): 'none' | 'one' | 'all' {
    return this.repeatMode;
  }

  getPlaybackRate(): number {
    return this.playbackRate;
  }

  isInPlaylistMode(): boolean {
    return this.isPlaylistMode;
  }
}

interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  isPlaylistMode?: boolean;
  playlistType?: 'surah' | 'single' | null;
  repeatMode?: 'none' | 'one' | 'all';
  playbackRate?: number;
  currentIndex?: number;
  playlistLength?: number;
  currentSurahInfo?: { number: number; name: string } | null;
}

interface GlobalAudioState {
  currentPlayingUrl: string | null;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  isPlaylistMode: boolean;
  playlistType: 'surah' | 'single' | null;
  repeatMode: 'none' | 'one' | 'all';
  playbackRate: number;
  currentIndex: number;
  playlistLength: number;
  currentSurahInfo: { number: number; name: string } | null;
}

export type { GlobalAudioState };
export default AudioManager;