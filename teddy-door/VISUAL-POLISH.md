# 动漫客厅与纸张交互

基于 `version-2` 的本地视觉迭代。家具、摆件、画框和窗框使用 **Kenney 的现成低面数模型**；客厅主熊继续使用 hectopod 的下载模型。场景统一为纯色、柔和分段光照与实际阴影，地图保留项目原占位图。

## 场景和渲染

- `renderer.js` 保留共用矩阵、几何与绘制接口，入口委托给 `physical-renderer-source.js`。文件名延续原接口，目前实现是 **toon renderer**。Three.js GLTFLoader 载入家具，转换为 `MeshToonMaterial`，采用四档光照梯度；家具保留低面数轮廓和面法线。眼睛使用简单高光材质。
- `room.js` 组织客厅摆放；`assets/room/room-assets.js` 注册八个 GLB。房间材质在运行时统一配色，没有下载的颜色、法线或粗糙度图片。真实投影与柔和的接触阴影帮助表现坐姿。窗光沿主光方向穿过窗框，在家具、地板及后墙形成亮面，主熊朝窗一侧带有轮廓光。
- `room-art.js` 在加载时绘制窗外山林和墙上的植物版画。`room-finishes.js` 绘制木地板、墙裙、毯面和接触阴影。扶手毯使用 56 个三角面，靠垫使用 120 个。
- `npm run build:teddy-renderer` 从源码生成 `assets/vendor/physical-renderer.js` 自包含 bundle；Three.js 的 MIT 声明保留在 `assets/vendor/THREE-LICENSE.txt`。

## 八个房间模型

| 页面文件 | Kenney 原模型 | 三角面 |
| --- | --- | ---: |
| `sofa.glb` | `loungeSofa` | 128 |
| `table.glb` | `tableCoffeeSquare` | 124 |
| `lamp.glb` | `lampRoundTable` | 76 |
| `plant.glb` | `pottedPlant` | 60 |
| `rug.glb` | `rugRounded` | 204 |
| `frame.glb` | `wallWindow` 的木框 | 40 |
| `window.glb` | `wallWindowSlide` 的两扇木框 | 80 |
| `books.glb` | `books` | 62 |

八个独立模型合计 **774 三角面、75,200 字节、零图片纹理**。客厅实际使用 **10 个实例、938 三角面**；这些数字不含熊、建筑几何和全家福角色。

沙发和桌子通过节点平移居中；画框、窗框从下载模型保留原木框，移除玻璃和周围墙体。画框中央开放、没有背板；内开口为 **0.2761463 × 0.565678**，按照片比例调整 X/Y 缩放。各开口的 21 × 31 网格射线检查均无木框遮挡。完整来源、固定下载提交、原始与网页文件 SHA-256、世界坐标尺寸和修改记录见 [assets/room/SOURCES.md](assets/room/SOURCES.md) 与 [source-records.json](assets/room/source-records.json)。

## 客厅熊与许可

客厅熊选用 **hectopod** 的 [Teddy bears](https://sketchfab.com/3d-models/teddy-bears-e84b12b4ac20402aaf4d40f2219cd0e2) 中的棕熊，采用 **[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)**。模型保留原有 **12,752 三角面**、几何、顶点法线、UV 与手臂权重，适配尺寸和持图姿态。旋转原 `head_01` 骨骼约 **29.78°** 扶正头部，保持原脸部和耳朵造型。

网页导出省略原针织布纹法线图片，运行时采用较浅棕色、卡通光照和小眼部高光；归档 GLB 保留原材质与纹理。来源、转换方法及原始授权见 [assets/teddy-bear/SOURCE.md](assets/teddy-bear/SOURCE.md) 和 [LICENSE.txt](assets/teddy-bear/LICENSE.txt)。

**八个 Kenney 房间模型均为 CC0；熊为 CC BY 4.0。** 两类许可均允许商业使用，分享熊或包含它的网页时须保留作者、来源、许可和改动说明。页面“素材署名”可展开查看，移动端长内容可独立滚动。

## 全家福、纸面与地图

- 全家福角色保留原有程序化模型。纸面为空白、横向 A4 比例，`paper` 网格具有轻微弯曲、正反面和厚边。X/Y 缩放控制纸张大小，Z 缩放保持 1；`paperFrontDepth` 同时用于取景和点击投影。
- 全家福取景容纳休止及举起的两张纸，并为底部提示留出空间。小熊纸面位于身体前方，避免腹部或吊带穿模。全家福人物不向画框外的墙面投射阴影。
- `story.js` 根据实际经过时间推进举纸和缩放；减少动态效果模式直接到达目标。地图展开终点淡入完整 2D 地图，返程恢复场景。地图文件不属于下载家具或熊模型的许可。
- `model-study.html` 可检查实际客厅熊、灰模与持图姿态。未引入毛发模拟或布料物理。

## 打包与验证

在仓库根目录运行 `python3 -m http.server 8874`，访问 `http://localhost:8874/teddy-door/`。

重新生成 renderer bundle 后运行：

```sh
python3 teddy-door/build-preview.py /workspace/web-review/teddy-toon.html
python3 teddy-door/build-preview.py --entry model-study.html /workspace/web-review/teddy-toon-model.html
```

单文件包含使用到的脚本、样式、八个房间模型、熊的网页模型数据和页面署名；资源使用内联内容或 data URI。原始 deferred 脚本顺序保留，房间资源注册表中的本地 URL 在打包时替换。完整源码/模型分发仍应保留对应来源和许可证文件。

通过 HTTP 验收桌面与手机首屏、地图展开到完整 2D、返程、全家福两张纸的打开/返回、Tab/Escape 焦点及重启。确认纸面完整可见、休止小纸不遮挡底部提示，素材署名可展开且不产生横向溢出。单文件预览应只请求自身 HTML，不再请求外部模型或纹理。
