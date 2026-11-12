#!/bin/bash
set -u
cd "$(dirname "$0")" || exit 1

demo_python=""
for candidate in python3.12 python3.13 python3.11 python3; do
  if command -v "$candidate" >/dev/null 2>&1; then
    demo_resolved=$("$candidate" -I -c 'import encodings,os,sys; sys.exit(1) if sys.version_info < (3,11) else None; print(os.path.realpath(getattr(sys,"_base_executable",sys.executable)))' 2>/dev/null)
    if [ -n "$demo_resolved" ] && "$demo_resolved" -I -c 'import encodings,ensurepip,venv' >/dev/null 2>&1; then
      demo_python="$demo_resolved"
      break
    fi
  fi
done

if [ -z "$demo_python" ]; then
  printf '\n未找到可用的 Python 3.11 或更新版本，推荐 Python 3.12。\n请先从 https://www.python.org/downloads/ 安装，然后重新打开此文件。\n\n'
  read -r -p "按回车关闭… "
  exit 1
fi

"$demo_python" -I start_local.py
demo_status=$?
if [ "$demo_status" -ne 0 ] && [ "$demo_status" -ne 130 ]; then
  printf '\n启动没有完成，请查看上方错误信息。\n'
  read -r -p "按回车关闭… "
fi
exit "$demo_status"
