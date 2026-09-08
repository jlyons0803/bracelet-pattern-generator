function paintStampAt(centerRow,centerCol,stampRows){
  const height=stampRows.length;
  const width=stampRows[0].length;
  const startRow=centerRow-Math.floor(height/2);
  const startCol=centerCol-Math.floor(width/2);

  for(let r=0;r<height;r++){
    for(let c=0;c<width;c++){
      const rr=startRow+r;
      const cc=startCol+c;
      if(rr<0 || cc<0 || rr>=drawMatrix.length || cc>=drawMatrix[0].length) continue;
      if(stampRows[r][c]==="1") drawMatrix[rr][cc]=1;
    }
  }
}

function placeStampAt(centerRow,centerCol,stampRows){
  paintStampAt(centerRow,centerCol,stampRows);

  if(!mirrorStampEnabled || !drawMatrix.length) return;

  // Mirror around the exact horizontal center of the graph.
  // Example: on a 60-column graph, column 10 mirrors to column 49.
  const cols=drawMatrix[0].length;
  const mirroredCenterCol=(cols-1)-centerCol;

  if(mirroredCenterCol!==centerCol){
    paintStampAt(centerRow,mirroredCenterCol,stampRows);
  }
}

function sendNameToDraw(){
  // Build a fresh name matrix using the current name settings.
  nameMatrix=makeNameMatrix();

  // Copy it into the editable custom grid.
  drawMatrix=clone(nameMatrix);

  // Record the generated border so Remove Border can safely remove only
  // the border and spacer rows, never any part of the name.
  customBorderApplied=Math.max(0,Math.min(3,Number($("nameBorder").value)||0));
  $("drawBorderThickness").value=customBorderApplied || 1;

  // Update the custom grid size controls to match what was copied.
  $("drawRows").value=drawMatrix.length;
  $("drawCols").value=drawMatrix[0]?.length || 1;

  // Keep the same colors so the pattern looks identical when transferred.
  $("drawLetterColor").value=$("nameLetterColor").value;
  $("drawBgColor").value=$("nameBgColor").value;

  history=[];
  customFitToScreen=true;
  switchMode("draw");
  $("patternTitle").textContent=($("name").value.toUpperCase() || "NAME") + " — EDITABLE";
  if($("fitNote")){
    $("fitNote").textContent="Name loaded into the editor. You can now draw, erase, resize, add borders, or add picture stamps.";
  }
}


function inBounds(matrix,r,c){
  return r>=0 && c>=0 && r<matrix.length && c<matrix[0].length;
}

function floodFillAt(r,c){
  if(mode!=="draw" || !drawMatrix.length || !inBounds(drawMatrix,r,c)) return false;
  const target=drawMatrix[r][c];
  const replacement=target ? 0 : 1;
  const stack=[[r,c]];
  while(stack.length){
    const [cr,cc]=stack.pop();
    if(!inBounds(drawMatrix,cr,cc) || drawMatrix[cr][cc]!==target) continue;
    drawMatrix[cr][cc]=replacement;
    stack.push([cr+1,cc],[cr-1,cc],[cr,cc+1],[cr,cc-1]);
  }
  return true;
}

function switchMode(next){
  // V24 uses one unified editor. "Name" is now a way to populate the editable
  // custom grid rather than a separate editing mode.
  if(next==="name"){
    nameMatrix=makeNameMatrix();
    drawMatrix=clone(nameMatrix);
    customBorderApplied=Math.max(0,Math.min(3,Number($("nameBorder").value)||0));
    $("drawBorderThickness").value=customBorderApplied || 1;
    $("drawRows").value=drawMatrix.length;
    $("drawCols").value=drawMatrix[0]?.length || 1;
    $("drawLetterColor").value=$("nameLetterColor").value;
    $("drawBgColor").value=$("nameBgColor").value;
  }

  mode="draw";
  $("namePanel").classList.remove("hidden");
  $("drawPanel").classList.remove("hidden");
  $("modeBadge").textContent="Editable pattern";

  if(!drawMatrix.length){
    drawMatrix=blank(Number($("drawRows").value)||9,Number($("drawCols").value)||60);
  }

  if(next==="name"){
    $("patternTitle").textContent=($("name").value.toUpperCase()||"NAME")+" — EDITABLE";
  }else if(!$("patternTitle").textContent || $("patternTitle").textContent==="NAME"){
    $("patternTitle").textContent="MY PATTERN";
  }

  renderGrid();
}

