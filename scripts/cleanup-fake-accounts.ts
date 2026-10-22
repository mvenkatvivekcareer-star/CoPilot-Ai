import { supabaseService } from '../server/supabase.js';
import fs from 'fs';
import path from 'path';

const KEEP_EMAIL = 'mvenkatvivek@gmail.com';

async function main() {
  console.log('=== REMOVING ALL FAKE & UNWANTED ACCOUNTS ===');

  const status = await supabaseService.getStatus();
  console.log('Supabase Connection Status:', status.message, 'URL:', status.url);

  const client = (supabaseService as any).client;
  if (!client) {
    console.error('Supabase client is not available. Please check credentials.');
    return;
  }

  // 1. Clean profiles table in Supabase
  const { data: allProfiles, error: profError } = await client
    .from('profiles')
    .select('*');

  if (profError) {
    console.error('Error fetching profiles from Supabase:', profError);
  } else {
    console.log(`Found ${allProfiles?.length || 0} total profile rows in Supabase.`);

    const fakeProfiles = (allProfiles || []).filter((p: any) => {
      const email = (p.email || '').toLowerCase().trim();
      return email !== KEEP_EMAIL.toLowerCase();
    });

    console.log(`Identified ${fakeProfiles.length} profiles to delete (keeping only ${KEEP_EMAIL}):`);
    fakeProfiles.forEach((p: any) => {
      console.log(` - ID: ${p.id} | Name: "${p.full_name}" | Email: ${p.email} | Role: ${p.role || p.experience_level}`);
    });

    const fakeProfileIds = fakeProfiles.map((p: any) => p.id);
    if (fakeProfileIds.length > 0) {
      // Clean dependent tables if any exist
      const childTables = [
        'resumes',
        'resume_analyses',
        'jobs',
        'job_matches',
        'skill_goals',
        'interview_sessions',
        'interview_questions',
        'interview_answers',
        'interview_feedback',
        'activity_events',
      ];

      for (const table of childTables) {
        try {
          const { error: cascadeErr } = await client
            .from(table)
            .delete()
            .in('user_id', fakeProfileIds);
          if (cascadeErr) {
            console.log(`Note for table ${table}:`, cascadeErr.message);
          }
        } catch {
          // Ignore if table doesn't have records
        }
      }

      const { error: delProfError } = await client
        .from('profiles')
        .delete()
        .in('id', fakeProfileIds);

      if (delProfError) {
        console.error('Error deleting profiles from Supabase:', delProfError);
      } else {
        console.log(`✓ Successfully deleted ${fakeProfileIds.length} profiles from Supabase profiles table.`);
      }
    }
  }

  // 2. Clean auth.users in Supabase via Admin API
  if (client.auth?.admin) {
    console.log('\n--- Checking Supabase Auth Users ---');
    const { data: authData, error: authErr } = await client.auth.admin.listUsers();
    if (authErr) {
      console.error('Error listing Supabase Auth users:', authErr);
    } else {
      const users = authData.users || [];
      console.log(`Found ${users.length} total users in Supabase Auth.`);
      
      const fakeAuthUsers = users.filter((u: any) => {
        const email = (u.email || '').toLowerCase().trim();
        return email !== KEEP_EMAIL.toLowerCase();
      });

      console.log(`Identified ${fakeAuthUsers.length} Supabase Auth users to remove:`);
      for (const u of fakeAuthUsers) {
        console.log(` - Deleting Auth User: ${u.id} (${u.email})`);
        const { error: delUserErr } = await client.auth.admin.deleteUser(u.id);
        if (delUserErr) {
          console.error(`   Failed to delete auth user ${u.email}:`, delUserErr.message);
        } else {
          console.log(`   ✓ Deleted auth user ${u.email}`);
        }
      }
    }
  }

  // 3. Clean local db.json of any orphan test/demo records
  const DB_FILE = path.resolve(process.cwd(), 'data', 'db.json');
  if (fs.existsSync(DB_FILE)) {
    console.log('\n--- Cleaning Local db.json ---');
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const dbData = JSON.parse(raw);

    const validUserIds = new Set<string>();
    // Filter local users
    dbData.users = (dbData.users || []).filter((u: any) => {
      const email = (u.email || '').toLowerCase().trim();
      const keep = email === KEEP_EMAIL.toLowerCase();
      if (keep) validUserIds.add(u.id);
      return keep;
    });

    dbData.profiles = (dbData.profiles || []).filter((p: any) => {
      return validUserIds.has(p.id);
    });

    // Remove orphaned records from local db.json
    dbData.resumes = (dbData.resumes || []).filter((r: any) => validUserIds.has(r.user_id));
    dbData.resume_analyses = (dbData.resume_analyses || []).filter((a: any) => validUserIds.has(a.user_id));
    dbData.jobs = (dbData.jobs || []).filter((j: any) => validUserIds.has(j.user_id));
    dbData.job_matches = (dbData.job_matches || []).filter((m: any) => validUserIds.has(m.user_id));
    dbData.skill_goals = (dbData.skill_goals || []).filter((g: any) => validUserIds.has(g.user_id));
    dbData.interview_sessions = (dbData.interview_sessions || []).filter((s: any) => validUserIds.has(s.user_id));
    dbData.interview_questions = (dbData.interview_questions || []).filter((q: any) => validUserIds.has(q.user_id));
    dbData.interview_answers = (dbData.interview_answers || []).filter((a: any) => validUserIds.has(a.user_id));
    dbData.interview_feedback = (dbData.interview_feedback || []).filter((f: any) => validUserIds.has(f.user_id));
    dbData.activity_events = (dbData.activity_events || []).filter((e: any) => validUserIds.has(e.user_id));

    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
    console.log('✓ Cleaned local db.json orphan records.');
  }

  // 4. Verify Final State in Supabase
  console.log('\n=== FINAL VERIFICATION ===');
  const { data: remainingProfiles } = await client.from('profiles').select('*');
  console.log(`Remaining profiles in Supabase: ${remainingProfiles?.length || 0}`);
  remainingProfiles?.forEach((p: any) => {
    console.log(` - ${p.id}: ${p.full_name} (${p.email})`);
  });

  if (client.auth?.admin) {
    const { data: remainingAuth } = await client.auth.admin.listUsers();
    console.log(`Remaining Supabase Auth users: ${remainingAuth?.users?.length || 0}`);
    remainingAuth?.users?.forEach((u: any) => {
      console.log(` - ${u.id}: ${u.email}`);
    });
  }

  console.log('\n=== CLEANUP COMPLETED SUCCESSFULLY ===');
}

main().catch(console.error);
