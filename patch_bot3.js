import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  `const lastTick = newPlayers[botIdx]._lastTick || prev.startTime || now;`,
  `const lastTick = (newPlayers[botIdx] as any)._lastTick || prev.startTime || now;`
);
fs.writeFileSync('src/App.tsx', code);
