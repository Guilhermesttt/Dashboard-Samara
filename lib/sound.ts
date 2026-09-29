"use client";

/**
 * Utilitário de som para notificações da clínica Dra. Sâmara Souza - Estética Avançada
 * Reproduz o arquivo /notification.mp3 e conta com sintetizador Web Audio API
 * cristalino estilo Apple como fallback ou alerta sonoro direto.
 */
function playAppleStyleChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Two-tone bell harmonic chime (587.33 Hz - D5, followed by 880 Hz - A5)
    const tones = [
      { freq: 587.33, start: 0, duration: 0.28 },
      { freq: 880.0, start: 0.12, duration: 0.42 },
    ];

    tones.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.18, now + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration);
    });
  } catch (err) {
    console.warn("AudioContext chime fallback error:", err);
  }
}

export function playNotificationSound() {
  if (typeof window === "undefined") return;
  try {
    const audio = new Audio("/notification.mp3");
    audio.volume = 0.8;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback to Web Audio API synthesized chime
        playAppleStyleChime();
      });
    }
  } catch {
    playAppleStyleChime();
  }
}
