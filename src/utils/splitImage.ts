/**
 * Splits a base64 image into `count` equal pieces arranged in a grid.
 * Returns an array of base64 piece images ordered left-to-right, top-to-bottom.
 *
 * Uses createObjectURL instead of assigning base64 directly to img.src,
 * which avoids a Safari/iPad bug where onload never fires for large base64 strings.
 */
export function splitImage(base64: string, count: number): Promise<string[]> {
  return new Promise((resolve, reject) => {
    // Convert base64 to blob so Safari/iPad reliably fires onload
    let objectUrl: string | null = null;
    try {
      const [header, data] = base64.split(',');
      const mimeMatch = header.match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const binary = atob(data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mime });
      objectUrl = URL.createObjectURL(blob);
    } catch {
      // Fall back to direct base64 assignment if blob conversion fails
      objectUrl = null;
    }

    const img = new Image();

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
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

    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error('Kunne ikke laste bilde'));
    };

    img.src = objectUrl ?? base64;
  });
}
