import type { YogaId, YogaResult } from '../types';

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
    label: 'પૂજા / ઉપાય નિમંત્રણ',
  },
  medium: {
    bg1: '#431407',
    bg2: '#9a3412',
    accent: '#fdba74',
    ribbon: '#c2410c',
    label: 'પૂજા / ઉપાય નિમંત્રણ',
  },
  low: {
    bg1: '#1e1b4b',
    bg2: '#4338ca',
    accent: '#c4b5fd',
    ribbon: '#4f46e5',
    label: 'પૂજા / ઉપાય નિમંત્રણ',
  },
  yoga: {
    bg1: '#052e16',
    bg2: '#166534',
    accent: '#86efac',
    ribbon: '#15803d',
    label: 'શુભ યોગ પૂજા નિમંત્રણ',
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

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 4,
): number {
  const words = text.split(/\s+/);
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
        // last line with ellipsis if needed
        let rest = words.slice(i).join(' ');
        while (ctx.measureText(`${rest}…`).width > maxWidth && rest.length > 3) {
          rest = rest.slice(0, -1);
        }
        ctx.fillText(rest.length < words.slice(i).join(' ').length ? `${rest}…` : rest, x, cy);
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
  ctx.fillRect(120, 100, W - 240, 70);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 34px "Noto Sans Gujarati", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(theme.label, W / 2, 146);

  // Om / brand
  ctx.fillStyle = theme.accent;
  ctx.font = 'bold 72px serif';
  ctx.fillText('ॐ', W / 2, 260);
  drawOrnament(ctx, W / 2, 290, theme.accent);

  ctx.fillStyle = '#fff7ed';
  ctx.font = '600 28px "Segoe UI", sans-serif';
  ctx.fillText('Yoga Jyotish', W / 2, 340);

  // Dosha name
  ctx.fillStyle = theme.accent;
  ctx.font = 'bold 52px "Noto Sans Gujarati", "Segoe UI", sans-serif';
  const doshaTitle = details.yoga.nameHi || details.yoga.name;
  wrapText(ctx, doshaTitle, W / 2, 430, W - 180, 60, 2);

  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '28px "Segoe UI", sans-serif';
  wrapText(ctx, details.yoga.name, W / 2, 520, W - 200, 36, 2);

  // Invitee
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 40px "Noto Sans Gujarati", "Segoe UI", sans-serif';
  ctx.fillText('આપને સાદર આમંત્રણ', W / 2, 620);
  ctx.font = 'bold 48px "Segoe UI", sans-serif';
  wrapText(ctx, details.yajmaanName, W / 2, 680, W - 180, 56, 2);

  // Details box
  const boxY = 780;
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  roundRect(ctx, 120, boxY, W - 240, 360, 24);
  ctx.fill();
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 2;
  roundRect(ctx, 120, boxY, W - 240, 360, 24);
  ctx.stroke();

  ctx.textAlign = 'left';
  const left = 170;
  let row = boxY + 70;
  const rows: [string, string][] = [
    ['📅 તારીખ / Date', formatDisplayDate(details.date) || details.date],
    ['⏰ સમય / Time', formatDisplayTime(details.time) || details.time],
    ['📍 સ્થળ / Place', details.place],
  ];
  if (details.notes?.trim()) {
    rows.push(['📝 નોંધ / Note', details.notes.trim()]);
  }

  for (const [label, value] of rows) {
    ctx.fillStyle = theme.accent;
    ctx.font = 'bold 24px "Noto Sans Gujarati", "Segoe UI", sans-serif';
    ctx.fillText(label, left, row);
    ctx.fillStyle = '#fff';
    ctx.font = '32px "Segoe UI", sans-serif';
    wrapText(ctx, value, left, row + 42, W - 340, 38, 2);
    row += 85;
  }

  // Footer
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '24px "Segoe UI", sans-serif';
  const host = details.hostName?.trim() || 'Yoga Jyotish';
  ctx.fillText(`— ${host} —`, W / 2, H - 90);
  ctx.font = '20px "Segoe UI", sans-serif';
  ctx.fillText('આધ્યાત્મિક ઉપાય માટે સાદર નિમંત્રણ', W / 2, H - 55);

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
  const dosha = details.yoga.nameHi
    ? `${details.yoga.nameHi} (${details.yoga.name})`
    : details.yoga.name;

  return [
    `🙏 નમસ્તે ${details.yajmaanName},`,
    '',
    `આપને ${dosha} ની પૂજા / વિધિ માટે સાદર આમંત્રણ.`,
    '',
    `📅 તારીખ: ${date}`,
    `⏰ સમય: ${time}`,
    `📍 સ્થળ: ${details.place}`,
    details.notes?.trim() ? `📝 ${details.notes.trim()}` : '',
    '',
    'કૃપા કરીને આમંત્રણ કાર્ડ (image) જોડીને મોકલેલ છે — અથવા WhatsApp માં attach કરો.',
    '',
    '— Yoga Jyotish',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

export function inviteFileName(yogaId: YogaId | string, name: string): string {
  const safe = name.replace(/[^\w\u0A80-\u0AFF-]+/g, '_').slice(0, 40);
  return `pooja-invite-${yogaId}-${safe}.png`;
}
