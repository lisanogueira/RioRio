import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join, normalize } from 'path';
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const root=process.cwd();
createServer(async (req,res)=>{
  try{
    let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/')p='/index.html';
    const fp=normalize(join(root,p)); if(!fp.startsWith(root)){res.writeHead(403);return res.end();}
    const data=await readFile(fp);
    res.writeHead(200,{'Content-Type':types[extname(fp)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(data);
  }catch(e){res.writeHead(404);res.end('404');}
}).listen(4599,()=>console.log('http://localhost:4599'));
