const fs = require('fs');

const oldData = `
2BO - TBO's younger more fun sibling	SE 21
Banana Hammock	South 29
Band Camp	South 38
Beach Vowels	East 8
Bee Movie 2: Titanic 2: Pollenizers of Mars	South 40
Dad Bids	East 9
Deadliest Catch	SE 20
Don't Panic	SE 19
Dr. FunkenLorax & The Barbaloot Spacesuits	South 42
Entropy Punch	South 34
Fish Is Meat	East 7
Flavor Town	East 12
G.A.Y.E.R. - Galactic Action Youth: Emergency Response	East 11
Get Bull-Lit	SE 28
Hutt Buckers	SE 16
Just Saiyan	South 30
Kamp Kahyee	South 47
Kayda Appreciation Society	SE 25
Linda Lions	South 45
Mario Huck 64	South 44
Now that's what I call Sunbreak!	South 31
Pac-Man and the Ghostly Assist	SE 27
Penpalz	South 37
Precious Metal Booty Buccaneers	SE 26
Rainiers in Paradise: Mountaineers vs. [Insert Team Name Here]	SE 15
Seltzers"R"Us	South 41
Shut Up, We're Wizards!	South 43
Smokestack University	South 48
Stella! The Pirate King's Daughter!	East 14
Stranger Swings	East 4
Super SMASH Bro ULTIMATE Edition	SE 23
Tacoma Community Acres	East 3
TBO Presents: Ground Control	SE 17
TEP Camp	South 35
The Giving Trees	South 33
The Ivy League	East 10
The Power Catch Bids	South 39
Too Hot To Handle	South 36
Treat Yo' Self	SE 24
Trouter Limit	East 13
Twin Hammers Among Us	East 1
Twincest Cares-A-Lot!	South 46
Unidentified Feline Object	East 6
Unified Fungal Organism	SE 22
Victoria PIErates	SE 18
Vince	East 5
War on Xmas 3: The Siege on Santa's Twerkshop	South 32
Yacht Party	East 2
`;

run();

async function run() {
    const output = [];
    const campsites = oldData.split('\n').filter(Boolean).map(line => {
        return line.split('\t')[1];
    });
    const teamData = fs.readFileSync('./public/voters.tsv').toString();
    const teams = teamData.split('\n').filter(Boolean).map(line => line.split('\t')[0]);
    const teamSet = Array.from(new Set(teams));
    console.log(campsites, teamSet);
    for (let i = 0; i < teamSet.length; i++) {
        output.push(teamSet[i] + '\t' + campsites[i]);
    }
    fs.writeFileSync('./public/camping.tsv', output.join('\n'));
}