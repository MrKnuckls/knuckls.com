<?php
/**
 * Download proxy — hides Google Drive source
 * Usage: /download.php?asset=palworld-hud
 * Serves the file from Drive, user sees only knuckls.com
 */
header('Cache-Control: public, max-age=86400');

$assets = [
    'test-asset' => [
        'id'   => '1Un4Z7dQGmVSuC1alnGfCQmrqTZMl8RNb',
        'name' => 'Test Asset',
        'type' => 'application/zip',
    ],
];

$key = $_GET['asset'] ?? '';
if (!isset($assets[$key])) {
    http_response_code(404);
    die('Asset not found');
}

$a = $assets[$key];
$url = "https://drive.google.com/uc?export=download&id={$a['id']}";

// Fetch with follow redirects (Drive gives a confirmation page for large files)
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => false,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_TIMEOUT => 120,
]);

// Pass through the file to the browser
header("Content-Type: {$a['type']}");
header("Content-Disposition: attachment; filename=\"{$a['name']}.zip\"");
curl_exec($ch);
curl_close($ch);