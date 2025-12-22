
// Sound Data URLs (Short synthesized beeps for premium feel)
const SOUNDS: Record<string, string> = {
    chime: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTdvT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT1z',
    glass: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTdvT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT1z',
    digital: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTdvT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT1z',
    success: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTdvT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT1z',
    alert: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTdvT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT1z',
};

// ... In practice, would use high quality assets
// Since I can't provide full audio files easily via code,
// I'll implement a system that uses the AudioContext to generate pleasant beeps.

class NotificationManager {
    private static instance: NotificationManager;
    private audioCtx: AudioContext | null = null;

    private constructor() {
        if (typeof window !== 'undefined') {
            // Context will be created on first interaction to comply with browser policies
        }
    }

    public static getInstance(): NotificationManager {
        if (!NotificationManager.instance) {
            NotificationManager.instance = new NotificationManager();
        }
        return NotificationManager.instance;
    }

    private initAudio() {
        if (!this.audioCtx && typeof window !== 'undefined') {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                this.audioCtx = new AudioContextClass();
            }
        }
        if (this.audioCtx?.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    public playSound(name: string, volume: number = 0.5) {
        this.initAudio();
        if (!this.audioCtx) return;

        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume * 0.2, this.audioCtx.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.3);

        // Different frequencies for different sounds
        switch (name) {
            case 'chime':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, this.audioCtx.currentTime); // A5
                oscillator.frequency.exponentialRampToValueAtTime(440, this.audioCtx.currentTime + 0.3);
                break;
            case 'glass':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(1200, this.audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(800, this.audioCtx.currentTime + 0.2);
                break;
            case 'digital':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(400, this.audioCtx.currentTime);
                oscillator.frequency.setValueAtTime(600, this.audioCtx.currentTime + 0.1);
                break;
            case 'success':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(523.25, this.audioCtx.currentTime); // C5
                oscillator.frequency.setValueAtTime(659.25, this.audioCtx.currentTime + 0.1); // E5
                oscillator.frequency.setValueAtTime(783.99, this.audioCtx.currentTime + 0.2); // G5
                break;
            case 'alert':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(300, this.audioCtx.currentTime);
                oscillator.frequency.linearRampToValueAtTime(600, this.audioCtx.currentTime + 0.1);
                oscillator.frequency.linearRampToValueAtTime(300, this.audioCtx.currentTime + 0.2);
                break;
            default:
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(440, this.audioCtx.currentTime);
        }

        oscillator.start();
        oscillator.stop(this.audioCtx.currentTime + 0.4);
    }
}

export const notificationManager = NotificationManager.getInstance();
