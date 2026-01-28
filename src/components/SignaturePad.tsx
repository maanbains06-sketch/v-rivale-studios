import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eraser, Check, Type, PenTool } from "lucide-react";

interface SignaturePadProps {
  onSave: (signature: string) => void;
  existingSignature?: string;
  disabled?: boolean;
  label: string;
}

const SignaturePad = ({ onSave, existingSignature, disabled, label }: SignaturePadProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [typedName, setTypedName] = useState("");
  const [signatureMode, setSignatureMode] = useState<"draw" | "type">("type");

  useEffect(() => {
    initCanvas();
  }, [signatureMode]);

  useEffect(() => {
    if (existingSignature) {
      setHasSignature(true);
      loadExistingSignature();
    }
  }, [existingSignature]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size based on parent
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    
    // Set drawing style - thicker line for easier drawing
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const loadExistingSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas || !existingSignature) return;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width / 2, canvas.height / 2);
      setHasSignature(true);
    };
    img.src = existingSignature;
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setTypedName("");
  };

  const generateTypedSignature = () => {
    if (!typedName.trim()) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw typed signature with cursive style
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'italic 32px "Brush Script MT", "Segoe Script", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const text = typedName.trim();
    ctx.fillText(text, canvas.width / 4, canvas.height / 4);

    // Draw underline
    const textWidth = ctx.measureText(text).width;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 4 - textWidth / 2 - 10, canvas.height / 4 + 18);
    ctx.lineTo(canvas.width / 4 + textWidth / 2 + 10, canvas.height / 4 + 18);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    setHasSignature(true);
  };

  const saveSignature = () => {
    if (signatureMode === "type" && typedName.trim()) {
      generateTypedSignature();
      // Small delay to ensure canvas is rendered
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const signature = canvas.toDataURL('image/png');
        onSave(signature);
      }, 50);
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const signature = canvas.toDataURL('image/png');
      onSave(signature);
    }
  };

  if (disabled && existingSignature) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <div className="relative border-2 border-green-300 rounded-lg bg-green-50 p-2">
          <img src={existingSignature} alt="Signature" className="w-full h-20 object-contain" />
        </div>
        <p className="text-xs text-green-600 flex items-center gap-1">
          <Check className="h-3 w-3" /> Signature confirmed
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-slate-800">{label}</p>
      
      {/* Simple Mode Toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={signatureMode === "type" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setSignatureMode("type");
            clearSignature();
          }}
          className="flex-1 gap-1"
        >
          <Type className="h-4 w-4" />
          Type Name
        </Button>
        <Button
          type="button"
          variant={signatureMode === "draw" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setSignatureMode("draw");
            clearSignature();
          }}
          className="flex-1 gap-1"
        >
          <PenTool className="h-4 w-4" />
          Draw
        </Button>
      </div>

      {signatureMode === "type" ? (
        <div className="space-y-3">
          <Input
            value={typedName}
            onChange={(e) => {
              setTypedName(e.target.value);
              if (e.target.value.trim()) {
                setHasSignature(true);
              }
            }}
            placeholder="Type your full name here"
            className="h-12 text-lg bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
            disabled={disabled}
          />
          <div className="border-2 border-dashed border-slate-300 rounded-lg bg-white p-4 min-h-[70px] flex items-center justify-center">
            {typedName.trim() ? (
              <p className="text-3xl italic text-slate-800" style={{ fontFamily: '"Brush Script MT", "Segoe Script", cursive' }}>
                {typedName}
              </p>
            ) : (
              <p className="text-slate-400 text-sm">Your signature will appear here</p>
            )}
          </div>
          {/* Hidden canvas for type mode */}
          <canvas ref={canvasRef} className="hidden" style={{ width: 300, height: 80 }} />
        </div>
      ) : (
        <div 
          className={`relative border-2 border-dashed rounded-lg bg-white ${
            disabled ? 'border-slate-200 opacity-60' : 'border-slate-300 hover:border-blue-400'
          }`}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-28 cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          {!hasSignature && !disabled && (
            <p className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm pointer-events-none">
              Draw your signature using mouse or finger
            </p>
          )}
        </div>
      )}

      {!disabled && (
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={clearSignature}
            className="flex-1"
          >
            <Eraser className="h-4 w-4 mr-1" />
            Clear
          </Button>
          <Button 
            type="button" 
            size="sm" 
            onClick={saveSignature}
            disabled={signatureMode === "type" ? !typedName.trim() : !hasSignature}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Check className="h-4 w-4 mr-1" />
            Confirm
          </Button>
        </div>
      )}
    </div>
  );
};

export default SignaturePad;