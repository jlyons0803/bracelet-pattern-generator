let craftMode="woven";

function setCraftMode(next){
  craftMode=next==="beaded" ? "beaded" : "woven";

  $("craftWoven").classList.toggle("active",craftMode==="woven");
  $("craftBeaded").classList.toggle("active",craftMode==="beaded");

  $("wovenCalculatorWrap").classList.toggle("hidden",craftMode!=="woven");
  $("beadCalculatorWrap").classList.toggle("hidden",craftMode!=="beaded");

  $("navCalcLabel").textContent=craftMode==="woven" ? "Calculator" : "Beads";
  $("designHeading").textContent=craftMode==="woven" ? "Design your bracelet" : "Design your beaded bracelet";
  $("designHint").textContent=craftMode==="woven"
    ? "Name generator + custom editor together"
    : "Use the same grid as a bead pattern";
  $("patternEyebrow").textContent=craftMode==="woven" ? "LIVE PATTERN" : "BEAD PATTERN";
  $("goCalculatorBtn").textContent=craftMode==="woven" ? "Calculate String" : "Calculate Beads";
  if($("printBtn")) $("printBtn").textContent=craftMode==="woven" ? "Print Pattern" : "Print Bead Pattern";

  if(craftMode==="beaded" && typeof updateBeadCalculator==="function"){
    updateBeadCalculator();
  }else if(craftMode==="woven" && typeof runCalculatorUpdate==="function"){
    runCalculatorUpdate();
  }

  // Keep the current pattern when switching modes.
  renderGrid();
}

$("craftWoven").addEventListener("click",()=>setCraftMode("woven"));
$("craftBeaded").addEventListener("click",()=>setCraftMode("beaded"));

function showAppPane(target){
  const panes={
    design:$("paneDesign"),
    calculator:$("paneCalculator"),
    projects:$("paneProjects")
  };
  const nav={
    design:$("navDesign"),
    calculator:$("navCalculator"),
    projects:$("navProjects")
  };

  Object.entries(panes).forEach(([key,el])=>el.classList.toggle("hidden",key!==target));
  Object.entries(nav).forEach(([key,el])=>el.classList.toggle("active",key===target));

  if(target==="design"){
    requestAnimationFrame(()=>renderGrid());
  }
  if(target==="calculator" && typeof markCalculatorDirty==="function"){
    markCalculatorDirty();
  }
  if(target==="projects" && typeof refreshProjectList==="function"){
    refreshProjectList(currentProjectId);
  }

  window.scrollTo({top:0,behavior:"smooth"});
}

$("navDesign").addEventListener("click",()=>showAppPane("design"));
$("navCalculator").addEventListener("click",()=>showAppPane("calculator"));
$("navProjects").addEventListener("click",()=>showAppPane("projects"));
$("goCalculatorBtn").addEventListener("click",()=>{showAppPane("calculator"); if(craftMode==="beaded") updateBeadCalculator();});
$("backToDesignBtn").addEventListener("click",()=>showAppPane("design"));
$("goProjectsBtn").addEventListener("click",()=>showAppPane("projects"));
$("projectsToDesignBtn").addEventListener("click",()=>showAppPane("design"));
$("beadBackToDesignBtn").addEventListener("click",()=>showAppPane("design"));
$("beadGoProjectsBtn").addEventListener("click",()=>showAppPane("projects"));


