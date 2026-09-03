<?php
/**
 * Resource History — reads uptime_log.json and returns chart data
 * ?server=palworld&range=24h
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-cache, no-store, must-revalidate');

$server = $_GET['server'] ?? 'palworld';
$range  = $_GET['range'] ?? '24h';
$logFile = __DIR__ . '/uptime_log.json';

$valid = ['palworld','starrupture','arma','dayz','hytale'];
if (!in_array($server, $valid)) {
    echo json_encode(['points' => [], 'error' => 'invalid server']);
    exit;
}

$entries = [];
if (file_exists($logFile)) {
    $lines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $e = json_decode($line, true);
        if ($e && isset($e['ts'])) $entries[] = $e;
    }
}

$now = time();
switch ($range) {
    case '7d':  $cutoff = $now - 604800; break;
    case '30d': $cutoff = $now - 2592000; break;
    default:    $cutoff = $now - 86400;  break;
}

$filtered = array_values(array_filter($entries, fn($e) => $e['ts'] >= $cutoff));
usort($filtered, fn($a,$b) => $a['ts'] - $b['ts']);

// Sample down — max ~120 points for display
$maxPoints = 120;
$step = count($filtered) > $maxPoints ? intdiv(count($filtered), $maxPoints) : 1;
$sampled = [];
for ($i = 0; $i < count($filtered); $i += $step) {
    $e = $filtered[$i];
    $sr = $e['servers'][$server] ?? null;
    if ($sr === null) continue;
    $label = date('H:i', $e['ts']);
    if ($range === '7d') $label = date('D H:i', $e['ts']);
    elseif ($range === '30d') $label = date('M j', $e['ts']);
    $sampled[] = [
        't'   => $label,
        'cpu' => round($sr['cpu'] ?? 0, 1),
        'ram' => round(($sr['ram'] ?? 0) / 1048576, 1),  // bytes → MB
    ];
}

echo json_encode(['points' => $sampled]);