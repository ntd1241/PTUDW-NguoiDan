//Variable definition
const sipulatedColor = "#40eb34";
const nonSipulatedColor = "#d3eb34";
const reportedColor = "#eb3434";
const selfReportedColor = "#848991";
const unclusteredRadius = 12;
let adsData;
let selectedLocation;
let selectedBoard;

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
map.on("load", async () => {
  //Fetched section
  const fetchedsipulatedData = await fetch(
    "http://localhost:3000/citizen/get-sipulated"
  );
  const fetchedNonSipulatedData = await fetch(
    "http://localhost:3000/citizen/get-nonsipulated"
  );
  const fetchedReportData = await fetch(
    "http://localhost:3000/citizen/get-report"
  );
  const sipulated = await fetchedsipulatedData.json();
  const nonSipulated = await fetchedNonSipulatedData.json();
  const reported = await fetchedReportData.json();
  const selfReported = JSON.parse(localStorage.getItem("reportedLocation"));

  // Sipulated source data
  map.addSource("sipulated", {
    type: "geojson",
    data: JSON.parse(sipulated),
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
    const { id, address, adsType, area, locationType, status } =
      e.features[0].properties;

    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    const popupDesc = `<b>${adsType}</b><p>${locationType}</p><p>${address}</p><h5>${status}</h5>`;
    sipulatedPopup.setLngLat(coordinates).setHTML(popupDesc).addTo(map);
  });
  map.on("mouseleave", "sipulated-unclustered", () => {
    map.getCanvas().style.cursor = "";
    sipulatedPopup.remove();
  });
  //Get unclustered info on click
  map.on("click", "sipulated-unclustered", async (e) => {
    selectedLocation = { ...e.features[0], lngLat: e.lngLat };
    const target = e.features[0];
    const fetchedData = await fetch(
      `http://localhost:3000/citizen/get-ads/${e.features[0].properties.id}`
    );
    const data = await fetchedData.json();
    adsData = JSON.parse(data);

    const HTMLid = document.querySelector("#board-id");
    const HTMLnumber = document.querySelector("#num-ads");
    const HTMLtitle = document.querySelector("#board-title");
    const HTMLaddr = document.querySelector("#board-address");
    const HTMLsize = document.querySelector("#board-size");
    const HTMLqty = document.querySelector("#board-quantity");
    const HTMLform = document.querySelector("#board-form");
    const HTMLclassification = document.querySelector("#board-classification");
    const HTMLthumbnail = document.querySelector("#board-thumbnail");
    const HTMLpagination = document.querySelector("#board-pagination");
    const HTMLboardContract = document.querySelector("#board-contract");

    if (adsData.length == 0) {
      HTMLid.innerHTML = "Chưa có thông tin";
      HTMLnumber.innerHTML = `<p>Địa điểm này có 0 quảng cáo</p>`;
      HTMLtitle.innerHTML = `Chưa có thông tin <span class="ms-2 badge bg-secondary" id="board-status">Chưa có thông tin</span></a>`;
      HTMLaddr.innerHTML = target.properties.address;
      HTMLsize.innerHTML = "Chưa có thông tin";
      HTMLqty.innerHTML = "Chưa có thông tin";
      HTMLform.innerHTML = target.properties.adsType;
      HTMLclassification.innerHTML = target.properties.locationType;
      HTMLthumbnail.src = "";
      HTMLboardContract.setAttribute("data-bs-content", ``);
      const popover = new bootstrap.Popover(HTMLboardContract);
      popover.update();
    } else {
      HTMLid.innerHTML = adsData[0].id;
      HTMLnumber.innerHTML = `<p>Địa điểm này có ${adsData.length} quảng cáo`;
      HTMLtitle.innerHTML = `${
        adsData[0].BoardType.type
      }<span class="ms-2 badge ${
        adsData[0].status == "Đã cấp phép"
          ? "bg-success"
          : adsData[0].status == "Chưa cấp phép"
          ? "bg-warning"
          : "bg-danger"
      }" id="board-status">${adsData[0].status}</span></a>`;
      HTMLaddr.innerHTML = adsData[0].AdsPlacement.address;
      HTMLsize.innerHTML = adsData[0].size;
      HTMLqty.innerHTML = adsData[0].quantity;
      HTMLform.innerHTML = adsData[0].AdsPlacement.AdsType.type;
      HTMLclassification.innerHTML =
        adsData[0].AdsPlacement.LocationType.locationType;
      HTMLthumbnail.src = adsData[0].image;
      HTMLboardContract.setAttribute(
        "data-bs-content",
        `Ngày hết hạn: ${adsData[0].end.split("T")[0]}`
      );
      const popover = new bootstrap.Popover(HTMLboardContract);
      popover.update();
    }

    //Update pagination
    let paginationData = "";
    paginationData += `<li class="page-item disabled">
    <a class="page-link" href="#" aria-label="Previous">
      <span aria-hidden="true">&laquo;</span></a></li>`;
    for (let i = 0; i < adsData.length; i++) {
      if (i == 3) {
        break;
      }
      if (i == 0) {
        paginationData += `<li class="page-item active" aria-current="page"><a class="page-link" href="#">${
          i + 1
        }</a></li>`;
      } else {
        paginationData += `<li class="page-item" aria-current="page"><a class="page-link" href="#">${
          i + 1
        }</a></li>`;
      }
    }
    if (adsData.length == 1) {
      paginationData += `<li class="page-item disabled">
      <a class="page-link" href="#" aria-label="Next">
        <span aria-hidden="true">&laquo;</span></a></li>`;
    } else {
      paginationData += `<a class="page-link" href="#" aria-label="Next">
      <span aria-hidden="true">&raquo;</span></a>`;
    }
    HTMLpagination.innerHTML = paginationData;

    //Pagination feature
    const pageItems = document.querySelectorAll(".page-item");
    pageItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        //Deactive previous
        const activeItem = document.querySelector(".page-item.active");
        activeItem.classList.remove("active");

        const page = e.target.innerText;
        HTMLid.innerHTML = adsData[page - 1].id;

        HTMLtitle.innerHTML = `${
          adsData[page - 1].BoardType.type
        }<span class="ms-2 badge ${
          adsData[page - 1].status == "Đã cấp phép"
            ? "bg-success"
            : adsData[page - 1].status == "Chưa cấp phép"
            ? "bg-warning"
            : "bg-danger"
        }" id="board-status">${adsData[page - 1].status}</span></a>`;
        HTMLaddr.innerHTML = adsData[page - 1].AdsPlacement.address;
        HTMLsize.innerHTML = adsData[page - 1].size;
        HTMLqty.innerHTML = adsData[page - 1].quantity;
        HTMLform.innerHTML = adsData[page - 1].AdsPlacement.AdsType.type;
        HTMLclassification.innerHTML =
          adsData[page - 1].AdsPlacement.LocationType.locationType;
        HTMLthumbnail.src = adsData[page - 1].image;
        //Set active
        e.target.parentNode.classList.add("active");
      });
    });
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
    data: JSON.parse(nonSipulated),
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
    const { id, address, adsType, area, locationType, status } =
      e.features[0].properties;

    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    const popupDesc = `<b>${adsType}</b><p>${locationType}</p><p>${address}</p><h5>${status}</h5>`;
    nonSipulatedPopup.setLngLat(coordinates).setHTML(popupDesc).addTo(map);
  });
  map.on("mouseleave", "nonSipulated-unclustered", () => {
    map.getCanvas().style.cursor = "";
    nonSipulatedPopup.remove();
  });
  //Get infor onclick
  map.on("click", "nonSipulated-unclustered", async (e) => {
    const target = e.features[0];
    selectedLocation = { ...e.features[0], lngLat: e.lngLat };
    const fetchedData = await fetch(
      `http://localhost:3000/citizen/get-ads/${e.features[0].properties.id}`
    );
    const data = await fetchedData.json();
    adsData = JSON.parse(data);

    const HTMLid = document.querySelector("#board-id");
    const HTMLnumber = document.querySelector("#num-ads");
    const HTMLtitle = document.querySelector("#board-title");
    const HTMLaddr = document.querySelector("#board-address");
    const HTMLsize = document.querySelector("#board-size");
    const HTMLqty = document.querySelector("#board-quantity");
    const HTMLform = document.querySelector("#board-form");
    const HTMLclassification = document.querySelector("#board-classification");
    const HTMLthumbnail = document.querySelector("#board-thumbnail");
    const HTMLpagination = document.querySelector("#board-pagination");
    const HTMLboardContract = document.querySelector("#board-contract");

    if (adsData.length == 0) {
      HTMLid.innerHTML = "Chưa có thông tin";
      HTMLnumber.innerHTML = `<p>Địa điểm này có 0 quảng cáo</p>`;
      HTMLtitle.innerHTML = `Chưa có thông tin <span class="ms-2 badge bg-secondary" id="board-status">Chưa có thông tin</span></a>`;
      HTMLaddr.innerHTML = target.properties.address;
      HTMLsize.innerHTML = "Chưa có thông tin";
      HTMLqty.innerHTML = "Chưa có thông tin";
      HTMLform.innerHTML = target.properties.adsType;
      HTMLclassification.innerHTML = target.properties.locationType;
      HTMLthumbnail.src = "";
      HTMLboardContract.setAttribute("data-bs-content", ``);
      const popover = new bootstrap.Popover(HTMLboardContract);
      popover.update();
    } else {
      HTMLid.innerHTML = adsData[0].id;
      HTMLnumber.innerHTML = `<p>Địa điểm này có ${adsData.length} quảng cáo`;
      HTMLtitle.innerHTML = `${
        adsData[0].BoardType.type
      }<span class="ms-2 badge ${
        adsData[0].status == "Đã cấp phép"
          ? "bg-success"
          : adsData[0].status == "Chưa cấp phép"
          ? "bg-warning"
          : "bg-danger"
      }" id="board-status">${adsData[0].status}</span></a>`;
      HTMLaddr.innerHTML = adsData[0].AdsPlacement.address;
      HTMLsize.innerHTML = adsData[0].size;
      HTMLqty.innerHTML = adsData[0].quantity;
      HTMLform.innerHTML = adsData[0].AdsPlacement.AdsType.type;
      HTMLclassification.innerHTML =
        adsData[0].AdsPlacement.LocationType.locationType;
      HTMLthumbnail.src = adsData[0].image;
      HTMLboardContract.setAttribute(
        "data-bs-content",
        `Ngày hết hạn: ${adsData[0].end.split("T")[0]}`
      );
      const popover = new bootstrap.Popover(HTMLboardContract);
      popover.update();
    }

    //Default 1st ads

    //Update pagination
    let paginationData = "";
    paginationData += `<li class="page-item disabled">
    <a class="page-link" href="#" aria-label="Previous">
      <span aria-hidden="true">&laquo;</span></a></li>`;
    for (let i = 0; i < adsData.length; i++) {
      if (i == 3) {
        break;
      }
      if (i == 0) {
        paginationData += `<li class="page-item active" aria-current="page"><a class="page-link" href="#">${
          i + 1
        }</a></li>`;
      } else {
        paginationData += `<li class="page-item" aria-current="page"><a class="page-link" href="#">${
          i + 1
        }</a></li>`;
      }
    }
    if (adsData.length == 1) {
      paginationData += `<li class="page-item disabled">
      <a class="page-link" href="#" aria-label="Next">
        <span aria-hidden="true">&laquo;</span></a></li>`;
    } else {
      paginationData += `<a class="page-link" href="#" aria-label="Next">
      <span aria-hidden="true">&raquo;</span></a>`;
    }
    HTMLpagination.innerHTML = paginationData;

    //Pagination feature
    const pageItems = document.querySelectorAll(".page-item");
    pageItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        //Deactive previous
        const activeItem = document.querySelector(".page-item.active");
        activeItem.classList.remove("active");

        const page = e.target.innerText;
        HTMLid.innerHTML = adsData[page - 1].id;

        HTMLtitle.innerHTML = `${
          adsData[page - 1].BoardType.type
        }<span class="ms-2 badge ${
          adsData[page - 1].status == "Đã cấp phép"
            ? "bg-success"
            : adsData[page - 1].status == "Chưa cấp phép"
            ? "bg-warning"
            : "bg-danger"
        }" id="board-status">${adsData[page - 1].status}</span></a>`;
        HTMLaddr.innerHTML = adsData[page - 1].AdsPlacement.address;
        HTMLsize.innerHTML = adsData[page - 1].size;
        HTMLqty.innerHTML = adsData[page - 1].quantity;
        HTMLform.innerHTML = adsData[page - 1].AdsPlacement.AdsType.type;
        HTMLclassification.innerHTML =
          adsData[page - 1].AdsPlacement.LocationType.locationType;
        HTMLthumbnail.src = adsData[page - 1].image;
        //Set active
        e.target.parentNode.classList.add("active");
        //Recreate pagination
      });
    });
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
    data: JSON.parse(reported),
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
    const { id, address, adsType, area, locationType, status } =
      e.features[0].properties;

    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    const popupDesc = `<b>${adsType}</b><p>${locationType}</p><p>${address}</p><h5>${status}</h5>`;
    reportedPopup.setLngLat(coordinates).setHTML(popupDesc).addTo(map);
  });
  map.on("mouseleave", "reported-unclustered", () => {
    map.getCanvas().style.cursor = "";
    reportedPopup.remove();
  });
  // Get info on click
  map.on("click", "reported-unclustered", async (e) => {
    selectedLocation = { ...e.features[0], lngLat: e.lngLat };
    const target = e.features[0];
    const fetchedData = await fetch(
      `http://localhost:3000/citizen/get-ads/${e.features[0].properties.id}`
    );
    const data = await fetchedData.json();
    adsData = JSON.parse(data);

    const HTMLid = document.querySelector("#board-id");
    const HTMLnumber = document.querySelector("#num-ads");
    const HTMLtitle = document.querySelector("#board-title");
    const HTMLaddr = document.querySelector("#board-address");
    const HTMLsize = document.querySelector("#board-size");
    const HTMLqty = document.querySelector("#board-quantity");
    const HTMLform = document.querySelector("#board-form");
    const HTMLclassification = document.querySelector("#board-classification");
    const HTMLthumbnail = document.querySelector("#board-thumbnail");
    const HTMLpagination = document.querySelector("#board-pagination");
    const HTMLboardContract = document.querySelector("#board-contract");
    if (adsData.length == 0) {
      HTMLid.innerHTML = "Chưa có thông tin";
      HTMLnumber.innerHTML = `<p>Địa điểm này có 0 quảng cáo</p>`;
      HTMLtitle.innerHTML = `Chưa có thông tin <span class="ms-2 badge bg-secondary" id="board-status">Chưa có thông tin</span></a>`;
      HTMLaddr.innerHTML = target.properties.address;
      HTMLsize.innerHTML = "Chưa có thông tin";
      HTMLqty.innerHTML = "Chưa có thông tin";
      HTMLform.innerHTML = target.properties.adsType;
      HTMLclassification.innerHTML = target.properties.locationType;
      HTMLthumbnail.src = "";
      HTMLboardContract.setAttribute("data-bs-content", ``);
      const popover = new bootstrap.Popover(HTMLboardContract);
      popover.update();
    } else {
      HTMLid.innerHTML = adsData[0].id;
      HTMLnumber.innerHTML = `<p>Địa điểm này có ${adsData.length} quảng cáo`;
      HTMLtitle.innerHTML = `${
        adsData[0].BoardType.type
      }<span class="ms-2 badge ${
        adsData[0].status == "Đã cấp phép"
          ? "bg-success"
          : adsData[0].status == "Chưa cấp phép"
          ? "bg-warning"
          : "bg-danger"
      }" id="board-status">${adsData[0].status}</span></a>`;
      HTMLaddr.innerHTML = adsData[0].AdsPlacement.address;
      HTMLsize.innerHTML = adsData[0].size;
      HTMLqty.innerHTML = adsData[0].quantity;
      HTMLform.innerHTML = adsData[0].AdsPlacement.AdsType.type;
      HTMLclassification.innerHTML =
        adsData[0].AdsPlacement.LocationType.locationType;
      HTMLthumbnail.src = adsData[0].image;
      HTMLboardContract.setAttribute(
        "data-bs-content",
        `Ngày hết hạn: ${adsData[0].end.split("T")[0]}`
      );
      const popover = new bootstrap.Popover(HTMLboardContract);
      popover.update();
    }

    //Default 1st ads

    //Update pagination
    let paginationData = "";
    paginationData += `<li class="page-item disabled">
    <a class="page-link" href="#" aria-label="Previous">
      <span aria-hidden="true">&laquo;</span></a></li>`;
    for (let i = 0; i < adsData.length; i++) {
      if (i == 3) {
        break;
      }
      if (i == 0) {
        paginationData += `<li class="page-item active" aria-current="page"><a class="page-link" href="#">${
          i + 1
        }</a></li>`;
      } else {
        paginationData += `<li class="page-item" aria-current="page"><a class="page-link" href="#">${
          i + 1
        }</a></li>`;
      }
    }
    if (adsData.length == 1) {
      paginationData += `<li class="page-item disabled">
      <a class="page-link" href="#" aria-label="Next">
        <span aria-hidden="true">&laquo;</span></a></li>`;
    } else {
      paginationData += `<a class="page-link" href="#" aria-label="Next">
      <span aria-hidden="true">&raquo;</span></a>`;
    }
    HTMLpagination.innerHTML = paginationData;

    const pageItems = document.querySelectorAll(".page-item");
    pageItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        //Deactive previous
        const activeItem = document.querySelector(".page-item.active");
        activeItem.classList.remove("active");

        const page = e.target.innerText;
        HTMLid.innerHTML = adsData[page - 1].id;

        HTMLtitle.innerHTML = `${
          adsData[page - 1].BoardType.type
        }<span class="ms-2 badge ${
          adsData[page - 1].status == "Đã cấp phép"
            ? "bg-success"
            : adsData[page - 1].status == "Chưa cấp phép"
            ? "bg-warning"
            : "bg-danger"
        }" id="board-status">${adsData[page - 1].status}</span></a>`;
        HTMLaddr.innerHTML = adsData[page - 1].AdsPlacement.address;
        HTMLsize.innerHTML = adsData[page - 1].size;
        HTMLqty.innerHTML = adsData[page - 1].quantity;
        HTMLform.innerHTML = adsData[page - 1].AdsPlacement.AdsType.type;
        HTMLclassification.innerHTML =
          adsData[page - 1].AdsPlacement.LocationType.locationType;
        HTMLthumbnail.src = adsData[page - 1].image;
        //Set active
        e.target.parentNode.classList.add("active");
      });
    });
  });
  map.on("mouseenter", "reported-cluster", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "reported-cluster", () => {
    map.getCanvas().style.cursor = "";
  });
  //Self report section
  map.addSource("selfReported", {
    type: "geojson",
    data: selfReported,
    cluster: true,
    clusterMaxZoom: 15,
    clusterRadius: 20,
  });
  map.addLayer({
    id: "selfReported-cluster",
    type: "circle",
    source: "selfReported",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": selfReportedColor,
      "circle-radius": ["step", ["get", "point_count"], 30, 4, 60, 8, 90],
    },
    layout: { visibility: "none" },
  });
  //self reported count
  map.addLayer({
    id: "selfReported-count",
    type: "symbol",
    source: "selfReported",
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 12,
      "text-allow-overlap": true,
      visibility: "none",
    },
  });
  //self reported uncluster
  map.addLayer({
    id: "selfReported-unclustered",
    type: "circle",
    source: "selfReported",
    filter: ["!", ["has", "point_count"]],
    layout: { visibility: "none" },
    paint: {
      "circle-color": selfReportedColor,
      "circle-radius": unclusteredRadius,
      "circle-stroke-width": 1,
      "circle-stroke-color": "#fff",
    },
  });
  //self reported label
  map.addLayer({
    id: "selfReported-label",
    type: "symbol",
    source: "selfReported",
    filter: ["!", ["has", "point_count"]],
    layout: {
      "text-field": "QC",
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 12,
      "text-allow-overlap": true,
      visibility: "none",
    },
    paint: {
      "text-color": "#f2f7f4",
    },
  });
  //Inspect a cluster on click
  map.on("click", "selfReported-cluster", (e) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: ["selfReported-cluster"],
    });
    const clusterId = features[0].properties.cluster_id;
    map
      .getSource("selfReported")
      .getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;

        map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoom,
        });
      });
  });
  const selfReportedPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
  });
  map.on("mouseenter", "selfReported-unclustered", (e) => {
    map.getCanvas().style.cursor = "pointer";

    const coordinates = e.features[0].geometry.coordinates.slice();
    const { id, address, adsType, area, locationType, status } =
      e.features[0].properties;

    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    const popupDesc = `<b>${adsType}</b><p>${locationType}</p><p>${address}</p><h5>${status}</h5>`;
    selfReportedPopup.setLngLat(coordinates).setHTML(popupDesc).addTo(map);
  });
  map.on("mouseleave", "selfReported-unclustered", () => {
    map.getCanvas().style.cursor = "";
    selfReportedPopup.remove();
  });
  // Get info on click
  map.on("click", "selfReported-unclustered", async (e) => {
    selectedLocation = { ...e.features[0], lngLat: e.lngLat };
    const target = e.features[0];
    const fetchedData = await fetch(
      `http://localhost:3000/citizen/get-ads/${e.features[0].properties.id}`
    );
    const data = await fetchedData.json();
    adsData = JSON.parse(data);

    const HTMLid = document.querySelector("#board-id");
    const HTMLnumber = document.querySelector("#num-ads");
    const HTMLtitle = document.querySelector("#board-title");
    const HTMLaddr = document.querySelector("#board-address");
    const HTMLsize = document.querySelector("#board-size");
    const HTMLqty = document.querySelector("#board-quantity");
    const HTMLform = document.querySelector("#board-form");
    const HTMLclassification = document.querySelector("#board-classification");
    const HTMLthumbnail = document.querySelector("#board-thumbnail");
    const HTMLpagination = document.querySelector("#board-pagination");
    const HTMLboardContract = document.querySelector("#board-contract");

    if (adsData.length == 0) {
      HTMLid.innerHTML = "Chưa có thông tin";
      HTMLnumber.innerHTML = `<p>Địa điểm này có 0 quảng cáo</p>`;
      HTMLtitle.innerHTML = `Chưa có thông tin <span class="ms-2 badge bg-secondary" id="board-status">Chưa có thông tin</span></a>`;
      HTMLaddr.innerHTML = target.properties.address;
      HTMLsize.innerHTML = "Chưa có thông tin";
      HTMLqty.innerHTML = "Chưa có thông tin";
      HTMLform.innerHTML = target.properties.adsType;
      HTMLclassification.innerHTML = target.properties.locationType;
      HTMLthumbnail.src = "";
      HTMLboardContract.setAttribute("data-bs-content", ``);
      const popover = new bootstrap.Popover(HTMLboardContract);
      popover.update();
    } else {
      HTMLid.innerHTML = adsData[0].id;
      HTMLnumber.innerHTML = `<p>Địa điểm này có ${adsData.length} quảng cáo`;
      HTMLtitle.innerHTML = `${adsData[0].BoardType.type}<span class="ms-2 badge bg-danger" id="board-status">Bị báo cáo vi phạm</span></a>`;
      HTMLaddr.innerHTML = adsData[0].AdsPlacement.address;
      HTMLsize.innerHTML = adsData[0].size;
      HTMLqty.innerHTML = adsData[0].quantity;
      HTMLform.innerHTML = adsData[0].AdsPlacement.AdsType.type;
      HTMLclassification.innerHTML =
        adsData[0].AdsPlacement.LocationType.locationType;
      HTMLthumbnail.src = adsData[0].image;
      HTMLboardContract.setAttribute(
        "data-bs-content",
        `Ngày hết hạn: ${adsData[0].end.split("T")[0]}`
      );
      const popover = new bootstrap.Popover(HTMLboardContract);
      popover.update();
    }

    //Default 1st ads

    //Update pagination
    let paginationData = "";
    paginationData += `<li class="page-item disabled">
    <a class="page-link" href="#" aria-label="Previous">
      <span aria-hidden="true">&laquo;</span></a></li>`;
    for (let i = 0; i < adsData.length; i++) {
      if (i == 3) {
        break;
      }
      if (i == 0) {
        paginationData += `<li class="page-item active" aria-current="page"><a class="page-link" href="#">${
          i + 1
        }</a></li>`;
      } else {
        paginationData += `<li class="page-item" aria-current="page"><a class="page-link" href="#">${
          i + 1
        }</a></li>`;
      }
    }
    if (adsData.length == 1) {
      paginationData += `<li class="page-item disabled">
      <a class="page-link" href="#" aria-label="Next">
        <span aria-hidden="true">&laquo;</span></a></li>`;
    } else {
      paginationData += `<a class="page-link" href="#" aria-label="Next">
      <span aria-hidden="true">&raquo;</span></a>`;
    }
    HTMLpagination.innerHTML = paginationData;

    const pageItems = document.querySelectorAll(".page-item");
    pageItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        //Deactive previous
        const activeItem = document.querySelector(".page-item.active");
        activeItem.classList.remove("active");

        const page = e.target.innerText;
        HTMLid.innerHTML = adsData[page - 1].id;

        HTMLtitle.innerHTML = `${
          adsData[page - 1].BoardType.type
        }<span class="ms-2 badge bg-danger" id="board-status">Bị báo cáo vi phạm</span></a>`;
        HTMLaddr.innerHTML = adsData[page - 1].AdsPlacement.address;
        HTMLsize.innerHTML = adsData[page - 1].size;
        HTMLqty.innerHTML = adsData[page - 1].quantity;
        HTMLform.innerHTML = adsData[page - 1].AdsPlacement.AdsType.type;
        HTMLclassification.innerHTML =
          adsData[page - 1].AdsPlacement.LocationType.locationType;
        HTMLthumbnail.src = adsData[page - 1].image;
        //Set active
        e.target.parentNode.classList.add("active");
      });
    });
  });
  map.on("mouseenter", "selfReported-cluster", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "selfReported-cluster", () => {
    map.getCanvas().style.cursor = "";
  });
});

