var fs = require('fs');
var code = fs.readFileSync('C:/Users/knuck/AppData/Local/hermes/knuckls/tmp-fresh.js', 'utf8');

// Convert windows line endings
code = code.replace(/\r\n/g, '\n');

var tmp = 'C:/Users/knuck/AppData/Local/hermes/knuckls/tmp-nocr.js';
fs.writeFileSync(tmp, code);

var cp = require('child_process');
try {
  cp.execSync('node --check "' + tmp + '"', {stdio:'pipe'});
  console.log('NO ERROR with LF endings');
} catch(e) {
  console.log('ERROR exists with LF endings:', e.stderr ? e.stderr.toString().substring(0, 200) : e.message);
}