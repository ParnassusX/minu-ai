#!/usr/bin/env node
/**
 * Programmatically start ngrok (https tunnel), update .env.local, then build & start Next.js in production.
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const ngrok = require('ngrok');

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env.local');

function updateEnvLocal(replacements) {
  let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';
  const ensureLine = (key, value) => {
    const rx = new RegExp(`^${key}=.*$`, 'm');
    if (rx.test(content)) {
      content = content.replace(rx, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}`;
    }
  };

  for (const [k, v] of Object.entries(replacements)) {
    ensureLine(k, v);
  }

  fs.writeFileSync(ENV_PATH, content, 'utf8');
  console.log('✅ Updated .env.local');
}

async function main() {
  // Start ngrok https tunnel to local 4000
  console.log('🔌 Starting ngrok tunnel for http://localhost:4000 ...');
  const url = await ngrok.connect({ addr: 4000, proto: 'http' });
  if (!url || !url.startsWith('https://')) {
    // ngrok.connect may return http url first; get https URL via getApi()
    const api = ngrok.getApi();
    const tunnels = await api.listTunnels();
    const httpsTunnel = tunnels.tunnels.find(t => t.public_url && t.public_url.startsWith('https://'));
    if (!httpsTunnel) throw new Error('Could not obtain https ngrok URL');
    console.log('🔗 ngrok (https):', httpsTunnel.public_url);
    updateEnvLocal({
      REPLICATE_WEBHOOK_URL: `${httpsTunnel.public_url}/api/replicate/webhook`,
      NEXT_PUBLIC_DEMO_MODE: 'false'
    });
  } else {
    console.log('🔗 ngrok (https):', url);
    updateEnvLocal({
      REPLICATE_WEBHOOK_URL: `${url}/api/replicate/webhook`,
      NEXT_PUBLIC_DEMO_MODE: 'false'
    });
  }

  // Build Next.js app
  console.log('🏗️  Building Next.js...');
  await new Promise((resolve, reject) => {
    const p = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], { stdio: 'inherit' });
    p.on('exit', code => code === 0 ? resolve(null) : reject(new Error(`build exited ${code}`)));
  });

  // Start Next.js production server
  console.log('🚀 Starting Next.js (production) on :4000 ...');
  const start = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'start'], { stdio: 'inherit' });
  start.on('exit', code => console.log('Next.js exited with code', code));
}

main().catch(err => {
  console.error('❌ setup failed:', err);
  process.exit(1);
});

