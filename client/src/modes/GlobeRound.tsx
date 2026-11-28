import { useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Plus, MapPin } from 'lucide-react';
import { geoDistance, geoGraticule10, geoOrthographic, geoPath, geoInterpolate } from 'd3-geo';
import { feature } from 'topojson-client';
import type { MultiPolygon, Polygon } from 'geojson';
import type { Topology } from 'topojson-specification';
import type { ModeProps } from './types';
import { ItemHeader, WaitingNote, currentFeedback } from './ItemHeader';
import { SecondsLeft, TimerBar } from '../components/ui';
import { play } from '../lib/sound';

interface GlobeData {
  name: string;
  index: number;
  total: number;
  seconds: number;
}

const SIZE = 400;
const R = SIZE / 2 - 6;
const GRACE_MS = 700;
const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const DRAG_PX = 6;

/** Land only (no country borders), loaded once and cached. */
let landCache: Polygon | MultiPolygon | null = null;
let landPromise: Promise<Polygon | MultiPolygon> | null = null;
function loadLand() {
  landPromise ??= import('world-atlas/land-110m.json').then((m) => {
    const topo = (m.default ?? m) as unknown as Topology;
    const f = feature(topo, topo.objects.land) as unknown as { features: { geometry: Polygon | MultiPolygon }[] } | { geometry: Polygon | MultiPolygon };
    landCache = 'features' in f ? { type: 'MultiPolygon', coordinates: f.features.flatMap((x) => (x.geometry.type === 'Polygon' ? [x.geometry.coordinates] : x.geometry.coordinates)) } : f.geometry;
    return landCache;
  });
  return landPromise;
}

const GRATICULE = geoGraticule10();

