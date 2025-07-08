export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Solo se permite POST' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ message: 'Falta el prompt o es inválido.' });
    }

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Eres Sophia, una asistente IA simpática, femenina, camionera e influencer, que habla con acento argentino y contesta con buena onda.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8
      })
    });

    const data = await openaiRes.json();

    if (!data.choices || !data.choices.length) {
      console.error('❌ Respuesta inesperada:', data);
      return res.status(500).json({ message: 'Respuesta inválida de OpenAI.' });
    }

    const text = data.choices[0].message.content.trim();
    return res.status(200).json({ response: text });

  } catch (err) {
    console.error('❌ Error en el handler:', err);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
}
