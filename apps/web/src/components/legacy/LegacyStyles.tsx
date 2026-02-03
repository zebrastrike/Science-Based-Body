import { readLegacyFile } from './legacyFiles';

export default function LegacyStyles() {
  const css = readLegacyFile('styles.css');

  return (
    <style
      id="legacy-styles"
      dangerouslySetInnerHTML={{ __html: css }}
    />
  );
}
