// src/components/Watermark.tsx
const WATERMARK_SRC = '/BossBurger.svg';

const Watermark = {
  draw: (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void => {
    const img = new window.Image();
    img.src = WATERMARK_SRC;
    img.onload = () => {
      // Watermark should never be larger than 1/4 of the canvas width
      const maxWidth = canvasWidth / 4;
      const scale = Math.min(1, maxWidth / img.width);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = canvasWidth - w - 16; // 16px padding from right
      const y = canvasHeight - h - 16; // 16px padding from bottom
      ctx.globalAlpha = 0.7;
      ctx.drawImage(img, x, y, w, h);
      ctx.globalAlpha = 1.0;
    };
  }
};

export default Watermark;