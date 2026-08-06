import type { YogaId, YogaResult } from '../types';
import { yogaNameGu } from '../data/yogaNamesGu';

export interface InviteDetails {
  yajmaanName: string;
  yoga: Pick<YogaResult, 'id' | 'name' | 'nameHi' | 'category' | 'severity' | 'remedy'>;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  place: string;
  notes?: string;
  hostName?: string;
}

const W = 1080;
const H = 1350;

const THEMES: Record<
  'high' | 'medium' | 'low' | 'yoga',
  { bg1: string; bg2: string; accent: string; ribbon: string; label: string }
> = {
  high: {
    bg1: '#3b0a0a',
    bg2: '#7f1d1d',
    accent: '#fbbf24',
    ribbon: '#b91c1c',
    label: 'પૂજા / ઉપાય',
  },
  medium: {
    bg1: '#431407',
    bg2: '#9a3412',
    accent: '#fdba74',
    ribbon: '#c2410c',
    label: 'પૂજા / ઉપાય',
  },
  low: {
    bg1: '#1e1b4b',
    bg2: '#4338ca',
    accent: '#c4b5fd',
    ribbon: '#4f46e5',
    label: 'પૂજા / ઉપાય',
  },
  yoga: {
    bg1: '#052e16',
    bg2: '#166534',
    accent: '#86efac',
    ribbon: '#15803d',
    label: 'શુભ યોગ પૂજા',
  },
};

function themeFor(yoga: InviteDetails['yoga']) {
  if (yoga.category === 'yoga') return THEMES.yoga;
  return THEMES[yoga.severity] ?? THEMES.medium;
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDisplayTime(time: string): string {
  if (!time) return '';
  const [hh, mm] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

function measureWrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number,
  maxLines = 3,
): number {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return lineHeight;
  let line = '';
  let lines = 1;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines++;
      line = word;
      if (lines >= maxLines) break;
    } else {
      line = test;
    }
  }
  return lines * lineHeight;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 4,
): number {
  const words = text.split(/\s+/).filter(Boolean);
  let line = '';
  let lines = 0;
  let cy = y;
  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = words[i];
      cy += lineHeight;
      lines++;
      if (lines >= maxLines - 1) {
        let rest = words.slice(i).join(' ');
        while (ctx.measureText(`${rest}…`).width > maxWidth && rest.length > 3) {
          rest = rest.slice(0, -1);
        }
        const full = words.slice(i).join(' ');
        ctx.fillText(rest.length < full.length ? `${rest}…` : rest, x, cy);
        return cy + lineHeight;
      }
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, cy);
    cy += lineHeight;
  }
  return cy;
}

function drawOrnament(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 120, y);
  ctx.lineTo(x - 40, y);
  ctx.moveTo(x + 40, y);
  ctx.lineTo(x + 120, y);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Draw a ready-to-send pooja invitation PNG for a dosha/yoga. */
