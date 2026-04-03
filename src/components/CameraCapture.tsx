import { useEffect, useRef, useState } from 'react';

interface Props {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    async function start() {
      try {
        // Try back camera first (ideal for mobile), fall back to any camera
        const stream = await navigator.mediaDevices
          .getUserMedia({ video: { facingMode: { ideal: 'environment' } } })
          .catch(() => navigator.mediaDevices.getUserMedia({ video: true }));

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // ready is set via the onCanPlay event on the video element
        }
      } catch {
        setError('Kunne ikke åpne kamera. Sjekk at nettleseren har tilgang i innstillingene.');
      }
    }
    start();
    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    setPreview(canvas.toDataURL('image/jpeg', 0.9));
  }

  function confirm() {
    if (!preview) return;
    streamRef.current?.getTracks().forEach(t => t.stop());
    onCapture(preview);
  }

  function retake() {
    setPreview(null);
  }

  function close() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col safe-top">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={close} className="text-white font-bold text-lg px-2 py-1">
          ✕
        </button>
        <span className="text-white font-bold">Kamera</span>
        <div className="w-12" />
      </div>

      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 text-center">
          <div className="text-5xl">📵</div>
          <p className="text-white text-sm">{error}</p>
          <button onClick={close} className="px-6 py-3 bg-amber-400 text-white font-bold rounded-2xl">
            Lukk
          </button>
        </div>
      ) : preview ? (
        /* Preview captured photo */
        <div className="flex-1 flex flex-col gap-4 p-4">
          <img
            src={preview}
            alt="Bilde"
            className="flex-1 object-contain w-full rounded-2xl min-h-0"
          />
          <div className="flex gap-3">
            <button
              onClick={retake}
              className="flex-1 py-3 border-2 border-white text-white font-bold rounded-2xl"
            >
              Ta om igjen
            </button>
            <button
              onClick={confirm}
              className="flex-1 py-3 bg-amber-400 text-white font-black rounded-2xl"
            >
              Bruk bildet ✓
            </button>
          </div>
        </div>
      ) : (
        /* Live viewfinder */
        <div className="flex-1 flex flex-col p-4 items-center min-h-0" style={{ gap: '16px' }}>
          <div className="flex-1 w-full min-h-0 flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onCanPlay={() => setReady(true)}
              className="rounded-2xl bg-gray-900 object-contain max-w-full max-h-full"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          <button
            onClick={capture}
            disabled={!ready}
            className="flex-shrink-0 w-20 h-20 rounded-full bg-white border-4 border-amber-400 disabled:opacity-40 shadow-xl flex items-center justify-center text-3xl"
          >
            📷
          </button>
        </div>
      )}
    </div>
  );
}
