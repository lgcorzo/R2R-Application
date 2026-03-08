#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load .env file if it exists
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        // Remove quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, '');
        process.env[key.trim()] = cleanValue;
      }
    }
  });
}

// Path to env-config.js
const envConfigPath = path.join(__dirname, '../public/env-config.js');

// Read the current env-config.js
let envConfig = fs.readFileSync(envConfigPath, 'utf8');

// Replace placeholders with environment variables
const replacements = {
  __NEXT_PUBLIC_R2R_DEPLOYMENT_URL__:
    process.env.NEXT_PUBLIC_R2R_DEPLOYMENT_URL ||
    '__NEXT_PUBLIC_R2R_DEPLOYMENT_URL__',
  __NEXT_PUBLIC_R2R_DEFAULT_EMAIL__:
    process.env.NEXT_PUBLIC_R2R_DEFAULT_EMAIL ||
    '__NEXT_PUBLIC_R2R_DEFAULT_EMAIL__',
  __NEXT_PUBLIC_R2R_DEFAULT_PASSWORD__:
    process.env.NEXT_PUBLIC_R2R_DEFAULT_PASSWORD ||
    '__NEXT_PUBLIC_R2R_DEFAULT_PASSWORD__',
  __R2R_DASHBOARD_DISABLE_TELEMETRY__:
    process.env.R2R_DASHBOARD_DISABLE_TELEMETRY ||
    '__R2R_DASHBOARD_DISABLE_TELEMETRY__',
  __SUPABASE_URL__: process.env.SUPABASE_URL || '__SUPABASE_URL__',
  __SUPABASE_ANON_KEY__:
    process.env.SUPABASE_ANON_KEY || '__SUPABASE_ANON_KEY__',
  __NEXT_PUBLIC_HATCHET_DASHBOARD_URL__:
    process.env.NEXT_PUBLIC_HATCHET_DASHBOARD_URL ||
    '__NEXT_PUBLIC_HATCHET_DASHBOARD_URL__',
  __NEXT_PUBLIC_SENTRY_DSN__:
    process.env.NEXT_PUBLIC_SENTRY_DSN || '__NEXT_PUBLIC_SENTRY_DSN__',
};

// Perform replacements
Object.entries(replacements).forEach(([placeholder, value]) => {
  // Escape special regex characters in placeholder
  const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escapedPlaceholder, 'g');
  envConfig = envConfig.replace(regex, value);
});

// Write the updated file
fs.writeFileSync(envConfigPath, envConfig, 'utf8');

console.log('Environment variables replaced in env-config.js');
