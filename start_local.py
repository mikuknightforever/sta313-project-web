"""Prepare a project-local Python environment and start all demos."""
from pathlib import Path
import hashlib
import os
import subprocess
import sys
from datetime import datetime
from uuid import uuid4

ROOT = Path(__file__).resolve().parent


def environment_python(environment):
    return environment / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')


def environment_is_healthy(environment):
    """Probe stdlib and venv identity, not just whether an executable exists."""
    python = environment_python(environment)
    try:
        result = subprocess.run(
            [str(python), '-I', '-c',
             'import encodings,json,sys; print(json.dumps([sys.prefix,sys.base_prefix]))'],
            capture_output=True, text=True, timeout=15,
        )
        if result.returncode != 0:
            return False
        import json
        prefix, base_prefix = json.loads(result.stdout)
        return Path(prefix).resolve() == environment.resolve() and prefix != base_prefix
    except (OSError, ValueError, subprocess.TimeoutExpired):
        return False


def prepare_environment(environment):
    if environment_is_healthy(environment):
        return environment_python(environment)
    if environment.exists() or environment.is_symlink():
        suffix = datetime.now().strftime('%Y%m%d-%H%M%S') + '-' + uuid4().hex[:6]
        backup = environment.with_name(environment.name + '.backup-' + suffix)
        environment.rename(backup)
        print(f'检测到无法启动的虚拟环境，已保留为：{backup.name}', flush=True)
    # Resolve shortcuts before invoking venv. Copying a relocatable interpreter
    # through ~/.local/bin can lose its stdlib and fall back to /install/lib.
    base_python = Path(getattr(sys, '_base_executable', sys.executable)).resolve()
    print(f'正在创建项目 Python 环境，使用：{base_python}', flush=True)
    subprocess.run([
        str(base_python), '-I', '-m', 'venv',
        '--copies' if os.name == 'nt' else '--symlinks', str(environment),
    ], check=True)
    if not environment_is_healthy(environment):
        raise RuntimeError('新建的 Python 环境仍无法加载标准库。请保留上方 Python 路径与错误信息。')
    return environment_python(environment)


def main():
    if sys.version_info < (3, 11):
        print('需要 Python 3.11 或更新版本，推荐 Python 3.12。请从 https://www.python.org/downloads/ 安装后重试。')
        return 1
    environment = ROOT / '.demo-venv'
    requirements = ROOT / 'requirements.runtime.txt'
    stamp = environment / '.requirements-sha256'
    fingerprint = hashlib.sha256(requirements.read_bytes()).hexdigest()
    try:
        # Limit cleanup to this launcher's process tree; leave shell settings alone.
        os.environ.pop('PYTHONHOME', None)
        os.environ.pop('PYTHONPATH', None)
        python = prepare_environment(environment)
        modules = 'import streamlit, shiny, plotly, pandas'
        dependencies_ok = (
            stamp.exists()
            and stamp.read_text().strip() == fingerprint
            and subprocess.run([str(python), '-I', '-c', modules], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0
        )
        if not dependencies_ok:
            print('正在安装运行依赖，首次运行需要联网；完成后再次启动会复用此环境。', flush=True)
            pip_probe = subprocess.run([str(python), '-I', '-m', 'pip', '--version'], capture_output=True)
            if pip_probe.returncode != 0:
                subprocess.run([str(python), '-I', '-m', 'ensurepip', '--upgrade'], check=True)
            subprocess.run([str(python), '-I', '-m', 'pip', 'install', '-r', str(requirements)], check=True)
            subprocess.run([str(python), '-I', '-c', modules], check=True)
            stamp.write_text(fingerprint + '\n')
        print('依赖就绪，正在启动 Demo…', flush=True)
        os.execv(str(python), [str(python), str(ROOT / 'serve.py'), '--open-browser'])
    except KeyboardInterrupt:
        print('\n启动已取消。')
        return 130
    except (OSError, RuntimeError, subprocess.CalledProcessError) as exc:
        print(f'\n启动未完成：{exc}\n请保留此窗口中的错误信息。再次运行会重试安装。', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
