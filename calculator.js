const THREAD_PRESETS={
  floss6:{label:"6-strand embroidery floss",ppi:9,note:"A medium-thick starting estimate when all 6 strands are used together."},
  floss3:{label:"3-strand embroidery floss",ppi:12,note:"Thinner than full floss, so more wrap passes usually fit into each inch."},
  pearl5:{label:"Pearl cotton #5",ppi:8,note:"A thicker pearl cotton starting estimate."},
  pearl8:{label:"Pearl cotton #8",ppi:11,note:"A medium pearl cotton starting estimate."},
  pearl10:{label:"Pearl cotton #10",ppi:13,note:"A finer pearl cotton starting estimate."},
  crochet10:{label:"Crochet / craft thread #10",ppi:10,note:"A general starting estimate for size-10 craft/crochet thread."},
  fineCord:{label:"Fine nylon / beading cord",ppi:14,note:"A fine-cord starting estimate; actual packing can vary quite a bit by material."},
  custom:{label:"Custom / measured thread",ppi:null,note:"Enter your own wrap passes per inch. This is best when you have measured your actual thread and tension."}
};

const BASE_THREAD_PRESETS={
  floss6:{label:"6-strand embroidery floss",wrapFactor:1.18,rowsPerInch:12,note:"Quite thick for a base thread, so wrapping thread usually travels farther around each pass."},
  floss3:{label:"3-strand embroidery floss",wrapFactor:1.10,rowsPerInch:16,note:"A medium-thick floss base."},
  pearl5:{label:"Pearl cotton #5",wrapFactor:1.15,rowsPerInch:11,note:"A thicker pearl-cotton base thread."},
  pearl8:{label:"Pearl cotton #8",wrapFactor:1.08,rowsPerInch:15,note:"A medium pearl-cotton base thread."},
  pearl10:{label:"Pearl cotton #10",wrapFactor:1.04,rowsPerInch:18,note:"A finer pearl-cotton base thread."},
  crochet10:{label:"Crochet / craft thread #10",wrapFactor:1.06,rowsPerInch:14,note:"A medium craft-thread base."},
  fineCord:{label:"Fine nylon / beading cord",wrapFactor:1.00,rowsPerInch:20,note:"A slim base-thread starting estimate."},
  custom:{label:"Custom / measured base thread",wrapFactor:1.00,rowsPerInch:16,note:"If your base thread is thicker or thinner than usual, fine-tune the estimate with a real sample."}
};

function fmtIn(value){
  const n=Number(value);
  if(!Number.isFinite(n)) return "0 in";
  const rounded=Math.round(n*10)/10;
  return `${rounded} in`;
}

function renderThreadNotes(){
  const wrapKey=$("threadType").value;
  const wrapPreset=THREAD_PRESETS[wrapKey]||THREAD_PRESETS.custom;
  const baseKey=$("baseThreadType").value;
  const basePreset=BASE_THREAD_PRESETS[baseKey]||BASE_THREAD_PRESETS.custom;

  const ppiText=wrapPreset.ppi!=null ? ` Suggested starting point: ${wrapPreset.ppi} wrap passes per inch.` : "";
  $("threadTypeNote").innerHTML=
    `<b>${wrapPreset.label}:</b> ${wrapPreset.note}${ppiText} ` +
    `The value in Wrap passes per inch is what the calculator will actually use when you tap Update All Values.`;

  const factorPct=Math.round((basePreset.wrapFactor-1)*100);
  const factorText=factorPct===0 ? `This uses the standard base-thread estimate.` :
    (factorPct>0 ? `This adds about ${factorPct}% to the wrapping-string estimate for the thicker base.` :
                    `This reduces the wrapping-string estimate by about ${Math.abs(factorPct)}%.`);
  const rowDensityText=basePreset.rowsPerInch
    ? ` Starting plastic-base estimate: about ${basePreset.rowsPerInch} rows per inch.`
    : "";
  $("baseThreadTypeNote").innerHTML=
    `<b>${basePreset.label}:</b> ${basePreset.note} ${factorText}${rowDensityText}`;
}

