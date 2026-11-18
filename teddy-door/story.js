"use strict";

const stage = document.querySelector("#stage");
const canvas = document.querySelector("#scene");
const mapView = document.querySelector("#map-view");
const intro = document.querySelector(".intro");
const chapterLabel = document.querySelector("#chapter");
const scrollHint = document.querySelector("#scroll-hint");
const enter = document.querySelector("#enter");
const restart = document.querySelector("#restart");
const portraitControls = document.querySelector("#portrait-controls");
const parentTarget = document.querySelector("#parents-target");
const childTarget = document.querySelector("#child-target");
const paperDialog = document.querySelector("#paper-dialog");
const paperSurface = document.querySelector("#paper-surface");
const paperBack = document.querySelector("#paper-back");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const livingRoomEnd = .70;
const portraitAnchor = livingRoomEnd * storyTimeline.portraitAnchor;
const journey = document.querySelector("#journey");
const windowControls = document.querySelector("#window-controls");
const panes = [...windowControls.querySelectorAll("button")];
const chartSection = document.querySelector("#season-chart");
const fallingMark = document.querySelector("#falling-mark");
const chart = makeSeasonChart(chartSection, backToWindow);
const art = window.storyArt || {};
const interaction = { parents: 0, child: 0, selected: null, zoom: 0,
  windowApproach: 0, windowTime: 0, activeSeason: -1 };
let scene;
let animation = 0;
let current = progress();
let mapReady = false;
let hovered = null;
let zoomTarget = 0;
let previousFrame = 0;
let closing = false;
let restoredOverflow = "";
let portraitScroll = 0;
let focusRestore = 0;
let hoverLeave = 0;
let windowTick = 0;
let selectedPane = 0;
let focusWindowAfterJump = false;
let markFlight;
let chartFade;

function cancelHoverLeave() {
  clearTimeout(hoverLeave);
  hoverLeave = 0;
}

function portraitAvailable(value) {
  return value >= livingRoomEnd * storyTimeline.portraitStart && value <= livingRoomEnd * storyTimeline.portraitExit;
}

if (art.map) {
  mapView.onload = () => { mapReady = true; requestDraw(); };
  mapView.src = art.map;
}

function progress() {
  return clamp(window.scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight));
}

function tween(value, target, rate) {
  return Math.abs(value - target) < .001 ? target : mix(value, target, rate);
}

function positionButton(button, rectangle) {
  const [left, top, width, height] = rectangle;
  button.style.left = left + "px";
  button.style.top = top + "px";
  button.style.width = width + "px";
  button.style.height = height + "px";
}

