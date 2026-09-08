const PROJECT_STORAGE_KEY="wovenBraceletProjectsV11";
let currentProjectId=null;
let autosaveTimer=null;
let loadingProject=false;

function projectId(){
  return "p_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,8);
}
function readProjects(){
  try{
    const raw=localStorage.getItem(PROJECT_STORAGE_KEY);
    const data=raw?JSON.parse(raw):{};
    return data && typeof data==="object" ? data : {};
  }catch(e){ return {}; }
}
function writeProjects(projects){
  localStorage.setItem(PROJECT_STORAGE_KEY,JSON.stringify(projects));
}
function setProjectStatus(text){
  if($("projectStatus")) $("projectStatus").textContent=text;
}
function captureProjectState(){
  return {
    appVersion:11,
    savedAt:new Date().toISOString(),
    mode,
    craftMode,
    customFitToScreen,
    activeStamp:null,
    currentTool,
    nameSettings:{
      name:$("name").value,
      nameRows:$("nameRows").value,
      nameHeight:$("nameHeight").value,
      nameWidth:$("nameWidth").value,
      namePad:$("namePad").value,
      spacing:$("spacing").value,
      border:$("nameBorder").value,
      letterColor:$("nameLetterColor").value,
      bgColor:$("nameBgColor").value
    },
    drawSettings:{
      rows:$("drawRows").value,
      cols:$("drawCols").value,
      letterColor:$("drawLetterColor").value,
      bgColor:$("drawBgColor").value,
      borderThickness:$("drawBorderThickness").value,
      borderApplied:customBorderApplied,
      mirrorStamp:$("mirrorStamp").checked,
      showGridNumbers:$("showGridNumbers").checked,
      matrix:clone(drawMatrix)
    },
    calculator:{
      finished:$("finished").value,
      tie:$("tie").value,
      baseExtra:$("baseExtra").value,
      threadType:$("threadType").value,
      baseThreadType:$("baseThreadType").value,
      ppi:$("ppi").value,
      waste:$("waste").value,
      sampleCols:$("sampleCols").value,
      sampleUsed:$("sampleUsed").value,
      tail:$("tail").value,
      plasticBaseWidth:$("plasticBaseWidth")?.value||"",
      plasticBaseUnit:$("plasticBaseUnit")?.value||"in",
      baseRowsPerInch:$("baseRowsPerInch")?.value||"20"
    },
    beadCalculator:{
      finished:$("beadFinished").value,
      beadSize:$("beadSize").value,
      customBeadMM:$("customBeadMM").value,
      waste:$("beadWaste").value
    }
  };
}
function applyProjectState(state){
  if(!state || typeof state!=="object") throw new Error("Invalid project file");
  loadingProject=true;
  try{
    const n=state.nameSettings||{};
    if(n.name!=null) $("name").value=n.name;
    if(n.nameRows!=null) $("nameRows").value=n.nameRows;
    if(n.nameHeight!=null) $("nameHeight").value=n.nameHeight;
    if(n.nameWidth!=null) $("nameWidth").value=n.nameWidth;
    if(n.namePad!=null) $("namePad").value=n.namePad;
    if(n.spacing!=null) $("spacing").value=n.spacing;
    if(n.border!=null) $("nameBorder").value=n.border;
    if(n.letterColor) $("nameLetterColor").value=n.letterColor;
    if(n.bgColor) $("nameBgColor").value=n.bgColor;

    const d=state.drawSettings||{};
    if(d.rows!=null) $("drawRows").value=d.rows;
    if(d.cols!=null) $("drawCols").value=d.cols;
    if(d.letterColor) $("drawLetterColor").value=d.letterColor;
    if(d.bgColor) $("drawBgColor").value=d.bgColor;
    if($("sidePatternColor")) $("sidePatternColor").value=$("drawLetterColor").value;
    if($("sideBackgroundColor")) $("sideBackgroundColor").value=$("drawBgColor").value;
    if(d.borderThickness!=null) $("drawBorderThickness").value=d.borderThickness;
    customBorderApplied=Math.max(0,Math.min(3,Number(d.borderApplied)||0));
    $("mirrorStamp").checked=!!d.mirrorStamp;
    mirrorStampEnabled=$("mirrorStamp").checked;
    $("showGridNumbers").checked=d.showGridNumbers!==false;
    showGridNumbers=$("showGridNumbers").checked;
    if($("mirrorStampNote")){
      $("mirrorStampNote").textContent=mirrorStampEnabled
        ? "Mirror is ON — place one stamp and its matching copy will appear on the opposite side."
        : "Turn on Mirror stamp, then place a stamp on one side. A matching stamp will appear the same distance from the center on the other side.";
    }
    drawMatrix=Array.isArray(d.matrix) && d.matrix.length ? d.matrix.map(row=>row.map(v=>v?1:0)) : [];

    const c=state.calculator||{};
    const bc=state.beadCalculator||{};
    if(bc.finished!=null) $("beadFinished").value=bc.finished;
    if(bc.beadSize!=null) $("beadSize").value=bc.beadSize;
    if(bc.customBeadMM!=null) $("customBeadMM").value=bc.customBeadMM;
    if(bc.waste!=null) $("beadWaste").value=bc.waste;
    $("customBeadMM").disabled=$("beadSize").value!=="custom";
    if(c.threadType!=null && $("threadType").querySelector(`option[value="${c.threadType}"]`)){
      $("threadType").value=c.threadType;
    }else{
      $("threadType").value="floss6";
    }
    if(c.baseThreadType!=null && $("baseThreadType").querySelector(`option[value="${c.baseThreadType}"]`)){
      $("baseThreadType").value=c.baseThreadType;
    }else{
      $("baseThreadType").value="fineCord";
    }
    ["finished","tie","baseExtra","ppi","waste","sampleCols","sampleUsed","tail"].forEach(id=>{
      if(c[id]!=null) $(id).value=c[id];
    });
    if($("plasticBaseWidth")) $("plasticBaseWidth").value=c.plasticBaseWidth??"";
    if($("plasticBaseUnit")) $("plasticBaseUnit").value=c.plasticBaseUnit||"in";
    if($("baseRowsPerInch")){
      const preset=BASE_THREAD_PRESETS[$("baseThreadType").value]||BASE_THREAD_PRESETS.custom;
      $("baseRowsPerInch").value=c.baseRowsPerInch??preset.rowsPerInch??16;
    }
    renderThreadNotes();
    if(typeof updatePlasticBaseRows==="function") updatePlasticBaseRows();

    customFitToScreen=state.customFitToScreen!==false;
    history=[];
    activeStamp=null;
    currentTool=state.currentTool||"draw";
    renderToolSelection?.();
    document.querySelectorAll("[data-stamp]").forEach(b=>b.classList.remove("active"));
    nameMatrix=makeNameMatrix();
    switchMode(state.mode==="draw"?"draw":"name");
  }finally{
    loadingProject=false;
  }
  setCraftMode(state.craftMode==="beaded" ? "beaded" : "woven");
  if(craftMode==="beaded") updateBeadCalculator();
  else runCalculatorUpdate();
}

