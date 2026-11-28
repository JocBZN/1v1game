/**
 * "Photo year": a photo is shown, players guess the year it was taken.
 * Data (server/data/photos.json) comes from Wikimedia Commons files whose date was set by the holding
 * institution (museum, national archive, library) or recorded by the photographer, and whose year
 * agrees in two independent fields of the file record (date + description/category/archive year).
 * Undated, "circa", ranged or re-photographed items were left out. Only free files (public domain,
 * CC0, CC BY, CC BY-SA); the credit and source link are shown with the answer.
 */
import fs from 'node:fs';
import { dataFile } from '../paths';
import { imagePath, onImageLookup } from '../images';
import type { EstimateQ } from './estimate';

interface PhotoRow {
  /** year taken */
  y: number;
  /** thumbnail URL on upload.wikimedia.org */
  img: string;
  /** what the photo shows (revealed with the answer) */
  t: string;
  /** credit line: author or collection · licence */
  c: string;
  /** Commons file page */
  u: string;
}

let cache: EstimateQ[] | null = null;
export function photoQuestions(): EstimateQ[] {
  if (cache) return cache;
  const rows = JSON.parse(fs.readFileSync(dataFile('photos.json'), 'utf8')).photos as PhotoRow[];
  cache = rows.map((r) => ({ q: 'When was this photo taken?', answer: r.y, note: r.t, img: imagePath(r.img), credit: { text: r.c, url: r.u } }));
  return cache;
}
onImageLookup(photoQuestions);
