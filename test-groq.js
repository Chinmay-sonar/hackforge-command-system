// Step 1 test: verify Groq connection is alive
// Run with: node test-groq.js

import 'dotenv/config';
import Groq from 'groq-sdk';

const key = process.env.GROQ_API_KEY;

if (!key) {
  console.error('❌ GROQ_API_KEY not found in .env');
  console.error('   Make sure your .env file has: GROQ_API_KEY=your_key_here');
  process.exit(1);
}

console.log('✓ GROQ_API_KEY found in .env');
console.log('→ Sending test message to Groq...\n');

const groq = new Groq({ apiKey: key });

try {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'user',
        content: 'Reply with exactly this JSON and nothing else: {"status": "connected", "message": "Intel Agent is ready"}'
      }
    ],
    temperature: 0,
    max_tokens: 50,
  });

  const text = response.choices[0].message.content.trim();
  console.log('Raw response from Groq:');
  console.log(text);
  console.log();

  const parsed = JSON.parse(text);
  console.log('✓ JSON parsed successfully');
  console.log('✓ Status:', parsed.status);
  console.log('✓ Message:', parsed.message);
  console.log('\n✅ Groq connection working. Ready to build Step 2.');

} catch (err) {
  if (err.status === 401) {
    console.error('❌ Authentication failed — API key is invalid or expired.');
    console.error('   Go to console.groq.com/keys and generate a new key.');
  } else if (err instanceof SyntaxError) {
    console.error('❌ Groq responded but the output was not valid JSON.');
    console.error('   This is fine — it means the connection works but JSON mode needs tuning.');
    console.error('   We will fix this in Step 3. Connection itself is OK.');
  } else {
    console.error('❌ Unexpected error:', err.message);
  }
  process.exit(1);
}
