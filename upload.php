<?php
/**
 * Upload endpoint for Quick File Uploader
 * Password-gated. Receives files, stores in assets/files/, updates assets.json
 * 
 * Usage:
 *   POST /upload.php
 *     pass=<password>
 *     file=<uploaded file>
 *     title=<display name> (optional, defaults to filename)
 *     desc=<description> (optional)
 * 
 * Returns JSON: { ok: true/false, msg: "...", id: "..." }
 */

error_reporting(0);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$PASS = 'knuckls2026';
$ASSETS_FILE = __DIR__ . '/assets.json';
$FILES_DIR = __DIR__ . '/assets/files';

// Auth
$pass = $_POST['pass'] ?? $_GET['pass'] ?? '';
if ($pass !== $PASS) {
    echo json_encode(['ok' => false, 'msg' => 'Invalid passkey']);
    exit;
}

// Handle file upload
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_FILES['file'])) {
    echo json_encode(['ok' => false, 'msg' => 'No file sent']);
    exit;
}

$file = $_FILES['file'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['ok' => false, 'msg' => 'Upload error code: ' . $file['error']]);
    exit;
}

// Max 100MB
if ($file['size'] > 100 * 1024 * 1024) {
    echo json_encode(['ok' => false, 'msg' => 'File too large (max 100MB)']);
    exit;
}

// Create dirs
if (!is_dir($FILES_DIR)) {
    mkdir($FILES_DIR, 0755, true);
}

// Generate safe filename
$origName = $file['name'];
$ext = pathinfo($origName, PATHINFO_EXTENSION);
$safeName = preg_replace('/[^a-zA-Z0-9._-]/', '_', pathinfo($origName, PATHINFO_FILENAME));
if (!$safeName) $safeName = 'asset';
$fileName = $safeName . '-' . time() . '.' . $ext;
$destPath = $FILES_DIR . '/' . $fileName;

if (!move_uploaded_file($file['tmp_name'], $destPath)) {
    echo json_encode(['ok' => false, 'msg' => 'Failed to save file']);
    exit;
}

// Build asset ID
$assetId = strtolower(preg_replace('/[^a-zA-Z0-9]/', '-', $safeName)) . '-' . time();
$title = $_POST['title'] ?: pathinfo($origName, PATHINFO_FILENAME);
$desc = $_POST['desc'] ?: '';
$sizeMb = round($file['size'] / 1024 / 1024, 1) . ' MB';

$newAsset = [
    'id'    => $assetId,
    'title' => $title,
    'desc'  => $desc,
    'type'  => strtolower($ext),
    'size'  => $sizeMb,
    'file'  => 'assets/files/' . $fileName,
    'date'  => date('Y-m-d'),
];

// Read existing assets.json
$existing = [];
if (file_exists($ASSETS_FILE)) {
    $content = file_get_contents($ASSETS_FILE);
    $existing = json_decode($content, true) ?: [];
}
$existing[] = $newAsset;

file_put_contents($ASSETS_FILE, json_encode($existing, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo json_encode([
    'ok'   => true,
    'msg'  => 'Uploaded successfully',
    'id'   => $assetId,
    'file' => $newAsset['file'],
    'size' => $sizeMb,
]);