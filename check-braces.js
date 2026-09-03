var fs = require('fs');
var code = fs.readFileSync('C:/Users/knuck/AppData/Local/hermes/knuckls/tmp-fresh.js', 'utf8');
var lines = code.split('\n');

var b = 0, p = 0;
var inStr = null, inTpl = false;
var lastDelta = '';

for (var i = 0; i < lines.length; i++) {
  var line = lines[i];
  for (var j = 0; j < line.length; j++) {
    var c = line[j];
    if (inTpl) {
      if (c === '`') {
        inTpl = false;
      } else if (c === '$' && line[j + 1] === '{') {
        b++;
        j++;
      }
    } else if (inStr) {
      if (c === '\\') {
        j++;
      } else if (c === inStr) {
        inStr = null;
      }
    } else {
      if (c === "'" || c === '"') {
        inStr = c;
      } else if (c === '`') {
        inTpl = true;
      } else if (c === '{') {
        b++;
      } else if (c === '}') {
        b--;
      } else if (c === '(') {
        p++;
      } else if (c === ')') {
        p--;
      }
    }
  }

  var trimmed = line.trim();
  if (b !== 0 || p !== 0) {
    // Only print for IIFE boundaries and key lines
    if (trimmed === '})();' || trimmed === '});' || trimmed === '})();' ||
        /^[\({]/.test(trimmed) && trimmed.indexOf('function') >= 0) {
      console.log('L' + (i + 1) + ': b=' + b + ' p=' + p + ' | ' + trimmed.substring(0, 60));
    }
  }
}

console.log('FINAL b=' + b + ' p=' + p);