<?php
$extensions = get_loaded_extensions();
echo "Loaded extensions:\n";
foreach ($extensions as $extension) {
    if (stripos($extension, 'mysql') !== false || stripos($extension, 'pdo') !== false) {
        echo "- $extension\n";
    }
}
?>