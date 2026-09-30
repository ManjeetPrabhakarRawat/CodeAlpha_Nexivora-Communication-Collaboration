import { useEffect, useRef, useState } from 'react';
import socket from '../services/socket';
import { Eraser, Pen, Square, Circle, Minus, Trash2 } from 'lucide-react';

interface WhiteboardProps {
  roomId: string;
}

export default function Whiteboard({ roomId }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [lineWidth, setLineWidth] = useState(2);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'rect' | 'circle' | 'line'>('pen');
  
  // For shape drawing
  const startPosRef = useRef<{x: number, y: number} | null>(null);
  const snapshotRef = useRef<ImageData | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        // Save current content before resize
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tCtx = tempCanvas.getContext('2d');
        tCtx?.drawImage(canvas, 0, 0);

        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        
        // Restore content
        ctx.drawImage(tempCanvas, 0, 0);
      }
    };
    
    // Initial setup with a slight delay to ensure layout is done
    setTimeout(handleResize, 100);
    window.addEventListener('resize', handleResize);

    const onDrawReceive = (data: any) => {
      const { x0, y0, x1, y1, color, lineWidth, type, canvasWidth, canvasHeight } = data;
      // Scale coordinates if canvas size differs
      const scaleX = canvas.width / canvasWidth;
      const scaleY = canvas.height / canvasHeight;

      ctx.beginPath();
      if (type === 'rect') {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.rect(x0 * scaleX, y0 * scaleY, (x1 - x0) * scaleX, (y1 - y0) * scaleY);
        ctx.stroke();
      } else if (type === 'circle') {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        const radius = Math.sqrt(Math.pow((x1 - x0) * scaleX, 2) + Math.pow((y1 - y0) * scaleY, 2));
        ctx.arc(x0 * scaleX, y0 * scaleY, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else {
        // Line or Pen/Eraser
        ctx.moveTo(x0 * scaleX, y0 * scaleY);
        ctx.lineTo(x1 * scaleX, y1 * scaleY);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      ctx.closePath();
    };

    const onClearBoard = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    socket.on('draw', onDrawReceive);
    socket.on('clear-board', onClearBoard);

    return () => {
      window.removeEventListener('resize', handleResize);
      socket.off('draw', onDrawReceive);
      socket.off('clear-board', onClearBoard);
    };
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    startPosRef.current = { x, y };
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !startPosRef.current || !canvasRef.current) return;
    
    e.preventDefault(); // prevent scrolling on touch
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    
    // If drawing shapes, restore snapshot first
    if (tool === 'rect' || tool === 'circle' || tool === 'line') {
      if (snapshotRef.current) {
        ctx.putImageData(snapshotRef.current, 0, 0);
      }
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      
      if (tool === 'rect') {
        ctx.rect(startPosRef.current.x, startPosRef.current.y, x - startPosRef.current.x, y - startPosRef.current.y);
      } else if (tool === 'circle') {
        const radius = Math.sqrt(Math.pow(x - startPosRef.current.x, 2) + Math.pow(y - startPosRef.current.y, 2));
        ctx.arc(startPosRef.current.x, startPosRef.current.y, radius, 0, 2 * Math.PI);
      } else if (tool === 'line') {
        ctx.moveTo(startPosRef.current.x, startPosRef.current.y);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    } else {
      // Freehand drawing (pen or eraser)
      ctx.lineTo(x, y);
      ctx.strokeStyle = tool === 'eraser' ? '#0a0f1c' : color;
      ctx.lineWidth = tool === 'eraser' ? lineWidth * 5 : lineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();
      
      // Emit freehand draw events immediately
      socket.emit('draw', {
        roomId,
        drawData: {
          x0: startPosRef.current.x,
          y0: startPosRef.current.y,
          x1: x,
          y1: y,
          color: tool === 'eraser' ? '#0a0f1c' : color,
          lineWidth: tool === 'eraser' ? lineWidth * 5 : lineWidth,
          type: 'freehand',
          canvasWidth: canvas.width,
          canvasHeight: canvas.height
        }
      });
      
      startPosRef.current = { x, y };
    }
  };

  const endDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (!canvas || !startPosRef.current) return;
    
    const { x, y } = getCoordinates(e);
    
    // Emit shape draw event when finished
    if (tool === 'rect' || tool === 'circle' || tool === 'line') {
      socket.emit('draw', {
        roomId,
        drawData: {
          x0: startPosRef.current.x,
          y0: startPosRef.current.y,
          x1: x,
          y1: y,
          color: color,
          lineWidth: lineWidth,
          type: tool,
          canvasWidth: canvas.width,
          canvasHeight: canvas.height
        }
      });
    }
    
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.closePath();
    startPosRef.current = null;
  };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      socket.emit('clear-board', roomId);
    }
  };

  const colors = ['#ffffff', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-3 border-b border-white/10 flex items-center justify-center gap-4 bg-navy-950/50 backdrop-blur-md">
        <div className="flex bg-navy-800 rounded-lg p-1 gap-1">
          <button onClick={() => setTool('pen')} className={`p-2 rounded ${tool === 'pen' ? 'bg-navy-600' : 'hover:bg-navy-700'}`}>
            <Pen className="w-4 h-4" />
          </button>
          <button onClick={() => setTool('eraser')} className={`p-2 rounded ${tool === 'eraser' ? 'bg-navy-600' : 'hover:bg-navy-700'}`}>
            <Eraser className="w-4 h-4" />
          </button>
          <button onClick={() => setTool('rect')} className={`p-2 rounded ${tool === 'rect' ? 'bg-navy-600' : 'hover:bg-navy-700'}`}>
            <Square className="w-4 h-4" />
          </button>
          <button onClick={() => setTool('circle')} className={`p-2 rounded ${tool === 'circle' ? 'bg-navy-600' : 'hover:bg-navy-700'}`}>
            <Circle className="w-4 h-4" />
          </button>
          <button onClick={() => setTool('line')} className={`p-2 rounded ${tool === 'line' ? 'bg-navy-600' : 'hover:bg-navy-700'}`}>
            <Minus className="w-4 h-4 rotate-45" />
          </button>
        </div>
        
        <div className="w-px h-6 bg-white/10"></div>
        
        <div className="flex gap-2">
          {colors.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        
        <div className="w-px h-6 bg-white/10"></div>
        
        <input 
          type="range" 
          min="1" max="20" 
          value={lineWidth} 
          onChange={(e) => setLineWidth(parseInt(e.target.value))}
          className="w-24 accent-brand-500"
        />
        
        <div className="w-px h-6 bg-white/10"></div>
        
        <button onClick={clearBoard} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-2 text-sm font-medium">
          <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Clear</span>
        </button>
      </div>
      
      <div className="flex-1 relative cursor-crosshair overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseOut={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
          className="absolute inset-0 block bg-[#0a0f1c]"
        />
      </div>
    </div>
  );
}
