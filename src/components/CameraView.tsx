import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCcw, Zap, Target, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';

interface CameraViewProps {
  onCapture: (image: string) => void;
  isProcessing: boolean;
}

interface Point {
  x: number;
  y: number;
  timestamp: number;
}

export const CameraView: React.FC<CameraViewProps> = ({ onCapture, isProcessing }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(true);
  const [trajectory, setTrajectory] = useState<Point[]>([]);
  
  const prevFrameRef = useRef<ImageData | null>(null);
  const lastPointRef = useRef<Point | null>(null);

  const startCamera = useCallback(async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch (err) {
      console.error("Camera error:", err);
      setError("Failed to access camera. Please check permissions.");
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  // Ball Tracking Logic
  useEffect(() => {
    if (!isTracking || isProcessing) return;

    let animationFrameId: number;
    const processFrame = () => {
      if (videoRef.current && processingCanvasRef.current && overlayCanvasRef.current) {
        const video = videoRef.current;
        const procCanvas = processingCanvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;
        
        // Match overlay size to video display size
        if (overlayCanvas.width !== video.clientWidth || overlayCanvas.height !== video.clientHeight) {
          overlayCanvas.width = video.clientWidth;
          overlayCanvas.height = video.clientHeight;
        }

        const procCtx = procCanvas.getContext('2d', { willReadFrequently: true });
        const overlayCtx = overlayCanvas.getContext('2d');

        if (procCtx && overlayCtx) {
          // Downsample for performance
          const scale = 0.2;
          procCanvas.width = video.videoWidth * scale;
          procCanvas.height = video.videoHeight * scale;
          procCtx.drawImage(video, 0, 0, procCanvas.width, procCanvas.height);
          
          const currentFrame = procCtx.getImageData(0, 0, procCanvas.width, procCanvas.height);
          
          if (prevFrameRef.current) {
            const prevFrame = prevFrameRef.current;
            let sumX = 0;
            let sumY = 0;
            let count = 0;
            const threshold = 40;

            for (let i = 0; i < currentFrame.data.length; i += 4) {
              const rDiff = Math.abs(currentFrame.data[i] - prevFrame.data[i]);
              const gDiff = Math.abs(currentFrame.data[i+1] - prevFrame.data[i+1]);
              const bDiff = Math.abs(currentFrame.data[i+2] - prevFrame.data[i+2]);
              
              if (rDiff + gDiff + bDiff > threshold) {
                const x = (i / 4) % procCanvas.width;
                const y = Math.floor((i / 4) / procCanvas.width);
                sumX += x;
                sumY += y;
                count++;
              }
            }

            if (count > 5 && count < 200) { // Ball-sized motion
              const avgX = (sumX / count) / procCanvas.width;
              const avgY = (sumY / count) / procCanvas.height;
              
              const newPoint = { x: avgX, y: avgY, timestamp: Date.now() };
              
              // Filter out jitter
              if (!lastPointRef.current || 
                  Math.hypot(newPoint.x - lastPointRef.current.x, newPoint.y - lastPointRef.current.y) > 0.01) {
                setTrajectory(prev => [...prev.slice(-20), newPoint]);
                lastPointRef.current = newPoint;
              }
            }
          }
          prevFrameRef.current = currentFrame;

          // Draw Trajectory
          overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
          if (trajectory.length > 1) {
            overlayCtx.beginPath();
            overlayCtx.strokeStyle = '#2ecc71';
            overlayCtx.lineWidth = 4;
            overlayCtx.lineCap = 'round';
            overlayCtx.lineJoin = 'round';
            overlayCtx.shadowBlur = 10;
            overlayCtx.shadowColor = '#2ecc71';

            trajectory.forEach((p, index) => {
              const x = p.x * overlayCanvas.width;
              const y = p.y * overlayCanvas.height;
              if (index === 0) overlayCtx.moveTo(x, y);
              else overlayCtx.lineTo(x, y);
            });
            overlayCtx.stroke();

            // Draw current position head
            const last = trajectory[trajectory.length - 1];
            overlayCtx.beginPath();
            overlayCtx.fillStyle = '#fff';
            overlayCtx.arc(last.x * overlayCanvas.width, last.y * overlayCanvas.height, 6, 0, Math.PI * 2);
            overlayCtx.fill();
          }
        }
      }
      animationFrameId = requestAnimationFrame(processFrame);
    };

    processFrame();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isTracking, trajectory, isProcessing]);

  const switchCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    setTrajectory([]);
  };

  const resetTracking = () => {
    setTrajectory([]);
    lastPointRef.current = null;
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Draw trajectory on the captured image too
        if (trajectory.length > 1) {
          ctx.beginPath();
          ctx.strokeStyle = '#2ecc71';
          ctx.lineWidth = 8;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          trajectory.forEach((p, index) => {
            const x = p.x * canvas.width;
            const y = p.y * canvas.height;
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.stroke();
        }

        const image = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(image);
      }
    }
  };

  return (
    <div className="relative w-full aspect-[9/16] bg-black overflow-hidden rounded-2xl shadow-2xl">
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center text-center p-6 text-red-500">
          {error}
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Tracking Overlay */}
          <canvas
            ref={overlayCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />
          
          {/* Stump Guide Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-end justify-center pb-20 opacity-40">
            <div className="w-1/2 h-2/3 border-x-2 border-white/30 relative">
              <div className="absolute inset-x-0 top-0 border-t-2 border-white/30" />
              <div className="absolute inset-x-0 bottom-0 border-b-2 border-white/30" />
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/20 -translate-x-1/2" />
              <div className="absolute left-1/4 top-0 bottom-0 w-0.5 bg-white/10 -translate-x-1/2" />
              <div className="absolute left-3/4 top-0 bottom-0 w-0.5 bg-white/10 -translate-x-1/2" />
            </div>
          </div>

          {/* Tracking Status */}
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 z-20">
            <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-cricket-green animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">
              {isTracking ? 'Live Tracking Active' : 'Tracking Paused'}
            </span>
          </div>

          {/* Side Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-3 z-20">
            <button
              onClick={() => setIsTracking(!isTracking)}
              className={`p-3 rounded-full backdrop-blur-md border transition-all ${
                isTracking ? 'bg-cricket-green/20 border-cricket-green text-cricket-green' : 'bg-white/10 border-white/20 text-white'
              }`}
            >
              <Target size={20} />
            </button>
            <button
              onClick={resetTracking}
              className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all"
            >
              <RotateCcw size={20} />
            </button>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-6 inset-x-0 flex items-center justify-around px-6 z-20">
            <button
              onClick={switchCamera}
              className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors"
              disabled={isProcessing}
            >
              <RefreshCcw size={24} />
            </button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={captureImage}
              disabled={isProcessing}
              className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center ${
                isProcessing ? 'bg-gray-500' : 'bg-white/20'
              }`}
            >
              <div className={`w-16 h-16 rounded-full ${isProcessing ? 'bg-gray-400' : 'bg-white'} transition-all`} />
            </motion.button>

            <div className="w-12" /> {/* Spacer for balance */}
          </div>
        </>
      )}
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={processingCanvasRef} className="hidden" />
    </div>
  );
};

