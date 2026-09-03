var fs = require('fs');
var code = fs.readFileSync('C:/Users/knuck/AppData/Local/hermes/knuckls/tmp-fresh.js', 'utf8');

// Remove comments and count bases
var cleaned = code.replace(/\/\/.*\r?\n/g, '\n');

// Track brace depth properly with template handling
var braces = 0;
var parens = 0;
var str = null;
var tpl = false;
var tplExpr = 0; // depth of template expressions

for (var i = 0; i < cleaned.length; i++) {
  var ch = cleaned[i];
  var next = cleaned[i + 1] || '';
  
  if (tplExpr > 0) {
    // Inside a template expression - normal JS rules
    if (ch === '{') tplExpr++;
    if (ch === '}') {
      tplExpr--;
      if (tplExpr === 0) continue; // back to template literal
      continue;
    }
    if (str) {
      if (ch === '\\') i++;
      else if (ch === str) str = null;
    } else {
      if (ch === "'" || ch === '"') str = ch;
      else if (ch === '(') parens++;
      else if (ch === ')') parens--;
      else if (ch === '{') braces++;
      else if (ch === '}') braces--;
    }
    continue;
  }
  
  if (tpl) {
    if (ch === '`') tpl = false;
    else if (ch === '$' && next === '{') {
      tplExpr = 1; // enter template expression
      i++;
    }
    continue;
  }
  
  if (str) {
    if (ch === '\\') i++;
    else if (ch === str) str = null;
    continue;
  }
  
  if (ch === "'" || ch === '"') str = ch;
  else if (ch === '`') tpl = true;
  else if (ch === '/') {
    // Could be regex - for simplicity, skip regex
    // We'll handle this case differently
    if (next === '/') {
      // Already handled by comment removal
    }
  }
  else if (ch === '(') parens++;
  else if (ch === ')') parens--;
  else if (ch === '{') braces++;
  else if (ch === '}') braces--;
}

console.log('Final: braces=' + braces + ' parens=' + parens);