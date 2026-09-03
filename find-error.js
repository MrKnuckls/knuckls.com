var fs = require('fs');
var code = fs.readFileSync('C:/Users/knuck/AppData/Local/hermes/knuckls/tmp-fresh.js', 'utf8');
var lines = code.split('\n');

// Binary search for the error
function testSection(endLine) {
  var section = lines.slice(0, endLine).join('\n');
  var tmp = 'C:/Users/knuck/AppData/Local/hermes/knuckls/tmp-sect.js';
  fs.writeFileSync(tmp, section);
  try {
    require('child_process').execSync('node --check "' + tmp + '"', {stdio:'pipe'});
    return true;
  } catch(e) {
    return false;
  }
}

// Find the last IIFE that compiles
var lo = 1, hi = 704;
while (lo < hi) {
  var mid = Math.floor((lo + hi + 1) / 2);
  if (testSection(mid)) {
    lo = mid;
  } else {
    hi = mid - 1;
  }
}

console.log('Last good line:', lo);
console.log('Line ' + lo + ':', lines[lo - 1]);
if (lo < lines.length) {
  console.log('Next line ' + (lo + 1) + ':', lines[lo]);
  console.log('');
  for (var j = Math.max(0, lo - 3); j <= lo && j < lines.length; j++) {
    console.log((j + 1) + ': ' + lines[j].substring(0, 100));
  }
}