import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const objects = body.objects as string[]

  const prompt = `สิ่งที่ตรวจจับจากกล้องคือ: ${objects.join(', ')}. ช่วยอธิบายว่าอาจจะเป็นสถานการณ์หรือฉากแบบไหน?`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'คุณคือผู้ช่วยอธิบายสิ่งที่เห็นจากภาพกล้อง' },
        { role: 'user', content: prompt },
      ],
    }),
  })

  const data = await res.json()
  return NextResponse.json({ answer: data.choices?.[0]?.message?.content ?? 'ไม่สามารถตอบได้' })
}
