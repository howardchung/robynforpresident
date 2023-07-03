# robynforpresident

Sunbreak 2023 project

This is an election tracker map (CNN-style) that updates live (every 10 seconds) using data from a Google form which asked people for their team and choice for President.
At the tournament, we had a tablet set up with the form for people to vote, provided QR codes for people to scan to vote on their phones, and in the final hours also shared the ballot link to Discord. From 9:30PM to 12AM we set up a projector with the election map at our campsite and provided live election coverage before the polls closed at midnight.

It utilizes resources such as the camping map (KML) released by DiscNW, scraping the DiscNW website to get team populations, and the Google Sheets API to fetch live voting data.

Tech
----
* React/TypeScript
* Google Maps JavaScript SDK (powers the tooltips and allows coloring polygons)
* Google Sheets API (for voting results)
* Node.js
  * for the results caching layer, since the Google Sheets API has a read limit of 60 queries per minute
  * Also used to scrape the DiscNW website and generate fake voting/camping data for testing

Resources
----
* camping assignments (list of teams mapped to campsites) (update with 2023 teams)
* voting form (update with 2023 teams): https://docs.google.com/forms/d/1SZL6xP9vBWguXU-QjpYutsyJ-Ss1r35PYOkddDQrPqs/edit#responses
* results sheet: https://docs.google.com/spreadsheets/d/1Ctj7ntWMhiDUiGTaXKXJG7C7sbYnA-IjDhyvf8NCPxE/edit?resourcekey#gid=1314784018
* Get player counts from DiscNW website to calculate % in (https://www.discnw.org/e/2023-sunbreaktravel-in-time/teams?page=1)
* gradient generator (blue to red): https://colordesigner.io/gradient-generator
* example CNN tracker: https://www.cnn.com/election/2020/results/president#mapmode=lead

Bits from other people
---
* Get headshot from Robyn and Orla
* Check with Hollar on voting booth/tablet setup
* Check with Allan on projector/battery/microphone