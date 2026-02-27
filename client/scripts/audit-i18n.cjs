#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const SRC_DIR = path.resolve(__dirname, '..', 'src');
const FR_FILE = path.resolve(SRC_DIR, 'locales', 'fr', 'translation.json');
const DE_FILE = path.resolve(SRC_DIR, 'locales', 'de', 'translation.json');
const OUT_FILE = path.resolve(__dirname, '..', '..', 'Docs', 'i18n_audit_report.md');

const EXCLUDE_DIRS = new Set([
  'assets',
  'styles',
  'locales',
  'services',
  'supabase',
  'context',
  'config',
  'utils',
]);

const UI_EXT = new Set(['.js', '.jsx', '.ts', '.tsx']);
const LETTER_RE = /\p{L}/u;

function walk(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      out.push(...walk(full));
      continue;
    }
    if (UI_EXT.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function looksLikeUserText(text) {
  if (!text) return false;
  if (!LETTER_RE.test(text)) return false;
  if (/^[A-Z0-9_\-./:]+$/.test(text)) return false;
  if (/^https?:\/\//i.test(text)) return false;
  return true;
}

function hasPath(obj, dottedPath) {
  const parts = dottedPath.split('.');
  let cur = obj;
  for (const part of parts) {
    if (cur == null) return false;
    if (Array.isArray(cur)) {
      if (!/^\d+$/.test(part)) return false;
      cur = cur[Number(part)];
      continue;
    }
    if (!(part in cur)) return false;
    cur = cur[part];
  }
  return true;
}

function isWithinTCall(pathNode) {
  let current = pathNode;
  while (current && current.parentPath) {
    const parent = current.parentPath;
    if (parent.isCallExpression()) {
      const callee = parent.node.callee;
      if (callee && callee.type === 'Identifier' && callee.name === 't') {
        return true;
      }
      if (
        callee &&
        callee.type === 'MemberExpression' &&
        callee.property &&
        callee.property.type === 'Identifier' &&
        callee.property.name === 't'
      ) {
        return true;
      }
    }
    current = parent;
  }
  return false;
}

function rel(filePath) {
  return path.relative(path.resolve(__dirname, '..', '..'), filePath).replace(/\\/g, '/');
}

const files = walk(SRC_DIR);
const hardcoded = [];
const tKeys = new Map();

for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });
  } catch (err) {
    hardcoded.push({
      file: rel(file),
      line: 1,
      kind: 'parse-error',
      text: `Unable to parse file: ${err.message}`,
    });
    continue;
  }

  traverse(ast, {
    JSXText(p) {
      const text = cleanText(p.node.value);
      if (!looksLikeUserText(text)) return;
      if (isWithinTCall(p)) return;
      hardcoded.push({ file: rel(file), line: p.node.loc?.start?.line || 1, kind: 'jsx-text', text });
    },

    JSXAttribute(p) {
      const attrName = p.node.name && p.node.name.name;
      if (!['placeholder', 'title', 'aria-label', 'alt', 'label'].includes(attrName)) return;
      const valueNode = p.node.value;
      if (!valueNode) return;
      if (valueNode.type === 'StringLiteral') {
        const text = cleanText(valueNode.value);
        if (!looksLikeUserText(text)) return;
        hardcoded.push({
          file: rel(file),
          line: valueNode.loc?.start?.line || p.node.loc?.start?.line || 1,
          kind: `jsx-attr:${attrName}`,
          text,
        });
      }
    },

    CallExpression(p) {
      const callee = p.node.callee;

      // Collect i18n key usage
      const isTCall =
        (callee.type === 'Identifier' && callee.name === 't') ||
        (callee.type === 'MemberExpression' &&
          callee.property &&
          callee.property.type === 'Identifier' &&
          callee.property.name === 't');

      if (isTCall && p.node.arguments[0] && p.node.arguments[0].type === 'StringLiteral') {
        const key = p.node.arguments[0].value;
        if (key) {
          const bucket = tKeys.get(key) || [];
          bucket.push({ file: rel(file), line: p.node.loc?.start?.line || 1 });
          tKeys.set(key, bucket);
        }
      }

      // confirm('...'), alert('...')
      if (callee.type === 'Identifier' && ['confirm', 'alert'].includes(callee.name)) {
        const first = p.node.arguments[0];
        if (first && first.type === 'StringLiteral') {
          const text = cleanText(first.value);
          if (looksLikeUserText(text)) {
            hardcoded.push({
              file: rel(file),
              line: first.loc?.start?.line || p.node.loc?.start?.line || 1,
              kind: `call:${callee.name}`,
              text,
            });
          }
        }
      }

      // setError('...') / pushToast({message: '...'})
      if (callee.type === 'Identifier' && ['setError', 'setErrorMsg'].includes(callee.name)) {
        const first = p.node.arguments[0];
        if (first && first.type === 'StringLiteral') {
          const text = cleanText(first.value);
          if (looksLikeUserText(text) && !isWithinTCall(p)) {
            hardcoded.push({
              file: rel(file),
              line: first.loc?.start?.line || p.node.loc?.start?.line || 1,
              kind: `call:${callee.name}`,
              text,
            });
          }
        }
      }

      if (callee.type === 'Identifier' && callee.name === 'pushToast') {
        const first = p.node.arguments[0];
        if (first && first.type === 'ObjectExpression') {
          const msgProp = first.properties.find(
            prop =>
              prop.type === 'ObjectProperty' &&
              prop.key &&
              prop.key.type === 'Identifier' &&
              prop.key.name === 'message'
          );
          if (msgProp && msgProp.value && msgProp.value.type === 'StringLiteral') {
            const text = cleanText(msgProp.value.value);
            if (looksLikeUserText(text)) {
              hardcoded.push({
                file: rel(file),
                line: msgProp.value.loc?.start?.line || p.node.loc?.start?.line || 1,
                kind: 'call:pushToast.message',
                text,
              });
            }
          }
        }
      }
    },
  });
}

