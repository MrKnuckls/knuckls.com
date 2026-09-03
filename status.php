<?php
/**
 * System Status endpoint
 * Receives stats from the home lab agent, serves aggregated view
 * 
 * POST /status.php (agent writes):
 *   pass=<password>
 *   cpu=<%>
 *   ram=<%>
 *   disk=<%>
 *   temp=<°C>
 *   uptime=<seconds>
 *   label=<string> (e.g. "proxmox", "nas")
 * 
 * GET /status.php?pass=<pass> (dashboard reads):
 *   Returns { ok: true, nodes: [{ label, cpu, ram, disk, temp, uptime, ts, ... }] }
 */

error_reporting(0);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$PASS = 'knuckls2026';
$LOG = __DIR__ . '/status_log.json';

// Auth
$pass = $_POST['pass'] ?? $_GET['pass'] ?? '';
if ($pass !== $PASS) {
    echo json_encode(['ok' => false, 'msg' => 'Invalid passkey']);
    exit;
}

// Read existing log
$log = [];
if (file_exists($LOG)) {
    $log = json_decode(file_get_contents($LOG), true) ?: [];
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Agent write
    $ts = time();
    $entry = [
        'ts'     => $ts,
        'label'  => $_POST['label'] ?? 'host',
        'cpu'    => floatval($_POST['cpu'] ?? 0),
        'ram'    => floatval($_POST['ram'] ?? 0),
        'disk'   => floatval($_POST['disk'] ?? 0),
        'temp'   => floatval($_POST['temp'] ?? 0),
        'uptime' => intval($_POST['uptime'] ?? 0),
    ];
    
    // Keep only last 1440 entries per label (~24h at 1/min)
    $log[] = $entry;
    $keep = [];
    $counts = [];
    foreach (array_reverse($log) as $e) {
        $l = $e['label'];
        if (!isset($counts[$l])) $counts[$l] = 0;
        if ($counts[$l] < 1440) {
            $keep[] = $e;
            $counts[$l]++;
        }
    }
    $log = array_reverse($keep);
    file_put_contents($LOG, json_encode($log));
    echo json_encode(['ok' => true, 'msg' => 'Recorded']);
    
} else {
    // Dashboard read — return latest per node + history
    $nodes = [];
    $history = [];
    foreach ($log as $e) {
        $l = $e['label'];
        if (!isset($history[$l])) $history[$l] = [];
        $history[$l][] = $e;
        $nodes[$l] = $e; // overwrite = keep latest
    }
    echo json_encode([
        'ok'      => true,
        'nodes'   => array_values($nodes),
        'history' => $history,
    ]);
}