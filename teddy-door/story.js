"use strict";

const stage = document.querySelector("#stage");
const canvas = document.querySelector("#scene");
const mapView = document.querySelector("#map-view");
const intro = document.querySelector(".intro");
const chapterLabel = document.querySelector("#chapter");
const scrollHint = document.querySelector("#scroll-hint");
const enter = document.querySelector("#enter");
const restart = document.querySelector("#restart");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const art = window.storyArt || {};
let scene;
let animation = 0;
let current = progress();
let mapReady = false;

if (art.map) {
  mapView.onload = () => { mapReady = true; requestDraw(); };
  mapView.src = art.map;
}

function progress() {
  return clamp(window.scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight));
}

function update() {
  animation = 0;
  const target = progress();
  if (reducedMotion.matches || Math.abs(target - current) < .001) current = target;
  else current = mix(current, target, .21);

  const width = Math.max(1, stage.clientWidth), height = Math.max(1, stage.clientHeight);
  const visual = scene ? scene.render(current, width, height, reducedMotion.matches) : current;
  const introOpacity = 1 - smooth(.015, .17, visual);
  const chapter = visual < .43 ? "room" : visual < .96 ? "unfold" : "map";

  stage.style.setProperty("--progress", current);
  stage.style.setProperty("--intro", introOpacity);
  stage.style.setProperty("--map", scene ? 0 : smooth(.14, .82, visual));
  stage.dataset.chapter = chapter;
  chapterLabel.textContent = { room: "客厅", unfold: "展开地图", map: "旅程" }[chapter];
  scrollHint.firstChild.data = visual >= .43 && visual < .96 ? "继续展开 " : "下滑继续 ";
  intro.inert = introOpacity < .075;
  mapView.hidden = !mapReady || visual < (scene ? .96 : .14);
  if (Math.abs(target - current) >= .001) requestDraw();
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

function goTo(fraction) {
  const range = document.documentElement.scrollHeight - innerHeight;
  window.scrollTo({ top: range * fraction, behavior: reducedMotion.matches ? "auto" : "smooth" });
}

enter.addEventListener("click", () => goTo(scene?.roomStop ?? .39));
restart.addEventListener("click", () => goTo(0));
document.querySelector(".wordmark").addEventListener("click", event => {
  event.preventDefault();
  goTo(0);
});
window.addEventListener("scroll", requestDraw, { passive: true });
window.addEventListener("resize", requestDraw);
reducedMotion.addEventListener("change", requestDraw);
canvas.addEventListener("webglcontextlost", event => {
  event.preventDefault();
  scene = null;
  stage.classList.remove("has-scene");
  requestDraw();
});
canvas.addEventListener("webglcontextrestored", connectScene);
connectScene();
