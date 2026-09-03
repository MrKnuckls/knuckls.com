<?php
/**
 * Download proxy — serves files from local storage or Google Drive
 * Usage: /download.php?asset=test-asset
 * 
 * Local files are stored in assets/files/ and recorded in assets.json
 * Drive files are proxied through Google Drive (source hidden)
 */
header('Cache-Control: public, max-age=86400');

// Read assets.json for metadata
$jsonPath = __DIR__ . '/assets.json';
$assets = [];
if (file_exists($jsonPath)) {
    $all = json_decode(file_get_contents($jsonPath), true);
    if ($all) {
        foreach ($all as $a) {
            $assets[$a['id']] = $a;
        }
    }
}

$key = $_GET['asset'] ?? '';
if (!isset($assets[$key])) {
    http_response_code(404);
    die('Asset not found');
}

$a = $assets[$key];

// Local file
if (isset($a['file'])) {
    $localPath = __DIR__ . '/' . $a['file'];
    if (!file_exists($localPath)) {
        http_response_code(404);
        die('File not found on server');
    }
    $ext = pathinfo($localPath, PATHINFO_EXTENSION);
    $mimeTypes = [
        'zip'  => 'application/zip',
        'rar'  => 'application/x-rar-compressed',
        '7z'   => 'application/x-7z-compressed',
        'png'  => 'image/png',
        'jpg'  => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif'  => 'image/gif',
        'pdf'  => 'application/pdf',
        'cfg'  => 'text/plain',
        'txt'  => 'text/plain',
        'sql'  => 'text/plain',
        'lua'  => 'text/plain',
        'json' => 'application/json',
    ];
    $mime = $mimeTypes[$ext] ?? 'application/octet-stream';
    header("Content-Type: $mime");
    header('Content-Length: ' . filesize($localPath));
    header("Content-Disposition: attachment; filename=\"{$a['title']}.$ext\"");
    readfile($localPath);
    exit;
}

// Google Drive file (legacy)
if (isset($a['drive_id'])) {
    $url = "https://drive.google.com/uc?export=download&id={$a['drive_id']}";
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => false,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_TIMEOUT => 120,
    ]);
    $name = $a['title'] ?? 'download';
    $ext = $a['type'] ?? 'zip';
    header("Content-Disposition: attachment; filename=\"$name.$ext\"");
    curl_exec($ch);
    curl_close($ch);
    exit;
}

http_response_code(404);
die('Asset source not configured');