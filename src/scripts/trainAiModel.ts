import fs from 'fs';
import path from 'path';
import * as tf from '@tensorflow/tfjs';

const dataDir = path.join(process.cwd(), 'src/data/ipl_data');
const modelPath = path.join(process.cwd(), 'public/ai-model.json');

const teamMap: Record<string, string> = {
  'Mumbai Indians': 'MI',
  'Chennai Super Kings': 'CSK',
  'Royal Challengers Bangalore': 'RCB',
  'Royal Challengers Bengaluru': 'RCB',
  'Kolkata Knight Riders': 'KKR',
  'Gujarat Titans': 'GT',
  'Delhi Capitals': 'DC',
  'Delhi Daredevils': 'DC',
  'Punjab Kings': 'PBKS',
  'Kings XI Punjab': 'PBKS',
  'Lucknow Super Giants': 'LSG',
  'Rajasthan Royals': 'RR',
  'Sunrisers Hyderabad': 'SRH',
  'Deccan Chargers': 'SRH',
  'Pune Warriors': 'PWI',
  'Gujarat Lions': 'GL',
  'Rising Pune Supergiant': 'RPS',
  'Rising Pune Supergiants': 'RPS',
  'Kochi Tuskers Kerala': 'KTK',
};

const validTeams = ['MI', 'CSK', 'RCB', 'KKR', 'GT', 'DC', 'PBKS', 'LSG', 'RR', 'SRH'];

export async function processData() {
  console.log('Loading Cricsheet data...');
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('_info.csv'));
  
  const matches = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(dataDir, file), 'utf-8');
    const lines = content.split('\n');
    
    let teams: string[] = [];
    let winner = '';
    let tossWinner = '';
    let tossDecision = '';
    
    for (const line of lines) {
      if (line.startsWith('info,team,')) teams.push(teamMap[line.split(',')[2].trim()]);
      if (line.startsWith('info,winner,')) winner = teamMap[line.split(',')[2].trim()];
      if (line.startsWith('info,toss_winner,')) tossWinner = teamMap[line.split(',')[2].trim()];
      if (line.startsWith('info,toss_decision,')) tossDecision = line.split(',')[2].trim();
    }

    if (teams.length === 2 && winner && validTeams.includes(teams[0]) && validTeams.includes(teams[1]) && validTeams.includes(winner)) {
      matches.push({
        team1: teams[0],
        team2: teams[1],
        winner,
        tossWinner,
        tossDecision,
      });
    }
  }

  console.log(`Parsed ${matches.length} valid historical matches.`);

  // Create training tensors
  const numMatches = matches.length;
  // Features: 10 one-hot teams (Team1), 10 one-hot teams (Team2), 1 toss_winner (1 if team1, 0 if team2), 1 toss_decision (1 if bat, 0 if field)
  // Total features = 10 + 10 + 1 + 1 = 22
  const xs = tf.buffer([numMatches, 22]);
  const ys = tf.buffer([numMatches, 1]); // 1 if Team1 won, 0 if Team2 won

  matches.forEach((match, i) => {
    // Determine target
    const isTeam1Winner = match.winner === match.team1 ? 1 : 0;
    ys.set(isTeam1Winner, i, 0);

    // Feature encoding
    const t1Index = validTeams.indexOf(match.team1);
    const t2Index = validTeams.indexOf(match.team2);
    
    if (t1Index !== -1) xs.set(1, i, t1Index);
    if (t2Index !== -1) xs.set(1, i, 10 + t2Index);
    
    const tossWin = match.tossWinner === match.team1 ? 1 : 0;
    const tossBat = match.tossDecision === 'bat' ? 1 : 0;

    xs.set(tossWin, i, 20);
    xs.set(tossBat, i, 21);
  });

  const xTensor = xs.toTensor();
  const yTensor = ys.toTensor();

  console.log('Training Neural Network (TensorFlow.js)...');
  
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 16, activation: 'relu', inputShape: [22] }));
  model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy'],
  });

  await model.fit(xTensor, yTensor, {
    epochs: 150,
    batchSize: 32,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if (epoch % 10 === 0) {
          console.log(`Epoch ${epoch}: loss = ${logs?.loss.toFixed(4)}, accuracy = ${logs?.acc.toFixed(4)}`);
        }
      }
    }
  });

  console.log('Training complete!');
  
  // Save Model
  const weightsData = model.getWeights().map(w => w.arraySync());
  fs.writeFileSync(modelPath, JSON.stringify(weightsData));
  
  console.log(`Model successfully saved.`);
}

processData().catch(console.error);
