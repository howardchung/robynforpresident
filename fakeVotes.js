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

    const output = [['header', 'header', 'header']];
    const voters = shuffle(fs.readFileSync('./public/voters.tsv').toString().split('\n'));
    for (let i = 0; i < voters.length; i++) {
        output.push([Date.now(), voters[i].split('\t')[0], Math.random() < 0.6 ? 'Robyn' : 'Orlaf']);
    }
    fs.writeFileSync('./public/fakeVotes.json', JSON.stringify(output, null, 2));
}