function renderGrid(){
  const m=activeMatrix();
  if(!m.length||!m[0].length)return;

  const [letter,bg]=activeColors();
  document.documentElement.style.setProperty("--letter",letter);
  document.documentElement.style.setProperty("--bg",bg);

  const g=$("grid");
  const holder=$("gridScroll");
  g.innerHTML="";
  g.classList.toggle("draw",mode==="draw");

  const rows=m.length;
  const cols=m[0].length;
  if($("graphSizeReadout") && mode==="draw"){
    $("graphSizeReadout").textContent=`${rows} × ${cols}`;
  }
  if(typeof syncInlineGraphSizeControls==="function"){
    syncInlineGraphSizeControls();
  }

  // Name patterns always fit the screen.
  // Custom patterns can either fit the screen or use larger squares for easier editing.
  let cellSize=20;
  if(holder && (mode==="name" || customFitToScreen)){
    const numberGutter=showGridNumbers ? 34 : 0;
    const available=Math.max(240,holder.clientWidth-26-numberGutter);
    cellSize=Math.floor(available/cols);
    cellSize=Math.max(6,Math.min(20,cellSize));
  }

  g.style.setProperty("--cell-size",cellSize+"px");
  g.style.gridTemplateColumns=`repeat(${cols},${cellSize}px)`;

  // V53: let short/wide graphs shrink to their real content height instead of
  // reserving a tall empty editor area. Taller graphs still get a useful
  // scrollable editing viewport.
  const graphCenter=$("gridScroll")?.closest(".graphCenter");
  if(graphCenter){
    const graphPixelHeight=(rows*cellSize) + (showGridNumbers ? 28 : 0);
    const isWideGraph=cols>rows;
    graphCenter.classList.toggle("wideGraph",isWideGraph);
    graphCenter.style.setProperty("--graph-content-height",`${graphPixelHeight}px`);
  }

  const numberedWrap=$("gridNumberedWrap");
  const colNumbers=$("colNumbers");
  const rowNumbers=$("rowNumbers");
  const corner=numberedWrap ? numberedWrap.querySelector(".gridCorner") : null;

  if(numberedWrap && colNumbers && rowNumbers){
    const labelWidth=34;
    const labelHeight=28;

    // Apply the layout inline as well as through CSS. This prevents Safari or
    // an older cached stylesheet from turning the column labels into one long
    // vertical list.
    numberedWrap.style.display=showGridNumbers ? "grid" : "block";
    numberedWrap.style.gridTemplateColumns=`${labelWidth}px ${cols*cellSize}px`;
    numberedWrap.style.gridTemplateRows=`${labelHeight}px ${rows*cellSize}px`;
    numberedWrap.style.width=showGridNumbers ? `${labelWidth+(cols*cellSize)}px` : `${cols*cellSize}px`;
    numberedWrap.style.margin="0 auto";

    if(corner){
      corner.style.display=showGridNumbers ? "block" : "none";
      corner.style.gridColumn="1";
      corner.style.gridRow="1";
      corner.style.width=labelWidth+"px";
      corner.style.height=labelHeight+"px";
    }

    colNumbers.innerHTML="";
    rowNumbers.innerHTML="";

    colNumbers.style.display=showGridNumbers ? "grid" : "none";
    colNumbers.style.gridColumn="2";
    colNumbers.style.gridRow="1";
    colNumbers.style.gridTemplateColumns=`repeat(${cols},${cellSize}px)`;
    colNumbers.style.width=`${cols*cellSize}px`;
    colNumbers.style.height=labelHeight+"px";
    colNumbers.style.alignItems="end";

    rowNumbers.style.display=showGridNumbers ? "grid" : "none";
    rowNumbers.style.gridColumn="1";
    rowNumbers.style.gridRow="2";
    rowNumbers.style.gridTemplateRows=`repeat(${rows},${cellSize}px)`;
    rowNumbers.style.width=labelWidth+"px";
    rowNumbers.style.height=`${rows*cellSize}px`;

    g.style.gridColumn=showGridNumbers ? "2" : "auto";
    g.style.gridRow=showGridNumbers ? "2" : "auto";
    g.style.margin="0";

    for(let c=0;c<cols;c++){
      const n=document.createElement("div");
      n.className="colNumber";
      n.textContent=String(c+1);
      n.style.width=cellSize+"px";
      n.style.height=labelHeight+"px";
      n.style.display="flex";
      n.style.alignItems="flex-end";
      n.style.justifyContent="center";
      n.style.paddingBottom="5px";
      n.style.fontSize=cellSize<10 ? "7px" : "9px";
      n.style.lineHeight="1";
      n.style.color="#73788c";
      n.style.fontWeight="800";
      n.style.boxSizing="border-box";
      colNumbers.appendChild(n);
    }

    for(let r=0;r<rows;r++){
      const n=document.createElement("div");
      n.className="rowNumber";
      n.textContent=String(r+1);
      n.style.width=labelWidth+"px";
      n.style.height=cellSize+"px";
      n.style.display="flex";
      n.style.alignItems="center";
      n.style.justifyContent="flex-end";
      n.style.paddingRight="6px";
      n.style.fontSize=cellSize<10 ? "7px" : "9px";
      n.style.lineHeight="1";
      n.style.color="#73788c";
      n.style.fontWeight="800";
      n.style.boxSizing="border-box";
      rowNumbers.appendChild(n);
    }
  }

  m.forEach((row,r)=>row.forEach((v,c)=>{
    const cell=document.createElement("div");
    cell.className="cell"+(v?" on":"");
    if(mode==="draw"){
      cell.addEventListener("pointerdown",e=>{
        e.preventDefault();

        if(currentTool==="stamp"){
          if(!activeStamp){
            if($("fitNote")) $("fitNote").textContent="Choose a stamp first, then tap the grid where you want to place it.";
            return;
          }
          history.push(clone(drawMatrix));
          if(history.length>40)history.shift();
          placeStampAt(r,c,STAMPS[activeStamp]);
          renderGrid();
          if($("fitNote")){
            $("fitNote").textContent=mirrorStampEnabled
              ? `Added mirrored ${activeStamp} stamps on both sides.`
              : `Added a ${activeStamp}. Tap again to place more, or switch tools to keep editing.`;
          }
          return;
        }

        if(currentTool==="fill"){
          history.push(clone(drawMatrix));
          if(history.length>40)history.shift();
          if(floodFillAt(r,c)){
            renderGrid();
            if($("fitNote")) $("fitNote").textContent="Filled the connected area.";
          }
          return;
        }

        history.push(clone(drawMatrix));
        if(history.length>40)history.shift();
        dragging=true;
        drawValue=currentTool==="erase" ? 0 : 1;
        drawMatrix[r][c]=drawValue;
        cell.classList.toggle("on",!!drawValue);
      });
      cell.addEventListener("pointerenter",()=>{
        if(!dragging)return;
        if(currentTool==="draw" || currentTool==="erase"){
          drawMatrix[r][c]=drawValue;
          cell.classList.toggle("on",!!drawValue);
        }
      });
    }
    g.appendChild(cell);
  }));

  if($("fitNote")){
    if(mode==="name"){
      $("fitNote").textContent = cellSize<20
        ? `Graph automatically scaled to ${cellSize}px squares so all ${cols} columns fit on screen.`
        : `Graph fits at full-size squares.`;
    }else if(customFitToScreen){
      $("fitNote").textContent = cellSize<20
        ? `Custom graph scaled to ${cellSize}px squares so all ${cols} columns fit on screen. Tap Large Squares if you want easier editing.`
        : `Custom graph fits on screen at full-size squares.`;
    }else{
      $("fitNote").textContent = `Custom graph is using large squares for easier editing. Scroll sideways if needed, or tap Fit Graph to Screen.`;
    }
  }

  // Any graph/name/drawing change can affect the totals.
  // Mark the calculator as waiting so one button applies ALL current values together.
  markCalculatorDirty();
}
window.addEventListener("pointerup",()=>dragging=false);

