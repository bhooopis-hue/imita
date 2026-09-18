import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const scripts=['local-pricing.js','app.js'].map(p=>readFileSync(new URL('../dist/'+p,import.meta.url),'utf8'));
test('all sales routes render converted prices and retain currency across language, period and plan links',async()=>{
 for(const route of ['/','/checkout','/upgrade','/confirmation'])for(const lang of ['es','en','pt']){
  const nodes=new Map(),listeners=new Map();const document={getElementById(id){if(!nodes.has(id))nodes.set(id,{innerHTML:'',addEventListener(){}});return nodes.get(id)},documentElement:{},querySelector(){return {content:'',disabled:false}},querySelectorAll(){return []},addEventListener(name,fn){listeners.set(name,fn)},dispatchEvent(ev){listeners.get(ev.type)?.()}};
  const ctx=vm.createContext({document,location:new URL('https://entrega.test'+route+'?lang='+lang+'&cycle=annual&plan=pro'),history:{replaceState(){},pushState(){}},window:{scrollTo(){}},URL,URLSearchParams,Intl,Event,AbortSignal,localStorage:{getItem(){return null},setItem(){},removeItem(){}},fetch:async()=>({ok:true,json:async()=>({currency:'EUR',country:'ES',source:'ip',reason:null,available:['BRL','EUR'],amounts:{0:0,29:4.93,79:13.43,290:49.3,790:134.3,50:8.5,500:85},estimated:true,updatedAt:new Date().toISOString()})})});
  // Browser global properties are visible as global lexical references.
  ctx.window=ctx;ctx.scrollTo=()=>{};
  vm.runInContext(scripts[0],ctx);vm.runInContext(scripts[1],ctx);await new Promise(resolve=>setImmediate(resolve));
  const html=nodes.get('app').innerHTML;
  assert.match(html,/EUR/);assert.doesNotMatch(html,/R\$|preços estão em reais|All prices are in Brazilian/);
  assert.match(html,/currency=auto/);assert.match(html,/exchangerate-api\.com/);
  assert.equal(vm.runInContext("money(amount('pro'))",ctx),new Intl.NumberFormat({es:'es-ES',en:'en-US',pt:'pt-BR'}[lang],{style:'currency',currency:'EUR',currencyDisplay:'code'}).format(49.3));
  assert.match(vm.runInContext("url('/checkout','team')",ctx),/cycle=annual&plan=team&currency=auto/);
 }
});
