import { config } from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const backendRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
config({ path: join(backendRoot, '.env') });
