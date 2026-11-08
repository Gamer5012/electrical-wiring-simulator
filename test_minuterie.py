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
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 9223
BASE_URL = "http://localhost:8080"

async def run_minuterie_tests():
    temp_dir = tempfile.mkdtemp(prefix="chrome_min_test_")
    print(f">>> 1. Launching headless Chrome (port {PORT})...")
    chrome_proc = subprocess.Popen([
        CHROME_PATH,
        f"--remote-debugging-port={PORT}",
        f"--user-data-dir={temp_dir}",
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--window-size=1280,900"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    try:
        await asyncio.sleep(2)
        version_url = f"http://localhost:{PORT}/json/version"
        with urllib.request.urlopen(version_url) as resp:
            data = json.loads(resp.read().decode())
            ws_url = data['webSocketDebuggerUrl']
        print(f">>> Connected to browser WebSocket: {ws_url}")

        async with websockets.connect(ws_url) as ws:
            msg_id = 0
            async def send(method, params=None):
                nonlocal msg_id
                msg_id += 1
                payload = {"id": msg_id, "method": method, "params": params or {}}
                await ws.send(json.dumps(payload))
                while True:
                    res = json.loads(await ws.recv())
                    if res.get("id") == msg_id:
                        return res.get("result", {})

            # Create target page for desktop
            res = await send("Target.createTarget", {"url": f"{BASE_URL}/index.html"})
            target_id = res["targetId"]
            res = await send("Target.attachToTarget", {"targetId": target_id, "flatten": True})
            session_id = res["sessionId"]

            async def page_send(method, params=None):
                nonlocal msg_id
                msg_id += 1
                payload = {"id": msg_id, "sessionId": session_id, "method": method, "params": params or {}}
                await ws.send(json.dumps(payload))
                while True:
                    res = json.loads(await ws.recv())
                    if res.get("id") == msg_id:
                        return res.get("result", {})

            async def eval_js(expression):
                res = await page_send("Runtime.evaluate", {
                    "expression": expression,
                    "returnByValue": True,
                    "awaitPromise": True
                })
                if "exceptionDetails" in res:
                    print("JS EXCEPTION:", res["exceptionDetails"])
                return res.get("result", {}).get("value")

            await page_send("Page.enable")
            await page_send("Runtime.enable")
            await asyncio.sleep(2)

            print("\n>>> 2. Testing Desktop Minuterie Component & Layout...")
            # Switch to MIN mode
            switch_res = await eval_js("""
                (() => {
                    const btn = document.querySelector('[data-mode="MIN"]');
                    if (!btn) return { error: 'data-mode="MIN" button not found' };
                    btn.click();
                    return {
                        success: true,
                        currentMode: window.app.currentMode,
                        compCount: window.app.cm.components.length,
                        types: window.app.cm.components.map(c => c.type),
                        minComp: window.app.cm.components.find(c => c.type === 'minuterie')
                    };
                })()
            """)
            print("Mode switch result:", json.dumps(switch_res, indent=2, ensure_ascii=False))
            assert switch_res.get('success') is True, "Failed to switch to MIN mode"
            assert switch_res.get('currentMode') == 'MIN', "Mode is not MIN"
            assert 'minuterie' in switch_res.get('types'), "Minuterie component missing"

            print("\n>>> 3. Testing Solution Generation & NFC 15-100 Audit...")
            audit_res = await eval_js("""
                (() => {
                    window.app.engine.generateSolution();
                    window.app.wr.recomputeAllPaths(window.app.cm);
                    const report = window.app.engine.evaluateAudit();
                    return {
                        wireCount: window.app.wr.wires.length,
                        isValid: report.isValid,
                        status: report.status,
                        checks: report.checks.map(c => ({ label: c.label, pass: c.pass, desc: c.desc }))
                    };
                })()
            """)
            print("Audit report:", json.dumps(audit_res, indent=2, ensure_ascii=False))
            assert audit_res.get('isValid') is True, "Audit report failed on generated solution"
            assert audit_res.get('status') == 'success', "Audit status is not success"

            print("\n>>> 4. Testing Push Button Trigger & Lighting Illumination...")
            impulse_res = await eval_js("""
                (() => {
                    const min = window.app.cm.components.find(c => c.type === 'minuterie');
                    const initialClosed = min.state.isClosed;
                    const initialTiming = min.state.isTiming;

                    // Trigger pulse from BP1
                    window.app.handlePushButtonImpulse('bp1');

                    const sim = window.app.engine.simulate();
                    return {
                        initialClosed,
                        initialTiming,
                        afterClosed: min.state.isClosed,
                        afterTiming: min.state.isTiming,
                        remainingSeconds: min.state.remainingSeconds,
                        lampsLit: sim.lampsLit
                    };
                })()
            """)
            print("Impulse result:", json.dumps(impulse_res, indent=2, ensure_ascii=False))
            assert impulse_res.get('afterClosed') is True, "Minuterie contact did not close after BP pulse"
            assert impulse_res.get('afterTiming') is True, "Minuterie is not timing after BP pulse"
            assert len(impulse_res.get('lampsLit', [])) >= 2, "Lamps are not lit after Minuterie trigger"

            print("\n>>> 5. Testing Countdown & Automatic Extinction (Shutdown)...")
            shutdown_res = await eval_js("""
                (() => {
                    const min = window.app.cm.components.find(c => c.type === 'minuterie');
                    // Set remaining to 1 second so interval expires quickly in test
                    min.state.remainingSeconds = 1;
                    return { setRemaining: 1 };
                })()
            """)
            await asyncio.sleep(2.0)
            verify_shutdown = await eval_js("""
                (() => {
                    const min = window.app.cm.components.find(c => c.type === 'minuterie');
                    const sim = window.app.engine.simulate();
                    return {
                        afterClosed: min.state.isClosed,
                        afterTiming: min.state.isTiming,
                        lampsLit: sim.lampsLit
                    };
                })()
            """)
            print("Shutdown verification:", json.dumps(verify_shutdown, indent=2, ensure_ascii=False))
            assert verify_shutdown.get('afterClosed') is False, "Minuterie contact did not open after timer expiry"
            assert verify_shutdown.get('afterTiming') is False, "Minuterie still timing after timer expiry"
            assert len(verify_shutdown.get('lampsLit', [])) == 0, "Lamps are still lit after timer expiry"

            print("\n>>> 6. Testing Mode Slider: Permanent ON (Marche Forcée ☼)...")
            perm_res = await eval_js("""
                (() => {
                    const min = window.app.cm.components.find(c => c.type === 'minuterie');
                    // Click slider to permanent
                    min.state.mode = 'permanent';
                    min.state.isClosed = true;
                    window.app.evaluateCircuit();
                    const sim = window.app.engine.simulate();
                    return {
                        mode: min.state.mode,
                        isClosed: min.state.isClosed,
                        lampsLit: sim.lampsLit
                    };
                })()
            """)
            print("Permanent mode result:", json.dumps(perm_res, indent=2, ensure_ascii=False))
            assert perm_res.get('mode') == 'permanent', "Mode is not permanent"
            assert len(perm_res.get('lampsLit', [])) >= 2, "Lamps not lit in permanent mode"

            # Reset to auto
            await eval_js("""
                (() => {
                    const min = window.app.cm.components.find(c => c.type === 'minuterie');
                    min.state.mode = 'auto';
                    min.state.isClosed = false;
                    window.app.evaluateCircuit();
                })()
            """)

            # Capture Desktop Screenshot
            shot = await page_send("Page.captureScreenshot", {"format": "png"})
            with open("screenshot_minuterie_desktop.png", "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            print("Saved screenshot_minuterie_desktop.png")

            # -----------------------------------------------------------------
            # MOBILE VERIFICATION
            # -----------------------------------------------------------------
            print("\n>>> 7. Testing Mobile Minuterie Interface...")
            res_m = await send("Target.createTarget", {"url": f"{BASE_URL}/mobile.html"})
            target_id_m = res_m["targetId"]
            res_m = await send("Target.attachToTarget", {"targetId": target_id_m, "flatten": True})
            session_id_m = res_m["sessionId"]

            async def mobile_send(method, params=None):
                nonlocal msg_id
                msg_id += 1
                payload = {"id": msg_id, "sessionId": session_id_m, "method": method, "params": params or {}}
                await ws.send(json.dumps(payload))
                while True:
                    res = json.loads(await ws.recv())
                    if res.get("id") == msg_id:
                        return res.get("result", {})

            async def eval_mobile_js(expression):
                res = await mobile_send("Runtime.evaluate", {
                    "expression": expression,
                    "returnByValue": True,
                    "awaitPromise": True
                })
                if "exceptionDetails" in res:
                    print("MOBILE JS EXCEPTION:", res["exceptionDetails"])
                return res.get("result", {}).get("value")

            await mobile_send("Page.enable")
            await mobile_send("Runtime.enable")
            # Set mobile viewport emulation (iPhone 14 style: 390x844)
            await mobile_send("Emulation.setDeviceMetricsOverride", {
                "width": 390,
                "height": 844,
                "deviceScaleFactor": 2,
                "mobile": True
            })
            await asyncio.sleep(2)

            mobile_res = await eval_mobile_js("""
                (() => {
                    const btn = document.querySelector('[data-mobile-mode="MIN"]');
                    if (!btn) return { error: 'data-mobile-mode="MIN" not found' };
                    btn.click();
                    window.mobileApp.engine.generateSolution();
                    window.mobileApp.wr.recomputeAllPaths(window.mobileApp.cm);
                    const report = window.mobileApp.engine.evaluateAudit();
                    return {
                        mode: window.mobileApp.currentMode,
                        compCount: window.mobileApp.cm.components.length,
                        wireCount: window.mobileApp.wr.wires.length,
                        isValid: report.isValid,
                        status: report.status
                    };
                })()
            """)
            print("Mobile Minuterie result:", json.dumps(mobile_res, indent=2, ensure_ascii=False))
            assert mobile_res.get('mode') == 'MIN', "Mobile mode is not MIN"
            assert mobile_res.get('isValid') is True, "Mobile audit is not valid"

            shot_m = await mobile_send("Page.captureScreenshot", {"format": "png"})
            with open("screenshot_minuterie_mobile.png", "wb") as f:
                f.write(base64.b64decode(shot_m["data"]))
            print("Saved screenshot_minuterie_mobile.png")

            # -----------------------------------------------------------------
            # EXAM MODE VERIFICATION WITH MINUTERIE
            # -----------------------------------------------------------------
            print("\n>>> 8. Testing Exam Mode Integration with Minuterie (Build & Fault)...")
            exam_res = await eval_js("""
                (() => {
                    const exercises = window.EXAM_EXERCISES;
                    const buildMin = exercises.find(ex => ex.id === 'build_min');
                    const faultMin = exercises.find(ex => ex.id === 'fault_min_supply_control');

                    if (!buildMin || !faultMin) {
                        return { error: 'Minuterie exercises missing from EXAM_EXERCISES', buildMin: !!buildMin, faultMin: !!faultMin };
                    }

                    // Start build_min exam session
                    const started = window.app.examManager.startExam('build_min');
                    const activeEx = window.app.examManager.currentExercise;

                    // Generate solution to verify grading
                    window.app.engine.generateSolution();
                    window.app.wr.recomputeAllPaths(window.app.cm);

                    // Grade exam
                    const grade = window.app.examManager.gradingEngine.gradeExam(buildMin, 60);

                    return {
                        started,
                        activeExId: activeEx ? activeEx.id : null,
                        totalScore: grade.totalScore,
                        passed: grade.passed,
                        connectionsScore: grade.scoreBreakdown.connections,
                        relationshipsScore: grade.scoreBreakdown.relationships,
                        colorsScore: grade.scoreBreakdown.colors,
                        hygieneScore: grade.scoreBreakdown.hygiene,
                        connDetails: grade.connectionDetails
                    };
                })()
            """)
            print("Exam mode Minuterie grade:", json.dumps(exam_res, indent=2, ensure_ascii=False))
            assert exam_res.get('started') is True, "Failed to start build_min exam"
            assert exam_res.get('totalScore') == 100, f"Expected 100 points, got {exam_res.get('totalScore')}"
            assert exam_res.get('passed') is True, "Exam did not pass"

            # Open results modal to take screenshot
            await eval_js("""
                (() => {
                    window.app.examManager.submitExam();
                })()
            """)
            await asyncio.sleep(1)

            shot_exam = await page_send("Page.captureScreenshot", {"format": "png"})
            with open("screenshot_minuterie_exam_result.png", "wb") as f:
                f.write(base64.b64decode(shot_exam["data"]))
            print("Saved screenshot_minuterie_exam_result.png")

            print("\n=======================================================")
            print("🎉 ALL MINUTERIE TESTS (DESKTOP, MOBILE, EXAM) PASSED 100%!")
            print("=======================================================")

    finally:
        chrome_proc.terminate()
        try:
            chrome_proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            chrome_proc.kill()
        shutil.rmtree(temp_dir, ignore_errors=True)

if __name__ == '__main__':
    asyncio.run(run_minuterie_tests())