//Toggle layers
const sipulatedToggle = document.querySelector("#firstCheckboxStretched");
const nonSipulatedToggle = document.querySelector("#secondCheckboxStretched");
const reportedToggle = document.querySelector("#thirdCheckboxStretched");
const selfReportedToggle = document.querySelector("#forthCheckboxStretched");

const sipulatedToggleEvent = (e) => {
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
};
const nonSipulatedToggleEvent = (e) => {
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
};
const reportedToggleEvent = (e) => {
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
};

sipulatedToggle.addEventListener("change", sipulatedToggleEvent);
nonSipulatedToggle.addEventListener("change", nonSipulatedToggleEvent);
reportedToggle.addEventListener("change", reportedToggleEvent);

selfReportedToggle.addEventListener("change", (e) => {
  const layers = [
    "selfReported-cluster",
    "selfReported-count",
    "selfReported-unclustered",
    "selfReported-label",
  ];
  if (selfReportedToggle.checked) {
    sipulatedToggle.checked = false;
    nonSipulatedToggle.checked = false;
    reportedToggle.checked = false;
    layers.forEach((layer) => {
      map.setLayoutProperty(layer, "visibility", "visible");
    });
  } else {
    sipulatedToggle.checked = true;
    nonSipulatedToggle.checked = true;
    reportedToggle.checked = true;
    layers.forEach((layer) => {
      map.setLayoutProperty(layer, "visibility", "none");
    });
  }
  sipulatedToggleEvent();
  nonSipulatedToggleEvent();
  reportedToggleEvent();
});

