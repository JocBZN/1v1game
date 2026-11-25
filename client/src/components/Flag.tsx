import { cn } from '../lib/cn';

/** "🇷🇴" (two regional-indicator letters) → "ro". */
export function flagCode(flag: string): string | null {
  const cps = [...flag].map((c) => c.codePointAt(0) ?? 0);
  if (cps.length !== 2 || cps.some((c) => c < 0x1f1e6 || c > 0x1f1ff)) return null;
  return cps.map((c) => String.fromCharCode(c - 0x1f1e6 + 97)).join('');
}

/** A country flag as an SVG image (/flags/<code>.svg), never an emoji. */
export function FlagImage({ flag, className, alt = 'Flag' }: { flag: string; className?: string; alt?: string }) {
  const code = flagCode(flag) ?? flag.toLowerCase();
  return (
    <img
      src={`/flags/${code}.svg`}
      alt={alt}
      draggable={false}
      className={cn('aspect-[4/3] rounded-xl object-cover shadow-[0_10px_30px_-12px_rgb(43_27_18/0.45)] ring-1 ring-black/10', className)}
    />
  );
}
