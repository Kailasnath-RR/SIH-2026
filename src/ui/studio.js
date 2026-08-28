import { appState } from "../core/state.js";
import { apiClient } from "../services/apiClient.js";

const $ = (id) => document.getElementById(id);

export function initStudio() {
  if (!window.THREE) return;
  const canvas = $("shelterCanvas");
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Scene Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(6, 10, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 1024;
  sun.shadow.mapSize.height = 1024;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 30;
  scene.add(sun);

  camera.position.set(7, 5, 8);
  const group = new THREE.Group();
  scene.add(group);

  const climateGroup = new THREE.Group();
  scene.add(climateGroup);

  appState.three = {
    scene,
    camera,
    renderer,
    group,
    climateGroup,
    angle: 0.4,
    tilt: -0.12,
    distance: 9.5,
    sun,
    dragging: false
  };

  const fb = $("webglFallback");
  if (fb) fb.style.display = "none";

  // Event Listeners for Rotation & Zoom
  canvas.addEventListener("pointerdown", e => {
    appState.three.dragging = true;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointerup", e => {
    appState.three.dragging = false;
    canvas.releasePointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointercancel", () => { appState.three.dragging = false; });
  canvas.addEventListener("pointermove", e => {
    if (!appState.three.dragging) return;
    appState.three.angle += e.movementX * 0.012;
    appState.three.tilt = Math.max(-0.55, Math.min(0.38, appState.three.tilt + e.movementY * 0.008));
  });
  canvas.addEventListener("wheel", e => {
    e.preventDefault();
    appState.three.distance = Math.max(5.4, Math.min(14.0, appState.three.distance + e.deltaY * 0.006));
  }, { passive: false });

  animate();
  updateShelterGeometry();
}

function createMaterial(materialName) {
  if (materialName.includes("earth")) {
    // Compressed Earth Block (CEB): Terracotta/clay hue, high matte roughness
    return new THREE.MeshStandardMaterial({ color: 0x9c6644, roughness: 0.88, metalness: 0.02 });
  } else if (materialName.includes("steel")) {
    // Insulated Steel Panel: Metallic silver/gray, low roughness, slight reflectivity
    return new THREE.MeshStandardMaterial({ color: 0x8a9ba8, roughness: 0.35, metalness: 0.45 });
  } else {
    // Bamboo Composite / Timber: Warm timber hue, medium roughness
    return new THREE.MeshStandardMaterial({ color: 0xb59975, roughness: 0.65, metalness: 0.05 });
  }
}

export async function updateShelterGeometry() {
  if (!appState.three || !window.THREE) return;

  const g = appState.three.group;
  const cg = appState.three.climateGroup;
  while (g.children.length) g.remove(g.children[0]);
  while (cg.children.length) cg.remove(cg.children[0]);

  // Recalculate scores dynamically
  if (appState.analysis && appState.design) {
    const updatedRes = await apiClient.analyzeDesign(
      appState.selectedLocation || { name: "Guwahati", state: "Assam", lat: 26.14, lng: 91.73, elevation: 55 },
      appState.siteContext,
      appState.userOverrides
    );
    if (updatedRes && updatedRes.design) {
      appState.design.breakdown = updatedRes.design.breakdown;
      appState.design.totalScore = updatedRes.design.totalScore;
      const { renderScoreBreakdown } = await import("./design.js");
      renderScoreBreakdown(appState.design.breakdown);
    }
  }

  const isBefore = appState.beforeAfter;
  const recs = appState.design ? appState.design.params : {};

  // Active Parameters (Single Source of Truth)
  const activeRoof = isBefore ? "Flat" : (appState.userOverrides.roof || recs.roofType?.value || "Sloped");
  const activeVent = isBefore ? "Low" : (appState.userOverrides.ventilation || recs.ventilation?.value || "High");
  const activeShade = isBefore ? "Low" : (appState.userOverrides.shading || recs.shading?.value || "High");
  const activeOpenings = isBefore ? "Small" : (appState.userOverrides.openings || recs.openings?.value || "Large");
  const activeOverhang = isBefore ? 0.3 : (appState.userOverrides.overhang !== null ? appState.userOverrides.overhang : (recs.overhang?.value || 1.5));
  const activeRaised = isBefore ? false : (appState.userOverrides.raised !== null ? appState.userOverrides.raised : (recs.raisedFloor?.value ?? true));
  const activeMatName = isBefore ? "Generic masonry" : (appState.userOverrides.material && appState.userOverrides.material !== "Climate Recommended" ? appState.userOverrides.material : (recs.material?.value || "Bamboo composite"));

  // Architectural Dimensions
  const buildingW = 4.2;
  const buildingD = 3.0;
  const buildingH = 2.0;
  const raisedH = activeRaised ? 0.85 : 0.12;

  // Materials
  const wallMat = createMaterial(activeMatName);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x3a4b53, roughness: 0.5 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x55e5d3, transparent: true, opacity: 0.4, roughness: 0.1 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x4a7c9d, roughness: 0.5, metalness: 0.1 });
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x12222d, roughness: 0.9 });

  // 1. Ground Plane with Compass Rose Styling
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  g.add(ground);

  // 2. Foundation / Stilts & Floor Plate
  const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(buildingW + 0.2, 0.16, buildingD + 0.2), frameMat);
  floorMesh.position.set(0, raisedH, 0);
  floorMesh.receiveShadow = true; floorMesh.castShadow = true;
  g.add(floorMesh);

  if (activeRaised) {
    // Support Stilts / Columns
    const stiltMat = new THREE.MeshStandardMaterial({ color: 0x7de39b, roughness: 0.6 });
    for (const x of [-1.9, 0, 1.9]) {
      for (const z of [-1.3, 1.3]) {
        const stilt = new THREE.Mesh(new THREE.BoxGeometry(0.18, raisedH, 0.18), stiltMat);
        stilt.position.set(x, raisedH / 2, z);
        stilt.castShadow = true;
        g.add(stilt);
      }
    }
  }

  // 3. Structural Corner Posts & Top Plate Framing
  for (const x of [-buildingW / 2 + 0.08, buildingW / 2 - 0.08]) {
    for (const z of [-buildingD / 2 + 0.08, buildingD / 2 - 0.08]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, buildingH, 0.16), frameMat);
      post.position.set(x, raisedH + buildingH / 2, z);
      post.castShadow = true;
      g.add(post);
    }
  }

  // 4. Wall Panels with Clean Framed Window Cutouts
  const winWidth = activeOpenings === "Large" ? 1.4 : activeOpenings === "Medium" ? 0.9 : 0.5;
  const winHeight = activeVent === "High" ? 0.9 : activeVent === "Medium" ? 0.7 : 0.5;

  // Front Wall (Z = buildingD/2) with Window
  const fWallL = new THREE.Mesh(new THREE.BoxGeometry((buildingW - winWidth) / 2, buildingH, 0.12), wallMat);
  fWallL.position.set(-(buildingW + winWidth) / 4, raisedH + buildingH / 2, buildingD / 2);
  fWallL.castShadow = true;

  const fWallR = new THREE.Mesh(new THREE.BoxGeometry((buildingW - winWidth) / 2, buildingH, 0.12), wallMat);
  fWallR.position.set((buildingW + winWidth) / 4, raisedH + buildingH / 2, buildingD / 2);
  fWallR.castShadow = true;

  const fWallTop = new THREE.Mesh(new THREE.BoxGeometry(winWidth, (buildingH - winHeight) / 2, 0.12), wallMat);
  fWallTop.position.set(0, raisedH + buildingH - (buildingH - winHeight) / 4, buildingD / 2);
  fWallTop.castShadow = true;

  const fWallBtm = new THREE.Mesh(new THREE.BoxGeometry(winWidth, (buildingH - winHeight) / 2, 0.12), wallMat);
  fWallBtm.position.set(0, raisedH + (buildingH - winHeight) / 4, buildingD / 2);
  fWallBtm.castShadow = true;

  const fGlass = new THREE.Mesh(new THREE.BoxGeometry(winWidth - 0.04, winHeight - 0.04, 0.04), glassMat);
  fGlass.position.set(0, raisedH + buildingH / 2, buildingD / 2);

  g.add(fWallL, fWallR, fWallTop, fWallBtm, fGlass);

  // Back Wall (Z = -buildingD/2) with Opposing Cross-Ventilation Window
  const bWallL = fWallL.clone(); bWallL.position.z = -buildingD / 2;
  const bWallR = fWallR.clone(); bWallR.position.z = -buildingD / 2;
  const bWallTop = fWallTop.clone(); bWallTop.position.z = -buildingD / 2;
  const bWallBtm = fWallBtm.clone(); bWallBtm.position.z = -buildingD / 2;
  const bGlass = fGlass.clone(); bGlass.position.z = -buildingD / 2;

  g.add(bWallL, bWallR, bWallTop, bWallBtm, bGlass);

  // Side Walls (Left & Right)
  const lWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, buildingH, buildingD), wallMat);
  lWall.position.set(-buildingW / 2, raisedH + buildingH / 2, 0);
  lWall.castShadow = true;

  const rWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, buildingH, buildingD), wallMat);
  rWall.position.set(buildingW / 2, raisedH + buildingH / 2, 0);
  rWall.castShadow = true;

  g.add(lWall, rWall);

  // 5. High-Level Clerestory Vents / Louvers (when Ventilation is High)
  if (activeVent === "High") {
    const louverMat = new THREE.MeshStandardMaterial({ color: 0x55e5d3, roughness: 0.3 });
    for (let y = 0; y < 3; y++) {
      const louver = new THREE.Mesh(new THREE.BoxGeometry(winWidth, 0.04, 0.18), louverMat);
      louver.position.set(0, raisedH + buildingH - 0.2 + y * 0.08, buildingD / 2 + 0.04);
      louver.rotation.x = 0.3;
      g.add(louver);
    }
  }

  // 6. External Brise-Soleil Shading Devices / Fins
  if (activeShade !== "Low") {
    const finMat = new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.4 });
    const shadeDepth = activeShade === "High" ? 0.65 : 0.35;

    const shadeVisor = new THREE.Mesh(new THREE.BoxGeometry(winWidth + 0.4, 0.06, shadeDepth), finMat);
    shadeVisor.position.set(0, raisedH + buildingH / 2 + winHeight / 2 + 0.1, buildingD / 2 + shadeDepth / 2);
    shadeVisor.castShadow = true;
    g.add(shadeVisor);
  }

  // 7. Roof Geometry (Flat, Sloped Gable, Double Roof with Air Gap)
  const roofW = buildingW + activeOverhang * 2;
  const roofD = buildingD + activeOverhang * 2;

  if (activeRoof === "Flat") {
    // Heavy Flat Insulated Roof Slab
    const flatRoof = new THREE.Mesh(new THREE.BoxGeometry(roofW, 0.22, roofD), roofMat);
    flatRoof.position.set(0, raisedH + buildingH + 0.11, 0);
    flatRoof.castShadow = true; flatRoof.receiveShadow = true;
    g.add(flatRoof);
  } else if (activeRoof === "Sloped") {
    // Sloped Gable Roof with Ridge & Exposed Rafters
    const roofGroup = new THREE.Group();
    const pitch = 0.45;
    const roofH = 1.2;

    const leftSlope = new THREE.Mesh(new THREE.BoxGeometry(roofW, 0.16, roofD / 2 + 0.2), roofMat);
    leftSlope.position.set(0, raisedH + buildingH + roofH / 2, -roofD / 4);
    leftSlope.rotation.x = pitch;
    leftSlope.castShadow = true;

    const rightSlope = new THREE.Mesh(new THREE.BoxGeometry(roofW, 0.16, roofD / 2 + 0.2), roofMat);
    rightSlope.position.set(0, raisedH + buildingH + roofH / 2, roofD / 4);
    rightSlope.rotation.x = -pitch;
    rightSlope.castShadow = true;

    roofGroup.add(leftSlope, rightSlope);

    // Gable End Triangular Closure
    const gableMat = wallMat;
    const gableL = new THREE.Mesh(new THREE.BufferGeometry(), gableMat);
    roofGroup.add(gableL);

    g.add(roofGroup);
  } else if (activeRoof === "Double roof") {
    // Inner Ceiling Slab + Air Gap + Secondary Sun Canopy
    const innerRoof = new THREE.Mesh(new THREE.BoxGeometry(buildingW + 0.2, 0.14, buildingD + 0.2), roofMat);
    innerRoof.position.set(0, raisedH + buildingH + 0.07, 0);
    innerRoof.castShadow = true;

    // Air Gap Support Posts
    for (const x of [-buildingW / 2, buildingW / 2]) {
      const airPost = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, buildingD), frameMat);
      airPost.position.set(x, raisedH + buildingH + 0.28, 0);
      g.add(airPost);
    }

    // Outer Solar Canopy Roof Plane
    const outerCanopy = new THREE.Mesh(new THREE.BoxGeometry(roofW, 0.14, roofD), new THREE.MeshStandardMaterial({ color: 0x55e5d3, roughness: 0.3 }));
    outerCanopy.position.set(0, raisedH + buildingH + 0.5, 0);
    outerCanopy.castShadow = true;

    g.add(innerRoof, outerCanopy);
  }

  // 8. Conceptual Climate Response Vectors (when Simulate Climate is ON)
  if (appState.simulating) {
    // Sun Sphere & Directional Solar Beam
    const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffd166 }));
    sunMesh.position.set(4.5, raisedH + buildingH + 3.5, 3.5);
    cg.add(sunMesh);

    const solarBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 5), new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.6 }));
    solarBeam.position.set(2.25, raisedH + buildingH + 1.75, 1.75);
    solarBeam.rotation.z = -0.6;
    cg.add(solarBeam);

    // Airflow Particles (Wind flowing straight through open window inlet -> outlet)
    if (activeVent !== "Low") {
      const windMat = new THREE.MeshBasicMaterial({ color: 0x55e5d3, transparent: true, opacity: 0.7 });
      for (let i = 0; i < 5; i++) {
        const particle = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 8), windMat);
        particle.position.set(-1.2 + i * 0.6, raisedH + buildingH / 2, -buildingD / 2 - 0.8 + i * 0.8);
        particle.rotation.x = Math.PI / 2;
        cg.add(particle);
      }
    }

    // Rain Runoff Streams (if High Rain)
    if (appState.analysis?.env?.rainfall !== "Low") {
      const rainMat = new THREE.MeshBasicMaterial({ color: 0x77a7ff, transparent: true, opacity: 0.7 });
      for (let x of [-1.8, 0, 1.8]) {
        const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2), rainMat);
        drop.position.set(x, raisedH + buildingH + 1.2, buildingD / 2 + activeOverhang);
        cg.add(drop);
      }
    }
  }

  // Update Studio Title
  const studioTitleEl = $("studioTitle");
  if (studioTitleEl) {
    studioTitleEl.textContent = isBefore
      ? "BEFORE: Generic Un-Adapted Shelter"
      : `${activeRoof} Climate-Adapted Shelter`;
  }
}

function animate() {
  if (!appState.three) return;
  const { renderer, scene, camera, group, climateGroup } = appState.three;

  group.rotation.y = appState.three.angle;
  group.rotation.x = appState.three.tilt;
  if (climateGroup) {
    climateGroup.rotation.y = appState.three.angle;
    climateGroup.rotation.x = appState.three.tilt;
  }

  const distance = appState.three.distance;
  camera.position.set(Math.sin(appState.three.angle) * distance, 4.2 + appState.three.tilt * -2.5, Math.cos(appState.three.angle) * distance);
  camera.lookAt(0, 1.1, 0);

  if (!appState.three.dragging) appState.three.angle += 0.0012;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
