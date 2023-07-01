const fs = require('fs');

run();

async function run() {
    const shuffle = (array) => { 
        for (let i = array.length - 1; i > 0; i--) { 
          const j = Math.floor(Math.random() * (i + 1)); 
          [array[i], array[j]] = [array[j], array[i]]; 
        } 
        return array; 
      };

    const output = [];
    const voters = shuffle(fs.readFileSync('./public/voters.tsv').toString().split('\n'));
    const camping = fs.readFileSync('./public/camping.tsv').toString().split('\n').map(line => line.split('\t'));
    for (let i = 0; i < voters.length; i++) {
      const discNWName = voters[i].split('\t')[0];
      const sunbreakName = camping.find(camp => camp[1] === discNWName)?.[0];
      output.push([Date.now(), sunbreakName, Math.random() < 0.55 ? 'Robyn' : 'Orlaf']);
    }
    fs.writeFileSync('./public/fakeVotes.json', JSON.stringify(output, null, 2));
}
