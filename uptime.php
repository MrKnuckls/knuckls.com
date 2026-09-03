<?php
/**
 * Uptime Timeline API
 * Reads the uptime log written by console.php and returns aggregated status.
 * 
 * Usage:
 *   /uptime.php?range=24h&server=palworld
 *   /uptime.php?range=7d&server=all
 * 
 * Returns: { server: [{ from, to, online }...] }
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: max-age=60');

$logFile = __DIR__ . '/uptime_log.json';

if (!file_exists($logFile)) {
    echo json_encode(['error' => 'No uptime data yet']);
    exit;
}

$lines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
$entries = [];
foreach ($lines as $line) {
    $d = json_decode($line, true);
    if ($d && isset($d['ts'], $d['servers'])) $entries[] = $d;
}

$range = $_GET['range'] ?? '24h';
$targetServer = $_GET['server'] ?? 'all';
$now = time();

// Time window
switch ($range) {
    case '7d':  $window = 7 * 86400; break;
    case '30d': $window = 30 * 86400; break;
    case '24h':
    default:    $window = 86400; break;
}

// Bar count (resolve to ~1 bar per Nth minutes)
$barCount = $range === '24h' ? 24 : ($range === '7d' ? 28 : 30);
$barDuration = $window / $barCount;

// Filter entries within window
$cutoff = $now - $window;
$filtered = array_filter($entries, fn($e) => $e['ts'] >= $cutoff);
$filtered = array_values($filtered);

// If no data, return empty
if (empty($filtered)) {
    echo json_encode(['range' => $range, 'servers' => []]);
    exit;
}

// Build timeline bars
$servers = [];
$lastState = [];
foreach ($filtered as $e) {
    foreach ($e['servers'] as $sid => $info) {
        // Support both old format (bool) and new format ({online, cpu, ram})
        $online = is_bool($info) ? $info : ($info['online'] ?? false);
        if ($targetServer !== 'all' && $sid !== $targetServer) continue;
        if (!isset($servers[$sid])) $servers[$sid] = [];
        if (!isset($lastState[$sid])) {
            $lastState[$sid] = $online;
            continue;
        }
        $servers[$sid][] = ['ts' => $e['ts'], 'online' => $online];
    }
}

// Aggregate into bars
$result = [];
foreach ($servers as $sid => $points) {
    $bars = [];
    for ($i = 0; $i < $barCount; $i++) {
        $barStart = $now - $window + ($i * $barDuration);
        $barEnd = $barStart + $barDuration;
        // Check if any point in this window was online
        $onlineInBar = false;
        $hasData = false;
        foreach ($points as $p) {
            if ($p['ts'] >= $barStart && $p['ts'] < $barEnd) {
                $hasData = true;
                if ($p['online']) { $onlineInBar = true; break; }
            }
        }
        $bars[] = [
            'from' => (int)$barStart,
            'to'   => (int)$barEnd,
            'online' => $hasData ? $onlineInBar : null, // null = no data
        ];
    }
    $result[$sid] = $bars;
}

echo json_encode([
    'range' => $range,
    'window' => $window,
    'barCount' => $barCount,
    'now' => $now,
    'servers' => $result,
]);