function updateName(){
  // Keep the generator preview settings current without overwriting the editable pattern.
  // The user explicitly applies the name with "Generate Name in Editor".
  nameMatrix=makeNameMatrix();
  autosaveCurrentProject();
}


function stripCustomBorderRows(){
  if(!customBorderApplied || !drawMatrix.length) return;

  const trim=customBorderApplied+BORDER_GAP_ROWS;
  if(drawMatrix.length>(trim*2)){
    drawMatrix=drawMatrix.slice(trim,drawMatrix.length-trim).map(row=>row.slice());
  }
  customBorderApplied=0;
}

function addCustomBorder(){
  if(mode!=="draw" || !drawMatrix.length) return;

  history.push(clone(drawMatrix));
  if(history.length>40) history.shift();

  // Replace an existing V26 border instead of stacking another one.
  stripCustomBorderRows();

  const t=Math.max(1,Math.min(3,Math.floor(Number($("drawBorderThickness").value)||1)));
  const cols=drawMatrix[0].length;
  const borderRow=Array(cols).fill(1);
  const gapRow=Array(cols).fill(0);

  const topRows=[];
  const bottomRows=[];
  for(let i=0;i<t;i++){
    topRows.push(borderRow.slice());
    bottomRows.push(borderRow.slice());
  }
  topRows.push(gapRow.slice());
  bottomRows.unshift(gapRow.slice());

  drawMatrix=[...topRows,...drawMatrix.map(row=>row.slice()),...bottomRows];
  customBorderApplied=t;
  $("drawRows").value=drawMatrix.length;

  if($("fitNote")){
    $("fitNote").textContent=`Added a ${t}-row top and bottom border with 1 blank row between the border and the design.`;
  }
  renderGrid();
}

