// 💚 רשת הקבוצות שלנו — לוגיקה + חיבור לגוגל שיטס
const $ = (s) => document.querySelector(s);
const grid = $('#groupsGrid');

let ALL = [];

// ---------- קבוצות לדוגמה (מוצגות עד שמחברים שיטס) ----------
const DEMO = [
  {name:'שכונה מדברים הכל', desc:'כל העדכונים, שאלות ועזרה הדדית של השכונה שלנו.', link:'https://chat.whatsapp.com/example1', category:'שכונה', image:'https://picsum.photos/seed/shchuna/300/300'},
  {name:'אמהות משתפות', desc:'טיפים, חוגים, בייביסיטר וקפה של בוקר ☕', link:'https://chat.whatsapp.com/example2', category:'קהילה', image:'https://picsum.photos/seed/imahot/300/300'},
  {name:'כדורגל חמישי', desc:'מי בא למשחק חמישי? מביאים חברים, אווירה אש!', link:'https://chat.whatsapp.com/example3', category:'ספורט', image:'https://picsum.photos/seed/kaduregel/300/300'},
];

const isImg = (s) => /^(https?:\/\/|data:image\/)/i.test(String(s||'').trim());

// תמונה שבורה → ריבוע עם אות ראשונה
window.imgFallback = function(el){
  const d = document.createElement('div');
  d.className = 'row-img fallback';
  d.innerHTML = '<span>' + escapeHtml(el.dataset.letter || '?') + '</span>';
  el.replaceWith(d);
};

// ---------- שליפת נתונים מגוגל שיטס ----------
async function loadFromSheets(){
  const id = (CONFIG.SHEET_ID||'').trim();
  if(!id) return CONFIG.SHOW_DEMO_IF_EMPTY ? DEMO : [];
  // ניסיון 1: gviz JSON (עובד עם "כל מי שיש לו קישור יכול לצפות")
  try{
    const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(CONFIG.SHEET_NAME)}`;
    const res = await fetch(url);
    const txt = await res.text();
    const json = JSON.parse(txt.substring(txt.indexOf('{'), txt.lastIndexOf('}')+1));
    const rows = json.table.rows || [];
    const groups = rows.map(r=>{
      const c = r.c || [];
      const v = i => (c[i] && c[i].v != null ? String(c[i].v).trim() : '');
      return { name:v(0), desc:v(1), link:v(2), category:v(3)||'כללי', image:v(4)||'', active:v(5) };
    }).filter(valid);
    if(groups.length) return groups;
  }catch(e){ console.warn('gviz נכשל, מנסה CSV', e); }

  // ניסיון 2: CSV publish
  try{
    const url = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
    const res = await fetch(url);
    const csv = await res.text();
    const lines = csv.split(/\r?\n/).slice(1); // דלג כותרת
    const groups = lines.map(parseCSVLine)
      .filter(a=>a.length>=3)
      .map(a=>({name:a[0]?.trim(), desc:a[1]?.trim(), link:a[2]?.trim(), category:a[3]?.trim()||'כללי', image:a[4]?.trim()||'', active:a[5]?.trim()}))
      .filter(valid);
    if(groups.length) return groups;
  }catch(e){ console.warn('CSV נכשל', e); }

  return CONFIG.SHOW_DEMO_IF_EMPTY ? DEMO : [];
}

function valid(g){
  return g.name && g.link
    && !/^לא|לא פעיל|0|no|false/i.test(g.active||'כן')
    && !/^(name|שם|link|קישור)$/i.test(g.name);
}

function parseCSVLine(line){
  const out=[]; let cur='', q=false;
  for(let i=0;i<line.length;i++){ const ch=line[i];
    if(ch==='"'){ if(q && line[i+1]==='"'){cur+='"';i++;} else q=!q; }
    else if(ch===',' && !q){ out.push(cur); cur=''; }
    else cur+=ch;
  } out.push(cur); return out;
}

function showSkeleton(n=5){ grid.innerHTML = Array(n).fill('<div class="skel-row"></div>').join(''); }

// ---------- רינדור: כל קבוצה = שורה (תמונה מימין, טקסט משמאל) ----------
function render(){
  const list = ALL;
  $('#emptyState').classList.toggle('hidden', list.length>0);

  grid.innerHTML = list.map((g,i)=>{
    const img = (g.image||'').trim();
    const letter = escapeHtml((g.name||'?').trim().charAt(0));
    const pic = isImg(img)
      ? `<img src="${escapeAttr(img)}" alt="${escapeAttr(g.name)}" loading="lazy" data-letter="${letter}" onerror="imgFallback(this)">`
      : `<div class="row-img fallback"><span>${letter}</span></div>`;
    return `
    <article class="row" style="animation-delay:${Math.min(i*60,600)}ms">
      <div class="row-media">
        ${pic}
      </div>
      <div class="row-body">
        <div class="row-title">
          <h3>${escapeHtml(g.name)}</h3>
          <span class="badge">${escapeHtml(g.category||'כללי')}</span>
        </div>
        <p class="desc">${escapeHtml(g.desc||'')}</p>
      </div>
      <a class="wa-btn" href="${escapeAttr(g.link)}" target="_blank" rel="noopener" title="הצטרף בוואטסאפ">
        <svg viewBox="0 0 448 512" width="26" height="26" fill="#07332d"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
      </a>
    </article>`}).join('');
}

function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function escapeAttr(s){return String(s??'').replace(/"/g,'&quot;')}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._x);t._x=setTimeout(()=>t.classList.remove('show'),2200)}

// ---------- אתחול ----------
async function boot(){
  showSkeleton();
  ALL = await loadFromSheets();
  render();
}
boot();
setInterval(boot, (CONFIG.REFRESH_MINUTES||1)*60*1000);
