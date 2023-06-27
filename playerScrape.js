const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs');

run();

async function run() {
    const output = [];
    for (let i = 1; i <= 5; i++) {
        const resp = await axios({
            method: 'get',
            url: `https://www.discnw.org/e/2023-sunbreaktravel-in-time/teams?page=${i}`,
            headers: {
                'Cookie': `tssid=S0DSpKn7HAhcIxNMHRjj5uXy4l2gJXsX; _ga=GA1.2.1074377348.1679245340; _ga_8WWHEC9BPN=GS1.1.1679245340.1.1.1679245368.0.0.0`
            }});
        const html = resp.data;
        const $ = cheerio.load(html);
        const teams = $('div.media-item-wrapper.spacer1').toArray();
        teams.forEach((team, i) => {
            const teamName = $(team).find('h3').toArray()[0];
            const links = $(team).find('.plain-link').toArray();
            links.forEach(link => {
                output.push(teamName.children[0].data + '\t' + $(link).contents().text());
            });
        });
    }
    fs.writeFileSync('./public/voters.tsv', output.join('\n'));
}