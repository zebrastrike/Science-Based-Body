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

  return (
    <>
      <BodyClass className={bodyClass} />
      <LegacyContentRunner html={mainContent} />
    </>
  );
}