function ensurePopoutEditor(){
  let overlay=document.getElementById("graphPopoutEditor");
  if(overlay) return overlay;

  overlay=document.createElement("div");
  overlay.id="graphPopoutEditor";
  overlay.className="graphPopoutEditor";
  overlay.innerHTML=`
    <div class="graphPopoutHeader">
      <div class="graphPopoutTools"></div>
      <button type="button" id="graphPopoutDone" class="graphPopoutDone">Done</button>
    </div>
    <div class="graphPopoutCanvas"></div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector("#graphPopoutDone").addEventListener("click",()=>setGraphFullscreen(false));
  return overlay;
}

function setGraphFullscreen(on){
  const enabled=!!on;
  const overlay=ensurePopoutEditor();
  const graph=document.querySelector(".graphCenter");
  const draw=document.getElementById("toolDraw");
  const erase=document.getElementById("toolErase");
  if(!overlay || !graph) return;

  const tools=overlay.querySelector(".graphPopoutTools");
  const canvas=overlay.querySelector(".graphPopoutCanvas");

  if(enabled){
    document.body.classList.add("graphPopoutOpen");
    overlay.classList.add("open");

    tools.replaceChildren();
    canvas.replaceChildren();

    if(draw) tools.appendChild(draw);
    if(erase) tools.appendChild(erase);
    canvas.appendChild(graph);

    const btn=$("fullscreenGraphBtn");
    if(btn) btn.setAttribute("aria-pressed","true");

    requestAnimationFrame(()=>{
      if(typeof __v54RenderGrid==="function") __v54RenderGrid();
      else renderGrid();
    });
  }else{
    overlay.classList.remove("open");
    document.body.classList.remove("graphPopoutOpen");

    const btn=$("fullscreenGraphBtn");
    if(btn) btn.setAttribute("aria-pressed","false");

    // v69Apply knows the correct home for graph, Draw and Erase for
    // whichever Portrait/Landscape layout is selected.
    requestAnimationFrame(()=>{
      if(typeof v69Apply==="function") v69Apply();
      requestAnimationFrame(()=>{
        requestAnimationFrame(()=>{
          if(typeof __v54RenderGrid==="function") __v54RenderGrid();
          else renderGrid();
        });
      });
    });
  }
}

$("fullscreenGraphBtn").addEventListener("click",()=>setGraphFullscreen(true));
$("exitFullscreenGraphBtn").addEventListener("click",()=>setGraphFullscreen(false));

document.addEventListener("keydown",e=>{
  if(e.key==="Escape" && document.querySelector(".previewCard.graphFullscreen")){
    setGraphFullscreen(false);
  }
});

function handleResponsiveGraphResize(){
  clearTimeout(window.__wovenResizeTimer);
  window.__wovenResizeTimer=setTimeout(()=>{
    const popoutOpen=document.body.classList.contains("graphPopoutOpen");
    if(popoutOpen){
      const overlay=document.getElementById("graphPopoutEditor");
      if(overlay){
        // Force Safari to recalculate the viewport after iPad rotation.
        overlay.style.height="100dvh";
        overlay.style.width="100vw";
      }
      requestAnimationFrame(()=>{
        requestAnimationFrame(()=>{
          if(typeof __v54RenderGrid==="function") __v54RenderGrid();
          else renderGrid();
        });
      });
    }else{
      renderGrid();
    }
  },180);
}

window.addEventListener("resize",handleResponsiveGraphResize);
window.addEventListener("orientationchange",()=>{
  clearTimeout(window.__wovenOrientationTimer);
  window.__wovenOrientationTimer=setTimeout(()=>{
    handleResponsiveGraphResize();
  },260);
});

// Name controls
["name","nameRows","nameHeight","nameWidth","namePad","spacing","nameBorder","nameLetterColor","nameBgColor"].forEach(id=>$(id).addEventListener("input",updateName));
$("sendToDraw").addEventListener("click",sendNameToDraw);

function stepNumber(id,amount){
  const el=$(id);
  const min=Number(el.min);
  const max=Number(el.max);
  let value=Math.round(Number(el.value)||0)+amount;
  if(Number.isFinite(min)) value=Math.max(min,value);
  if(Number.isFinite(max)) value=Math.min(max,value);
  el.value=value;
  updateName();
}
$("nameHeightMinus").addEventListener("click",()=>stepNumber("nameHeight",-1));
$("nameHeightPlus").addEventListener("click",()=>stepNumber("nameHeight",1));
$("nameWidthMinus").addEventListener("click",()=>stepNumber("nameWidth",-1));
$("nameWidthPlus").addEventListener("click",()=>stepNumber("nameWidth",1));

// Draw controls/actions
$("resizeGraph").addEventListener("click",resizeCustomGraph);
$("rowsMinus").addEventListener("click",()=>stepGraphSize("rows",-1));
$("rowsPlus").addEventListener("click",()=>stepGraphSize("rows",1));
$("colsMinus10").addEventListener("click",()=>stepGraphSize("cols",-10));
$("colsMinus").addEventListener("click",()=>stepGraphSize("cols",-1));
$("colsPlus").addEventListener("click",()=>stepGraphSize("cols",1));
$("colsPlus10").addEventListener("click",()=>stepGraphSize("cols",10));



["drawRows","drawCols"].forEach(id=>{
  $(id).addEventListener("input",updateGraphSizeReadout);
  $(id).addEventListener("change",updateGraphSizeReadout);
});

$("fitCustomBtn").addEventListener("click",()=>{customFitToScreen=true; renderGrid();});
$("largeSquaresBtn").addEventListener("click",()=>{customFitToScreen=false; renderGrid();});
$("showGridNumbers").addEventListener("change",()=>{
  showGridNumbers=$("showGridNumbers").checked;
  renderGrid();
  autosaveCurrentProject();
});
$("clearBtn").addEventListener("click",()=>mutate("clear"));
$("fillBtn").addEventListener("click",()=>mutate("fill"));
$("invertBtn").addEventListener("click",()=>mutate("invert"));





function syncInlineGraphSizeControls(){
  if($("graphRowsSelect")) $("graphRowsSelect").value=String(Math.max(3,Math.min(60,drawMatrix.length || Number($("drawRows").value)||10)));
  if($("graphColsSelect")) $("graphColsSelect").value=String(Math.max(5,Math.min(200,(drawMatrix[0]?.length) || Number($("drawCols").value)||20)));
  refreshEditPositionOptions();
}

function refreshEditPositionOptions(){
  const axis=$("editAxisSelect")?.value || "";
  const pos=$("editPositionSelect");
  if(!pos) return;
  const prior=pos.value;
  pos.innerHTML='<option value="">Choose number</option>';
  if(!axis){
    pos.disabled=true;
    return;
  }
  const max=axis==="row" ? (drawMatrix.length || Number($("drawRows").value)||10)
                         : ((drawMatrix[0]?.length) || Number($("drawCols").value)||20);
  for(let i=1;i<=max;i++){
    const opt=document.createElement("option");
    opt.value=String(i);
    opt.textContent=String(i);
    pos.appendChild(opt);
  }
  pos.disabled=false;
  if(prior && Number(prior)<=max) pos.value=prior;
}

function applyGraphPresetValue(value){
  if(!value) return;
  const [rows,cols]=value.split("x").map(Number);
  applyGraphSize(rows,cols);
  syncInlineGraphSizeControls();
  $("graphPresetSelect").value="";
}

$("graphPresetSelect").addEventListener("change",e=>applyGraphPresetValue(e.target.value));

$("graphRowsSelect").addEventListener("change",()=>{
  applyGraphSize(Number($("graphRowsSelect").value), Number($("graphColsSelect").value));
  syncInlineGraphSizeControls();
});
$("graphColsSelect").addEventListener("change",()=>{
  applyGraphSize(Number($("graphRowsSelect").value), Number($("graphColsSelect").value));
  syncInlineGraphSizeControls();
});

$("graphOrientationSelect").addEventListener("change",()=>{
  const view=$("graphOrientationSelect").value;
  const portrait=view==="portrait";
  const card=document.querySelector(".previewCard");
  if(card) card.classList.toggle("graphPortraitView",portrait);

  if(typeof autoAdjustGraphForOrientation==="function"){
    autoAdjustGraphForOrientation(view);
  }

  requestAnimationFrame(()=>{
    if(typeof syncInlineGraphSizeControls==="function"){
      syncInlineGraphSizeControls();
    }
    if(document.body.classList.contains("graphPopoutOpen")){
      handleResponsiveGraphResize();
    }else{
      renderGrid();
    }
  });
});

$("editAxisSelect").addEventListener("change",()=>{
  $("editPositionSelect").value="";
  refreshEditPositionOptions();
});

$("insertSelectedBtn").addEventListener("click",()=>{
  const axis=$("editAxisSelect").value;
  const pos=$("editPositionSelect").value;
  if(!axis || !pos){
    if($("fitNote")) $("fitNote").textContent="Choose a row or column and a number first.";
    return;
  }
  if(axis==="row") insertBlankRowAt(pos);
  else insertBlankColumnAt(pos);
  syncInlineGraphSizeControls();
});

$("deleteSelectedBtn").addEventListener("click",()=>{
  const axis=$("editAxisSelect").value;
  const pos=$("editPositionSelect").value;
  if(!axis || !pos){
    if($("fitNote")) $("fitNote").textContent="Choose a row or column and a number first.";
    return;
  }
  if(axis==="row") deleteRowAt(pos);
  else deleteColumnAt(pos);
  $("editPositionSelect").value="";
  syncInlineGraphSizeControls();
});

$("randomPatternBtn").addEventListener("click",()=>{
  generateRandomPattern($("randomPatternStyle").value);
  autosaveCurrentProject();
});
$("undoBtn").addEventListener("click",undo);
function setStampCategory(category){
  document.querySelectorAll(".stampCategory").forEach(btn=>{
    btn.classList.toggle("active",btn.dataset.category===category);
  });
  document.querySelectorAll("[data-stamp]").forEach(btn=>{
    const show=category==="all" || btn.dataset.category===category;
    btn.classList.toggle("stampHidden",!show);
  });
}

document.querySelectorAll(".stampCategory").forEach(btn=>{
  btn.addEventListener("click",()=>setStampCategory(btn.dataset.category));
});

setStampCategory("all");

function renderToolSelection(){
  document.querySelectorAll(".graphTool").forEach(btn=>{
    const active=btn.dataset.tool===currentTool;
    btn.classList.toggle("active",active);
    if(btn.id==="toolStamp"){
      btn.classList.toggle("stampWaiting",active && !activeStamp);
    }
  });
}

function setGraphTool(tool){
  currentTool=tool;
  renderToolSelection();
  if($("fitNote")){
    if(tool==="draw") $("fitNote").textContent="Draw tool selected — tap or drag to add squares.";
    else if(tool==="erase") $("fitNote").textContent="Erase tool selected — tap or drag to remove squares.";
    else if(tool==="stamp") $("fitNote").textContent=activeStamp
      ? `${activeStamp} selected — tap the grid to place it.`
      : "Stamp tool selected — choose a stamp below, then tap the grid.";
    else if(tool==="fill") $("fitNote").textContent="Fill tool selected — tap a connected area to fill it.";
  }
}

function renderStampButtonPreviews(){
  document.querySelectorAll("#stampLibrary [data-stamp]").forEach(btn=>{
    const key=btn.dataset.stamp;
    const pattern=STAMPS[key];
    if(!pattern) return;
    const label=(btn.querySelector(".stampName")?.textContent || btn.title || key).trim();
    btn.innerHTML="";
    const preview=document.createElement("span");
    preview.className="stampPreview";
    preview.style.setProperty("--sp-rows",pattern.length);
    preview.style.setProperty("--sp-cols",pattern[0].length);
    pattern.forEach(row=>{
      row.split("").forEach(bit=>{
        const px=document.createElement("span");
        px.className="stampPixel"+(bit==="1"?" on":"");
        preview.appendChild(px);
      });
    });
    const name=document.createElement("span");
    name.className="stampName";
    name.textContent=label;
    btn.append(preview,name);
  });
}

renderStampButtonPreviews();
renderToolSelection();


document.querySelectorAll("[data-stamp]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    activeStamp=btn.dataset.stamp;
    document.querySelectorAll("[data-stamp]").forEach(b=>b.classList.toggle("active",b===btn));
    setGraphTool("stamp");
  });
});
document.querySelectorAll(".graphTool").forEach(btn=>{
  btn.addEventListener("click",()=>setGraphTool(btn.dataset.tool));
});

$("mirrorStamp").addEventListener("change",()=>{
  mirrorStampEnabled=$("mirrorStamp").checked;
  if($("mirrorStampNote")){
    $("mirrorStampNote").textContent=mirrorStampEnabled
      ? "Mirror is ON — place one stamp and its matching copy will appear on the opposite side."
      : "Turn on Mirror stamp, then place a stamp on one side. A matching stamp will appear the same distance from the center on the other side.";
  }
  autosaveCurrentProject();
});
$("addBorderBtn").addEventListener("click",addCustomBorder);
$("removeBorderBtn").addEventListener("click",removeCustomBorder);
$("drawBorderThickness").addEventListener("change",autosaveCurrentProject);
["drawLetterColor","drawBgColor"].forEach(id=>$(id).addEventListener("input",()=>{
  if(id==="drawLetterColor" && $("sidePatternColor")){
    $("sidePatternColor").value=$("drawLetterColor").value;
    if(typeof syncCompactColorDropdown==="function") syncCompactColorDropdown("patternColorSelect",$("drawLetterColor").value);
  }
  if(id==="drawBgColor" && $("sideBackgroundColor")){
    $("sideBackgroundColor").value=$("drawBgColor").value;
    if(typeof syncCompactColorDropdown==="function") syncCompactColorDropdown("backgroundColorSelect",$("drawBgColor").value);
  }
  if(mode==="draw")renderGrid();
}));
document.querySelectorAll(".paletteSwatch").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const target=$(btn.dataset.target);
    if(!target)return;
    target.value=btn.dataset.color;
    if(target.id==="drawLetterColor") $("sidePatternColor").value=btn.dataset.color;
    if(target.id==="drawBgColor") $("sideBackgroundColor").value=btn.dataset.color;
    renderGrid();
    autosaveCurrentProject();
  });
});
$("sidePatternColor").addEventListener("change",autosaveCurrentProject);
$("sideBackgroundColor").addEventListener("change",autosaveCurrentProject);

function syncCompactColorDropdown(selectId,color){
  const select=$(selectId);
  if(!select) return;
  const option=[...select.options].find(o=>o.value.toLowerCase()===String(color).toLowerCase());
  select.value=option ? option.value : "custom";
}

$("patternColorSelect").addEventListener("change",()=>{
  const value=$("patternColorSelect").value;
  if(value==="custom"){
    $("sidePatternColor").click();
    return;
  }
  $("drawLetterColor").value=value;
  $("sidePatternColor").value=value;
  renderGrid();
  autosaveCurrentProject();
});

$("backgroundColorSelect").addEventListener("change",()=>{
  const value=$("backgroundColorSelect").value;
  if(value==="custom"){
    $("sideBackgroundColor").click();
    return;
  }
  $("drawBgColor").value=value;
  $("sideBackgroundColor").value=value;
  renderGrid();
  autosaveCurrentProject();
});

$("sidePatternColor").addEventListener("input",()=>{
  $("drawLetterColor").value=$("sidePatternColor").value;
  syncCompactColorDropdown("patternColorSelect",$("sidePatternColor").value);
  renderGrid();
});
$("sideBackgroundColor").addEventListener("input",()=>{
  $("drawBgColor").value=$("sideBackgroundColor").value;
  syncCompactColorDropdown("backgroundColorSelect",$("sideBackgroundColor").value);
  renderGrid();
});

// Calculator controls
$("threadType").addEventListener("change",applyWrappingThreadPreset);
$("baseThreadType").addEventListener("change",applyBaseThreadPreset);
["finished","tie","baseExtra","ppi","waste","sampleCols","sampleUsed","tail"].forEach(id=>{
  $(id).addEventListener("input",markCalculatorDirty);
});

["plasticBaseWidth","baseRowsPerInch"].forEach(id=>{
  $(id).addEventListener("input",()=>{
    updatePlasticBaseRows();
    markCalculatorDirty();
  });
});
$("plasticBaseUnit").addEventListener("change",()=>{
  updatePlasticBaseRows();
  markCalculatorDirty();
});
$("applyPlasticRowsBtn").addEventListener("click",()=>{
  const recommended=Math.max(1,Number($("applyPlasticRowsBtn").dataset.rows)||0);
  if(!recommended) return;
  const rows=Math.min(60,recommended);
  const cols=(drawMatrix[0]?.length)||Number($("drawCols").value)||20;
  applyGraphSize(rows,cols);
  if(typeof syncInlineGraphSizeControls==="function") syncInlineGraphSizeControls();
  $("plasticRowsNote").innerHTML=
    `<b>Graph updated to ${rows} rows.</b>` +
    (recommended>60 ? ` Recommended value was ${recommended}, but the current graph limit is 60 rows.` : "");
  autosaveCurrentProject();
});
$("updateCalculatorBtn").addEventListener("click",()=>{
  if(typeof runCalculatorUpdate==="function"){
    runCalculatorUpdate();
  }else{
    $("calcDirtyNote").textContent="App files are out of sync. Refresh Safari once to load the newest version.";
  }
});

$("saveProject").addEventListener("click",()=>saveProjectNow(false));
$("openProject").addEventListener("click",openSelectedProject);
$("newProject").addEventListener("click",newProjectNow);
$("deleteProject").addEventListener("click",deleteSelectedProject);
$("exportProject").addEventListener("click",exportCurrentProject);
$("importProject").addEventListener("click",()=>$("importProjectFile").click());
$("importProjectFile").addEventListener("change",e=>{
  const file=e.target.files && e.target.files[0];
  if(file) importProjectFile(file);
});
$("projectSelect").addEventListener("change",()=>{
  const projects=readProjects();
  const id=$("projectSelect").value;
  if(id && projects[id]) $("projectName").value=projects[id].name||"Untitled Project";
  refreshProjectGallery(id||null);
});
$("projectName").addEventListener("input",autosaveCurrentProject);

if($("printBtn")) $("printBtn").addEventListener("click",()=>window.print());
if($("saveBtn")) $("saveBtn").addEventListener("click",saveSVG);

// V28 blank-start behavior:
 // Reopening the app starts completely blank. Saved projects remain available
 // in Projects and are loaded only when the user explicitly opens one.
 currentProjectId=null;
 $("projectName").value="";
 $("name").value="";
 $("nameRows").value=9;
 $("nameHeight").value=7;
 $("nameWidth").value=5;
 $("namePad").value=4;
 $("spacing").value=1;
 $("nameBorder").value=0;
 $("nameLetterColor").value="#183d7a";
 $("nameBgColor").value="#d9f3e8";
 $("drawBorderThickness").value=1;
 $("mirrorStamp").checked=false;
 mirrorStampEnabled=false;
 customBorderApplied=0;
$("showGridNumbers").checked=true;
showGridNumbers=true;

setCraftMode("woven");

if($("baseRowsPerInch")){
  const initialBase=BASE_THREAD_PRESETS[$("baseThreadType").value]||BASE_THREAD_PRESETS.custom;
  $("baseRowsPerInch").value=initialBase.rowsPerInch||16;
  updatePlasticBaseRows();
}

updateGraphSizeReadout();
syncInlineGraphSizeControls();

// Initial render
refreshProjectList();
renderThreadNotes();
nameMatrix=makeNameMatrix();
drawMatrix=blank(Number($("drawRows").value)||10,Number($("drawCols").value)||20);
customBorderApplied=0;
$("drawLetterColor").value=$("nameLetterColor").value;
$("drawBgColor").value=$("nameBgColor").value;
if($("sidePatternColor")) $("sidePatternColor").value=$("drawLetterColor").value;
if($("sideBackgroundColor")) $("sideBackgroundColor").value=$("drawBgColor").value;
if($("patternColorSelect")) syncCompactColorDropdown("patternColorSelect",$("drawLetterColor").value);
if($("backgroundColorSelect")) syncCompactColorDropdown("backgroundColorSelect",$("drawBgColor").value);
mode="draw";
currentTool="draw";
renderToolSelection();
$("modeBadge").textContent="Editable pattern";
$("patternTitle").textContent="MY PATTERN";
renderGrid();
if(typeof runCalculatorUpdate==="function") runCalculatorUpdate();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('./service-worker.js').catch(function(){});
  });
}


// V54 adaptive workspace layout
const workspaceAdaptive = {};

function makeAdaptiveToolCard(title){
  const card=document.createElement("section");
  card.className="adaptiveToolCard";
  if(title){
    const head=document.createElement("div");
    head.className="adaptiveToolTitle";
    head.textContent=title;
    card.appendChild(head);
  }
  return card;
}

function initAdaptiveWorkspace(){
  if(workspaceAdaptive.initialized) return;
  workspaceAdaptive.initialized=true;

  const previewCard=document.querySelector(".previewCard");
  const leftRail=document.querySelector(".graphSideLeft");
  const rightRail=document.querySelector(".graphSideRight");
  const graphWorkspace=document.querySelector(".graphWorkspace");
  const underBar=document.querySelector(".underGraphBar");
  const namePanel=$("namePanel");
  if(!previewCard || !leftRail || !rightRail || !graphWorkspace || !underBar || !namePanel) return;

  workspaceAdaptive.previewCard=previewCard;
  workspaceAdaptive.leftRail=leftRail;
  workspaceAdaptive.rightRail=rightRail;
  workspaceAdaptive.nameShell=namePanel.closest(".workspaceSection");
  if(workspaceAdaptive.nameShell) workspaceAdaptive.nameShell.style.display="none";

  const leftSections=leftRail.querySelectorAll(".sideRailSection");
  const rightSections=rightRail.querySelectorAll(".sideRailSection");
  workspaceAdaptive.presetSection=leftSections[0] || null;
  workspaceAdaptive.rowSection=leftRail.querySelector(".rowColumnSection") || leftSections[1] || null;
  workspaceAdaptive.patternSection=rightSections[0] || null;
  workspaceAdaptive.backgroundSection=rightSections[1] || null;
  workspaceAdaptive.borderSection=rightSections[2] || null;
  // V65: Pattern/background controls are moved into the left graph rail.
  // Hide the old shells so their headings do not remain below the generator.
  if(workspaceAdaptive.patternSection) workspaceAdaptive.patternSection.classList.add("movedColorShell");
  if(workspaceAdaptive.backgroundSection) workspaceAdaptive.backgroundSection.classList.add("movedColorShell");
  if(workspaceAdaptive.borderSection){
    workspaceAdaptive.borderSection.style.display="none";
  }
  workspaceAdaptive.clearBtn=$("clearBtn");

  const nameCard=makeAdaptiveToolCard("Name generator");
  nameCard.classList.add("nameGeneratorCard");
  if(workspaceAdaptive.presetSection) nameCard.appendChild(workspaceAdaptive.presetSection);
  nameCard.appendChild(namePanel);
  workspaceAdaptive.nameCard=nameCard;

  const sideNameMount=document.createElement("div");
  sideNameMount.className="sideRailSection";
  leftRail.insertBefore(sideNameMount, leftRail.firstChild);
  workspaceAdaptive.sideNameMount=sideNameMount;

  const wideLayout=document.createElement("div");
  wideLayout.className="wideToolLayout";
  wideLayout.id="wideToolLayout";
  wideLayout.innerHTML = `
    <div class="wideToolColumn">
      <div id="wideUnderGraphMount"></div>
      <div id="wideNameMount"></div>
      <div class="wideToolSplit">
        <div id="widePatternMount"></div>
        <div id="wideBackgroundMount"></div>
      </div>
      <div class="wideToolSplit bottomSplit">
        <div id="wideBorderMount"></div>
        <div id="wideClearMount"></div>
      </div>
    </div>
    <div class="wideToolColumn">
      <div id="wideEditMount"></div>
    </div>
  `;
  graphWorkspace.insertAdjacentElement("afterend", wideLayout);
  workspaceAdaptive.wideLayout=wideLayout;
  workspaceAdaptive.wideUnderGraphMount=wideLayout.querySelector("#wideUnderGraphMount");
  workspaceAdaptive.wideNameMount=wideLayout.querySelector("#wideNameMount");
  workspaceAdaptive.wideEditMount=wideLayout.querySelector("#wideEditMount");
  workspaceAdaptive.widePatternMount=wideLayout.querySelector("#widePatternMount");
  workspaceAdaptive.wideBackgroundMount=wideLayout.querySelector("#wideBackgroundMount");
  workspaceAdaptive.wideBorderMount=wideLayout.querySelector("#wideBorderMount");
  workspaceAdaptive.wideClearMount=wideLayout.querySelector("#wideClearMount");

  const clearToolCard=makeAdaptiveToolCard("");
  clearToolCard.classList.add("clearToolCard");
  if(workspaceAdaptive.clearBtn) clearToolCard.appendChild(workspaceAdaptive.clearBtn);
  workspaceAdaptive.clearToolCard=clearToolCard;

  workspaceAdaptive.quickGenerateBtn=document.getElementById("quickGenerateNameBtn");
  workspaceAdaptive.quickNameInput=document.getElementById("quickNameInput");
  workspaceAdaptive.leftModeRail=document.querySelector(".leftModeRail");
  workspaceAdaptive.leftColorTools=document.querySelector(".leftColorTools");
  workspaceAdaptive.toolDraw=document.getElementById("toolDraw");
  workspaceAdaptive.toolErase=document.getElementById("toolErase");
  workspaceAdaptive.nameControls=namePanel.querySelector(".compactNameControls");
  workspaceAdaptive.nameHeightField=document.getElementById("nameHeight")?.closest(".field") || null;
  workspaceAdaptive.nameWidthField=document.getElementById("nameWidth")?.closest(".field") || null;
  workspaceAdaptive.nameRowsField=document.getElementById("nameRows")?.closest(".field") || null;
  workspaceAdaptive.namePadField=document.getElementById("namePad")?.closest(".field") || null;
  workspaceAdaptive.nameSpacingField=document.getElementById("spacing")?.closest(".field") || null;
  workspaceAdaptive.nameBorderField=document.getElementById("nameBorder")?.closest(".field") || null;
  if(workspaceAdaptive.quickNameInput && !workspaceAdaptive.quickNameInput.dataset.enterGenerates){
    workspaceAdaptive.quickNameInput.dataset.enterGenerates="1";
    workspaceAdaptive.quickNameInput.addEventListener("keydown",e=>{
      if(e.key==="Enter"){
        e.preventDefault();
        const btn=document.getElementById("sendToDraw");
        if(btn) btn.click();
      }
    });
  }

  const underGraphCard=makeAdaptiveToolCard("");
  underGraphCard.classList.add("underGraphActionCard");
  underGraphCard.innerHTML=`
    <div class="underGraphTopRow">
      <div class="underGraphModeGroup"></div>
      <div class="underGraphColorGroup"></div>
    </div>
    <div class="underGraphBottomRow"></div>
  `;
  workspaceAdaptive.underGraphCard=underGraphCard;
  workspaceAdaptive.underGraphModeGroup=underGraphCard.querySelector(".underGraphModeGroup");
  workspaceAdaptive.underGraphColorGroup=underGraphCard.querySelector(".underGraphColorGroup");
  workspaceAdaptive.underGraphBottomRow=underGraphCard.querySelector(".underGraphBottomRow");
}

function moveNode(node, target){
  if(node && target) target.appendChild(node);
}

function v66RestoreNameFields(){
  const controls=workspaceAdaptive.nameControls;
  if(!controls) return;
  [workspaceAdaptive.nameHeightField,workspaceAdaptive.nameWidthField,workspaceAdaptive.nameRowsField,workspaceAdaptive.namePadField,workspaceAdaptive.nameSpacingField,workspaceAdaptive.nameBorderField]
    .forEach(node=>{ if(node) controls.appendChild(node); });
}

function v66ApplyUnderGraphLayout(){
  if(workspaceAdaptive.quickGenerateBtn) workspaceAdaptive.quickGenerateBtn.style.display="none";
  if(workspaceAdaptive.presetSection) workspaceAdaptive.presetSection.classList.add("v66Hidden");
  if(workspaceAdaptive.nameRowsField) workspaceAdaptive.nameRowsField.classList.add("v66Hidden");

  if(workspaceAdaptive.wideUnderGraphMount) moveNode(workspaceAdaptive.underGraphCard, workspaceAdaptive.wideUnderGraphMount);

  if(workspaceAdaptive.underGraphModeGroup){
    if(workspaceAdaptive.toolDraw) workspaceAdaptive.underGraphModeGroup.appendChild(workspaceAdaptive.toolDraw);
    if(workspaceAdaptive.toolErase) workspaceAdaptive.underGraphModeGroup.appendChild(workspaceAdaptive.toolErase);
  }
  if(workspaceAdaptive.underGraphColorGroup && workspaceAdaptive.leftColorTools){
    workspaceAdaptive.underGraphColorGroup.appendChild(workspaceAdaptive.leftColorTools);
  }
  if(workspaceAdaptive.underGraphBottomRow){
    [workspaceAdaptive.namePadField,workspaceAdaptive.nameSpacingField,workspaceAdaptive.nameBorderField].forEach(node=>{
      if(node) workspaceAdaptive.underGraphBottomRow.appendChild(node);
    });
  }
}

function v66RestoreSideLayout(){
  if(workspaceAdaptive.quickGenerateBtn) workspaceAdaptive.quickGenerateBtn.style.display="";
  if(workspaceAdaptive.presetSection) workspaceAdaptive.presetSection.classList.remove("v66Hidden");
  if(workspaceAdaptive.nameRowsField) workspaceAdaptive.nameRowsField.classList.remove("v66Hidden");

  if(workspaceAdaptive.leftModeRail){
    if(workspaceAdaptive.toolDraw) workspaceAdaptive.leftModeRail.insertBefore(workspaceAdaptive.toolDraw, workspaceAdaptive.leftModeRail.firstChild);
    if(workspaceAdaptive.toolErase) workspaceAdaptive.leftModeRail.insertBefore(workspaceAdaptive.toolErase, workspaceAdaptive.leftColorTools || null);
    if(workspaceAdaptive.leftColorTools) workspaceAdaptive.leftModeRail.appendChild(workspaceAdaptive.leftColorTools);
  }
  v66RestoreNameFields();
}

function updateAdaptiveWorkspace(){
  initAdaptiveWorkspace();
  if(!workspaceAdaptive.previewCard) return;

  const rows=(typeof drawMatrix!=="undefined" && drawMatrix.length) ? drawMatrix.length : Number($("graphRowsSelect")?.value||$("drawRows")?.value||9);
  const cols=(typeof drawMatrix!=="undefined" && drawMatrix[0]?.length) ? drawMatrix[0].length : Number($("graphColsSelect")?.value||$("drawCols")?.value||60);
  const controlsUnder=cols > rows;

  workspaceAdaptive.previewCard.classList.toggle("controlsUnderGraph", controlsUnder);
  workspaceAdaptive.previewCard.classList.toggle("controlsSideGraph", !controlsUnder);

  if(controlsUnder){
    if(workspaceAdaptive.wideLayout) workspaceAdaptive.wideLayout.style.display="grid";
    moveNode(workspaceAdaptive.nameCard, workspaceAdaptive.wideNameMount);
    moveNode(workspaceAdaptive.rowSection, workspaceAdaptive.wideEditMount);
    moveNode(workspaceAdaptive.patternSection, workspaceAdaptive.widePatternMount);
    moveNode(workspaceAdaptive.backgroundSection, workspaceAdaptive.wideBackgroundMount);
    moveNode(workspaceAdaptive.borderSection, workspaceAdaptive.wideBorderMount);
    moveNode(workspaceAdaptive.clearToolCard, workspaceAdaptive.wideClearMount);
    v66ApplyUnderGraphLayout();
  }else{
    if(workspaceAdaptive.wideLayout) workspaceAdaptive.wideLayout.style.display="none";
    moveNode(workspaceAdaptive.nameCard, workspaceAdaptive.sideNameMount);
    moveNode(workspaceAdaptive.rowSection, workspaceAdaptive.leftRail);
    moveNode(workspaceAdaptive.patternSection, workspaceAdaptive.rightRail);
    moveNode(workspaceAdaptive.backgroundSection, workspaceAdaptive.rightRail);
    moveNode(workspaceAdaptive.borderSection, workspaceAdaptive.rightRail);
    if(workspaceAdaptive.clearBtn) workspaceAdaptive.rightRail.appendChild(workspaceAdaptive.clearBtn);
    v66RestoreSideLayout();
  }

  // V67: the adaptive layout can change the graph holder width after the
  // first render. Recalculate cell size once the new layout has settled.
  const settledHolder=document.getElementById("gridScroll");
  const settledWidth=settledHolder ? settledHolder.clientWidth : 0;
  if(settledWidth>0 && workspaceAdaptive.lastSettledGridWidth!==settledWidth){
    workspaceAdaptive.lastSettledGridWidth=settledWidth;
    requestAnimationFrame(()=>{
      if(typeof __v54RenderGrid==="function") __v54RenderGrid();
    });
  }
}



// V61 toolbar + tool relocation
function initV61WorkspaceTweaks(){
  if(document.body.dataset.v61WorkspaceTweaks) return;
  document.body.dataset.v61WorkspaceTweaks="1";

  const graphToolBar=document.getElementById("graphToolBar");
  const graphCenter=document.querySelector(".graphCenter");
  const underGraphBar=document.querySelector(".underGraphBar");
  const stampWindow=document.querySelector(".graphStampWindow");
  const drawBtn=document.getElementById("toolDraw");
  const eraseBtn=document.getElementById("toolErase");
  const stampBtn=document.getElementById("toolStamp");
  const fillBtn=document.getElementById("toolFill");
  const graphToolButtons=document.querySelector(".graphToolButtons");
  const nameInput=document.getElementById("name");
  const sendNameBtn=document.getElementById("sendToDraw");
  const gridScroll=document.getElementById("gridScroll");
  const fitNote=document.getElementById("fitNote");

  if(graphToolBar && nameInput){
    const quickBar=document.createElement("div");
    quickBar.className="graphQuickBar";
    quickBar.innerHTML = `
      <div class="quickNameWrap">
        <label class="quickNameField">
          <span>Name</span>
          <input id="quickNameInput" type="text" maxlength="24" placeholder="Enter a name">
        </label>
        <button type="button" id="quickGenerateNameBtn" class="secondaryAction compactGenerateBtn">Generate</button>
      </div>
      <div class="quickStampSlot"></div>
    `;
    graphToolBar.insertBefore(quickBar, graphToolBar.firstChild);

    const quickNameInput=document.getElementById("quickNameInput");
    const quickGenerateNameBtn=document.getElementById("quickGenerateNameBtn");
    quickNameInput.value=nameInput.value || "";
    quickNameInput.addEventListener("input",()=>{
      nameInput.value=quickNameInput.value;
      nameInput.dispatchEvent(new Event("input",{bubbles:true}));
      if(typeof autosaveCurrentProject==="function") autosaveCurrentProject();
    });
    nameInput.addEventListener("input",()=>{
      if(document.activeElement !== quickNameInput){
        quickNameInput.value=nameInput.value || "";
      }
    });
    quickGenerateNameBtn.addEventListener("click",()=>{
      if(sendNameBtn) sendNameBtn.click();
    });

    if(stampWindow){
      const slot=quickBar.querySelector(".quickStampSlot");
      stampWindow.classList.add("stampWindowTop");
      slot.appendChild(stampWindow);
    }
  }

  if(graphCenter && gridScroll){
    let editWrap=graphCenter.querySelector(".graphEditWrap");
    if(!editWrap){
      editWrap=document.createElement("div");
      editWrap.className="graphEditWrap";
      graphCenter.insertBefore(editWrap, gridScroll);
      editWrap.appendChild(gridScroll);
    }
    if(fitNote && fitNote.parentElement!==graphCenter){
      graphCenter.appendChild(fitNote);
    }

    if(drawBtn && eraseBtn){
      const leftRail=document.createElement("div");
      leftRail.className="leftModeRail";
      leftRail.appendChild(drawBtn);
      leftRail.appendChild(eraseBtn);

      const patternSelect=document.getElementById("patternColorSelect");
      const patternPicker=document.getElementById("sidePatternColor");
      const backgroundSelect=document.getElementById("backgroundColorSelect");
      const backgroundPicker=document.getElementById("sideBackgroundColor");

      if(patternSelect && patternPicker && backgroundSelect && backgroundPicker){
        const colorTools=document.createElement("div");
        colorTools.className="leftColorTools";
        colorTools.innerHTML=`
          <div class="leftColorTool">
            <span>Pattern</span>
            <div class="leftColorControl"></div>
          </div>
          <div class="leftColorTool">
            <span>Background</span>
            <div class="leftColorControl"></div>
          </div>
        `;
        const controls=colorTools.querySelectorAll(".leftColorControl");
        controls[0].append(patternSelect,patternPicker);
        controls[1].append(backgroundSelect,backgroundPicker);
        leftRail.appendChild(colorTools);
      }

      editWrap.insertBefore(leftRail, editWrap.firstChild);
    }
  }

  if(graphToolButtons){
    graphToolButtons.classList.add("toolbarToolsMoved");
  }
  if(stampBtn) stampBtn.classList.add("toolHiddenV61");
  if(fillBtn) fillBtn.classList.add("toolHiddenV61");

  if(underGraphBar && underGraphBar.querySelector(".graphStampWindow")){
    // just in case move failed above, leave it but clean up spacing
  }
}
initV61WorkspaceTweaks();

const __v54RenderGrid = renderGrid;
renderGrid = function(){
  const result = __v54RenderGrid.apply(this, arguments);
  requestAnimationFrame(updateAdaptiveWorkspace);
  return result;
};

requestAnimationFrame(updateAdaptiveWorkspace);



// V69 explicit Portrait / Landscape workspace layouts — overflow/alignment fix
const v69LayoutState={initialized:false,nodes:{}};

function v69FindPatternLibrary(){
  return [...document.querySelectorAll("details.toolDrawer")].find(d=>{
    const b=d.querySelector("summary b");
    return b && b.textContent.trim().toLowerCase()==="pattern library";
  }) || null;
}
function v69FieldFor(id){
  const el=document.getElementById(id);
  return el ? el.closest(".field") : null;
}
function v69Move(node,target){
  if(node && target && node.parentElement!==target) target.appendChild(node);
}
function v69Init(){
  if(v69LayoutState.initialized) return;
  const preview=document.querySelector(".previewCard");
  const graphCenter=document.querySelector(".graphCenter");
  const orientation=document.getElementById("graphOrientationSelect");
  if(!preview || !graphCenter || !orientation) return;

  v69LayoutState.initialized=true;
  const n=v69LayoutState.nodes;
  n.preview=preview;
  n.graphCenter=graphCenter;
  n.graphEditWrap=graphCenter.querySelector(".graphEditWrap");
  n.orientationLabel=orientation.closest("label");
  n.rowsLabel=document.getElementById("graphRowsSelect")?.closest("label")||null;
  n.colsLabel=document.getElementById("graphColsSelect")?.closest("label")||null;
  n.fullscreen=document.getElementById("fullscreenGraphBtn");
  n.nameInput=document.getElementById("quickNameInput");
  n.stamp=document.querySelector(".graphStampWindow");
  n.patternLibrary=v69FindPatternLibrary();
  n.patternSelect=document.getElementById("patternColorSelect");
  n.patternPicker=document.getElementById("sidePatternColor");
  n.backgroundSelect=document.getElementById("backgroundColorSelect");
  n.backgroundPicker=document.getElementById("sideBackgroundColor");
  n.heightField=v69FieldFor("nameHeight");
  n.widthField=v69FieldFor("nameWidth");
  if(n.heightField) n.heightField.classList.add("v80HiddenNameSize");
  if(n.widthField) n.widthField.classList.add("v80HiddenNameSize");
  n.paddingField=v69FieldFor("namePad");
  n.spacingField=v69FieldFor("spacing");
  n.borderField=v69FieldFor("nameBorder");
  n.nameRowsField=v69FieldFor("nameRows");
  n.draw=document.getElementById("toolDraw");
  n.erase=document.getElementById("toolErase");
  n.rowColumn=document.querySelector(".rowColumnSection");
  n.undo=document.getElementById("undoBtn");
  n.clear=document.getElementById("clearBtn");
  n.generate=document.getElementById("sendToDraw");
  if(n.generate) n.generate.textContent="Generate";
  n.calculate=document.getElementById("goCalculatorBtn");
  n.nameCard=document.querySelector(".nameGeneratorCard");
  n.wideLayout=document.getElementById("wideToolLayout");
  n.quickTools=document.querySelector(".quickToolsBlock");
  n.graphToolBar=document.getElementById("graphToolBar");
  n.leftRail=document.querySelector(".graphSideLeft");
  n.rightRail=document.querySelector(".graphSideRight");
  n.underGraphBar=document.querySelector(".underGraphBar");
  n.quickGenerate=document.getElementById("quickGenerateNameBtn");
  n.modeBadge=document.getElementById("modeBadge");
  n.fitNote=document.getElementById("fitNote");

  const shell=document.createElement("div");
  shell.className="v69EditorShell";
  shell.innerHTML=`
    <div class="v69LandscapeTop">
      <div class="v69View"></div>
      <div class="v69Fullscreen"></div>
      <div class="v69Rows"></div>
      <div class="v69Cols"></div>
      <div class="v69Pattern"></div>
      <div class="v69Background"></div>
    </div>

    <div class="v69UpperCards">
      <section class="v69MiniCard"><div class="v69MiniTitle">Name</div><div class="v69Name"></div></section>
      <section class="v69MiniCard v69StampCard"><div class="v69Stamp"></div></section>
      <section class="v69MiniCard v69LibraryCard"><div class="v69Library"></div></section>
    </div>

    <div class="v69LandscapeMiddle">
      <div class="v69LeftControls"></div>
      <div class="v69SizeControls"></div>
      <div class="v69DrawControls"></div>
    </div>

    <div class="v69GraphGrid">
      <aside class="v69PortraitLeft"></aside>
      <div class="v69Graph"></div>
      <aside class="v69PortraitRight"></aside>
    </div>

    <div class="v83ColorRow">
      <div class="v83PatternUnderGraph"></div>
      <div class="v83BackgroundUnderGraph"></div>
    </div>

    <div class="v69PortraitFooter"></div>

    <div class="v69LandscapeFooter">
      <div class="v69Edit"></div>
      <div class="v69ActionStack">
        <div class="v69UndoClear"></div>
        <div class="v69Generate"></div>
        <div class="v69Calculate"></div>
      </div>
    </div>
  `;
  preview.appendChild(shell);
  n.shell=shell;

  const patternWrap=document.createElement("div");
  patternWrap.className="v69ColorControl";
  patternWrap.innerHTML='<span class="v69ControlLabel">Pattern</span><div class="v69ColorInner"></div>';
  if(n.patternSelect) patternWrap.querySelector(".v69ColorInner").appendChild(n.patternSelect);
  if(n.patternPicker) patternWrap.querySelector(".v69ColorInner").appendChild(n.patternPicker);
  n.patternWrap=patternWrap;

  const bgWrap=document.createElement("div");
  bgWrap.className="v69ColorControl";
  bgWrap.innerHTML='<span class="v69ControlLabel">Background</span><div class="v69ColorInner"></div>';
  if(n.backgroundSelect) bgWrap.querySelector(".v69ColorInner").appendChild(n.backgroundSelect);
  if(n.backgroundPicker) bgWrap.querySelector(".v69ColorInner").appendChild(n.backgroundPicker);
  n.bgWrap=bgWrap;

  const sizeWrap=document.createElement("div");
  sizeWrap.className="v69SizePair v80GraphSizePair";
  n.sizeWrap=sizeWrap;

  if(n.quickGenerate) n.quickGenerate.style.display="none";
  if(n.nameRowsField) n.nameRowsField.style.display="none";
  if(n.modeBadge) n.modeBadge.style.display="none";
  if(n.graphEditWrap){
    n.graphEditWrap.style.display="block";
    const oldMode=n.graphEditWrap.querySelector(".leftModeRail");
    if(oldMode) oldMode.style.display="none";
  }

  orientation.addEventListener("change",()=>requestAnimationFrame(v69Apply));
  requestAnimationFrame(v69Apply);
}


function v72EnforceOrientationLayout(view){
  const shell=v69LayoutState.nodes.shell;
  if(!shell) return;

  const top=shell.querySelector(".v69LandscapeTop");
  const upper=shell.querySelector(".v69UpperCards");
  const middle=shell.querySelector(".v69LandscapeMiddle");
  const graphGrid=shell.querySelector(".v69GraphGrid");
  const left=shell.querySelector(".v69PortraitLeft");
  const right=shell.querySelector(".v69PortraitRight");
  const portraitFooter=shell.querySelector(".v69PortraitFooter");
  const landscapeFooter=shell.querySelector(".v69LandscapeFooter");

  if(view==="portrait"){
    if(top){
      top.style.display="grid";
      top.style.gridTemplateColumns="minmax(110px,170px) minmax(150px,220px)";
      top.style.justifyContent="space-between";
    }
    if(upper){
      upper.style.display="grid";
      upper.style.gridTemplateColumns="minmax(180px,1fr) minmax(170px,.9fr) minmax(200px,1fr)";
    }
    if(middle) middle.style.display="none";
    if(graphGrid){
      graphGrid.style.display="grid";
      graphGrid.style.gridTemplateColumns="145px minmax(0,1fr) 175px";
      graphGrid.style.gap="10px";
      graphGrid.style.alignItems="start";
    }
    if(left){
      left.style.display="grid";
      left.style.gridTemplateColumns="1fr";
      left.style.gap="9px";
      left.style.alignContent="start";
    }
    if(right){
      right.style.display="grid";
      right.style.gridTemplateColumns="1fr";
      right.style.gap="9px";
      right.style.alignContent="start";
    }
    if(portraitFooter) portraitFooter.style.display="flex";
    if(landscapeFooter) landscapeFooter.style.display="none";
  }else{
    if(top){
      top.style.display="grid";
      top.style.gridTemplateColumns="minmax(95px,.8fr) minmax(135px,1fr) minmax(72px,.55fr) minmax(82px,.62fr) minmax(125px,1fr) minmax(135px,1.05fr)";
      top.style.justifyContent="";
    }
    if(upper){
      upper.style.display="grid";
      upper.style.gridTemplateColumns="minmax(220px,1.1fr) minmax(180px,.8fr) minmax(230px,1.1fr)";
    }
    if(middle){
      middle.style.display="grid";
      middle.style.gridTemplateColumns="minmax(320px,max-content) minmax(250px,max-content)";
      middle.style.justifyContent="start";
      middle.style.alignItems="end";
      middle.style.gap="12px";
    }
    if(graphGrid){
      graphGrid.style.display="grid";
      graphGrid.style.gridTemplateColumns="minmax(0,1fr) 120px";
      graphGrid.style.gap="12px";
      graphGrid.style.alignItems="center";
    }
    if(left) left.style.display="none";
    if(right){
      right.style.display="flex";
      right.style.flexDirection="column";
      right.style.gap="12px";
      right.style.justifyContent="center";
      right.style.alignItems="stretch";
    }
    if(portraitFooter) portraitFooter.style.display="none";
    if(landscapeFooter){
      landscapeFooter.style.display="grid";
      landscapeFooter.style.gridTemplateColumns="minmax(0,1fr) minmax(220px,260px)";
    }
  }
}




let v84UploadedImage=null;

function v84LoadImageFile(file){
  if(!file || !file.type?.startsWith("image/")) return;
  const reader=new FileReader();
  reader.onload=()=>{
    const img=new Image();
    img.onload=()=>{
      v84UploadedImage=img;
      const preview=document.getElementById("imageGraphPreview");
      const controls=document.getElementById("imageGraphControls");
      if(preview) preview.src=reader.result;
      if(controls) controls.hidden=false;
    };
    img.src=reader.result;
  };
  reader.readAsDataURL(file);
}


function v87FindContentBounds(img){
  const maxSample=320;
  const scale=Math.min(1,maxSample/Math.max(img.width,img.height));
  const w=Math.max(1,Math.round(img.width*scale));
  const h=Math.max(1,Math.round(img.height*scale));
  const canvas=document.createElement("canvas");
  canvas.width=w; canvas.height=h;
  const ctx=canvas.getContext("2d",{willReadFrequently:true});
  if(!ctx) return {x:0,y:0,w:img.width,h:img.height};

  ctx.fillStyle="#fff";
  ctx.fillRect(0,0,w,h);
  ctx.drawImage(img,0,0,w,h);
  const data=ctx.getImageData(0,0,w,h).data;

  // Estimate the outer background from the four corners.
  const pts=[[0,0],[w-1,0],[0,h-1],[w-1,h-1]];
  let br=0,bg=0,bb=0;
  for(const [x,y] of pts){
    const i=(y*w+x)*4;
    br+=data[i]; bg+=data[i+1]; bb+=data[i+2];
  }
  br/=4; bg/=4; bb/=4;

  let minX=w,minY=h,maxX=-1,maxY=-1;
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      const i=(y*w+x)*4;
      const dr=data[i]-br, dg=data[i+1]-bg, db=data[i+2]-bb;
      const dist=Math.sqrt(dr*dr+dg*dg+db*db);
      if(data[i+3]>40 && dist>34){
        if(x<minX) minX=x;
        if(y<minY) minY=y;
        if(x>maxX) maxX=x;
        if(y>maxY) maxY=y;
      }
    }
  }

  // If there is no clear foreground, use the whole image.
  if(maxX<minX || maxY<minY){
    return {x:0,y:0,w:img.width,h:img.height};
  }

  // Small padding so edges are not clipped.
  const padX=Math.max(1,Math.round((maxX-minX+1)*0.04));
  const padY=Math.max(1,Math.round((maxY-minY+1)*0.04));
  minX=Math.max(0,minX-padX);
  minY=Math.max(0,minY-padY);
  maxX=Math.min(w-1,maxX+padX);
  maxY=Math.min(h-1,maxY+padY);

  return {
    x:minX/scale,
    y:minY/scale,
    w:(maxX-minX+1)/scale,
    h:(maxY-minY+1)/scale
  };
}

function v87AutoGridSize(bounds){
  const ratio=bounds.w/Math.max(1,bounds.h);
  const landscape=ratio>=1;

  // Bracelet-friendly defaults while preserving subject proportions.
  let rows,cols;
  if(landscape){
    cols=20;
    rows=Math.round(cols/ratio);
    if(rows<5){ rows=5; cols=Math.round(rows*ratio); }
  }else{
    rows=20;
    cols=Math.round(rows*ratio);
    if(cols<5){ cols=5; rows=Math.round(cols/ratio); }
  }

  rows=Math.max(3,Math.min(60,rows));
  cols=Math.max(5,Math.min(200,cols));

  return {rows,cols,view:landscape?"landscape":"portrait"};
}


function v88ColorDistance(a,b){
  const dr=a[0]-b[0], dg=a[1]-b[1], db=a[2]-b[2];
  return Math.sqrt(dr*dr+dg*dg+db*db);
}

function v88DominantColor(data){
  // Quantize to 32-level buckets and choose the most frequent opaque bucket.
  const counts=new Map();
  for(let i=0;i<data.length;i+=4){
    if(data[i+3]<80) continue;
    const r=Math.round(data[i]/32)*32;
    const g=Math.round(data[i+1]/32)*32;
    const b=Math.round(data[i+2]/32)*32;
    const key=`${Math.min(255,r)},${Math.min(255,g)},${Math.min(255,b)}`;
    counts.set(key,(counts.get(key)||0)+1);
  }
  let best="255,255,255",bestCount=-1;
  for(const [key,count] of counts){
    if(count>bestCount){best=key;bestCount=count;}
  }
  return best.split(",").map(Number);
}

function v88SmartMatrix(ctx,rows,cols,threshold,invert){
  const px=ctx.getImageData(0,0,cols,rows).data;
  const bg=v88DominantColor(px);

  // Threshold slider now means "how different from the dominant background".
  // Map 40..220 into a useful RGB-distance range.
  const distanceCutoff=28 + ((threshold-40)/(220-40))*92;

  const matrix=Array.from({length:rows},()=>Array(cols).fill(0));
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const i=(r*cols+c)*4;
      let on=false;
      if(px[i+3]>=38){
        const here=[px[i],px[i+1],px[i+2]];
        on=v88ColorDistance(here,bg)>distanceCutoff;
      }
      if(invert) on=!on;
      matrix[r][c]=on?1:0;
    }
  }

  // Remove isolated single-cell noise while keeping connected motifs.
  const clean=matrix.map(row=>row.slice());
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      let neighbors=0;
      for(let rr=Math.max(0,r-1);rr<=Math.min(rows-1,r+1);rr++){
        for(let cc=Math.max(0,c-1);cc<=Math.min(cols-1,c+1);cc++){
          if(rr===r && cc===c) continue;
          if(matrix[rr][cc]) neighbors++;
        }
      }
      if(matrix[r][c] && neighbors===0) clean[r][c]=0;
    }
  }
  return clean;
}

function v84ConvertImageToGraph(){
  if(!v84UploadedImage) return;

  const img=v84UploadedImage;
  const bounds=v87FindContentBounds(img);
  const sizing=v87AutoGridSize(bounds);
  const rows=sizing.rows;
  const cols=sizing.cols;
  const threshold=Number(document.getElementById("imageGraphThreshold")?.value || 135);
  const invert=!!document.getElementById("imageGraphInvert")?.checked;
  const mode=document.getElementById("imageGraphMode")?.value || "smart";

  const orientation=document.getElementById("graphOrientationSelect");
  if(orientation){
    orientation.value=sizing.view;
    const card=document.querySelector(".previewCard");
    if(card) card.classList.toggle("graphPortraitView",sizing.view==="portrait");
  }

  const canvas=document.createElement("canvas");
  canvas.width=cols;
  canvas.height=rows;
  const ctx=canvas.getContext("2d",{willReadFrequently:true});
  if(!ctx) return;

  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality="high";
  ctx.fillStyle="#fff";
  ctx.fillRect(0,0,cols,rows);

  const scale=Math.min(cols/bounds.w,rows/bounds.h);
  const drawW=bounds.w*scale;
  const drawH=bounds.h*scale;
  const dx=(cols-drawW)/2;
  const dy=(rows-drawH)/2;
  ctx.drawImage(img,bounds.x,bounds.y,bounds.w,bounds.h,dx,dy,drawW,drawH);

  let matrix;

  if(mode==="smart"){
    // Best for bracelet/pixel/bead photos: detect the most common background
    // color and keep cells whose color differs from that background.
    matrix=v88SmartMatrix(ctx,rows,cols,threshold,invert);
  }else{
    const px=ctx.getImageData(0,0,cols,rows).data;
    matrix=Array.from({length:rows},()=>Array(cols).fill(0));
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        const i=(r*cols+c)*4;
        const lum=0.2126*px[i]+0.7152*px[i+1]+0.0722*px[i+2];
        let on;
        if(mode==="detail"){
          on=lum<Math.min(245,threshold+28);
        }else{
          on=lum<threshold;
        }
        if(px[i+3]<38) on=false;
        if(invert) on=!on;
        matrix[r][c]=on?1:0;
      }
    }
  }

  history.push(clone(drawMatrix));
  if(history.length>40) history.shift();

  drawMatrix=matrix;
  customBorderApplied=0;

  if($("drawRows")) $("drawRows").value=rows;
  if($("drawCols")) $("drawCols").value=cols;
  if($("graphRowsSelect")) $("graphRowsSelect").value=String(rows);
  if($("graphColsSelect")) $("graphColsSelect").value=String(cols);

  if(typeof syncInlineGraphSizeControls==="function") syncInlineGraphSizeControls();
  if(typeof updateGraphSizeReadout==="function") updateGraphSizeReadout();

  requestAnimationFrame(()=>{
    if(typeof v69Apply==="function") v69Apply();
    requestAnimationFrame(()=>{
      if(typeof __v54RenderGrid==="function") __v54RenderGrid();
      else renderGrid();
    });
  });

  if($("fitNote")){
    const method=mode==="smart" ? "smart background detection" : mode;
    $("fitNote").textContent=
      `Picture converted with ${method}: ${rows} rows × ${cols} columns, ${sizing.view} view.`;
  }

  if(typeof autosaveCurrentProject==="function") autosaveCurrentProject();
}

requestAnimationFrame(()=>{
  const upload=document.getElementById("imageGraphUpload");
  const convert=document.getElementById("convertImageToGraphBtn");
  if(upload && !upload.dataset.bound84){
    upload.dataset.bound84="1";
    upload.addEventListener("change",()=>v84LoadImageFile(upload.files?.[0]));
  }
  if(convert && !convert.dataset.bound84){
    convert.dataset.bound84="1";
    convert.addEventListener("click",v84ConvertImageToGraph);
  }
});

function v69Apply(){
  // V79: while the pop-out editor is open, keep the graph and editing
  // controls inside the overlay. Rotation should only resize the overlay.
  if(document.body.classList.contains("graphPopoutOpen")){
    requestAnimationFrame(()=>{
      if(typeof __v54RenderGrid==="function") __v54RenderGrid();
      else if(typeof renderGrid==="function") renderGrid();
    });
    return;
  }

  if(!v69LayoutState.initialized){
    v69Init();
    if(!v69LayoutState.initialized) return;
  }
  const n=v69LayoutState.nodes;
  const shell=n.shell;
  const view=document.getElementById("graphOrientationSelect")?.value==="portrait" ? "portrait" : "landscape";

  shell.classList.toggle("v69Portrait",view==="portrait");
  shell.classList.toggle("v69Landscape",view==="landscape");
  n.preview.classList.toggle("v69PortraitMode",view==="portrait");
  n.preview.classList.toggle("v69LandscapeMode",view==="landscape");

  // V72: force the selected orientation layout with inline grid rules so
  // Safari/iPad responsive breakpoints cannot collapse portrait into one column.
  v72EnforceOrientationLayout(view);

  // Hide legacy holders.
  [n.graphToolBar,n.leftRail,n.rightRail,n.underGraphBar,n.wideLayout,n.quickTools].forEach(node=>{
    if(node) node.classList.add("v69LegacyHidden");
  });
  if(n.nameCard) n.nameCard.classList.add("v69SourceHidden");

  // Common
  v69Move(n.orientationLabel,shell.querySelector(".v69View"));
  v69Move(n.nameInput,shell.querySelector(".v69Name"));
  v69Move(n.stamp,shell.querySelector(".v69Stamp"));
  v69Move(n.patternLibrary,shell.querySelector(".v69Library"));
  v69Move(n.graphCenter,shell.querySelector(".v69Graph"));

  if(view==="portrait"){
    // Layout 1 from sketch
    v69Move(n.patternWrap,shell.querySelector(".v83PatternUnderGraph"));
    v69Move(n.bgWrap,shell.querySelector(".v83BackgroundUnderGraph"));
    v69Move(n.rowsLabel,shell.querySelector(".v69PortraitLeft"));
    v69Move(n.colsLabel,shell.querySelector(".v69PortraitLeft"));
    v69Move(n.draw,shell.querySelector(".v69PortraitLeft"));
    v69Move(n.erase,shell.querySelector(".v69PortraitLeft"));
    v69Move(n.fullscreen,shell.querySelector(".v69PortraitLeft"));

    v69Move(n.borderField,shell.querySelector(".v69PortraitRight"));
    v69Move(n.paddingField,shell.querySelector(".v69PortraitRight"));
    v69Move(n.spacingField,shell.querySelector(".v69PortraitRight"));
    v69Move(n.rowColumn,shell.querySelector(".v69PortraitRight"));

    // Portrait actions: top row Undo + Clear, then Generate, then Calculate
    v69Move(n.undo,shell.querySelector(".v69PortraitFooter"));
    v69Move(n.clear,shell.querySelector(".v69PortraitFooter"));
    if(n.generate){
      n.generate.style.display="";
      v69Move(n.generate,shell.querySelector(".v69PortraitFooter"));
    }
    v69Move(n.calculate,shell.querySelector(".v69PortraitFooter"));
  }else{
    // Layout 2 from sketch
    v69Move(n.rowsLabel,shell.querySelector(".v69SizeControls"));
    v69Move(n.colsLabel,shell.querySelector(".v69SizeControls"));
    v69Move(n.patternWrap,shell.querySelector(".v83PatternUnderGraph"));
    v69Move(n.bgWrap,shell.querySelector(".v83BackgroundUnderGraph"));

    v69Move(n.borderField,shell.querySelector(".v69LeftControls"));
    v69Move(n.paddingField,shell.querySelector(".v69LeftControls"));
    v69Move(n.spacingField,shell.querySelector(".v69LeftControls"));
    // Rows and Columns now occupy the old Height / Width area.
    // V81: Draw / Erase beside the graph, with Full Screen directly underneath.
    v69Move(n.draw,shell.querySelector(".v69PortraitRight"));
    v69Move(n.erase,shell.querySelector(".v69PortraitRight"));
    v69Move(n.fullscreen,shell.querySelector(".v69PortraitRight"));

    v69Move(n.rowColumn,shell.querySelector(".v69Edit"));
    v69Move(n.undo,shell.querySelector(".v69UndoClear"));
    v69Move(n.clear,shell.querySelector(".v69UndoClear"));
    if(n.generate){
      n.generate.style.display="";
      v69Move(n.generate,shell.querySelector(".v69Generate"));
    }
    v69Move(n.calculate,shell.querySelector(".v69Calculate"));
  }

  requestAnimationFrame(()=>{
    v72EnforceOrientationLayout(view);
    if(typeof __v54RenderGrid==="function") __v54RenderGrid();
    else if(typeof renderGrid==="function") renderGrid();
  });
}

updateAdaptiveWorkspace=function(){ requestAnimationFrame(v69Apply); };
requestAnimationFrame(()=>{ v69Init(); requestAnimationFrame(v69Apply); });


