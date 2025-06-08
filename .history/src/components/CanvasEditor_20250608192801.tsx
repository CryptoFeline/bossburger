import React, { useRef, useState, useEffect, useCallback } from 'react';
import { AppState, EditorImage, OverlayLayer } from '../types';
import Watermark from './Watermark';

interface CanvasEditorProps {
  appState: AppState;
  editorImage: EditorImage | null;
  overlayLayer: OverlayLayer | null;
  setOverlayLayer: (layer: OverlayLayer | null) => void;
  setFinalImageUrl: (url: string | null) => void;
  setAppState: (state: AppState) => void;
}

const CANVAS_SIZE = 512;
const HANDLE_SIZE = 20;

const CanvasEditor: React.FC<CanvasEditorProps> = ({
  appState,
  editorImage,
  overlayLayer,
  setOverlayLayer,
  setFinalImageUrl,
  setAppState,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState(CANVAS_SIZE);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [showHandles, setShowHandles] = useState(false);
  const [scaling, setScaling] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [startScale, setStartScale] = useState(1);
  const [startScaleDist, setStartScaleDist] = useState(1);
  const [startRotation, setStartRotation] = useState(0);
  const [startMouse, setStartMouse] = useState<{ x: number; y: number } | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [handleSize, setHandleSize] = useState(HANDLE_SIZE);
  const [containerPadding, setContainerPadding] = useState(0);

  // Ensure overlay fits canvas width on add
  useEffect(() => {
    if (overlayLayer && editorImage) {
      const scaleToFit = canvasSize / overlayLayer.image.width;
      if (overlayLayer.scale !== scaleToFit) {
        setOverlayLayer({
          ...overlayLayer,
          scale: Math.min(scaleToFit, 1),
          x: canvasSize / 2,
          y: canvasSize / 2,
        });
      }
    }
    // eslint-disable-next-line
  }, [overlayLayer?.image.src, canvasSize]);

  // Draw image and overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Draw main image
    if (editorImage) {
      const scale = Math.min(
        canvasSize / editorImage.width,
        canvasSize / editorImage.height
      );
      const imgW = editorImage.width * scale;
      const imgH = editorImage.height * scale;
      const offsetX = (canvasSize - imgW) / 2;
      const offsetY = (canvasSize - imgH) / 2;
      ctx.drawImage(editorImage.image, offsetX, offsetY, imgW, imgH);

      // Draw overlay layer if present
      if (overlayLayer) {
        ctx.save();
        ctx.translate(overlayLayer.x, overlayLayer.y);
        ctx.rotate((overlayLayer.rotation * Math.PI) / 180);
        ctx.scale(overlayLayer.scale * (flipped ? -1 : 1), overlayLayer.scale);
        ctx.drawImage(
          overlayLayer.image,
          -overlayLayer.image.width / 2,
          -overlayLayer.image.height / 2
        );
        // Draw border ONLY if editing and handles are shown
        if (showHandles && appState === 'EDIT') {
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.strokeStyle = '#007aff';
          ctx.strokeRect(
            -overlayLayer.image.width / 2,
            -overlayLayer.image.height / 2,
            overlayLayer.image.width,
            overlayLayer.image.height
          );
          ctx.setLineDash([]);
        }
        ctx.restore();
      }
    }

    // Draw watermark only in FINAL state
    if (appState === 'FINAL' && editorImage) {
      Watermark.draw(ctx, canvasSize, canvasSize);
    }
  }, [editorImage, overlayLayer, appState, flipped, showHandles]);

  // Prevent right-click save unless FINAL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const preventContextMenu = (e: MouseEvent) => {
      if (appState !== 'FINAL') e.preventDefault();
    };
    canvas.addEventListener('contextmenu', preventContextMenu);
    return () => canvas.removeEventListener('contextmenu', preventContextMenu);
  }, [appState]);

  // Helper for hit-testing overlay
  const isPointInOverlay = (x: number, y: number) => {
    if (!overlayLayer) return false;
    const dx = x - overlayLayer.x;
    const dy = y - overlayLayer.y;
    const angle = (-overlayLayer.rotation * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const localX = (dx * cos - dy * sin) / overlayLayer.scale;
    const localY = (dx * sin + dy * cos) / overlayLayer.scale;
    return (
      localX > -overlayLayer.image.width / 2 &&
      localX < overlayLayer.image.width / 2 &&
      localY > -overlayLayer.image.height / 2 &&
      localY < overlayLayer.image.height / 2
    );
  };

  type HandlePositions = {
  topLeft?: { x: number; y: number };
  topRight?: { x: number; y: number };
  bottomLeft?: { x: number; y: number };
  bottomRight?: { x: number; y: number };
  topCenter?: { x: number; y: number };
};

const getHandlePositions = useCallback((): HandlePositions => {
  if (!overlayLayer) {
    return {
      topLeft: undefined,
      topRight: undefined,
      bottomLeft: undefined,
      bottomRight: undefined,
      topCenter: undefined,
    };
  }
  const w = overlayLayer.image.width * overlayLayer.scale;
  const h = overlayLayer.image.height * overlayLayer.scale;
  const x = overlayLayer.x;
  const y = overlayLayer.y;
  const angle = (overlayLayer.rotation * Math.PI) / 180;

  // Helper to rotate a point around center
  const rotatePoint = (cx: number, cy: number, px: number, py: number, theta: number) => {
    const dx = px - cx;
    const dy = py - cy;
    return {
      x: cx + dx * Math.cos(theta) - dy * Math.sin(theta),
      y: cy + dx * Math.sin(theta) + dy * Math.cos(theta),
    };
  };

  // Corners before rotation
  const corners = {
    topLeft: { x: x - w / 2, y: y - h / 2 },
    topRight: { x: x + w / 2, y: y - h / 2 },
    bottomLeft: { x: x - w / 2, y: y + h / 2 },
    bottomRight: { x: x + w / 2, y: y + h / 2 },
  };

  // Rotate all corners
  const rotated = {
    topLeft: rotatePoint(x, y, corners.topLeft.x, corners.topLeft.y, angle),
    topRight: rotatePoint(x, y, corners.topRight.x, corners.topRight.y, angle),
    bottomLeft: rotatePoint(x, y, corners.bottomLeft.x, corners.bottomLeft.y, angle),
    bottomRight: rotatePoint(x, y, corners.bottomRight.x, corners.bottomRight.y, angle),
  };

  // For topCenter, find the midpoint between rotated topLeft and topRight, then offset outward
  const midTop = {
    x: (rotated.topLeft.x + rotated.topRight.x) / 2,
    y: (rotated.topLeft.y + rotated.topRight.y) / 2,
  };
  const outward = {
    x: midTop.x + 30 * Math.cos(angle - Math.PI / 2),
    y: midTop.y + 30 * Math.sin(angle - Math.PI / 2),
  };

  return {
    ...rotated,
    topCenter: outward,
  };
}, [overlayLayer]);

  // Helper for hit-testing handles
  const isPointInHandle = (px: number, py: number, hx: number, hy: number) => {
    return Math.abs(px - hx) < handleSize && Math.abs(py - hy) < handleSize;
  };

  // Mouse down: start drag/scale/rotate/flip/delete
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (appState !== 'EDIT' || !overlayLayer) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const handles = getHandlePositions();

    // Scale (bottom-right)
    if (handles.bottomRight && isPointInHandle(x, y, handles.bottomRight.x, handles.bottomRight.y)) {
      setScaling(true);
      setStartScale(overlayLayer.scale);
      setStartMouse({ x, y });
      // Store initial distance from center to handle
      const center = { x: overlayLayer.x, y: overlayLayer.y };
      setStartScaleDist(Math.hypot(handles.bottomRight.x - center.x, handles.bottomRight.y - center.y));
      setShowHandles(true);
      return;
    }
    // Rotate (top-center)
    if (handles.topCenter && isPointInHandle(x, y, handles.topCenter.x, handles.topCenter.y)) {
      setRotating(true);
      setStartRotation(overlayLayer.rotation);
      setStartMouse({ x, y });
      setShowHandles(true);
      return;
    }
    // Delete (top-left)
    if (handles.topLeft && isPointInHandle(x, y, handles.topLeft.x, handles.topLeft.y)) {
      setOverlayLayer(null);
      setShowHandles(false);
      return;
    }
    // Flip (top-right)
    if (handles.topRight && isPointInHandle(x, y, handles.topRight.x, handles.topRight.y)) {
      setFlipped(f => !f);
      setShowHandles(true);
      return;
    }
    // Drag
    if (isPointInOverlay(x, y)) {
      setDragging(true);
      setDragOffset({ x: x - overlayLayer.x, y: y - overlayLayer.y });
      setShowHandles(true);
    } else {
      setShowHandles(false);
    }
  };

  // Mouse move/drag logic for scaling/rotating (global)
  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (!overlayLayer) return;
    // Get canvas position for correct coordinates
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (dragging && overlayLayer) {
      setOverlayLayer({
        ...overlayLayer,
        x: x - (dragOffset?.x || 0),
        y: y - (dragOffset?.y || 0),
      });
    } else if (scaling && startMouse && overlayLayer) {
      const handles = getHandlePositions();
      if (!handles.bottomRight) return;
      const center = { x: overlayLayer.x, y: overlayLayer.y };
      const currDist = Math.hypot(x - center.x, y - center.y);
      let newScale = startScale * (currDist / startScaleDist);
      newScale = Math.max(0.1, Math.min(newScale, 5));
      setOverlayLayer({
        ...overlayLayer,
        scale: newScale,
      });
    } else if (rotating && startMouse && overlayLayer) {
      const center = { x: overlayLayer.x, y: overlayLayer.y };
      const startAngle = Math.atan2(startMouse.y - center.y, startMouse.x - center.x);
      const currAngle = Math.atan2(y - center.y, x - center.x);
      let newRotation = startRotation + ((currAngle - startAngle) * 180) / Math.PI;
      if (newRotation > 180) newRotation -= 360;
      if (newRotation < -180) newRotation += 360;
      setOverlayLayer({
        ...overlayLayer,
        rotation: newRotation,
      });
    }
  }, [overlayLayer, dragging, dragOffset, scaling, startMouse, startScale, startScaleDist, rotating, startRotation, getHandlePositions, setOverlayLayer]);

  const handleGlobalMouseUp = useCallback(() => {
    setDragging(false);
    setScaling(false);
    setRotating(false);
    setStartMouse(null);
  }, []);

  // Overlay handles (absolutely positioned over canvas)
  const overlayHandles = () => {
    if (!overlayLayer || appState !== 'EDIT' || !showHandles) return null;
    const handles = getHandlePositions();

    // Helper for handle style
    const handleStyle = (hx: number, hy: number, cursor: string, bg = '#fff') => ({
      position: 'absolute' as const,
      left: typeof hx === 'number' ? hx - handleSize / 2 : 0,
      top: typeof hy === 'number' ? hy - handleSize / 2 : 0,
      width: handleSize,
      height: handleSize,
      background: bg,
      borderRadius: '50%',
      border: '2px solid #007aff',
      cursor,
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold' as const,
      userSelect: 'none' as const,
      pointerEvents: 'auto' as const,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    });

    return (
      <div style={{ position: 'absolute', left: 0, top: 0, width: canvasSize, height: canvasSize, pointerEvents: 'none' }}>
        {/* Delete (X) button - top-left */}
        {handles.topLeft && handles.topCenter && (
          <div
            style={handleStyle(handles.topLeft.x, handles.topLeft.y, 'pointer')}
            title="Delete overlay"
            onMouseDown={e => {
              e.stopPropagation();
              setOverlayLayer(null);
              setShowHandles(false);
            }}
          >
            <span style={{ color: '#e00', fontSize: 18 }}>×</span>
          </div>
        )}
        {/* Flip button - top-right */}
        {handles.topRight && (
          <div
            style={handleStyle(handles.topRight.x, handles.topRight.y, 'pointer')}
            title="Flip horizontally"
            onMouseDown={e => {
              e.stopPropagation();
              setFlipped(f => !f);
              setShowHandles(true);
            }}
          >
            <span style={{ color: '#007aff', fontSize: 16, fontWeight: 700 }}>⇋</span>
          </div>
        )}
        {/* Rotate handle - top-center */}
        {handles.topCenter && (
          <div
            style={handleStyle(handles.topCenter.x, handles.topCenter.y, 'grab', '#f0f8ff')}
            title="Rotate"
            onMouseDown={e => {
              e.stopPropagation();
              setRotating(true);
              setStartRotation(overlayLayer.rotation);
              if (handles.topCenter) {
                setStartMouse({ x: handles.topCenter.x, y: handles.topCenter.y });
              }
            }}
            onTouchStart={e => {
              e.stopPropagation();
              e.preventDefault();
              setRotating(true);
              setStartRotation(overlayLayer.rotation);
              if (handles.topCenter) {
                setStartMouse({ x: handles.topCenter.x, y: handles.topCenter.y });
              }
            }}
          >
            <span style={{ color: '#007aff', fontSize: 16 }}>⟳</span>
          </div>
        )}
        {/* Scale handle - bottom-right */}
        {handles.bottomRight && (
          <div
            style={handleStyle(handles.bottomRight.x, handles.bottomRight.y, 'nwse-resize', '#f0f8ff')}
            title="Scale"
            onMouseDown={e => {
              e.stopPropagation();
              setScaling(true);
              setStartScale(overlayLayer.scale);
              if (handles.bottomRight) {
                setStartMouse({ x: handles.bottomRight.x, y: handles.bottomRight.y });
                const center = { x: overlayLayer.x, y: overlayLayer.y };
                setStartScaleDist(Math.hypot(handles.bottomRight.x - center.x, handles.bottomRight.y - center.y));
              }
            }}
            onTouchStart={e => {
              e.stopPropagation();
              e.preventDefault();
              setScaling(true);
              setStartScale(overlayLayer.scale);
              if (handles.bottomRight) {
                setStartMouse({ x: handles.bottomRight.x, y: handles.bottomRight.y });
                const center = { x: overlayLayer.x, y: overlayLayer.y };
                setStartScaleDist(Math.hypot(handles.bottomRight.x - center.x, handles.bottomRight.y - center.y));
              }
            }}
          >
            <span style={{ color: '#007aff', fontSize: 18 }}>↔</span>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const size = Math.min(containerRef.current.offsetWidth, CANVAS_SIZE);
        setCanvasSize(size);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const updateHandleSize = () => {
      setHandleSize(window.innerWidth < 600 ? 32 : 20);
    };
    updateHandleSize();
    window.addEventListener('resize', updateHandleSize);
    return () => window.removeEventListener('resize', updateHandleSize);
  }, []);

  useEffect(() => {
    const updatePadding = () => {
      setContainerPadding(window.innerWidth < 600 ? 8 : 0);
    };
    updatePadding();
    window.addEventListener('resize', updatePadding);
    return () => window.removeEventListener('resize', updatePadding);
  }, []);

  useEffect(() => {
    if (dragging || scaling || rotating) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('touchmove', handleWindowTouchMove, { passive: false });
      window.addEventListener('touchend', handleWindowTouchEnd);
      window.addEventListener('touchcancel', handleWindowTouchEnd);
      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
        window.removeEventListener('touchmove', handleWindowTouchMove);
        window.removeEventListener('touchend', handleWindowTouchEnd);
        window.removeEventListener('touchcancel', handleWindowTouchEnd);
      };
    }
  }, [dragging, scaling, rotating, handleWindowTouchMove, handleGlobalMouseMove, handleGlobalMouseUp]);

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const fakeEvent = {
        ...e,
        clientX: touch.clientX,
        clientY: touch.clientY,
        preventDefault: () => e.preventDefault(),
        target: e.target,
        nativeEvent: e.nativeEvent,
      } as unknown as React.MouseEvent<HTMLCanvasElement>;
      handleMouseDown(fakeEvent);
    }
  };

  const handleWindowTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      if (dragging && overlayLayer) {
        setOverlayLayer({
          ...overlayLayer,
          x: x - (dragOffset?.x || 0),
          y: y - (dragOffset?.y || 0),
        });
      } else if (scaling && startMouse && overlayLayer) {
        const handles = getHandlePositions();
        if (!handles.bottomRight) return;
        const center = { x: overlayLayer.x, y: overlayLayer.y };
        const currDist = Math.hypot(x - center.x, y - center.y);
        let newScale = startScale * (currDist / startScaleDist);
        newScale = Math.max(0.1, Math.min(newScale, 5));
        setOverlayLayer({
          ...overlayLayer,
          scale: newScale,
        });
      } else if (rotating && startMouse && overlayLayer) {
        const center = { x: overlayLayer.x, y: overlayLayer.y };
        const startAngle = Math.atan2(startMouse.y - center.y, startMouse.x - center.x);
        const currAngle = Math.atan2(y - center.y, x - center.x);
        let newRotation = startRotation + ((currAngle - startAngle) * 180) / Math.PI;
        if (newRotation > 180) newRotation -= 360;
        if (newRotation < -180) newRotation += 360;
        setOverlayLayer({
          ...overlayLayer,
          rotation: newRotation,
        });
      }
      e.preventDefault();
    }
  };

  const handleWindowTouchEnd = (e: TouchEvent) => {
    setDragging(false);
    setScaling(false);
    setRotating(false);
    setStartMouse(null);
  };

  // Inline responsive styles for the container
const containerStyles: React.CSSProperties = {
  position: 'relative',
  width: '100vw',
  maxWidth: 512,
  margin: '0 auto',
  touchAction: 'none'
};

  return (
    <div
      ref={containerRef}
      style={{
        ...containerStyles,
        padding: containerPadding,
      }}
    >
      <div style={{ position: 'relative', width: canvasSize, height: canvasSize }}>
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          style={{
            width: '100%',
            height: 'auto',
            borderRadius: '15%',
            border: '3px solid #8fbfff',
            boxSizing: 'border-box',
            background: '#f8f8fa',
            touchAction: 'none',
            cursor: appState === 'EDIT' && overlayLayer ? (dragging ? 'grabbing' : 'grab') : 'default',
            userSelect: 'none',
            display: 'block',
            margin: 0,
            padding: 0,
          }}
          tabIndex={0}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        />
        {overlayHandles()}
      </div>
    </div>
  );
};

export default CanvasEditor;