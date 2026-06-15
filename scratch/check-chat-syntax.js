const fs = require('fs');
const vm = require('vm');

try {
  const htmlContent = fs.readFileSync('/Users/gerard/Documents/GitHub/cerebro-comercial-ai/chat.html', 'utf8');
  const scriptRegex = /<script>([\s\S]*?)<\/script>/gi;
  let match;
  let scriptCount = 0;

  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    scriptCount++;
    const jsCode = match[1];
    try {
      new vm.Script(jsCode);
      console.log(`Script block ${scriptCount} compiled successfully.`);
    } catch (err) {
      console.error(`Syntax error in script block ${scriptCount}:`, err);
    }
  }
} catch (e) {
  console.error("Error reading chat.html:", e);
}
