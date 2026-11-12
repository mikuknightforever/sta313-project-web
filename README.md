# STA313 网页代码 / Website Source

本仓库是 STA313 小组项目的网页代码仓库，当前保留四种建站路线的 Demo，供比较、选型与后续开发。尚未选定最终框架，也未发布最终项目网站。

This repository holds the STA313 project's website source. The current version contains four working demos for comparison and future development; the final framework and project website have not yet been finalized.

- 项目文档与协作 / Project documentation: [sta313-project-docs](https://github.com/mikuknightforever/sta313-project-docs).
- 教师课程数据 / Instructor's course datasets: [docs 仓库 datasets 目录](https://github.com/mikuknightforever/sta313-project-docs/tree/main/datasets).

四份真实实现，使用相同的 90 所虚构学校数据与 Plotly 图表。数据是固定随机种子生成的演示素材，不是课程原始数据或真实研究结果。

All four demos use the same 90 synthetic schools and Plotly charts. The synthetic example data are separate from the real course datasets linked above.

2026-11-12：用户已排除 Quarto。当前候选为原生 HTML/CSS/JavaScript、React、Shiny for Python 与 Streamlit；此前版本保留在 Git 历史提交 `777ce98`。

Quarto was removed from consideration on 2026-11-12. Its previous implementation remains available in Git history at `777ce98`.

## 获取代码 / Get the Code

```bash
git clone https://github.com/mikuknightforever/sta313-project-web.git
cd sta313-project-web
bash Start-Demos.command
```

也可通过 GitHub 的 Code → Download ZIP 下载并解压。私有仓库需要有相应访问权限。

Alternatively, use GitHub's Code → Download ZIP and extract the folder. Access to a private repository requires the appropriate GitHub permissions.

## 设计更新 / Visual design update

2026-11-12：依据设计知识库重新设计四套 Demo，分别采用暖纸色杂志专题、浅色探索工作台、玉石绿研究实验室、冷蓝色数据简报。各路线保留相同的合成数据与统计口径，重新组织字体、配色、导航、筛选与图文关系。布局和视觉风格可以迁移到其他框架，并不代表框架的视觉上限。

On 2026-11-12, the four demos were redesigned as an editorial feature, a light exploration workspace, a research lab, and a data brief. They retain the same synthetic data and statistical definitions. See [DESIGN.md](DESIGN.md) for design decisions, references, and validation scope.

## 先看视觉效果

不采用暗色主题。新增 [四套浅色配色对比](deliverables/浅色配色对比.html)：暖白鼠尾草（默认）、冰蓝雾灰、雾紫杏白、奶油黄绿，使用同一 React 页面比较。对比页可离线打开；进入 React 后点击“页面配色”即可切换，保留当前筛选与视图。所选方案记录在页面 URL 中，刷新后保留。

Light palettes share the same React layout. The picker preserves filters and views; the URL retains the chosen palette on reload.

打开 `deliverables/四种建站路线对比.html`。无需安装依赖，可以选择路线、桌面 / 手机截图、两种并排比较或四种总览。比较页里的页面截图不执行数据筛选。

下面两份文件可直接用浏览器打开，支持真实数据交互，无需 Python：

- `deliverables/01-native.html` — 原生 HTML/CSS/JavaScript 专题页。
- `deliverables/02-react.html` — 真实 React 组件与联动状态。

Shiny 与 Streamlit 的截图来自真实应用。要操作它们，请按下文运行；本次未部署网站。

## macOS 本地启动（推荐）

1. 克隆仓库，或解压整个 ZIP，保持文件夹结构。不要只拖出启动文件。
2. Mac 需要 Python 3.11+，推荐 Python 3.12；没有 Python 时可从 https://www.python.org/downloads/ 安装。
3. 双击 `Start-Demos.command`。如果系统不能直接打开它，在终端输入 `bash `（末尾一个空格），把该文件拖入终端，按回车。
4. 首次启动会联网，在本目录 `.demo-venv` 中安装依赖；不改动系统 Python。之后复用该环境。
5. 等待浏览器自动打开 `http://127.0.0.1:8765/local.html`。点击卡片即可进入四份真实交互 Demo。

保持终端窗口开启，在终端按 Control+C 关闭全部服务。退出浏览器不会关闭服务。本地启动不需要 Node.js 或 R。

启动前会检查 8765、8767、8768 三个端口；占用时会报错，不会关闭其他程序。详细日志在 `.local-logs`。

启动器会解析 Python 快捷链接的真实路径，在 macOS 上用符号链接创建虚拟环境，并验证标准库是否可导入。如果旧 `.demo-venv` 已损坏，会先改名为 `.demo-venv.backup-时间戳` 保留，再重建。无需手动删除环境，也无需改动系统 Python。

## 手动运行全部 Demo

需要 Python 3.11+。在本目录执行：

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.runtime.txt
python serve.py --open-browser
```

Windows 激活虚拟环境用 `.venv\Scripts\activate`。运行后打开：

- 本地入口：`http://127.0.0.1:8765/local.html`
- 浅色配色：`http://127.0.0.1:8765/palettes.html`
- 截图对比：`http://127.0.0.1:8765/`
- 原生前端：`http://127.0.0.1:8765/native/`
- React：`http://127.0.0.1:8765/react/`
- Shiny：`http://127.0.0.1:8767/`
- Streamlit：`http://127.0.0.1:8768/`

在总览中点击“打开真实交互 Demo”即可进入对应应用。Ctrl+C 停止所有 Demo 服务。

React 已附构建产物，查看时不需要重新构建。修改 React 源码后运行 `npm ci`、`npm run build`。

## 文件对应

| 路线 | 主要源码 | 本例页面组织 |
| --- | --- | --- |
| 原生前端 | `native/index.html`、`native/style.css` | 叙事开场、图表、解释 |
| React | `react/app.jsx`、`react/style.css` | 多视图工作台 |
| Shiny for Python | `shiny/app.py`、`assets/shiny.css` | 响应式筛选与分析输出 |
| Streamlit | `streamlit/app.py`、`assets/streamlit.css` | Python 数据应用 |

共享数据在 `assets/data.json`，浏览器图表函数在 `assets/charts.js`，Python 分析函数在 `analysis.py`。Shiny 采用 Python 版，未使用 R。

本例的卡片、侧栏、留白和字号是设计选择，不是各框架的固定外观；不能仅凭这四张页面认定某个框架必然更美观。

## 验证与重新生成

`verification.json` 记录 demo 的浏览器验证；`verify.py` 检查区域筛选、重置、主要视图，并生成桌面与手机截图。需要 Playwright 和 Chromium，脚本中的浏览器可执行路径按本机修改。

`test_launcher.py` 覆盖便携 Python 快捷链接、标准库路径丢失、损坏环境备份与重建。可运行 `python3 -m unittest test_launcher -v`。这些回归检查在 Linux 云端环境完成，macOS 本机运行结果仍需实际确认。

`verify_palettes.py` 检查四套配色的桌面 / 手机布局、切换状态、键盘操作与指定颜色对比度，并更新配色截图；随后运行 `package_palettes.py` 更新配色对比页，再运行 `verify_delivery.py` 验证离线页面并生成两张总览图。结果见 `palette-verification.json`。

`build_demos.py` 是初始示例生成器，再次运行会覆盖示例源码。完成构建与截图后，`package_demos.py` 更新离线比较页与两个独立 HTML 文件。
