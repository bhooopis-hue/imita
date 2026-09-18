export class HttpError extends Error { constructor(status, code) { super(code); this.status=status; } }
const fail=(status,code)=>{throw new HttpError(status,code)};
const uid=()=>crypto.randomUUID();
const now=()=>new Date().toISOString();
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export function string(value,max=200,required=true){if(typeof value!=='string'||value.trim().length>max||(required&&!value.trim()))fail(400,'invalid');return value.trim();}
export function email(value){const s=string(value,254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))fail(400,'invalid');return s;}
export function date(value){const s=string(value,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s)fail(400,'invalid');return s;}
export function link(value){const s=string(value,2048);let u;try{u=new URL(s)}catch{fail(400,'invalid')}if(u.protocol!=='https:'||u.username||u.password)fail(400,'invalid');return u.href;}
export function database(env){if(!env.DB)fail(503,'unavailable');return {stmt:(sql,...args)=>env.DB.prepare(sql).bind(...args),first:(sql,...args)=>env.DB.prepare(sql).bind(...args).first(),all:async(sql,...args)=>(await env.DB.prepare(sql).bind(...args).all()).results,batch:items=>env.DB.batch(items)};}
async function body(req){if(!req.headers.get('content-type')?.startsWith('application/json'))fail(415,'invalid');const reader=req.body?.getReader();if(!reader)fail(400,'invalid');let chunks=[],size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>16384){await reader.cancel();fail(413,'invalid')}chunks.push(value)}let bytes=new Uint8Array(size),offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length}try{const v=JSON.parse(new TextDecoder().decode(bytes));if(!v||Array.isArray(v)||typeof v!=='object')fail(400,'invalid');return v}catch{fail(400,'invalid')}}
export async function api(req,env){try{
 const url=new URL(req.url),path=url.pathname,method=req.method;
 const owner=req.headers.get('oai-authenticated-user-id');if(!owner)fail(401,'signin');
 const userEmail=(req.headers.get('oai-authenticated-user-email')||'').toLowerCase();
 if(!['GET','POST','PATCH','DELETE'].includes(method))fail(405,'invalid');
 if(method!=='GET'&&(req.headers.get('origin')!==url.origin||req.headers.get('sec-fetch-site')==='cross-site'))fail(403,'forbidden');
 const db=database(env),data=method==='GET'?{}:await body(req);
 const project=async id=>{const p=await db.first('SELECT * FROM projects WHERE id=? AND owner=?',id,owner);if(!p)fail(404,'missing');return p};
 if(path==='/api/workspace'&&method==='GET')return json({user:{email:userEmail},clients:await db.all('SELECT * FROM clients WHERE owner=? ORDER BY created DESC',owner),projects:await db.all('SELECT p.*,c.name AS client_name FROM projects p JOIN clients c ON c.id=p.client_id WHERE p.owner=? ORDER BY p.created DESC',owner)});
 if(path==='/api/clients'&&method==='POST'){
  const id=uid();await db.stmt('INSERT INTO clients (id,owner,name,email,company,created) VALUES (?,?,?,?,?,?)',id,owner,string(data.name,100),email(data.email),string(data.company||'',100,false),now()).run();return json({id},201);
 }
 if(path==='/api/projects'&&method==='POST'){
  const client=await db.first('SELECT id FROM clients WHERE id=? AND owner=?',string(data.client_id),owner);if(!client)fail(400,'client');
  const id=uid();await db.stmt('INSERT INTO projects (id,owner,client_id,title,description,due,status,created) VALUES (?,?,?,?,?,?,?,?)',id,owner,client.id,string(data.title,120),string(data.description||'',2000,false),date(data.due),'production',now()).run();return json({id},201);
 }
 let m=path.match(/^\/api\/projects\/([\w-]+)$/);
 if(m){const p=await project(m[1]);
  if(method==='GET')return json({project:p,tasks:await db.all('SELECT * FROM tasks WHERE project_id=? ORDER BY created',p.id),deliveries:await db.all('SELECT * FROM deliveries WHERE project_id=? ORDER BY created DESC',p.id),comments:await db.all('SELECT c.* FROM comments c JOIN deliveries d ON d.id=c.delivery_id WHERE d.project_id=? ORDER BY c.created',p.id)});
  if(method==='PATCH'){const allowed=['production','review','complete','archived'];if(!allowed.includes(data.status))fail(400,'invalid');await db.stmt('UPDATE projects SET title=?,description=?,due=?,status=? WHERE id=? AND owner=?',string(data.title,120),string(data.description||'',2000,false),date(data.due),data.status,p.id,owner).run();return json({ok:true})}
 }
 m=path.match(/^\/api\/projects\/([\w-]+)\/(tasks|deliveries)$/);
 if(m&&method==='POST'){const p=await project(m[1]),id=uid();
  if(m[2]==='tasks'){await db.stmt('INSERT INTO tasks (id,project_id,title,done,created) VALUES (?,?,?,?,?)',id,p.id,string(data.title,200),0,now()).run();return json({id},201)}
  const client=await db.first('SELECT email FROM clients WHERE id=? AND owner=?',p.client_id,owner);
  await db.batch([db.stmt('INSERT INTO deliveries (id,project_id,title,url,note,reviewer,status,token,created) VALUES (?,?,?,?,?,?,?,?,?)',id,p.id,string(data.title,120),link(data.url),string(data.note||'',2000,false),client.email,'review',uid()+uid(),now()),db.stmt('UPDATE projects SET status=? WHERE id=? AND owner=?','review',p.id,owner)]);return json({id},201);
 }
 m=path.match(/^\/api\/tasks\/([\w-]+)$/);
 if(m&&['PATCH','DELETE'].includes(method)){const t=await db.first('SELECT t.* FROM tasks t JOIN projects p ON p.id=t.project_id WHERE t.id=? AND p.owner=?',m[1],owner);if(!t)fail(404,'missing');if(method==='DELETE')await db.stmt('DELETE FROM tasks WHERE id=?',t.id).run();else{if(typeof data.done!=='boolean')fail(400,'invalid');await db.stmt('UPDATE tasks SET done=? WHERE id=?',Number(data.done),t.id).run()}return json({ok:true})}
 m=path.match(/^\/api\/review\/([\w-]+)$/);
 if(m){const d=await db.first('SELECT d.*,p.title AS project_title,p.owner FROM deliveries d JOIN projects p ON p.id=d.project_id WHERE d.token=?',m[1]);if(!d||(d.owner!==owner&&(!userEmail||userEmail!==d.reviewer)))fail(404,'missing');
  if(method==='GET')return json({delivery:{id:d.id,title:d.title,url:d.url,note:d.note,status:d.status,created:d.created,project_title:d.project_title},canReview:userEmail===d.reviewer,comments:await db.all('SELECT * FROM comments WHERE delivery_id=? ORDER BY created',d.id)});
  if(method==='POST'){
   if(!['comment','approved','changes'].includes(data.decision))fail(400,'invalid');
   if(data.decision!=='comment'&&userEmail!==d.reviewer)fail(403,'forbidden');
   const message=string(data.body||'',2000,data.decision!=='approved');
   const queries=[db.stmt('INSERT INTO comments (id,delivery_id,author,body,decision,created) VALUES (?,?,?,?,?,?)',uid(),d.id,userEmail||owner,message,data.decision,now())];
   if(data.decision!=='comment')queries.push(db.stmt('UPDATE deliveries SET status=? WHERE id=?',data.decision,d.id));
   await db.batch(queries);return json({ok:true},201);
  }
 }
 return json({error:'missing'},404);
 }catch(e){if(e instanceof HttpError)return json({error:e.message},e.status);console.error('Entrega storage operation failed',e?.name);return json({error:'unavailable'},503)}}
