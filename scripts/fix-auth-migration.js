const fs = require('fs');
const path = require('path');

const actionsDir = path.join(__dirname, '../app/actions');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Skip if it doesn't contain SIMULATED_USER_ID
  if (!content.includes('SIMULATED_USER_ID')) return;

  console.log('Fixing:', filePath);

  // 1. Remove the declaration of SIMULATED_USER_ID
  content = content.replace(/(\/\/[^\n]*\n)?const\s+SIMULATED_USER_ID\s*=\s*"[^"]+";\n/g, '');

  // 2. Ensure requireAuth is imported from lib/auth
  if (!content.includes('requireAuth')) {
    content = content.replace(/import\s+\{([^}]+)\}\s+from\s+"(\.\.\/\.\.\/lib\/auth|..\/..\/lib\/auth|..\/lib\/auth|..\/..\/..\/lib\/auth)";/, 'import { $1, requireAuth } from "$2";');
  }

  // 3. Replace usage of SIMULATED_USER_ID with a localized userId
  const funcRegex = /export\s+async\s+function\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{/g;
  let match;
  let lastIndex = 0;
  let newContent = '';

  while ((match = funcRegex.exec(content)) !== null) {
    const startIndex = match.index;
    const bodyStartIndex = startIndex + match[0].length;
    
    // Find the end of the function by counting braces
    let braceCount = 1;
    let i = bodyStartIndex;
    while (braceCount > 0 && i < content.length) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') braceCount--;
      i++;
    }
    const endIndex = i;

    let funcBody = content.substring(bodyStartIndex, endIndex);
    
    // Check if SIMULATED_USER_ID is used inside this function
    if (funcBody.includes('SIMULATED_USER_ID')) {
      // If we haven't already inserted userId = await requireAuth();
      if (!funcBody.includes('await requireAuth()')) {
        funcBody = '\n  const userId = await requireAuth();\n' + funcBody;
      }
      funcBody = funcBody.replace(/SIMULATED_USER_ID/g, 'userId');
    }

    newContent += content.substring(lastIndex, bodyStartIndex) + funcBody;
    lastIndex = endIndex;
  }
  
  newContent += content.substring(lastIndex);
  
  fs.writeFileSync(filePath, newContent, 'utf-8');
}

fs.readdirSync(actionsDir).forEach(file => {
  if (file.endsWith('.ts')) {
    processFile(path.join(actionsDir, file));
  }
});
console.log('Done fixing auth migration.');
