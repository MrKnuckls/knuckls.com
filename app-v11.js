
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
      });
      })();

            // Theme toggle
(function(){
  const html = document.documentElement;
  const btn = document.getElementById('themeToggle');
  const saved = localStorage.getItem('knuckls-theme');
  if(saved === 'light') html.classList.add('light');
  
  function updateIcon(){
    if(!btn) return;
    btn.textContent = html.classList.contains('light') ? '🌙' : '☀️';
  }
  updateIcon();
  
  btn?.addEventListener('click', ()=>{
    html.classList.toggle('light');
    localStorage.setItem('knuckls-theme', html.classList.contains('light') ? 'light' : 'dark');
    updateIcon();
  });
})();

// Matrix rain background
(function(){
  const c = document.getElementById('matrix-canvas');
  const ctx = c.getContext('2d');
  let W, H, cols, drops;

  function resize(){
    W = c.width = window.innerWidth;
    H = c.height = window.innerHeight;
    cols = Math.floor(W / 16);
    drops = Array(cols).fill(1);
  }
  resize();
  window.addEventListener('resize', resize);

  const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF<>/';

  function draw(){
    ctx.fillStyle = 'rgba(13,17,23,.05)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#39d353';
    ctx.font = '14px monospace';

    for(let i=0;i<drops.length;i++){
      const text = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(text, i * 16, drops[i] * 16);
      if(drops[i] * 16 > H && Math.random() > .975) drops[i] = 0;
      drops[i]++;
    }
  }
  setInterval(draw, 50);
})();

// Typewriter effect
(function(){
  const el = document.getElementById('typing-text');
  const phrases = [
    'Gamer. Server host. Lab rat.',
    'I play hard, I host harder.',
    'Welcome to the lab.',
    'Squad up.'
  ];
  let idx=0, charIdx=0, dir=1;
  function step(){
    const phrase = phrases[idx];
    if(dir===1){
      charIdx++;
      el.textContent = phrase.slice(0, charIdx);
      if(charIdx===phrase.length) setTimeout(()=>{dir=-1;step()}, 1500);
      else setTimeout(step, 60);
    } else {
      charIdx--;
      el.textContent = phrase.slice(0, charIdx);
      if(charIdx===0){ dir=1; idx=(idx+1)%phrases.length; setTimeout(step, 400); }
      else setTimeout(step, 30);
    }
  }
  step();
})();

// Live server status via PHP ping
(async function(){
  const serverIds = ['palworld','starrupture','arma','dayz','hytale'];

  function updateCard(id, status, players, maxPlayers){
    const card = document.querySelector(`[data-server="${id}"]`);
    if(!card) return;
    const dot = card.querySelector('.dot');
    const label = card.querySelector('.server-status > span:nth-child(2)');
    const pc = card.querySelector('.player-count');
    
    if(status === 'online'){
      dot.className = 'dot online';
      label.className = 'online';
      label.textContent = 'ONLINE';
      if(pc) pc.textContent = players ? `${players}/${maxPlayers || '?'} players` : '—';
    } else if(status === 'offline'){
      dot.className = 'dot offline';
      label.className = 'offline';
      label.textContent = 'OFFLINE';
      if(pc) pc.textContent = '—';
    } else {
      dot.className = 'dot checking';
      label.className = 'checking';
      label.textContent = 'CHECKING';
      if(pc) pc.textContent = '—';
    }
  }

  async function checkAll(){
    for(const id of serverIds){
      updateCard(id, 'checking');
      try{
        const resp = await fetch(`/ping.php?server=${id}`, {signal:AbortSignal.timeout(5000)});
        const data = await resp.json();
        updateCard(id, data.online ? 'online' : 'offline', data.players, data.max_players);
      } catch(e){
        updateCard(id, 'offline');
      }
    }
  }

  checkAll();
  setInterval(checkAll, 60000);
})();

// Discord widget
(function(){
  const guildId = localStorage.getItem('knuckls-discord-id');
  async function fetchWidget(){
    if(!guildId) return;
    try{
      const resp = await fetch(`https://discord.com/api/guilds/${guildId}/widget.json`);
      const data = await resp.json();
      document.getElementById('dcMembers').textContent = data.members?.toLocaleString() || '—';
      document.getElementById('dcOnline').textContent = data.presence_count?.toLocaleString() || '—';
      if(data.instant_invite){
        document.getElementById('discordJoinBtn').href = data.instant_invite;
      }
    } catch(e){}
  }
  
  // If guild ID is saved, fetch; otherwise show placeholder
  if(guildId){
    fetchWidget();
  }
})();