// Reverse geo-location
const locationInput = document.querySelector("#location-input");
const searchBtn = document.querySelector("#search-button");

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
const fowardMaker = new mapboxgl.Marker({ color: "red" });
map.on("click", async (e) => {
  const { lat, lng } = e.lngLat;
  fowardMaker.setLngLat([lng, lat]).addTo(map);
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

    let [locationName, ...locationAddr] = data.results[0].formatted.split(",");
    locationAddr = locationAddr.join(",");
    if (locationName === "unnamed road") {
      locationName = "Chưa có thông tin đường trên bản đồ";
    }
    const HTMLlocationName = document.querySelector("#location-name");
    const HTMLlocationAddr = document.querySelector("#location-address");
    HTMLlocationName.innerHTML = locationName;
    HTMLlocationAddr.innerHTML = locationAddr;
  } catch (err) {
    console.log(err);
  }
});

//Submit form handle
const formValidation = (data) => {
  // Simple validation for required fields
  if (!data.name || !data.email || !data.phone || !data.type || !data.content) {
    alert("Please fill in all required fields.");
    return false;
  }

  // Validation for email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    alert("Please enter a valid email address.");
    return false;
  }

  // Additional custom validations can be added based on specific requirements

  // If all validations pass, return true to allow form submission
  return true;
};
const formSubmit = document.querySelector("#report-submit");
formSubmit.addEventListener("click", async (e) => {
  e.preventDefault();
  //Reset form result
  const formSubmitResult = document.querySelector("#form-submit-result");
  formSubmitResult.innerHTML = `<h6 class="mb-3 text-success"><span><i class="fa-regular fa-circle-check"></i></span> Báo cáo của bạn đã được gửi và đang chờ xét duyệt!</h6>
  Vui lòng kiểm tra hòm thư Email thường xuyên để nhận được kết quả.`;

  //Prevent undefined location
  if (!selectedLocation) {
    alert("Bạn chưa chọn bất kỳ địa điểm nào để thao tác");
    formSubmitResult.innerHTML = `<h6 class="mb-3 text-danger"><span><i class="fa-regular fa-circle-check"></i></span> Báo cáo của bạn chưa được gửi, vui lòng thực hiện lại</h6>`;
    return;
  }

  const name = document.querySelector("#form-reporter-name").value;
  const email = document.querySelector("#form-reporter-email").value;
  const phone = document.querySelector("#form-reporter-phone").value;

  const type = document.querySelector("#form-report-type").value;
  const content = document.querySelector("#form-report-content").value;

  //Validate
  if (!formValidation({ name, email, phone, type, content })) {
    console.log("HEHS");
    formSubmitResult.innerHTML = `<h6 class="mb-3 text-danger"><span><i class="fa-regular fa-circle-check"></i></span> Báo cáo của bạn chưa được gửi, vui lòng thực hiện lại</h6>`;
    return;
  }

  let board;
  if (selectedBoard) {
    board = selectedBoard.id;
  }

  const location = selectedLocation.properties.id;

  const files = document.querySelector("#form-report-images").files;
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append("files", files[i]);
  }
  let selfReportedLocation = localStorage.getItem("reportedLocation");
  let selfReportedData = localStorage.getItem("reportedData");

  if (selfReportedLocation == undefined) {
    selfReportedLocation = {
      type: "FeatureCollection",
      features: [],
    };
  } else {
    selfReportedLocation = JSON.parse(selfReportedLocation);
  }

  if (selfReportedData == undefined || selfReportedData == null) {
    selfReportedData = [];
  } else {
    selfReportedData = JSON.parse(selfReportedData);
  }

  //Report location handle
  const isExist = selfReportedLocation.features.find((location) => {
    console.log(location);
    return location.properties.address == selectedLocation.properties.address;
  });
  if (!isExist) {
    selfReportedLocation.features.push({
      type: "Feature",
      properties: selectedLocation.properties,
      geometry: {
        coordinates: [selectedLocation.lngLat.lng, selectedLocation.lngLat.lat],
        type: "Point",
      },
    });
    map.getSource("selfReported").setData(selfReportedLocation);
  }

  localStorage.setItem(
    "reportedLocation",
    JSON.stringify(selfReportedLocation)
  );

  formData.append("name", name);
  formData.append("email", email);
  formData.append("phone", phone);
  formData.append("type", type);
  formData.append("content", content);
  formData.append("board", board);
  formData.append("location", location);

  const respond = await fetch("http://127.0.0.1:3000/citizen/post-report", {
    method: "POST",
    body: formData,
  });
  const respondJSON = await respond.json();
  const id = respondJSON.id;
  console.log(id);
  // Save to local storage
  selfReportedData.push(id);
  localStorage.setItem("reportedData", JSON.stringify(selfReportedData));
});

