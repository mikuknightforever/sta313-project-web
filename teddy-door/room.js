"use strict";

// Small authored Kenney meshes, a shared pastel palette and simple architecture.
function makeRoomAssets(renderer) {
  const sources = window.roomAssetSources;
  const assets = { sources, models: {} };
  const stats = { status: "loading", models: 0, textures: 0, instances: 0,
    architecturalParts: 0, modelTriangles: 0, instancedModelTriangles: 0, error: null };
  const architecture = [], furniture = [], windowPanes = [];
  let windowArt;
  const palette = { wood: 0xb49b8a, woodDark: 0x716474, metal: 0x7e8a93,
    carpet: 0x819e9a, carpetDarker: 0x6f888b, carpetBlue: 0x8799b0,
    carpetWhite: 0xe4dbcf, lamp: 0xe8cda8, plant: 0x748c7d };

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
    windowArt = makeSeasonWindowArt(renderer);
    const finishes = makeRoomFinishes(renderer);
    registerThrow(renderer);
    registerPillow(renderer);
    // The thin plinth gives the cutaway room a finished lower edge.
    part("box", 0xa29596, [0,-.092,-1.45], [6.64,.18,5.30]);
    part("quad", 0xffffff, [0,.002,-1.45], [6.6,5.26,1], [-Math.PI/2],
      {texture:finishes.floor,windowLight:true,castShadow:false});
    part("box",0xc9c5ce,[0,1.81,-4.14],[6.6,3.62,.12]);
    part("quad",0xffffff,[0,1.81,-4.078],[6.6,3.62,1],[],
      {texture:finishes.wall,windowLight:true,castShadow:false});
    part("box",0xb6b5c0,[0,1.066,-4.05],[6.6,.042,.060]);
    const windowZ=-1.45, windowY=2.05, windowW=2.18, windowH=2.15;
    const bottom=windowY-windowH/2, top=windowY+windowH/2;
    for (const z of [-3.31,.41]) part("box",0xc5cad5,[3.36,1.81,z],[.12,3.62,1.54]);
    part("box",0xc5cad5,[3.36,bottom/2,windowZ],[.12,bottom,windowW]);
    part("box",0xc5cad5,[3.36,(top+3.62)/2,windowZ],[.12,3.62-top,windowW]);
    part("box",0xb6a392,[0,.075,-4.035],[6.6,.15,.09]);
    part("box",0xb6a392,[3.255,.075,-1.45],[.09,.15,5.26]);
    part("box",0xc4ae99,[3.23,bottom-.055,windowZ],[.32,.09,windowW+.24]);
    const w=assets.models.window.bounds;
    model("window",multiply(transform(3.17,windowY,windowZ,(windowW+.17)/w.size[0],(windowH+.14)/w.size[1],2.3,0,-Math.PI/2),
      transform(-w.center[0],-w.center[1],-w.max[2])));

    // The downloaded two sashes supply the horizontal rail. A narrow solid
    // mullion splits both openings, including depth when viewed obliquely.
    const mullionWidth=.052, sashHalf=.012*(windowH+.14)/w.size[1];
    part("box",0xcab7a4,[3.22,windowY,windowZ],[.134,windowH+.095,mullionWidth]);
    const paneWidth=(windowW-mullionWidth)/2;
    const paneHeight=windowH/2-sashHalf;
    for (const vertical of [1,-1]) for (const horizontal of [-1,1]) {
      windowPanes.push({x:3.30,y:windowY+vertical*(sashHalf+paneHeight/2),
        z:windowZ+horizontal*(mullionWidth/2+paneWidth/2),width:paneWidth,height:paneHeight});
    }
    // Local +X is world +Z: canvas left-to-right matches the four hit regions.
    // The art is behind both physical sashes and stays inside the wall opening.
    architecture.push({shape:"quad", material:13, color:[1,1,1],
      model:transform(3.40,windowY,windowZ,windowW,windowH,1,0,-Math.PI/2),texture:windowArt.texture,
      castShadow:false,receiveShadow:false});
    addWindowCurtain(renderer, part);

    place("rug",[0,.006,-1.28],[4.8/1.57,1,3/.92]);
    place("sofa",[0,.024,-2.28],4.15/.98);
    stats.modelTriangles += addSofaContact(assets.models.sofa);
    part("sofaThrow",0xffffff,[0,0,0],[1,1,1],[],{texture:finishes.blanket,windowLight:true});
    part("linenPillow",0xffffff,[-1.22,1.23,-2.57],[.94,.43,.32],[-.25,.09,.12],
      {texture:finishes.ticking,windowLight:true});
    part("linenPillow",0xd8b18d,[1.18,1.34,-2.57],[.76,.65,.28],[-.22,-.07,-.13],{windowLight:true});
    const contact = (position,size) => architecture.push(object("quad",0xffffff,"shadow",position,
      [...size,1],[-Math.PI/2],{texture:finishes.shade,castShadow:false,receiveShadow:false}));
    contact([0,.020,-1.98],[4.65,1.50]);
    contact([.05,-.21,-1.41],[8.1,6.55]);
    const tableHeight=.87, tb=assets.models.table.bounds;
    const tableScale=[.67/tb.size[0],tableHeight/tb.size[1],.67/tb.size[2]];
    // A low family cabinet uses the same Kenney kit. The open shelves face +Z
    // so the main room camera can read them, with a gap beside the sofa arm.
    const cabinetX=-2.72, cabinetZ=-2.18, cabinetHeight=.72, cabinetFloor=.006;
    const cabinet=assets.models.sideboard.bounds;
    place("sideboard",[cabinetX,cabinetFloor,cabinetZ],
      [1.08/cabinet.size[0],cabinetHeight/cabinet.size[1],.62/cabinet.size[2]]);
    contact([cabinetX,.012,cabinetZ],[1.13,.67]);
    const cabinetTop=cabinetFloor+cabinetHeight;
    const familyLamp=[cabinetX-.24,cabinetTop,cabinetZ-.06];
    place("lamp",familyLamp,.83/assets.models.lamp.bounds.size[1]);
    const cabinetSY=cabinetHeight/cabinet.size[1];
    // Reorient the existing four-book asset into one horizontal family-album
    // stack. Centre it after rotation so its lowest cover rests on the shelf.
    const albums=assets.models.books.bounds, albumScale=[1.10,3.20,3.70];
    const albumBase=cabinetFloor+.08*cabinetSY;
    model("books",multiply(transform(cabinetX-.27,albumBase+albums.size[0]*albumScale[0]/2,
      cabinetZ+.035,...albumScale,0,0,-Math.PI/2),
      transform(-albums.center[0],-albums.center[1],-albums.center[2])));
    const windowTableZ = -3.30;
    place("table",[2.65,.006,windowTableZ],tableScale);
    // The plant reads on the way to the window. Its leaves stay below the arm
    // in the seated view so their tips don't break the sofa silhouette.
    place("plant",[2.63,tableHeight+.006,windowTableZ-.07],.63/assets.models.plant.bounds.size[1]);
    place("books",[2.88,tableHeight+.006,windowTableZ+.17],1.55,[0,-.12]);

    const teaX = -.48, teaZ = -.58, teaHeight = .48;
    const rugTop = .006 + assets.models.rug.bounds.size[1];
    const [width, height, depth] = assets.models.coffeeTable.bounds.size;
    place("coffeeTable", [teaX,rugTop,teaZ], [1.65/width,teaHeight/height,.90/depth]);
    contact([teaX,rugTop+.002,teaZ], [.89,.62]);
    addTeaThings(renderer, part, teaX, rugTop+teaHeight, teaZ);

    picture([-1.71,2.72,-4.04],1.1968,.94656);
    renderer.setLighting({keyIntensity:1.24,hemisphereIntensity:1.30,fillIntensity:.26,
      keyColor:0xf6d0b2,hemisphereColor:0xc6cde3,groundColor:0x9a95a8,fillColor:0xb9c5dc,
      keyPosition:[6.0,4.8,.35],keyTarget:[0,.8,-2],lampPosition:[familyLamp[0],cabinetTop+.62,familyLamp[2]],
      lampColor:0xffd3a1,lampIntensity:.76,exposure:1});
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
      if(name==="sideboard") {
        // Broad painted recess tones make the real shelf openings readable in
        // the wide shot. Keep all original positions, normals and topology.
        const position=node.geometry.attributes.position, normal=node.geometry.attributes.normal;
        const recess=position.clone();
        for(let i=0;i<position.count;i++) {
          const x=position.getX(i), y=position.getY(i), z=position.getZ(i);
          const nx=normal.getX(i), ny=normal.getY(i), nz=normal.getZ(i);
          const back=nz>.5&&z<-.20;
          const shelf=ny>.5&&y>.07&&y<.20;
          const ceiling=ny<-.5&&y>.16;
          const innerSide=Math.abs(nx)>.5&&x>.03&&x<.77;
          const tone = back ? .50 : ceiling ? .58 : innerSide ? .68 : shelf ? .74 : 1;
          recess.setXYZ(i,tone,tone,tone);
        }
        node.geometry.setAttribute("color",recess);
        for(const mat of Array.isArray(node.material)?node.material:[node.material]) {
          mat.vertexColors=true;mat.needsUpdate=true;
        }
      }
      for(const mat of Array.isArray(node.material)?node.material:[node.material]) {
        const color=palette[mat.name]; if(color!==undefined)mat.color.setHex(color);
        if(name==="frame"||name==="window")mat.color.setHex(0xcab7a4);
        if(name==="rug")mat.color.setHex(mat.name==="carpetDarker"?0xd5c9c0:0x9aaeb8);
        if(name==="plant"&&mat.name==="wood")mat.color.setHex(0xc68e72);
        if(name==="coffeeTable")mat.color.setHex(0xb88c69);
        if(name==="sideboard")mat.color.setHex(0xbc9478);
        if(name==="books") {
          const albumColors={carpetDarker:0x9d775e,carpetWhite:0xe6dcc5,plant:0x9baa92,metal:0x75877f};
          if(albumColors[mat.name]!==undefined)mat.color.setHex(albumColors[mat.name]);
        }
      }
      if(["frame","window"].includes(name))node.receiveShadow=false;
    });
    loaded.triangles=triangles; assets.models[name]=loaded;
    stats.models++;stats.modelTriangles+=triangles;
  })).then(()=>{buildRoom();stats.status="ready";return assets;}).catch(error=>{
    stats.status="error";stats.error=error.message;throw error;
  });
  function render(parent,reveal=0,timeSeconds=0,reduced=false,activeSeason=-1) {
    // The canvas painter throttles time-only changes and skips identical frames.
    windowArt?.update(reveal,timeSeconds,reduced,activeSeason);
    for(const mesh of architecture)renderer.draw(mesh,parent);
    for(const item of furniture)renderer.drawModel("room:"+item.name,parent?multiply(parent,item.matrix):item.matrix);
  }
  return {ready,render,stats,assets,windowPanes,scene:renderer.scene};
}