// Dev blog - load from JSON feed
;(async function(){
  const list = document.getElementById('blogList');
  try{
    const resp = await fetch('/blog-posts.json');
    const posts = await resp.json();
    if(!posts || posts.length === 0){
      list.innerHTML = '<div class="blog-empty">No dev notes yet. First update coming soon.</div>';
      return;
    }
    list.innerHTML = posts.map(p => `
      <div class="blog-post">
        <div class="post-meta">
          <span class="post-date">${p.date || ''}</span>
          ${p.category ? `<span class="post-cat">${p.category}</span>` : ''}
          ${p.version ? `<span class="post-version">v${p.version}</span>` : ''}
        </div>
        <h3>${p.title || 'Untitled'}</h3>
        ${p.image ? `<img class="post-image" src="${p.image}" alt="${p.title}" loading="lazy">` : ''}
        <div class="post-content">${(p.content || p.body || '').replace(/\n/g, '<br>')}</div>
        ${p.author ? `<div style="font-family:var(--font-mono);font-size:.72rem;color:var(--text-muted);margin-top:8px">— ${p.author}</div>` : ''}
      </div>
    `).join('');
  } catch(e){
    list.innerHTML = '<div class="blog-empty">Could not load dev notes.</div>';
  }
})();

// Mobile nav toggle
document.getElementById('navToggle').addEventListener('click', ()=>{
  document.getElementById('navLinks').classList.toggle('open');
});
document.querySelectorAll('#navLinks a').forEach(a=>{
  a.addEventListener('click',()=>{
    document.getElementById('navLinks').classList.remove('open');
  });
});

// Intersection observer for fade-in
const observer = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, {threshold:.1});

document.querySelectorAll('section:not(#hero)').forEach(el=>{
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity .6s ease, transform .6s ease';
  observer.observe(el);
});

// ─── COMMAND CENTER ───────────────────────────────
// Global auth function — called by inline onclick/onkeydown
window.consoleAuthFn = async function(){
  var inp = document.getElementById('consolePass');
  var gate = document.getElementById('consoleGate');
  var dash = document.getElementById('consoleDash');
  var fail = document.getElementById('consoleFail');
  var pass = inp ? inp.value.trim() : '';
  if(!pass) return;
  try {
    var r = await fetch('/console.php?action=auth&pass=' + encodeURIComponent(pass) + '&v=' + Date.now());
    var d = await r.json();
    if(d && d.authed){
      if(gate) gate.style.display = 'none';
      if(dash) dash.style.display = 'block';
      sessionStorage.setItem('caSession', '1');
      window.dispatchEvent(new Event('caSession'));
    } else {
      if(fail){ fail.style.display = 'block'; fail.textContent = 'Wrong passkey'; }
    }
  } catch(e){
    if(fail){ fail.style.display = 'block'; fail.textContent = 'Connection error'; }
  }
}

