import asyncio
import json
import subprocess
import time
import base64
import urllib.request
import tempfile
import shutil
import websockets
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 9225
TARGET_URL = "http://localhost:8080/mobile.html"

async def test_touch_wiring():
    temp_dir = tempfile.mkdtemp(prefix="chrome_touch_wiring_")
    print(">>> 1. Launching Chrome Mobile Touch Wiring Verification (390x844)...")
    chrome_proc = subprocess.Popen([
        CHROME_PATH,
        f"--remote-debugging-port={PORT}",
        f"--user-data-dir={temp_dir}",
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--window-size=412,915",
        TARGET_URL
    ])

    ws_url = None
    for attempt in range(25):
        time.sleep(0.5)
        try:
            req = urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json")
            targets = json.loads(req.read().decode())
            for t in targets:
                if t.get("type") == "page":
                    ws_url = t.get("webSocketDebuggerUrl")
                    break
            if ws_url:
                break
        except Exception:
            pass

    if not ws_url:
        chrome_proc.kill()
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise RuntimeError("Failed to connect to Chrome DevTools Protocol")

    async with websockets.connect(ws_url) as ws:
        msg_id = 0

        async def send_cmd(method, params=None):
            nonlocal msg_id
            msg_id += 1
            payload = {"id": msg_id, "method": method}
            if params:
                payload["params"] = params
            await ws.send(json.dumps(payload))
            while True:
                resp = json.loads(await ws.recv())
                if resp.get("id") == msg_id:
                    return resp.get("result", {})

        async def eval_js(expr):
            res = await send_cmd("Runtime.evaluate", {
                "expression": expr,
                "returnByValue": True,
                "awaitPromise": True
            })
            if "exceptionDetails" in res:
                raise RuntimeError(f"JS Exception in '{expr}': {res['exceptionDetails']}")
            return res.get("result", {}).get("value")

        await send_cmd("Page.enable")
        await send_cmd("Runtime.enable")

        # Emulate Mobile Device (iPhone 14, 390x844)
        await send_cmd("Emulation.setTouchEmulationEnabled", {"enabled": True})
        await send_cmd("Emulation.setDeviceMetricsOverride", {
            "width": 390,
            "height": 844,
            "deviceScaleFactor": 3,
            "mobile": True
        })

        await send_cmd("Page.navigate", {"url": TARGET_URL})
        await asyncio.sleep(1.5)

        # Clear any wires
        await eval_js("window.wireRouter.clear()")
        initial_wires = await eval_js("window.wireRouter.wires.length")
        assert initial_wires == 0, "Wires should start empty!"

        # -------------------------------------------------------------
        # TEST A: TAP-TO-WIRE (Click Pin 1 -> Click Pin 2)
        # -------------------------------------------------------------
        print("\n>>> 2. Testing TAP-TO-WIRE: Breaker L -> Switch 1 L...")
        # Get coordinates of q1_L and da1_L
        p1 = await eval_js("window.componentManager.getTerminalById('q1_L')")
        p2 = await eval_js("window.componentManager.getTerminalById('da1_L')")
        print(f"Pin 1 (q1_L): ({p1['x']}, {p1['y']}), Pin 2 (da1_L): ({p2['x']}, {p2['y']})")

        # Tap Pin 1 (simulate touchstart + touchend)
        await eval_js(f"""(() => {{
            const c = document.getElementById('mobileCircuitCanvas');
            const rect = c.getBoundingClientRect();
            const touch1 = new Touch({{
                identifier: 1,
                target: c,
                clientX: rect.left + {p1['x']},
                clientY: rect.top + {p1['y']}
            }});
            c.dispatchEvent(new TouchEvent('touchstart', {{ touches: [touch1], changedTouches: [touch1], cancelable: true }}));
            c.dispatchEvent(new TouchEvent('touchend', {{ touches: [], changedTouches: [touch1], cancelable: true }}));
        }})()""")

        is_connecting = await eval_js("window.mobileApp.isConnecting")
        print(f"isConnecting after tapping Pin 1: {is_connecting}")
        assert is_connecting == True, "Mobile app must be in connecting state!"

        # Tap an empty area or off-center by 20px - must NOT cancel connection!
        await eval_js(f"""(() => {{
            const c = document.getElementById('mobileCircuitCanvas');
            const rect = c.getBoundingClientRect();
            const touchMiss = new Touch({{
                identifier: 2,
                target: c,
                clientX: rect.left + 50,
                clientY: rect.top + 200
            }});
            c.dispatchEvent(new TouchEvent('touchstart', {{ touches: [touchMiss], changedTouches: [touchMiss], cancelable: true }}));
            c.dispatchEvent(new TouchEvent('touchend', {{ touches: [], changedTouches: [touchMiss], cancelable: true }}));
        }})()""")

        still_connecting = await eval_js("window.mobileApp.isConnecting")
        print(f"still_connecting after tapping empty area: {still_connecting}")
        assert still_connecting == True, "Connection must NOT be cancelled on empty tap!"

        # Tap Pin 2 (da1_L)
        await eval_js(f"""(() => {{
            const c = document.getElementById('mobileCircuitCanvas');
            const rect = c.getBoundingClientRect();
            const touch2 = new Touch({{
                identifier: 3,
                target: c,
                clientX: rect.left + {p2['x']},
                clientY: rect.top + {p2['y']}
            }});
            c.dispatchEvent(new TouchEvent('touchstart', {{ touches: [touch2], changedTouches: [touch2], cancelable: true }}));
            c.dispatchEvent(new TouchEvent('touchend', {{ touches: [], changedTouches: [touch2], cancelable: true }}));
        }})()""")

        wires_after_tap = await eval_js("window.wireRouter.wires.length")
        print(f"Wires count after Tap-to-Wire: {wires_after_tap}")
        assert wires_after_tap == 1, f"Expected 1 wire, got {wires_after_tap}"
        print(">>> SUCCESS: Tap-to-Wire connected successfully!")

        # -------------------------------------------------------------
        # TEST B: DRAG-TO-WIRE (Press on Pin 1 -> Drag to Pin 2 -> Release)
        # -------------------------------------------------------------
        print("\n>>> 3. Testing DRAG-TO-WIRE: Switch 1 terminal '1' -> Lamp E1 terminal 'L'...")
        p3 = await eval_js("window.componentManager.getTerminalById('da1_1')")
        p4 = await eval_js("window.componentManager.getTerminalById('e1_L')")
        print(f"Pin 3 (da1_1): ({p3['x']}, {p3['y']}), Pin 4 (e1_L): ({p4['x']}, {p4['y']})")

        # Start touch on p3, move to p4, release on p4
        await eval_js(f"""(() => {{
            const c = document.getElementById('mobileCircuitCanvas');
            const rect = c.getBoundingClientRect();
            const tStart = new Touch({{
                identifier: 4,
                target: c,
                clientX: rect.left + {p3['x']},
                clientY: rect.top + {p3['y']}
            }});
            c.dispatchEvent(new TouchEvent('touchstart', {{ touches: [tStart], changedTouches: [tStart], cancelable: true }}));

            const tMove = new Touch({{
                identifier: 4,
                target: c,
                clientX: rect.left + {p4['x']},
                clientY: rect.top + {p4['y']}
            }});
            c.dispatchEvent(new TouchEvent('touchmove', {{ touches: [tMove], changedTouches: [tMove], cancelable: true }}));

            c.dispatchEvent(new TouchEvent('touchend', {{ touches: [], changedTouches: [tMove], cancelable: true }}));
        }})()""")

        wires_after_drag = await eval_js("window.wireRouter.wires.length")
        print(f"Wires count after Drag-to-Wire: {wires_after_drag}")
        assert wires_after_drag == 2, f"Expected 2 wires, got {wires_after_drag}"
        print(">>> SUCCESS: Drag-to-Wire connected successfully!")

        # -------------------------------------------------------------
        # TEST C: MAGNETIC SNAP (Touching 30px off-center snaps to closest terminal)
        # -------------------------------------------------------------
        print("\n>>> 4. Testing MAGNETIC SNAP: Touching 30px away from Lamp E1 N...")
        p_lamp_n = await eval_js("window.componentManager.getTerminalById('e1_N')")
        p_breaker_n = await eval_js("window.componentManager.getTerminalById('q1_N')")

        # Tap breaker N, then tap 30px away from Lamp E1 N
        await eval_js(f"""(() => {{
            const c = document.getElementById('mobileCircuitCanvas');
            const rect = c.getBoundingClientRect();
            const t1 = new Touch({{
                identifier: 5,
                target: c,
                clientX: rect.left + {p_breaker_n['x']},
                clientY: rect.top + {p_breaker_n['y']}
            }});
            c.dispatchEvent(new TouchEvent('touchstart', {{ touches: [t1], changedTouches: [t1], cancelable: true }}));
            c.dispatchEvent(new TouchEvent('touchend', {{ touches: [], changedTouches: [t1], cancelable: true }}));

            // Tap with 25px offset
            const t2 = new Touch({{
                identifier: 6,
                target: c,
                clientX: rect.left + {p_lamp_n['x']} + 25,
                clientY: rect.top + {p_lamp_n['y']} - 15
            }});
            c.dispatchEvent(new TouchEvent('touchstart', {{ touches: [t2], changedTouches: [t2], cancelable: true }}));
            c.dispatchEvent(new TouchEvent('touchend', {{ touches: [], changedTouches: [t2], cancelable: true }}));
        }})()""")

        wires_after_magnetic = await eval_js("window.wireRouter.wires.length")
        print(f"Wires count after Magnetic Snap: {wires_after_magnetic}")
        assert wires_after_magnetic == 3, f"Expected 3 wires, got {wires_after_magnetic}"
        print(">>> SUCCESS: Magnetic Snap connected wire even with 25px finger offset!")

    chrome_proc.kill()
    shutil.rmtree(temp_dir, ignore_errors=True)
    print("\n=======================================================")
    print("ALL TOUCH WIRING & MAGNETIC SNAP TESTS PASSED 100%!")
    print("1. Tap-to-Wire works flawlessly.")
    print("2. Drag-to-Wire works flawlessly.")
    print("3. Magnetic Snap (40px) catches finger offset.")
    print("4. Accidental miss does NOT cancel connection.")
    print("=======================================================")

if __name__ == "__main__":
    asyncio.run(test_touch_wiring())