function removeCustomBorder(){
  if(mode!=="draw" || !drawMatrix.length) return;

  if(!customBorderApplied){
    if($("fitNote")){
      $("fitNote").textContent="There is no removable border on this pattern.";
    }
    return;
  }

  history.push(clone(drawMatrix));
  if(history.length>40) history.shift();

  stripCustomBorderRows();
  $("drawRows").value=drawMatrix.length;

  if($("fitNote")){
    $("fitNote").textContent="Border removed. Your original pattern was preserved.";
  }
  renderGrid();
}

function insertBlankRowAt(position){
  if(mode!=="draw" || !drawMatrix.length) return;
  const rows=drawMatrix.length, cols=drawMatrix[0].length;
  const pos=Math.max(1,Math.min(rows+1,Math.floor(Number(position)||1)));

  history.push(clone(drawMatrix));
  if(history.length>40) history.shift();

  drawMatrix.splice(pos-1,0,Array(cols).fill(0));
  $("drawRows").value=drawMatrix.length;
  customBorderApplied=0;

  if($("fitNote")) $("fitNote").textContent=`Inserted a blank row at position ${pos}.`;
  renderGrid();
}

function insertBlankColumnAt(position){
  if(mode!=="draw" || !drawMatrix.length) return;
  const cols=drawMatrix[0].length;
  const pos=Math.max(1,Math.min(cols+1,Math.floor(Number(position)||1)));

  history.push(clone(drawMatrix));
  if(history.length>40) history.shift();

  drawMatrix.forEach(row=>row.splice(pos-1,0,0));
  $("drawCols").value=drawMatrix[0].length;
  customBorderApplied=0;

  if($("fitNote")) $("fitNote").textContent=`Inserted a blank column at position ${pos}.`;
  renderGrid();
}


function deleteRowAt(position){
  if(mode!=="draw" || !drawMatrix.length || drawMatrix.length<=3) return;
  const rows=drawMatrix.length;
  const pos=Math.max(1,Math.min(rows,Math.floor(Number(position)||1)));
  history.push(clone(drawMatrix));
  if(history.length>40)history.shift();
  drawMatrix.splice(pos-1,1);
  $("drawRows").value=drawMatrix.length;
  customBorderApplied=0;
  if($("fitNote")) $("fitNote").textContent=`Deleted row ${pos}.`;
  renderGrid();
}
function deleteColumnAt(position){
  if(mode!=="draw" || !drawMatrix.length || drawMatrix[0].length<=5) return;
  const cols=drawMatrix[0].length;
  const pos=Math.max(1,Math.min(cols,Math.floor(Number(position)||1)));
  history.push(clone(drawMatrix));
  if(history.length>40)history.shift();
  drawMatrix.forEach(row=>row.splice(pos-1,1));
  $("drawCols").value=drawMatrix[0].length;
  customBorderApplied=0;
  if($("fitNote")) $("fitNote").textContent=`Deleted column ${pos}.`;
  renderGrid();
}

