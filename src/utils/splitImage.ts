/**
 * Splits a base64 image into `count` equal pieces arranged in a grid.
 * Returns an array of base64 piece images ordered left-to-right, top-to-bottom.
 */
export function splitImage(base64: string, count: number): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const cols = Math.ceil(Math.sqrt(count));
      const rows = Math.ceil(count / cols);
      const pieceW = Math.floor(img.naturalWidth / cols);
      const pieceH = Math.floor(img.naturalHeight / rows);
      const pieces: string[] = [];

      for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const canvas = document.createElement('canvas');
        canvas.width = pieceW;
        canvas.height = pieceH;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, col * pieceW, row * pieceH, pieceW, pieceH, 0, 0, pieceW, pieceH);
        pieces.push(canvas.toDataURL('image/jpeg', 0.85));
      }

      resolve(pieces);
    };
    img.onerror = () => reject(new Error('Kunne ikke laste bilde'));
    img.src = base64;
  });
}
