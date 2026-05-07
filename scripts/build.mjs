import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const outDir = 'dist';
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

mkdirSync(outDir, { recursive: true });

for (const file of ['index.html', 'app.js', 'styles.css']) {
  copyFileSync(file, join(outDir, file));
}

writeFileSync(
  join(outDir, 'config.js'),
  `window.STORE_SUPABASE = ${JSON.stringify(
    {
      url: supabaseUrl,
      anonKey: supabaseAnonKey
    },
    null,
    2
  )};\n`
);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.');
}
