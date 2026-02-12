import { readLegacyFile } from './legacyFiles';
import BodyClass from './BodyClass';
import LegacyInlineScripts from './LegacyInlineScripts';

interface LegacyMainContentProps {
  fileName: string;
}

const extractMain = (html: string) => {
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  return mainMatch ? mainMatch[1] : '';
};

const extractBodyClass = (html: string) => {
  const classMatch = html.match(/<body[^>]*class=["']([^"']+)["']/i);
  return classMatch ? classMatch[1] : '';
};

const rewriteLinks = (html: string) => {
  return html.replace(/href=(['"])([^'"]+?)\.html(#[^'"]+)?\1/gi, (_match, quote, name, hash) => {
    const path = name === 'index' ? '/' : `/${name}`;
    const suffix = hash || '';
    return `href=${quote}${path}${suffix}${quote}`;
  });
};

/**
 * Extract inline <script> blocks from HTML content.
 * Returns [htmlWithoutScripts, scriptContents[]]
 */
const extractInlineScripts = (html: string): [string, string[]] => {
  const scripts: string[] = [];
  const cleaned = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (_match, code: string) => {
    const trimmed = code.trim();
    if (trimmed) scripts.push(trimmed);
    return '';
  });
  return [cleaned, scripts];
};

/**
 * Extracts only the <main> content from a legacy HTML file.
 * Used with the (public) layout which already provides Header, Footer, BubbleField, CartDrawer.
 * Inline <script> tags are extracted and executed client-side via LegacyInlineScripts.
 */
export default function LegacyMainContent({ fileName }: LegacyMainContentProps) {
  const html = readLegacyFile(fileName);
  const bodyClass = extractBodyClass(html);
  const rawMain = rewriteLinks(extractMain(html));
  const [mainContent, inlineScripts] = extractInlineScripts(rawMain);

  return (
    <>
      <BodyClass className={bodyClass} />
      <div dangerouslySetInnerHTML={{ __html: mainContent }} />
      {inlineScripts.length > 0 && <LegacyInlineScripts scripts={inlineScripts} />}
    </>
  );
}
