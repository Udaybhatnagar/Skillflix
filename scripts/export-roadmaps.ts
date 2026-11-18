import {writeFileSync} from 'node:fs';
import {roadmaps} from '../apps/web/src/data/roadmaps';
writeFileSync(new URL('../apps/api/src/db/roadmaps.json', import.meta.url),JSON.stringify(roadmaps,null,2));