function matrixForProjectState(state){
  if(!state) return [];
  if(state.mode==="draw" && state.drawSettings && Array.isArray(state.drawSettings.matrix) && state.drawSettings.matrix.length){
    return state.drawSettings.matrix.map(row=>row.map(v=>v?1:0));
  }

  // Rebuild the name matrix from saved settings without changing the live UI.
  const n=state.nameSettings||{};
  const text=(n.name||"").toUpperCase();
  const spacing=Math.max(0,Number(n.spacing)||1);
  const nameHeight=Math.max(3,Math.min(40,Math.round(Number(n.nameHeight)||7)));
  const letterWidth=Math.max(3,Math.min(30,Math.round(Number(n.nameWidth)||5)));
  const requestedRows=Math.max(7,Math.min(60,Number(n.nameRows)||9));
  const sidePadding=Math.max(0,Math.min(30,Number(n.namePad)||0));
  const borderThickness=Math.max(0,Math.min(3,Number(n.border)||0));
  const chars=[...text].filter(ch=>FONT[ch]);

  const artWidth=chars.length ? (chars.length*letterWidth)+((chars.length-1)*spacing) : 0;
  const contentRows=Math.max(requestedRows,nameHeight);
  const borderGap=borderThickness>0 ? BORDER_GAP_ROWS : 0;
  const actualRows=contentRows+(borderThickness*2)+(borderGap*2);
  const actualCols=Math.max(10,artWidth+(sidePadding*2));
  const m=Array.from({length:actualRows},()=>Array(actualCols).fill(0));
  const top=borderThickness+borderGap+Math.floor((contentRows-nameHeight)/2);
  const left=chars.length ? Math.floor((actualCols-artWidth)/2) : 0;

  chars.forEach((ch,i)=>{
    const x0=left+i*(letterWidth+spacing);
    for(let r=0;r<nameHeight;r++){
      const sourceRow=Math.min(6,Math.floor(r*7/nameHeight));
      for(let c=0;c<letterWidth;c++){
        const sourceCol=Math.min(4,Math.floor(c*5/letterWidth));
        if(FONT[ch][sourceRow][sourceCol]==="1"){
          const rr=top+r, cc=x0+c;
          if(rr>=0 && rr<actualRows && cc>=0 && cc<actualCols) m[rr][cc]=1;
        }
      }
    }
  });
  if(borderThickness){
    const limit=Math.min(borderThickness,Math.ceil(actualRows/2));
    for(let r=0;r<limit;r++){
      for(let c=0;c<actualCols;c++){
        m[r][c]=1;
        m[actualRows-1-r][c]=1;
      }
    }
  }
  return m;
}
function drawProjectThumbnail(canvas,state){
  const m=matrixForProjectState(state);
  const ctx=canvas.getContext("2d");
  const W=canvas.width=300, H=canvas.height=184;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle="#ffffff";
  ctx.fillRect(0,0,W,H);
  if(!m.length || !m[0]?.length) return;

  const isDraw=state && state.mode==="draw";
  const colors=isDraw
    ? [state.drawSettings?.letterColor||"#183d7a", state.drawSettings?.bgColor||"#d9f3e8"]
    : [state.nameSettings?.letterColor||"#183d7a", state.nameSettings?.bgColor||"#d9f3e8"];

  const rows=m.length, cols=m[0].length;
  const pad=10;
  const cell=Math.max(1,Math.min((W-pad*2)/cols,(H-pad*2)/rows));
  const gridW=cell*cols, gridH=cell*rows;
  const ox=(W-gridW)/2, oy=(H-gridH)/2;

  ctx.fillStyle=colors[1];
  ctx.fillRect(ox,oy,gridW,gridH);
  ctx.fillStyle=colors[0];
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      if(m[r][c]) ctx.fillRect(ox+c*cell,oy+r*cell,Math.ceil(cell),Math.ceil(cell));
    }
  }
}
function refreshProjectGallery(selectedId=currentProjectId){
  const projects=readProjects();
  const gallery=$("projectGallery");
  if(!gallery) return;
  gallery.innerHTML="";

  const list=Object.values(projects).sort((a,b)=>(b.savedAt||"").localeCompare(a.savedAt||""));
  if(!list.length){
    const empty=document.createElement("div");
    empty.className="note";
    empty.textContent="Saved project previews will appear here.";
    gallery.appendChild(empty);
    return;
  }

  list.forEach(p=>{
    const card=document.createElement("button");
    card.type="button";
    card.className="projectThumb"+(p.id===selectedId?" selected":"");
    card.dataset.projectId=p.id;

    const canvas=document.createElement("canvas");
    drawProjectThumbnail(canvas,p.state);

    const title=document.createElement("div");
    title.className="projectThumbTitle";
    title.textContent=p.name||"Untitled Project";

    const meta=document.createElement("div");
    meta.className="projectThumbMeta";
    const modeText=p.state?.mode==="draw"?"Custom pattern":"Name pattern";
    let dateText="";
    try{
      dateText=new Date(p.savedAt).toLocaleDateString();
    }catch(e){}
    meta.textContent=modeText+(dateText?` • ${dateText}`:"");

    card.appendChild(canvas);
    card.appendChild(title);
    card.appendChild(meta);

    card.addEventListener("click",()=>{
      $("projectSelect").value=p.id;
      $("projectName").value=p.name||"Untitled Project";
      refreshProjectGallery(p.id);
    });

    card.addEventListener("dblclick",()=>{
      $("projectSelect").value=p.id;
      openSelectedProject();
    });

    gallery.appendChild(card);
  });
}