function update(timestamp) {
  animation = 0;
  if (!chartSection.hidden) return;
  // Account for slow frames without stretching a short gesture into seconds.
  // A new gesture starts with a nominal frame, rather than consuming idle time.
  const elapsed = previousFrame ? Math.min(250, timestamp - previousFrame) : 16.67;
  previousFrame = timestamp;
  const rate = reducedMotion.matches ? 1 : 1 - Math.exp(-elapsed / 100);
  if (focusRestore > 0) {
    portraitScroll = (document.documentElement.scrollHeight - innerHeight) * portraitAnchor;
    window.scrollTo({ top: portraitScroll, behavior: "instant" });
    current = portraitAnchor;
    focusRestore--;
  }
  if (interaction.selected && window.scrollY !== portraitScroll) {
    window.scrollTo({ top: portraitScroll, behavior: "instant" });
  }
  const target = interaction.selected ? portraitAnchor : progress();
  current = tween(current, target, rate);
  if (!portraitAvailable(current) && !interaction.selected) {
    cancelHoverLeave();
    hovered = null;
  }
  const active = interaction.selected || hovered;
  const parentRate = reducedMotion.matches ? 1 : 1 - Math.exp(-elapsed / 170);
  const zoomRate = reducedMotion.matches ? 1 : 1 - Math.exp(-elapsed / 175);
  interaction.parents = tween(interaction.parents, active === "parents" ? 1 : 0, parentRate);
  interaction.child = tween(interaction.child, active === "child" ? 1 : 0, rate);
  const lift = interaction.selected ? interaction[interaction.selected] : 0;
  const readyToZoom = closing || lift >= .98;
  interaction.zoom = tween(interaction.zoom, readyToZoom ? zoomTarget : 0, zoomRate);

  const width = Math.max(1, stage.clientWidth), height = Math.max(1, stage.clientHeight);
  const roomProgress = clamp(current / livingRoomEnd);
  interaction.windowApproach = clamp((current - livingRoomEnd) / (1 - livingRoomEnd));
  interaction.windowTime = timestamp / 1000;
  const visual = scene ? scene.render(roomProgress, width, height, reducedMotion.matches, interaction) : null;
  const sequence = clamp(roomProgress / storyTimeline.sequenceEnd);
  const mapProgress = visual?.mapProgress ?? clamp(sequence / .39);
  const windowReady = Boolean(visual?.windowPanes?.length) && visual.windowReveal === 1
    && (reducedMotion.matches || interaction.windowApproach >= .91);
  const chapter = windowReady ? "window" : interaction.windowApproach > .01 ? "window-approach"
    : roomProgress > storyTimeline.portraitExit ? (roomProgress >= .999 ? "room-end" : "portrait-return")
    : sequence < .39 ? (mapProgress < .43 ? "room" : "unfold")
    : sequence < .46 ? "map" : sequence < .68 ? "return" : sequence < .96 ? "portrait-approach" : "portrait";
  const portraitReady = Boolean(scene) && portraitAvailable(current) && !interaction.selected;
  // Finish on the complete artwork, clear of the bear's head and paws.
  const mapReveal = scene
    ? smooth(.365, .39, sequence) * (1 - smooth(.46, .50, sequence))
    : smooth(.24, .38, sequence) * (1 - smooth(.46, .62, sequence));

  stage.style.setProperty("--progress", current);
  stage.style.setProperty("--intro", 1 - smooth(.006, .067, sequence));
  stage.style.setProperty("--map", mapReady ? mapReveal : 0);
  stage.style.setProperty("--paper-zoom", interaction.zoom);
  stage.dataset.chapter = chapter;
  stage.dataset.paperState = !interaction.selected ? "closed" : closing ? "closing"
    : interaction.zoom === 1 ? "open" : "opening";
  stage.classList.toggle("paper-open", Boolean(interaction.selected));
  chapterLabel.textContent = {
    room: "客厅", unfold: "展开地图", map: "森林地图",
    return: "回到客厅", "portrait-approach": "全家福", portrait: "全家福",
    "portrait-return": "回到客厅", "room-end": "客厅", "window-approach": "望向窗外", window: "四季窗 · 2020",
  }[chapter];
  scrollHint.firstChild.data = windowReady ? "选择窗格查看季度数据" : chapter === "map" ? "下滑回到客厅 "
    : chapter === "unfold" ? "继续展开 " : chapter === "room-end" ? "下滑看向窗外 " : "下滑继续 ";
  windowControls.hidden = !windowReady;
  if (windowReady) {
    panes.forEach((button, i) => positionButton(button, visual.windowPanes[i]));
    if (focusWindowAfterJump) {
      focusWindowAfterJump = false;
      panes[0].focus({ preventScroll: true });
    }
  } else interaction.activeSeason = -1;
  intro.inert = sequence > .067;
  mapView.hidden = !mapReady || mapReveal === 0;
  portraitControls.hidden = !portraitReady;
  if (portraitReady) {
    positionButton(parentTarget, visual.parents);
    positionButton(childTarget, visual.child);
  } else if (!interaction.selected) {
    hovered = null;
  }
  if (visual?.paper) positionButton(paperSurface, visual.paper);
  paperSurface.disabled = interaction.zoom < .999 || closing;

  if (closing && interaction.zoom === 0) {
    const lastSelected = interaction.selected;
    interaction.selected = null;
    zoomTarget = 0;
    closing = false;
    hovered = null;
    paperDialog.hidden = true;
    document.body.style.overflow = restoredOverflow;
    window.scrollTo({ top: portraitScroll, behavior: "instant" });
    current = portraitAnchor;
    portraitControls.hidden = false;
    (lastSelected === "parents" ? parentTarget : childTarget).focus({ preventScroll: true });
    hovered = null;
    requestDraw();
  }

  const unsettled = focusRestore > 0 || Math.abs(target - current) > .001
    || Math.abs(interaction.parents - (active === "parents" ? 1 : 0)) > .001
    || Math.abs(interaction.child - (active === "child" ? 1 : 0)) > .001
    || interaction.zoom !== (readyToZoom ? zoomTarget : 0)
    || Boolean(interaction.selected && !closing && lift < .98);
  if (unsettled) requestDraw();
  else {
    previousFrame = 0;
    if (windowReady && !reducedMotion.matches && !document.hidden) {
      windowTick = setTimeout(requestDraw, 84);
    }
  }
}

