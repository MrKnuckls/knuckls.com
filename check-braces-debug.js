var fs = require('fs');
var code = fs.readFileSync('C:/Users/knuck/AppData/Local/hermes/knuckls/tmp-fresh.js', 'utf8');
var lines = code.split('\n');

var b = 0, p = 0;
var inStr = null, inTpl = false;

for (var i = 0; i < lines.length; i++) {
  var line = lines[i];
  var lineB = b, lineP = p;
  
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

  // Check if balance changed unexpectedly
  var trimmed = line.trim();
  if (trimmed.length > 0 && (b !== lineB || p !== lineP)) {
    // Only print for specific lines in the problematic range
    if (i >= 130 && i <= 180) {
      var dbrace = b - lineB;
      var dparen = p - lineP;
      var brief = trimmed.length > 70 ? trimmed.substring(0, 70) + '...' : trimmed;
      console.log('L' + (i + 1) + ' | Δb=' + (dbrace >= 0 ? '+' : '') + dbrace + 
                  ' Δp=' + (dparen >= 0 ? '+' : '') + dparen + ' | b=' + b + ' p=' + p + ' | ' + brief);
    }
  }
}

console.log('FINAL b=' + b + ' p=' + p);