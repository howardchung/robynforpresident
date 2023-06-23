import React, { useEffect, useState } from 'react';
import './App.css';
import { Loader } from "@googlemaps/js-api-loader";
import {XMLParser} from 'fast-xml-parser';
import QRCode from "react-qr-code";

const loader = new Loader({
  apiKey: "AIzaSyCS1nE3eGLvW_D5pAJQ9_iuuoC1lMNJ7ts",
  version: "weekly",
});

async function getElectionData() {
  const votes = await (await fetch('https://sheets.googleapis.com/v4/spreadsheets/1Ctj7ntWMhiDUiGTaXKXJG7C7sbYnA-IjDhyvf8NCPxE/values/Form%20Responses%201?key=AIzaSyDAHivgQUlxM9FKaTYuzfKpOKgf0f9hpXI')).json();
  return votes;
}

type ElectionData = {
  overall: {[key: string]: number},
  tent:{[key: string]: {[key: string]: number}}
};

function App() {
  const [timeLeft, setTimeLeft] = useState<any>(calculateTimeLeft());
  const [electionData, setElectionData] = useState<ElectionData>({
    overall: {},
    tent: {},
  });

  useEffect(() => {
    const id = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => {
      clearTimeout(id);
    };
  });

  useEffect(() => {
    const refresh = async () => {
      const raw = await getElectionData();
      const electionData: ElectionData = {
        overall: {
        },
        tent: {
        }
      }
      raw.values?.slice(1).forEach((value: string[]) => {
        console.log(value);
        if (!electionData.overall?.[value[2]]) {
          electionData.overall[value[2]] = 0;
        }
        // TODO cap the overall count at 100% of voters
        electionData.overall[value[2]] += 1;
        if (!electionData.tent?.[value[1]]?.[value[2]]) {
          electionData.tent[value[1]] = {};
          electionData.tent[value[1]][value[2]] = 0;
        }
        // TODO cap the tent count at 100% of voters
        electionData.tent[value[1]][value[2]] += 1;
      });
      setElectionData(electionData);
    };
    refresh();
    setInterval(refresh, 10000);
  }, []);

  const timerComponents = Object.keys(timeLeft).map(interval => {
    if (!timeLeft[interval]) {
      return null;
    }

    return (
       <span key={interval}>
        {timeLeft[interval]} {interval}{" "}
      </span>
    )
  });

  useEffect(() => {
    loader.load().then(async () => {
      const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
      let map = new Map(document.getElementById("map") as HTMLElement, {
        center: { lat: 47.90503556127053, lng: -122.08485859514236 },
        zoom: 18,
      });
      // console.log(map);
      // const georssLayer = new google.maps.KmlLayer({
      //   url:
      //     "http://azure.howardchung.net:3002/Sunbreak.kml",
      //     map,
      //     preserveViewport: true,
      // });
      // console.log(georssLayer);
      const XMLdata = await (await fetch('http://azure.howardchung.net:3002/Sunbreak.kml')).text();
      const parser = new XMLParser();
      let jObj = parser.parse(XMLdata);
      console.log(jObj);
      console.log(jObj.kml.Document.Folder[3].Placemark);
      const polygons = jObj.kml.Document.Folder[3].Placemark;

      // TODO update polygons and state (color/opacity)
      polygons.forEach((p: any) => {
        const name = p.name;
        const coords = p.Polygon.outerBoundaryIs.LinearRing.coordinates;
        const coordsArray = coords.split('\n').map((c: any) => c.split(','));
        const triangleCoords: google.maps.LatLngLiteral[] = coordsArray.map((c: string[]) => ({
          lat: Number(c[1].trim()),
          lng: Number(c[0].trim()),
        }));
        const bermudaTriangle = new google.maps.Polygon({
          paths: triangleCoords,
          strokeColor: "#666666",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: "#FF0000",
          fillOpacity: 1,
        });
        bermudaTriangle.setMap(map);
        // Update map data
        // setInterval(() => {
        //   bermudaTriangle.setOptions({
        //     fillColor: '#0000FF',
        //   });
        // }, 5000);
        // console.log(triangleCoords);

        // Tooltip for each polygon
        bermudaTriangle.addListener("click", showArrays);

        let infoWindow = new google.maps.InfoWindow();

        function showArrays(event: any) {
          // Since this polygon has only one path, we can call getPath() to return the
          // MVCArray of LatLngs.
          // @ts-ignore
          // const polygon = this as google.maps.Polygon;
          // const vertices = polygon.getPath();
        
          let contentString =
            `<div style="font-size: 20px;margin-bottom: 10px">${name} (pop. ${(0).toFixed(0)})</div>` +
            `<table style="font-size: 16px;border-spacing: 0;margin-bottom: 10px;">
            <tr>
              <th style="border-bottom: 1px solid rgb(230, 230, 230);">Candidate</th>
              <th style="border-bottom: 1px solid rgb(230, 230, 230);">%</th>
              <th style="border-bottom: 1px solid rgb(230, 230, 230);">Votes</th>
            </tr>
            <tr>
              <td><div style="display:flex;gap:4px;align-items:center;"><div style="width: 14px;height: 14px;border-radius:50%;background-color:rgb(26, 106, 255);"></div>Robyn</div></td>
              <td>${(0).toFixed(1)}%</td>
              <td style="text-align:right;">${(0).toFixed(0)}</td>
            </tr>
            <tr>
              <td><div style="display:flex;gap:4px;align-items:center;"><div style="width: 14px;height: 14px;border-radius:50%;background-color:rgb(255, 74, 67);"></div>Orlaf</div></td>
              <td>${(0).toFixed(1)}%</td>
              <td style="text-align:right;">${(0).toFixed(0)}</td>
            </tr>
            </table>` +
            `<div style="font-size: 14px">${(0).toFixed(0)}% in</div>`;
                // Replace the info window's content and position.
  infoWindow.setContent(contentString);
  infoWindow.setPosition(event.latLng);

  infoWindow.open(map);
      }
    });
  });
  }, []);
  const totalVotes = (electionData.overall?.['Robyn'] ?? 0) + (electionData.overall?.['Orlaf'] ?? 0);
  const percentRobyn = (electionData.overall?.['Robyn'] ?? 0) / totalVotes * 100;
  const percentOrlaf = (electionData.overall?.['Orlaf'] ?? 0) / totalVotes * 100;
  // TODO replace max votes based on discnw scrape
  const maxVotes = 100;
  return (
    <div className="App">
      <div style={{ display: 'flex', width: '90vw' }}>
        <div>
          <h2>Sunbreak Presidential Election 2023</h2>
          <h3>Polls close in <span>{timerComponents}</span></h3>
        </div>
        <div style={{ marginLeft: 'auto'}}>
          <h4>Vote here:</h4>
          <QRCode value="https://docs.google.com/forms/d/e/1FAIpQLSfSSJC2BYyNceue1Zt8IvJ5gq217xkN-O17YGw_P7zT5V11KA/viewform"></QRCode>
        </div>
      </div>
      {/* <pre>{JSON.stringify(electionData, null, 2)}</pre> */}
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', width: 'calc(80vw + 200px)'}}>
        <div style={{ backgroundColor: 'gray', borderRadius: '50%', width: '100px', height: '100px' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', width: '80vw' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ width: '120px' }}>
              <span style={{ color: 'rgb(26, 106, 255)', textTransform: 'uppercase', fontSize: 48, marginRight: 8, fontWeight: 700 }}>{electionData.overall?.['Robyn']?.toFixed(0) ?? 0}</span>
              <span style={{ color: 'rgb(26, 106, 255)', textTransform: 'uppercase', fontSize: 24, fontWeight: 500 }}>Robyn</span>
            </div>
            <div style={{ textAlign: 'center'}}>
              <div>50% to win</div>
              <div>▼</div>
            </div>
            <div style={{ width: '120px' }}>
              <span style={{ color: 'rgb(255, 74, 67)', textTransform: 'uppercase', fontSize: 24, marginRight: 8, fontWeight: 500 }}>Orlaf</span>
              <span style={{ color: 'rgb(255, 74, 67)', textTransform: 'uppercase', fontSize: 48, fontWeight: 700 }}>{electionData.overall?.['Orlaf']?.toFixed(0) ?? 0}</span>
            </div>
          </div>
          <div style={{ position: 'relative', justifyContent: 'center', display: 'flex', backgroundColor: 'gray', width: '100%', height: '30px', borderRadius: '4px' }}>
            <div style={{ width: '1px', height: '30px', margin: '0 auto', position: 'absolute', zIndex: 2, backgroundColor: 'black' }}>
            </div>
            <div style={{ backgroundColor: 'rgb(26, 106, 255)', width: percentRobyn + '%'}}></div>
            <div style={{ backgroundColor: 'rgb(255, 74, 67)', width: percentOrlaf + '%' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between'}}>
          <div style={{fontWeight: 700}}>{(percentRobyn).toFixed(1)}%</div>
          <div>Turnout: {(totalVotes / maxVotes * 100).toFixed(1)}%</div>
          <div style={{fontWeight: 700}}>{(percentOrlaf).toFixed(1)}%</div>
          </div>
        </div>
        <div style={{ backgroundColor: 'gray', borderRadius: '50%', width: '100px', height: '100px' }}></div>
      </div>
      <hr />
      <div style={{width: "100vw", height: '70vh'}} id="map" />
    </div>
  );
}

export default App;

function calculateTimeLeft() {
  const difference = Math.max(0, +new Date(`2023-07-02T08:00:00Z`) - Date.now());
  let timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    };

  return timeLeft;
}