function requestDraw() {
  clearTimeout(windowTick);
  if (!chartSection.hidden || document.hidden) return;
  if (!animation) animation = requestAnimationFrame(update);
}

function connectScene() {
  try {
    const renderer = makeRenderer(canvas);
    if (renderer) {
      scene = makeScene(renderer);
      scene.loadArt(art, requestDraw);
      const activeScene = scene;
      scene.ready.then(() => {
        if (scene !== activeScene) return;
        stage.classList.add("has-scene");
        document.querySelector("#scene-status").hidden = true;
        requestDraw();
      }).catch(error => {
        document.querySelector("#scene-status").textContent = "客厅暂时无法加载，请刷新重试。";
        console.error("Room assets could not be loaded.", error);
      });
    }
  } catch (error) {
    document.querySelector("#scene-status").textContent = "此浏览器暂时无法显示 3D 客厅，请启用 WebGL 后刷新。";
    console.error("The 3D scene is unavailable.", error);
  }
  requestDraw();
}

function returnToPortrait() {
  if (!interaction.selected) return;
  zoomTarget = 0;
  closing = true;
  requestDraw();
}

function goTo(fraction, instant = false) {
  cancelHoverLeave();
  if (interaction.selected) {
    interaction.selected = null;
    interaction.zoom = 0;
    zoomTarget = 0;
    closing = false;
    paperDialog.hidden = true;
    document.body.style.overflow = restoredOverflow;
  }
  hovered = null;
  const range = document.documentElement.scrollHeight - innerHeight;
  window.scrollTo({ top: range * fraction, behavior: instant || reducedMotion.matches ? "instant" : "smooth" });
  requestDraw();
}

for (const [button, who] of [[parentTarget, "parents"], [childTarget, "child"]]) {
  button.addEventListener("pointerenter", () => {
    cancelHoverLeave();
    hovered = who;
    requestDraw();
  });
  button.addEventListener("pointerleave", () => {
    cancelHoverLeave();
    hoverLeave = setTimeout(() => {
      hoverLeave = 0;
      if (hovered === who) hovered = null;
      requestDraw();
    }, who === "parents" ? 100 : 0);
  });
  button.addEventListener("focus", () => {
    cancelHoverLeave();
    hovered = who;
    focusRestore = 2;
    requestDraw();
  });
  button.addEventListener("blur", () => { if (hovered === who) hovered = null; requestDraw(); });
  button.addEventListener("click", () => {
    if (!portraitAvailable(current) || interaction.selected) return;
    cancelHoverLeave();
    interaction.selected = who;
    zoomTarget = 1;
    closing = false;
    portraitScroll = (document.documentElement.scrollHeight - innerHeight) * portraitAnchor;
    window.scrollTo({ top: portraitScroll, behavior: "instant" });
    restoredOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    paperDialog.setAttribute("aria-label", who === "parents" ? "爸爸熊和妈妈熊的大白纸" : "小孩熊的小白纸");
    paperDialog.hidden = false;
    paperBack.focus({ preventScroll: true });
    requestDraw();
  });
}
paperBack.addEventListener("click", returnToPortrait);
paperSurface.addEventListener("click", returnToPortrait);
paperDialog.addEventListener("keydown", event => {
  if (event.key === "Escape") returnToPortrait();
  if (event.key === "Tab") {
    event.preventDefault();
    if (!paperSurface.disabled && document.activeElement === paperBack) paperSurface.focus();
    else paperBack.focus();
  }
});

