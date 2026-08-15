const fs = require('fs');
const path = require('path');

const root = __dirname;
const output = path.join(root, 'dist');
const mediaRoot = path.join(root, 'media');
const mediaTypes = new Map([
  ['.jpg', 'image/jpeg'], ['.jpeg', 'image/jpeg'], ['.png', 'image/png'],
  ['.webp', 'image/webp'], ['.gif', 'image/gif'], ['.mp4', 'video/mp4'],
  ['.mov', 'video/quicktime'], ['.webm', 'video/webm'], ['.m4v', 'video/mp4']
]);

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

for (const file of ['index.html', 'script.js', 'styles.css', 'atmosphere.css', 'interactions.css', 'published-content.json', 'CNAME']) {
  fs.copyFileSync(path.join(root, file), path.join(output, file));
}
for (const directory of ['assets', 'audio', 'media']) {
  fs.cpSync(path.join(root, directory), path.join(output, directory), { recursive: true });
}

const manifest = {};
for (const directory of fs.readdirSync(mediaRoot, { withFileTypes: true })) {
  const match = directory.isDirectory() && directory.name.match(/^page-(\d+)$/);
  if (!match) continue;
  const page = match[1];
  manifest[page] = fs.readdirSync(path.join(mediaRoot, directory.name), { withFileTypes: true })
    .filter(entry => entry.isFile() && mediaTypes.has(path.extname(entry.name).toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    .map(entry => ({
      name: entry.name,
      type: mediaTypes.get(path.extname(entry.name).toLowerCase()),
      url: `media/${directory.name}/${encodeURIComponent(entry.name)}`
    }));
}

fs.writeFileSync(path.join(output, 'media-manifest.json'), JSON.stringify(manifest));
fs.writeFileSync(path.join(output, '.nojekyll'), '');
console.log(`Built ${Object.values(manifest).flat().length} media files into dist.`);
