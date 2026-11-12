"""Start the five prebuilt demos on this computer's loopback interface."""
from pathlib import Path
import argparse
import signal
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
import webbrowser

ROOT = Path(__file__).resolve().parent
URL = 'http://127.0.0.1:8765/local.html'
SERVICES = [
    ('web', 8765, ['-m', 'http.server', '8765', '--bind', '127.0.0.1'], ROOT, '/local.html'),
    ('shiny', 8767, ['-m', 'shiny', 'run', '--host', '127.0.0.1', '--port', '8767', 'app.py'], ROOT / 'shiny', '/'),
    ('streamlit', 8768, ['-m', 'streamlit', 'run', 'app.py', '--server.address', '127.0.0.1', '--server.port', '8768', '--server.headless', 'true', '--browser.gatherUsageStats', 'false'], ROOT / 'streamlit', '/_stcore/health'),
]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--open-browser', action='store_true')
    args = parser.parse_args()
    processes = []
    logs = []
    log_dir = ROOT / '.local-logs'
    log_dir.mkdir(exist_ok=True)

    def interrupted(*_):
        raise KeyboardInterrupt

    signal.signal(signal.SIGTERM, interrupted)
    try:
        for name, port, *_ in SERVICES:
            with socket.socket() as probe:
                probe.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                try:
                    probe.bind(('127.0.0.1', port))
                except OSError as exc:
                    raise RuntimeError(f'端口 {port} 已被占用，或当前环境不允许监听。请先检查是否已经启动了 Demo。') from exc
        for name, port, command, cwd, path in SERVICES:
            log = (log_dir / f'{name}.log').open('w', encoding='utf-8')
            logs.append(log)
            process = subprocess.Popen([sys.executable, *command], cwd=cwd, stdout=log, stderr=subprocess.STDOUT)
            processes.append((name, process, port, path))
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        pending = {name for name, *_ in processes}
        deadline = time.monotonic() + 90
        while pending:
            for name, process, port, path in processes:
                if process.poll() is not None:
                    raise RuntimeError(f'{name} 启动失败，详情见 {log_dir / (name + ".log")}')
                if name not in pending:
                    continue
                try:
                    with opener.open(f'http://127.0.0.1:{port}{path}', timeout=1) as response:
                        if response.status == 200:
                            pending.remove(name)
                except (OSError, urllib.error.URLError):
                    pass
            if time.monotonic() > deadline:
                raise RuntimeError(f'启动超时：{", ".join(sorted(pending))}。日志目录：{log_dir}')
            if pending:
                time.sleep(.25)
        print(f'\n五种 Demo 已在当前电脑启动：\n{URL}\n\n保持此终端窗口开启；按 Control+C 停止全部服务。\n', flush=True)
        if args.open_browser and not webbrowser.open(URL):
            print('浏览器未自动打开，请复制上面的地址。', flush=True)
        while True:
            for name, process, *_ in processes:
                if process.poll() is not None:
                    raise RuntimeError(f'{name} 意外停止，详情见 {log_dir / (name + ".log")}')
            time.sleep(.5)
    except KeyboardInterrupt:
        print('\n正在停止 Demo…', flush=True)
        return 0
    except (OSError, RuntimeError) as exc:
        print(f'\n启动失败：{exc}', file=sys.stderr, flush=True)
        return 1
    finally:
        for _, process, *_ in processes:
            if process.poll() is None:
                process.terminate()
        for _, process, *_ in processes:
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
        for log in logs:
            log.close()


if __name__ == '__main__':
    sys.exit(main())
