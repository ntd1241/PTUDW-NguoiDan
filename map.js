// Backend example data
//Db query
const sipulated = [
  [106.706576, 10.782429],
  [106.707703, 10.780663],
  [106.706104, 10.78197],
  [106.707295, 10.780953],
  [106.707059, 10.781227],
  [106.706962, 10.781037],
  [106.705986, 10.782329],
  [106.706142, 10.782682],
  [106.706952, 10.782176],
];

const nonSipulate = [
  [106.706142, 10.782682],
  [106.707499, 10.780879],
  [106.708175, 10.781412],
  [106.707332, 10.781659],
  [106.707123, 10.781849],
];

const reported = [
  [106.70656, 10.780827],
  [106.706345, 10.779868],
  [106.706018, 10.780832],
];

//Backend execution
let sipulatedGeoJSON = {
  type: "FeatureCollection",
  features: [],
};
sipulated.forEach((data) => {
  const feature = {
    type: "Feature",
    properties: {
      id: data[0],
      title: "Trụ, cụm pano",
      location:
        "Đồng Khởi - Nguyễn Du (Sở Văn hoá và Thể thao), Phường Bến Nghé, Quận 1",
      size: "2.5m x 10m",
      qty: "1 trụ/bảng",
      type: "Cổ động chính trị",
      categorized: "Công viên",
      status: "Đã quy hoạch",
    },
    geometry: {
      coordinates: data,
      type: "Point",
    },
  };
  sipulatedGeoJSON.features.push(feature);
});

let nonSipulatedGeoJSON = {
  type: "FeatureCollection",
  features: [],
};
nonSipulate.forEach((data) => {
  const feature = {
    type: "Feature",
    properties: {
      id: data[0],
      title: "Trụ, cụm pano",
      location:
        "Đồng Khởi - Nguyễn Du (Sở Văn hoá và Thể thao), Phường Bến Nghé, Quận 1",
      size: "2.5m x 10m",
      qty: "1 trụ/bảng",
      type: "Cổ động chính trị",
      categorized: "Công viên",
      status: "Chưa quy hoạch",
    },
    geometry: {
      coordinates: data,
      type: "Point",
    },
  };
  nonSipulatedGeoJSON.features.push(feature);
});

let reportedGeoJSON = {
  type: "FeatureCollection",
  features: [],
};
reported.forEach((data) => {
  const feature = {
    type: "Feature",
    properties: {
      id: data[0],
      title: "Trụ, cụm pano",
      location:
        "Đồng Khởi - Nguyễn Du (Sở Văn hoá và Thể thao), Phường Bến Nghé, Quận 1",
      size: "2.5m x 10m",
      qty: "1 trụ/bảng",
      type: "Cổ động chính trị",
      categorized: "Công viên",
      status: "Bị báo cáo",
    },
    geometry: {
      coordinates: data,
      type: "Point",
    },
  };
  reportedGeoJSON.features.push(feature);
});
//Variable definition
const sipulatedColor = "#40eb34";
const nonSipulatedColor = "#d3eb34";
const reportedColor = "#eb3434";
const unclusteredRadius = 12;
const $ = document.querySelector.bind(document);
// Mapbox generation
mapboxgl.accessToken =
  "pk.eyJ1IjoicGpsZW9uYXJkMzciLCJhIjoic2YyV2luUSJ9.lPoix24JhyR8sljAwjHg9A";

const map = new mapboxgl.Map({
  container: "mapbox", // container ID
  style: "mapbox://styles/mapbox/streets-v12", // style URL
  center: [106.707748, 10.780571], // starting position [lng, lat]
  zoom: 17, // starting zoom
});

// Map navigation control
map.addControl(new mapboxgl.NavigationControl());
map.addControl(new mapboxgl.FullscreenControl());
//Locate user control
map.addControl(
  new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true,
    },
    // When active the map will receive updates to the device's location as it changes.
    trackUserLocation: true,
    // Draw an arrow next to the location dot to indicate which direction the device is heading.
    showUserHeading: true,
  })
);

