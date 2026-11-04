import { createContext, useContext, useEffect, useState } from 'react';
import { getAuthClient } from './client.js';
import { publicAuthConfig } from './config.js';

const AuthContext = createContext(null);
export function AuthProvider({children}) {
  const [client] = useState(()=>{try{return getAuthClient();}catch{return null;}});
  const [user,setUser] = useState(null), [ready,setReady] = useState(!client);
  const [providers,setProviders] = useState(null);
  useEffect(()=>{
    if(!client)return;
    let active=true,revision=0;
    const {data:{subscription}}=client.auth.onAuthStateChange((_event,session)=>{
      revision++;if(active){setUser(session?.user??null);setReady(true);}
    });
    const initial=revision;
    client.auth.getUser().then(({data,error})=>{if(active&&revision===initial){setUser(error?null:data.user);setReady(true);}}).catch(()=>{if(active&&revision===initial){setUser(null);setReady(true);}});
    return ()=>{active=false;subscription.unsubscribe();};
  },[client]);
  useEffect(()=>{
    if(!client)return;
    const controller=new AbortController(), config=publicAuthConfig(import.meta.env);
    fetch(`${config.url}/auth/v1/settings`,{headers:{apikey:config.key},signal:controller.signal})
      .then(response=>{if(!response.ok)throw Error();return response.json();})
      .then(settings=>setProviders({google:settings.external?.google===true,email:settings.external?.email===true,signup:settings.disable_signup!==true}))
      .catch(()=>{});
    return ()=>controller.abort();
  },[client]);
  return <AuthContext.Provider value={{client,user,ready,providers}}>{children}</AuthContext.Provider>;
}
export function useAuth(){return useContext(AuthContext);}
