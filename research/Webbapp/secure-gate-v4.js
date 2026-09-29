/* PRECISION Secure Gate V4
 * First-run device passkey gate with deterministic password fallback.
 * Local-only: no secret or credential is sent to the server.
 */
(function(){
  'use strict';
  const KEY='precision-secure-gate-v4';
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}};
  const write=v=>{try{localStorage.setItem(KEY,JSON.stringify(v));return true}catch{return false}};
  const b64u=b=>{let s='';for(const x of b)s+=String.fromCharCode(x);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
  const fromB64u=s=>{s=String(s||'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return Uint8Array.from(atob(s),c=>c.charCodeAt(0))};
  async function hash(password,salt,iterations=120000){
    const enc=new TextEncoder();
    const base=await crypto.subtle.importKey('raw',enc.encode(String(password)),{name:'PBKDF2'},false,['deriveBits']);
    const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:fromB64u(salt),iterations,hash:'SHA-256'},base,256);
    return b64u(new Uint8Array(bits));
  }
  function state(){return read()||{enabled:false,mode:null,credentialId:null,rpId:null,salt:null,hash:null,iterations:120000,createdAt:null}};
  async function registerPasskey(){
    if(!window.isSecureContext||!window.PublicKeyCredential||!navigator.credentials) return {ok:false,code:'UNAVAILABLE',msg:'Passkeys are unavailable in this browser context. Use HTTPS Chrome with a device screen lock, or use the local password fallback.'};
    try{
      const av=await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.();
      if(av===false) return {ok:false,code:'NO_AUTHENTICATOR',msg:'No platform authenticator is available. Enable a screen lock/biometric on this device or use the local password fallback.'};
    }catch{}
    const challenge=new Uint8Array(32),uid=new Uint8Array(16);crypto.getRandomValues(challenge);crypto.getRandomValues(uid);
    const variants=[
      {residentKey:'discouraged',userVerification:'required',authenticatorAttachment:'platform'},
      {residentKey:'preferred',userVerification:'preferred',authenticatorAttachment:'platform'},
      {residentKey:'preferred',userVerification:'required'}
    ];
    let last=null;
    for(const selection of variants){
      try{
        const cred=await navigator.credentials.create({publicKey:{challenge,rp:{id:location.hostname,name:'PRECISION UPSC Study Portal'},user:{id:uid,name:'precision-device',displayName:'PRECISION device'},pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],authenticatorSelection:selection,timeout:60000,attestation:'none'}});
        if(!cred)throw new Error('Passkey registration was cancelled.');
        const ok=write({enabled:true,mode:'passkey',credentialId:b64u(new Uint8Array(cred.rawId)),rpId:location.hostname,createdAt:Date.now(),salt:null,hash:null,iterations:120000});
        if(!ok)throw new Error('Local storage is unavailable; the device lock cannot be persisted.');
        return {ok:true,mode:'passkey',msg:'Device passkey created. PRECISION is now locked to this browser/device.'};
      }catch(e){last=e;}
    }
    const e=last||{};
    const n=e?.name||'';
    let msg=e?.message||'The device credential manager could not create a passkey on this browser.';
    if(n==='NotAllowedError')msg='Chrome cancelled, timed out, or blocked passkey creation. Check the device screen lock and retry.';
    else if(n==='SecurityError')msg='The credential manager rejected this origin. Use the exact HTTPS Vercel URL.';
    else if(n==='InvalidStateError')msg='A passkey may already exist for this origin. You can use the local password fallback.';
    else if(/credential manager|unknown error/i.test(msg))msg='This Chrome/device credential manager could not create a passkey. The local password fallback is available and remains device-local.';
    return {ok:false,code:n||'CREDENTIAL_ERROR',msg,fallback:'password'};
  }
  async function registerPassword(password,confirm){
    if(String(password||'').length<8)return {ok:false,msg:'Use a password of at least 8 characters.'};
    if(password!==confirm)return {ok:false,msg:'Passwords do not match.'};
    const salt=new Uint8Array(16);crypto.getRandomValues(salt);const s=b64u(salt),iterations=120000,h=await hash(password,s,iterations);
    write({enabled:true,mode:'password',credentialId:null,rpId:null,salt:s,hash:h,iterations,createdAt:Date.now()});
    return {ok:true,mode:'password',msg:'Local password fallback created. PRECISION remains device-local.'};
  }
  async function authenticate(){
    const s=state();
    if(!s.enabled)return {ok:true};
    if(s.mode==='passkey'){
      try{
        const challenge=new Uint8Array(32);crypto.getRandomValues(challenge);
        const cred=await navigator.credentials.get({publicKey:{challenge,rpId:s.rpId||location.hostname,userVerification:'required',timeout:60000,allowCredentials:s.credentialId?[{type:'public-key',id:fromB64u(s.credentialId),transports:['internal']}]:undefined}});
        if(cred)return {ok:true,mode:'passkey'};
      }catch(e){
        const n=e?.name||'';let msg=e?.message||'Passkey verification failed.';
        if(n==='NotAllowedError')msg='Passkey verification was cancelled or timed out.';
        if(n==='SecurityError')msg='The current origin does not match the saved passkey. Open the same HTTPS Vercel URL.';
        return {ok:false,code:n||'VERIFY_ERROR',msg};
      }
    }
    return {ok:false,msg:'Device authentication was not completed.'};
  }
  async function authenticatePassword(password){
    const s=state();if(!s.enabled||s.mode!=='password')return {ok:false,msg:'No password fallback is configured.'};
    const h=await hash(password,s.salt,Number(s.iterations)||120000);return h===s.hash?{ok:true,mode:'password'}:{ok:false,msg:'Incorrect password.'};
  }
  function lock(){document.documentElement.dataset.precisionLock='pending';document.body?.classList.add('portal-locked');}
  function unlock(){delete document.documentElement.dataset.precisionLock;document.body?.classList.remove('portal-locked');}
  window.precisionSecureGate={state,registerPasskey,registerPassword,authenticate,authenticatePassword,lock,unlock,reset:()=>localStorage.removeItem(KEY)};
})();