//Layer generation
map.on("load", () => {
  // Sipulated source data
  map.addSource("sipulated", {
    type: "geojson",
    data: sipulatedGeoJSON,
    cluster: true,
    clusterMaxZoom: 15,
    clusterRadius: 20,
  });
  //Sipulated cluster
  map.addLayer({
    id: "sipulated-cluster",
    type: "circle",
    source: "sipulated",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": sipulatedColor,
      "circle-radius": ["step", ["get", "point_count"], 30, 4, 60, 8, 90],
    },
    layout: { visibility: "visible" },
  });
  //Sipulated count
  map.addLayer({
    id: "sipulated-count",
    type: "symbol",
    source: "sipulated",
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 12,
      "text-allow-overlap": true,
      visibility: "visible",
    },
  });
  //Sipulated uncluster
  map.addLayer({
    id: "sipulated-unclustered",
    type: "circle",
    source: "sipulated",
    filter: ["!", ["has", "point_count"]],
    layout: { visibility: "visible" },
    paint: {
      "circle-color": sipulatedColor,
      "circle-radius": unclusteredRadius,
      "circle-stroke-width": 1,
      "circle-stroke-color": "#fff",
    },
  });
  //Sipulated label
  map.addLayer({
    id: "sipulated-label",
    type: "symbol",
    source: "sipulated",
    filter: ["!", ["has", "point_count"]],
    layout: {
      "text-field": "QC",
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 12,
      "text-allow-overlap": true,
      visibility: "visible",
    },
    paint: {
      "text-color": "#f2f7f4",
    },
  });
  //Inspect a cluster on click
  map.on("click", "sipulated-cluster", (e) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: ["sipulated-cluster"],
    });
    const clusterId = features[0].properties.cluster_id;
    map
      .getSource("sipulated")
      .getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;

        map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoom,
        });
      });
  });
  //Get info when user moves their mouse over the unclustered layer
  const sipulatedPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
  });
  map.on("mouseenter", "sipulated-unclustered", (e) => {
    map.getCanvas().style.cursor = "pointer";

    const coordinates = e.features[0].geometry.coordinates.slice();
    const { id, title, location, size, qty, type, categorized, status } =
      e.features[0].properties;

    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    const popupDesc = `<b>${type}</b><p>${categorized}</p><p>${location}</p><h5>${status}</h5>`;
    sipulatedPopup.setLngLat(coordinates).setHTML(popupDesc).addTo(map);
  });
  map.on("mouseleave", "sipulated-unclustered", () => {
    map.getCanvas().style.cursor = "";
    sipulatedPopup.remove();
  });
  //Get unclustered info on click
  map.on("click", "sipulated-unclustered", (e) => {
    const coordinates = e.features[0].geometry.coordinates.slice();
    const { id, title, location, size, qty, type, categorized, status } =
      e.features[0].properties;
    const HTMLid = $("#board-id");
    const HTMLstatus = $("#num-ads");
    const HTMLtitle = $("#board-title");
    const HTMLaddr = $("#board-address");
    const HTMLsize = $("#board-size");
    const HTMLqty = $("#board-quantity");
    const HTMLform = $("#board-form");
    const HTMLclassification = $("#board-classification");

    HTMLid.innerHTML = ` ${id}`;
    HTMLstatus.innerHTML = `Địa điểm này có <span class="fw-semibold" id="number-boards-selected">1</span> bảng quảng cáo`;
    HTMLtitle.innerHTML = `${title}<span class="ms-2 badge bg-success">${status}</span></a>`;
    HTMLaddr.innerHTML = location;
    HTMLsize.innerHTML = size;
    HTMLqty.innerHTML = qty;
    HTMLform.innerHTML = type;
    HTMLclassification.innerHTML = categorized;
  });
  map.on("mouseenter", "sipulated-cluster", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "sipulated-cluster", () => {
    map.getCanvas().style.cursor = "";
  });

  //Non sipulated section
  map.addSource("non-sipulated", {
    type: "geojson",
    data: nonSipulatedGeoJSON,
    cluster: true,
    clusterMaxZoom: 15,
    clusterRadius: 15,
  });
  //Non sipulated cluster
  map.addLayer({
    id: "nonSipulated-cluster",
    type: "circle",
    source: "non-sipulated",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": nonSipulatedColor,
      "circle-radius": ["step", ["get", "point_count"], 25, 4, 50, 8, 75],
    },
    layout: { visibility: "visible" },
  });
  //Non sipulated count
  map.addLayer({
    id: "nonSipulated-count",
    type: "symbol",
    source: "non-sipulated",
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 12,
      "text-allow-overlap": true,
      visibility: "visible",
    },
  });
  //Non sipulated uncluster
  map.addLayer({
    id: "nonSipulated-unclustered",
    type: "circle",
    source: "non-sipulated",
    filter: ["!", ["has", "point_count"]],
    layout: { visibility: "visible" },
    paint: {
      "circle-color": nonSipulatedColor,
      "circle-radius": unclusteredRadius,
      "circle-stroke-width": 1,
      "circle-stroke-color": "#fff",
    },
  });
  //Non sipulated label
  map.addLayer({
    id: "nonSipulated-label",
    type: "symbol",
    source: "non-sipulated",
    filter: ["!", ["has", "point_count"]],
    layout: {
      "text-field": "QC",
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 12,
      "text-allow-overlap": true,
      visibility: "visible",
    },
    paint: {
      "text-color": "#f2f7f4",
    },
  });
  //Inspect a cluster on click
  map.on("click", "nonSipulated-cluster", (e) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: ["nonSipulated-cluster"],
    });
    const clusterId = features[0].properties.cluster_id;
    map
      .getSource("non-sipulated")
      .getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;

        map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoom,
        });
      });
  });
  //Get info when user moves their mouse over the unclustered layer
  const nonSipulatedPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
  });
  map.on("mouseenter", "nonSipulated-unclustered", (e) => {
    map.getCanvas().style.cursor = "pointer";

    const coordinates = e.features[0].geometry.coordinates.slice();
    const { id, title, location, size, qty, type, categorized, status } =
      e.features[0].properties;

    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    const popupDesc = `<b>${type}</b><p>${categorized}</p><p>${location}</p><h5>${status}</h5>`;
    nonSipulatedPopup.setLngLat(coordinates).setHTML(popupDesc).addTo(map);
  });
  map.on("mouseleave", "nonSipulated-unclustered", () => {
    map.getCanvas().style.cursor = "";
    nonSipulatedPopup.remove();
  });
  //Get infor onclick
  map.on("click", "nonSipulated-unclustered", (e) => {
    const coordinates = e.features[0].geometry.coordinates.slice();
    const { id, title, location, size, qty, type, categorized, status } =
      e.features[0].properties;
    const HTMLid = $("#board-id");
    const HTMLstatus = $("#num-ads");
    const HTMLtitle = $("#board-title");
    const HTMLaddr = $("#board-address");
    const HTMLsize = $("#board-size");
    const HTMLqty = $("#board-quantity");
    const HTMLform = $("#board-form");
    const HTMLclassification = $("#board-classification");

    HTMLid.innerHTML = ` ${id}`;
    HTMLstatus.innerHTML = `Địa điểm này có <span class="fw-semibold" id="number-boards-selected">1</span> bảng quảng cáo`;
    HTMLtitle.innerHTML = `${title}<span class="ms-2 badge bg-warning">${status}</span></a>`;
    HTMLaddr.innerHTML = location;
    HTMLsize.innerHTML = size;
    HTMLqty.innerHTML = qty;
    HTMLform.innerHTML = type;
    HTMLclassification.innerHTML = categorized;
  });
  map.on("mouseenter", "nonSipulated-cluster", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "nonSipulated-cluster", () => {
    map.getCanvas().style.cursor = "";
  });
  //Reported section
  map.addSource("reported", {
    type: "geojson",
    data: reportedGeoJSON,
    cluster: true,
    clusterMaxZoom: 15,
    clusterRadius: 15,
  });
  //Reported cluster
  map.addLayer({
    id: "reported-cluster",
    type: "circle",
    source: "reported",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": reportedColor,
      "circle-radius": ["step", ["get", "point_count"], 15, 4, 30, 8, 45],
    },
    layout: { visibility: "visible" },
  });
  //Reported count
  map.addLayer({
    id: "reported-count",
    type: "symbol",
    source: "reported",
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 12,
      "text-allow-overlap": true,
      visibility: "visible",
    },
  });
  //Reported uncluster
  map.addLayer({
    id: "reported-unclustered",
    type: "circle",
    source: "reported",
    filter: ["!", ["has", "point_count"]],
    layout: { visibility: "visible" },
    paint: {
      "circle-color": reportedColor,
      "circle-radius": unclusteredRadius,
      "circle-stroke-width": 1,
      "circle-stroke-color": "#fff",
    },
  });
  //Reported label
  map.addLayer({
    id: "reported-label",
    type: "symbol",
    source: "reported",
    filter: ["!", ["has", "point_count"]],
    layout: {
      "text-field": "QC",
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 12,
      "text-allow-overlap": true,
      visibility: "visible",
    },
    paint: {
      "text-color": "#f2f7f4",
    },
  });
  //Inspect a cluster on click
  map.on("click", "reported-cluster", (e) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: ["reported-cluster"],
    });
    const clusterId = features[0].properties.cluster_id;
    map
      .getSource("reported")
      .getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;

        map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoom,
        });
      });
  });
  const reportedPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
  });
  map.on("mouseenter", "reported-unclustered", (e) => {
    map.getCanvas().style.cursor = "pointer";

    const coordinates = e.features[0].geometry.coordinates.slice();
    const { id, title, location, size, qty, type, categorized, status } =
      e.features[0].properties;

    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    const popupDesc = `<b>${type}</b><p>${categorized}</p><p>${location}</p><h5>${status}</h5>`;
    reportedPopup.setLngLat(coordinates).setHTML(popupDesc).addTo(map);
  });
  map.on("mouseleave", "reported-unclustered", () => {
    map.getCanvas().style.cursor = "";
    reportedPopup.remove();
  });
  // Get info on click
  map.on("click", "reported-unclustered", (e) => {
    const coordinates = e.features[0].geometry.coordinates.slice();
    const { id, title, location, size, qty, type, categorized, status } =
      e.features[0].properties;
    const HTMLid = $("#board-id");
    const HTMLstatus = $("#num-ads");
    const HTMLtitle = $("#board-title");
    const HTMLaddr = $("#board-address");
    const HTMLsize = $("#board-size");
    const HTMLqty = $("#board-quantity");
    const HTMLform = $("#board-form");
    const HTMLclassification = $("#board-classification");

    HTMLid.innerHTML = `#ID: ${id}`;
    HTMLstatus.innerHTML = `Địa điểm này có <span class="fw-semibold" id="number-boards-selected">1</span> bảng quảng cáo`;
    HTMLtitle.innerHTML = `${title}<span class="ms-2 badge bg-danger">${status}</span></a>`;
    HTMLaddr.innerHTML = location;
    HTMLsize.innerHTML = size;
    HTMLqty.innerHTML = qty;
    HTMLform.innerHTML = type;
    HTMLclassification.innerHTML = categorized;
  });
  map.on("mouseenter", "reported-cluster", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "reported-cluster", () => {
    map.getCanvas().style.cursor = "";
  });
});

