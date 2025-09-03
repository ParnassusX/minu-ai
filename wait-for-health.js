const http = require('http');

function httpGet(url){
  return new Promise((resolve)=>{
    try{
      const req = http.get(url, (res)=>{
        const chunks = [];
        res.on('data', (c)=>chunks.push(c));
        res.on('end', ()=>{
          resolve({ ok: true, status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') });
        });
      });
      req.on('error', (e)=> resolve({ ok: false, error: e.message }));
      req.setTimeout(5000, ()=>{ try{ req.destroy(); }catch{}; resolve({ ok:false, error:'timeout' });});
    }catch(e){ resolve({ ok:false, error: e.message }); }
  });
}

(async()=>{
  const url = process.argv[2] || 'http://localhost:4000/api/health';
  const deadline = Date.now() + 120000; // 2 minutes
  while(Date.now() < deadline){
    const r = await httpGet(url);
    if(r.ok && r.status>=200 && r.status<500){
      console.log('HEALTH_OK', r.status);
      console.log(r.body.slice(0, 200));
      process.exit(0);
    } else {
      console.log('HEALTH_WAIT', r.ok ? r.status : r.error);
    }
    await new Promise(r=>setTimeout(r, 3000));
  }
  console.log('HEALTH_TIMEOUT');
  process.exit(1);
})();
