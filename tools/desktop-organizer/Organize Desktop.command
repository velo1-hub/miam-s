#!/bin/bash
# macOS double-click launcher. Shows the plan first, then asks before moving anything.
cd "$(dirname "$0")"
python3 organize_desktop.py || { echo; echo "Python 3 is required. Install it from https://www.python.org/downloads/ and run again."; read -r -p "Press Enter to close"; exit 1; }
echo
read -r -p "Apply this plan? [y/N] " ans
if [ "$ans" = "y" ] || [ "$ans" = "Y" ]; then
  python3 organize_desktop.py --apply
fi
echo
read -r -p "Press Enter to close"
