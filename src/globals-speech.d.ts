export {}

declare global {
  interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    start(): void
    stop(): void
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null
    onerror: ((this: SpeechRecognition, ev: Event) => void) | null
    onend: ((this: SpeechRecognition, ev: Event) => void) | null
  }

  interface Window {
    SpeechRecognition?: { new (): SpeechRecognition }
    webkitSpeechRecognition?: { new (): SpeechRecognition }
  }
}