function generateRandomPattern(style="chevron"){
  if(mode!=="draw" || !drawMatrix.length) return;

  const rows=drawMatrix.length;
  const cols=drawMatrix[0].length;

  history.push(clone(drawMatrix));
  if(history.length>40) history.shift();

  const next=blank(rows,cols);
  const fill=(r,c)=>{ if(r>=0 && r<rows && c>=0 && c<cols) next[r][c]=1; };

  if(style==="chevron"){
    const repeat=Math.max(4,Math.floor(cols/4));
    for(let c=0;c<cols;c++){
      const x=((c%repeat)/(repeat-1))*2-1;
      const center=Math.round((rows-1)*(1-Math.abs(x))/2);
      const mirror=rows-1-center;
      fill(center,c); fill(mirror,c);
      if(center+1<rows) fill(center+1,c);
      if(mirror-1>=0) fill(mirror-1,c);
    }

  }else if(style==="diamonds"){
    const h=Math.max(3,Math.floor(rows/2));
    const w=Math.max(6,Math.floor(cols/4));
    for(let start=0;start<cols+w;start+=w){
      const cx=start+Math.floor(w/2), cy=Math.floor(rows/2);
      for(let d=0;d<=Math.min(h,Math.floor(w/2));d++){
        const xo=Math.floor(w/2)-d;
        fill(cy-d,cx-xo); fill(cy-d,cx+xo);
        fill(cy+d,cx-xo); fill(cy+d,cx+xo);
      }
    }

  }else if(style==="zigzag"){
    const amp=Math.max(2,Math.floor(rows/3));
    const period=Math.max(4,Math.floor(cols/5));
    for(let c=0;c<cols;c++){
      const phase=(c%period)/(period-1);
      const y=phase<0.5
        ? Math.round((rows-1)/2-amp+(phase*4*amp))
        : Math.round((rows-1)/2+amp-((phase-.5)*4*amp));
      fill(y,c); fill(Math.min(rows-1,y+1),c);
    }

  }else if(style==="waves"){
    const mid=(rows-1)/2;
    const amp=Math.max(2,Math.floor(rows/3));
    const freq=(Math.PI*2)/Math.max(8,Math.floor(cols/2));
    for(let c=0;c<cols;c++){
      const y=Math.round(mid+Math.sin(c*freq)*amp);
      fill(y,c); if(y+1<rows) fill(y+1,c);
    }

  }else if(style==="argyle"){
    const h=Math.max(3,Math.floor(rows/2));
    const w=Math.max(6,Math.floor(cols/4));
    for(let start=-w;start<cols+w;start+=w){
      const cx=start+Math.floor(w/2), cy=Math.floor(rows/2);
      for(let d=0;d<=Math.min(h,Math.floor(w/2));d++){
        const xo=Math.floor(w/2)-d;
        fill(cy-d,cx-xo); fill(cy-d,cx+xo);
        fill(cy+d,cx-xo); fill(cy+d,cx+xo);
      }
      for(let r=0;r<rows;r++){
        fill(r,Math.round(cx+(r-cy)*(w/(2*Math.max(1,h)))));
        fill(r,Math.round(cx-(r-cy)*(w/(2*Math.max(1,h)))));
      }
    }

  }else if(style==="hearts" || style==="heartBorder"){
    const heart=[[0,1,1,0,1,1,0],
                 [1,0,0,1,0,0,1],
                 [1,0,0,0,0,0,1],
                 [0,1,0,0,0,1,0],
                 [0,0,1,0,1,0,0],
                 [0,0,0,1,0,0,0]];
    const mh=heart.length,mw=heart[0].length,gap=2;
    const startRow=Math.max(style==="heartBorder"?1:0,Math.floor((rows-mh)/2));
    if(style==="heartBorder"){
      for(let c=0;c<cols;c++){ fill(0,c); fill(rows-1,c); }
    }
    for(let start=0;start<cols;start+=mw+gap){
      for(let r=0;r<mh;r++){
        for(let c=0;c<mw;c++){
          if(heart[r][c]) fill(startRow+r,start+c);
        }
      }
    }

  }else if(style==="greekKey"){
    const top=Math.max(0,Math.floor(rows/2)-2);
    for(let c=0;c<cols;c++){
      const phase=c%8;
      if(phase<=1){
        for(let r=0;r<5;r++) fill(top+r,c);
      }else if(phase<=4){
        fill(top,c);
      }else if(phase===5){
        fill(top,c); fill(top+1,c); fill(top+2,c);
      }else if(phase===6){
        fill(top+2,c);
      }else{
        fill(top+2,c); fill(top+3,c); fill(top+4,c);
      }
    }

  }else if(style==="flowers"){
    const flower=[[0,1,0,1,0],
                  [1,1,1,1,1],
                  [0,1,1,1,0],
                  [1,1,1,1,1],
                  [0,1,0,1,0]];
    const mh=5,mw=5,gap=2,startRow=Math.max(0,Math.floor((rows-mh)/2));
    for(let start=0;start<cols;start+=mw+gap){
      for(let r=0;r<mh;r++) for(let c=0;c<mw;c++) if(flower[r][c]) fill(startRow+r,start+c);
    }

  }else if(style==="rainbowStripes"){
    const band=Math.max(1,Math.floor(cols/12));
    for(let c=0;c<cols;c++){
      const stripe=Math.floor(c/band)%6;
      if(stripe===0 || stripe===2 || stripe===4){
        for(let r=0;r<rows;r++) fill(r,c);
      }
    }

  }else if(style==="aztec"){
    const step=8, mid=Math.floor(rows/2);
    for(let start=-step;start<cols+step;start+=step){
      const center=start+Math.floor(step/2);
      for(let d=0;d<=Math.min(mid,4);d++){
        fill(mid-d,center-d); fill(mid-d,center+d);
        fill(mid+d,center-d); fill(mid+d,center+d);
      }
      for(let r=0;r<rows;r++){
        if(r%2===0){ fill(r,center-3); fill(r,center+3); }
      }
    }

  }else if(style==="hourglass"){
    const period=8,mid=(rows-1)/2,amp=Math.max(2,Math.floor(rows/2));
    for(let c=0;c<cols;c++){
      const t=(c%period)/(period-1);
      const off=Math.round(Math.abs(.5-t)*2*amp);
      fill(Math.round(mid-off),c); fill(Math.round(mid+off),c);
    }

  }else if(style==="steps"){
    const period=10,mid=Math.floor(rows/2);
    for(let c=0;c<cols;c++){
      const t=c%period,d=t<=5?t:10-t,off=Math.min(mid,d);
      fill(mid-off,c); fill(mid+off,c);
      if(t===0) for(let r=0;r<rows;r++) fill(r,c);
    }

  }else if(style==="crosses"){
    const motifW=7,motifH=5,gap=2,top=Math.max(0,Math.floor((rows-motifH)/2));
    for(let start=0;start<cols;start+=motifW+gap){
      const cx=start+3;
      for(let r=0;r<motifH;r++) fill(top+r,cx);
      for(let c=0;c<motifW;c++) fill(top+2,start+c);
    }
  }

  drawMatrix=next;
  customBorderApplied=0;
  $("drawRows").value=rows;
  $("drawCols").value=cols;

  if($("fitNote")){
    const labels={
      chevron:"chevron", diamonds:"diamond", zigzag:"zigzag", waves:"wave",
      argyle:"argyle", hearts:"heart", greekKey:"Greek key", flowers:"flower",
      heartBorder:"heart-with-border", rainbowStripes:"striped",
      aztec:"Aztec geometric", hourglass:"hourglass",
      steps:"stepped diamond", crosses:"cross motif"
    };
    $("fitNote").textContent=`Generated a ${labels[style]||"bracelet"} pattern. Tap Undo to go back.`;
  }

  renderGrid();
}



