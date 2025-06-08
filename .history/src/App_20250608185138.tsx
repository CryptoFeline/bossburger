import React, { useState } from 'react';
import styles from './styles/App.module.css';
import { AppState, OverlayLayer, EditorImage } from './types';
import CanvasEditor from './components/CanvasEditor';
import Controls from './components/Controls';

// const CANVAS_SIZE = 512; // square canvas size - use for overlay load sizing

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('EMPTY');
  const [editorImage, setEditorImage] = useState<EditorImage | null>(null);
  const [overlayLayer, setOverlayLayer] = useState<OverlayLayer | null>(null);
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Handlers for state transitions and image/layer updates will go here

  return (
    <div
      style={{
        minHeight: '100vh',
        minWidth: '100vw',
        background: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <CanvasEditor
            appState={appState}
            editorImage={editorImage}
            overlayLayer={overlayLayer}
            setOverlayLayer={setOverlayLayer}
            setFinalImageUrl={setFinalImageUrl}
            setAppState={setAppState}
          />
        </div>
        <Controls
          appState={appState}
          setAppState={setAppState}
          editorImage={editorImage}
          setEditorImage={setEditorImage}
          overlayLayer={overlayLayer}
          setOverlayLayer={setOverlayLayer}
          finalImageUrl={finalImageUrl}
          setSuccessMessage={setSuccessMessage}
        />
        {successMessage && <div style={{ color: '#007aff', fontWeight: 600, fontSize: 18, textAlign: 'center', marginTop: 16 }}>{successMessage}</div>}
      </div>
    </div>
  );
};

export default App;