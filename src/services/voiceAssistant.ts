/**
 * Voice Assistant & Speech Input Service
 */

export interface VoiceRecognitionController {
  stop: () => void;
  isListening: boolean;
}

/**
 * Speaks out loud asking the user for their voice / video topic idea
 */
export function speakAssistantPrompt(
  prompt = "I'm listening. Tell me the topic or voice idea for your next YouTube video."
): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(prompt);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Select modern natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural'))
      ) || voices.find((v) => v.lang.startsWith('en'));

      if (preferred) utterance.voice = preferred;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    } catch {
      resolve();
    }
  });
}

/**
 * Speaks scene narration
 */
export function speakNarrationText(text: string, onEnd?: () => void): SpeechSynthesisUtterance | null {
  if (!('speechSynthesis' in window)) return null;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02;
    utterance.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (naturalVoice) utterance.voice = naturalVoice;
    if (onEnd) utterance.onend = () => onEnd();
    window.speechSynthesis.speak(utterance);
    return utterance;
  } catch {
    return null;
  }
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

/**
 * Listens for speech using browser Web Speech API
 */
export function startVoiceRecognition(options: {
  onTranscript: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}): VoiceRecognitionController {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    options.onError('Speech recognition is not supported in this browser. You can type or use one-click voice presets below!');
    options.onEnd();
    return { stop: () => {}, isListening: false };
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let isListening = true;

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const activeText = finalTranscript || interimTranscript;
      options.onTranscript(activeText, !!finalTranscript);
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition event error:', event.error);
      if (event.error !== 'no-speech') {
        options.onError(`Microphone: ${event.error}`);
      }
    };

    recognition.onend = () => {
      isListening = false;
      options.onEnd();
    };

    recognition.start();

    return {
      stop: () => {
        if (isListening) {
          try {
            recognition.stop();
          } catch {}
          isListening = false;
        }
      },
      isListening: true,
    };
  } catch (err: any) {
    options.onError(err.message || 'Failed to start microphone');
    options.onEnd();
    return { stop: () => {}, isListening: false };
  }
}

/**
 * Quick voice sample prompts for rapid testing & high convenience
 */
export const SAMPLE_VOICE_PROMPTS = [
  'Top 5 breakthrough AI tools every developer must know in 2026',
  'How to automate your entire business with intelligent agents in 3 steps',
  'The dark truth about algorithmic social media feeds and your brain',
  'Why quantum computing will crack classical encryption by 2030',
  '3 daily habits of high performance engineers that save 15 hours a week',
];
