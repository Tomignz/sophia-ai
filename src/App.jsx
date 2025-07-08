import { useEffect, useState } from 'react'
import SophiaParticles from './components/SophiaParticles'

export default function App() {
  const [isTalking, setIsTalking] = useState(false)

  useEffect(() => {
    const handleFirstClick = () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        alert('Tu navegador no soporta reconocimiento de voz')
        return
      }

      const recognition = new SpeechRecognition()
      recognition.lang = 'es-ES'
      recognition.continuous = true
      recognition.interimResults = false

      recognition.onresult = (event) => {
        const text = event.results[event.results.length - 1][0].transcript
          .trim()
          .toLowerCase()

        console.log('🎤 Escuchado:', text)

        if (text.includes('hola sophia') || text.includes('hola sofía')) {
          console.log('🟢 Activada por voz')
          setIsTalking(true)
          speak('Hola Tomás, ¿cómo estás hoy?')
          setTimeout(() => setIsTalking(false), 4000)
        }
      }

      recognition.onerror = (e) => {
        console.error('❌ Error en reconocimiento:', e)
      }

      recognition.start()
      window.removeEventListener('click', handleFirstClick)
    }

    window.addEventListener('click', handleFirstClick)

    // Limpieza al desmontar
    return () => {
      window.removeEventListener('click', handleFirstClick)
    }
  }, [])

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'es-AR'
    speechSynthesis.speak(utterance)
  }

  return (
    <div className="relative h-screen bg-black text-white overflow-hidden">
      <SophiaParticles isTalking={isTalking} />

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-2xl font-bold mb-4">Sophia Visual AI</h1>
        <p className="text-sm opacity-70">Decí: <strong>"Hola Sophia"</strong></p>
      </div>
    </div>
  )
}
