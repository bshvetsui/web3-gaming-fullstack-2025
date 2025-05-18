/**
 * Audio manager for game sounds and music
 */
export class AudioManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private music: HTMLAudioElement | null = null;
  private soundVolume: number = 0.7;
  private musicVolume: number = 0.5;
  private isMuted: boolean = false;

  /**
   * Preload sound file
   */
  loadSound(name: string, url: string): void {
    const audio = new Audio(url);
    audio.preload = 'auto';
    this.sounds.set(name, audio);
  }

  /**
   * Play sound effect
   */
  playSound(name: string, loop: boolean = false): void {
    if (this.isMuted) return;

    const sound = this.sounds.get(name);
    if (!sound) {
      console.warn(`Sound ${name} not loaded`);
      return;
    }

    sound.volume = this.soundVolume;
    sound.loop = loop;
    sound.currentTime = 0;
    sound.play().catch((error) => {
      console.error('Error playing sound:', error);
    });
  }

  /**
   * Stop sound effect
   */
  stopSound(name: string): void {
    const sound = this.sounds.get(name);
    if (sound) {
      sound.pause();
      sound.currentTime = 0;
    }
  }

  /**
   * Play background music
   */
  playMusic(url: string, loop: boolean = true): void {
    if (this.isMuted) return;

    if (this.music) {
      this.music.pause();
    }

    this.music = new Audio(url);
    this.music.volume = this.musicVolume;
    this.music.loop = loop;
    this.music.play().catch((error) => {
      console.error('Error playing music:', error);
    });
  }

  /**
   * Stop background music
   */
  stopMusic(): void {
    if (this.music) {
      this.music.pause();
      this.music.currentTime = 0;
    }
  }

  /**
   * Set sound effects volume
   */
  setSoundVolume(volume: number): void {
    this.soundVolume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach((sound) => {
      sound.volume = this.soundVolume;
    });
  }

  /**
   * Set music volume
   */
  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.music) {
      this.music.volume = this.musicVolume;
    }
  }

  /**
   * Mute all audio
   */
  mute(): void {
    this.isMuted = true;
    this.sounds.forEach((sound) => sound.pause());
    if (this.music) {
      this.music.pause();
    }
  }

  /**
   * Unmute all audio
   */
  unmute(): void {
    this.isMuted = false;
  }

  /**
   * Toggle mute
   */
  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.mute();
    }
    return this.isMuted;
  }

  /**
   * Get current mute state
   */
  isMutedState(): boolean {
    return this.isMuted;
  }

  /**
   * Cleanup all audio
   */
  dispose(): void {
    this.sounds.forEach((sound) => {
      sound.pause();
      sound.src = '';
    });
    this.sounds.clear();

    if (this.music) {
      this.music.pause();
      this.music.src = '';
      this.music = null;
    }
  }
}

export const audioManager = new AudioManager();
