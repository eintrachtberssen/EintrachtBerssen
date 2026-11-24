import { describe, expect, it } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import SectionView from '../src/components/SectionView.astro';
import PostCard from '../src/components/PostCard.astro';
import ConsentEmbed from '../src/components/ConsentEmbed.astro';
import { findSection } from '../src/data/sections';
import { rehypeConsentEmbed, rehypeBase } from '../src/lib/rehype.mjs';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';

const render = async (C: any, props: Record<string, unknown>) => (await AstroContainer.create()).renderToString(C, { props });

describe('SectionView', () => {
  it('shows a friendly note and contacts when a section has neither text nor posts', async () => {
    const html = await render(SectionView, {
      section: findSection(['fitness-gymnastik'])!, path: ['fitness-gymnastik'], posts: [],
      contacts: [{ id: 'x', data: { group: 'Fitness/Gymnastik', name: 'Marianne Bröker', role: 'Rückensport Frauen' } }],
    });
    expect(html).toContain('noch keine Beiträge');
    expect(html).toContain('Marianne Bröker');
  });
});

describe('PostCard', () => {
  it('renders a post without image and without tags', async () => {
    const html = await render(PostCard, { post: { id: 'x', data: { title: 'Ohne Bild', date: new Date('2026-01-01'), tags: [], gallery: [] } } });
    expect(html).toContain('Ohne Bild');
    expect(html).toContain('1. Januar 2026');
  });
});

describe('ConsentEmbed', () => {
  it('renders no iframe before consent', async () => {
    const html = await render(ConsentEmbed, { kind: 'youtube', src: 'https://www.youtube.com/embed/abc', title: 'Video' });
    expect(html).not.toContain('<iframe');
    expect(html).toContain('Inhalt laden');
    expect(html).toContain('YouTube');
  });
});

describe('rehype plugins', () => {
  const run = (html: string, base = '/EintrachtBerssen/') =>
    String(unified().use(rehypeParse, { fragment: true }).use(rehypeConsentEmbed).use(rehypeBase, { base }).use(rehypeStringify).processSync(html));
  it('prefixes root-relative image and link paths with the base path', () => {
    const out = run('<p><img src="/images/a.jpg"><a href="/beitrag/x/">x</a><a href="https://e.de/">e</a></p>');
    expect(out).toContain('src="/EintrachtBerssen/images/a.jpg"');
    expect(out).toContain('href="/EintrachtBerssen/beitrag/x/"');
    expect(out).toContain('href="https://e.de/"');
  });
  it('does not double-prefix and leaves base "/" untouched', () => {
    expect(run('<img src="/EintrachtBerssen/images/a.jpg">')).toContain('src="/EintrachtBerssen/images/a.jpg"');
    expect(run('<img src="/images/a.jpg">', '/')).toContain('src="/images/a.jpg"');
  });
  it('turns consent-embed placeholders into a two-click box without iframe', () => {
    const out = run('<div class="consent-embed" data-kind="youtube" data-src="https://www.youtube.com/embed/abc"><a href="x">x</a></div>');
    expect(out).not.toContain('<iframe');
    expect(out).toContain('Inhalt laden');
    expect(out).toContain('data-consent-src="https://www.youtube.com/embed/abc"');
  });
});