function markCalculatorDirty(){
  if($("calcDirtyNote")){
    $("calcDirtyNote").innerHTML='Changes waiting — tap <b>Update All Values</b>.';
  }
  autosaveCurrentProject();
}

function runCalculatorUpdate(){
  const btn=$("updateCalculatorBtn");
  const original=btn ? btn.textContent : "Update All Values";

  try{
    if(btn){
      btn.textContent="Updating…";
      btn.disabled=true;
    }

    renderThreadNotes();
    updateCalculator();

    if($("calcDirtyNote")){
      const now=new Date();
      $("calcDirtyNote").textContent=`Updated at ${now.toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}.`;
    }

    if(btn) btn.textContent="Updated ✓";
    autosaveCurrentProject();
  }catch(err){
    console.error("Calculator update failed:",err);
    if($("calcDirtyNote")){
      $("calcDirtyNote").textContent=`Calculation error: ${err && err.message ? err.message : "unknown error"}`;
    }
    if(btn) btn.textContent="Try Again";
  }finally{
    if(btn){
      setTimeout(()=>{
        btn.textContent=original;
        btn.disabled=false;
      },800);
    }
  }
}

function applyWrappingThreadPreset(){
  const preset=THREAD_PRESETS[$("threadType").value]||THREAD_PRESETS.custom;
  if(preset.ppi!=null) $("ppi").value=preset.ppi;
  renderThreadNotes();
  markCalculatorDirty();
}

function applyBaseThreadPreset(){
  const preset=BASE_THREAD_PRESETS[$("baseThreadType").value]||BASE_THREAD_PRESETS.custom;
  if($("baseRowsPerInch") && preset.rowsPerInch!=null){
    $("baseRowsPerInch").value=preset.rowsPerInch;
  }
  renderThreadNotes();
  updatePlasticBaseRows();
  markCalculatorDirty();
}

function updatePlasticBaseRows(){
  if(!$("plasticBaseWidth") || !$("plasticRows")) return null;

  const rawWidth=Number($("plasticBaseWidth").value);
  const unit=$("plasticBaseUnit")?.value==="mm" ? "mm" : "in";
  const density=Math.max(1,Number($("baseRowsPerInch").value)||16);

  if(!Number.isFinite(rawWidth) || rawWidth<=0){
    $("plasticRows").textContent="—";
    $("applyPlasticRowsBtn").disabled=true;
    $("plasticRowsNote").textContent=
      "Enter the plastic strip width. The row-density estimate is based on your selected base thread and can be adjusted after a test fit.";
    return null;
  }

  const widthIn=unit==="mm" ? rawWidth/25.4 : rawWidth;
  const estimated=Math.max(1,Math.round(widthIn*density));
  const graphLimit=60;

  $("plasticRows").textContent=estimated;
  $("applyPlasticRowsBtn").disabled=false;
  $("applyPlasticRowsBtn").dataset.rows=String(estimated);

  const widthLabel=unit==="mm"
    ? `${rawWidth.toFixed(rawWidth%1 ? 1 : 0)} mm (${widthIn.toFixed(2)} in)`
    : `${rawWidth.toFixed(2).replace(/\.00$/,"")} in`;

  const limitNote=estimated>graphLimit
    ? ` The current graph supports up to ${graphLimit} rows, so using this recommendation will set the graph to ${graphLimit} rows.`
    : "";

  $("plasticRowsNote").innerHTML=
    `<b>${widthLabel} × ${density} rows/in ≈ ${estimated} rows.</b> ` +
    `This is a starting estimate; actual spacing depends on the base thread and how tightly you place the strings.${limitNote}`;

  return estimated;
}

