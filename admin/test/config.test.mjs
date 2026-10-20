// Regression tests for the CMS configuration. Run: npm test (in admin/).
//
// The M0 "zero entries" bug: the CMS read the `main` branch, where the demo content did not exist (it lived only on the
// unmerged M0 branch). These tests check, against the real Git repository, that every collection's entries exist on
// the branch the CMS is configured to read, and that the entry files match what the CMS expects (path pattern,
// format, i18n single_file shape, known fields).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createConfig, DEFAULT_BRANCH, MODE_BRANCHES } from '../src/config-core.js';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const m0Branch = MODE_BRANCHES.m0;
const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' });

/** Resolves a branch name to a ref that exists locally (remote-tracking first, then local). */
const refFor = (branch) => {
  for (const ref of [`origin/${branch}`, branch]) {
    try { git('rev-parse', '--verify', '--quiet', ref); return ref; } catch {}
  }
  return null;
};

/** Entry files of a folder collection on a ref, matched the way the CMS matches them: <folder>/<path>.<extension>. */
const entriesOn = (ref, collection) => {
  const files = git('ls-tree', '-r', '--name-only', ref, '--', collection.folder).split('\n').filter(Boolean);
  const pattern = new RegExp(`^${collection.folder}/${collection.path.replace('{{slug}}', '[^/]+')}\\.${collection.extension}$`);
  return files.filter((f) => pattern.test(f));
};

test('production builds target main; the demo backend stays in-memory', () => {
  assert.equal(createConfig({ mode: 'production' }).backend.branch, DEFAULT_BRANCH);
  assert.equal(createConfig({ mode: 'development', branch: '  ' }).backend.branch, DEFAULT_BRANCH);
  assert.equal(createConfig({ mode: 'demo' }).backend.name, 'test-repo');
});

test('the m0 mode targets the M0 branch, never main', () => {
  assert.ok(m0Branch, 'MODE_BRANCHES.m0 must be set');
  assert.notEqual(m0Branch, DEFAULT_BRANCH);
  assert.equal(createConfig({ mode: 'm0' }).backend.branch, m0Branch);
});

test('security-relevant backend settings are unchanged', () => {
  const c = createConfig({ mode: 'm0' });
  assert.deepEqual(c.backend.auth_methods, ['token']);
  assert.equal(c.publish_mode, 'editorial_workflow');
  assert.equal(c.load_config_file, false);
});

test('regression: the configured branch contains every collection’s entries', (t) => {
  const c = createConfig({ mode: 'm0' });
  const ref = refFor(c.backend.branch);
  if (!ref) return t.skip(`branch ${c.backend.branch} is not available locally (git fetch first)`);
  for (const collection of c.collections) {
    const entries = entriesOn(ref, collection);
    assert.ok(entries.length > 0, `${collection.name}: no entries on ${ref} under ${collection.folder} (the CMS would list zero)`);
  }
});

test('documents the original bug: main has no M0 entries while PR #27 is unmerged', (t) => {
  const ref = refFor(DEFAULT_BRANCH);
  if (!ref) return t.skip('main not available locally');
  const collection = createConfig({ mode: 'production' }).collections[0];
  const onMain = entriesOn(ref, collection).length;
  const onM0 = refFor(m0Branch) ? entriesOn(refFor(m0Branch), collection).length : 0;
  // Once PR #27 is merged, main has the entries too and the default configuration lists them.
  assert.ok(onMain === 0 || onMain === onM0, `unexpected entry count on main: ${onMain}`);
});

test('entry files match the shape the CMS reads and writes (single_file i18n, known fields)', () => {
  const c = createConfig({ mode: 'm0' });
  for (const collection of c.collections) {
    const fieldNames = new Set(collection.fields.map((f) => f.name));
    const dir = path.join(repo, collection.folder);
    for (const slug of fs.readdirSync(dir)) {
      const file = path.join(dir, slug, `index.${collection.extension}`);
      if (!fs.existsSync(file)) continue;
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      const locales = Object.keys(data);
      assert.ok(locales.includes(c.i18n.default_locale), `${slug}: default locale missing`);
      for (const locale of locales) {
        assert.ok(c.i18n.locales.includes(locale), `${slug}: unknown locale key "${locale}"`);
        for (const key of Object.keys(data[locale])) assert.ok(fieldNames.has(key), `${slug}/${locale}: unknown field "${key}"`);
      }
    }
  }
});
