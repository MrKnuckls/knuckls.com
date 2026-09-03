// Use acorn-like approach: test the file with a throwaway wrapper
var fs = require('fs');
var code = fs.readFileSync('C:/Users/knuck/AppData/Local/hermes/knuckls/tmp-live.js', 'utf8');
code = code.replace(/\r\n/g, '\n');

// Try wrapping in a try/catch to find what's unclosed
var wrapper = 'try {\n' + code + '\n} catch(e) {}';

var tmp = 'C:/Users/knuck/AppData/Local/hermes/knuckls/tmp-wrapper.js';
fs.writeFileSync(tmp, wrapper);

var cp = require('child_process');
try {
  cp.execSync('node --check "' + tmp + '"', {stdio:'pipe'});
  console.log('NO ERROR');
} catch(e) {
  console.log('ERROR:', e.stderr ? e.stderr.toString().substring(0, 300) : e.message);
  // The line number should tell us where
  var match = e.stderr.toString().match(/:(\d+):/);
  if (match) console.log('Error at line:', match[1]);
}