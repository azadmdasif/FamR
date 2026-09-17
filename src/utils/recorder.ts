/**
 * Gentle Audio Recorder for Speech Practice
 * Saves voice clips locally as data URLs so Zahid can optionally hear his progress.
 */

export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async start(): Promise<void> {
    this.audioChunks = [];
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
    } catch (err) {
      console.warn('Microphone permission denied or not available:', err);
      throw err;
    }
  }

  async stop(): Promise<{ blob: Blob; dataUrl: string; durationSec: number }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Recorder not started'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          // Approximate duration based on blob size or fallback
          const durationSec = Math.max(1, Math.round(audioBlob.size / 16000));
          resolve({ blob: audioBlob, dataUrl, durationSec });
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);

        // Stop all tracks
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
          this.stream = null;
        }
      };

      this.mediaRecorder.stop();
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}
