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
$API_KEY = 'ptlc_4hVo6A1svgkXu07eSR3cNfL6L0WOoQ4YGXdgwwAO87X';
$PANEL  = 'https://panel.knucklsgames.com';
$PASS   = 'knuckls2026'; // simple password, change this

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

// ─── ACTIONS ───────────────────────────────────────
$action = $_GET['action'] ?? '';

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

// Fallback
echo json_encode(['error' => 'unknown action']);