#!/usr/bin/env node
/**
 * extract-demo-data.mjs
 *
 * Extracts a real campaign from Supabase and outputs a replacement for
 * src/data/demoData.ts — paste the TypeScript output into that file.
 *
 * Usage:
 *   node scripts/extract-demo-data.mjs <campaign-id>
 *
 * Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from .env in the
 * project root.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── Read .env ────────────────────────────────────────────────────────────────
function loadEnv() {
  const env = {};
  try {
    const raw = readFileSync(join(ROOT, '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      env[key] = val;
    }
  } catch {
    console.error('Could not read .env file');
    process.exit(1);
  }
  return env;
}

// ── Supabase REST helper ─────────────────────────────────────────────────────
function makeClient(url, anonKey) {
  const headers = {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
  };

  async function query(table, params = '') {
    const res = await fetch(`${url}/rest/v1/${table}${params}`, { headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supabase query failed [${table}]: ${res.status} ${text}`);
    }
    return res.json();
  }

  return { query };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function js(val) {
  return JSON.stringify(val, null, 4);
}

function addDays(startIso, n) {
  const d = new Date(startIso);
  d.setDate(d.getDate() + n - 1);
  return d.toISOString().split('T')[0];
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const campaignId = process.argv[2];
  if (!campaignId) {
    console.error('Usage: node scripts/extract-demo-data.mjs <campaign-id>');
    process.exit(1);
  }

  const env = loadEnv();
  const supabaseUrl = env['VITE_SUPABASE_URL'];
  const anonKey = env['VITE_SUPABASE_ANON_KEY'];

  if (!supabaseUrl || !anonKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
    process.exit(1);
  }

  const db = makeClient(supabaseUrl, anonKey);

  console.error(`Fetching campaign ${campaignId}...`);

  // ── Fetch all tables ───────────────────────────────────────────────────────
  const [campaignArr, emails, whatsappMsgs, socialPosts] = await Promise.all([
    db.query('campaigns', `?id=eq.${campaignId}&select=*`),
    db.query('email_templates', `?campaign_id=eq.${campaignId}&order=template_order.asc&select=*`),
    db.query('whatsapp_messages', `?campaign_id=eq.${campaignId}&order=message_order.asc&select=*`),
    db.query('social_posts', `?campaign_id=eq.${campaignId}&order=post_order.asc&select=*`),
  ]);

  if (!campaignArr || campaignArr.length === 0) {
    console.error(`Campaign ${campaignId} not found`);
    process.exit(1);
  }

  const campaign = campaignArr[0];
  console.error(`Found: "${campaign.product_name}"`);
  console.error(`  emails: ${emails.length}, whatsapp: ${whatsappMsgs.length}, posts: ${socialPosts.length}`);

  // ── Build tone_preview_content ─────────────────────────────────────────────
  const marketingPlan = campaign.marketing_plan || {};
  const firstEmail = emails[0] || {};
  const firstPost = socialPosts[0] || {};
  const firstWa = whatsappMsgs[0] || {};

  const tonePreview = campaign.tone_preview_content || {
    tone_summary: marketingPlan.strategy_summary || '',
    sample_email: {
      subject: firstEmail.subject || '',
      opening_paragraph: firstEmail.body
        ? firstEmail.body.replace(/<[^>]+>/g, '').slice(0, 300)
        : '',
    },
    sample_social_post: {
      caption: firstPost.caption || '',
      post_type: firstPost.post_type || 'single_image',
    },
    sample_whatsapp: {
      message: firstWa.message_text || '',
    },
    recommended_channels: campaign.recommended_channels || ['email', 'whatsapp', 'instagram'],
    channel_reasoning: '',
  };

  // ── Build execution_schedule ───────────────────────────────────────────────
  const startDate = campaign.campaign_start_date || new Date().toISOString().split('T')[0];
  const scheduleEntries = [];
  let schedIdx = 1;

  for (const e of emails) {
    scheduleEntries.push({
      id: `sched-${schedIdx++}`,
      channel: 'email',
      asset_type: 'email_template',
      asset_id: `demo-hp-email-${e.template_order}`,
      scheduled_day: e.scheduled_day,
      scheduled_date: addDays(startDate, e.scheduled_day),
      status: 'scheduled',
      recipients_total: 1250,
      recipients_sent: 0,
      recipients_failed: 0,
    });
  }

  for (const w of whatsappMsgs) {
    scheduleEntries.push({
      id: `sched-${schedIdx++}`,
      channel: 'whatsapp',
      asset_type: 'whatsapp_message',
      asset_id: `demo-hp-wa-${w.message_order}`,
      scheduled_day: w.scheduled_day,
      scheduled_date: addDays(startDate, w.scheduled_day),
      status: 'scheduled',
      recipients_total: 1250,
      recipients_sent: 0,
      recipients_failed: 0,
    });
  }

  for (const p of socialPosts) {
    scheduleEntries.push({
      id: `sched-${schedIdx++}`,
      channel: 'instagram',
      asset_type: 'social_post',
      asset_id: `demo-hp-post-${p.post_order}`,
      scheduled_day: p.scheduled_day,
      scheduled_date: addDays(startDate, p.scheduled_day),
      status: 'scheduled',
      recipients_total: 1,
      recipients_sent: 0,
      recipients_failed: 0,
    });
  }

  // ── Build email_templates array ────────────────────────────────────────────
  const emailsForDemo = emails.map((e, i) => ({
    id: `demo-hp-email-${e.template_order || i + 1}`,
    template_order: e.template_order || i + 1,
    subject: e.subject,
    pre_header: e.pre_header || '',
    body: e.body,
    cta_text: e.cta_text || '',
    scheduled_day: e.scheduled_day,
  }));

  // ── Build whatsapp_messages array ──────────────────────────────────────────
  const waForDemo = whatsappMsgs.map((w, i) => ({
    id: `demo-hp-wa-${w.message_order || i + 1}`,
    message_order: w.message_order || i + 1,
    message_text: w.message_text,
    message_type: w.message_type || 'general',
    scheduled_day: w.scheduled_day,
  }));

  // ── Build social_posts array ───────────────────────────────────────────────
  const postsForDemo = socialPosts.map((p, i) => ({
    id: `demo-hp-post-${p.post_order || i + 1}`,
    post_order: p.post_order || i + 1,
    caption: p.caption,
    hashtags: p.hashtags || '',
    post_type: p.post_type || 'single_image',
    scheduled_day: p.scheduled_day,
    image_suggestion: p.image_suggestion || '',
    image_url: p.image_url ? `/demo-assets/post-${p.post_order || i + 1}.png` : '',
  }));

  // ── Assemble the full demoData.ts ──────────────────────────────────────────
  const output = `export const DEMO_MODE_ENABLED = () => {
    return localStorage.getItem('mica_demo_mode') === 'true';
};

export const DEMO_CAMPAIGN = {
    // Campaign Details
    id: "demo-happiness-001",
    user_id: "demo-user",
    product_name: ${js(campaign.product_name)},
    product_description: ${js(campaign.product_description || '')},
    target_audience: ${js(campaign.target_audience || '')},
    launch_date: ${js(campaign.launch_date || startDate)},
    budget: ${campaign.budget || 5000},
    location: ${js(campaign.location || '')},
    tone: ${js(campaign.tone || 'Warm & Inspirational')},
    tone_custom_words: ${js(campaign.tone_custom_words || '')},
    status: "plan_ready",
    recommended_channels: ${js(campaign.recommended_channels || ['email', 'whatsapp', 'instagram'])},
    recipient_count: 1250,
    launched_at: ${js(campaign.launched_at || `${startDate}T09:00:00Z`)},
    campaign_start_date: ${js(startDate)},
    campaign_end_date: ${js(addDays(startDate, 28))},

    // Tone Preview
    tone_preview_content: ${js(tonePreview)},

    // Marketing Plan
    marketing_plan: ${js(marketingPlan)},

    // Email Templates (${emailsForDemo.length})
    email_templates: ${js(emailsForDemo)},

    // WhatsApp Messages (${waForDemo.length})
    whatsapp_messages: ${js(waForDemo)},

    // Social Posts (${postsForDemo.length})
    social_posts: ${js(postsForDemo)},

    // Video (fill in after HeyGen generation)
    video_url: "",
    video_status: "pending",
    video_script: ${js(campaign.video_script || '')},

    // Execution Schedule
    execution_schedule: ${js(scheduleEntries)},

    // Campaign Logs
    campaign_logs: [
        { channel: "email", action: "sent", recipient: "demo.user@example.com", status_details: "Delivered", executed_at: "${startDate}T09:00:01Z" },
        { channel: "whatsapp", action: "sent", recipient: "+91-98765-43210", status_details: "Delivered", executed_at: "${startDate}T09:01:01Z" }
    ]
};

export const DEMO_TONE_VARIANTS: any = {
    "Professional": {
        tone_summary: "A credible, authority-driven approach that positions the Happiness Program as a tool for cognitive optimization and emotional intelligence in leadership. We focus on the science, productivity, and evidence-based results. The language is direct and respectful.",
        sample_email: {
            subject: "Strategies for sustainable high performance",
            opening_paragraph: "Dear {{first_name}}, In today's competitive landscape, cognitive agility and emotional regulation are as crucial as technical skills. Yet, most professionals are operating with high cortisol and mental fatigue. The Happiness Program offers a scientifically validated approach to stress regulation."
        },
        sample_social_post: {
            caption: "Reviewing the data on workplace efficiency? 📊\\n\\nResearch-backed techniques to reduce cortisol and improve focus.\\n\\nLink in bio.\\n\\n#ProfessionalDevelopment #Leadership #Focus #Productivity",
            post_type: "single_image"
        },
        sample_whatsapp: {
            message: "Hello. We are hosting the 3-day Happiness Program designed to enhance professional focus and reduce workplace stress via evidence-based techniques. Would you be interested in reviewing the curriculum? Reply YES for the executive summary."
        },
        recommended_channels: ["email", "linkedin", "whatsapp"],
        channel_reasoning: "Professional tone warrants a shift towards LinkedIn and formal Email."
    },
    "Urgent": {
        tone_summary: "A high-energy, scarcity-driven approach emphasizing the physical and mental cost of constant stress. We use short sentences, time-sensitive triggers, and 'stop scrolling' language.",
        sample_email: {
            subject: "LAST CHANCE: Registration closes in 3 hours",
            opening_paragraph: "This is it. You have 3 hours left. Do not let another month go by exhausted and reactive. Only a few spots remain. If you want to change your state of mind, you need to decide NOW."
        },
        sample_social_post: {
            caption: "STOP SCROLLING. 🛑\\n\\nDoors to the Happiness Program close tonight.\\n\\nLINK IN BIO. GO. 🏃\\n\\n#LastChance #NowOrNever #Urgent",
            post_type: "reel_script"
        },
        sample_whatsapp: {
            message: "Quick update: Only a few spots left for this weekend! 🚨 Enrollment closes tonight. If you were waiting for a sign to prioritize your mental health, this is it. Grab your spot: [Link]"
        },
        recommended_channels: ["whatsapp", "instagram", "sms"],
        channel_reasoning: "Urgency works best on instant channels like WhatsApp and Instagram Stories."
    },
    "Casual": {
        tone_summary: "A relaxed, peer-to-peer vibe that feels like a chat with a best friend. We use emojis, lower-case styling, and humor to make breathwork feel accessible and entirely normal.",
        sample_email: {
            subject: "stressed? same lol. let's fix it.",
            opening_paragraph: "hey friend! 👋 okay, be honest. how many times did you lose your patience today? no judgment. but if you're tired of running on fumes, you gotta check out the Happiness Program."
        },
        sample_social_post: {
            caption: "me trying to meditate: 🧘‍♀️\\nmy brain: what if ducks had arms?\\n\\nthe Happiness Program does the work for you. come hang! link in bio ✨\\n\\n#relatable #wellness #vibes",
            post_type: "meme"
        },
        sample_whatsapp: {
            message: "heyyy! 👋 doing the Happiness Program this weekend. it's basically a 3-day deep reset for your brain. wanna join? lmk if you want the deets? ✨"
        },
        recommended_channels: ["instagram", "whatsapp", "tiktok"],
        channel_reasoning: "Casual tone lives on social. Instagram/TikTok are primary."
    },
    "Warm & Inspirational": DEMO_CAMPAIGN.tone_preview_content,
    "Custom": {
        tone_summary: "A tailored approach blending the core message with specific requested nuances, ensuring a unique, resonant voice.",
        sample_email: {
            subject: "A gentle invitation to inner peace ✨",
            opening_paragraph: "Greetings. In the quiet moments of the morning, there is a space waiting for you. The Happiness Program is an invitation to inhabit that space. To breathe. To return to your true nature."
        },
        sample_social_post: {
            caption: "Breathe in. 🌿\\n\\nBreathe out.\\n\\nYour peace is your highest priority.\\n\\nLink in bio.\\n\\n#Peace #Serenity #Breathe",
            post_type: "single_image"
        },
        sample_whatsapp: {
            message: "Hi there. 🌿 Just a gentle reminder that you deserve a moment of profound peace today. Our Happiness Program starts soon. Would you like to join us on this inward journey? Reply YES to begin."
        },
        recommended_channels: ["email", "instagram"],
        channel_reasoning: "Custom tone implies a specific niche approach. Defaulting to high-visual and high-narrative channels."
    }
};
`;

  // ── Print result ───────────────────────────────────────────────────────────
  console.log(output);

  // ── Print video_script separately for HeyGen ──────────────────────────────
  if (campaign.video_script) {
    console.error('\n' + '─'.repeat(60));
    console.error('VIDEO SCRIPT (paste into HeyGen):');
    console.error('─'.repeat(60));
    console.error(campaign.video_script);
    console.error('─'.repeat(60));
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
