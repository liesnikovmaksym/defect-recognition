import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { loadImageFile } from '@/entities/image';
import { Button } from '@/shared/ui/Button';
import styles from './DrawCanvas.module.scss';

const SIZE = 512;
const MAX_UNDO = 20;
const SHAPE_RADIUS = SIZE * 0.3;
const INK = '#ffffff';
const PAPER = '#000000';

export function DrawCanvas() {
  const dispatch = useDispatch();
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);
  const undoStack = useRef([]);
  const [brush, setBrush] = useState(24);
  const [tool, setTool] = useState('pen');
  const [dirty, setDirty] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [busy, setBusy] = useState(false);

  const ctx = () => canvasRef.current.getContext('2d', { willReadFrequently: true });

  useEffect(() => {
    const c = ctx();
    c.fillStyle = PAPER;
    c.fillRect(0, 0, SIZE, SIZE);
  }, []);

  const pushSnapshot = () => {
    undoStack.current.push(ctx().getImageData(0, 0, SIZE, SIZE));
    if (undoStack.current.length > MAX_UNDO) undoStack.current.shift();
    setCanUndo(true);
  };

  const point = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) * SIZE) / rect.width, y: ((event.clientY - rect.top) * SIZE) / rect.height };
  };

  const stroke = (from, to) => {
    const c = ctx();
    c.strokeStyle = tool === 'pen' ? INK : PAPER;
    c.fillStyle = c.strokeStyle;
    c.lineWidth = brush;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(from.x, from.y);
    c.lineTo(to.x, to.y);
    c.stroke();
  };

  const onPointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pushSnapshot();
    drawing.current = true;
    last.current = point(event);
    stroke(last.current, last.current);
    setDirty(true);
  };
  const onPointerMove = (event) => {
    if (!drawing.current) return;
    const next = point(event);
    stroke(last.current, next);
    last.current = next;
  };
  const stopDrawing = () => {
    drawing.current = false;
  };

  const addShape = (type) => {
    pushSnapshot();
    const c = ctx();
    c.fillStyle = INK;
    c.beginPath();
    if (type === 'circle') c.arc(SIZE / 2, SIZE / 2, SHAPE_RADIUS, 0, Math.PI * 2);
    else c.rect(SIZE / 2 - SHAPE_RADIUS, SIZE / 2 - SHAPE_RADIUS, SHAPE_RADIUS * 2, SHAPE_RADIUS * 2);
    c.fill();
    setDirty(true);
  };

  const clear = () => {
    pushSnapshot();
    const c = ctx();
    c.fillStyle = PAPER;
    c.fillRect(0, 0, SIZE, SIZE);
    setDirty(false);
  };

  const undo = () => {
    const snapshot = undoStack.current.pop();
    if (!snapshot) return;
    ctx().putImageData(snapshot, 0, 0);
    setCanUndo(undoStack.current.length > 0);
    setDirty(undoStack.current.length > 0);
  };

  const useDrawing = () => {
    setBusy(true);
    canvasRef.current.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], `drawing-${Date.now()}.png`, { type: 'image/png' });
        await dispatch(loadImageFile({ file, source: 'drawn' }));
      }
      setBusy(false);
    }, 'image/png');
  };

  return (
    <div className={styles.root}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        width={SIZE}
        height={SIZE}
        aria-label="Полотно для малювання фігури"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDrawing}
        onPointerCancel={stopDrawing}
      />
      <div className={styles.toolbar}>
        <div className={styles.group} role="group" aria-label="Інструмент">
          <Button variant="secondary" className={tool === 'pen' ? styles.on : ''} onClick={() => setTool('pen')} aria-pressed={tool === 'pen'}>
            Пензель
          </Button>
          <Button variant="secondary" className={tool === 'eraser' ? styles.on : ''} onClick={() => setTool('eraser')} aria-pressed={tool === 'eraser'}>
            Гумка
          </Button>
        </div>
        <label className={styles.slider}>
          <span>Товщина: {brush} px</span>
          <input type="range" min={2} max={80} value={brush} onChange={(e) => setBrush(Number(e.target.value))} />
        </label>
      </div>
      <div className={styles.toolbar}>
        <Button variant="secondary" onClick={() => addShape('circle')}>Круг</Button>
        <Button variant="secondary" onClick={() => addShape('square')}>Квадрат</Button>
        <Button variant="secondary" onClick={undo} disabled={!canUndo}>Скасувати</Button>
        <Button variant="secondary" onClick={clear} disabled={!dirty}>Очистити</Button>
      </div>
      <Button onClick={useDrawing} disabled={!dirty || busy}>
        {busy ? 'Підготовка…' : 'Використати малюнок'}
      </Button>
      <p className={styles.hint}>Додайте готову фігуру й дорисуйте виступ пензлем.</p>
    </div>
  );
}
