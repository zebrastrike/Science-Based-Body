import BodyClass from './BodyClass';
import LegacyScripts from './LegacyScripts';
import LegacyStyles from './LegacyStyles';
import { readLegacyFile } from './legacyFiles';

interface LegacyPageProps {
  fileName: string;
}

const extractBody = (html: string) => {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch ? bodyMatch[1] : html;
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

const stripLegacyScripts = (html: string) => {
  return html.replace(/<script[^>]*src=["']scripts\.js["'][^>]*><\/script>/gi, '');
};

export default function LegacyPage({ fileName }: LegacyPageProps) {
  const html = readLegacyFile(fileName);
  const bodyClass = extractBodyClass(html);
  const bodyContent = stripLegacyScripts(rewriteLinks(extractBody(html)));

  return (
    <>
      <LegacyStyles />
      <BodyClass className={bodyClass} />
      <LegacyScripts />
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </>
  );
}
