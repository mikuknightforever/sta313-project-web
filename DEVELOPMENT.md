# 开发入口 / Development Guide

当前保留五条路线作为选型样例，尚未确定最终技术栈。先通过 `Start-Demos.command` 启动，再按下表修改对应源码。

All five routes remain available for evaluation; no final framework has been selected. Start with `Start-Demos.command`, then edit the relevant source below.

| 路线 / Route | 修改入口 / Source | 更新方式 / Refresh |
| --- | --- | --- |
| 原生前端 / Native frontend | `native/index.html`、`native/style.css`、`assets/common.css`、`assets/charts.js` | 保存后刷新浏览器 / Save and refresh |
| React | `react/app.jsx`、`react/style.css` | 首次 `npm ci`，修改后 `npm run build` 并刷新 / Run `npm ci` initially, then build and refresh |
| Shiny for Python | `shiny/app.py`、`assets/shiny.css`、`analysis.py` | 修改后重启启动器 / Restart the launcher after changes |
| Streamlit | `streamlit/app.py`、`assets/streamlit.css`、`analysis.py` | 保存并按页面提示重新运行 / Save and rerun when prompted |
| Quarto | `quarto/index.qmd`、`quarto/styles.css`、`quarto/_quarto.yml` | 安装 Quarto CLI 后运行 `quarto render quarto` / Install Quarto CLI, then render |

`requirements.runtime.txt` 用于运行现有 Demo；React 和 Quarto 构建结果已保留，首次查看不需要安装对应构建工具。完整 Python 构建依赖可通过 `requirements.txt` 安装。

Use `requirements.runtime.txt` to run the demos. Prebuilt React and Quarto outputs are included, so viewing them does not require those build tools. Full Python build dependencies are listed in `requirements.txt`.

`assets/data.json` 与 `assets/data.js` 是当前合成数据。接入真实课程数据时，应明确使用的数据版本和字段，并同步更新 Python 与浏览器端的读取逻辑。真实数据归档见 [docs 仓库](https://github.com/mikuknightforever/sta313-project-docs/tree/main/datasets)。

`assets/data.json` and `assets/data.js` contain the current synthetic example data. When adopting real course data, record the version and fields and update both Python and browser-side readers. The original course-data snapshot is in the linked docs repository.

`index.html` 与 `deliverables/` 中的比较页包含已有截图，不会自动反映源码修改。需要更新时，先构建并通过 `verify.py` 生成新截图，再运行 `package_demos.py`。`build_demos.py` 是最初的示例生成器，会覆盖 Demo 源码，不应作为日常启动命令。

The comparison pages in `index.html` and `deliverables/` contain saved screenshots. To update them, rebuild, capture screenshots with `verify.py`, then run `package_demos.py`. `build_demos.py` regenerates the original examples and overwrites their source; it is not the normal startup command.

本次 Quarto 产物使用 CLI 1.7.32 生成。`assets/charts.js` 与 `analysis.py` 保持区域颜色、形状、坐标范围及均值口径一致；React 深色图表使用相同色相的浅色变体。比较柱形图必须以 0 为基线。修改布局后应重新生成截图与离线页面。

The current Quarto output was rendered with CLI 1.7.32. The browser and Python chart helpers share region identities, marker shapes, axis ranges, and mean definitions. React uses lighter variants on dark surfaces. Comparison bars start at zero. Regenerate screenshots and offline deliverables after layout changes.
