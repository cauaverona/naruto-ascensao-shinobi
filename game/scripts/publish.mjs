// Copia o build para a raiz do repositório (versão numerada) e para a pasta de deploy.
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
const built = new URL('../dist/index.html', import.meta.url);
copyFileSync(built, new URL(`../../naruto_ascensao_v${version}.html`, import.meta.url));
mkdirSync(new URL('../../deploy/', import.meta.url), { recursive: true });
copyFileSync(built, new URL('../../deploy/index.html', import.meta.url));
console.log(`Publicado: naruto_ascensao_v${version}.html e deploy/index.html`);
