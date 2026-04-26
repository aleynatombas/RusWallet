import { useCallback, useState } from 'react';

/** Tarayıcı Web Speech API (Chrome); lib.dom’da her sürümde tanımlı değil. */
type WebSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  onresult: ((ev: WebSpeechResultEvent) => void) | null;
  onerror: ((ev: WebSpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
};

type WebSpeechResultEvent = {
  resultIndex: number;
  results: { length: number; [index: number]: { 0: { transcript: string } } };
};

type WebSpeechErrorEvent = { error: string };

function getRecognitionCtor(): (new () => WebSpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: new () => WebSpeechRecognition;
    webkitSpeechRecognition?: new () => WebSpeechRecognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Chrome / Edge: Web Speech API, tr-TR. Safari: kısıtlı veya yok. */
export function useBrowserSpeechRecognition() {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supported = getRecognitionCtor() !== null;

  const listenOnce = useCallback((onFinal: (text: string) => void) => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError('Bu tarayıcıda ses tanıma desteklenmiyor (Chrome veya Edge deneyin).');
      return;
    }
    setError(null);
    const rec = new Ctor();
    rec.lang = 'tr-TR';
    rec.continuous = false;
    rec.interimResults = false;
    setListening(true);

    rec.onresult = (ev: WebSpeechResultEvent) => {
      let text = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        text += ev.results[i][0]?.transcript ?? '';
      }
      const t = text.trim();
      if (t) onFinal(t);
    };

    rec.onerror = (ev: WebSpeechErrorEvent) => {
      if (ev.error === 'aborted' || ev.error === 'no-speech') return;
      setError(ev.error === 'not-allowed' ? 'Mikrofon izni gerekli.' : `Ses tanıma: ${ev.error}`);
      setListening(false);
    };

    rec.onend = () => {
      setListening(false);
    };

    try {
      rec.start();
    } catch {
      setError('Ses tanıma başlatılamadı.');
      setListening(false);
    }
  }, []);

  return { supported, listening, error, setError, listenOnce };
}
