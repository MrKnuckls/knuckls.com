var fs = require('fs');
var code = fs.readFileSync('C:/Users/knuck/AppData/Local/hermes/knuckls/tmp-live.js', 'utf8');
code = code.replace(/\r\n/g, '\n');
var lines = code.split('\n');
var cp = require('child_process');

// Find all IIFE boundaries
var iifeStarts = [];
var iifeEnds = [];
for (var i = 0; i < lines.length; i++) {
  var t = lines[i].trim();
  if (t === '})();') iifeEnds.push(i);
  // Check for IIFE openings - lines that start with (function or (async function
  if (/^\(async\s+function\s*\(/.test(t) || /^\(function\s*\(/.test(t)) {
    iifeStarts.push(i);
  }
}

// Also find non-IIFE blocks
console.log('IIFE starts:', iifeStarts.length, 'ends:', iifeEnds.length);
console.log('\nTesting each IIFE section individually...');

// Test each IIFE by extracting it and wrapping the rest
for (var s = 0; s < iifeStarts.length; s++) {
  var start = iifeStarts[s];
  var end = iifeEnds[s];
  if (end === undefined) {
    console.log('Section', s, 'start at', start+1, 'has no matching end');
    continue;
  }
  
  // Extract just this IIFE
  var section = lines.slice(start, end + 1).join('\n');
  fs.writeFileSync('C:/Users/knuck/AppData/Local/hermes/knuckls/tmp-sect.js', section);
  
  try {
    cp.execSync('node --check "C:/Users/knuck/AppData/Local/hermes/knuckls/tmp-sect.js"', {stdio:'pipe'});
  } catch(e) {
    var stderr = e.stderr ? e.stderr.toString() : '';
    console.log('Section', s, '(lines', start+1, '-', end+1, '):', stderr.match(/SyntaxError:.*/));
    console.log('  First 50:', lines[start].substring(0, 60));
    console.log('  Last 50:', lines[end].substring(0, 60));
    console.log('');
  }
}

// Now test cumulative: each IIFE + all previous ones
console.log('\nTesting cumulative...');
cumCode = '';
for (var s = 0; s < iifeStarts.length; s++) {
  var start = iifeStarts[s];
  var end = iifeEnds[s];
  if (end === undefined) break;
  
  // Add content between last IIFE and this one
  if (s === 0) {
    cumCode = lines.slice(0, end + 1).join('\n');
  } else {
    var prevEnd = iifeEnds[s-1];
    cumCode += '\n' + lines.slice(prevEnd + 1, end + 1).join('\n');
  }
  
  fs.writeFileSync('C:/Users/knuck/AppData/Local/hermes/knuckls/tmp-cum.js', cumCode);
  try {
    cp.execSync('node --check "C:/Users/knuck/AppData/Local/hermes/knuckls/tmp-cum.js"', {stdio:'pipe'});
    console.log('Through section', s, '(line', end+1, '): OK');
  } catch(e) {
    var stderr = e.stderr ? e.stderr.toString() : '';
    console.log('Through section', s, '(line', end+1, '): FAIL:', (stderr.match(/SyntaxError:.*/) || [''])[0]);
    break;
  }
}