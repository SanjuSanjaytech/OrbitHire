import { generateFaviconFiles, generateFaviconHtml } from '@realfavicongenerator/generate-favicon';
import { getNodeImageAdapter, loadAndConvertToSvg } from '@realfavicongenerator/image-adapter-node';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const imageAdapter = await getNodeImageAdapter();

const masterIcon = {
  icon: await loadAndConvertToSvg(join(__dirname, 'orbithire-favicon.svg')),
};

const faviconSettings = {
  icon: {
    desktop: {
      regularIconTransformation: { type: 'background', backgroundColor: '#0f0f1a', radius: 20 },
      darkIconType: 'none',
    },
    touch: {
      transformation: { type: 'background', backgroundColor: '#0f0f1a' },
      appTitle: 'OrbitHire',
    },
    webAppManifest: {
      transformation: { type: 'background', backgroundColor: '#0f0f1a' },
      backgroundColor: '#0f0f1a',
      themeColor: '#0f0f1a',
      name: 'OrbitHire',
      shortName: 'OrbitHire',
    },
  },
  path: '/',
  skipMetadataInjection: false,
};

// Generate all favicon files
const files = await generateFaviconFiles(masterIcon, faviconSettings, imageAdapter);

// Save to /public
const publicDir = join(__dirname, '..', 'public');
mkdirSync(publicDir, { recursive: true });

for (const [filename, content] of Object.entries(files)) {
  const filePath = join(publicDir, filename);
  writeFileSync(filePath, content);
  console.log(`✅ Created: public/${filename}`);
}

// Print the HTML tags (optional — Next.js metadata handles this)
const html = await generateFaviconHtml(faviconSettings);
console.log('\n📋 HTML tags (for reference — already handled by layout.tsx):\n');
if (Array.isArray(html)) {
  console.log(html.join('\n'));
} else {
  console.log(html);
}
console.log('\n🎉 Done! All favicon files saved to /public/');
