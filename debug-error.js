var fs = require('fs');
var code = fs.readFileSync('C:/Users/knuck/AppData/Local/hermes/knuckls/tmp-live.js', 'utf8');
code = code.replace(/\r\n/g, '\n');

var cp = require('child_process');

// Try without any wrapper - get the raw error
var tmp = 'C:/Users/knuck/AppData/Local/hermes/knuckls/tmp-check2.js';
fs.writeFileSync(tmp, code);

try {
  cp.execSync('node --check "' + tmp + '"', {stdio:'pipe'});
  console.log('NO ERROR');
} catch(e) {
  var stderr = e.stderr ? e.stderr.toString() : '';
  var lines = stderr.split('\n');
  for (var i = 0; i < lines.length; i++) {
    console.log(lines[i].substring(0, 200));
  }
}

// Also try: does the issue involve a regex?
// Check for regex-like patterns
var regexCount = 0;
var divCount = 0;
for (var i = 0; i < code.length - 1; i++) {
  if (code[i] === '/' && code[i+1] === '/') {
    // Comment - count line-based
  } else if (code[i] === '/' && code[i+1] !== '*' && code[i+1] !== '/') {
    // Could be regex or division
    // Check context - is it after a binary operator?
    // Simplistic: if preceded by '(', '=', ':', ' ', or start of line
    var prev = i > 0 ? code[i-1] : '';
    if (prev.match(/[\(=:\s,;\?\[\!&|]/)) {
      regexCount++;
    } else {
      divCount++;
    }
  }
}
console.log('\nPotential regex literals:', regexCount, 'Division operators:', divCount);