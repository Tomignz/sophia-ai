export default async function handler(req, res) {
  const { prompt } = req.body

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Sos Sophia Alvarado, una IA simpática, camionera, influencer argentina. Hablás con acento rioplatense y respondés en español de forma natural.',
          },
          { role: 'user', content: prompt }
        ]
      })
    })

    const data = await openaiRes.json()
    res.status(200).json({ reply: data.choices[0].message.content })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Algo falló al conectar con OpenAI' })
  }
}
