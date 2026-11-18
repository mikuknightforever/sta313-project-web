"use strict";

// Small authored Kenney meshes, a shared pastel palette and simple architecture.
function makeRoomAssets(renderer) {
  const sources = window.roomAssetSources;
  const assets = { sources, models: {} };
  const stats = { status: "loading", models: 0, textures: 0, instances: 0,
    architecturalParts: 0, modelTriangles: 0, instancedModelTriangles: 0, error: null };
  const architecture = [], furniture = [];
  const palette = { wood: 0xcaa185, woodDark: 0x78624e, metal: 0x87958a,
    carpet: 0x87bcb2, carpetDarker: 0x729794, carpetBlue: 0x8daec1,
    carpetWhite: 0xf5eddc, lamp: 0xf4dca6, plant: 0x729a78 };

  function part(shape, color, position, size, rotation = [], extra = {}) {
    const mesh = object(shape, color, "plain", position, size, rotation, extra);
    architecture.push(mesh);
    return mesh;
  }
  function model(name, matrix) { furniture.push({ name, matrix }); }
  function place(name, position, scale, rotation = []) {
    const b = assets.models[name].bounds, s = Array.isArray(scale) ? scale : [scale, scale, scale];
    model(name, multiply(transform(...position, ...s, ...rotation),
      transform(-b.center[0], -b.min[1], -b.center[2])));
  }
  function picture(position, width, height) {
    // Native Kenney window frame: open centre bounded by its straight inner bars.
    const opening = { x: 0, y: 0, w: .2761463, h: .565678 };
    const sx = width / opening.w, sy = height / opening.h, sz = 1.65;
    model("frame", multiply(transform(...position, sx, sy, sz),
      transform(-opening.x, -opening.y, 0)));
  }
  function buildRoom() {
    const art = makeRoomArt(renderer);
    const finishes = makeRoomFinishes(renderer);
    registerThrow(renderer);
    registerPillow(renderer);
    // The thin plinth gives the cutaway room a finished lower edge.
    part("box", 0xb99c84, [0,-.092,-1.45], [6.64,.18,5.30]);
    part("quad", 0xffffff, [0,.002,-1.45], [6.6,5.26,1], [-Math.PI/2],
      {texture:finishes.floor,windowLight:true,castShadow:false});
    part("box",0xf3e9d7,[0,1.81,-4.14],[6.6,3.62,.12]);
    part("quad",0xffffff,[0,1.81,-4.078],[6.6,3.62,1],[],
      {texture:finishes.wall,windowLight:true,castShadow:false});
    part("box",0xe1d1b5,[0,1.066,-4.05],[6.6,.042,.060]);
    const windowZ=-1.45, windowY=2.05, windowW=2.18, windowH=2.15;
    const bottom=windowY-windowH/2, top=windowY+windowH/2;
    for (const z of [-3.31,.41]) part("box",0xe5e7ec,[3.36,1.81,z],[.12,3.62,1.54]);
    part("box",0xe5e7ec,[3.36,bottom/2,windowZ],[.12,bottom,windowW]);
    part("box",0xe5e7ec,[3.36,(top+3.62)/2,windowZ],[.12,3.62-top,windowW]);
    part("box",0xc9ab83,[0,.075,-4.035],[6.6,.15,.09]);
    part("box",0xc9ab83,[3.255,.075,-1.45],[.09,.15,5.26]);
    part("box",0xd2b58e,[3.23,bottom-.055,windowZ],[.32,.09,windowW+.24]);
    const w=assets.models.window.bounds;
    model("window",multiply(transform(3.17,windowY,windowZ,(windowW+.17)/w.size[0],(windowH+.14)/w.size[1],2.3,0,-Math.PI/2),
      transform(-w.center[0],-w.center[1],-w.max[2])));

    // A small original illustrated landscape stays inside the window opening.
    architecture.push({shape:"quad", material:13, color:[1,1,1],
      model:transform(3.40,windowY,windowZ,windowW,windowH,1,0,-Math.PI/2),texture:art.window,
      castShadow:false,receiveShadow:false});
    addWindowCurtain(renderer, part);

    place("rug",[0,.006,-1.28],[4.8/1.57,1,3/.92]);
    place("sofa",[0,.024,-2.28],4.15/.98);
    part("sofaThrow",0xffffff,[0,0,0],[1,1,1],[],{texture:finishes.blanket,windowLight:true});
    part("linenPillow",0xffffff,[-1.22,1.23,-2.57],[.94,.43,.32],[-.25,.09,.12],
      {texture:finishes.ticking,windowLight:true});
    part("linenPillow",0xf4c788,[1.18,1.34,-2.57],[.76,.65,.28],[-.22,-.07,-.13],{windowLight:true});
    const contact = (position,size) => architecture.push(object("quad",0xffffff,"shadow",position,
      [...size,1],[-Math.PI/2],{texture:finishes.shade,castShadow:false,receiveShadow:false}));
    contact([0,.020,-1.98],[4.65,1.50]);
    contact([0,1.003,-1.82],[.90,.63]);
    contact([.05,-.21,-1.41],[8.1,6.55]);
    const tableHeight=.87, tb=assets.models.table.bounds;
    const tableScale=[.67/tb.size[0],tableHeight/tb.size[1],.67/tb.size[2]];
    place("table",[-2.70,.006,-2.05],tableScale);
    place("table",[2.65,.006,-1.96],tableScale);
    place("lamp",[-2.70,tableHeight+.006,-2.05],.83/assets.models.lamp.bounds.size[1]);
    place("plant",[2.55,tableHeight+.006,-2.02],.84/assets.models.plant.bounds.size[1]);
    place("books",[2.88,tableHeight+.006,-1.79],1.55,[0,-.12]);

    const teaX = -.48, teaZ = -.12, teaHeight = .48;
    const rugTop = .006 + assets.models.rug.bounds.size[1];
    const [width, height, depth] = assets.models.coffeeTable.bounds.size;
    place("coffeeTable", [teaX,rugTop,teaZ], [1.65/width,teaHeight/height,.90/depth]);
    contact([teaX,rugTop+.002,teaZ], [.89,.62]);
    addTeaThings(renderer, part, teaX, rugTop+teaHeight, teaZ);

    picture([-1.71,2.72,-4.04],1.1968,.94656);
    picture([1.72,2.72,-4.04],.96,.68);
    architecture.push({shape:"quad",material:7,color:[1,1,1],
      model:transform(1.72,2.72,-4.025,.96,.68,1),texture:art.print,castShadow:false});
    renderer.setLighting({keyIntensity:1.85,hemisphereIntensity:1.65,fillIntensity:.22,
      keyPosition:[6.0,4.8,.35],keyTarget:[0,.8,-2],lampPosition:[-2.70,1.5,-2.05],lampIntensity:.24,exposure:1});
    stats.instances=furniture.length;
    stats.architecturalParts=architecture.length;
    stats.instancedModelTriangles=furniture.reduce((n,f)=>n+assets.models[f.name].triangles,0);
  }
  const ready=Promise.all(Object.entries(sources.models).map(async ([name,url])=>{
    const loaded=await renderer.loadModel("room:"+name,url); let triangles=0;
    loaded.root.traverse(node=>{
      if(node.isLight)node.visible=false;
      if(!node.isMesh)return;
      triangles+=(node.geometry.index?.count||node.geometry.attributes.position.count)/3;
      for(const mat of Array.isArray(node.material)?node.material:[node.material]) {
        const color=palette[mat.name]; if(color!==undefined)mat.color.setHex(color);
        if(name==="frame"||name==="window")mat.color.setHex(0xe1c3a3);
        if(name==="rug")mat.color.setHex(mat.name==="carpetDarker"?0xf5e3cf:0xb1c8d0);
        if(name==="plant"&&mat.name==="wood")mat.color.setHex(0xc68e72);
        if(name==="coffeeTable")mat.color.setHex(0xb88c69);
      }
      if(["frame","window"].includes(name))node.receiveShadow=false;
    });
    loaded.triangles=triangles; assets.models[name]=loaded;
    stats.models++;stats.modelTriangles+=triangles;
  })).then(()=>{buildRoom();stats.status="ready";return assets;}).catch(error=>{
    stats.status="error";stats.error=error.message;throw error;
  });
  function render(parent) {
    for(const mesh of architecture)renderer.draw(mesh,parent);
    for(const item of furniture)renderer.drawModel("room:"+item.name,parent?multiply(parent,item.matrix):item.matrix);
  }
  return {ready,render,stats,assets,scene:renderer.scene};
}
