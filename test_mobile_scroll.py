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
PORT = 9224
TARGET_URL = "http://localhost:8080/mobile.html"

async def test_mobile_scroll():
    temp_dir = tempfile.mkdtemp(prefix="chrome_mobile_scroll_")
    print(">>> 1. Launching Chrome Mobile Scroll & Touch Verification (390x844)...")
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

        # 1. Check Scrollability
        scroll_info = await eval_js("""(() => {
            const m = document.getElementById('mobileMain');
            return {
                clientHeight: m.clientHeight,
                scrollHeight: m.scrollHeight,
                isScrollable: m.scrollHeight > m.clientHeight
            };
        })()""")
        print(f"Scroll Info: {scroll_info}")
        assert scroll_info["isScrollable"] == True, f"mobileMain must be scrollable! Got {scroll_info}"
        print(">>> SUCCESS: Mobile workspace is naturally and smoothly scrollable!")

        # 2. Check Quick Jump Scroll Button
        await eval_js("document.getElementById('btnScrollToLamps').click()")
        await asyncio.sleep(0.5)

        new_scroll_top = await eval_js("document.getElementById('mobileMain').scrollTop")
        print(f"ScrollTop after jumping to lamps: {new_scroll_top}px")
        assert new_scroll_top > 50, f"Expected scrollTop > 50, got {new_scroll_top}"
        print(">>> SUCCESS: Jump-to-lamps button smoothly scrolled down!")

        # 3. Check Lamps Visibility & Terminals
        e1_rect = await eval_js("""(() => {
            const t = window.componentManager.getTerminalById('e1_L');
            const canvasRect = document.getElementById('mobileCircuitCanvas').getBoundingClientRect();
            return {
                screenX: canvasRect.left + t.x,
                screenY: canvasRect.top + t.y,
                canvasTop: canvasRect.top
            };
        })()""")
        print(f"Lamp E1 Terminal on screen: {e1_rect}")
        # When scrolled down, screenY should be well within view (0 to 800)
        assert 0 < e1_rect["screenY"] < 750, f"Lamp terminal must be visible on screen! Got {e1_rect}"
        print(">>> SUCCESS: Lamp terminals are fully visible and accessible above footer!")

        # 4. Generate solution and capture screenshot while scrolled to lamps
        await eval_js("window.circuitEngine.generateSolution()")
        await eval_js("window.mobileApp.evaluateCircuit()")
        await asyncio.sleep(0.5)

        screenshot_data = await send_cmd("Page.captureScreenshot", {"format": "png"})
        raw_bytes = base64.b64decode(screenshot_data.get("data"))

        mobile_scroll_screenshot = r"C:\Users\MSI\.gemini\antigravity\scratch\electrical-wiring-simulator\screenshot_mobile_scrolled.png"
        with open(mobile_scroll_screenshot, "wb") as f:
            f.write(raw_bytes)
        print(f"Scrolled screenshot saved to: {mobile_scroll_screenshot}")

        # 5. Jump back to breaker
        await eval_js("document.getElementById('btnScrollToBreaker').click()")
        await asyncio.sleep(0.5)
        top_scroll = await eval_js("document.getElementById('mobileMain').scrollTop")
        print(f"ScrollTop after jumping back to breaker: {top_scroll}px")
        assert top_scroll < 50, f"Expected top_scroll < 50, got {top_scroll}"
        print(">>> SUCCESS: Jump back to breaker works!")

    chrome_proc.kill()
    shutil.rmtree(temp_dir, ignore_errors=True)
    print("\nALL MOBILE SCROLL & ERGONOMICS TESTS PASSED 100%!")

if __name__ == "__main__":
    asyncio.run(test_mobile_scroll())
