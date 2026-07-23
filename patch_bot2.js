import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `              // Calculate progress strictly based on elapsed time to ensure independent movement
              const elapsedMs = Date.now() - (prev.startTime || Date.now());
              const expectedChars = (difficultyWpm / 60000) * elapsedMs * 5;
              
              // Add slight wobble, but tied to time to prevent stalling
              const variance = 0.9 + (Math.random() * 0.2);
              const targetProgress = (expectedChars * variance) / raceText.length;
              
              // Ensure we only go forward
              const nextProgress = Math.max(newPlayers[botIdx].progress, targetProgress);
              
              newPlayers[botIdx] = { ...newPlayers[botIdx], progress: Math.min(1, nextProgress) };`,
  `              // Calculate progress based on delta time to prevent main-thread throttling issues
              const now = Date.now();
              // If we haven't tracked last tick, start from startTime or now
              const lastTick = newPlayers[botIdx]._lastTick || prev.startTime || now;
              const dt = now - lastTick;
              
              const expectedChars = (difficultyWpm * 5 / 60000) * dt;
              
              // Add slight human-like variance
              const variance = 0.8 + (Math.random() * 0.4);
              const increment = (expectedChars * variance) / raceText.length;
              
              newPlayers[botIdx] = { 
                ...newPlayers[botIdx], 
                progress: Math.min(1, newPlayers[botIdx].progress + increment),
                _lastTick: now
              };`
);

fs.writeFileSync('src/App.tsx', code);
