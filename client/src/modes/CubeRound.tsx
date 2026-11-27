import { useEffect, useRef, useState } from 'react';
import { play } from '../lib/sound';
import * as THREE from 'three';
// Same pure model the server uses to validate moves, so the local view can never drift from the server.
import { applyMove, goalProgress, type Axis, type CubeGoal, type CubeMove, type Sticker, type Vec3 } from '../../../server/src/cube/model';
import type { ModeProps } from './types';
import { Progress } from '../components/ui';

interface CubeItemData {
  stickers: Sticker[];
  progress: number;
  maxProgress: number;
  goal: CubeGoal;
  colorName: string;
  moves?: number;
}

const CSS_COLORS = ['#f7f7fb', '#ffd500', '#1fb85a', '#1e6bff', '#e8273b', '#ff8a1f'];

const STICKER_COLORS = [0xf7f7fb, 0xffd500, 0x1fb85a, 0x1e6bff, 0xe8273b, 0xff8a1f];
const AXES: Axis[] = ['x', 'y', 'z'];
const TURN_MS = 140;
const DRAG_THRESHOLD = 10;
const FULL_TURN_PX = 90; // finger travel for a full quarter turn
const clampN = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

const key = (p: readonly number[]) => p.join(',');

function roundedRect(size: number, r: number) {
  const s = size / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-s + r, -s);
  shape.lineTo(s - r, -s);
  shape.quadraticCurveTo(s, -s, s, -s + r);
  shape.lineTo(s, s - r);
  shape.quadraticCurveTo(s, s, s - r, s);
  shape.lineTo(-s + r, s);
  shape.quadraticCurveTo(-s, s, -s, s - r);
  shape.lineTo(-s, -s + r);
  shape.quadraticCurveTo(-s, -s, -s + r, -s);
  return new THREE.ShapeGeometry(shape, 4);
}

/**
 * A real 3×3 cube rendered with three.js.
 *  - drag on a sticker → turns that row/column/layer in the drag direction (one quarter turn per drag)
 *  - drag anywhere else (outside the cube) → spins the whole cube
 * Every turn is sent to the server, which keeps its own copy of the cube and decides the score.
 */
