# 第二版 / Version 2

这是泰迪熊互动网页的第二个版本，保存在独立的 `version-2` 分支。

第一版继续保留在 [`main` 分支](https://github.com/mikuknightforever/sta313-project-web/tree/main)，本次上传没有修改第一版。

## 打开网页

网页源码位于 [`teddy-door/`](teddy-door/)，入口是 [`teddy-door/index.html`](teddy-door/index.html)。保留 HTML、CSS 和原生 JavaScript，无需安装前端依赖。

在仓库根目录运行：

```bash
python3 -m http.server 8000
```

然后打开 http://localhost:8000/teddy-door/ 。

## 第二版内容

- 从斜上方进入暖色动漫客厅，泰迪熊坐在浅绿色沙发上展开四折地图。
- 下滑收回地图，镜头推进到全家福；继续下滑退回客厅。
- 全家福中的爸爸熊、妈妈熊和小熊可以悬浮举纸，圆润双爪位于纸张两侧。
- 大熊抬纸与前伸动作平滑衔接，并避开小熊。
- 大、小白纸均保留 A4 比例；点击靠近，再点击纸面返回全家福。

第二版对应当前已完成的网页版本，包含全家福之后返回客厅的滚动镜头及更流畅的大熊举纸动画。
