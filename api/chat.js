// api/chat.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' })
  }

  try {
    const { prompt } = req.body

    if (!prompt || prompt.trim() === '') {
      return res.status(400).json({ message: 'Falta el prompt o está vacío' })
    }

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'Eres Sophia, una asistente IA simpática, femenina, que habla con acento argentino y contesta con buena onda.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8
      })
    })

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text()
      console.error('❌ Error OpenAI:', openaiRes.status, errorText)
      return res
        .status(openaiRes.status)
        .json({ message: 'Error al contactar a OpenAI', detail: errorText })
    }

    const data = await openaiRes.json()

    if (!data.choices || !data.choices.length) {
      return res.status(500).json({ message: 'Respuesta inválida de OpenAI' })
    }

    const reply = data.choices[0].message.content.trim()
    return res.status(200).json({ reply })
  } catch (err) {
    console.error('❌ Error en handler:', err)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}
