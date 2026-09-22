// 💚 שרת קל ללא תלויות — מגיש את האתר + API לשיטס
// הרצה:  node server.js
// האתר:  http://localhost:3000
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DIR = __dirname;
let CONFIG = { SHEET_ID:'', SHEET_NAME:'Sheet1' };
try{
  const cfg = fs.readFileSync(path.join(DIR,'config.js'),'utf8');
  const mId = cfg.match(/SHEET_ID:\s*"([^"]*)"/); if(mId) CONFIG.SHEET_ID = mId[1];
  const mN = cfg.match(/SHEET_NAME:\s*"([^"]*)"/); if(mN) CONFIG.SHEET_NAME = mN[1];
}catch{}

const MIME = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.md':'text/markdown; charset=utf-8','.svg':'image/svg+xml'};

let cache = { data:[], at:0 };
async function getGroups(){
  if(Date.now()-cache.at < 60*1000 && cache.data.length) return cache.data;
  if(!CONFIG.SHEET_ID) return [];
  try{
    const url = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(CONFIG.SHEET_NAME)}`;
    const res = await fetch(url);
    const txt = await res.text();
    const json = JSON.parse(txt.substring(txt.indexOf('{'), txt.lastIndexOf('}')+1));
    const groups = (json.table.rows||[]).map(r=>{
      const c=r.c||[]; const v=i=>(c[i]&&c[i].v!=null?String(c[i].v).trim():'');
      return {name:v(0),desc:v(1),link:v(2),category:v(3)||'כללי',image:v(4)||'',active:v(5)};
    }).filter(g=>g.name&&g.link&&!/^לא|לא פעיל|0|no|false/i.test(g.active||'כן')&&!/^(name|שם|link|קישור)$/i.test(g.name));
    cache = {data:groups, at:Date.now()};
    return groups;
  }catch(e){ console.error('שגיאת שיטס:', e.message); return cache.data; }
}

const server = http.createServer(async (req,res)=>{
  const url = new URL(req.url, `http://localhost:${PORT}`);
  res.setHeader('Access-Control-Allow-Origin','*');

  if(url.pathname==='/api/groups'){
    const groups = await getGroups();
    res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'});
    return res.end(JSON.stringify({ok:true, count:groups.length, groups}));
  }
  if(url.pathname==='/api/health'){
    res.writeHead(200,{'Content-Type':'application/json'});
    return res.end(JSON.stringify({ok:true, sheet:!!CONFIG.SHEET_ID}));
  }

  let file = url.pathname==='/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
  file = path.join(DIR, path.normalize(file).replace(/^(\.\.[\/\\])+/, ''));
  if(!file.startsWith(DIR)) { res.writeHead(403); return res.end('Forbidden'); }
  if(!fs.existsSync(file) || fs.statSync(file).isDirectory()){ res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200,{'Content-Type': MIME[path.extname(file)]||'text/plain; charset=utf-8'});
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, ()=>console.log(`💚 הקבוצות שלנו רץ על http://localhost:${PORT}`));
