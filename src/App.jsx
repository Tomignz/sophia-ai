import { useEffect, useState, useCallback, useRef } from 'react';
import SophiaParticles from './components/SophiaParticles';

const useSophiaAI = () => {
  const [isTalking, setIsTalking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  const speak = useCallback((text) => {
    if (!window.speechSynthesis) {
      setError('Tu navegador no soporta la síntesis de voz.');
      return;
    }

    setIsTalking(true);
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-AR';

    const assignVoice = () => {
      const voices = synth.getVoices();
      const voice = voices.find(v =>
        v.lang.startsWith('es') &&
        /female|mujer|soledad|google es|zira|sophia/.test(v.name.toLowerCase())
      ) || voices.find(v => v.lang.startsWith('es'));
      if (voice) utterance.voice = voice;
      synth.speak(utterance);
    };

    utterance.onend = () => setIsTalking(false);
    utterance.onerror = (event) => {
      console.error('❌ Error en síntesis de voz:', event);
      setIsTalking(false);
      setError('Hubo un problema al hablar.');
    };

    if (synth.getVoices().length > 0) {
      assignVoice();
    } else {
      synth.onvoiceschanged = assignVoice;
    }
  }, []);

  const callSophiaAI = useCallback(async (promptText) => {
    try {
      const res = await fetch('https://n8n.srv900232.hstgr.cloud/webhook/sophia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText }),
      });

      if (!res.ok) {
        const msg = await res.text();
        console.error('❌ Error de respuesta:', res.status, msg);
        speak('Lo siento, la nube de Sophia no respondió bien.');
        return;
      }

      const data = await res.json();
      if (data?.respuesta || data?.reply || data?.response) {
        speak(data.respuesta || data.reply || data.response);
      } else {
        speak('No encontré una respuesta válida. ¿Querés intentarlo de nuevo?');
      }
    } catch (err) {
      console.error('❌ Error al contactar con Sophia AI:', err);
      speak('Uy, hubo un problema conectando con la nube. Por favor, revisá tu conexión.');
      setError('Error de conexión con Sophia.');
    }
  }, [speak]);

  const startRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Este navegador no soporta el reconocimiento de voz.');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      console.log('🎙️ Reconocimiento de voz iniciado.');
    };

    recognition.onresult = (event) => {
      const text = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      console.log('🎤 Escuchado:', text);

      if (text.includes('hola sophia') || text.includes('hola sofía')) {
        console.log('🟢 Activada por palabra clave.');
        speak('Hola Tomás, ¿cómo estás hoy?');
      } else {
        callSophiaAI(text);
      }
    };

    recognition.onerror = (event) => {
      console.error('❌ Error en reconocimiento de voz:', event.error);
      setIsListening(false);
      if (event.error === 'no-speech') {
        setError('No se detectó voz. Intenta hablar más claro.');
      } else if (event.error === 'not-allowed') {
        setError('Permiso de micrófono denegado.');
      } else {
        setError(`Error de reconocimiento: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log('🔴 Reconocimiento de voz finalizado.');
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Error al iniciar el reconocimiento:", err);
      setError("Hubo un problema al iniciar el micrófono.");
      setIsListening(false);
    }
  }, [speak, callSophiaAI]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  return { isTalking, isListening, error, startRecognition };
};

export default function App() {
  const { isTalking, isListening, error, startRecognition } = useSophiaAI();

  useEffect(() => {
    const handleFirstInteraction = () => {
      startRecognition();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [startRecognition]);

  return (
    <div className="relative h-screen bg-black text-white overflow-hidden flex flex-col items-center justify-center">
      <SophiaParticles isTalking={isTalking} />
      {/* Podés agregar un indicador visual acá si querés */}
      {error && <p className="text-red-400 mt-4">{error}</p>}
    </div>
  );
}