export function GlobeRound({ item, feedback, onAnswer, waiting }: ModeProps<GlobeData>) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [land, setLand] = useState(landCache);
  const [rot, setRot] = useState<[number, number]>([-15, -30]); // [lambda, phi]: starts over Europe/Africa
  const [zoom, setZoom] = useState(1);
  const [pin, setPin] = useState<[number, number] | null>(null);
  const [sent, setSent] = useState(false);
  const pinRef = useRef(pin);
  pinRef.current = pin;
  const sentRef = useRef(false);
  const drag = useRef<{ id: number; x: number; y: number; rot: [number, number]; moved: boolean } | null>(null);

  useEffect(() => {
    if (!land) void loadLand().then(setLand);
  }, [land]);

  useEffect(() => {
    setPin(null);
    setSent(false);
    sentRef.current = false;
    if (!item?.endsAt) return;
    const t = setTimeout(() => submit(), Math.max(0, item.endsAt - GRACE_MS - performance.now()));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.round, item?.item]);

  function submit() {
    if (sentRef.current) return;
    sentRef.current = true;
    setSent(true);
    const p = pinRef.current;
    onAnswer(p ? { lon: p[0], lat: p[1] } : null);
  }

  const fb = item ? currentFeedback(item, feedback) : null;
  const center = fb && Array.isArray(fb.center) ? (fb.center as [number, number]) : null;

  // After the answer, swing the globe to the country.
  useEffect(() => {
    if (!center) return;
    const from = rot;
    const to: [number, number] = [-center[0], -center[1]];
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / 700);
      const e = 1 - (1 - t) ** 3;
      let dl = to[0] - from[0];
      dl = ((dl + 540) % 360) - 180; // shortest way round
      setRot([from[0] + dl * e, from[1] + (to[1] - from[1]) * e]);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fb?.seq]);

  const projection = useMemo(
    () => geoOrthographic().scale(R * zoom).translate([SIZE / 2, SIZE / 2]).rotate([rot[0], rot[1]]).clipAngle(90),
    [rot, zoom],
  );
  const path = useMemo(() => geoPath(projection), [projection]);

  if (waiting) return <WaitingNote />;
  if (!item) return <div className="m-auto text-muted">…</div>;
  const locked = sent || !!fb;
  const shownEnd = item.endsAt ? item.endsAt - GRACE_MS : null;

  const toSvg = (clientX: number, clientY: number): [number, number] => {
    const r = svgRef.current!.getBoundingClientRect();
    return [((clientX - r.left) / r.width) * SIZE, ((clientY - r.top) / r.height) * SIZE];
  };

  const visible = (p: [number, number]) => geoDistance(p, [-rot[0], -rot[1]]) < Math.PI / 2 - 0.01;
  const pinXY = pin && visible(pin) ? projection(pin) : null;

  const km = typeof fb?.km === 'number' ? (fb.km as number) : null;
  const inside = fb?.inside === true;
  const nearest = Array.isArray(fb?.nearest) ? (fb!.nearest as [number, number]) : null;
  const outline = Array.isArray(fb?.outline) ? (fb!.outline as [number, number][][]) : [];
  const result = fb ? (km === null ? 'No pin' : inside ? 'Inside!' : `${km.toLocaleString('en')} km away`) : undefined;

  const missLine =
    pin && nearest && !inside
      ? { type: 'LineString' as const, coordinates: Array.from({ length: 33 }, (_, i) => geoInterpolate(pin, nearest)(i / 32)) }
      : null;

  return (
    <div className="flex flex-1 flex-col">
      <ItemHeader item={item} fb={fb} hideTimer result={result} />
      {!fb && shownEnd && (
        <div className="-mt-1.5">
          <div className="mb-1 flex justify-end"><SecondsLeft endsAt={shownEnd} className="text-sm font-bold" /></div>
          <TimerBar endsAt={shownEnd} totalMs={item.data.seconds * 1000} />
        </div>
      )}

      <div className="mt-4 text-center">
        <div className="label">Pin the country</div>
        <h2 className="font-display text-3xl font-bold tracking-tight">{item.data.name}</h2>
        <p className="mt-0.5 text-xs text-muted">
          {fb ? (inside ? `+${fb.points}: right inside` : km !== null ? `+${fb.points}` : 'Time’s up') : 'Drag to spin the globe, tap to drop your pin'}
        </p>
      </div>

      <div className="relative mx-auto mt-3 w-full max-w-[380px]">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="aspect-square w-full touch-none select-none"
          data-no-tap-sound
          onPointerDown={(e) => {
            if (drag.current) return;
            (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
            drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, rot, moved: false };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d || d.id !== e.pointerId) return;
            const dx = e.clientX - d.x;
            const dy = e.clientY - d.y;
            if (!d.moved && Math.hypot(dx, dy) < DRAG_PX) return;
            d.moved = true;
            const r = svgRef.current!.getBoundingClientRect();
            const k = (SIZE / r.width) * (0.28 / zoom);
            setRot([d.rot[0] + dx * k, Math.max(-89, Math.min(89, d.rot[1] - dy * k))]);
          }}
          onPointerUp={(e) => {
            const d = drag.current;
            if (!d || d.id !== e.pointerId) return;
            drag.current = null;
            if (d.moved || locked) return;
            const [x, y] = toSvg(e.clientX, e.clientY);
            if (Math.hypot(x - SIZE / 2, y - SIZE / 2) > R * zoom) return; // off the globe
            const ll = projection.invert?.([x, y]);
            if (!ll || !Number.isFinite(ll[0]) || !Number.isFinite(ll[1])) return;
            setPin([ll[0], ll[1]]);
            play('pickUp');
          }}
          onPointerCancel={() => (drag.current = null)}
          onWheel={(e) => setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * (e.deltaY < 0 ? 1.15 : 1 / 1.15))))}
        >
          <defs>
            <radialGradient id="globe-shade" cx="38%" cy="32%" r="75%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
              <stop offset="70%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="100%" stopColor="#15788c" stopOpacity="0.25" />
            </radialGradient>
          </defs>
          <path d={path({ type: 'Sphere' }) ?? ''} fill="#bfe7e8" stroke="#15788c" strokeWidth={1.5} />
          <path d={path(GRATICULE) ?? ''} fill="none" stroke="#15788c" strokeOpacity={0.12} strokeWidth={0.6} />
          {land && <path d={path(land) ?? ''} fill="#46425e" fillOpacity={0.88} />}
          {outline.map((ring, i) => (
            <path key={i} d={path({ type: 'LineString', coordinates: ring }) ?? ''} fill="none" stroke="#ff6973" strokeWidth={2.2} strokeLinejoin="round" />
          ))}
          {missLine && <path d={path(missLine) ?? ''} fill="none" stroke="#ff6973" strokeWidth={1.6} strokeDasharray="5 4" />}
          {fb && nearest && !inside && visible(nearest) && (() => {
            const p = projection(nearest);
            return p ? <circle cx={p[0]} cy={p[1]} r={4} fill="#ff6973" stroke="#fff8e6" strokeWidth={1.5} /> : null;
          })()}
          <path d={path({ type: 'Sphere' }) ?? ''} fill="url(#globe-shade)" pointerEvents="none" />
          {pinXY && (
            <g transform={`translate(${pinXY[0]} ${pinXY[1]})`} pointerEvents="none">
              <ellipse cx={0} cy={2} rx={5} ry={2} fill="#000" opacity={0.25} />
              <path d="M0,0 C-9,-14 -11,-20 -11,-25 a11,11 0 1 1 22,0 C11,-20 9,-14 0,0 Z" fill={inside ? '#15788c' : '#ff6973'} stroke="#fff8e6" strokeWidth={2} />
              <circle cx={0} cy={-25} r={4} fill="#fff8e6" />
            </g>
          )}
        </svg>
        <div className="absolute bottom-1 right-1 flex flex-col gap-1.5">
          <button type="button" className="btn btn-secondary h-10 w-10 p-0" onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.5))} aria-label="Zoom in"><Plus size={18} /></button>
          <button type="button" className="btn btn-secondary h-10 w-10 p-0" onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z / 1.5))} aria-label="Zoom out"><Minus size={18} /></button>
        </div>
      </div>

      <button onClick={submit} disabled={locked || !pin} className="btn btn-primary mt-auto w-full py-3.5">
        {fb ? `+${fb.points}` : sent ? 'Checking…' : pin ? (<><MapPin size={18} /> Lock in</>) : 'Tap the globe to drop a pin'}
      </button>
    </div>
  );
}
