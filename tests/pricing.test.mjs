import test from 'node:test';
import assert from 'node:assert/strict';
import {visitorCountry,priceQuote,pricing} from '../worker/pricing.mjs';
const dataset=()=>({result:'success',base_code:'BRL',time_last_update_unix:Math.floor(Date.now()/1000)-10,time_next_update_unix:Math.floor(Date.now()/1000)+86400,rates:{BRL:1,USD:.19,EUR:.17,MXN:3.61,JPY:28.1234,CAD:.26,BHD:.071}});
const request=(country,query='')=>{const r=new Request('https://entrega.test/api/pricing'+query);if(country)Object.defineProperty(r,'cf',{value:{country}});return r};
test('IP country selects the currency independently of language; explicit selection wins',()=>{
 for(const [country,currency] of [['BR','BRL'],['US','USD'],['ES','EUR'],['PT','EUR'],['MX','MXN'],['CA','CAD'],['JP','JPY'],['BG','EUR']])assert.equal(priceQuote(visitorCountry(request(country)),null,dataset()).currency,currency);
 assert.equal(priceQuote('BR','USD',dataset()).source,'manual');
 assert.equal(priceQuote('BR','USD',dataset()).currency,'USD');
 assert.equal(visitorCountry(new Request('https://entrega.test/api/pricing?country=US',{headers:{'CF-IPCountry':'US','X-Forwarded-For':'8.8.8.8'}})),null);
 assert.equal(priceQuote(null,'auto',dataset()).reason,'country-unavailable');
});
test('monthly/annual prices and upgrades use consistent rounding for 0/2/3-decimal currencies',()=>{
 for(const currency of ['USD','JPY','BHD']){const q=priceQuote(null,currency,dataset());const precision=new Intl.NumberFormat('en',{style:'currency',currency}).resolvedOptions().maximumFractionDigits;const f=10**precision;assert.equal(Math.round(q.amounts[79]*f)-Math.round(q.amounts[29]*f),Math.round(q.amounts[50]*f));assert.equal(Math.round(q.amounts[790]*f)-Math.round(q.amounts[290]*f),Math.round(q.amounts[500]*f));assert.equal(q.amounts[0],0)}
 assert.equal(priceQuote('US',null,dataset()).amounts[29],5.51);
});
test('stale, missing or unsupported rates fall back honestly to BRL',()=>{
 const old={...dataset(),time_last_update_unix:1};
 for(const d of [null,old,{...dataset(),base_code:'USD'}]){const q=priceQuote('US',null,d);assert.equal(q.currency,'BRL');assert.equal(q.amounts[29],29);assert.equal(q.reason,'rates-unavailable')}
 assert.equal(priceQuote('US','ZZZ',dataset()).currency,'BRL');
});
test('shared rate cache never caches location; API exposes only product prices and never sends IP upstream',async()=>{
 let calls=0,saved;const cache={async match(){return saved?.clone()},async put(key,r){saved=r}};
 const fetcher=async(url,options)=>{calls++;assert.equal(url,'https://open.er-api.com/v6/latest/BRL');assert.equal(options.headers,undefined);return Response.json(dataset())};
 const us=await pricing(request('US'),{fetcher,cache});const br=await pricing(request('BR'),{fetcher,cache});
 assert.equal((await us.json()).currency,'USD');const q=await br.json();assert.equal(q.currency,'BRL');assert.equal(q.rates,undefined);assert.equal(calls,1);assert.match(br.headers.get('cache-control'),/no-store/);
 const bad=await pricing(request('US','?currency=%3Cscript%3E'),{fetcher,cache});assert.equal(bad.status,400);
 const fail=await pricing(request('US'),{fetcher:async()=>{throw Error('offline')},cache:null});assert.equal((await fail.json()).reason,'rates-unavailable');
});
