import React, { useEffect, useRef } from 'react';
import { BarChart2 } from 'lucide-react';

export default function ByteHistogramChart({ histogram }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!histogram || histogram.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const maxVal = Math.max(...histogram, 0.0001);
    const barWidth = width / 256;

    for (let i = 0; i < 256; i++) {
      const val = histogram[i] || 0;
      const barHeight = (val / maxVal) * (height - 15);
      const x = i * barWidth;
      const y = height - barHeight - 12;

      // Color coding: null bytes (0), printable ascii (32-126), high bytes (>127)
      if (i === 0) {
        ctx.fillStyle = '#F59E0B'; // Amber for null byte
      } else if (i >= 32 && i <= 126) {
        ctx.fillStyle = '#06B6D4'; // Cyan for ASCII
      } else {
        ctx.fillStyle = '#6366F1'; // Indigo for binary / high bytes
      }

      ctx.fillRect(x, y, Math.max(1, barWidth - 0.5), barHeight);
    }

    // Baseline axis
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height - 12);
    ctx.lineTo(width, height - 12);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '9px monospace';
    ctx.fillText('0x00', 4, height - 2);
    ctx.fillText('0x20 (ASCII)', width * 0.125, height - 2);
    ctx.fillText('0x7F (DEL)', width * 0.5, height - 2);
    ctx.fillText('0xFF', width - 28, height - 2);
  }, [histogram]);

  if (!histogram || histogram.length === 0) return null;

  return (
    <div className="bg-[#111827]/80 rounded-2xl p-5 border border-gray-800 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-gray-200 text-base">
            Phân Bố Tần Suất Byte (Byte Histogram: 0 — 255)
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span> 0x00 (Null)
          </span>
          <span className="flex items-center gap-1 text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span> 0x20-0x7E (ASCII)
          </span>
          <span className="flex items-center gap-1 text-indigo-400">
            <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block"></span> 0x80-0xFF (Binary)
          </span>
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-lg bg-gray-950 p-2 border border-gray-900">
        <canvas
          ref={canvasRef}
          width={800}
          height={160}
          className="w-full h-40 block"
        />
      </div>
      <p className="text-[11px] text-gray-400">
        * Tần suất byte phản ánh cấu trúc tệp mã máy và tài nguyên. Mẫu bị pack hoặc nén thường có phân bố entropy phẳng trên toàn dải byte.
      </p>
    </div>
  );
}
