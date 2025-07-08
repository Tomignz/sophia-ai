import { useEffect, useState, useCallback, useRef } from 'react'; // Agregamos useRef
import SophiaParticles from './components/SophiaParticles';

// --- Hook Personalizado: useSophiaAI ---
const useSophiaAI = () => {
  const [isTalking, setIsTalking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null); // Usamos useRef para mantener la instancia de SpeechRecognition

  /**
   * Función para que Sophia hable.
   * @param {string} text - El texto que Sophia debe pronunciar.
   */
  const speak = useCallback((text) => {
    if (!window.speechSynthesis) {
      setError('Tu navegador no soporta la síntesis de voz.');
      return;
    }

    setIsTalking(true);
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-AR'; // Español de Argentina

    // Función para asignar una voz femenina en español
    const assignVoice = () => {
      const voices = synth.getVoices();
      const voice = voices.find(v =>
        v.lang.startsWith('es') &&
        /female|mujer|soledad|google es|zira|sophia/.test(v.name.toLowerCase())
      ) || voices.find(v => v.lang.startsWith('es')); // Fallback a cualquier voz en español
      if (voice) utterance.voice = voice;
      synth.speak(utterance);
    };

    // Eventos para controlar el estado de 'isTalking'
    utterance.onend = () => setIsTalking(false);
    utterance.onerror = (event) => {
      console.error('❌ Error en síntesis de voz:', event);
      setIsTalking(false);
      setError('Hubo un problema al hablar.');
    };

    // Si las voces ya están cargadas, asignarlas. Si no, esperar al evento 'voiceschanged'.
    if (synth.getVoices().length > 0) {
      assignVoice();
    } else {
      synth.onvoiceschanged = assignVoice;
    }
  }, []);

  /**
   * Llama a la API de Sophia para obtener una respuesta.
   * @param {string} promptText - El texto de la pregunta del usuario.
   */
  const callSophiaAI = useCallback(async (promptText) => {
    try {
      // Si Sophia ya está hablando, no la interrumpimos con un nuevo prompt inmediatamente
      // Esto es una mejora opcional para evitar superposiciones.
      if (isTalking) {
        console.log('Sophia está hablando, esperando para enviar prompt...');
        // Opcional: podrías poner el prompt en una cola
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText }),
      });

      if (!res.ok) {
        throw new Error(`Error en la respuesta de la API: ${res.status}`);
      }

      const data = await res.json();
      if (data?.response) {
        speak(data.response);
      } else {
        speak('Lo siento, no pude generar una respuesta. ¿Podrías intentar de nuevo?');
      }
    } catch (err) {
      console.error('❌ Error al contactar con Sophia AI:', err);
      speak('Uy, hubo un problema conectando con la nube. Por favor, revisa tu conexión.');
      setError('Error de conexión con la IA.');
    }
  }, [speak, isTalking]); // Dependencia de isTalking para posible lógica de espera

  /**
   * Inicia el reconocimiento de voz.
   */
  const startRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Este navegador no soporta el reconocimiento de voz.');
      return;
    }

    // Si ya hay una instancia activa, la detenemos para evitar múltiples grabaciones
    if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES'; // Idioma para el reconocimiento
    recognition.continuous = false; // Reconoce una frase y se detiene
    recognition.interimResults = false; // No muestra resultados provisionales

    recognition.onstart = () => {
      setIsListening(true);
      setError(null); // Limpiar errores anteriores al iniciar la escucha
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
      // La escucha se detendrá automáticamente con continuous: false,
      // y onend se encargará de setIsListening(false).
    };

    recognition.onerror = (event) => {
      console.error('❌ Error en reconocimiento de voz:', event.error);
      setIsListening(false); // Asegurarse de que el estado de escucha se apaga

      if (event.error === 'no-speech') {
        setError('No se detectó voz. Intenta hablar más claro.');
      } else if (event.error === 'not-allowed') {
        setError('Permiso de micrófono denegado. Por favor, habilítalo en la configuración de tu navegador.');
      } else if (event.error === 'aborted') {
        // Esto puede ocurrir si el usuario o el sistema aborta la escucha
        console.log('Reconocimiento de voz abortado.');
        setError(null); // No es un error crítico para mostrar al usuario
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
      recognitionRef.current = recognition; // Guardar la instancia para poder detenerla si es necesario
    } catch (err) {
      console.error("Error al iniciar el reconocimiento (posiblemente ya grabando):", err);
      setError("Hubo un problema al iniciar el micrófono. Asegúrate de que no esté en uso.");
      setIsListening(false);
    }
  }, [speak, callSophiaAI]);

  // Al desmontar el hook, asegúrate de detener cualquier reconocimiento activo
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []); // Se ejecuta solo una vez al montar y desmontar

  return { isTalking, isListening, error, startRecognition };
};

// --- Componente Principal App ---
export default function App() {
  const { isTalking, isListening, error, startRecognition } = useSophiaAI();

  // Usa useEffect para manejar la primera interacción del usuario
  useEffect(() => {
    const handleFirstInteraction = () => {
      startRecognition();
      // Remover los listeners una vez que la interacción inicial ha ocurrido
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    // Escuchar el primer clic o toque del usuario para iniciar el reconocimiento de voz
    // Esto es necesario debido a las políticas de autoplay de medios de los navegadores.
    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);

    // Función de limpieza para remover los listeners cuando el componente se desmonte
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [startRecognition]); // Dependencia de startRecognition para asegurar que el listener se registra con la función correcta

  return (
    <div className="relative h-screen bg-black text-white overflow-hidden flex flex-col items-center justify-center">
      {/* Componente para las partículas visuales de Sophia */}
      <SophiaParticles isTalking={isTalking} />

      {/* Contenido principal de la interfaz */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4 bg-black bg-opacity-50">
        <h1 className="text-4xl sm:text-5xl font-bold mb-6 tracking-wide drop-shadow-lg">
          Sophia Visual AI
        </h1>
        <p className="text-md sm:text-lg opacity-80 mb-6 max-w-sm">
          Decí: <strong className="text-purple-300">"Hola Sophia"</strong> y hacé tu pregunta.
        </p>

        {/* Mensaje de error */}
        {error && (
          <p className="mt-4 text-red-400 text-sm sm:text-base bg-red-900 bg-opacity-30 p-3 rounded-lg border border-red-700 max-w-xs animate-pulse">
            ⚠️ {error}
          </p>
        )}

        {/* Indicador de escucha */}
        {isListening && !error && (
          <p className="text-green-400 mt-4 text-md sm:text-lg bg-green-900 bg-opacity-30 p-3 rounded-full animate-pulse">
            🎙️ Escuchando...
          </p>
        )}

        {/* Indicador de que Sophia está hablando */}
        {isTalking && !error && (
          <p className="text-blue-400 mt-4 text-md sm:text-lg bg-blue-900 bg-opacity-30 p-3 rounded-full animate-bounce">
            🗣️ Sophia hablando...
          </p>
        )}

        {!isListening && !isTalking && !error && (
            <p className="text-gray-400 mt-4 text-sm sm:text-base">
                Haz clic o toca la pantalla para iniciar.
            </p>
        )}
      </div>
    </div>
  );
}