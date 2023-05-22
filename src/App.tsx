import React, { useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import { Loader } from "@googlemaps/js-api-loader";
import {XMLParser} from 'fast-xml-parser';

const loader = new Loader({
  apiKey: "AIzaSyCS1nE3eGLvW_D5pAJQ9_iuuoC1lMNJ7ts",
  version: "weekly",
});

function App() {
  useEffect(() => {
    loader.load().then(async () => {
      const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
      let map = new Map(document.getElementById("map") as HTMLElement, {
        center: { lat: 47.90503556127053, lng: -122.08485859514236 },
        zoom: 18,
      });
      console.log(map);
      const georssLayer = new google.maps.KmlLayer({
        url:
          "http://azure.howardchung.net:3002/Sunbreak.kml",
          map,
          preserveViewport: true,
      });
      // console.log(georssLayer);
      const XMLdata = await (await fetch('http://azure.howardchung.net:3002/Sunbreak.kml')).text();
      const parser = new XMLParser();
      let jObj = parser.parse(XMLdata);
      console.log(jObj);
      console.log(jObj.kml.Document.Folder[3].Placemark);
      const polygons = jObj.kml.Document.Folder[3].Placemark;
      const votes = await (await fetch('https://sheets.googleapis.com/v4/spreadsheets/1Ctj7ntWMhiDUiGTaXKXJG7C7sbYnA-IjDhyvf8NCPxE/values/Form%20Responses%201?key=AIzaSyDAHivgQUlxM9FKaTYuzfKpOKgf0f9hpXI')).json();
      console.log(votes);
      // TODO calculate votes and update polygons and state
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
        setInterval(() => {
          bermudaTriangle.setOptions({
            fillColor: '#0000FF',
          });
        }, 5000);
        // console.log(triangleCoords);

        // Tooltip for each polygon
        bermudaTriangle.addListener("click", showArrays);

        let infoWindow = new google.maps.InfoWindow();

        function showArrays(event: any) {
          // Since this polygon has only one path, we can call getPath() to return the
          // MVCArray of LatLngs.
          // @ts-ignore
          const polygon = this as google.maps.Polygon;
          const vertices = polygon.getPath();
        
          let contentString =
            `<b>${name}</b><br>` +
            `<div style="color:red;">test</div>` +
            `<div>Est: 0% in</div>` +
            `<div>Robyn</div>` +
            `<div style="width:200px;height: 20px;background-color:#0000FF"></div>` +
            `<div>Opposition</div>`;
                // Replace the info window's content and position.
  infoWindow.setContent(contentString);
  infoWindow.setPosition(event.latLng);

  infoWindow.open(map);
      }
    });
  });
  }, []);
  return (
    <div className="App">
      <h1>DECISION 2023</h1>
      <div>progress bar</div>
      <div style={{width: "90vw", height: '75vh'}} id="map" />
    </div>
  );
}

export default App;
