import React, { useRef } from 'react';
import { AppState, EditorImage, OverlayLayer } from '../types';

interface ControlsProps {
  appState: AppState;
  setAppState: (state: AppState) => void;
  editorImage: EditorImage | null;
  setEditorImage: (img: EditorImage | null) => void;
  overlayLayer: OverlayLayer | null;
  setOverlayLayer: (layer: OverlayLayer | null) => void;
  finalImageUrl: string | null;
  setSuccessMessage: (msg: string) => void;
}

const CANVAS_SIZE = 512;

const Controls: React.FC<ControlsProps> = ({
  appState,
  setAppState,
  editorImage,
  setEditorImage,
  overlayLayer,
  setOverlayLayer,
  finalImageUrl,
  setSuccessMessage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload handler
  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new window.Image();
    img.onload = () => {
      setEditorImage({
        src: URL.createObjectURL(file),
        image: img,
        width: img.width,
        height: img.height,
      });
      setAppState('EDIT');
      setOverlayLayer(null);
      setSuccessMessage('');
      if (fileInputRef.current) fileInputRef.current.value = ''; // <-- Reset input
    };
    img.src = URL.createObjectURL(file);
  };

  // Add overlay handler
  const handleAddLayer = (type: 'newEyes' | 'originalEyes') => {
    if (!editorImage) return;
    const img = new window.Image();
    img.onload = () => {
      setOverlayLayer({
        type,
        image: img,
        x: CANVAS_SIZE / 2, // Center of canvas
        y: CANVAS_SIZE / 2, // Center of canvas
        scale: 1,
        rotation: 0,
      });
    };
    img.src = type === 'newEyes' ? '/newEyes.png' : '/originalEyes.png';
  };

  // Save handler
  const handleSave = () => {
    setAppState('FINAL');
    setTimeout(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bossburger-edited.png';
        a.click();
        setSuccessMessage('Image saved! You can create a new image below.');
      }, 'image/png');
    }, 100); // Wait for watermark to render
  };

  // New image handler
  const handleNewImage = () => {
    setAppState('EMPTY');
    setEditorImage(null);
    setOverlayLayer(null);
    setSuccessMessage('');
  };

  // Button rendering logic
  const buttonStyle: React.CSSProperties = {
    border: '3px solid #8fbfff',
    borderRadius: 10,
    fontFamily: '"Nanum Pen Script", cursive',
    fontSize: 20,
    color: '#111',
    background: '#fff',
    padding: '8px 0',
    width: '100%',
    minWidth: 0,
    outline: 'none',
    boxSizing: 'border-box',
    cursor: 'pointer',
    transition: 'background 0.2s, color 0.2s, border 0.2s',
    margin: 0,
    textAlign: 'center',
    fontWeight: 400,
  };

  const disabledButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: '#f0f0f0',
    color: '#b0b0b0',
    cursor: 'not-allowed',
    border: '3px solid #d0e6ff',
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
        width: '100%',
        maxWidth: 340,
        margin: '16px auto 0 auto',
        justifyItems: 'center',
      }}
    >
      <input
        type="file"
        accept="image/png, image/jpeg"
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      {appState === 'EMPTY' && (
        <>
          <button
            style={{ ...buttonStyle, gridColumn: '1 / span 2', justifySelf: 'center' }}
            onClick={handleUpload}
          >
            Upload Image
          </button>
        </>
      )}
      {appState === 'EDIT' && (
        <>
          <button
            style={!!overlayLayer ? disabledButtonStyle : buttonStyle}
            onClick={() => handleAddLayer('originalEyes')}
            disabled={!!overlayLayer}
          >
            OG Eyes
          </button>
          <button
            style={!!overlayLayer ? disabledButtonStyle : buttonStyle}
            onClick={() => handleAddLayer('newEyes')}
            disabled={!!overlayLayer}
          >
            New Eyes
          </button>
          <button style={buttonStyle} onClick={handleNewImage}>New Image</button>
          <button style={buttonStyle} onClick={handleSave} disabled={!editorImage}>Save Image</button>
        </>
      )}
      {appState === 'FINAL' && (
        <>
          <button style={buttonStyle} onClick={handleNewImage}>New Image</button>
          <button style={buttonStyle} onClick={handleSave} disabled={!editorImage}>Save Image</button>
          <div />
          <div />
        </>
      )}
    </div>
  );
};

export default Controls;