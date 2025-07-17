'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as cocoSsd from '@tensorflow-models/coco-ssd'
import { setBackend } from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-webgl'
import axios from 'axios'

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [detectedObjects, setDetectedObjects] = useState<string[]>([])
  const [response, setResponse] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadModel = async () => {
      await setBackend('webgl')
      const model = await cocoSsd.load()
      setLoading(false)
      const video = videoRef.current!

      if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: true })
          .then((stream) => {
            video.srcObject = stream
            video.play()

            video.onloadedmetadata = () => {
              const detect = async () => {
                if (video.readyState >= 3) {
                  const predictions = await model.detect(video)
                  drawPredictions(predictions)
                  const names = predictions.map((p) => p.class)
                  setDetectedObjects(names)
                }
                requestAnimationFrame(detect)
              }
              detect()
            }
          })
          .catch((err) => {
            console.error('Error accessing webcam: ', err)
          })
      }
    }

    loadModel()
  }, [])

  const drawPredictions = (predictions: cocoSsd.DetectedObject[]) => {
    const ctx = canvasRef.current!.getContext('2d')!
    const video = videoRef.current!

    canvasRef.current!.width = video.videoWidth
    canvasRef.current!.height = video.videoHeight
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    predictions.forEach((p) => {
      ctx.beginPath()
      ctx.rect(...p.bbox)
      ctx.lineWidth = 2
      ctx.strokeStyle = 'red'
      ctx.fillStyle = 'red'
      ctx.stroke()
      ctx.fillText(
        `${p.class} (${Math.round(p.score * 100)}%)`,
        p.bbox[0],
        p.bbox[1] > 10 ? p.bbox[1] - 5 : 10,
      )
    })
  }

  const askLLM = async () => {
    if (detectedObjects.length === 0) return
    try {
      const res = await axios.post('/api/ask', {
        objects: detectedObjects,
      })
      setResponse(res.data.answer)
    } catch (error) {
      console.error('Error asking LLM:', error)
      setResponse('Sorry, something went wrong.')
    }
  }

  return (
   <main className="flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">🎥 Object Detection + LLM</h1>
      {loading && <p>⏳ กำลังโหลดโมเดล...</p>}
      <div className="relative  max-w-2xl mx-auto">
        <video
          ref={videoRef}
          className="rounded-md  "
          style={{ transform: 'scaleX(-1)' }}
          autoPlay
          muted
          playsInline
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0  "
           style={{  right: 0,  }}
        />
      </div>
      <p className="mt-4">Objects: {detectedObjects.join(', ') || 'none'}</p>
      <button
        onClick={askLLM}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-500"
        disabled={loading || detectedObjects.length === 0}
      >
        ถาม LLM ว่าเห็นอะไร
      </button>
      {response && <p className="mt-4 text-lime-400">{response}</p>}
    </main>
  )
}

