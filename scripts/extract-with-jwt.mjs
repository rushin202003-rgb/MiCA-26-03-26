#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Load env
const raw = readFileSync(join(ROOT, '.env'), 'utf8');
const env = {};
for (const line of raw.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq === -1) continue;
  env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
}

const url = env['VITE_SUPABASE_URL'];
const key = env['VITE_SUPABASE_ANON_KEY'];
const jwt = process.argv[3];
const id = process.argv[2];

if (!id || !jwt) {
  console.error('Usage: node scripts/extract-with-jwt.mjs <campaign-id> <jwt>');
  process.exit(1);
}

const headers = {
  'apikey': key,
  'Authorization': 'Bearer ' + jwt,
  'Content-Type': 'application/json',
};

async function query(table, params = '') {
  const res = await fetch(`${url}/rest/v1/${table}${params}`, { headers });
  if (!res.ok) throw new Error(`Query failed [${table}]: ${res.status} ${await res.text()}`);
  return res.json();
}

function js(val) { return JSON.stringify(val, null, 4); }

function addDays(startIso, n) {
  const d = new Date(startIso);
  d.setDate(d.getDate() + n - 1);
  return d.toISOString().split('T')[0];
}

function trimToSentence(text, maxLen = 400) {
  if (!text || text.length <= maxLen) return text;
  const trimmed = text.slice(0, maxLen);
  const lastPeriod = Math.max(trimmed.lastIndexOf('.'), trimmed.lastIndexOf('!'), trimmed.lastIndexOf('?'));
  return lastPeriod > 100 ? text.slice(0, lastPeriod + 1) : trimmed;
}

console.error(`Fetching campaign ${id}...`);

const [campaignArr, emails, whatsappMsgs, socialPosts] = await Promise.all([
  query('campaigns', `?id=eq.${id}&select=*`),
  query('email_templates', `?campaign_id=eq.${id}&order=template_order.asc&select=*`),
  query('whatsapp_messages', `?campaign_id=eq.${id}&order=message_order.asc&select=*`),
  query('social_posts', `?campaign_id=eq.${id}&order=post_order.asc&select=*`),
]);

if (!campaignArr || campaignArr.length === 0) {
  console.error('Campaign not found'); process.exit(1);
}

const campaign = campaignArr[0];
console.error(`Found: "${campaign.product_name}"`);
console.error(`  emails: ${emails.length}, whatsapp: ${whatsappMsgs.length}, posts: ${socialPosts.length}`);

// Download images to public/demo-assets/
const assetsDir = join(ROOT, 'public', 'demo-assets');
mkdirSync(assetsDir, { recursive: true });

console.error(`\nDownloading images...`);
for (const post of socialPosts) {
  const order = post.post_order || (socialPosts.indexOf(post) + 1);
  const remoteUrl = post.image_url;
  const localPath = join(assetsDir, `post-${order}.png`);
  if (remoteUrl) {
    try {
      const resp = await fetch(remoteUrl);
      if (resp.ok) {
        const buf = Buffer.from(await resp.arrayBuffer());
        writeFileSync(localPath, buf);
        console.error(`  post-${order}.png  ${(buf.length / 1024).toFixed(0)}KB`);
      } else {
        console.error(`  post-${order}.png  FAILED HTTP ${resp.status}`);
      }
    } catch (e) {
      console.error(`  post-${order}.png  ERROR: ${e.message}`);
    }
  } else {
    console.error(`  post-${order}.png  (no image generated)`);
  }
}

// Build tone_preview using the campaign's stored tone_preview_content
const tonePreview = { ...(campaign.tone_preview_content || {}) };

// Trim opening_paragraph to clean sentence end
if (tonePreview.sample_email?.opening_paragraph) {
  tonePreview.sample_email.opening_paragraph = trimToSentence(
    tonePreview.sample_email.opening_paragraph.replace(/<[^>]+>/g, '')
  );
}

// Ensure recommended_channels is set
if (!tonePreview.recommended_channels) {
  tonePreview.recommended_channels = campaign.recommended_channels || ['email', 'whatsapp', 'instagram'];
}

const startDate = campaign.campaign_start_date || new Date().toISOString().split('T')[0];
const marketingPlan = campaign.marketing_plan || {};

// Build execution_schedule
const scheduleEntries = [];
let schedIdx = 1;
for (const e of emails) {
  scheduleEntries.push({
    id: `sched-${schedIdx++}`, channel: 'email', asset_type: 'email_template',
    asset_id: `demo-hp-email-${e.template_order}`, scheduled_day: e.scheduled_day,
    scheduled_date: addDays(startDate, e.scheduled_day), status: 'scheduled',
    recipients_total: 1250, recipients_sent: 0, recipients_failed: 0,
  });
}
for (const w of whatsappMsgs) {
  scheduleEntries.push({
    id: `sched-${schedIdx++}`, channel: 'whatsapp', asset_type: 'whatsapp_message',
    asset_id: `demo-hp-wa-${w.message_order}`, scheduled_day: w.scheduled_day,
    scheduled_date: addDays(startDate, w.scheduled_day), status: 'scheduled',
    recipients_total: 1250, recipients_sent: 0, recipients_failed: 0,
  });
}
for (const p of socialPosts) {
  scheduleEntries.push({
    id: `sched-${schedIdx++}`, channel: 'instagram', asset_type: 'social_post',
    asset_id: `demo-hp-post-${p.post_order}`, scheduled_day: p.scheduled_day,
    scheduled_date: addDays(startDate, p.scheduled_day), status: 'scheduled',
    recipients_total: 1, recipients_sent: 0, recipients_failed: 0,
  });
}

const emailsForDemo = emails.map((e, i) => ({
  id: `demo-hp-email-${e.template_order || i + 1}`,
  template_order: e.template_order || i + 1,
  subject: e.subject, pre_header: e.pre_header || '', body: e.body,
  cta_text: e.cta_text || '', scheduled_day: e.scheduled_day,
}));

const waForDemo = whatsappMsgs.map((w, i) => ({
  id: `demo-hp-wa-${w.message_order || i + 1}`,
  message_order: w.message_order || i + 1,
  message_text: w.message_text, message_type: w.message_type || 'general',
  scheduled_day: w.scheduled_day,
}));

const postsForDemo = socialPosts.map((p, i) => {
  const order = p.post_order || i + 1;
  return {
    id: `demo-hp-post-${order}`, post_order: order,
    caption: p.caption, hashtags: p.hashtags || '',
    post_type: p.post_type || 'single_image', scheduled_day: p.scheduled_day,
    image_suggestion: p.image_suggestion || '',
    image_url: p.image_url ? `/demo-assets/post-${order}.png` : '',
  };
});

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
    launched_at: ${js(campaign.launched_at || startDate + 'T09:00:00Z')},
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

const outPath = join(ROOT, 'src', 'data', 'demoData.ts');
writeFileSync(outPath, output, 'utf8');
console.error('\nWritten: src/data/demoData.ts');

// Print video script
if (campaign.video_script) {
  console.error('\n' + '-'.repeat(60));
  console.error('VIDEO SCRIPT (paste into HeyGen):');
  console.error('-'.repeat(60));
  console.error(campaign.video_script);
  console.error('-'.repeat(60));
} else {
  console.error('\n(No video_script found on this campaign)');
}

console.error(`\nDone. emails:${emailsForDemo.length} wa:${waForDemo.length} posts:${postsForDemo.length} (${postsForDemo.filter(p => p.image_url).length} with local images)`);