class CubeView {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  cube = new THREE.Group();
  cubies = new Map<string, THREE.Group>();
  pickables: THREE.Object3D[] = [];
  stickers: Sticker[];
  animating = false;
  raycaster = new THREE.Raycaster();
  private bodyGeo = new THREE.BoxGeometry(0.96, 0.96, 0.96);
  private bodyMat = new THREE.MeshStandardMaterial({ color: 0x46425e, roughness: 0.55, metalness: 0.1 });
  private highlightMat = new THREE.MeshStandardMaterial({ color: 0x00b9be, emissive: 0x00b9be, emissiveIntensity: 0.35, roughness: 0.5 });
  private stickerGeo = roundedRect(0.84, 0.12);
  private stickerMats = STICKER_COLORS.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.3, metalness: 0.05 }));
  private ro: ResizeObserver;

  constructor(private host: HTMLElement, stickers: Sticker[], private onMove: (m: CubeMove) => void) {
    this.stickers = stickers;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.domElement.style.touchAction = 'none';
    this.renderer.domElement.style.display = 'block';
    host.appendChild(this.renderer.domElement);

    this.camera.position.set(0, 0, 11);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xc9b089, 2.2));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(4, 6, 8);
    this.scene.add(key);

    this.cube.rotation.set(0.55, -0.75, 0);
    this.scene.add(this.cube);
    this.rebuild();

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.resize();
    this.bindPointer();
    this.renderer.setAnimationLoop(() => this.renderer.render(this.scene, this.camera));
  }

  resize() {
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = `${w}px`;
    this.renderer.domElement.style.height = `${h}px`;
    this.camera.aspect = w / h;
    // keep the whole cube visible on narrow (portrait) screens
    this.camera.position.z = w < h ? 11 * Math.max(1, (h / w) * 0.72) : 11;
    this.camera.updateProjectionMatrix();
  }

  /** (Re)create all cubie meshes from the logical sticker state. */
  rebuild() {
    for (const g of this.cubies.values()) this.cube.remove(g);
    this.cubies.clear();
    this.pickables = [];
    for (let x = -1; x <= 1; x++)
      for (let y = -1; y <= 1; y++)
        for (let z = -1; z <= 1; z++) {
          if (!x && !y && !z) continue;
          const g = new THREE.Group();
          g.position.set(x, y, z);
          const body = new THREE.Mesh(this.bodyGeo, this.bodyMat);
          body.userData = { pos: [x, y, z] };
          g.add(body);
          this.pickables.push(body);
          this.cube.add(g);
          this.cubies.set(key([x, y, z]), g);
        }
    const up = new THREE.Vector3(0, 0, 1);
    for (const s of this.stickers) {
      const g = this.cubies.get(key(s.p))!;
      const m = new THREE.Mesh(this.stickerGeo, this.stickerMats[s.c]);
      const n = new THREE.Vector3(...s.n);
      m.position.copy(n).multiplyScalar(0.485);
      m.quaternion.setFromUnitVectors(up, n);
      m.userData = { pos: s.p, n: s.n };
      g.add(m);
      this.pickables.push(m);
    }
  }

  private ndc(e: PointerEvent) {
    const r = this.renderer.domElement.getBoundingClientRect();
    return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }

  private toScreen(world: THREE.Vector3) {
    const r = this.renderer.domElement.getBoundingClientRect();
    const v = world.clone().project(this.camera);
    return new THREE.Vector2(((v.x + 1) / 2) * r.width, ((1 - v.y) / 2) * r.height);
  }

  private bindPointer() {
    const el = this.renderer.domElement;
    type Drag =
      | { kind: 'turn'; id: number; start: THREE.Vector2; pos: Vec3; n: Vec3; local: THREE.Vector3; world: THREE.Vector3; used: boolean }
      | { kind: 'orbit'; id: number; last: THREE.Vector2 };
    let drag: Drag | null = null;

    el.addEventListener('pointerdown', (e) => {
      try {
        el.setPointerCapture(e.pointerId); // keep receiving moves when the finger leaves the canvas
      } catch {
        /* pointer already gone */
      }
      const at = new THREE.Vector2(e.clientX, e.clientY);
      this.cube.updateMatrixWorld(true); // pick against the current orientation, even before the next frame
      this.raycaster.setFromCamera(this.ndc(e), this.camera);
      const hit = this.raycaster.intersectObjects(this.pickables, false)[0];
      if (!hit) {
        drag = { kind: 'orbit', id: e.pointerId, last: at };
        return;
      }
      const ud = hit.object.userData as { pos: Vec3; n?: Vec3 };
      let n: Vec3;
      if (ud.n) n = [...ud.n] as Vec3;
      else {
        // hit the plastic body: its face normal is already in cube space (cubies aren't rotated)
        const fn = hit.face!.normal;
        n = [Math.round(fn.x), Math.round(fn.y), Math.round(fn.z)] as Vec3;
      }
      if (this.animating || this.preview) return;
      drag = { kind: 'turn', id: e.pointerId, start: at, pos: ud.pos, n, local: this.cube.worldToLocal(hit.point.clone()), world: hit.point.clone(), used: false };
      this.setHighlight([this.cubies.get(key(ud.pos))!]); // show what was grabbed
    });

    el.addEventListener('pointermove', (e) => {
      if (!drag || drag.id !== e.pointerId) return;
      const at = new THREE.Vector2(e.clientX, e.clientY);
      if (drag.kind === 'orbit') {
        const d = at.clone().sub(drag.last);
        drag.last = at;
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(d.y * 0.009, d.x * 0.009, 0, 'XYZ'));
        this.cube.quaternion.premultiply(q);
        return;
      }
      const delta = at.clone().sub(drag.start);
      if (this.preview) {
        // the grabbed layer follows the finger
        this.setPreviewAngle(clampN(delta.dot(this.preview.sdir) / FULL_TURN_PX, -1, 1) * (Math.PI / 2));
        return;
      }
      if (drag.used || this.animating) return;
      if (delta.length() < DRAG_THRESHOLD) return;
      const choice = this.moveFromDrag(drag.pos, drag.n, drag.local, drag.world, delta);
      if (choice) this.startPreview(choice.axis, choice.layer, choice.sdir);
      else if (delta.length() > 60) drag.used = true; // never became clear: give up on this drag
    });

    const end = (e: PointerEvent) => {
      if (!drag || drag.id !== e.pointerId) return;
      drag = null;
      this.setHighlight(null);
      if (this.preview) this.releasePreview();
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  /**
   * Turn a screen-space drag on a face into a layer turn. The two candidate turns are around the axes
   * lying in the grabbed face; for each, we project the grabbed point's actual velocity (axis × p) to the
   * screen and pick the turn whose on-screen motion best matches the drag, in the matching direction.
   * (Using the face tangent instead is wrong near edges, where the point also moves out of the face.)
   */
  private moveFromDrag(pos: Vec3, nArr: Vec3, local: THREE.Vector3, world: THREE.Vector3, drag: THREE.Vector2): { axis: Axis; layer: -1 | 0 | 1; sdir: THREE.Vector2 } | null {
    const p0 = this.toScreen(world);
    const dragDir = drag.clone().normalize();
    let best: { k: number; score: number; s: THREE.Vector2 } | null = null;
    for (let k = 0; k < 3; k++) {
      if (nArr[k] !== 0) continue; // can't turn around the face's own normal by dragging on it
      const axis = new THREE.Vector3(k === 0 ? 1 : 0, k === 1 ? 1 : 0, k === 2 ? 1 : 0);
      const vel = new THREE.Vector3().crossVectors(axis, local); // cube space, for a +turn
      if (vel.lengthSq() < 1e-6) continue;
      const velWorld = vel.normalize().applyQuaternion(this.cube.quaternion);
      const s = this.toScreen(world.clone().addScaledVector(velWorld, 0.05)).sub(p0);
      if (s.lengthSq() < 1e-8) continue;
      s.normalize();
      const dot = s.dot(dragDir);
      if (!best || Math.abs(dot) > best.score) best = { k, score: Math.abs(dot), s };
    }
    // Ambiguous (diagonal drag, or a face seen almost edge-on): wait for a clearer drag.
    if (!best || best.score < 0.4) return null;
    // the layer is the grabbed cubie's coordinate along the turn axis; sdir = on-screen direction of a +turn
    return { axis: AXES[best.k], layer: pos[best.k] as -1 | 0 | 1, sdir: best.s };
  }

  // ---- live preview: the grabbed layer is highlighted and turns with the finger, snaps on release
  preview: { axis: Axis; layer: -1 | 0 | 1; sdir: THREE.Vector2; pivot: THREE.Group; angle: number } | null = null;
  private highlighted: THREE.Group[] = [];

  setHighlight(groups: THREE.Group[] | null) {
    for (const g of this.highlighted) (g.children[0] as THREE.Mesh).material = this.bodyMat;
    this.highlighted = groups?.filter(Boolean) ?? [];
    for (const g of this.highlighted) (g.children[0] as THREE.Mesh).material = this.highlightMat;
  }

  private startPreview(axis: Axis, layer: -1 | 0 | 1, sdir: THREE.Vector2) {
    const k = AXES.indexOf(axis);
    const pivot = new THREE.Group();
    this.cube.add(pivot);
    const moving: THREE.Group[] = [];
    for (const [k2, g] of this.cubies) {
      if (Number(k2.split(',')[k]) === layer) {
        pivot.attach(g);
        moving.push(g);
      }
    }
    this.setHighlight(moving);
    this.preview = { axis, layer, sdir, pivot, angle: 0 };
  }

  private setPreviewAngle(angle: number) {
    const p = this.preview!;
    p.angle = angle;
    const k = AXES.indexOf(p.axis);
    p.pivot.quaternion.setFromAxisAngle(new THREE.Vector3(k === 0 ? 1 : 0, k === 1 ? 1 : 0, k === 2 ? 1 : 0), angle);
  }

  /** Finish the turn if it went far enough (a third of the way), otherwise spring back. */
  private releasePreview() {
    const p = this.preview!;
    const frac = p.angle / (Math.PI / 2);
    const dir: 1 | -1 | 0 = Math.abs(frac) >= 0.3 ? (frac > 0 ? 1 : -1) : 0;
    const from = p.angle;
    const to = (dir * Math.PI) / 2;
    this.animating = true;
    const t0 = performance.now();
    const dur = Math.max(60, TURN_MS * Math.abs(to - from) / (Math.PI / 2));
    const step = () => {
      const t = Math.min(1, (performance.now() - t0) / dur);
      this.setPreviewAngle(from + (to - from) * (1 - Math.pow(1 - t, 3)));
      if (t < 1) return void requestAnimationFrame(step);
      this.cube.remove(p.pivot);
      this.preview = null;
      this.highlighted = [];
      if (dir !== 0) {
        const m: CubeMove = { axis: p.axis, layer: p.layer, dir };
        this.onMove(m);
        this.stickers = applyMove(this.stickers, m);
      }
      this.rebuild();
      this.animating = false;
    };
    requestAnimationFrame(step);
  }

  /** Animate a layer turn, then commit it to the logical state. */
  turn(m: CubeMove, fromUser: boolean) {
    if (this.animating) return;
    this.animating = true;
    if (fromUser) {
      play('cubeTurn');
      this.onMove(m);
    }
    const k = AXES.indexOf(m.axis);
    const pivot = new THREE.Group();
    this.cube.add(pivot);
    for (const [k2, g] of this.cubies) {
      const p = k2.split(',').map(Number);
      if (p[k] === m.layer) pivot.attach(g);
    }
    const axisVec = new THREE.Vector3(k === 0 ? 1 : 0, k === 1 ? 1 : 0, k === 2 ? 1 : 0);
    const target = (m.dir * Math.PI) / 2;
    const t0 = performance.now();
    const step = () => {
      const t = Math.min(1, (performance.now() - t0) / TURN_MS);
      const eased = 1 - Math.pow(1 - t, 3);
      pivot.quaternion.setFromAxisAngle(axisVec, target * eased);
      if (t < 1) requestAnimationFrame(step);
      else {
        this.cube.remove(pivot);
        this.stickers = applyMove(this.stickers, m);
        this.rebuild();
        this.animating = false;
      }
    };
    requestAnimationFrame(step);
  }

  dispose() {
    this.ro.disconnect();
    this.renderer.setAnimationLoop(null);
    this.renderer.dispose();
    this.bodyGeo.dispose();
    this.bodyMat.dispose();
    this.highlightMat.dispose();
    this.stickerGeo.dispose();
    this.stickerMats.forEach((m) => m.dispose());
    this.renderer.domElement.remove();
  }
}

