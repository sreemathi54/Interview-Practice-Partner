import React, { useEffect, useRef, useState, useCallback } from 'react'

/**
 * CameraPreview component
 * Provides start/stop controls, live preview, and optional snapshot capture.
 */
const CameraPreview = ({ onCapture }) => {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [isSupported, setIsSupported] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState('')
  const [snapshot, setSnapshot] = useState(null)
  const [permissionState, setPermissionState] = useState('prompt')

  // Check browser support + permissions
  useEffect(() => {
    if (typeof navigator === 'undefined') {
      setIsSupported(false)
      return
    }

    const supported = Boolean(navigator.mediaDevices?.getUserMedia)
    setIsSupported(supported)

    const checkPermission = async () => {
      if (!navigator.permissions?.query) return
      try {
        const status = await navigator.permissions.query({ name: 'camera' })
        setPermissionState(status.state)
        status.onchange = () => setPermissionState(status.state)
      } catch {
        // Ignore failures (older browsers)
      }
    }

    checkPermission()
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsStreaming(false)
  }, [])

  const startCamera = async () => {
    if (!isSupported || isStreaming) {
      return
    }

    setError('')
    setSnapshot(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {
          /* Some browsers require user interaction; ignore */
        })
      }
      setIsStreaming(true)
    } catch (err) {
      console.error('Camera start failed:', err)
      setError(err.message || 'Unable to access camera. Please check permissions.')
    }
  }

  const captureSnapshot = () => {
    if (!videoRef.current) return

    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth || 640
    canvas.height = videoRef.current.videoHeight || 480
    const ctx = canvas.getContext('2d')
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/png')
    setSnapshot(dataUrl)
    if (onCapture) {
      onCapture(dataUrl)
    }
  }

  // Cleanup on unmount
  useEffect(() => stopCamera, [stopCamera])

  const renderStatus = () => {
    if (!isSupported) {
      return 'Camera API not supported in this browser.'
    }
    if (error) {
      return error
    }
    if (permissionState === 'denied') {
      return 'Camera permission denied. Update browser settings to continue.'
    }
    if (!isStreaming) {
      return 'Camera is idle. Start it to simulate a real interview presence.'
    }
    return 'Camera is live.'
  }

  return (
    <div className="w-full bg-slate-900/60 border border-white/10 rounded-2xl p-4 shadow-xl shadow-black/30 backdrop-blur-xl text-slate-100">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-white">Camera Presence</p>
          <p className="text-xs text-slate-300">
            Mirror a real interview by keeping your webcam on.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={isStreaming ? stopCamera : startCamera}
            disabled={!isSupported}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              isStreaming
                ? 'bg-rose-500 text-white hover:bg-rose-600'
                : 'bg-cyan-500 text-white hover:bg-cyan-600'
            } ${!isSupported ? 'opacity-50 cursor-not-allowed' : ''} shadow-lg shadow-cyan-500/20`}
          >
            {isStreaming ? 'Stop' : 'Start'}
          </button>
          <button
            type="button"
            onClick={captureSnapshot}
            disabled={!isStreaming}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg border ${
              isStreaming
                ? 'border-cyan-300 text-cyan-200 hover:bg-cyan-500/10'
                : 'border-white/20 text-white/40 cursor-not-allowed'
            }`}
          >
            Capture
          </button>
        </div>
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black aspect-video mb-3">
        {isStreaming ? (
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-sm p-4 text-center gap-2">
            <svg
              className="w-10 h-10 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 8h6a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2z"
              />
            </svg>
            <p>Toggle the camera to see yourself like a real interview.</p>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-300 mb-3">{renderStatus()}</p>

      {snapshot && (
        <div className="mt-2">
          <p className="text-xs font-semibold text-slate-200 mb-1">Last Snapshot</p>
          <img
            src={snapshot}
            alt="Interview snapshot"
            className="w-full rounded-2xl border border-white/10"
          />
        </div>
      )}
    </div>
  )
}

export default CameraPreview


