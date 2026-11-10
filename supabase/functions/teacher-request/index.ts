import {createClient} from 'npm:@supabase/supabase-js@2.119.0';
import {createTeacherRequestHandler} from './handler.js';

// Required secrets (supabase secrets set …):
//   RESEND_API_KEY          Resend API key used to send email
//   TEACHER_ADMIN_EMAIL     where teacher requests are sent for approval
//   TEACHER_EMAIL_FROM      sender, e.g. "SIASET <onboarding@resend.dev>" or an address on your verified domain
//   SIASET_APP_ORIGIN       site origin used in links, e.g. https://siaset.example
//   SIASET_ALLOWED_ORIGINS  comma-separated browser origins allowed to call this function
const env = (name: string) => Deno.env.get(name) || '';
const options = {auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false}};
const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), options);
const columns = 'user_id, display_name, school, reason, status, token_hash, notified_at, created_at, decided_at';

const handler = createTeacherRequestHandler({
  adminEmail: env('TEACHER_ADMIN_EMAIL'),
  appOrigin: env('SIASET_APP_ORIGIN').replace(/\/$/, ''),
  allowedOrigins: env('SIASET_ALLOWED_ORIGINS').split(',').map(v => v.trim()).filter(Boolean),
  verifyUser: async (token: string) => {
    const {data, error} = await admin.auth.getUser(token);
    if (error) throw error;
    return data.user;
  },
  store: {
    async get(userId: string) {
      const {data, error} = await admin.from('teacher_requests').select(columns).eq('user_id', userId).maybeSingle();
      if (error) throw error;
      return data;
    },
    async savePending(row: Record<string, unknown>) {
      const {error} = await admin.from('teacher_requests').upsert({...row, status: 'pending', decided_at: null}, {onConflict: 'user_id'});
      if (error) throw error;
    },
    async decide(userId: string, tokenHash: string, status: string, decidedAt: string) {
      const {data, error} = await admin.from('teacher_requests')
        .update({status, decided_at: decidedAt, token_hash: null})
        .eq('user_id', userId).eq('token_hash', tokenHash).eq('status', 'pending')
        .select(columns).maybeSingle();
      if (error) throw error;
      return data;
    },
    async userEmail(userId: string) {
      const {data, error} = await admin.auth.admin.getUserById(userId);
      return error ? null : data.user?.email ?? null;
    },
  },
  sendEmail: async ({to, subject, html, replyTo}: {to: string; subject: string; html: string; replyTo?: string}) => {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({from: env('TEACHER_EMAIL_FROM'), to: [to], subject, html, ...(replyTo ? {reply_to: replyTo} : {})}),
    });
    if (!response.ok) throw new Error(`email_${response.status}`);
  },
});

Deno.serve(handler);