function rotateMatrixClockwise(matrix){
  const rows=matrix.length;
  const cols=matrix[0]?.length || 0;
  const out=Array.from({length:cols},()=>Array(rows).fill(0));
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      out[c][rows-1-r]=matrix[r][c];
    }
  }
  return out;
}

function rotateMatrixCounterClockwise(matrix){
  const rows=matrix.length;
  const cols=matrix[0]?.length || 0;
  const out=Array.from({length:cols},()=>Array(rows).fill(0));
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      out[cols-1-c][r]=matrix[r][c];
    }
  }
  return out;
}

function autoAdjustGraphForOrientation(view){
  if(mode!=="draw" || !drawMatrix.length || !drawMatrix[0]?.length) return false;

  const rows=drawMatrix.length;
  const cols=drawMatrix[0].length;

  // Only auto-rotate when the graph shape clearly opposes the chosen view.
  const shouldRotateToPortrait=view==="portrait" && cols>rows;
  const shouldRotateToLandscape=view==="landscape" && rows>cols;
  if(!shouldRotateToPortrait && !shouldRotateToLandscape) return false;

  history.push(clone(drawMatrix));
  if(history.length>40) history.shift();

  drawMatrix=shouldRotateToPortrait
    ? rotateMatrixClockwise(drawMatrix)
    : rotateMatrixCounterClockwise(drawMatrix);

  const newRows=drawMatrix.length;
  const newCols=drawMatrix[0]?.length || 0;
  if($("drawRows")) $("drawRows").value=newRows;
  if($("drawCols")) $("drawCols").value=newCols;
  updateGraphSizeReadout();
  if(typeof syncInlineGraphSizeControls==="function"){
    syncInlineGraphSizeControls();
  }
  if($("fitNote")){
    $("fitNote").textContent=`Graph auto-adjusted for ${view} view: ${newRows} rows × ${newCols} columns.`;
  }
  renderGrid();
  return true;
}
window.autoAdjustGraphForOrientation=autoAdjustGraphForOrientation;


