import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { mkdtempSync, mkdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { optimizeImages } from '../scripts/optimize-uploads.mjs';

describe('optimizeImages', () => {
  it('shrinks large phone photos to max 1600px wide and leaves small ones alone', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'uploads-'));
    mkdirSync(join(dir, 'sub'));
    await sharp({ create: { width: 4000, height: 3000, channels: 3, background: '#c00' } }).jpeg({ quality: 95 }).toFile(join(dir, 'sub', 'Handy Foto.JPG'));
    await sharp({ create: { width: 800, height: 600, channels: 3, background: '#0c0' } }).png().toFile(join(dir, 'klein.png'));
    const before = statSync(join(dir, 'klein.png')).mtimeMs;
    const n = await optimizeImages(dir);
    expect(n).toBe(1);
    expect((await sharp(join(dir, 'sub', 'Handy Foto.JPG')).metadata()).width).toBe(1600);
    expect(statSync(join(dir, 'klein.png')).mtimeMs).toBe(before);
  });
  it('does nothing for a missing folder', async () => {
    expect(await optimizeImages('/gibt/es/nicht')).toBe(0);
  });
});