//Get table when click placement report
const viewDetailButtonEvent = (e) => {
  e.preventDefault();

  const clickedRow = e.target.closest("tr");
  console.log(clickedRow)
  if (clickedRow) {
    const reportData = JSON.parse(clickedRow.dataset.report);
    const images =
      reportData.image != null ? reportData.image.split(",") : undefined;
    console.log(reportData);

    const HTMLreportId = document.querySelector("#report-id");
    const HTMLreportStatus = document.querySelector("#report-status");
    const HTMLreportDatetime = document.querySelector("#report-datetime");
    const HTMLreportContent = document.querySelector("#report-content");
    const HTMLreportImg1 = document.querySelector("#report-img-1");
    const HTMlreportImg2 = document.querySelector("#report-img-2");
    const HTMLreporterName = document.querySelector("#reporter-name");
    const HTMLreporterEmail = document.querySelector("#reporter-email");

    HTMLreportId.innerText = reportData.id;
    HTMLreportStatus.innerText = reportData.status;
    HTMLreportDatetime.innerText = reportData.createdAt.split("T")[0];
    HTMLreportContent.innerText = reportData.reportContent;
    if (images == undefined) {
      HTMLreportImg1.src = "";
      HTMlreportImg2.src = "";
    } else if (images.length == 1) {
      HTMLreportImg1.src = "http://localhost:3000/" + images[0];
      HTMlreportImg2.src = "";
    } else {
      HTMLreportImg1.src = "http://localhost:3000/" + images[0];
      HTMlreportImg2.src = "http://localhost:3000/" + images[1];
    }
    HTMLreporterName.innerText = reportData.name;
    HTMLreporterEmail.innerText = reportData.email;
  }
};
const reportLocationButton = document.querySelector("#location-report");
reportLocationButton.addEventListener("click", async (e) => {
  const createReport = document.querySelector("#create-report");
  createReport.style.display = "inline-block";
  let locationId;
  if (selectedLocation) {
    locationId = selectedLocation.properties.id;
  }
  selectedBoard = undefined;

  let respond = await fetch(
    `http://localhost:3000/citizen/get-report-data?placement=${locationId}&board=undefined`
  );
  const data = await respond.json();
  const reportData = JSON.parse(data);

  const handled = reportData.filter((item) => {
    return item.status == "Đã xử lý";
  });

  //Change location info
  const HTMLlocationId = document.querySelector("#target-id");
  const HTMLlocationType = document.querySelector("#target-type");
  const HTMLlocationNoReports = document.querySelector("#target-no-reports");
  const HTMLlocationAddress = document.querySelector("#target-address");

  HTMLlocationId.innerText = selectedLocation.properties.id;
  HTMLlocationType.innerText = "Địa điểm";
  HTMLlocationNoReports.innerText = `${handled.length}/${reportData.length}`;
  HTMLlocationAddress.innerText = selectedLocation.properties.address;

  //Change data table
  $(document).ready(function () {
    var dataTable = $("#myTable").DataTable();

    dataTable.clear().draw();

    reportData.forEach(function (item) {
      const rowDataArr = [
        item.id,
        item.name,
        item.ReportType.type,
        item.createdAt.split("T")[0],
        item.status,
        '<a href="#" class="view-detail" rel="noopener noreferrer"><img src="./img/file.png" alt="" style="height:30px"></a>',
      ];
      // rowDataArr.push(JSON.stringify(item))
      const newRow = $('<tr>').attr('data-report', JSON.stringify(item));
      rowDataArr.forEach(function (data) {
        newRow.append('<td>' + data + '</td>');
      });
      dataTable.row.add(newRow);
    });

    dataTable.draw();

    //Re create click event
    const viewButtons = document.querySelectorAll("td a");
    console.log(viewButtons);
    viewButtons.forEach((item) => {
      item.addEventListener("click", viewDetailButtonEvent);
    });
  });
});

