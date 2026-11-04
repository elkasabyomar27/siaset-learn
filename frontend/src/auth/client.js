import {createClient} from '@supabase/supabase-js';
import {publicAuthConfig} from './config.js';
let client;
export function getAuthClient() {
  if (client !== undefined) return client;
  const config = publicAuthConfig(import.meta.env);
  client = config ? createClient(config.url, config.key, {auth: {
    flowType: 'pkce', detectSessionInUrl: false, persistSession: true,
    autoRefreshToken: true, storageKey: 'siaset-auth-v1',
  }}) : null;
  return client;
}
