<?php
/**
 * Server status ping script
 * Called from JS: fetch('/ping.php?host=X&port=Y')
 * Returns JSON: { online: bool, players: int|null, max_players: int|null }
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$host = $_GET['host'] ?? '127.0.0.1';
$port = (int)($_GET['port'] ?? 0);

if ($port <= 0) {
    echo json_encode(['online' => false, 'players' => null, 'max_players' => null]);
    exit;
}

// Try TCP socket connect (timeout 3s)
$errno = 0;
$errstr = '';
$fp = @fsockopen($host, $port, $errno, $errstr, 3);

if ($fp) {
    fclose($fp);
    echo json_encode([
        'online' => true,
        'players' => rand(1, 48),   // placeholder — replace with actual query logic per game
        'max_players' => 64
    ]);
} else {
    echo json_encode([
        'online' => false,
        'players' => null,
        'max_players' => null
    ]);
}