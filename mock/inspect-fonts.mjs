// Read-only inspection of explicitly supplied local OpenType/TTC files.
// This checks table presence, not whether a browser selected this font for a glyph.
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { createHash } from 'node:crypto';

if (process.argv.length < 3) throw new Error('Usage: node mock/inspect-fonts.mjs FONT.ttf [FONT.ttc ...]');
const results = process.argv.slice(2).map(path => {
  const data = readFileSync(path);
  const u16 = offset => data.readUInt16BE(offset);
  const u32 = offset => data.readUInt32BE(offset);
  const tag = offset => data.toString('ascii', offset, offset + 4);
  const offsets = tag(0) === 'ttcf'
    ? Array.from({ length: u32(8) }, (_, i) => u32(12 + i * 4)) : [0];
  const faces = offsets.map(offset => {
    const tables = new Map(Array.from({ length: u16(offset + 4) }, (_, i) => {
      const record = offset + 12 + i * 16;
      return [tag(record), u32(record + 8)];
    }));
    const nameOffset = tables.get('name');
    const names = new Map();
    if (nameOffset !== undefined) {
      const storage = nameOffset + u16(nameOffset + 4);
      for (let i = 0; i < u16(nameOffset + 2); i++) {
        const record = nameOffset + 6 + i * 12;
        const platform = u16(record), language = u16(record + 4), id = u16(record + 6);
        if (![1, 2, 5, 6, 16, 17].includes(id) || ![0, 1, 3].includes(platform)) continue;
        if (platform === 3 && language !== 0x409) continue;
        if (platform === 1 && (u16(record + 2) !== 0 || language !== 0 || names.has(id))) continue;
        const start = storage + u16(record + 10);
        names.set(id, new TextDecoder(platform === 1 ? 'macintosh' : 'utf-16be').decode(data.subarray(start, start + u16(record + 8))));
      }
    }
    const features = {};
    for (const name of ['GPOS', 'GSUB']) {
      const start = tables.get(name);
      if (start === undefined) { features[name] = []; continue; }
      const list = start + u16(start + 6);
      features[name] = [...new Set(Array.from({ length: u16(list) }, (_, i) => tag(list + 2 + i * 6)))];
    }
    // Nominal, unshaped advances: no kerning, substitutions or variable-axis overrides.
    const cmap = tables.get('cmap');
    const subtables = cmap === undefined ? [] : Array.from({ length: u16(cmap + 2) }, (_, i) => {
      const record = cmap + 4 + i * 8;
      return { platform: u16(record), encoding: u16(record + 2), start: cmap + u32(record + 4) };
    }).filter(({ platform, encoding, start }) => (platform === 0 || platform === 3 && [1, 10].includes(encoding)) && [4, 12].includes(u16(start)))
      .sort((a, b) => u16(b.start) - u16(a.start));
    const glyph = cp => {
      for (const { start } of subtables) {
        if (u16(start) === 12) {
          for (let i = 0; i < u32(start + 12); i++) {
            const group = start + 16 + i * 12;
            if (cp >= u32(group) && cp <= u32(group + 4)) return u32(group + 8) + cp - u32(group);
          }
        } else if (cp <= 0xffff) {
          const count = u16(start + 6) / 2, ends = start + 14, starts = ends + count * 2 + 2;
          const deltas = starts + count * 2, ranges = deltas + count * 2;
          for (let i = 0; i < count; i++) {
            if (cp < u16(starts + i * 2) || cp > u16(ends + i * 2)) continue;
            const delta = u16(deltas + i * 2), range = u16(ranges + i * 2);
            if (!range) return (cp + delta) & 0xffff;
            const value = u16(ranges + i * 2 + range + (cp - u16(starts + i * 2)) * 2);
            return value ? (value + delta) & 0xffff : 0;
          }
        }
      }
      return 0;
    };
    const unitsPerEm = u16(tables.get('head') + 18);
    const metricCount = u16(tables.get('hhea') + 34);
    const advances = Object.fromEntries([...new Set(' iMW0日あカ「、ｱ')].map(char => {
      const id = glyph(char.codePointAt(0));
      return [char, id ? u16(tables.get('hmtx') + Math.min(id, metricCount - 1) * 4) / unitsPerEm : null];
    }));
    return { family: names.get(16) || names.get(1), style: names.get(17) || names.get(2), postScriptName: names.get(6), version: names.get(5),
      unitsPerEm, nominalAdvancesEm: advances,
      outlineTables: ['glyf', 'CFF ', 'CFF2'].filter(name => tables.has(name)),
      bitmapTables: ['EBDT', 'EBLC', 'EBSC', 'bdat', 'bloc', 'CBDT', 'CBLC', 'sbix'].filter(name => tables.has(name)),
      palt: features.GPOS.includes('palt'), features };
  });
  return { file: basename(path), sha256: createHash('sha256').update(data).digest('hex'), faces };
});
console.log(JSON.stringify(results, null, 2));
