function todayStr(){ return new Date().toISOString().split('T')[0]; }
function cap(s){ return s ? s.charAt(0).toUpperCase()+s.slice(1) : ''; }
function numFmt(v){ return Number(v).toLocaleString('en-IN'); }
function nights(a,b){ return Math.max(1, Math.round((new Date(b)-new Date(a))/(1000*60*60*24))); }
function fmtDate(d){ if(!d) return ''; var parts=d.split('-'); var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; return parts[2]+' '+months[+parts[1]-1]; }
function fmtDateFull(d){ if(!d) return ''; var parts=d.split('-'); var months=['January','February','March','April','May','June','July','August','September','October','November','December']; return parts[2]+' '+months[+parts[1]-1]+' '+parts[0]; }
function toast(msg){ var t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); }, 2500); }
