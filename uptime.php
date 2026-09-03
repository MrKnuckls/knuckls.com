<?php
/**
 * Uptime Timeline — reads uptime_log.json and returns server-state slots
 * Range: ?range=24h | 7d | 30d
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-cache, no-store, must-revalidate');

$range = $_GET['range'] ?? '24h';
$logFile = __DIR__ . '/uptime_log.json';

if (!file_exists($logFile)) {
    echo json_encode(['slots' => [], 'servers' => ['palworld','starrupture','arma','dayz','hytale']]);
    exit;
}

$entries = [];
$lines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
foreach ($lines as $line) {
    $e = json_decode($line, true);
    if ($e && isset($e['ts'])) $entries[] = $e;
}
if (!$entries) {
    echo json_encode(['slots' => [], 'servers' => ['palworld','starrupture','arma','dayz','hytale']]);
    exit;
}

// Determine time window
$now = time();
switch ($range) {
    case '7d':  $cutoff = $now - 604800; break;
    case '30d': $cutoff = $now - 2592000; break;
    default:    $cutoff = $now - 86400;  break; // 24h
}

$filtered = array_filter($entries, fn($e) => $e['ts'] >= $cutoff);
$filtered = array_values($filtered);

// Sort oldest first
usort($filtered, fn($a,$b) => $a['ts'] - $b['ts']);

// Determine slot interval
$totalSecs = $now - $cutoff;
$numSlots = $totalSecs <= 86400 ? 24 : ($totalSecs <= 604800 ? 42 : 30);
$slotSecs = max(1, intdiv($totalSecs, $numSlots));

$servers = ['palworld','starrupture','arma','dayz','hytale'];

// Build slots
$slots = [];
$slotIndex = 0;
$baseTime = $cutoff;

for ($s = 0; $s < $numSlots; $s++) {
    $slotStart = $baseTime + $s * $slotSecs;
    $slotEnd = $baseTime + ($s + 1) * $slotSecs;
    
    // Find all entries in this slot
    $inSlot = array_filter($filtered, fn($e) => $e['ts'] >= $slotStart && $e['ts'] < $slotEnd);
    
    // Format label
    $label = date('H:i', $slotStart);
    if ($range === '7d') $label = date('D H:i', $slotStart);
    elseif ($range === '30d') $label = date('M j', $slotStart);
    
    $slot = ['_label' => $label];
    foreach ($servers as $srv) {
        $statuses = array_map(fn($e) => $e['servers'][$srv]['online'] ?? null, $inSlot);
        $statuses = array_filter($statuses, fn($v) => $v !== null);
        $slot[$srv] = count($statuses) > 0
            ? (array_sum($statuses) / count($statuses) > 0.5)  // majority vote
            : null;
    }
    $slots[] = $slot;
}

echo json_encode(['slots' => $slots, 'servers' => $servers]);