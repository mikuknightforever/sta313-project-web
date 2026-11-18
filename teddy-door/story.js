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
const art = window.storyArt || {};
const interaction = { parents: 0, child: 0, selected: null, zoom: 0 };
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

function cancelHoverLeave() {
  clearTimeout(hoverLeave);
  hoverLeave = 0;
}

function portraitAvailable(value) {
  return value >= storyTimeline.portraitStart && value <= storyTimeline.portraitExit;
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
  const elapsed = Math.min(50, timestamp - previousFrame || 16.67);
  previousFrame = timestamp;
  const rate = reducedMotion.matches ? 1 : 1 - Math.exp(-elapsed / 100);
  if (focusRestore > 0) {
    portraitScroll = (document.documentElement.scrollHeight - innerHeight) * storyTimeline.portraitAnchor;
    window.scrollTo({ top: portraitScroll, behavior: "instant" });
    current = storyTimeline.portraitAnchor;
    focusRestore--;
  }
  if (interaction.selected && window.scrollY !== portraitScroll) {
    window.scrollTo({ top: portraitScroll, behavior: "instant" });
  }
  const target = interaction.selected ? storyTimeline.portraitAnchor : progress();
  current = tween(current, target, rate);
  if (!portraitAvailable(current) && !interaction.selected) {
    cancelHoverLeave();
    hovered = null;
  }
  const active = interaction.selected || hovered;
  const parentRate = reducedMotion.matches ? 1 : 1 - Math.exp(-elapsed / 170);
  interaction.parents = tween(interaction.parents, active === "parents" ? 1 : 0, parentRate);
  interaction.child = tween(interaction.child, active === "child" ? 1 : 0, rate);
  const lift = interaction.selected ? interaction[interaction.selected] : 0;
  const readyToZoom = closing || lift >= .98;
  interaction.zoom = tween(interaction.zoom, readyToZoom ? zoomTarget : 0, rate * .58);

  const width = Math.max(1, stage.clientWidth), height = Math.max(1, stage.clientHeight);
  const visual = scene ? scene.render(current, width, height, reducedMotion.matches, interaction) : null;
  const sequence = clamp(current / storyTimeline.sequenceEnd);
  const mapProgress = visual?.mapProgress ?? clamp(sequence / .39);
  const chapter = current > storyTimeline.portraitExit ? (current >= .999 ? "room-end" : "portrait-return")
    : sequence < .39 ? (mapProgress < .43 ? "room" : "unfold")
    : sequence < .46 ? "map" : sequence < .68 ? "return" : sequence < .96 ? "portrait-approach" : "portrait";
  const portraitReady = Boolean(scene) && portraitAvailable(current) && !interaction.selected;

  stage.style.setProperty("--progress", current);
  stage.style.setProperty("--intro", 1 - smooth(.006, .067, sequence));
  stage.style.setProperty("--map", scene ? 0 : smooth(.24, .38, sequence) * (1 - smooth(.46, .62, sequence)));
  stage.style.setProperty("--paper-zoom", interaction.zoom);
  stage.dataset.chapter = chapter;
  stage.dataset.paperState = !interaction.selected ? "closed" : closing ? "closing"
    : interaction.zoom === 1 ? "open" : "opening";
  stage.classList.toggle("paper-open", Boolean(interaction.selected));
  chapterLabel.textContent = {
    room: "客厅", unfold: "展开地图", map: "森林地图",
    return: "回到客厅", "portrait-approach": "全家福", portrait: "全家福",
    "portrait-return": "回到客厅", "room-end": "客厅",
  }[chapter];
  scrollHint.firstChild.data = chapter === "map" ? "下滑回到客厅 "
    : chapter === "unfold" ? "继续展开 " : chapter === "room-end" ? "已回到客厅 " : "下滑继续 ";
  intro.inert = sequence > .067;
  mapView.hidden = !mapReady || (scene ? sequence < .37 || sequence > .47 : false);
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
    current = storyTimeline.portraitAnchor;
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
}

function requestDraw() {
  if (!animation) animation = requestAnimationFrame(update);
}

function connectScene() {
  try {
    const renderer = makeRenderer(canvas);
    if (renderer) {
      scene = makeScene(renderer);
      scene.loadArt(art, requestDraw);
      stage.classList.add("has-scene");
    }
  } catch (error) {
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

function goTo(fraction) {
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
  window.scrollTo({ top: range * fraction, behavior: reducedMotion.matches ? "instant" : "smooth" });
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
    portraitScroll = (document.documentElement.scrollHeight - innerHeight) * storyTimeline.portraitAnchor;
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

enter.addEventListener("click", () => goTo((scene?.roomStop ?? .39) * .39 * storyTimeline.sequenceEnd));
restart.addEventListener("click", () => goTo(0));
document.querySelector(".wordmark").addEventListener("click", event => {
  event.preventDefault();
  goTo(0);
});
window.addEventListener("scroll", requestDraw, { passive: true });
window.addEventListener("resize", () => {
  if (interaction.selected) portraitScroll = (document.documentElement.scrollHeight - innerHeight) * storyTimeline.portraitAnchor;
  requestDraw();
});
reducedMotion.addEventListener("change", requestDraw);
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
