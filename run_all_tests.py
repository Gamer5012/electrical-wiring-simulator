import subprocess
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

tests = ['test_simulator.py', 'test_mobile.py', 'test_mobile_scroll.py', 'test_touch_wiring.py', 'test_exam_mode.py', 'test_minuterie.py']
all_passed = True

for t in tests:
    print(f"Running {t}...")
    res = subprocess.run([sys.executable, t], capture_output=True, encoding='utf-8', errors='replace')
    if res.returncode != 0:
        print(f"FAILED {t}:\n{res.stderr}\n{res.stdout}")
        all_passed = False
        break
    else:
        print(f">>> {t} PASSED 100%!")

if all_passed:
    print("\n======================================")
    print("ALL 6 TEST SUITES PASSED 100%!")
    print("======================================")
else:
    sys.exit(1)