const fr = JSON.parse(fs.readFileSync(FR_FILE, 'utf8'));
const de = JSON.parse(fs.readFileSync(DE_FILE, 'utf8'));

const missing = [];
for (const [key, refs] of [...tKeys.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  const inFr = hasPath(fr, key);
  const inDe = hasPath(de, key);
  if (!inFr || !inDe) {
    missing.push({ key, inFr, inDe, refs });
  }
}

hardcoded.sort((a, b) => {
  if (a.file !== b.file) return a.file.localeCompare(b.file);
  if (a.line !== b.line) return a.line - b.line;
  return a.text.localeCompare(b.text);
});

const lines = [];
lines.push('# i18n Audit Report');
lines.push('');
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push('');
lines.push('## Summary');
lines.push(`- Scanned files: ${files.length}`);
lines.push(`- Suspected hardcoded UI strings: ${hardcoded.length}`);
lines.push(`- Missing translation keys (FR and/or DE): ${missing.length}`);
lines.push('');

lines.push('## Missing Translation Keys');
if (missing.length === 0) {
  lines.push('- None.');
} else {
  for (const entry of missing) {
    const status = `FR:${entry.inFr ? 'ok' : 'missing'} | DE:${entry.inDe ? 'ok' : 'missing'}`;
    const refs = entry.refs.slice(0, 3).map(r => `${r.file}:${r.line}`).join(', ');
    lines.push(`- \`${entry.key}\` -> ${status}; refs: ${refs}`);
  }
}
lines.push('');

lines.push('## Hardcoded UI Strings');
if (hardcoded.length === 0) {
  lines.push('- None.');
} else {
  let currentFile = '';
  for (const entry of hardcoded) {
    if (entry.file !== currentFile) {
      currentFile = entry.file;
      lines.push(`### ${currentFile}`);
    }
    lines.push(`- L${entry.line} [${entry.kind}]: ${entry.text}`);
  }
}
lines.push('');

fs.writeFileSync(OUT_FILE, `${lines.join('\n')}\n`, 'utf8');
console.log(`Report written to ${OUT_FILE}`);
console.log(`Suspected hardcoded strings: ${hardcoded.length}`);
console.log(`Missing i18n keys: ${missing.length}`);