export async function generateInviteCard(details: InviteDetails): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  const theme = themeFor(details.yoga);

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, theme.bg1);
  grad.addColorStop(1, theme.bg2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Decorative border
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 10;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.lineWidth = 2;
  ctx.strokeRect(56, 56, W - 112, H - 112);

  // Top ribbon
  ctx.fillStyle = theme.ribbon;
  ctx.fillRect(120, 90, W - 240, 64);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 32px "Noto Sans Gujarati", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(theme.label, W / 2, 132);

  // Om
  ctx.fillStyle = theme.accent;
  ctx.font = 'bold 64px serif';
  ctx.fillText('ॐ', W / 2, 230);
  drawOrnament(ctx, W / 2, 258, theme.accent);

  // Organizer — large, centered, upper-middle
  const host = details.hostName?.trim() || 'Yoga Jyotish';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 56px "Noto Sans Gujarati", "Segoe UI", sans-serif';
  const hostEnd = wrapText(ctx, host, W / 2, 320, W - 160, 62, 2);
  ctx.fillStyle = theme.accent;
  ctx.font = '26px "Noto Sans Gujarati", "Segoe UI", sans-serif';
  ctx.fillText('આયોજક', W / 2, hostEnd + 8);

  // Dosha name (Gujarati only on card)
  ctx.fillStyle = theme.accent;
  ctx.font = 'bold 50px "Noto Sans Gujarati", "Segoe UI", sans-serif';
  const doshaTitle = yogaNameGu(details.yoga.id, details.yoga.nameHi || details.yoga.name);
  const doshaEnd = wrapText(ctx, doshaTitle, W / 2, hostEnd + 70, W - 180, 58, 2);

  // Yajmaan
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = 'bold 28px "Noto Sans Gujarati", "Segoe UI", sans-serif';
  ctx.fillText('યજમાન', W / 2, doshaEnd + 20);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 46px "Segoe UI", "Noto Sans Gujarati", sans-serif';
  const nameEnd = wrapText(ctx, details.yajmaanName, W / 2, doshaEnd + 70, W - 180, 52, 2);

  // Details — Gujarati labels only (date/time values stay English)
  const rows: [string, string][] = [
    ['📅 તારીખ', formatDisplayDate(details.date) || details.date],
    ['⏰ સમય', formatDisplayTime(details.time) || details.time],
    ['📍 સ્થળ', details.place],
  ];
  if (details.notes?.trim()) {
    rows.push(['📝 નોંધ', details.notes.trim()]);
  }

  const left = 170;
  const maxTextW = W - 340;
  const labelSize = 22;
  const valueSize = 28;
  const valueLh = 34;
  const topPad = 40;
  const bottomPad = 36;
  const gapAfterValue = 20;

  let measured = topPad;
  for (const [, value] of rows) {
    ctx.font = `bold ${labelSize}px "Noto Sans Gujarati", "Segoe UI", sans-serif`;
    measured += 26;
    ctx.font = `${valueSize}px "Segoe UI", sans-serif`;
    measured += measureWrap(ctx, value, maxTextW, valueLh, 3);
    measured += gapAfterValue;
  }
  measured += bottomPad - gapAfterValue;

  const boxY = Math.max(nameEnd + 28, 700);
  const footerReserve = 70;
  const maxBoxH = H - boxY - footerReserve;
  const boxH = Math.min(Math.max(measured, 220), maxBoxH);

  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  roundRect(ctx, 120, boxY, W - 240, boxH, 24);
  ctx.fill();
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 2;
  roundRect(ctx, 120, boxY, W - 240, boxH, 24);
  ctx.stroke();

  // Clip text to the box interior
  ctx.save();
  roundRect(ctx, 130, boxY + 8, W - 260, boxH - 16, 18);
  ctx.clip();

  ctx.textAlign = 'left';
  let row = boxY + topPad;
  const boxBottom = boxY + boxH - 16;
  for (const [label, value] of rows) {
    if (row > boxBottom - 40) break;
    ctx.fillStyle = theme.accent;
    ctx.font = `bold ${labelSize}px "Noto Sans Gujarati", "Segoe UI", sans-serif`;
    ctx.fillText(label, left, row);
    ctx.fillStyle = '#fff';
    ctx.font = `${valueSize}px "Segoe UI", sans-serif`;
    const next = wrapText(ctx, value, left, row + 30, maxTextW, valueLh, 3);
    row = next + gapAfterValue;
  }
  ctx.restore();

  // Simple footer brand (no invitation wording)
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '22px "Segoe UI", sans-serif';
  ctx.fillText('Yoga Jyotish', W / 2, H - 55);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create image'))),
      'image/png',
    );
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function buildPoojaInviteMessage(details: InviteDetails): string {
  const date = formatDisplayDate(details.date) || details.date;
  const time = formatDisplayTime(details.time) || details.time;
  const dosha = yogaNameGu(details.yoga.id, details.yoga.nameHi || details.yoga.name);
  const host = details.hostName?.trim();

  return [
    `🙏 નમસ્તે ${details.yajmaanName},`,
    '',
    `આપને *${dosha}* ની પૂજા / વિધિ માટે જાણ કરીએ છીએ.`,
    '',
    `📅 તારીખ: ${date}`,
    `⏰ સમય: ${time}`,
    `📍 સ્થળ: ${details.place}`,
    details.notes?.trim() ? `📝 નોંધ: ${details.notes.trim()}` : '',
    host ? `\nઆયોજક: ${host}` : '',
    '',
    'કૃપા કરીને ઉપરની વિગતો નોંધી લેજો.',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

export function inviteFileName(yogaId: YogaId | string, name: string): string {
  const safe = name.replace(/[^\w\u0A80-\u0AFF-]+/g, '_').slice(0, 40);
  return `pooja-invite-${yogaId}-${safe}.png`;
}
