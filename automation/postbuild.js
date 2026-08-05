import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const indexPath = path.join(distDir, 'index.html');
const target404 = path.join(distDir, '404.html');
const noJekyll = path.join(distDir, '.nojekyll');

if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, target404);
  fs.writeFileSync(noJekyll, '# disable jekyll');
  console.log('✅ Created dist/404.html and dist/.nojekyll');
}
