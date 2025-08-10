import fs from 'fs';
import path from 'path';

const generateMigrationGuide = (fromVersion, toVersion) => {
  const template = `
# Migration Guide: v${fromVersion} to v${toVersion}

## Breaking Changes
- [List breaking changes here]

## New Features
- [List new features here]

## Deprecated Features
- [List deprecated features here]

## Migration Steps
1. Update your API calls to use v${toVersion}
2. Test your integration
3. Update your error handling for new response formats

## Examples
\`\`\`javascript
// Before (v${fromVersion})
const response = await fetch('/api/v${fromVersion}/users');

// After (v${toVersion})
const response = await fetch('/api/v${toVersion}/users');
\`\`\`
`;

  const filePath = path.join('docs', `migration-v${fromVersion}-to-v${toVersion}.md`);
  fs.writeFileSync(filePath, template);
  console.log(`Migration guide generated for v${fromVersion} to v${toVersion} at ${filePath}`);
};

export default generateMigrationGuide;