/** Mini 3×3 picture of the goal: a full face, or a cross (centre + edges). */
function GoalIcon({ goal }: { goal: CubeGoal }) {
  return (
    <span className="grid h-9 w-9 shrink-0 grid-cols-3 gap-[2px] rounded-md bg-slate p-[3px]">
      {Array.from({ length: 9 }, (_, i) => {
        const on = goal.kind === 'face' || i % 2 === 1 || i === 4;
        return <span key={i} className="rounded-[2px]" style={{ background: on ? CSS_COLORS[goal.color] : '#6b6784' }} />;
      })}
    </span>
  );
}

export function CubeRound({ item, feedback, onAnswer }: ModeProps<CubeItemData>) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<CubeView | null>(null);
  const [progress, setProgress] = useState(item?.data.progress ?? 0);
  const [moves, setMoves] = useState(item?.data.moves ?? 0);
  const [done, setDone] = useState(false);
  const onAnswerRef = useRef(onAnswer);
  onAnswerRef.current = onAnswer;

  // Build the 3D cube once per round (and again on reconnect with the current state).
  useEffect(() => {
    if (!item || !hostRef.current) return;
    const view = new CubeView(hostRef.current, item.data.stickers, (m) => {
      setMoves((n) => n + 1);
      onAnswerRef.current(m);
    });
    viewRef.current = view;
    if (import.meta.env.DEV) (window as any).__cube = { view, progress: () => goalProgress(view.stickers, item.data.goal) };
    setProgress(item.data.progress);
    setMoves(item.data.moves ?? 0);
    setDone(item.data.progress >= item.data.maxProgress);
    return () => {
      view.dispose();
      viewRef.current = null;
    };
  }, [item?.round, item?.item, item?.data]);

  // Server verdicts: progress and the finish.
  useEffect(() => {
    if (!feedback || !item || feedback.round !== item.round) return;
    if (typeof feedback.progress === 'number') setProgress(feedback.progress);
    if (feedback.solved) {
      setDone(true);
      play('correct');
    }
  }, [feedback?.seq]);

  if (!item) return <div className="m-auto text-muted">…</div>;
  const { goal, colorName, maxProgress } = item.data;
  const what = goal.kind === 'face' ? `a full ${colorName} face` : `a ${colorName} cross`;

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-3 flex items-center gap-3">
        <GoalIcon goal={goal} />
        <div className="min-w-0 flex-1">
          <div className="font-display text-base font-bold leading-tight">Make {what}</div>
          <div className="text-xs text-muted">{goal.kind === 'face' ? 'All 9 squares of one side' : 'Centre and the 4 edge squares of one side'}</div>
        </div>
        <span className="font-display text-lg font-bold tabular-nums">{done ? maxProgress : progress}/{maxProgress}</span>
      </div>
      <Progress value={(done ? maxProgress : progress) / maxProgress} />

      <div className="card relative mt-3 min-h-[280px] flex-1 overflow-hidden rounded-2xl">
        <div ref={hostRef} className="absolute inset-0" />
        {done && (
          <div className="pointer-events-none absolute inset-x-0 top-6 text-center animate-pop">
            <div className="text-3xl font-bold tracking-tight text-teal">Done</div>
            <div className="mt-1 text-sm text-muted">in {moves} moves · waiting for your opponent…</div>
          </div>
        )}
      </div>

      <p className="mt-2 text-center text-xs text-muted">
        Hold a square and drag: the row lights up and turns with you · drag outside the cube to spin it
      </p>
    </div>
  );
}
