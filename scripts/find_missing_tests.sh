#!/usr/bin/sh
cd ../lib
find . -type d | rg -v node_modules > /tmp/wgsg_lib_dirs.txt
cd ../tests
find . -type d | rg -v node_modules > /tmp/wgsg_tests_dirs.txt
diff /tmp/wgsg_lib_dirs.txt /tmp/wgsg_tests_dirs.txt
rm -f /tmp/wgsg_lib_dirs.txt /tmp/wgsg_tests_dirs.txt
