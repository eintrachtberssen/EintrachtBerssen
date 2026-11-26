import { describe, expect, it } from 'vitest';
import { belegungSchema, byDay, teamKind, clubKey, DAYS } from '../src/lib/belegung';

describe('belegungSchema', () => {
  it('drops incomplete or invalid entries instead of failing the build', () => {
    const d = belegungSchema.parse({
      platz: { entries: [
        { day: 'Montag', place: 'B-Platz', from: '17:30', to: '19:00', team: 'E-Junioren' },
        { day: 'Montag', place: 'B-Platz', from: '17.30', to: '19:00', team: 'Punkt statt Doppelpunkt' },
        { day: 'Funday', place: 'B-Platz', from: '17:00', to: '18:00', team: 'Falscher Tag' },
        { day: 'Dienstag', place: 'C-Platz', from: '18:00', to: '19:30', team: '' },
      ] },
      halle: null,
    });
    expect(d.platz.entries.map((e) => e.team)).toEqual(['E-Junioren', 'Punkt statt Doppelpunkt']);
    expect(d.platz.entries[1].from).toBe('17:30');
    expect(d.halle.entries).toEqual([]);
  });
  it('accepts one-digit hours like 9:00 and normalises them', () => {
    const d = belegungSchema.parse({ halle: { entries: [{ day: 'Samstag', from: '9:00', to: '10:00', team: 'Tischtennis', club: 'Eintracht Berssen' }] } });
    expect(d.halle.entries[0].from).toBe('09:00');
  });
});

describe('byDay', () => {
  it('groups by weekday in calendar order and sorts by start time', () => {
    const e = [
      { day: 'Dienstag', from: '19:00', to: '21:00', team: '1. Herren' },
      { day: 'Montag', from: '19:00', to: '21:00', team: '1. Damen' },
      { day: 'Montag', from: '17:00', to: '18:00', team: 'G-Junioren' },
    ];
    const g = byDay(e as any, DAYS.slice(0, 5));
    expect(g.map((x) => x.day)).toEqual(['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag']);
    expect(g[0].entries.map((x) => x.team)).toEqual(['G-Junioren', '1. Damen']);
    expect(g[2].entries).toEqual([]);
  });
});

describe('teamKind', () => {
  it('classifies youth teams and senior teams', () => {
    for (const t of ['E-Junioren', 'B-, C- und D-Juniorinnen', 'G-Junioren', 'D-Jugend', 'Minikicker']) expect(teamKind(t)).toBe('jugend');
    for (const t of ['1. Damen', '1. Herren', 'Alte Herren', '2. Herren']) expect(teamKind(t)).toBe('senioren');
  });
});

describe('clubKey', () => {
  it('maps club names to colour keys', () => {
    expect(clubKey('Eintr. Berssen')).toBe('berssen');
    expect(clubKey('Eintracht Berßen')).toBe('berssen');
    expect(clubKey('SV Stavern')).toBe('stavern');
    expect(clubKey('SV E.-Hüven')).toBe('hueven');
    expect(clubKey('SV Eisten/Hüven')).toBe('hueven');
    expect(clubKey('Schule')).toBe('other');
  });
});