//Toggle layers
const sipulatedToggle = $("#firstCheckboxStretched");
const nonSipulatedToggle = $("#secondCheckboxStretched");
const reportedToggle = $("#thirdCheckboxStretched");

sipulatedToggle.addEventListener("change", (e) => {
  const layers = [
    "sipulated-cluster",
    "sipulated-count",
    "sipulated-unclustered",
    "sipulated-label",
  ];
  if (sipulatedToggle.checked) {
    layers.forEach((layer) => {
      map.setLayoutProperty(layer, "visibility", "visible");
    });
  } else {
    layers.forEach((layer) => {
      map.setLayoutProperty(layer, "visibility", "none");
    });
  }
});

nonSipulatedToggle.addEventListener("change", (e) => {
  const layers = [
    "nonSipulated-cluster",
    "nonSipulated-count",
    "nonSipulated-unclustered",
    "nonSipulated-label",
  ];
  if (nonSipulatedToggle.checked) {
    layers.forEach((layer) => {
      map.setLayoutProperty(layer, "visibility", "visible");
    });
  } else {
    layers.forEach((layer) => {
      map.setLayoutProperty(layer, "visibility", "none");
    });
  }
});

reportedToggle.addEventListener("change", (e) => {
  const layers = [
    "reported-cluster",
    "reported-count",
    "reported-unclustered",
    "reported-label",
  ];
  if (reportedToggle.checked) {
    layers.forEach((layer) => {
      map.setLayoutProperty(layer, "visibility", "visible");
    });
  } else {
    layers.forEach((layer) => {
      map.setLayoutProperty(layer, "visibility", "none");
    });
  }
});

