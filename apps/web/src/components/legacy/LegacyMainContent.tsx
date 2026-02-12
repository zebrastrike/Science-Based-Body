import { readLegacyFile } from './legacyFiles';
import BodyClass from './BodyClass';
import LegacyContentRunner from './LegacyContentRunner';

interface LegacyMainContentProps {
  fileName: string;
}

const extractMain = (html: string) => {
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  return mainMatch ? mainMatch[1] : '';
};

/**
 * Extracts inline <script> blocks that live AFTER </main> in the body.
 * These are page-specific scripts (e.g. shop carousel builder) that aren't
 * inside <main> but need to run. Excludes external script tags (src=...).
 */
const extractPostMainScripts = (html: string) => {
  const mainEnd = html.search(/<\/main>/i);
  if (mainEnd === -1) return '';
  const afterMain = html.slice(mainEnd);
  const scripts: string[] = [];
  const re = /<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(afterMain)) !== null) {
    if (m[1].trim()) scripts.push(`<script>${m[1]}</script>`);
  }
  return scripts.join('\n');
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
 * Extracts only the <main> content from a legacy HTML file.
 * Used with the (public) layout which already provides Header, Footer, BubbleField, CartDrawer.
 * Inline <script> tags are kept in the HTML and executed client-side via LegacyContentRunner.
 */
export default function LegacyMainContent({ fileName }: LegacyMainContentProps) {
  const html = readLegacyFile(fileName);
  const bodyClass = extractBodyClass(html);
  const mainContent = rewriteLinks(extractMain(html));
  const postMainScripts = extractPostMainScripts(html);

  // Combine main content + any inline scripts that lived after </main>
  const fullContent = postMainScripts
    ? `${mainContent}\n${postMainScripts}`
    : mainContent;

  return (
    <>
      <BodyClass className={bodyClass} />
      <LegacyContentRunner html={fullContent} />
    </>
  );
}