function updateCalculator(){
  const m=activeMatrix(); if(!m.length||!m[0].length)return;

  const canvasRows=m.length, canvasCols=m[0].length;
  const finished=Number($("finished").value)||0;
  const tie=Number($("tie").value)||0;
  const extra=Number($("baseExtra").value)||0;
  const ppi=Math.max(.1,Number($("ppi").value)||10);
  const waste=Math.max(0,Number($("waste").value)||0)/100;
  const sampleCols=Math.max(1,Number($("sampleCols").value)||10);
  const sampleUsed=Math.max(.01,Number($("sampleUsed").value)||36);
  const tail=Math.max(0,Number($("tail").value)||0);
  const baseThreadKey=$("baseThreadType")?.value||"fineCord";
  const basePreset=BASE_THREAD_PRESETS[baseThreadKey]||BASE_THREAD_PRESETS.custom;
  const plasticRecommendedRows=updatePlasticBaseRows();

  let on=0;
  let minRow=canvasRows, maxRow=-1;

  m.forEach((row,r)=>row.forEach((v,c)=>{
    if(v){
      on++;
      if(r<minRow) minRow=r;
      if(r>maxRow) maxRow=r;
    }
  }));

  // Use only the occupied pattern height for base strings.
  // Keep the full column count because left/right blank columns are usually real background.
  const activeRows = on ? (maxRow-minRow+1) : canvasRows;
  const activeCols = canvasCols;
  const totalActiveCells = activeRows * activeCols;
  const bgCells = Math.max(0, totalActiveCells - on);

  const each=finished+2*tie+extra;
  const baseTotal=each*activeRows;
  const graphLen=activeCols/ppi;

  // Calibration sample gives thread used per woven cell.
  // PPI also changes how much thread is needed for a requested physical bracelet length:
  // the graph width is activeCols passes, while a finished piece at the chosen PPI needs
  // roughly finished * ppi passes. Scale the working-thread estimate accordingly.
  const inchesPerCell=(sampleUsed/(sampleCols*activeRows))*basePreset.wrapFactor;
  const physicalPassTarget=Math.max(1,finished*ppi);
  const passScale=physicalPassTarget/Math.max(1,activeCols);
  const patternIn=on ? (on*inchesPerCell*passScale*(1+waste)+tail) : 0;
  const bgIn=bgCells ? (bgCells*inchesPerCell*passScale*(1+waste)+tail) : 0;

  $("baseCount").textContent=activeRows;
  $("passCount").textContent=activeCols;
  $("eachBase").textContent=fmtIn(each);
  $("graphLen").textContent=fmtIn(graphLen);
  $("baseTotal").textContent=fmtIn(baseTotal);
  $("workingTotal").textContent=fmtIn(patternIn+bgIn);

  const target=Math.round(finished*ppi);
  const delta=target-activeCols;
  let sizeMsg=Math.abs(delta)<=1
    ? `This graph is about the right length for ${finished}" at ${ppi} passes/in.`
    : delta>0
      ? `For about ${finished}" at ${ppi} passes/in, add roughly ${delta} graph columns.`
      : `At ${ppi} passes/in, this graph is roughly ${Math.abs(delta)} columns longer than ${finished}".`;

  const boundsMsg = on
    ? `Canvas: ${canvasRows} rows × ${canvasCols} columns. Active pattern height: ${activeRows} rows.`
    : `Canvas: ${canvasRows} rows × ${canvasCols} columns.`;

  const threadKey=$("threadType")?.value||"custom";
  const threadLabel=(THREAD_PRESETS[threadKey]||THREAD_PRESETS.custom).label;
  const baseLabel=basePreset.label;
  const plasticMsg=plasticRecommendedRows
    ? ` Plastic-base estimate: ${plasticRecommendedRows} rows.`
    : "";
  $("calcNote").innerHTML =
    `<b>${boundsMsg}</b> Wrapping thread: ${threadLabel}. Base thread: ${baseLabel}. Pattern cells: ${on.toLocaleString()}; background cells counted: ${bgCells.toLocaleString()}. ` +
    `Calibration used: ${sampleUsed}" of thread for ${sampleCols} full-width passes over ${activeRows} active rows, adjusted for base-thread thickness and ${ppi} passes/in. ` +
    sizeMsg + plasticMsg;

  if($("calcDirtyNote")){
    $("calcDirtyNote").textContent="Calculations are up to date.";
  }
}
