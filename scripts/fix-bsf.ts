import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(__dirname, '../db/seed/industry-panels/questions-data.ts');
let content = fs.readFileSync(filePath, 'utf-8');

content = content.replace(/must_include:\s*\[\],\s*should_include:\s*\[([^\]]+)\]/g, (match, shouldContent) => {
  const items = shouldContent.split(',').map((s: string) => s.trim());
  if (items.length > 0 && items[0] !== "''" && items[0] !== "") {
    const firstItem = items[0];
    return `must_include: [${firstItem}], should_include: [${shouldContent}]`;
  }
  return match;
});

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed BSF must_include arrays in questions-data.ts');
