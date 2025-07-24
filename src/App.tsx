import { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';

function App() {
  const [text, setText] = useState('');
  const [qrColor, setQrColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [isBgTransparent, setIsBgTransparent] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoSizePercent, setLogoSizePercent] = useState(20);
  const [qrSize, setQrSize] = useState(256);
  const [isGenerated, setIsGenerated] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (text) {
        generateQRCode();
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [text, qrColor, bgColor, isBgTransparent, logoFile, logoSizePercent, qrSize]);

  const generateQRCode = async () => {
    const canvas = canvasRef.current;
    if (!text || !canvas) return;

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = qrSize;
      canvas.height = qrSize;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      await QRCode.toCanvas(canvas, text, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: qrSize,
        color: {
          dark: qrColor,
          light: isBgTransparent ? '#00000000' : bgColor,
        },
      });

      if (logoFile) {
        await drawLogoToCanvas(canvas, logoFile, logoSizePercent);
      }

      setIsGenerated(true);
    } catch (err) {
      console.error('QR generation failed:', err);
      setIsGenerated(false);
    }
  };

  const drawLogoToCanvas = (
    canvas: HTMLCanvasElement,
    file: File,
    sizePercent: number
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Canvas context not found');

      const img = new Image();
      img.onload = () => {
        const size = canvas.width * (sizePercent / 100);
        const x = (canvas.width - size) / 2;
        const y = (canvas.height - size) / 2;
        ctx.drawImage(img, x, y, size, size);
        resolve();
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setLogoFile(file);
    }
  };

  const preventDefault = (e: React.DragEvent) => e.preventDefault();

  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <h1>QR Code Generator</h1>

      <input
        type="text"
        placeholder="Enter text or URL"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setIsGenerated(false);
        }}
        style={{ padding: '0.5rem', fontSize: '1rem', width: '250px' }}
      />

      <div style={{ display: 'flex', marginTop: '1rem', gap: '1rem', justifyContent: 'center' }}>
        <div style={{ marginTop: '1rem' }}>
          <label>QR Color:</label>{' '}
          <input type="color" value={qrColor} onChange={(e) => setQrColor(e.target.value)} />
        </div>

        <div style={{ marginTop: '1rem' }}>
          {!isBgTransparent && (
            <div>
              <label>Background Color:</label>{' '}
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
              />
            </div>
          )}
          <label>
            <input
              type="checkbox"
              checked={isBgTransparent}
              onChange={(e) => setIsBgTransparent(e.target.checked)}
            />{' '}
            Transparent Background
          </label>
        </div>
      </div>

      {/* Logo Upload or Display */}
      {!logoFile ? (
        <div
          onDrop={handleFileDrop}
          onDragOver={preventDefault}
          onDragEnter={preventDefault}
          onClick={() =>
            (document.querySelector('input[type="file"]') as HTMLInputElement | null)?.click()
          }
          style={{
            marginTop: '1rem',
            padding: '1rem',
            border: '2px dashed #ccc',
            borderRadius: '8px',
            width: '300px',
            margin: '1rem auto',
            position: 'relative',
            cursor: 'pointer',
          }}
        >
          <label>Upload Logo (optional):</label>
          <br />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            style={{
              visibility: 'hidden',
              position: 'absolute',
              width: '100%',
              height: '100%',
              left: 0,
              top: 0,
            }}
          />
          <p style={{ fontSize: '0.85rem' }}>or drag & drop an image here</p>
        </div>
      ) : (
        <div
          style={{
            margin: '10px auto',
            marginTop: '1rem',
            fontSize: '0.9rem',
            border: '2px dashed rgb(204, 204, 204)',
            borderRadius: '8px',
            padding: '5px',
            width: 'fit-content',
          }}
        >
          <strong>Image:</strong> {logoFile.name}
          <button
            onClick={() => setLogoFile(null)}
            style={{
              marginLeft: '1rem',
              padding: '0.2rem 0.5rem',
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            Remove
          </button>
        </div>
      )}

      {/* Logo Size Slider */}
      <div style={{ marginTop: '1rem' }}>
        <label htmlFor="logoSize">Logo Size: {logoSizePercent}%</label>
        <input
          id="logoSize"
          type="range"
          min={10}
          max={50}
          step={1}
          value={logoSizePercent}
          disabled={!logoFile}
          onChange={(e) => setLogoSizePercent(parseInt(e.target.value))}
          style={{
            display: 'block',
            width: '300px',
            margin: '0.5rem auto',
            opacity: logoFile ? 1 : 0.5,
          }}
        />
      </div>

      {/* QR Size Slider */}
      <div style={{ marginTop: '1rem' }}>
        <label htmlFor="qrSize">QR Dimension: {qrSize}px</label>
        <input
          id="qrSize"
          type="range"
          min={128}
          max={1024}
          step={64}
          value={qrSize}
          onChange={(e) => setQrSize(parseInt(e.target.value))}
          style={{
            display: 'block',
            width: '300px',
            margin: '0.5rem auto',
          }}
        />
      </div>

      {/* Canvas and Download */}
      <div style={{ marginTop: '2rem' }}>
        <canvas ref={canvasRef} />
        {isGenerated && (
          <button
            onClick={handleDownload}
            style={{
              display: 'block',
              margin: '1rem auto',
              padding: '0.5rem 1rem',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '5px',
            }}
          >
            Download QR Code
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
