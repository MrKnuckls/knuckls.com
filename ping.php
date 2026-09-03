<?php
/**
 * Server status via Pterodactyl Client API
 * Called from JS: fetch('/ping.php?server=palworld')
 * Returns JSON: { online: bool, players: int|null, max_players: int|null }
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-cache, no-store, must-revalidate');

$apiKey = 'ptlc_QMlMOYzopaXwKn1A9nuRuztLy2Tgy62vNlcn7atfErC';

$servers = [
    'palworld'    => ['5f6cb19c', 32],
    'starrupture' => ['c340a836', 64],
    'arma'        => ['cc0defc2', 32],
    'dayz'        => ['75b834e0', 60],
    'hytale'      => ['81541d36', 50],
];

$id = $_GET['server'] ?? '';
if (!isset($servers[$id])) {
    echo json_encode(['online' => false, 'players' => null, 'max_players' => null]);
    exit;
}

[$uuid, $maxPlayers] = $servers[$id];

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => "https://panel.knucklsgames.com/api/client/servers/{$uuid}/resources",
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer {$apiKey}",
        'Accept: application/json',
        'Content-Type: application/json',
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 6,
    CURLOPT_SSL_VERIFYPEER => false,
]);

$resp = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr = curl_error($ch);
curl_close($ch);

if ($httpCode !== 200 || $resp === false) {
    echo json_encode([
        'online' => false,
        'players' => null,
        'max_players' => $maxPlayers,
    ]);
    exit;
}

$data = json_decode($resp, true);
$state = $data['attributes']['current_state'] ?? 'offline';
$online = $state === 'running';

echo json_encode([
    'online' => $online,
    'players' => $online ? 0 : null,
    'max_players' => $maxPlayers,
]);