import { countryCurrencies } from './country-currencies.mjs';

const BASE = { 0: 0, 29: 29, 79: 79, 290: 290, 790: 790 };
const MAX_AGE = 72 * 60 * 60;
const HEADERS = {'Cache-Control':'private, no-store','Vary':'CF-IPCountry','X-Content-Type-Options':'nosniff'};

// Only edge metadata is used. Never infer location from language, a URL country,
// X-Forwarded-For or a browser-supplied IP, and never retain the visitor's IP.
export function visitorCountry(request) {
 const value = request.cf?.country;
 return typeof value === 'string' && Object.hasOwn(countryCurrencies,value) ? value : null;
}
export function validRates(data, now=Date.now()) {
 return data?.result==='success' && data.base_code==='BRL' && data.rates?.BRL===1 &&
  Number.isFinite(data.time_last_update_unix) && data.time_last_update_unix<=now/1000+300 &&
  data.time_last_update_unix>=now/1000-MAX_AGE;
}
export function priceQuote(country, preference, data) {
 const rates = validRates(data) ? data.rates : {BRL:1};
 const available = Object.keys(rates).filter(code=>/^[A-Z]{3}$/.test(code)&&Number.isFinite(rates[code])&&rates[code]>0&&rates[code]<1e10).sort();
 const requested = preference && preference!=='auto' ? preference : null;
 const detected = countryCurrencies[country] || null;
 let currency=requested||detected||'BRL';
 const reason=!available.includes(currency)?'rates-unavailable':!requested&&!detected?'country-unavailable':null;
 if(!available.includes(currency))currency='BRL';
 const digits=new Intl.NumberFormat('en',{style:'currency',currency}).resolvedOptions().maximumFractionDigits;
 const factor=10**digits;
 const minor=Object.fromEntries(Object.entries(BASE).map(([key,amount])=>[key,Math.round(amount*rates[currency]*factor)]));
 minor[50]=minor[79]-minor[29];minor[500]=minor[790]-minor[290];
 return {country,currency,detectedCurrency:detected,source:reason?'fallback':requested?'manual':'ip',reason,available,
  amounts:Object.fromEntries(Object.entries(minor).map(([key,value])=>[key,value/factor])),
  updatedAt:validRates(data)?new Date(data.time_last_update_unix*1000).toISOString():null,
  estimated:currency!=='BRL',demo:true};
}
export async function pricing(request,{fetcher=fetch,cache=globalThis.caches?.default}={}) {
 if(request.method!=='GET')return Response.json({error:'method-not-allowed'},{status:405,headers:{...HEADERS,Allow:'GET'}});
 const preference=new URL(request.url).searchParams.get('currency')||'auto';
 if(preference!=='auto'&&!/^[A-Z]{3}$/.test(preference))return Response.json({error:'invalid-currency'},{status:400,headers:HEADERS});
 // Cache only the shared exchange dataset, never a geolocated response.
 const key=new Request(new URL('/__internal/fx-brl-v1',request.url));
 let data=null;
 try {const hit=await cache?.match(key);if(hit){const candidate=await hit.json();if(validRates(candidate))data=candidate}}catch{}
 if(!data)try {
  const response=await fetcher('https://open.er-api.com/v6/latest/BRL',{signal:AbortSignal.timeout(4500)});
  if(!response.ok)throw Error('Rates unavailable');
  const candidate=await response.json();if(!validRates(candidate))throw Error('Invalid or stale rates');data=candidate;
  const ttl=Math.min(86400,Math.max(3600,(data.time_next_update_unix||0)-Math.floor(Date.now()/1000)));
  try{await cache?.put(key,Response.json(data,{headers:{'Cache-Control':`public, max-age=${ttl}`}}))}catch{}
 }catch{}
 // Only product prices and currency codes leave the server, never the FX dataset.
 return Response.json(priceQuote(visitorCountry(request),preference,data),{headers:HEADERS});
}