function refreshProjectList(selectedId=currentProjectId){
  const projects=readProjects();
  const sel=$("projectSelect");
  sel.innerHTML='<option value="">— Select a project —</option>';
  Object.values(projects)
    .sort((a,b)=>(b.savedAt||"").localeCompare(a.savedAt||""))
    .forEach(p=>{
      const opt=document.createElement("option");
      opt.value=p.id;
      opt.textContent=p.name||"Untitled Project";
      sel.appendChild(opt);
    });
  if(selectedId && projects[selectedId]) sel.value=selectedId;
  refreshProjectGallery(selectedId);
}
function saveProjectNow(forceNew=false){
  let projects=readProjects();
  let id=(!forceNew && currentProjectId && projects[currentProjectId]) ? currentProjectId : projectId();
  const name=($("projectName").value||"Untitled Project").trim()||"Untitled Project";
  const record={
    id,
    name,
    savedAt:new Date().toISOString(),
    state:captureProjectState()
  };
  record.state.savedAt=record.savedAt;
  projects[id]=record;
  writeProjects(projects);
  currentProjectId=id;
  refreshProjectList(id);
  setProjectStatus(`Saved "${name}" on this device.`);
  return record;
}
function autosaveCurrentProject(){
  if(loadingProject || !currentProjectId) return;
  clearTimeout(autosaveTimer);
  autosaveTimer=setTimeout(()=>{
    const projects=readProjects();
    if(!projects[currentProjectId]) return;
    const record=projects[currentProjectId];
    record.name=($("projectName").value||record.name||"Untitled Project").trim()||"Untitled Project";
    record.savedAt=new Date().toISOString();
    record.state=captureProjectState();
    record.state.savedAt=record.savedAt;
    projects[currentProjectId]=record;
    writeProjects(projects);
    refreshProjectList(currentProjectId);
    setProjectStatus(`Auto-saved "${record.name}".`);
  },450);
}
function openSelectedProject(){
  const id=$("projectSelect").value;
  const projects=readProjects();
  if(!id || !projects[id]){
    setProjectStatus("Choose a saved project first.");
    return;
  }
  const record=projects[id];
  currentProjectId=id;
  $("projectName").value=record.name||"Untitled Project";
  applyProjectState(record.state);
  refreshProjectList(id);
  setProjectStatus(`Opened "${record.name}".`);
}
function newProjectNow(){
  currentProjectId=null;
  $("projectName").value="My Bracelet";
  $("projectSelect").value="";
  loadingProject=true;
  try{
    $("name").value="";
    $("nameRows").value=9;
    $("nameHeight").value=7;
    $("nameWidth").value=5;
    $("namePad").value=4;
    $("spacing").value=1;
    $("nameBorder").value=0;
    $("nameLetterColor").value="#183d7a";
    $("nameBgColor").value="#d9f3e8";
    $("drawRows").value=9;
    $("drawCols").value=60;
    $("drawLetterColor").value="#183d7a";
    $("drawBgColor").value="#d9f3e8";
    $("drawBorderThickness").value=1;
    customBorderApplied=0;
    $("beadFinished").value=6.5;
    $("beadSize").value="2.0";
    $("customBeadMM").value="2.0";
    $("customBeadMM").disabled=true;
    $("beadWaste").value=10;
    setCraftMode("woven");
    $("mirrorStamp").checked=false;
    mirrorStampEnabled=false;
    $("showGridNumbers").checked=true;
    showGridNumbers=true;
    $("threadType").value="floss6";
    $("baseThreadType").value="fineCord";
    $("ppi").value=THREAD_PRESETS.floss6.ppi;
    if($("plasticBaseWidth")) $("plasticBaseWidth").value="";
    if($("plasticBaseUnit")) $("plasticBaseUnit").value="in";
    if($("baseRowsPerInch")) $("baseRowsPerInch").value=BASE_THREAD_PRESETS.fineCord.rowsPerInch||20;
    renderThreadNotes();
    if(typeof updatePlasticBaseRows==="function") updatePlasticBaseRows();
    history=[];
    currentTool="draw";
    renderToolSelection?.();
    document.querySelectorAll("[data-stamp]").forEach(b=>b.classList.remove("active"));
    customFitToScreen=true;
    nameMatrix=makeNameMatrix();
    drawMatrix=blank(Number($("drawRows").value)||10,Number($("drawCols").value)||20);
    customBorderApplied=Math.max(0,Math.min(3,Number($("nameBorder").value)||0));
    $("drawBorderThickness").value=customBorderApplied||1;
    $("drawRows").value=drawMatrix.length;
    $("drawCols").value=drawMatrix[0]?.length||1;
    $("drawLetterColor").value=$("nameLetterColor").value;
    $("drawBgColor").value=$("nameBgColor").value;
    switchMode("draw");
    $("patternTitle").textContent="MY PATTERN";
  }finally{
    loadingProject=false;
  }
  runCalculatorUpdate();
  setProjectStatus("New unsaved project.");
}
function deleteSelectedProject(){
  const id=$("projectSelect").value || currentProjectId;
  const projects=readProjects();
  if(!id || !projects[id]){
    setProjectStatus("Choose a saved project to delete.");
    return;
  }
  const name=projects[id].name||"project";
  delete projects[id];
  writeProjects(projects);
  if(currentProjectId===id) currentProjectId=null;
  refreshProjectList();
  setProjectStatus(`Deleted "${name}" from this device.`);
}
function safeProjectFilename(name){
  return (name||"woven_bracelet_project")
    .replace(/[^a-z0-9_-]+/gi,"_")
    .replace(/^_+|_+$/g,"")
    .slice(0,60) || "woven_bracelet_project";
}
function exportCurrentProject(){
  const name=($("projectName").value||"Woven Bracelet Project").trim();
  const payload={
    fileType:"woven-bracelet-project",
    fileVersion:1,
    projectName:name,
    exportedAt:new Date().toISOString(),
    state:captureProjectState()
  };
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=safeProjectFilename(name)+".woven.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  setProjectStatus(`Exported "${name}" as a project file.`);
}
async function importProjectFile(file){
  try{
    const text=await file.text();
    const payload=JSON.parse(text);
    if(payload.fileType!=="woven-bracelet-project" || !payload.state) throw new Error("Not a Woven Bracelet project file");
    currentProjectId=null;
    $("projectName").value=payload.projectName||"Imported Project";
    applyProjectState(payload.state);
    saveProjectNow(true);
    setProjectStatus(`Imported and saved "${$("projectName").value}".`);
  }catch(e){
    setProjectStatus("That file could not be imported as a Woven Bracelet project.");
  }finally{
    $("importProjectFile").value="";
  }
}
