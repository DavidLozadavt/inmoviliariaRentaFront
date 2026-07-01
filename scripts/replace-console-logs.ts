/**
 * scripts/replace-console-logs.ts
 *
 * Run with: npx tsx scripts/replace-console-logs.ts
 *
 * Replaces all console.log / console.error / console.warn calls in src/
 * with the conditional `logger` utility, and adds the import if missing.
 *
 * Summary of what it does:
 *  1. Scans all .ts and .vue files in src/
 *  2. If a file contains console.log|warn|error and is NOT a test file or logger.ts:
 *     - Replaces `console.log(` → `logger.log(`
 *     - Replaces `console.error(` → `logger.error(`
 *     - Replaces `console.warn(` → `logger.warn(`
 *     - Adds `import logger from '@/utils/logger';` if not already present
 *  3. Writes the updated file back
 *
 * This script is idempotent: running it multiple times won't break anything.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC_DIR = join(__dirname, '..', 'src');

const SKIP_PATTERNS = [
    'tests', 'test', '__tests__', 'logger.ts', 'setup.ts',
];

function walk(dir: string): string[] {
    const files: string[] = [];
    for (const entry of readdirSync(dir)) {
        const fullPath = join(dir, entry);
        if (SKIP_PATTERNS.some(p => entry.includes(p))) continue;
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
            files.push(...walk(fullPath));
        } else if (['.ts', '.vue'].includes(extname(entry))) {
            files.push(fullPath);
        }
    }
    return files;
}

function processFile(filePath: string): boolean {
    let content = readFileSync(filePath, 'utf-8');

    // Skip if no console calls
    if (!/console\.(log|error|warn)\s*\(/.test(content)) return false;

    // Replace console calls
    let modified = content
        .replace(/console\.log\s*\(/g, 'logger.log(')
        .replace(/console\.error\s*\(/g, 'logger.error(')
        .replace(/console\.warn\s*\(/g, 'logger.warn(');

    // Add import if not already present
    if (!modified.includes("import logger") && !modified.includes("from '@/utils/logger'")) {
        // For .vue files, add inside <script> block
        if (filePath.endsWith('.vue')) {
            // Try to add after the first import
            const scriptMatch = modified.match(/(<script[^>]*>[\s\S]*?)(import\s)/);
            if (scriptMatch) {
                const insertPoint = modified.indexOf(scriptMatch[2], modified.indexOf(scriptMatch[1]));
                modified =
                    modified.slice(0, insertPoint) +
                    "import logger from '@/utils/logger';\n" +
                    modified.slice(insertPoint);
            }
        } else {
            // For .ts files, add at the top (after any existing imports)
            const lastImportIndex = modified.lastIndexOf('\nimport ');
            if (lastImportIndex !== -1) {
                const lineEnd = modified.indexOf('\n', lastImportIndex + 1);
                modified =
                    modified.slice(0, lineEnd + 1) +
                    "import logger from '@/utils/logger';\n" +
                    modified.slice(lineEnd + 1);
            } else {
                modified = "import logger from '@/utils/logger';\n" + modified;
            }
        }
    }

    if (modified !== content) {
        writeFileSync(filePath, modified, 'utf-8');
        console.log(`✅ ${relative(SRC_DIR, filePath)}`);
        return true;
    }

    return false;
}

// Main
const files = walk(SRC_DIR);
let count = 0;

for (const file of files) {
    if (processFile(file)) count++;
}

console.log(`\nDone! ${count} files updated.`);
