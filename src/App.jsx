import { useEffect, useState } from 'react'
import SophiaParticles from './components/SophiaParticles'

export default function App() {
  const [isTalking, setIsTalking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState(null)

  const speak = (text) => {
    const synth = window.speechSynthesis
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'es-AR'

    const voices = synth.getVoices()
    const voice = voices.find(v =>
      v.lang.includes('es') && v.name.toLowerCase().includes('female')
    ) || voices.find(v => v.lang.includes('es'))

    if (voice) utterance.voice = voice

    synth.speak(utterance)
  }

  const askSophia = async (text) => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text })
      })
      const data = await res.json()
      if (data.reply) speak(data.reply)
    } catch (e) {
      console.error('❌ Error al contactar con Sophia:', e)
      setError('Error al obtener respuesta de Sophia.')
    }
  }

  const startRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Este navegador no soporta reconocimiento de voz.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'es-ES'
    recognition.continuous = true
    recognition.interimResults = false

    recognition.onresult = (event) => {
      const text = event.results[event.results.length - 1][0].transcript.trim().toLowerCase()
      console.log('🎤 Escuchado:', text)

      if (text.includes('hola sophia') || text.includes('hola sofía')) {
        console.log('🟢 Activada por voz')
        setIsTalking(true)
        speak('Hola Tomás, ¿cómo estás hoy?')
        setTimeout(() => setIsTalking(false), 4000)
      } else {
        setIsTalking(true)
        askSophia(text)
        setTimeout(() => setIsTalking(false), 5000)
      }
    }

    recognition.onerror = (e) => {
      console.error('❌ Error en reconocimiento:', e.error)
      setError(`Error de reconocimiento: ${e.error}`)
    }

    recognition.start()
    setIsListening(true)
  }

  useEffect(() => {
    const handleFirstInteraction = () => {
      startRecognition()
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('touchstart', handleFirstInteraction)
    }

    window.addEventListener('click', handleFirstInteraction)
    window.addEventListener('touchstart', handleFirstInteraction)

    return () => {
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('touchstart', handleFirstInteraction)
    }
  }, [])

  return (
    <div className="relative h-screen bg-black text-white overflow-hidden">
      <SophiaParticles isTalking={isTalking} />

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-2xl font-bold mb-4">Sophia Visual AI</h1>
        <p className="text-sm opacity-70">Decí: <strong>"Hola Sophia"</strong></p>
        {error && (
          <p className="mt-4 text-red-500 text-sm">⚠️ {error}</p>
        )}
        {isListening && !error && (
          <p className="text-green-400 mt-2 text-xs">🎙️ Escuchando...</p>
        )}
      </div>
    </div>
  )
}
