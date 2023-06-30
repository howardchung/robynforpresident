import { useCallback, useEffect, useState } from 'react';
import './App.css';
import { Loader } from "@googlemaps/js-api-loader";
import {XMLParser} from 'fast-xml-parser';
import QRCode from "react-qr-code";
import axios from 'axios';
import React from 'react';

const gradient = [
  'rgb(26, 106, 255)',
  'rgb(122, 94, 243)',
  'rgb(167, 80, 227)',
  'rgb(200, 64, 207)',
  'rgb(225, 46, 184)',
  'rgb(242, 30, 161)',
  'rgb(253, 25, 136)',
  'rgb(255, 36, 112)',
  'rgb(255, 55, 89)',
  'rgb(255, 74, 67)',
        ];
const blue = gradient[0];
const red = gradient[9];

const loader = new Loader({
  apiKey: "AIzaSyCS1nE3eGLvW_D5pAJQ9_iuuoC1lMNJ7ts",
  version: "weekly",
});

const getFakeData = async () => {
  const resp = await axios.get('./fakeVotes.json');
  const timestamp = Math.floor(Date.now() / 1000);
  const mod = timestamp % 1000;
  return { values: resp.data.slice(0, 500 + mod / 2) };
};

async function getElectionData() {
  if (window.location.search.includes('fakeData')) {
    return await getFakeData();
  }
  // TODO add a caching layer
  let votes = {values: []};
  try {
    votes = await (await fetch('https://robynforpresident.onrender.com/')).json();
  } catch (e) {
    console.warn(e);
    votes = await (await fetch('https://sheets.googleapis.com/v4/spreadsheets/1Ctj7ntWMhiDUiGTaXKXJG7C7sbYnA-IjDhyvf8NCPxE/values/Form%20Responses%201?key=AIzaSyDAHivgQUlxM9FKaTYuzfKpOKgf0f9hpXI')).json();
  }
  return votes;
}

type ElectionData = {
  overall: {[key: string]: number},
  tent:{[key: string]: {[key: string]: number}}
};

