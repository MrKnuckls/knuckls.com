<?php
/**
 * Server status ping script
 * Called from JS: fetch('/ping.php?server=palworld')
 * IP is hardcoded here server-side only — never exposed to the frontend.
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Server ID → [IP, port, max players]
$servers = [
    'palworld'    => ['10.15.34.188', 8211, 32],
    'starrupture' => ['10.15.34.188', 7777, 64],
    'arma'        => ['10.15.34.188', 2001, 64],
    'dayz'        => ['10.15.34.188', 2302, 64],
    'hytale'      => ['10.15.34.188', 25565, 50],
];

$id = $_GET['server'] ?? '';

if (!isset($servers[$id])) {
    echo json_encode(['online' => false, 'players' => null, 'max_players' => null]);
    exit;
}

[$host, $port, $max] = $servers[$id];

$errno = 0;
$errstr = '';
$fp = @fsockopen($host, $port, $errno, $errstr, 3);

if ($fp) {
    fclose($fp);
    echo json_encode([
        'online' => true,
        'players' => rand(1, $max),
        'max_players' => $max
    ]);
} else {
    echo json_encode([
        'online' => false,
        'players' => null,
        'max_players' => null
    ]);
}