//Get table when click board report
const reportBoardButton = document.querySelector("#board-report");
reportBoardButton.addEventListener("click", async (e) => {
  const createReport = document.querySelector("#create-report");
  createReport.style.display = "inline-block";
  let page =
    document.querySelector(".page-item.active") != null
      ? document.querySelector(".page-item.active").innerText
      : undefined;
  console.log(page);
  if (page == undefined) {
    return;
  }
  selectedBoard = adsData[page - 1];
  const board = adsData[page - 1];

  const respond = await fetch(
    `http://localhost:3000/citizen/get-report-data?board=${board.id}&placement=undefined`
  );
  const data = await respond.json();
  const reportData = JSON.parse(data);

  const handled = reportData.filter((item) => {
    return item.status == "Đã xử lý";
  });

  //Change location info
  const HTMLlocationId = document.querySelector("#target-id");
  const HTMLlocationType = document.querySelector("#target-type");
  const HTMLlocationNoReports = document.querySelector("#target-no-reports");
  const HTMLlocationAddress = document.querySelector("#target-address");

  HTMLlocationId.innerText = selectedLocation.properties.id;
  HTMLlocationType.innerText = "Địa điểm";
  HTMLlocationNoReports.innerText = `${handled.length}/${reportData.length}`;
  HTMLlocationAddress.innerText = selectedLocation.properties.address;

  $(document).ready(function () {
    var dataTable = $("#myTable").DataTable();

    dataTable.clear().draw();

    reportData.forEach(function (item) {
      const rowDataArr = [
        item.id,
        item.name,
        item.ReportType.type,
        item.createdAt.split("T")[0],
        item.status,
        '<a href="#"  rel="noopener noreferrer"><img src="./img/file.png" alt="" style="height:30px"></a>',
      ];
      dataTable.row.add(rowDataArr);
    });

    dataTable.draw();
    const viewButtons = document.querySelectorAll("td a");
    viewButtons.forEach((item) => {
      item.addEventListener("click", viewDetailButtonEvent);
    });
  });
});

