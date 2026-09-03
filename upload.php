<?php
/**
 * File Upload — password-protected file upload to server
 * POST: multipart form with 'file' and 'pass'
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-cache, no-store, must-revalidate');

$PASS = 'knuckls2026';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['ok' => false, 'msg' => 'POST required']);
    exit;
}

$pass = $_POST['pass'] ?? '';
if ($pass !== $PASS) {
    echo json_encode(['ok' => false, 'msg' => 'unauthorized']);
    exit;
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    $errMsg = 'Upload error';
    if (isset($_FILES['file'])) {
        switch ($_FILES['file']['error']) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                $errMsg = 'File too large (max 2GB)';
                break;
            case UPLOAD_ERR_PARTIAL:
                $errMsg = 'Partial upload — try again';
                break;
            case UPLOAD_ERR_NO_FILE:
                $errMsg = 'No file selected';
                break;
        }
    }
    echo json_encode(['ok' => false, 'msg' => $errMsg]);
    exit;
}

$file = $_FILES['file'];
$origName = basename($file['name']);
$targetDir = __DIR__ . '/uploads';
if (!is_dir($targetDir)) mkdir($targetDir, 0755, true);

// Sanitize filename — keep extension, remove dangerous chars
$ext = pathinfo($origName, PATHINFO_EXTENSION);
$safeName = preg_replace('/[^a-zA-Z0-9_\-.]+/', '_', pathinfo($origName, PATHINFO_FILENAME));
$safeName = substr($safeName, 0, 80) . ($ext ? '.' . $ext : '');
$targetPath = $targetDir . '/' . $safeName;

// Avoid overwrite — append number if exists
$counter = 1;
$finalPath = $targetPath;
while (file_exists($finalPath)) {
    $finalPath = $targetDir . '/' . pathinfo($safeName, PATHINFO_FILENAME) . "_$counter." . $ext;
    $counter++;
}

if (move_uploaded_file($file['tmp_name'], $finalPath)) {
    echo json_encode([
        'ok' => true,
        'name' => basename($finalPath),
        'size' => filesize($finalPath),
        'url'  => '/uploads/' . basename($finalPath),
    ]);
} else {
    echo json_encode(['ok' => false, 'msg' => 'Failed to save file']);
}