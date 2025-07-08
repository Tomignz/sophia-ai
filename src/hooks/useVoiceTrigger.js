import { useEffect } from 'react'

export function useVoiceTrigger(onTrigger) {
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition no soportado')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.lang = 'es-AR'
    recognition.interimResults = false

    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1]
      const text = last[0].transcript.trim().toLowerCase()
      console.log('🎤 Escuchado:', text)
      if (text.includes('hola sofía') || text.includes('hola sophia')) {
        onTrigger()
      }
    }

    recognition.onerror = (e) => {
      console.error('Reconocimiento de voz falló:', e)
    }

    recognition.start()

    return () => recognition.stop()
  }, [onTrigger])
}
