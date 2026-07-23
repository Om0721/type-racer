import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  `              newPlayers[botIdx] = { 
                ...newPlayers[botIdx], 
                progress: Math.min(1, newPlayers[botIdx].progress + increment),
                _lastTick: now
              };`,
  `              newPlayers[botIdx] = { 
                ...newPlayers[botIdx], 
                progress: Math.min(1, newPlayers[botIdx].progress + increment),
              };
              (newPlayers[botIdx] as any)._lastTick = now;`
);
fs.writeFileSync('src/App.tsx', code);
