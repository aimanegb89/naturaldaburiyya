// Synthesized new-order alert sounds (Web Audio, no files).
type Note = { f: number; t: number; d: number; type?: OscillatorType; g?: number; slide?: number };

export const CHIMES: { id: string; label: string; notes: Note[] }[] = [
  { id: 'classic', label: 'كلاسيكي', notes: [{ f: 880, t: 0, d: 0.35 }, { f: 1320, t: 0.18, d: 0.35 }] },
  { id: 'bell', label: 'جرس هادئ', notes: [{ f: 1046, t: 0, d: 1.4, type: 'sine' }, { f: 2093, t: 0, d: 0.9, g: 0.3 }] },
  { id: 'register', label: 'صندوق النقود', notes: [{ f: 2637, t: 0, d: 0.08, type: 'square', g: 0.4 }, { f: 3136, t: 0.09, d: 0.08, type: 'square', g: 0.4 }, { f: 1568, t: 0.2, d: 0.6, type: 'triangle' }, { f: 2349, t: 0.2, d: 0.6 }] },
  { id: 'ping', label: 'رنين رقمي', notes: [{ f: 1760, t: 0, d: 0.25, type: 'sine' }] },
  { id: 'beep', label: 'صفارة مزدوجة', notes: [{ f: 1000, t: 0, d: 0.12, type: 'square', g: 0.5 }, { f: 1000, t: 0.2, d: 0.12, type: 'square', g: 0.5 }] },
  { id: 'arpeggio', label: 'نغمة صاعدة', notes: [523, 659, 784, 1046].map((f, i) => ({ f, t: i * 0.11, d: 0.3, type: 'triangle' as const })) },
  { id: 'doorbell', label: 'جرس الباب', notes: [{ f: 659, t: 0, d: 0.7, type: 'sine' }, { f: 523, t: 0.45, d: 0.9, type: 'sine' }] },
  { id: 'marimba', label: 'ماريمبا', notes: [784, 988, 1175, 988].map((f, i) => ({ f, t: i * 0.13, d: 0.22, type: 'sine' as const })) },
  { id: 'alarm', label: 'إنذار قوي', notes: [0, 1, 2].flatMap((r) => [{ f: 1200, t: r * 0.5, d: 0.2, type: 'sawtooth' as const, g: 0.35 }, { f: 900, t: r * 0.5 + 0.22, d: 0.2, type: 'sawtooth' as const, g: 0.35 }]) },
  { id: 'pop', label: 'فقاعة', notes: [{ f: 400, t: 0, d: 0.15, type: 'sine', slide: 1200 }] },
];

export function playChime(id = 'classic', volume: string = 'normal') {
  try {
    const preset = CHIMES.find((c) => c.id === id) ?? CHIMES[0];
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    const peak = volume === 'loud' ? 0.6 : 0.25;
    preset.notes.forEach((n) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = n.type ?? 'sine';
      const t = ctx.currentTime + n.t;
      o.frequency.setValueAtTime(n.f, t);
      if (n.slide) o.frequency.exponentialRampToValueAtTime(n.slide, t + n.d);
      o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak * (n.g ?? 1), t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + n.d);
      o.start(t); o.stop(t + n.d + 0.05);
    });
  } catch { /* audio blocked */ }
  navigator.vibrate?.([200, 100, 200]);
}