function App() {
  const [timeLeft, setTimeLeft] = useState<any>(calculateTimeLeft());
  const [raw, setRaw] = useState([]);
  const [electionData, setElectionData] = useState<ElectionData>({
    overall: {},
    tent: {},
  });
  // const [campingData, setCampingData] = useState([]);
  const [voterData, setVoterData] = useState([]);
  const [popByTent, setPopByTent] = useState<{[key: string]: number}>({});
  // const [polygons, setPolygons] = useState([]);
  const [tents, setTents] = useState([]);


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
      console.log(raw);
      setRaw(raw.values?.slice(1));
    };
    refresh();
    setInterval(refresh, 10000);
  }, []);

  useEffect(() => {
    const electionData: ElectionData = {
      overall: {
      },
      tent: {
      }
    }
    raw.forEach((value: string[], i) => {
      if (!electionData.overall?.[value[2]]) {
        electionData.overall[value[2]] = 0;
      }
      // cap the overall count at 100% of voters
      if (i < voterData.length) {
        electionData.overall[value[2]] += 1;
      }
      if (!electionData.tent?.[value[1]]) {
        electionData.tent[value[1]] = {};
      }
      if (!electionData.tent?.[value[1]]?.[value[2]]) {
        electionData.tent[value[1]][value[2]] = 0;
      }
      // cap the tent count at 100% of tent
      console.log(value[1], popByTent[value[1]]);
      if (electionData.tent[value[1]][value[2]] < popByTent[value[1]]) {
        electionData.tent[value[1]][value[2]] += 1;
      }
    });
    console.log(electionData);
    setElectionData(electionData);
  }, [raw, popByTent, voterData]);

  const getVisualData = useCallback((campName: string) => {
    const population = popByTent[campName];
    const countRobyn = electionData.tent[campName]?.Robyn ?? 0;
    const countOrlaf = electionData.tent[campName]?.Orlaf ?? 0;
    const totalVotes = (countRobyn + countOrlaf) ?? 0;
    const percentRobyn = countRobyn / Math.max(totalVotes, 1);
    const percentOrlaf = countOrlaf / Math.max(totalVotes, 1);
    let color = (countRobyn > countOrlaf) ? blue : red;
    if (totalVotes === 0) {
      color = 'rgba(0, 0, 0, 0.0)';
    } else if (Math.abs(percentRobyn - percentOrlaf) < 0.1) {
      color = 'rgba(96, 96, 96, 0.9)';
    }
    const opacity = 0.4 + (Math.abs(percentRobyn - percentOrlaf) * 0.6);
    const turnout = totalVotes / population;
    return {color, opacity, population, countRobyn, countOrlaf, totalVotes, percentRobyn, percentOrlaf, turnout};
  }, [electionData, popByTent]);

  useEffect(() => {
    tents.forEach((tent: google.maps.Polygon) => {
      const campName  = tent.get('campName');
      // console.log('refresh', campName);
      const {color, opacity} = getVisualData(campName);
      // console.log(tent, color, opacity);
      tent.setOptions({
        fillColor: color,
        fillOpacity: opacity,
      });

      const {percentRobyn, percentOrlaf, countRobyn, countOrlaf, turnout} = getVisualData(campName);

      let contentString =
        `<div style="font-size: 20px;margin-bottom: 10px">${campName} (pop. ${(popByTent[campName])?.toFixed(0)})</div>` +
        `<div style="font-size: 14px;margin-bottom: 10px">${tent.get('campLocation')}</div>` +
        `<table style="font-size: 16px;border-spacing: 0;margin-bottom: 10px; width: 100%;">
        <tr>
          <th style="border-bottom: 1px solid rgb(230, 230, 230);">Candidate</th>
          <th style="border-bottom: 1px solid rgb(230, 230, 230);">%</th>
          <th style="border-bottom: 1px solid rgb(230, 230, 230);">Votes</th>
        </tr>
        <tr>
          <td><div style="display:flex;gap:4px;align-items:center;"><div style="width: 14px;height: 14px;border-radius:50%;background-color:rgb(26, 106, 255);"></div>Robyn</div></td>
          <td>${(percentRobyn * 100).toFixed(1)}%</td>
          <td style="text-align:right;">${(countRobyn).toFixed(0)}</td>
        </tr>
        <tr>
          <td><div style="display:flex;gap:4px;align-items:center;"><div style="width: 14px;height: 14px;border-radius:50%;background-color:rgb(255, 74, 67);"></div>Orlaf</div></td>
          <td>${(percentOrlaf * 100).toFixed(1)}%</td>
          <td style="text-align:right;">${(countOrlaf).toFixed(0)}</td>
        </tr>
        </table>` +
        `<div style="font-size: 14px;font-weight:700;">${(turnout * 100).toFixed(0)}% in</div>`;
            
      tent.set('contentString', contentString);
    });
  }, [electionData, getVisualData, popByTent, tents]);

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
      const campingData = (await axios.get('./camping.tsv')).data.split('\n').map((line: string) => line.split('\t'));
      const voterData = (await axios.get('./voters.tsv')).data.split('\n').map((line: string) => line.split('\t'));
      // setCampingData(campingData);
      setVoterData(voterData);
      const popByTent: {[key: string]: number} = {};
      voterData.forEach((voter: string[]) => {
        const sunbreakName = campingData.find((camp: string[]) => camp[1] === voter[0])?.[0];
        if (!popByTent[sunbreakName]) {
          popByTent[sunbreakName] = 0;
        }
        popByTent[sunbreakName] += 1;
      });
      setPopByTent(popByTent);
      console.log(popByTent);

      const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
      let map = new Map(document.getElementById("map") as HTMLElement, {
        center: { lat: 47.90503556127053, lng: -122.08425859514236 },
        zoom: 18.0,
      });
      const XMLdata = await (await fetch('./Sunbreak.kml')).text();
      const parser = new XMLParser();
      let jObj = parser.parse(XMLdata);
      // console.log(jObj);
      // console.log(jObj.kml.Document.Folder[3].Placemark);
      const polygons = jObj.kml.Document.Folder[3].Placemark;
      // setPolygons(polygons);

        const tents = polygons.map((p: any) => {
          const location = p.name;
          // lookup camp name using camp location. polygon's "name" is e.g. SE 12
          // col 1 is sunbreak name
          // col 2 is discnw name (in voter data)
          // col 3 is location (just a number this year, so split comparison to only that bit, e.g. SE 12 vs 12)
          const campName = campingData.find((camp: string[]) => camp[2] === location.split(' ')[1])?.[0];
          if (!campName || location === 'Aux 1 - NO CAMPING') {
            return null;
          }
          const coords = p.Polygon.outerBoundaryIs.LinearRing.coordinates;
          const coordsArray = coords.split('\n').map((c: any) => c.split(','));
          const triangleCoords: google.maps.LatLngLiteral[] = coordsArray.map((c: string[]) => ({
            lat: Number(c[1].trim()),
            lng: Number(c[0].trim()),
          }));
          const tent = new google.maps.Polygon({
            paths: triangleCoords,
            strokeColor: "#666666",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            // fillColor: color,
            // fillOpacity: opacity,
          });
          tent.set('campName', campName);
          tent.set('campLocation', location);
          tent.setMap(map);
                
      // Tooltip for each polygon
      let infoWindow = new google.maps.InfoWindow();
      const showArrays = (event: any) => {
        infoWindow.setContent(tent.get('contentString'));
        infoWindow.setPosition(event.latLng);
        infoWindow.open(map);
      };
      tent.addListener("click", showArrays);
      // tent.set('handle', handle);
      // tent.set('map', map); 
      return tent;
      }).filter(Boolean);
      setTents(tents);
  });
  }, []);
  const totalVotes = (electionData.overall?.['Robyn'] ?? 0) + (electionData.overall?.['Orlaf'] ?? 0);
  const percentRobyn = (electionData.overall?.['Robyn'] ?? 0) / totalVotes * 100;
  const percentOrlaf = (electionData.overall?.['Orlaf'] ?? 0) / totalVotes * 100;
  const maxVotes = voterData.length;
  return (
    <div className="App">
      <div className="mobileStack" style={{ display: 'flex', width: '95vw' }}>
        <div>
          <div className="is-size-2">Sunbreak Presidential Election 2023</div>
          <div className="is-size-4">Polls close in <span>{timerComponents}</span></div>
        </div>
        <div style={{ display: 'flex', marginLeft: 'auto'}}>
          <a rel="noreferrer" target="_blank" href="https://docs.google.com/forms/d/e/1FAIpQLSfSSJC2BYyNceue1Zt8IvJ5gq217xkN-O17YGw_P7zT5V11KA/viewform" className="is-size-4" style={{ fontWeight: 700, marginRight: '8px' }}>Vote:</a>
          <QRCode size={100} value="https://docs.google.com/forms/d/e/1FAIpQLSfSSJC2BYyNceue1Zt8IvJ5gq217xkN-O17YGw_P7zT5V11KA/viewform"></QRCode>
        </div>
      </div>
      {/* <pre>{JSON.stringify(electionData, null, 2)}</pre> */}
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'}}>
        <div style={{ backgroundColor: 'gray', borderRadius: '50%', width: '100px', height: '100px', maxWidth: '10vw', maxHeight: '10vw', backgroundImage: 'url(./robyn.jpg)', backgroundSize: 'contain' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', width: 'calc(90vw - 20vw)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className="mobileStack mobileReverse" style={{ }}>
              <span style={{ color: 'rgb(26, 106, 255)', textTransform: 'uppercase', fontSize: 48, marginRight: 8, fontWeight: 700 }}>{electionData.overall?.['Robyn']?.toFixed(0) ?? 0}</span>
              <span style={{ color: 'rgb(26, 106, 255)', textTransform: 'uppercase', fontSize: 24, fontWeight: 500 }}>Robyn</span>
            </div>
            <div className="mobileStack" style={{ textAlign: 'right' }}>
              <span style={{ color: 'rgb(255, 74, 67)', textTransform: 'uppercase', fontSize: 24, marginRight: 8, fontWeight: 500 }}>Orlaf</span>
              <span style={{ color: 'rgb(255, 74, 67)', textTransform: 'uppercase', fontSize: 48, fontWeight: 700 }}>{electionData.overall?.['Orlaf']?.toFixed(0) ?? 0}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '-50px' }}>
          <div style={{ textAlign: 'center' }}>50% to win</div>
          <div>▼</div>
        </div>
          <div style={{ position: 'relative', justifyContent: 'center', display: 'flex', backgroundColor: 'gray', width: '100%', height: '30px', borderRadius: '4px' }}>
            <div style={{ width: '1px', height: '30px', margin: '0 auto', position: 'absolute', zIndex: 2, backgroundColor: 'black' }}>
            </div>
            <div style={{ backgroundColor: 'rgb(26, 106, 255)', width: percentRobyn + '%'}}></div>
            <div style={{ backgroundColor: 'rgb(255, 74, 67)', width: percentOrlaf + '%' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between'}}>
          <div style={{fontWeight: 700}}>{(percentRobyn).toFixed(1)}%</div>
          <div style={{fontWeight: 700}}>Turnout: {(totalVotes / maxVotes * 100).toFixed(2)}%</div>
          <div style={{fontWeight: 700}}>{(percentOrlaf).toFixed(1)}%</div>
          </div>
        </div>
        <div style={{ backgroundColor: 'gray', borderRadius: '50%', width: '100px', height: '100px', maxWidth: '10vw', maxHeight: '10vw', backgroundImage: 'url(./orlaf.jpg)', backgroundSize: 'contain' }}></div>
      </div>
      <div className="mobileStack" style={{ display: 'flex', marginTop: '10px' }}>
        <div style={{width: "65vw", minWidth: '350px', height: '67vh'}} id="map" />
        <div style={{width: "35vw", minWidth: '350px', height: '67vh', overflowY: 'scroll'}} id="table">
          <table className="table is-narrow" style={{ fontWeight: 400 }}>
            <thead>
            <tr>
              <th>Tent</th>
              <th>Location</th>
              <th>Robyn</th>
              <th>Orlaf</th>
              <th>Turnout</th>
            </tr>
            </thead>
            <tbody>
            {tents.sort().map((tent: google.maps.Polygon) => {
              const {countOrlaf, countRobyn, percentRobyn, percentOrlaf, color, opacity, turnout} = getVisualData(tent.get('campName'));
              const bgColor = color.startsWith('rgb(') ? color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`) : color;
              return <tr key={tent.get('campName')}>
                <td><div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}><div style={{ height: '20px', width: '20px', flexShrink: 0, backgroundColor: bgColor }}></div><div>{tent.get('campName')} <span style={{ fontSize: 12, color: '#444444'}}>(pop. {popByTent[tent.get('campName')]})</span></div></div></td>
                <td>{tent.get('campLocation')}</td>
                <td>{countRobyn}<div style={{backgroundColor: blue, width: percentRobyn * 100 + '%', height: '6px'}}></div></td>
                <td>{countOrlaf}<div style={{backgroundColor: red, width: percentOrlaf * 100 + '%', height: '6px' }}></div></td>
                <td>{(turnout * 100).toFixed(0)}%<div style={{backgroundColor: '#666666', width: turnout * 100 + '%', height: '6px' }}></div></td>
              </tr>
            })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;

function calculateTimeLeft() {
  const difference = Math.max(0, +new Date(`2023-07-02T07:00:00Z`) - Date.now());
  let timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    };

  return timeLeft;
}
