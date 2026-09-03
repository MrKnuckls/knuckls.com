
// ─── Dynamic content loader ─────────────────────────
(function(){
  function g(id){ return document.getElementById(id); }
  // Load site config
  fetch('/console.php?action=admin_pages_read&pass=knuckls2026')
    .then(function(r){ return r.json(); })
    .then(function(d){
      var p = d.pages || {};
      // Hero
      var pp = p.hero_desc;
      if(pp && g('heroDesc')) g('heroDesc').textContent = pp;
      // About — convert \n to paragraphs
      var ab = p.about_text;
      if(ab && g('aboutText')){
        g('aboutText').innerHTML = ab.split('\n').filter(function(l){ return l.trim(); }).map(function(l){ return '<p>' + l.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</p>'; }).join('');
      }
      // Footer
      var ft = p.footer_text;
      if(ft && g('footerTagline')) g('footerTagline').textContent = ft;
      // Meta description
      var md = p.hero_desc;
      if(md) document.querySelector('meta[name="description"]').content = 'Shaun (MrKnuckls) — ' + md;
    });
  // Load server config
  fetch('/console.php?action=admin_servers_read&pass=knuckls2026')
    .then(function(r){ return r.json(); })
    .then(function(d){
      var list = d.servers || [];
      list.forEach(function(s){
        var card = document.querySelector('[data-server="' + s.id + '"]');
        if(card && s.desc){
          var p = card.querySelector('.server-players');
          if(p) p.textContent = s.desc;
        }
        if(card && s.name){
          var n = card.querySelector('.server-name');
          if(n) n.textContent = s.name;
        }
      });
        // Load theme
        fetch('/console.php?action=admin_theme_read&pass=knuckls2026')
          .then(function(r){ return r.json(); })
          .then(function(d){
            var t = d.theme || {};
            if(t.accent) document.documentElement.style.setProperty('--accent', t.accent);
            if(t.bg) document.documentElement.style.setProperty('--bg', t.bg);
            if(t.surface) document.documentElement.style.setProperty('--surface', t.surface);
            if(t.text) document.documentElement.style.setProperty('--text', t.text);
          });
      })();