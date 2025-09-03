#!/usr/bin/env node
/**
 * Configure ngrok with provided authtoken, create https tunnel to :4000,
 * update .env.local, then build & start Next.js in production.
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const ngrok = require('@ngrok/ngrok');

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env.local');

function updateEnvLocal(replacements) {
  let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';
  const ensureLine = (key, value) => {
    const rx = new RegExp(`^${key}=.*$`, 'm');
    if (rx.test(content)) content = content.replace(rx, `${key}=${value}`);
    else content += `\n${key}=${value}`;
  };
  for (const [k, v] of Object.entries(replacements)) ensureLine(k, v);
  fs.writeFileSync(ENV_PATH, content, 'utf8');
  console.log('✅ Updated .env.local');
}

async function main() {
  const authtoken = process.env.NGROK_AUTHTOKEN || '3278bWNwz8lj7rlu94QuR8qbm3R_2h5diuKWN2GDvb52VJT3W';
  console.log('🔐 Authenticating ngrok ...');
  const listener = await ngrok.forward({
    addr: 4000,
    authtoken,
    // https only
    domain: undefined,
    proto: 'http'
  });
  const publicUrl = listener.url();
  if (!publicUrl.startsWith('https://')) {
    throw new Error(`Expected https public URL, got: ${publicUrl}`);
  }
  console.log('🔗 ngrok (https):', publicUrl);

  updateEnvLocal({
    REPLICATE_WEBHOOK_URL: `${publicUrl}/api/replicate/webhook`,
    NEXT_PUBLIC_DEMO_MODE: 'false'
  });

  console.log('🏗️  Building Next.js...');
  await new Promise((resolve, reject) => {
    const p = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], { stdio: 'inherit' });
    p.on('exit', code => code === 0 ? resolve(null) : reject(new Error(`build exited ${code}`)));
  });

  console.log('🚀 Starting Next.js (production) on :4000 ...');
  const start = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'start'], { stdio: 'inherit' });
  start.on('exit', code => console.log('Next.js exited with code', code));
}

main().catch(err => { console.error('❌ setup failed:', err); process.exit(1); });

