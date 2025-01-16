import { useState, useRef, useEffect } from 'react'
import './VideoPaletteGenerator.css'

export default function VideoPaletteGenerator() {
  const [videoFile, setVideoFile] = useState(null)
  const [palette, setPalette] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const workerRef = useRef(null)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('./paletteWorker.js', import.meta.url)
    )

    workerRef.current.onmessage = (e) => {
      setPalette(e.data)
      setIsGenerating(false)
    }

    return () => {
      workerRef.current?.terminate()
    }
  }, [])

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith('video/')) {
        setVideoFile(file)
      }
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }
  const handleDragEnter = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  useEffect(() => {
    if (!videoFile) return

    const videoURL = URL.createObjectURL(videoFile)
    const video = videoRef.current
    video.src = videoURL
    video.load()

    const onLoadedMetadata = () => {
      video.currentTime = 0
    }

    const onSeeked = () => {
      generatePaletteFromVideoFrame()
    }

    video.addEventListener('loadedmetadata', onLoadedMetadata)
    video.addEventListener('seeked', onSeeked)

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      video.removeEventListener('seeked', onSeeked)
      URL.revokeObjectURL(videoURL)
    }
  }, [videoFile])

  const generatePaletteFromVideoFrame = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    setIsGenerating(true)
    workerRef.current.postMessage({
      imageData: imgData,
      desiredColors: 256
    })
  }

  const downloadPaletteAsPNG = () => {
    if (!palette || palette.length === 0) {
      return
    }

    const size = 16
    const offscreenCanvas = document.createElement('canvas')
    offscreenCanvas.width = size
    offscreenCanvas.height = size
    const ctx = offscreenCanvas.getContext('2d')

    let i = 0
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (i >= palette.length) break
        const [r, g, b] = palette[i++]
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
        ctx.fillRect(x, y, 1, 1)
      }
    }

    const dataURL = offscreenCanvas.toDataURL('image/png')

    const link = document.createElement('a')
    link.href = dataURL
    link.download = 'palette.png'
    link.click()
  }

  return (
    <div
      className={`drop-area ${isDragging ? 'dragging' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      {!videoFile && <p>Drag & Drop a video file here</p>}

      <video ref={videoRef} className='hidden-video' controls />

      <canvas ref={canvasRef} className='hidden-canvas' />

      {isGenerating && (
        <div className='loading-indicator'>
          <div className='spinner'></div>
          <p>Generating palette...</p>
        </div>
      )}

      {palette.length > 0 && !isGenerating && (
        <>
          <div className='palette'>
            {palette.map((color, idx) => (
              <div
                key={idx}
                className='color-swatch'
                style={{
                  backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})`
                }}
              />
            ))}
          </div>
          <button onClick={downloadPaletteAsPNG}>Download Palette</button>
        </>
      )}
    </div>
  )
}
