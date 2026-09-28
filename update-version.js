#!/usr/bin/env node

/**
 * update-version.js
 *
 * Updates file versions in version.json, replaces ?v= query strings
 * across HTML files, auto-bumps the top-level SW version, and keeps
 * sw.js CACHE_NAME in sync.
 *
 * Usage:
 *   node update-version.js <file-key> <new-version>
 *   node update-version.js --all <new-version>
 *   node update-version.js --images-only
 *   node update-version.js --reset
 *
 * Examples:
 *   node update-version.js css/animations 1.0.1
 *   node update-version.js js/custom 2.0.0
 *   node update-version.js --all 2.0.0
 *   node update-version.js --images-only
 *   node update-version.js --reset
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const VERSION_FILE = path.join(ROOT, 'version.json');
const SW_FILE = path.join(ROOT, 'sw.js');

// ── Helpers ─────────────────────────────────────────────────────

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function incrementPatch(version) {
  const parts = version.split('.');
  if (parts.length !== 3 || parts.some(p => isNaN(parseInt(p, 10)))) return null;
  parts[2] = String(parseInt(parts[2], 10) + 1);
  return parts.join('.');
}

function readVersionJson() {
  return JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
}

function writeVersionJson(data) {
  fs.writeFileSync(VERSION_FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function updateSwCacheName(newVersion) {
  let swContent = fs.readFileSync(SW_FILE, 'utf8');
  const oldMatch = swContent.match(/let\s+CACHE_NAME\s*=\s*['"]([^'"]+)['"]/);
  if (!oldMatch) {
    console.error('Error: Could not find CACHE_NAME in sw.js');
    process.exit(1);
  }
  const oldCacheName = oldMatch[1];
  const newCacheName = 'aashirwad-v' + newVersion;
  if (oldCacheName === newCacheName) return oldCacheName;
  swContent = swContent.replace(
    /let\s+CACHE_NAME\s*=\s*['"][^'"]+['"]/,
    `let CACHE_NAME = '${newCacheName}'`
  );
  fs.writeFileSync(SW_FILE, swContent, 'utf8');
  return oldCacheName;
}

// ── Map version.json keys → actual on-disk paths ────────────────

const FILE_OVERRIDES = {
  'js/isotope': 'js/isotope.min.js',
  'js/isotope-page': 'js/isotope.js',
};

function getExtFromKey(key) {
  const dir = key.split('/')[0];
  if (dir === 'css') return 'css';
  if (dir === 'js') return 'js';
  return '';
}

function getAssetPath(key) {
  if (FILE_OVERRIDES[key]) return 'assets/' + FILE_OVERRIDES[key];
  return `assets/${key}.${getExtFromKey(key)}`;
}

function resolveKey(arg, files) {
  if (files[arg]) return arg;
  const stripped = arg.replace(/^assets\//, '');
  if (files[stripped]) return stripped;
  const basename = path.basename(stripped, path.extname(stripped));
  const ext = path.extname(stripped).replace('.', '');
  for (const key of Object.keys(files)) {
    const keyParts = key.split('/');
    const keyBasename = keyParts[keyParts.length - 1];
    const keyDir = keyParts.length > 1 ? keyParts[0] : '';
    if (keyBasename === basename && (ext === '' || keyDir === ext)) return key;
  }
  for (const key of Object.keys(files)) {
    if (key.split('/').pop() === basename) return key;
  }
  return null;
}

function updateHtmlFiles(fullAssetPath, oldVersion, newVersion) {
  const htmlFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
  let totalReplacements = 0;
  const changedFiles = [];

  for (const htmlFile of htmlFiles) {
    const htmlPath = path.join(ROOT, htmlFile);
    let content = fs.readFileSync(htmlPath, 'utf8');

    const patterns = [
      {
        regex: new RegExp(
          escapeRegex(fullAssetPath + '?v=') + escapeRegex(oldVersion),
          'g'
        ),
        replacement: `${fullAssetPath}?v=${newVersion}`
      },
      {
        regex: new RegExp(
          `((?:href|src)=["']${escapeRegex(fullAssetPath)})["']`,
          'g'
        ),
        replacement: `$1?v=${newVersion}"`
      }
    ];

    let fileReplacements = 0;
    let newContent = content;

    for (const { regex, replacement } of patterns) {
      const before = newContent;
      newContent = newContent.replace(regex, replacement);
      fileReplacements += (before.match(regex) || []).length;
    }

    if (fileReplacements > 0) {
      fs.writeFileSync(htmlPath, newContent, 'utf8');
      totalReplacements += fileReplacements;
      changedFiles.push({ file: htmlFile, count: fileReplacements });
    }
  }

  return { htmlFiles, totalReplacements, changedFiles };
}

// ── Parse arguments ─────────────────────────────────────────────
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage:');
  console.error('  node update-version.js <file-key> <new-version>');
  console.error('  node update-version.js --all <new-version>');
  console.error('  node update-version.js --images-only');
  console.error('  node update-version.js --reset');
  console.error('');
  console.error('Examples:');
  console.error('  node update-version.js css/animations 1.0.1');
  console.error('  node update-version.js js/custom 2.0.0');
  console.error('  node update-version.js --all 2.0.0');
  console.error('  node update-version.js --images-only');
  console.error('  node update-version.js --reset');
  console.error('');
  console.error('Available keys:');
  let vd;
  try { vd = readVersionJson(); } catch(e) { process.exit(1); }
  console.error('  ' + Object.keys(vd.files).join(', '));
  process.exit(1);
}

let versionData;
try {
  versionData = readVersionJson();
} catch (err) {
  console.error('Error reading version.json:', err.message);
  process.exit(1);
}

const oldTopLevel = versionData.v;

// ── MODE: --images-only ────────────────────────────────────────
if (args[0] === '--images-only') {
  const newTopLevel = incrementPatch(oldTopLevel);
  if (!newTopLevel) {
    console.error(`Error: Could not parse top-level version "${oldTopLevel}"`);
    process.exit(1);
  }

  versionData.v = newTopLevel;
  writeVersionJson(versionData);

  const oldCacheName = updateSwCacheName(newTopLevel);

  console.log('');
  console.log(`SW cache bumped to aashirwad-v${newTopLevel}`);
  console.log('All image caches will clear on next visit.');
  console.log('');
  console.log('Done!');
  process.exit(0);
}

// ── MODE: --reset ──────────────────────────────────────────────
if (args[0] === '--reset') {
  const RESET_VERSION = '1.0.0';
  const RESET_CACHE = 'aashirwad-v1.0.0';

  console.log('');
  console.log('Resetting all versions to 1.0.0 ...');
  console.log('');

  const oldFileVersions = { ...versionData.files };

  versionData.v = RESET_VERSION;
  for (const key of Object.keys(versionData.files)) {
    versionData.files[key] = RESET_VERSION;
  }
  writeVersionJson(versionData);

  const oldCacheName = updateSwCacheName(RESET_VERSION);

  const htmlFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
  let totalHtmlReplacements = 0;
  const htmlChangedFiles = [];

  for (const key of Object.keys(oldFileVersions)) {
    const oldVer = oldFileVersions[key];
    if (oldVer === RESET_VERSION) continue;
    const fullAssetPath = getAssetPath(key);
    const result = updateHtmlFiles(fullAssetPath, oldVer, RESET_VERSION);
    totalHtmlReplacements += result.totalReplacements;
    for (const entry of result.changedFiles) {
      const existing = htmlChangedFiles.find(e => e.file === entry.file);
      if (existing) existing.count += entry.count;
      else htmlChangedFiles.push(entry);
    }
  }

  console.log('─'.repeat(50));
  console.log('RESET SUMMARY');
  console.log('─'.repeat(50));
  console.log('');
  console.log(`  Top-level version: ${oldTopLevel} → ${RESET_VERSION}`);
  console.log(`  SW CACHE_NAME: ${oldCacheName} → ${RESET_CACHE}`);
  console.log('');
  console.log(`  HTML files scanned:   ${htmlFiles.length}`);
  console.log(`  HTML replacements:    ${totalHtmlReplacements}`);

  if (htmlChangedFiles.length > 0) {
    console.log('');
    console.log('  HTML files updated:');
    for (const { file, count } of htmlChangedFiles) {
      console.log(`    ${file} (${count} replacement${count > 1 ? 's' : ''})`);
    }
  }

  console.log('');
  console.log('Done!');
  process.exit(0);
}

// ── MODE: --all ────────────────────────────────────────────────
if (args[0] === '--all') {
  if (args.length < 2) {
    console.error('Error: <new-version> is required for --all.');
    console.error('Usage: node update-version.js --all <new-version>');
    process.exit(1);
  }

  const newVersion = args[1];
  const allKeys = Object.keys(versionData.files);

  console.log('');
  console.log(`Setting ALL ${allKeys.length} file versions to ${newVersion}`);
  console.log('');

  const fileChanges = [];
  for (const key of allKeys) {
    const old = versionData.files[key];
    fileChanges.push({ key, old });
    versionData.files[key] = newVersion;
  }

  const htmlFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
  let totalHtmlReplacements = 0;
  const htmlChangedFiles = [];

  for (const { key, old } of fileChanges) {
    const fullAssetPath = getAssetPath(key);
    const result = updateHtmlFiles(fullAssetPath, old, newVersion);
    totalHtmlReplacements += result.totalReplacements;
    for (const entry of result.changedFiles) {
      const existing = htmlChangedFiles.find(e => e.file === entry.file);
      if (existing) existing.count += entry.count;
      else htmlChangedFiles.push(entry);
    }
  }

  const newTopLevel = incrementPatch(oldTopLevel);
  if (!newTopLevel) {
    console.error(`Error: Could not parse top-level version "${oldTopLevel}"`);
    process.exit(1);
  }

  versionData.v = newTopLevel;
  writeVersionJson(versionData);

  const oldCacheName = updateSwCacheName(newTopLevel);

  console.log('─'.repeat(50));
  console.log('SUMMARY');
  console.log('─'.repeat(50));

  const changedFiles = fileChanges.filter(c => c.old !== newVersion);
  if (changedFiles.length > 0) {
    console.log('');
    console.log('  File versions updated:');
    for (const { key, old } of changedFiles) {
      console.log(`    ${key}: ${old} → ${newVersion}`);
    }
  }

  console.log('');
  console.log(`  SW CACHE_NAME: ${oldCacheName} → aashirwad-v${newTopLevel}`);
  console.log('');
  console.log(`  HTML files scanned:   ${htmlFiles.length}`);
  console.log(`  HTML replacements:    ${totalHtmlReplacements}`);

  if (htmlChangedFiles.length > 0) {
    console.log('');
    console.log('  HTML files updated:');
    for (const { file, count } of htmlChangedFiles) {
      console.log(`    ${file} (${count} replacement${count > 1 ? 's' : ''})`);
    }
  }

  console.log('');
  console.log('Done!');
  process.exit(0);
}

// ── MODE: normal file update ───────────────────────────────────
if (args.length < 2) {
  console.error('Error: <file-key> and <new-version> are required.');
  process.exit(1);
}

const fileArg = args[0];
const newFileVersion = args[1];

const fileKey = resolveKey(fileArg, versionData.files);

if (!fileKey) {
  console.error(`Error: File key "${fileArg}" not found in version.json.`);
  console.error('Available keys:', Object.keys(versionData.files).join(', '));
  process.exit(1);
}

const oldFileVersion = versionData.files[fileKey];

if (oldFileVersion === newFileVersion) {
  console.log(`Version for "${fileKey}" is already ${newFileVersion}.`);
  console.log('Bumping top-level SW version anyway...\n');
} else {
  console.log(`Updating "${fileKey}" from v${oldFileVersion} → v${newFileVersion}`);
}

const fullAssetPath = getAssetPath(fileKey);

versionData.files[fileKey] = newFileVersion;

let htmlResult = { htmlFiles: [], totalReplacements: 0, changedFiles: [] };

if (oldFileVersion !== newFileVersion) {
  htmlResult = updateHtmlFiles(fullAssetPath, oldFileVersion, newFileVersion);
}

const newTopLevel = incrementPatch(oldTopLevel);
if (!newTopLevel) {
  console.error(`Error: Could not parse top-level version "${oldTopLevel}"`);
  process.exit(1);
}

versionData.v = newTopLevel;
writeVersionJson(versionData);

const oldCacheName = updateSwCacheName(newTopLevel);

console.log('');
console.log('─'.repeat(50));
console.log('SUMMARY');
console.log('─'.repeat(50));

if (oldFileVersion !== newFileVersion) {
  console.log(`  File:          ${fileKey}`);
  console.log(`  Old version:   ${oldFileVersion}`);
  console.log(`  New version:   ${newFileVersion}`);
} else {
  console.log(`  File:          ${fileKey} (unchanged at v${newFileVersion})`);
}

console.log(`  SW CACHE_NAME: ${oldCacheName} → aashirwad-v${newTopLevel}`);
console.log('');
console.log(`  HTML files scanned:   ${htmlResult.htmlFiles.length}`);
console.log(`  HTML replacements:    ${htmlResult.totalReplacements}`);

if (htmlResult.changedFiles.length > 0) {
  console.log('');
  console.log('  HTML files updated:');
  for (const { file, count } of htmlResult.changedFiles) {
    console.log(`    ${file} (${count} replacement${count > 1 ? 's' : ''})`);
  }
}

console.log('');
console.log('Done!');