// Reverse geo-location
const locationInput = $("#location-input");
const searchBtn = $("#search-button");

const searchFunc = async (e) => {
  e.preventDefault();

  const apiKey = "8c7c7c956fdd4a598e2301d88cb48135";
  const query = locationInput.value;
  const apiUrl = "https://api.opencagedata.com/geocode/v1/json";
  const requestUrl = `${apiUrl}?key=${apiKey}&q=${encodeURIComponent(
    query
  )}&pretty=1&no_annotations=1`;

  const respond = await fetch(requestUrl);
  try {
    if (!respond.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await respond.json();
    console.log(data);
    const geometry = data.results[0].geometry;
    map.flyTo({ center: geometry });
  } catch (err) {
    console.log(err);
  }
};

searchBtn.addEventListener("click", searchFunc);
locationInput.addEventListener("keypress", (e) => {
  e.preventDefault();
  if (e.key == "Enter") {
    searchFunc(e);
  }
});

//Foward geo-location
map.on("click", async (e) => {
  const { lat, lng } = e.lngLat;
  const query = `${lat}+${lng}`;
  const apiUrl = "https://api.opencagedata.com/geocode/v1/json";
  const apiKey = "8c7c7c956fdd4a598e2301d88cb48135";
  const requestUrl = `${apiUrl}?key=${apiKey}&q=${encodeURIComponent(
    query
  )}&pretty=1&no_annotations=1`;
  const respond = await fetch(requestUrl);
  try {
    if (!respond.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await respond.json();
    // console.log(data.results[0].formatted);
    let [locationName, ...locationAddr] = data.results[0].formatted.split(",");
    locationAddr = locationAddr.join(",");
    if (locationName === "unnamed road") {
      locationName = "Chưa có thông tin đường trên bản đồ";
    }
    const HTMLlocationName = $("#location-name");
    const HTMLlocationAddr = $("#location-address");
    HTMLlocationName.innerHTML = locationName;
    HTMLlocationAddr.innerHTML = locationAddr;
  } catch (err) {
    console.log(err);
  }
});