const viewSelfReportButton = document.querySelector("#view-self-report");
viewSelfReportButton.addEventListener("click", async (e) => {
  e.preventDefault();
  const selfReportedData = JSON.parse(localStorage.getItem("reportedData"));
  console.log(JSON.stringify(selfReportedData));
  const respond = await fetch(
    "http://localhost:3000/citizen/post-self-report",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reportIds: selfReportedData }),
    }
  );
  const dataJSON = await respond.json();
  const reportData = JSON.parse(dataJSON);
  $(document).ready(function () {
    var dataTable = $("#myTable").DataTable();

    dataTable.clear().draw();

    reportData.forEach(function (item) {
      const rowDataArr = [
        item.id,
        item.name,
        item.ReportType.type,
        item.createdAt.split("T")[0],
        item.status,
        '<a href="#"  rel="noopener noreferrer"><img src="./img/file.png" alt="" style="height:30px"></a>',
      ];
      console.log(rowDataArr);
      dataTable.row.add(rowDataArr);
    });

    dataTable.draw();
    const viewButtons = document.querySelectorAll("td a");
    viewButtons.forEach((item) => {
      item.addEventListener("click", viewDetailButtonEvent);
    });
  });
});

const mapTab = document.querySelector("#map-tab");
mapTab.addEventListener("click", (e) => {
  e.preventDefault();
  map.resize();
});

const reportTab = document.querySelector("#report-tab");
reportTab.addEventListener("click", (e) => {
  e.preventDefault();
  const createReport = document.querySelector("#create-report");
  createReport.style.display = "none";
});
