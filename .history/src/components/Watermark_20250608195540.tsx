// src/components/Watermark.tsx
const WATERMARK_SRC = '/BossBurger.svg';

const Watermark = {
  draw: (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ): void => {
    const img = new window.Image();
    img.src = WATERMARK_SRC;
    img.onload = () => {
      ctx.globalAlpha = 0.7;
      ctx.drawImage(img, x, y, width, height);
      ctx.globalAlpha = 1.0;
    };
  }
};

export default Watermark;