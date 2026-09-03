<?php
header('Content-Type: text/plain');
echo "DNS lookup for panel.knucklsgames.com:\n";
$ips = gethostbynamel('panel.knucklsgames.com');
if ($ips) { foreach($ips as $ip) echo "  $ip\n"; }
else { echo "  FAILED\n"; }
echo "\nTrying TCP connect to panel.knucklsgames.com:443...\n";
$fp = @fsockopen('panel.knucklsgames.com', 443, $errno, $errstr, 5);
if ($fp) { echo "CONNECTED OK\n"; fclose($fp); }
else { echo "FAILED: $errstr\n"; }
echo "\nTrying curl to Pterodactyl API...\n";
$ch = curl_init('https://panel.knucklsgames.com/api/client/account');
curl_setopt_array($ch, [
    CURLOPT_HTTPHEADER => ['Authorization: Bearer ptlc_4hVo6A1svgkXu07eSR3cNfL6L0WOoQ4YGXdgwwAO87X', 'Accept: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 8,
    CURLOPT_SSL_VERIFYPEER => false,
]);
$r = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "HTTP $code\n";
if ($r) echo substr($r, 0, 500);