;(function(){
  var g = function(id){ return document.getElementById(id); };
  var gate = g('consoleGate'), dash = g('consoleDash'), inp = g('consolePass'), fail = g('consoleFail');
  var authed = false;
    // Auto-auth if already logged in
    if(sessionStorage.getItem('caSession')){
      if(g('consoleGate')) g('consoleGate').style.display = 'none';
      if(g('consoleDash')) g('consoleDash').style.display = 'block';
      window.dispatchEvent(new Event('caSession'));
    }
      var timer = null;
    var ws = null;

    // ─── Dashboard functions ───
      var PASS = 'knuckls2026';
  
      // Listen for global auth event
      window.addEventListener('caSession', function(){
        authed = true;
        fetchStatus();
        if(typeof timer !== 'undefined' && timer) clearInterval(timer);
        timer = setInterval(fetchStatus, 15000);
      });
  var serverIds = ['palworld','starrupture','arma','dayz','hytale'];
  var consoleGrid = g('consoleGrid');
  var statusEl = g('consoleStatus');
  var lastEl = g('consoleLast');
  var toast = g('consoleToast');

  // Tab switching
  var tabSwitchers = document.querySelectorAll('#consoleTabs button');
  tabSwitchers.forEach(function(t){
    t.addEventListener('click', function(){
      tabSwitchers.forEach(function(x){ x.style.background = ''; x.style.color = ''; x.style.borderColor = ''; });
      this.style.background = 'var(--accent)'; this.style.color = 'var(--bg)'; this.style.borderColor = 'var(--accent)';
      document.querySelectorAll('#consoleDash > div[id^="tab"]').forEach(function(d){ d.style.display = 'none'; });
      var target = g(this.dataset.tab);
      if(target) target.style.display = 'block';
    });
  });

  // Auth state is checked server-side via PASS
  async function fetchStatus(){
    if(!authed) return;
    try {
      var r = await fetch('/console.php?action=status&pass=' + encodeURIComponent(PASS), {signal:AbortSignal.timeout(8000)});
      var data = await r.json();
      renderGrid(data);
      loadUptime();
      loadResources(g('resourceServer') ? g('resourceServer').value || 'palworld' : 'palworld', '24h');
      if(statusEl) statusEl.textContent = '● monitoring';
      if(lastEl) lastEl.textContent = 'last: ' + new Date().toLocaleTimeString();
    } catch(e){
      if(statusEl) statusEl.textContent = '● error';
    }
  }

  function renderGrid(data){
    if(!consoleGrid) return;
    var arr = Object.keys(data).map(function(k){ var o=data[k]; o.id=k; return o; });
        consoleGrid.innerHTML = arr.map(function(s){
          var pct = s.cpu ? Math.min(Math.round(s.cpu), 100) : 0;
          var ram_total = (s.ram_limit > 0) ? Math.round(s.ram_limit/1073741824*10)/10 : (s.ram ? '?' : 0);
          var ram_used = s.ram ? (s.ram_limit > 0 ? Math.round(s.ram / s.ram_limit * 100) : Math.round(s.ram/1073741824*10)/10) : 0;
          var ram_display = s.ram ? Math.round(s.ram/1048576*10)/10 + 'MB' : '—';
          var ram_max_display = s.ram_limit > 0 ? Math.round(s.ram_limit/1048576*10)/10 + 'MB' : '?';
          return '<div class="server-card" data-id="' + s.id + '">' +
            '<div class="server-name">' + (s.game || s.id) + '</div>' +
            '<div class="server-status"><span class="dot ' + (s.online ? 'online' : 'offline') + '"></span><span class="' + (s.online ? 'online' : 'offline') + '">' + (s.online ? 'ONLINE' : 'OFFLINE') + '</span></div>' +
            '<div class="server-meta">' + (s.online ? s.state||'running' : 'offline') + '</div>' +
            '<div class="resource-row">' +
              '<div class="resource-item"><div class="r-label">CPU</div><div class="r-bar"><div class="r-fill" style="width:' + pct + '%;background:' + (pct > 80 ? 'var(--red)' : 'var(--accent)') + '"></div></div><div class="r-val">' + pct + '%</div></div>' +
              '<div class="resource-item"><div class="r-label">RAM</div><div class="r-bar"><div class="r-fill" style="width:' + ram_used + '%;background:var(--secondary)"></div></div><div class="r-val">' + ram_display + (s.ram_limit > 0 ? ' / ' + ram_max_display : '') + '</div></div>' +
            '</div>' +
            '<div class="actions-row">' +
              '<button class="btn btn-outline btn-start" onclick="sendCmd(\'' + s.id + '\',\'start\')" ' + (s.online ? 'disabled' : '') + '>▶ Start</button>' +
              '<button class="btn btn-outline btn-stop" onclick="sendCmd(\'' + s.id + '\',\'stop\')" ' + (!s.online ? 'disabled' : '') + '>⏹ Stop</button>' +
              '<button class="btn btn-outline btn-restart" onclick="sendCmd(\'' + s.id + '\',\'restart\')">↻ Restart</button>' +
            '</div></div>';
    }).join('');
  }

  window.sendCmd = function(id, action){
    if(!authed) return;
    fetch('/console.php?action=power&pass=' + encodeURIComponent(PASS) + '&server=' + id + '&signal=' + action, {signal:AbortSignal.timeout(10000)})
    .then(function(r){ return r.json(); })
    .then(function(d){
      if(toast){ toast.textContent = d.ok ? '✓ ' + action + ' sent to ' + id : '✗ ' + (d.msg||'failed'); toast.style.display = 'block'; setTimeout(function(){ toast.style.display = 'none'; }, 4000); }
      if(d.ok) setTimeout(fetchStatus, 3000);
    });
  };

  g('consoleRefresh')?.addEventListener('click', fetchStatus);

  // ─── Uptime Timeline ───
  var uptimeRangeTabs = document.querySelectorAll('#uptimeRangeTabs button');
  uptimeRangeTabs.forEach(function(t){
    t.addEventListener('click', function(){ 
      uptimeRangeTabs.forEach(function(x){ x.style.background = ''; x.style.color = ''; x.style.borderColor = ''; });
      this.style.background = 'var(--accent)'; this.style.color = 'var(--bg)'; this.style.borderColor = 'var(--accent)';
      loadUptime(this.dataset.range);
    });
  });

  async function loadUptime(range){
    range = range || '24h';
    var chart = g('uptimeChart');
    if(!chart) return;
    try {
      var r = await fetch('/uptime.php?range=' + range, {signal:AbortSignal.timeout(5000)});
      var data = await r.json();
      var slots = data.slots || [];
      if(!slots.length){
        chart.innerHTML = '<div class="blog-empty" style="grid-column:span 2">Collecting uptime data — check back after status checks run.</div>';
        return;
      }
      chart.innerHTML = slots.map(function(slot){
        var bars = data.servers.map(function(s){
          var entry = slot[s] || null;
          var color = 'gray';
          if(entry === true) color = 'var(--accent)';
          else if(entry === false) color = 'var(--red)';
          return '<div style="flex:1;height:12px;background:' + color + ';border-radius:2px;min-width:2px" title="' + s + ': ' + (entry === true ? 'ONLINE' : entry === false ? 'OFFLINE' : 'no data') + '"></div>';
        }).join('');
        return '<div style="font-size:.65rem;color:var(--text-muted);text-align:right">' + (slot._label || '') + '</div><div style="display:flex;gap:2px;align-items:center">' + bars + '</div>';
      }).join('');
    } catch(e){
      if(chart) chart.innerHTML = '<div class="blog-empty" style="grid-column:span 2">Could not load uptime data.</div>';
    }
  }

  // ─── Resource History ───
  var resRangeTabs = document.querySelectorAll('#resRangeTabs button');
  resRangeTabs.forEach(function(t){
    t.addEventListener('click', function(){
      resRangeTabs.forEach(function(x){ x.style.background = ''; x.style.color = ''; x.style.borderColor = ''; });
      this.style.background = 'var(--accent)'; this.style.color = 'var(--bg)'; this.style.borderColor = 'var(--accent)';
      loadResources(g('resourceServer') ? g('resourceServer').value : 'palworld', this.dataset.range);
    });
  });

  g('resourceServer')?.addEventListener('change', function(){
    loadResources(this.value, document.querySelector('#resRangeTabs button[style*=\"accent\"]')?.dataset?.range || '24h');
  });

  async function loadResources(server, range){
    var canvas = g('resCanvas');
    var empty = g('resEmpty');
    if(!canvas) return;
    try {
      if(empty) empty.style.display = 'block';
      var r = await fetch('/resources.php?server=' + server + '&range=' + (range||'24h'), {signal:AbortSignal.timeout(5000)});
      var data = await r.json();
      if(empty) empty.style.display = 'none';
      var pts = data.points || [];
      var ctx = canvas.getContext('2d');
      var W = canvas.parentElement.clientWidth;
      var H = 180;
      canvas.width = W * 2; canvas.height = H * 2;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.scale(2, 2);
      ctx.clearRect(0, 0, W, H);
      if(pts.length < 2){
        ctx.fillStyle = 'var(--text-muted)'; ctx.font = '14px monospace'; ctx.textAlign = 'center';
        ctx.fillText('Not enough data yet', W/2, H/2);
        return;
      }
      var maxCpu = Math.max.apply(null, pts.map(function(p){ return p.cpu || 0; })) * 1.2 || 100;
      var maxRam = Math.max.apply(null, pts.map(function(p){ return p.ram || 0; })) * 1.2 || 1024;
      // CPU line
      ctx.beginPath(); ctx.strokeStyle = 'var(--accent)'; ctx.lineWidth = 2;
      pts.forEach(function(p, i){
        var x = i / (pts.length-1) * W;
        var y = H - (p.cpu||0) / maxCpu * (H-20);
        if(i===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      // RAM line
      ctx.beginPath(); ctx.strokeStyle = 'var(--secondary)'; ctx.lineWidth = 2;
      pts.forEach(function(p, i){
        var x = i / (pts.length-1) * W;
        var y = H - (p.ram||0) / maxRam * (H-20);
        if(i===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      // Labels
      ctx.fillStyle = 'var(--text-muted)'; ctx.font = '10px monospace';
      if(pts.length > 0){
        var first = pts[0], last = pts[pts.length-1];
        ctx.fillText(first.t || '', 4, H-4);
        ctx.textAlign = 'right';
        ctx.fillText(last.t || '', W-4, H-4);
      }
    } catch(e){
      if(empty) empty.textContent = 'Could not load resource data.';
    }
  }

  // ─── Live Logs ───
  var logsContainer = g('logsContainer');
  var logsStatus = g('logsStatus');
  var logsServer = g('logsServer');
  var logsConnect = g('logsConnect');
  var logsDisconnect = g('logsDisconnect');
  var logsCmdInput = g('logsCmdInput');
  var logsCmdSend = g('logsCmdSend');
  var logsInputRow = g('logsInputRow');

  if(logsConnect) logsConnect.addEventListener('click', function(){
      if(ws) { ws.close(); ws = null; }
      var server = logsServer ? logsServer.value : 'palworld';
      // Get WebSocket token from server-side (keeps API key secret)
      fetch('/console.php?action=ws&server=' + server + '&pass=' + encodeURIComponent(PASS))
      .then(function(r){ return r.json(); })
      .then(function(d){
        if(d.error || !d.socket){
          if(logsStatus) logsStatus.textContent = 'Failed to get WebSocket token';
          return;
        }
        try {
          ws = new WebSocket(d.socket);
          ws.onopen = function(){
            // Authenticate with the token from the panel
            ws.send(JSON.stringify({event:'auth', args:[d.token]}));
            if(logsStatus) logsStatus.textContent = '● Connected';
            if(logsConnect) logsConnect.style.display = 'none';
            if(logsDisconnect) logsDisconnect.style.display = 'inline';
            if(logsInputRow) logsInputRow.style.display = 'flex';
          };
          ws.onmessage = function(ev){
            try {
              var msg = JSON.parse(ev.data);
              // Console output lines come as {event:'console output', args:['line1\nline2\n...']}
              if(msg.event === 'console output' && msg.args && msg.args.length){
                var lines = msg.args[0];
                if(logsContainer){
                  lines.split('\n').forEach(function(line){
                    if(!line) return;
                    var d = document.createElement('div');
                    d.textContent = line;
                    logsContainer.appendChild(d);
                  });
                  logsContainer.scrollTop = logsContainer.scrollHeight;
                  if(logsContainer.children.length > 500) {
                    while(logsContainer.children.length > 350) logsContainer.removeChild(logsContainer.firstChild);
                  }
                }
              }
              // Token expiry — reconnect
              if(msg.event === 'token expiring'){
                fetch('/console.php?action=ws&server=' + server + '&pass=' + encodeURIComponent(PASS))
                .then(function(r2){ return r2.json(); })
                .then(function(d2){
                  if(d2.token) ws.send(JSON.stringify({event:'auth', args:[d2.token]}));
                });
              }
            } catch(e2){}
          };
          ws.onclose = function(){
            if(logsStatus) logsStatus.textContent = 'Disconnected';
            if(logsConnect) logsConnect.style.display = 'inline';
            if(logsDisconnect) logsDisconnect.style.display = 'none';
            if(logsInputRow) logsInputRow.style.display = 'none';
            ws = null;
          };
          ws.onerror = function(){
            if(logsStatus) logsStatus.textContent = 'Connection error';
          };
        } catch(e){
          if(logsStatus) logsStatus.textContent = 'Connection failed';
        }
      });
    });

  if(logsDisconnect) logsDisconnect.addEventListener('click', function(){
    if(ws) { ws.close(); ws = null; }
  });

  if(logsCmdSend) logsCmdSend.addEventListener('click', function(){
      if(!logsCmdInput) return;
      var cmd = logsCmdInput.value.trim();
      if(!cmd) return;
      var server = logsServer ? logsServer.value : 'palworld';
      fetch('/console.php?action=command&server=' + encodeURIComponent(server) + '&cmd=' + encodeURIComponent(cmd) + '&pass=' + encodeURIComponent(PASS))
      .then(function(){ logsCmdInput.value = ''; });
    });

  if(logsCmdInput) logsCmdInput.addEventListener('keydown', function(e){
    if(e.key === 'Enter' && logsCmdSend) logsCmdSend.click();
  });

  // ─── System Status ───
  // (loads from status.php, data fed by agent on Proxmox)
  g('tabStatus') && setTimeout(function(){
    var nodes = g('statusNodes');
    var empty = g('statusEmpty');
    if(!nodes) return;
    (async function loadStatus(){
      try {
        var r = await fetch('/status.php?read=1&pass=' + encodeURIComponent(PASS), {signal:AbortSignal.timeout(5000)});
        var data = await r.json();
        var list = data.nodes || [];
        if(empty) empty.style.display = 'none';
        if(list.length === 0){
          if(empty){ empty.style.display = 'block'; empty.textContent = 'No system agents reporting yet. Install the agent on your Proxmox host.'; }
          return;
        }
        nodes.innerHTML = list.map(function(n){
                  function g(pct, color){
                    pct = Math.min(Math.max(pct||0, 0), 100);
                    var r=36, cx=50, cy=48;
                    var circ = Math.PI * r;
                    var offset = circ * (1 - pct/100);
                    return '<svg viewBox="0 0 100 58" class="sys-gauge"><circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="#1a1a1a" stroke-width="7" stroke-dasharray="'+circ+'" stroke-dashoffset="0" transform="rotate(180 '+cx+' '+cy+')"/><circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+color+'" stroke-width="7" stroke-linecap="round" stroke-dasharray="'+circ+'" stroke-dashoffset="'+offset+'" transform="rotate(180 '+cx+' '+cy+')"/><text x="'+cx+'" y="'+ (cy+6) +'" text-anchor="middle" fill="#fff" font-size="17" font-weight="700" font-family="var(--font-mono)">'+pct+'%</text></svg>';
                  }
                  return '<div class="server-card gauge-card"><div class="server-name">' + (n.label || 'proxmox') + '</div>' +
                    '<div class="gauge-row">' +
                      '<div class="gauge-cell"><div class="gauge-label">CPU</div>' + g(n.cpu, '#39ff14') + '</div>' +
                      '<div class="gauge-cell"><div class="gauge-label">RAM</div>' + g(n.ram, '#bf00ff') + '</div>' +
                      '<div class="gauge-cell"><div class="gauge-label">DISK</div>' + g(n.disk, '#bf00ff') + '</div>' +
                    '</div>' +
            '<div style="display:flex;gap:16px;margin-top:8px;font-family:var(--font-mono);font-size:.72rem;color:var(--text-muted)">' +
              '<span>🌡️ ' + (n.temp ? n.temp + '°C' : '—') + '</span>' +
              '<span>⏱️ ' + (n.uptime ? Math.floor(n.uptime/86400) + 'd' : '—') + '</span>' +
              '<span>🕐 ' + (n.time || '') + '</span>' +
            '</div></div>';
        }).join('');
      } catch(e){
        if(empty){ empty.style.display = 'block'; empty.textContent = 'System status endpoint unreachable.'; }
      }
    })();
  }, 100);

  // ─── Hash monitoring ───
  window.addEventListener('hashchange', function(){
    if(window.location.hash === '#console' && authed){
      fetchStatus();
      if(!timer) timer = setInterval(fetchStatus, 15000);
    }
  });
})();

// ─── ASSETS / DOWNLOADS ───────────────────────────
;(function(){
  var grid = document.getElementById('assetsGrid');
  var uploadZone = document.getElementById('uploadZone');

  async function loadAssets(){
    if(!grid) return;
    try {
      var r = await fetch('/assets.json');
      var list = await r.json();
      if(!list || list.length === 0){
        grid.innerHTML = '<div id="assets-empty">No assets available yet.</div>';
        return;
      }
      grid.innerHTML = list.map(function(a){
        var icon = '📄';
        if(a.type === 'zip') icon = '📦';
        else if(a.type === 'lua') icon = '📜';
        else if(a.type === 'png') icon = '🖼️';
        var previewHtml = '';
        if(a.preview) previewHtml = '<img class="asset-preview" src="' + a.preview + '" alt="' + a.title + '" loading="lazy" onclick="document.getElementById(\'previewLightbox\').style.display=\'flex\';document.getElementById(\'previewLightbox\').querySelector(\'img\').src=this.src">';
        return '<div class="asset-card">' + previewHtml + '<div class="asset-header"><span class="asset-icon">' + icon + '</span><span class="asset-title">' + a.title + '</span><span class="asset-type">' + (a.type||'') + '</span></div><p class="asset-desc">' + (a.desc||'') + '</p><div class="asset-meta"><span>📏 ' + (a.size||'unknown') + '</span></div><a class="btn btn-primary btn-download" href="/download.php?asset=' + a.id + '">⬇ Download</a></div>';
      }).join('');
    } catch(e){
      grid.innerHTML = '<div id="assets-empty">Could not load assets.</div>';
    }
  }

  // Upload gate
  var uploadGate = document.getElementById('uploadGate');
  var uploadPass = document.getElementById('uploadPass');
  var uploadUnlock = document.getElementById('uploadUnlock');
  var uploadAuthMsg = document.getElementById('uploadAuthMsg');
  var uploadDropzone = document.getElementById('uploadDropzone');
  var uploadFileInput = document.getElementById('uploadFileInput');

  if(uploadUnlock) uploadUnlock.addEventListener('click', function(){
    var val = uploadPass ? uploadPass.value.trim() : '';
    if(!val){ if(uploadAuthMsg) uploadAuthMsg.textContent = 'Enter passkey'; return; }
    var x = new XMLHttpRequest();
    x.open('POST', '/upload.php');
    var fd = new FormData(); fd.append('pass', val);
    x.onload = function(){
      if(x.status === 200){
        if(uploadAuthMsg) uploadAuthMsg.textContent = '✓ Authorized';
        if(uploadPass) uploadPass.style.display = 'none';
        if(uploadUnlock) uploadUnlock.style.display = 'none';
        if(uploadGate) uploadGate.style.display = 'none';
        if(uploadDropzone) uploadDropzone.style.display = 'block';
        loadAssets();
      } else {
        if(uploadAuthMsg) uploadAuthMsg.textContent = 'Wrong passkey';
      }
    };
    x.send(fd);
  });

  if(uploadDropzone){
    uploadDropzone.addEventListener('dragover', function(e){ e.preventDefault(); this.classList.add('dragover'); });
    uploadDropzone.addEventListener('dragleave', function(){ this.classList.remove('dragover'); });
    uploadDropzone.addEventListener('drop', function(e){
      e.preventDefault(); this.classList.remove('dragover');
      [].forEach.call(e.dataTransfer.files, function(f){ uploadFile(f); });
    });
    uploadDropzone.addEventListener('click', function(){ if(uploadFileInput) uploadFileInput.click(); });
    if(uploadFileInput) uploadFileInput.addEventListener('change', function(){ [].forEach.call(this.files, function(f){ uploadFile(f); }); });
  }

  async function uploadFile(file){
    var fd = new FormData();
    fd.append('pass', 'knuckls2026');
    fd.append('file', file);
    fd.append('title', file.name.replace(/\.[^.]+$/, '') || file.name.substring(0, 50));
    try {
      var r = await fetch('/upload.php', {method:'POST', body:fd});
      var d = await r.json();
      if(d && d.ok) loadAssets();
    } catch(e){}
  }

  loadAssets();
})();

// ─── GAME DETAIL OVERLAY ───────────────────────────
;(function(){
  var overlay = document.getElementById('gameOverlay');
  var heroGrad = document.getElementById('gameHeroGradient');
  var heroIcon = document.getElementById('gameHeroIcon');
  var heroTitle = document.getElementById('gameHeroTitle');
  var heroTagline = document.getElementById('gameHeroTagline');
  var ssMain = document.getElementById('gameScreenshotMain');
  var thumbs = document.getElementById('gameThumbnails');
  var desc = document.getElementById('gameDescription');
  var features = document.getElementById('gameFeatures');
  var dev = document.getElementById('gameDev');
  var pub = document.getElementById('gamePub');
  var release = document.getElementById('gameRelease');
  var genre = document.getElementById('gameGenre');
  var players = document.getElementById('gamePlayers');
  var tags = document.getElementById('gameTags');
  var sysReqs = document.getElementById('gameSysReqsList');
  var serverStatus = document.getElementById('gameServerStatus');
  var serverStatusText = document.getElementById('gameServerStatusText');
  var serverAddr = document.getElementById('gameServerAddr');
  var serverBtn = document.getElementById('gameServerBtn');

  window.closeGameOverlay = function(){
    if(overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  };

  window.openGameDetail = function(gameId){
    if(!overlay) return;
    // Fetch game data
    fetch('/games-detail.json')
      .then(function(r){ return r.json(); })
      .then(function(data){
        var game = null;
        for(var i=0; i<data.games.length; i++){
          if(data.games[i].id === gameId){ game = data.games[i]; break; }
        }
        if(!game) return;

        // Hero
        if(heroGrad) heroGrad.style.background = game.heroGradient;
        if(heroIcon) heroIcon.textContent = game.icon;
        if(heroTitle) heroTitle.textContent = game.title;
        if(heroTagline) heroTagline.textContent = game.tagline;

        // Screenshots
        var shots = game.screenshots || [];
        if(ssMain){
          if(shots.length > 0 && shots[0].url){
            ssMain.src = shots[0].url;
            ssMain.alt = shots[0].alt || '';
          } else {
            ssMain.style.display = 'none';
          }
        }
        if(thumbs){
          thumbs.innerHTML = shots.map(function(s, idx){
            var cls = idx === 0 ? 'thumb active' : 'thumb';
            var img = document.createElement('img');
            var html = '<img class="'+cls+'" src="'+(s.thumb||s.url)+'" alt="'+(s.alt||'')+'" data-idx="'+idx+'" onclick="selectGameScreenshot('+idx+')">';
            return html;
          }).join('');
        }

        // Description
        if(desc) desc.textContent = game.description;

        // Features
        if(features){
          features.innerHTML = (game.features||[]).map(function(f){
            return '<li>'+f+'</li>';
          }).join('');
        }

        // Metadata
        if(dev) dev.textContent = game.developer || '—';
        if(pub) pub.textContent = game.publisher || '—';
        if(release) release.textContent = game.releaseDate || '—';
        if(genre) genre.textContent = game.genre || '—';
        if(players) players.textContent = game.players || '—';

        // Tags
        if(tags){
          tags.innerHTML = (game.tags||[]).map(function(t){
            return '<span>'+t+'</span>';
          }).join('');
        }

        // System Requirements
        if(sysReqs){
          var reqs = game.systemRequirements || {};
          var fields = [
            ['OS', reqs.os],
            ['CPU', reqs.cpu],
            ['RAM', reqs.ram],
            ['GPU', reqs.gpu],
            ['Storage', reqs.storage],
            ['DirectX', reqs.directx]
          ];
          sysReqs.innerHTML = fields.filter(function(f){ return f[1]; }).map(function(f){
            return '<div class="reqRow"><span class="reqLabel">'+f[0]+'</span><span class="reqVal">'+f[1]+'</span></div>';
          }).join('');
        }

        // Server status (fetch live from console.php)
        if(serverStatus){
          serverStatus.innerHTML = '<span class="dot checking"></span>';
          if(serverStatusText) serverStatusText.textContent = 'CHECKING';
        }
        if(serverAddr) serverAddr.textContent = game.serverAddress || '';
        if(serverBtn){
          serverBtn.href = '#';
          serverBtn.onclick = function(e){ e.preventDefault(); window.location.href = '#servers'; };
        }

        // Fetch live server status
        (function(){
          var sid = game.serverId;
          if(!sid) return;
          var x = new XMLHttpRequest();
          x.open('GET', '/console.php?action=status&pass=knuckls2026&v=' + Date.now());
          x.onload = function(){
            try {
              var d = JSON.parse(x.responseText);
              var svr = null;
              if(d && d.servers){
                for(var i=0; i<d.servers.length; i++){
                  if(d.servers[i].id === sid){ svr = d.servers[i]; break; }
                }
              }
              if(svr && serverStatus && serverStatusText){
                var isOnline = svr.online;
                serverStatus.innerHTML = '<span class="dot ' + (isOnline ? 'online' : 'offline') + '"></span>';
                serverStatusText.textContent = isOnline ? 'ONLINE' : 'OFFLINE';
                serverStatusText.style.color = isOnline ? 'var(--accent)' : 'var(--red)';
              }
            } catch(e){}
          };
          x.send();
        })();

        // Show overlay
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
      })
      .catch(function(e){ console.log('Game detail load error:', e); });
  }

  window.selectGameScreenshot = function(idx){
    // Read from the hidden cached data via DOM
    var imgs = thumbs ? thumbs.querySelectorAll('.thumb') : [];
    for(var i=0; i<imgs.length; i++){
      imgs[i].classList.toggle('active', i === idx);
      if(i === idx && ssMain){
        ssMain.src = imgs[i].src;
        ssMain.alt = imgs[i].alt;
      }
    }
  };
})();