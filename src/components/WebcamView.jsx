import { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff } from 'lucide-react';

export default function WebcamView({ isActive }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');

  // Handle stream acquisition
  useEffect(() => {
    let currentStream = null;

    if (isActive) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(s => {
          currentStream = s;
          setStream(s);
          setError('');
        })
        .catch(err => {
          console.error("Webcam Error:", err);
          setError("Webcam access denied.");
        });
    } else {
      setStream(null);
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isActive]);

  // Handle attaching stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("Playback failed:", e));
    }
  }, [stream]);

  return (
    <div style={{
      width: '100%',
      height: '300px',
      backgroundColor: '#000',
      borderRadius: '12px',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid var(--border-color)'
    }}>
      {isActive && stream ? (
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#666', gap: '12px', textAlign: 'center', padding: '24px' }}>
          {error ? <CameraOff size={48} color="var(--danger)" /> : <Camera size={48} />}
          <p>{error || "Camera is off"}</p>
        </div>
      )}
    </div>
  );
}
