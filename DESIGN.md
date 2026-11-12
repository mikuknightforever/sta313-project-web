# Demo 设计记录 / Demo Design Decisions

2026-11-12。本次任务是让五套已有 Demo 更美观，也让不同阅读方式更容易比较。范围为网站本身；沿用真实框架、90 所虚构学校、现有本地启动器与 Plotly，不接入真实课程数据。

The redesign makes five reading experiences visually distinct while keeping the same synthetic dataset, chart semantics, actual frameworks, and local launcher. It does not select a final framework or publish a website.

## 五种方向 / Five directions

| 路线 / Route | 视觉与结构 / Visual and structural choice | 主任务 / Reading task |
| --- | --- | --- |
| Native | 暖纸色、橙色重点、中文衬线标题、90 枚样本圆点、开放版面 / Warm paper, orange emphasis, serif headings, 90 sample dots, open layout | 从问题进入探索 / Enter through the research question |
| React | 深梅色分析区、暖浅色样本笔记、持续导航、联动视图 / Dark plum workspace, light selection notes, persistent navigation, coordinated views | 保留筛选并反复比较 / Compare views of one selection |
| Shiny | 玉石绿样本区、白色分析台、01–03 步骤 / Jade sample area, white analysis surface, numbered steps | 定义样本、观察关系、解释 / Define, observe, interpret |
| Streamlit | 冷蓝刊头、横向筛选、顺序简报、展开笔记 / Cool blue masthead, inline filters, sequential brief, expandable notes | 快速阅读与操作 / Read and explore a concise brief |
| Quarto | 暖白纸面、梅紫章节、衬线标题、目录与方法表 / Warm white, plum accents, serif typography, contents and methods | 连续阅读完整论述 / Read a complete research narrative |

框架不决定上述视觉风格，均可迁移。Shiny 使用 Python 版；Quarto 的交互依然来自嵌入的 JavaScript。

These are design choices, not inherent framework appearances. Shiny uses Python; Quarto interactions use embedded JavaScript.

## 知识库应用 / Applied references

已读取用户的 Agent 设计知识库、执行协议、三个案例、相关规则及四套色板。本记录只保存本项目的采用与适配，不复制知识库全文，不写回知识库。

- **CASE-FT-COVID-TRAJECTORY-001 / RULE-VIZ-ROLE-01**：采用先提出比较问题、再组织主体与细读信息的方法。主图前解释观察对象，图后给出解读范围。没有移植疫情图的对数轴或事件对齐。参考：[作者讲座报道](https://gijn.org/stories/data-visualization-storytelling-tips-john-burn-murdoch/)。
- **CASE-NOBEL-NODEGREES-001 / RULE-VIZ-READKEY-01**：采用稳定类别身份及与实际标记一致的读图键。区域始终对应相同色相和圆、菱形、方形标记；个体散点与派生均值柱明确区分。参考：[作者编码说明](https://giorgialupi.wordpress.com/2013/11/27/gold-medal-at-the-information-is-beautiful-design-award/)。
- **CASE-CARBON-DATATABLE-001**：只采用工具栏、列标题与数据行的结构分层观察；筛选作用于整个样本，表格仅呈现对应记录。没有增加批量操作，也不将组件文档视为整页可用性验证。参考：[Carbon 数据表指南](https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines)。
- **RULE-LANGUAGE-01**：采用真实中文文案，检查标题断行、图表单位及手机端内容密度。
- **PALETTE-2026-PERSIMMON / PLUMNOIR / JADE / COOLBLUE**：使用库中原创 UI 配色提案作为起点，分别适配暖纸专题、深色工作台、实验室和简报。Quarto 从梅紫与暖白关系另作浅色适配。这些是设计提案，不是对流行程度或用户偏好的判断。

上述案例在知识库中的依据主要为作者或官方文字；本次借用方法，没有声称复现其像素或验证原站 UX。页面效果以本项目的浏览器截图为证据。

The case records provide source-supported methods, not verified replicas of the reference websites. Palette proposals are starting points rather than evidence of user preference. Screenshots of this project document the actual result.

## 图表与交互 / Charts and interactions

- 五套应用共享原始 90 行数据；未修改数据以迎合外观。
- 城市、郊区、乡镇分别使用圆、菱形、方形；颜色作为重复提示。深色版使用相同色相的浅色变体。
- 散点坐标保持收入 30–155 千加元、达标率 35–100%。区域比较的柱形图改用 0–100% 基线，并直接标注均值。
- 空样本显示说明或空表；无样本均值显示破折号，不呈现 `nan%`。
- React 标签页支持方向键、Home、End；保留可见键盘焦点。移动端 Shiny 筛选区位于结果之前。
- 字体使用系统字体栈，不新增远程字体或图片依赖；减少动态效果的系统设置受到尊重。

## 验证 / Validation

验证记录见 `verification.json`、`delivery-verification.json`、`design-verification.json` 与 `screenshots/`。`verify.py` 在 Chromium 中运行五套实际应用，检查区域筛选、重置、适用的视图切换、390 px 手机宽度、横向溢出及图表容器；`verify_delivery.py` 在阻断额外网络资源的情况下检查三份独立 HTML，并验证离线对比页。

截图使用 1440 px 桌面与 390 px 手机宽度。Streamlit 在内部容器滚动，因此截图时扩展视口高度以完整记录页面；没有通过截图替换真实应用。实际检查不等于 Safari、macOS 或完整辅助技术兼容性认证。

Browser validation targets Chromium, the affected interactions, and the documented desktop/mobile widths. Standalone pages are tested with external asset requests blocked. This does not establish Safari, macOS, or comprehensive accessibility compatibility.

本轮补充检查：768 px 宽度下五套页面均无横向溢出；React 方向键、Home、End 切换视图后保留城市样本（30 所）；本地入口的五个链接与截图加载正常。
