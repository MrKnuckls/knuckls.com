<?php
/**
 * Resource History API
 * Returns CPU/RAM data points from uptime log.
 * 
 * Usage: /resources.php?server=palworld&range=24h
 * Returns: { server: string, range: string, points: [{ ts, cpu, ram, online }] }
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: max-age=60');

$logFile = __DIR__ . '/uptime_log.json';

if (!file_exists($logFile)) {
    echo json_encode(['error' => 'No data yet']);
    exit;
}

$lines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
$entries = [];
foreach ($lines as $line) {
    $d = json_decode($line, true);
    if ($d && isset($d['ts'], $d['servers'])) $entries[] = $d;
}

$server = $_GET['server'] ?? 'palworld';
$range = $_GET['range'] ?? '24h';
$now = time();

switch ($range) {
    case '7d':  $window = 7 * 86400; break;
    case '30d': $window = 30 * 86400; break;
    default:    $window = 86400;
}

$cutoff = $now - $window;
$filtered = array_filter($entries, fn($e) => $e['ts'] >= $cutoff);
$filtered = array_values($filtered);

$points = [];
foreach ($filtered as $e) {
    if (!isset($e['servers'][$server])) continue;
    $info = $e['servers'][$server];
    // Old format (bool) has no resource data
    if (is_bool($info)) continue;
    $points[] = [
        'ts'     => $e['ts'],
        'cpu'    => round($info['cpu'] ?? 0, 1),
        'ram'    => round(($info['ram'] ?? 0) / 1048576, 1), // bytes to MB
        'online' => $info['online'] ?? false,
    ];
}

// Aggregate into ~N time buckets for chart
$maxPoints = 60;
$aggrPoints = [];
if (count($points) > $maxPoints) {
    $bucketSize = ceil(count($points) / $maxPoints);
    for ($i = 0; $i < count($points); $i += $bucketSize) {
        $bucket = array_slice($points, $i, $bucketSize);
        $aggrPoints[] = [
            'ts'     => end($bucket)['ts'],
            'cpu'    => round(array_sum(array_column($bucket, 'cpu')) / count($bucket), 1),
            'ram'    => round(array_sum(array_column($bucket, 'ram')) / count($bucket), 1),
            'online' => end($bucket)['online'],
        ];
    }
} else {
    $aggrPoints = $points;
}

echo json_encode([
    'server' => $server,
    'range'  => $range,
    'count'  => count($aggrPoints),
    'points' => $aggrPoints,
]);