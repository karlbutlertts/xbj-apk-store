const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const html = fs.readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8');
const code = html.slice(html.indexOf('function saveSession()'), html.indexOf('const MODEL_KEY'));
for (const [name, initial, cookie, expected] of [
  ['fresh installation', {}, '', false],
  ['saved activation', {xbj_activated: '1'}, '', true],
  ['expired legacy activation', {xbj_unlocked_until: '1'}, '', true],
  ['valid legacy activation', {xbj_unlocked_until: '9999999999999'}, '', true],
  ['legacy cookie', {}, 'xbj_unlocked_until=1', true],
  ['invalid legacy value', {xbj_unlocked_until: 'invalid'}, '', false]
]) {
  const data = {...initial};
  const context = {ACTIVATION_KEY: 'xbj_activated', SESSION_KEY: 'xbj_unlocked_until',
    localStorage: {getItem: key => data[key] ?? null, setItem: (key, value) => data[key] = value},
    document: {cookie}};
  vm.createContext(context);
  vm.runInContext(code, context);
  assert.equal(context.loadSession(), expected, name);
  if (expected) assert.equal(data.xbj_activated, '1', name + ' migration');
  console.log('PASS ' + name);
}
