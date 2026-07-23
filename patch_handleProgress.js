import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `            newPlayers[userIdx].progress = progress;\n            newPlayers[userIdx].wpm = wpm;\n            newPlayers[userIdx].accuracy = accuracy;\n            if (progress >= 1 && !newPlayers[userIdx].isFinished) {\n              newPlayers[userIdx].isFinished = true;\n              newPlayers[userIdx].finishTime = Date.now();`,
  `            newPlayers[userIdx] = { ...newPlayers[userIdx], progress, wpm, accuracy };\n            if (progress >= 1 && !newPlayers[userIdx].isFinished) {\n              newPlayers[userIdx] = { ...newPlayers[userIdx], isFinished: true, finishTime: Date.now() };`
);

fs.writeFileSync('src/App.tsx', code);