function finishFlight() {
  markFlight?.cancel();
  chartFade?.cancel();
  markFlight = chartFade = null;
  fallingMark.hidden = true;
}

function backToWindow() {
  finishFlight();
  journey.inert = false;
  current = 1;
  goTo(1, true);
  requestAnimationFrame(() => panes[selectedPane].focus({ preventScroll: true }));
}

function openQuarter(index) {
  if (!chartSection.hidden || windowControls.hidden) return;
  const source = panes[index].getBoundingClientRect();
  selectedPane = index;
  interaction.activeSeason = index;
  clearTimeout(windowTick);
  chart.show(index);
  journey.inert = true;
  const landing = chartSection.querySelector("[data-season-landing]");
  if (reducedMotion.matches || !landing) return;
  const plottedPoint = chartSection.querySelector('[data-series-point="ow"]')?.getBoundingClientRect();
  const point = plottedPoint && plottedPoint.top >= 0 && plottedPoint.bottom <= innerHeight
    ? plottedPoint : landing.getBoundingClientRect();
  const endX = point.left + point.width / 2, endY = point.top + point.height / 2;
  const x = source.left + source.width * .55, y = source.top + source.height * .38;
  fallingMark.src = window.seasonMarks[index];
  fallingMark.hidden = false;
  const transformAt = (px, py, angle, size) =>
    `translate(${px}px, ${py}px) translate(-50%, -50%) rotate(${angle}deg) scale(${size})`;
  markFlight = fallingMark.animate([
    {transform: transformAt(x,y,-12,1),opacity:1},
    {transform: transformAt(x+(endX-x)*.55+26,y+(endY-y)*.37,38,.95),opacity:1,offset:.48},
    {transform: transformAt(endX,endY,8,.48),opacity:.90,offset:.91},
    {transform: transformAt(endX,endY,8,.32),opacity:0}
  ], {duration:780,easing:"ease-in-out"});
  chartFade = chartSection.animate([{opacity:0},{opacity:0,offset:.18},{opacity:1}], {duration:620});
  markFlight.onfinish = finishFlight;
}

panes.forEach((button, index) => {
  const highlight = () => { interaction.activeSeason = index; requestDraw(); };
  const clear = () => { interaction.activeSeason = -1; requestDraw(); };
  button.addEventListener("pointerenter", highlight);
  button.addEventListener("pointerleave", clear);
  button.addEventListener("focus", highlight);
  button.addEventListener("blur", clear);
  button.addEventListener("click", () => openQuarter(index));
});

document.querySelector("#to-window").addEventListener("click", event => {
  focusWindowAfterJump = event.detail === 0;
  if (reducedMotion.matches) {
    goTo(1, true);
    return;
  }
  current = livingRoomEnd;
  goTo(livingRoomEnd, true);
  requestAnimationFrame(() => goTo(1));
});
enter.addEventListener("click", () => goTo(livingRoomEnd * (scene?.roomStop ?? .39) * .39 * storyTimeline.sequenceEnd));
restart.addEventListener("click", () => goTo(0));
document.querySelector(".wordmark").addEventListener("click", event => {
  event.preventDefault();
  goTo(0);
});
window.addEventListener("scroll", requestDraw, { passive: true });
window.addEventListener("resize", () => {
  if (interaction.selected) portraitScroll = (document.documentElement.scrollHeight - innerHeight) * portraitAnchor;
  requestDraw();
});
document.addEventListener("visibilitychange", requestDraw);
reducedMotion.addEventListener("change", () => { finishFlight(); requestDraw(); });
canvas.addEventListener("webglcontextlost", event => {
  event.preventDefault();
  scene = null;
  stage.classList.remove("has-scene");
  if (interaction.selected) {
    document.body.style.overflow = restoredOverflow;
    interaction.selected = null;
    interaction.zoom = 0;
    paperDialog.hidden = true;
  }
  requestDraw();
});
canvas.addEventListener("webglcontextrestored", connectScene);
connectScene();
