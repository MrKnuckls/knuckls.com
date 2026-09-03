<?php
/**
 * Command Center backend
 * Password-protected Pterodactyl control panel
 * 
 * Actions:
 *   ?action=status              → JSON of all 5 servers' resources
 *   ?action=power&server=X&signal=start|stop|restart → power action
 *   ?action=auth&pass=X         → { authed: bool }
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-cache, no-store, must-revalidate');

// ─── CONFIG ────────────────────────────────────────
$API_KEY = 'ptlc_QMlMOYzopaXwKn1A9nuRuztLy2Tgy62vNlcn7atfErC';
$PANEL  = 'https://panel.knucklsgames.com';
$PASS   = 'knuckls2026'; // simple password, change this

// Database API (via Cloudflare Tunnel) — set to '' to disable
$DB_API = 'https://api.knucklsgames.com';

// Map server IDs to UUIDs and game
$SERVERS = [
    'palworld'    => ['uuid' => '5f6cb19c', 'game' => 'PalWorld'],
    'starrupture' => ['uuid' => 'c340a836', 'game' => 'StarRupture'],
    'arma'        => ['uuid' => 'cc0defc2', 'game' => 'Arma Reforger'],
    'dayz'        => ['uuid' => '75b834e0', 'game' => 'DayZ'],
    'hytale'      => ['uuid' => '81541d36', 'game' => 'Hytale'],
];

// ─── HELPERS ───────────────────────────────────────
function ptl($method, $endpoint, $body = null) {
    global $API_KEY, $PANEL;
    $ch = curl_init();
    $opts = [
        CURLOPT_URL => $PANEL . $endpoint,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 8,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer $API_KEY",
            'Accept: application/json',
            'Content-Type: application/json',
        ],
    ];
    if ($body) $opts[CURLOPT_POSTFIELDS] = is_string($body) ? $body : json_encode($body);
    curl_setopt_array($ch, $opts);
    $resp = curl_exec($ch);
    $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);
    if ($http !== 200 && $http !== 204) return ['error' => true, 'http' => $http, 'msg' => $err ?: 'HTTP ' . $http];
    $decoded = json_decode($resp, true);
    return $decoded ?: ['ok' => true];
}

// ─── DB API HELPER ─────────────────────────────────
function db_api($endpoint) {
    global $DB_API, $PASS;
    if (!$DB_API) return null;
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $DB_API . $endpoint . (strpos($endpoint, '?') === false ? '?' : '&') . 'key=' . urlencode($PASS),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 5,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);
    $resp = curl_exec($ch);
    $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($http !== 200) return null;
    $decoded = json_decode($resp, true);
    return $decoded;
}

// ─── ACTIONS ───────────────────────────────────────
$action = $_GET['action'] ?? '';

// Public blog endpoint (no auth required)
if ($action === 'blog') {
    $db = db_api('/blog');
    if ($db && is_array($db)) {
        echo json_encode($db);
        exit;
    }
    // Fallback to flat file
    $file = __DIR__ . '/blog.json';
    $data = file_exists($file) ? file_get_contents($file) : '[]';
    echo $data;
    exit;
}

// Auth check
if ($action === 'auth') {
    $pass = $_GET['pass'] ?? '';
    echo json_encode(['authed' => $pass === $PASS]);
    exit;
}

// Every other action requires auth
$pass = $_GET['pass'] ?? '';
if ($pass !== $PASS) {
    echo json_encode(['error' => 'unauthorized']);
    exit;
}

// Status — fetch all server resources
if ($action === 'status') {
    $result = [];
    foreach ($SERVERS as $id => $info) {
        $data = ptl('GET', "/api/client/servers/{$info['uuid']}/resources");
        if (isset($data['error'])) {
            $result[$id] = [
                'online' => false,
                'game'   => $info['game'],
                'error'  => $data['msg'] ?? 'unknown',
            ];
            continue;
        }
        $attrs   = $data['attributes'] ?? [];
        $state   = $attrs['current_state'] ?? 'offline';
        $usage   = $attrs['resources'] ?? [];
        $result[$id] = [
            'online'     => $state === 'running',
            'state'      => $state,
            'game'       => $info['game'],
            'cpu'        => $usage['cpu_absolute'] ?? 0,
            'ram'        => $usage['memory_bytes'] ?? 0,
            'ram_limit'  => $usage['memory_limit_bytes'] ?? 0,
            'disk'       => $usage['disk_bytes'] ?? 0,
            'disk_limit' => $usage['disk_limit_bytes'] ?? 0,
        ];
    }
    echo json_encode($result);

    // ─── UPTIME LOGGING ─────────────────────────────
    $state = [];
    foreach ($result as $id => $s) {
        $state[$id] = [
            'online' => $s['online'] ?? false,
            'cpu'    => $s['cpu'] ?? 0,
            'ram'    => $s['ram'] ?? 0,
        ];
    }
    $logEntry = json_encode(['ts' => time(), 'servers' => $state]) . "\n";
    $logFile = __DIR__ . '/uptime_log.json';
    // Keep log to ~30KB (~500 checkpoints) by trimming oldest entries
    $maxLines = 500;
    $existing = file_exists($logFile) ? file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) : [];
    $existing[] = $logEntry;
    if (count($existing) > $maxLines) {
        $existing = array_slice($existing, -$maxLines);
    }
    file_put_contents($logFile, implode("\n", $existing) . "\n");

    exit;
}

// Power action
if ($action === 'power') {
    $server = $_GET['server'] ?? '';
    $signal = $_GET['signal'] ?? '';
    if (!isset($SERVERS[$server])) {
        echo json_encode(['error' => 'invalid server']);
        exit;
    }
    if (!in_array($signal, ['start', 'stop', 'restart', 'kill'])) {
        echo json_encode(['error' => 'invalid signal']);
        exit;
    }
    $uuid = $SERVERS[$server]['uuid'];
    $resp = ptl('POST', "/api/client/servers/$uuid/power", ['signal' => $signal]);
    echo json_encode(['ok' => !isset($resp['error']), 'msg' => "$signal sent to $server"]);
    exit;
}

// WebSocket token — returns token + websocket endpoint for browser-side live console
if ($action === 'ws') {
    $server = $_GET['server'] ?? '';
    if (!isset($SERVERS[$server])) {
        echo json_encode(['error' => 'invalid server']);
        exit;
    }
    $uuid = $SERVERS[$server]['uuid'];
    $data = ptl('GET', "/api/client/servers/$uuid/websocket");
    if (isset($data['error'])) {
        echo json_encode(['error' => 'failed to get websocket token']);
        exit;
    }
    // The token endpoint returns { data: { token, socket } }
    $wsData = $data['data'] ?? [];
    echo json_encode([
        'token'  => $wsData['token'] ?? '',
        'socket' => $wsData['socket'] ?? '',
        'server' => $server,
    ]);
    exit;
}

// Send console command
if ($action === 'command') {
    $server = $_GET['server'] ?? '';
    $cmd = $_GET['cmd'] ?? '';
    if (!isset($SERVERS[$server]) || !$cmd) {
        echo json_encode(['error' => 'invalid server or empty command']);
        exit;
    }
    $uuid = $SERVERS[$server]['uuid'];
    $resp = ptl('POST', "/api/client/servers/$uuid/command", ['command' => $cmd]);
    echo json_encode(['ok' => !isset($resp['error']), 'msg' => "Command sent"]);
    exit;
}

// ─── ADMIN: Pages ──────────────────────────────────
if ($action === 'admin_pages_read') {
    $db = db_api('/config');
    if ($db && isset($db['pages'])) {
        echo json_encode($db);
        exit;
    }
    $file = __DIR__ . '/site-config.json';
    if (file_exists($file)) {
        echo file_get_contents($file);
    } else {
        echo json_encode(['pages' => [
            'hero_tagline' => "Gamer. Server host. Lab rat.",
            'hero_desc' => "Shaun (aka MrKnuckls) — running game servers, building projects, and home-labbin' it in Dayton, OH.",
            'about_text' => "I'm a gamer, server admin, and hobbyist developer based in Dayton, Ohio. I run game servers for PalWorld, StarRupture, Arma Reforger, DayZ, and Hytale. When I'm not keeping servers alive, I'm working on projects like Knuckls OS, the SanRoque game in Unity 6, or tinkering with my home lab.",
            'footer_text' => "Built with ☕ and ❤️ by Shaun (MrKnuckls). Powered by Hermes Agent.",
        ]]);
    }
    exit;
}
if ($action === 'admin_pages_save') {
    $body = json_decode(file_get_contents('php://input'), true);
    file_put_contents(__DIR__ . '/site-config.json', json_encode($body, JSON_PRETTY_PRINT));
    echo json_encode(['ok' => true]);
    exit;
}

// ─── ADMIN: Servers ─────────────────────────────────
if ($action === 'admin_servers_read') {
    $db = db_api('/servers');
    if ($db && isset($db['servers'])) {
        echo json_encode($db);
        exit;
    }
    $file = __DIR__ . '/servers-config.json';
    if (file_exists($file)) {
        echo file_get_contents($file);
    } else {
        $defaults = [
            ['id'=>'palworld','name'=>'Knuckls Palworld','game'=>'PalWorld','desc'=>'😮 Casual/co-op | Max Pals enabled | Friendly base building'],
            ['id'=>'starrupture','name'=>'Knuckls_StarRupture','game'=>'StarRupture','desc'=>'🌟 Extraction survival | PvPvE | Sci-fi frontier'],
            ['id'=>'arma','name'=>'Knuckls Arma Reforger Server','game'=>'Arma Reforger','desc'=>'⚔️ Realism milsim | Modded | Tactical operations'],
            ['id'=>'dayz','name'=>'Knuckls DayZ Server','game'=>'DayZ','desc'=>'🧟 Survival | PvPvE | Chernarus+'],
            ['id'=>'hytale','name'=>'Knuckls Hytale Server','game'=>'Hytale','desc'=>'🏰 Adventure | Early access | Community builds'],
        ];
        echo json_encode(['servers' => $defaults]);
    }
    exit;
}
if ($action === 'admin_servers_save') {
    $body = json_decode(file_get_contents('php://input'), true);
    file_put_contents(__DIR__ . '/servers-config.json', json_encode($body, JSON_PRETTY_PRINT));
    echo json_encode(['ok' => true]);
    exit;
}

// ─── ADMIN: Assets ──────────────────────────────────
if ($action === 'admin_assets_read') {
    $db = db_api('/assets');
    if ($db && isset($db['assets'])) {
        echo json_encode($db);
        exit;
    }
    $file = __DIR__ . '/assets.json';
    $data = file_exists($file) ? file_get_contents($file) : '[]';
    echo json_encode(['assets' => json_decode($data, true) ?: []]);
    exit;
}
if ($action === 'admin_assets_save') {
    $body = json_decode(file_get_contents('php://input'), true);
    file_put_contents(__DIR__ . '/assets.json', json_encode($body['assets'] ?? [], JSON_PRETTY_PRINT));
    echo json_encode(['ok' => true]);
    exit;
}

// ─── ADMIN: Blog ────────────────────────────────────
if ($action === 'admin_blog_read') {
    $db = db_api('/blog');
    if ($db && is_array($db)) {
        echo json_encode(['posts' => $db]);
        exit;
    }
    $file = __DIR__ . '/blog-posts.json';
    $data = file_exists($file) ? file_get_contents($file) : '[]';
    echo json_encode(['posts' => json_decode($data, true) ?: []]);
    exit;
}
if ($action === 'admin_blog_save') {
    $body = json_decode(file_get_contents('php://input'), true);
    file_put_contents(__DIR__ . '/blog-posts.json', json_encode($body['posts'] ?? [], JSON_PRETTY_PRINT));
    echo json_encode(['ok' => true]);
    exit;
}

// ─── ADMIN: Theme ───────────────────────────────────
if ($action === 'admin_theme_read') {
    $file = __DIR__ . '/theme.json';
    if (file_exists($file)) {
        echo file_get_contents($file);
    } else {
        echo json_encode(['theme' => [
            'accent' => '#39d353',
            'secondary' => '#ffb000',
            'bg' => '#0d1117',
            'surface' => '#161b22',
            'text' => '#e6edf3',
        ]]);
    }
    exit;
}
if ($action === 'admin_theme_save') {
    $body = json_decode(file_get_contents('php://input'), true);
    file_put_contents(__DIR__ . '/theme.json', json_encode($body, JSON_PRETTY_PRINT));
    echo json_encode(['ok' => true]);
    exit;
}

// Fallback
echo json_encode(['error' => 'unknown action']);