function applyGraphSize(rows,cols){
  rows=Math.max(3,Math.min(60,Math.round(Number(rows)||9)));
  cols=Math.max(5,Math.min(200,Math.round(Number(cols)||60)));

  const oldRows=drawMatrix.length;
  const oldCols=drawMatrix[0]?.length || 0;

  if(rows===oldRows && cols===oldCols){
    $("drawRows").value=rows;
    $("drawCols").value=cols;
    updateGraphSizeReadout();
    return;
  }

  customBorderApplied=0;
  history.push(clone(drawMatrix));
  if(history.length>40) history.shift();

  const old=drawMatrix;
  const next=blank(rows,cols);
  const copyRows=Math.min(rows,old.length);
  const copyCols=old.length ? Math.min(cols,old[0].length) : 0;

  for(let r=0;r<copyRows;r++){
    for(let c=0;c<copyCols;c++) next[r][c]=old[r][c];
  }

  drawMatrix=next;
  $("drawRows").value=rows;
  $("drawCols").value=cols;
  updateGraphSizeReadout();

  if($("fitNote")){
    $("fitNote").textContent=`Graph resized to ${rows} rows × ${cols} columns. Existing pattern was preserved where it fits.`;
  }
  renderGrid();
}

function updateGraphSizeReadout(){
  const rows=Math.max(3,Math.min(60,Number($("drawRows")?.value)||9));
  const cols=Math.max(5,Math.min(200,Number($("drawCols")?.value)||60));
  if($("graphSizeReadout")) $("graphSizeReadout").textContent=`${rows} × ${cols}`;
}

function stepGraphSize(axis,amount){
  const id=axis==="rows" ? "drawRows" : "drawCols";
  const el=$(id);
  const min=Number(el.min)||1;
  const max=Number(el.max)||999;
  const value=Math.max(min,Math.min(max,Math.round(Number(el.value)||min)+amount));
  el.value=value;

  const rows=Number($("drawRows").value)||9;
  const cols=Number($("drawCols").value)||60;
  applyGraphSize(rows,cols);
}

function resizeCustomGraph(){
  applyGraphSize($("drawRows").value,$("drawCols").value);
}
function mutate(kind){
  if(mode!=="draw")return;
  history.push(clone(drawMatrix));
  if(kind==="clear")drawMatrix=drawMatrix.map(r=>r.map(()=>0));
  if(kind==="fill")drawMatrix=drawMatrix.map(r=>r.map(()=>1));
  if(kind==="invert")drawMatrix=drawMatrix.map(r=>r.map(v=>v?0:1));
  renderGrid();
}
function undo(){
  if(mode!=="draw"||!history.length)return;
  drawMatrix=history.pop();
  renderGrid();
}
