import {createClient} from 'npm:@supabase/supabase-js@2.119.0';
import {createWriteHandler} from './handler.generated.js';

// No secrets are compiled into Vite. Deployment and enabling require an approved staging target.
Deno.serve((request: Request) => {
  const url = Deno.env.get('SUPABASE_URL')!;
  const publicKey = Deno.env.get('SIASET_PUBLISHABLE_KEY')!;
  const serverKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const options = {auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false}};
  const auth = createClient(url, publicKey, options);
  const database = createClient(url, serverKey, options);
  return createWriteHandler({
    enabled: Deno.env.get('SIASET_DB2_SYNTHETIC_WRITES') === 'enabled',
    allowedOrigins: (Deno.env.get('SIASET_ALLOWED_ORIGINS') || '').split(',').filter(Boolean),
    verifyUser: async (token: string) => {
      const {data, error} = await auth.auth.getUser(token);
      if (error) throw error;
      return data.user;
    },
    commit: async (owner: string, operation: unknown) => {
      const {data, error} = await database.rpc('commit_learner_batch', {p_user_id: owner, p_operations: [operation]});
      if (error) throw error;
      return data[0];
    },
  })(request);
});
