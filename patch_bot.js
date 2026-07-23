import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `              // Formula: (WPM * 5 chars / 60 seconds) / 10 (for 100ms) = chars per 100ms
              // Progress = charsPer100ms / totalTextLength
              const charsPer100ms = (difficultyWpm * 5 / 60) / 10;
              const baseIncrement = charsPer100ms / raceText.length;
              
              // Add slight human-like variance and a small nerf to make it "little slow" as requested
              const variance = 0.8 + (Math.random() * 0.4);
              const increment = baseIncrement * variance;
              
              newPlayers[botIdx] = { ...newPlayers[botIdx], progress: Math.min(1, newPlayers[botIdx].progress + increment) };`,
  `              // Calculate progress strictly based on elapsed time to ensure independent movement
              const elapsedMs = Date.now() - (prev.startTime || Date.now());
              const expectedChars = (difficultyWpm / 60000) * elapsedMs * 5;
              
              // Add slight wobble, but tied to time to prevent stalling
              const variance = 0.9 + (Math.random() * 0.2);
              const targetProgress = (expectedChars * variance) / raceText.length;
              
              // Ensure we only go forward
              const nextProgress = Math.max(newPlayers[botIdx].progress, targetProgress);
              
              newPlayers[botIdx] = { ...newPlayers[botIdx], progress: Math.min(1, nextProgress) };`
);

fs.writeFileSync('src/App.tsx', code);
