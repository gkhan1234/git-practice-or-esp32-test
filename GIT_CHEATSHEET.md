# ⚡ The MicroLab: Git, GitHub & ESP32 CLI Reference Guide

## 1. Your Everyday 3-Step Git Routine
Always run these from your main `/Users/thenationalflagcompany/Documents/Projects` folder:

    git add .
    git commit -m "Describe what you added or changed"
    git push

* `git status` — Check which files have been modified or added before you commit.
* Inside Google Antigravity: Click the Source Control icon (3rd icon down on the far-left sidebar), type a commit message, and click Commit & Sync.

---

## 2. Student Code Hub Website (GitHub Pages)
* Live Student Portal URL: [https://gkhan1234.github.io/git-practice-or-esp32-test/](https://gkhan1234.github.io/git-practice-or-esp32-test/)
* GitHub Repo URL: [https://github.com/gkhan1234/git-practice-or-esp32-test](https://github.com/gkhan1234/git-practice-or-esp32-test)
* How to Publish New Student Code:
  1. Create a new folder in the root of `Projects` (e.g., `HC-SR04 Ultrasonic`).
  2. Drop your working `.py`, `.ino`, `.c`, and `README.md` files inside it.
  3. Run the 3-step Git routine (`git add .`, `git commit -m "..."`, `git push`).
  4. The website (`index.html`) automatically detects top-level folders and creates download/copy cards for students while hiding the `unsorted` folder.

---

## 3. Protecting Private Files & Disk Space (`.gitignore`)
Your `.gitignore` file blocks heavy files (`.mp4`, `.pdf`, `.ai`, `venv/`) and private API keys (`**/.env`) from ever uploading to GitHub.

* To edit your ignore list:
    open -a TextEdit .gitignore

* To check for accidentally huge files (+50MB) before pushing:
    find . -type f -size +50M -not -path "./.git/*"

* Emergency History Reset (If an API key or `.env` file ever slips into Git history):
    rm -rf .git
    git init
    git branch -M main
    git config user.name "Gary Khan"
    git config user.email "gkhan1234@gmail.com"
    git add .
    git commit -m "Clean repository start"
    git remote add origin [https://github.com/gkhan1234/git-practice-or-esp32-test.git](https://github.com/gkhan1234/git-practice-or-esp32-test.git)
    git push -f -u origin main

---

## 4. Interacting with ESP32 via Mac Terminal (CLI)
First, find your ESP32 USB serial port:

    ls /dev/cu.*

### For MicroPython (`mpremote`)
* Install once:
    pip3 install mpremote
* Open live REPL serial prompt (Press Ctrl + ] to exit):
    mpremote
* Test-run a script without saving to board:
    mpremote run "DHT10 Code/main.py"
* Copy `main.py` permanently onto the ESP32:
    mpremote cp "DHT10 Code/main.py" :main.py
* List files on the ESP32:
    mpremote ls

### For Arduino C++ (`.ino` Sketches)
* View live `Serial.println` output (To exit: press Ctrl + A, let go, press K, then Y):
    screen /dev/cu.usbserial-XXXX 115200

* Compile & Upload via `arduino-cli`:
    arduino-cli compile --fqbn esp32:esp32:esp32 "DHT10 Code/DHT10_ESP32.ino"
    arduino-cli upload -p /dev/cu.usbserial-XXXX --fqbn esp32:esp32:esp32 "DHT10 Code/DHT10_ESP32.ino"
