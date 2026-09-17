import { api } from './api.mjs';
import { assets } from './assets.mjs';
export default {async fetch(request,env){
 const url=new URL(request.url),path=url.pathname.replace(/\/$/,'')||'/';
 if(path.startsWith('/api/'))return api(request,env);
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
 const app=path==='/app'||path==='/review';
 if(app&&!request.headers.get('oai-authenticated-user-id'))return Response.redirect(url.origin+'/signin-with-chatgpt?return_to='+encodeURIComponent(url.pathname+url.search),302);
 const key=app?'/workspace.html':(path==='/'?'/index.html':path.includes('.')?path:path+'/index.html');
 const asset=assets[key];if(!asset)return new Response('Not found',{status:404});
 return new Response(request.method==='HEAD'?null:asset.body,{headers:{'Content-Type':asset.type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin',...(app?{'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; object-src 'none'"}:{})}});
}};
