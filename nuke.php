<?php
// Quick nuke - delete wp-content and wp-includes server-side
function rrmdir($dir) {
    if (!is_dir($dir)) return;
    $files = array_diff(scandir($dir), ['.', '..']);
    foreach ($files as $f) {
        $p = "$dir/$f";
        is_dir($p) ? rrmdir($p) : unlink($p);
    }
    rmdir($dir);
}

rrmdir(__DIR__ . '/wp-content');
rrmdir(__DIR__ . '/wp-includes');

// Also delete leftover wp-* root files
$root_files = [
    'index.php', 'wp-config.php', 'wp-config-sample.php',
    'wp-blog-header.php', 'wp-comments-post.php', 'wp-cron.php',
    'wp-links-opml.php', 'wp-load.php', 'wp-login.php', 'wp-mail.php',
    'wp-settings.php', 'wp-signup.php', 'wp-activate.php', 'wp-trackback.php',
    'xmlrpc.php', 'license.txt', 'readme.html'
];
foreach ($root_files as $f) {
    $p = __DIR__ . '/' . $f;
    if (file_exists($p)) unlink($p);
}

echo "OK";