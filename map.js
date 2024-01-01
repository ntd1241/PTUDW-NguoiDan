//Variable definition
const sipulatedColor = "#40eb34";
const nonSipulatedColor = "#d3eb34";
const reportedColor = "#eb3434";
const selfReportedColor = "#848991";
const unclusteredRadius = 12;
let adsData;
let prevReportTableState = 0;
let selectedLocation = undefined;
let selectedBoard = undefined;
let isClickPoint = 0;
const sipulatedPopup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false,
});
const nonSipulatedPopup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false,
});
const reportedPopup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false,
});
const selfReportedPopup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false,
});
const previousSelected = {
  type: undefined,
  id: undefined,
};
const serverPath = "http://localhost:5000";

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
const geolocate = new mapboxgl.GeolocateControl({
  fitBoundsOptions: {
    zoom: 17,
  },
  showAccuracyCircle: false,
  positionOptions: {
    enableHighAccuracy: true,
  },
  // When active the map will receive updates to the device's location as it changes.
  trackUserLocation: true,
  // Draw an arrow next to the location dot to indicate which direction the device is heading.
  showUserHeading: true,
});
map.addControl(geolocate);

const inspectCluster = (e, layer) => {
  const features = map.queryRenderedFeatures(e.point, {
    layers: [`${layer}-cluster`],
  });
  const clusterId = features[0].properties.cluster_id;
  map.getSource(layer).getClusterExpansionZoom(clusterId, (err, zoom) => {
    if (err) return;

    map.easeTo({
      center: features[0].geometry.coordinates,
      zoom: zoom,
    });
  });
};

const mouseEnterEventUnclustered = (e, layer) => {
  let popup;
  if (layer == "sipulated") {
    popup = sipulatedPopup;
  } else if (layer == "nonSipulated") {
    popup = nonSipulatedPopup;
  } else if (layer == "reported") {
    popup = reportedPopup;
  } else if (layer == "selfReported") {
    popup = selfReportedPopup;
  }

  map.getCanvas().style.cursor = "pointer";
  const coordinates = e.features[0].geometry.coordinates.slice();
  const { id, address, adsType, area, locationType, status } =
    e.features[0].properties;
  const areaObj = JSON.parse(area);
  while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
  }

  const popupDesc = `<b>${adsType}</b><p>${locationType}</p><p>${address}, ${areaObj.ward}, ${areaObj.district}</p><h5>${status}</h5>`;
  popup.setLngLat(coordinates).setHTML(popupDesc).addTo(map);
};

const mouseLeaveEventUnclustered = (layer) => {
  let popup;
  if (layer == "sipulated") {
    popup = sipulatedPopup;
  } else if (layer == "nonSipulated") {
    popup = nonSipulatedPopup;
  } else if (layer == "reported") {
    popup = reportedPopup;
  } else if (layer == "selfReported") {
    popup = selfReportedPopup;
  }

  map.getCanvas().style.cursor = "";
  popup.remove();
};

const getInfoOnclickUnclustered = async (e) => {
  //Display report button
  document.querySelector("#location-report").style.display = "inline-block";
  document.querySelector("#board-report").style.display = "inline-block";
  isClickPoint = 1;

  //Get the data and change UI
  selectedLocation = { ...e.features[0], lngLat: e.lngLat };
  const target = e.features[0];
  const areaObjTarget = JSON.parse(target.properties.area);
  const fetchedData = await fetch(
    `${serverPath}/citizen/get-ads/${e.features[0].properties.id}`
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
    HTMLaddr.innerHTML = `${target.properties.address}, ${areaObjTarget.ward}, ${areaObjTarget.district}`;
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
        : adsData[0].status == "Bị báo cáo"
        ? "bg-danger"
        : "bg-dark"
    }" id="board-status">${
      adsData[0].status != "" ? adsData[0].status : "Chưa có quảng cáo"
    }</span></a>`;
    HTMLaddr.innerHTML = `${adsData[0].AdsPlacement.address}, ${adsData[0].AdsPlacement.Area.ward}, ${adsData[0].AdsPlacement.Area.district}`;
    HTMLsize.innerHTML = adsData[0].size;
    HTMLqty.innerHTML = adsData[0].quantity;
    HTMLform.innerHTML = adsData[0].AdsPlacement.AdsType.type;
    HTMLclassification.innerHTML =
      adsData[0].AdsPlacement.LocationType.locationType;
    // HTMLthumbnail.src = adsData[0].image;
    HTMLthumbnail.src = `${serverPath}/images/permitRequests/${adsData[0].image}`;
    HTMLboardContract.setAttribute(
      "data-bs-content",
      `Ngày hết hạn: ${
        adsData[0].end != ""
          ? adsData[0].end.split("T")[0]
          : "Chưa có thông tin"
      }`
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
  if (adsData.length <= 1) {
    paginationData += `<li class="page-item disabled">
      <a class="page-link" href="#" aria-label="Next">
        <span aria-hidden="true">&raquo;</span></a></li>`;
  } else {
    paginationData += `<li class="page-item "><a class="page-link" href="#" aria-label="Next">
      <span aria-hidden="true">&raquo;</span></a></li>`;
  }
  HTMLpagination.innerHTML = paginationData;
  //Pagination feature
  const pagePrev = document.querySelector('.page-link[aria-label="Previous"]');
  const pageNext = document.querySelector('.page-link[aria-label="Next"]');
  const pageItems = document.querySelectorAll(
    '.page-item[aria-current="page"]'
  );
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
          : adsData[page - 1].status == "Bị báo cáo"
          ? "bg-danger"
          : "bg-dark"
      }" id="board-status">${
        adsData[page - 1].status != ""
          ? adsData[page - 1].status
          : "Chưa có quảng cáo"
      }</span></a>`;
      HTMLaddr.innerHTML = `${adsData[page-1].AdsPlacement.address}, ${adsData[page-1].AdsPlacement.Area.ward}, ${adsData[page-1].AdsPlacement.Area.district}`;
      HTMLsize.innerHTML = adsData[page - 1].size;
      HTMLqty.innerHTML = adsData[page - 1].quantity;
      HTMLform.innerHTML = adsData[page - 1].AdsPlacement.AdsType.type;
      HTMLclassification.innerHTML =
        adsData[page - 1].AdsPlacement.LocationType.locationType;
      // HTMLthumbnail.src = adsData[page - 1].image;
      HTMLthumbnail.src = `${serverPath}/images/permitRequests/${
        adsData[page - 1].image
      }`;

      HTMLboardContract.setAttribute(
        "data-bs-content",
        `Ngày hết hạn: ${
          adsData[page - 1].end != ""
            ? adsData[page - 1].end.split("T")[0]
            : "Chưa có thông tin"
        }`
      );
      const popover = new bootstrap.Popover(HTMLboardContract);
      popover.update();
      //Set active
      e.target.parentNode.classList.add("active");
      //Set enable/disable for prev/next button
      pagePrev.parentNode.classList.remove("disabled");
      pageNext.parentNode.classList.remove("disabled");
      if (page == 1) {
        pagePrev.parentNode.classList.add("disabled");
      } else if (page == adsData.length) {
        pageNext.parentNode.classList.add("disabled");
      }
    });
  });
  pagePrev.addEventListener("click", (e) => {
    if (pagePrev.parentNode.classList.contains("disabled")) {
      return;
    }
    const activeItem = document.querySelector(".page-item.active");
    activeItem.classList.remove("active");

    const page = parseInt(activeItem.firstChild.innerText) - 1;

    HTMLid.innerHTML = adsData[page - 1].id;
    HTMLtitle.innerHTML = `${
      adsData[page - 1].BoardType.type
    }<span class="ms-2 badge ${
      adsData[page - 1].status == "Đã cấp phép"
        ? "bg-success"
        : adsData[page - 1].status == "Chưa cấp phép"
        ? "bg-warning"
        : adsData[page - 1].status == "Bị báo cáo"
        ? "bg-danger"
        : "bg-dark"
    }" id="board-status">${
      adsData[page - 1].status != ""
        ? adsData[page - 1].status
        : "Chưa có quảng cáo"
    }</span></a>`;
    HTMLaddr.innerHTML = `${adsData[page-1].AdsPlacement.address}, ${adsData[page-1].AdsPlacement.Area.ward}, ${adsData[page-1].AdsPlacement.Area.district}`;
    HTMLsize.innerHTML = adsData[page - 1].size;
    HTMLqty.innerHTML = adsData[page - 1].quantity;
    HTMLform.innerHTML = adsData[page - 1].AdsPlacement.AdsType.type;
    HTMLclassification.innerHTML =
      adsData[page - 1].AdsPlacement.LocationType.locationType;
    // HTMLthumbnail.src = adsData[page - 1].image;
    HTMLthumbnail.src = `${serverPath}/images/permitRequests/${
      adsData[page - 1].image
    }`;

    HTMLboardContract.setAttribute(
      "data-bs-content",
      `Ngày hết hạn: ${
        adsData[page - 1].end != ""
          ? adsData[page - 1].end.split("T")[0]
          : "Chưa có thông tin"
      }`
    );
    const popover = new bootstrap.Popover(HTMLboardContract);
    popover.update();
    //Set active
    activeItem.previousSibling.classList.add("active");
    //Deactive prev button if reach the first page
    pageNext.parentNode.classList.remove("disabled");
    pagePrev.parentNode.classList.remove("disabled");
    if (page == 1) {
      pagePrev.parentNode.classList.add("disabled");
    }
  });
  pageNext.addEventListener("click", (e) => {
    if (pageNext.parentNode.classList.contains("disabled")) {
      return;
    }
    const activeItem = document.querySelector(".page-item.active");
    activeItem.classList.remove("active");

    const page = parseInt(activeItem.firstChild.innerText) + 1;
    HTMLid.innerHTML = adsData[page - 1].id;

    HTMLtitle.innerHTML = `${
      adsData[page - 1].BoardType.type
    }<span class="ms-2 badge ${
      adsData[page - 1].status == "Đã cấp phép"
        ? "bg-success"
        : adsData[page - 1].status == "Chưa cấp phép"
        ? "bg-warning"
        : adsData[page - 1].status == "Bị báo cáo"
        ? "bg-danger"
        : "bg-dark"
    }" id="board-status">${
      adsData[page - 1].status != ""
        ? adsData[page - 1].status
        : "Chưa có quảng cáo"
    }</span></a>`;
    HTMLaddr.innerHTML = `${adsData[page-1].AdsPlacement.address}, ${adsData[page-1].AdsPlacement.Area.ward}, ${adsData[page-1].AdsPlacement.Area.district}`;
    HTMLsize.innerHTML = adsData[page - 1].size;
    HTMLqty.innerHTML = adsData[page - 1].quantity;
    HTMLform.innerHTML = adsData[page - 1].AdsPlacement.AdsType.type;
    HTMLclassification.innerHTML =
      adsData[page - 1].AdsPlacement.LocationType.locationType;
    // HTMLthumbnail.src = adsData[page - 1].image;
    HTMLthumbnail.src = `${serverPath}/images/permitRequests/${
      adsData[page - 1].image
    }`;
    HTMLboardContract.setAttribute(
      "data-bs-content",
      `Ngày hết hạn: ${
        adsData[page - 1].end != ""
          ? adsData[page - 1].end.split("T")[0]
          : "Chưa có thông tin"
      }`
    );
    const popover = new bootstrap.Popover(HTMLboardContract);
    popover.update();
    //Set active
    activeItem.nextSibling.classList.add("active");
    //Deactive next button if reach the last page
    pageNext.parentNode.classList.remove("disabled");

    pagePrev.parentNode.classList.remove("disabled");

    if (page == adsData.length) {
      pageNext.parentNode.classList.add("disabled");
    }
  });
};

const toggleEvent = (e, targetLayer) => {
  const layers = [
    `${targetLayer}-cluster`,
    `${targetLayer}-count`,
    `${targetLayer}-unclustered`,
    `${targetLayer}-label`,
  ];

  if (e.target.checked) {
    layers.forEach((layer) => {
      map.setLayoutProperty(layer, "visibility", "visible");
    });
  } else {
    layers.forEach((layer) => {
      map.setLayoutProperty(layer, "visibility", "none");
    });
  }
};

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
    const geometry = data.results[0].geometry;
    map.flyTo({ center: geometry });
  } catch (err) {
    console.log(err);
  }
};

const getReportTable = async (e, flag, resetReportInfo = undefined) => {
  const createReport = document.querySelector("#create-report");
  const exitSelfReport = document.querySelector("#exit-self-report");
  createReport.style.display = "inline-block";
  exitSelfReport.style.display = "none";
  let type = "";
  let respond;
  if (flag == 0) {
    type = "location";
    prevReportTableState = flag;
    let locationId;
    if (selectedLocation) {
      locationId = selectedLocation.properties.id;
    }
    selectedBoard = undefined;
    respond = await fetch(
      `${serverPath}/citizen/get-report-data?placement=${locationId}&board=undefined`
    );
  } else if (flag == 1) {
    type = "board";
    prevReportTableState = flag;
    let page =
      document.querySelector(".page-item.active") != null
        ? document.querySelector(".page-item.active").innerText
        : undefined;

    if (page == undefined) {
      return;
    }
    selectedBoard = adsData[page - 1];
    const board = adsData[page - 1];
    respond = await fetch(
      `${serverPath}/citizen/get-report-data?board=${board.id}&placement=undefined`
    );
  } else if (flag == 2) {
    createReport.style.display = "none";
    exitSelfReport.style.display = "inline-block";
    let selfReportedData = localStorage.getItem("reportedData");
    if (selfReportedData != null) {
      selfReportedData = JSON.parse(selfReportedData);
      respond = await fetch(`${serverPath}/citizen/post-self-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reportIds: selfReportedData }),
      });
    } else {
      alert("No reports to be reported");
    }
  }

  let data;
  if (
    flag == 3 ||
    (flag == 2 && localStorage.getItem("reportedData") == null)
  ) {
    data = JSON.stringify([]);
  } else {
    data = await respond.json();
  }

  const reportData = JSON.parse(data);

  const handled = reportData.filter((item) => {
    return item.status == "Đã xử lý";
  });

  //Change location info
  const HTMLlocationId = document.querySelector("#target-id");
  const HTMLlocationType = document.querySelector("#target-type");
  const HTMLlocationNoReports = document.querySelector("#target-no-reports");
  const HTMLlocationAddress = document.querySelector("#target-address");

  if (flag == 0 || flag == 1) {
    HTMLlocationId.innerText = selectedLocation.properties.id;
    HTMLlocationType.innerText = flag == 0 ? "Địa điểm" : "Bảng quảng cáo ";
    HTMLlocationNoReports.innerText = `${handled.length}/${reportData.length}`;
    HTMLlocationAddress.innerText = selectedLocation.properties.address;
  } else if (flag == 2) {
    HTMLlocationId.innerText = "Đang hiển thị lịch sử báo cáo";
    HTMLlocationType.innerText = "Đang hiển thị lịch sử báo cáo";
    HTMLlocationNoReports.innerText = `${handled.length}/${reportData.length}`;
    HTMLlocationAddress.innerText = "Đang hiển thị lịch sử báo cáo";
  } else if (flag == 3) {
    HTMLlocationId.innerText = "Chưa chọn điểm";
    HTMLlocationType.innerHTML = "Chưa chọn điểm";
    HTMLlocationNoReports.innerText = "Chưa chọn điểm";
    HTMLlocationAddress.innerHTML = "Chưa chọn điểm";
  }
  //Check if the user change the selected target
  if (previousSelected.type != type) {
    resetReportInfo = true;
  } else if (
    previousSelected.type == "board" &&
    previousSelected.id != selectedBoard
  ) {
    resetReportInfo = true;
  } else if (
    previousSelected.type == "location" &&
    previousSelected.id != selectedLocation
  ) {
    resetReportInfo = true;
  }

  //Change report info
  if (resetReportInfo) {
    document.querySelector("#report-id").innerText = "Chưa có thông tin";
    document.querySelector("#report-datetime").innerText = "Chưa có thông tin";
    document.querySelector("#report-content").innerText = "Chưa có thông tin";
    document.querySelector("#report-img-1").src = "";
    document.querySelector("#report-img-2").src = "";
    document.querySelector("#reporter-name").innerText = "Chưa có thông tin";
    document.querySelector("#reporter-email").innerText = "Chưa có thông tin";
    document.querySelector(
      "#report-type"
    ).innerHTML = `Chưa có thông tin <span class="ms-2 badge bg-secondary" id="report-status">Chưa có thông tin</span>`;
  }

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
      const newRow = $("<tr>").attr("data-report", JSON.stringify(item));
      rowDataArr.forEach(function (data) {
        newRow.append("<td>" + data + "</td>");
      });
      dataTable.row.add(newRow);
    });

    dataTable.draw();

    //Re create click event
    const viewButtons = document.querySelectorAll("td a");
    if (viewButtons) {
      viewButtons.forEach((item) => {
        item.addEventListener("click", viewDetailButtonEvent);
      });
    }
  });
  //Assign to previous select targer
  previousSelected.type = type;
  if (flag == 0) {
    previousSelected.id = selectedLocation;
  } else if (flag == 1) {
    previousSelected.id = selectedBoard;
  }
};

const fetchDataFromServer=async()=>{
  const fetchedsipulatedData = await fetch(
    `${serverPath}/citizen/get-sipulated`
  );
  const fetchedNonSipulatedData = await fetch(
    `${serverPath}/citizen/get-nonsipulated`
  );
  const fetchedReportData = await fetch(`${serverPath}/citizen/get-report`);
  const sipulated = await fetchedsipulatedData.json();
  const nonSipulated = await fetchedNonSipulatedData.json();
  const reported = await fetchedReportData.json();
  return {sipulated,nonSipulated,reported}
}
//Layer generation
map.on("load", async () => {
  geolocate.trigger();
  //Fetched section
  const {sipulated,nonSipulated,reported}=await fetchDataFromServer()
  const selfReported = JSON.parse(localStorage.getItem("reportedLocation"));

  // Sipulated source data
  map.addSource("sipulated", {
    type: "geojson",
    data: JSON.parse(sipulated),
    cluster: true,
    clusterMaxZoom: 17,
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
    inspectCluster(e, "sipulated");
  });
  //Get info when user moves their mouse over the unclustered layer

  map.on("mouseenter", "sipulated-unclustered", (e) => {
    mouseEnterEventUnclustered(e, "sipulated");
  });
  map.on("mouseleave", "sipulated-unclustered", (e) => {
    mouseLeaveEventUnclustered("sipulated");
  });
  //Get unclustered info on click
  map.on("click", "sipulated-unclustered", async (e) => {
    await getInfoOnclickUnclustered(e);
  });
  map.on("mouseenter", "sipulated-cluster", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "sipulated-cluster", () => {
    map.getCanvas().style.cursor = "";
  });

  //Non sipulated section
  map.addSource("nonSipulated", {
    type: "geojson",
    data: JSON.parse(nonSipulated),
    cluster: true,
    clusterMaxZoom: 17,
    clusterRadius: 20,
  });
  //Non sipulated cluster
  map.addLayer({
    id: "nonSipulated-cluster",
    type: "circle",
    source: "nonSipulated",
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
    source: "nonSipulated",
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
    source: "nonSipulated",
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
    source: "nonSipulated",
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
    inspectCluster(e, "nonSipulated");
  });
  //Get info when user moves their mouse over the unclustered layer

  map.on("mouseenter", "nonSipulated-unclustered", (e) => {
    mouseEnterEventUnclustered(e, "nonSipulated");
  });
  map.on("mouseleave", "nonSipulated-unclustered", () => {
    mouseLeaveEventUnclustered("nonSipulated");
  });
  //Get infor onclick
  map.on("click", "nonSipulated-unclustered", async (e) => {
    await getInfoOnclickUnclustered(e);
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
    clusterMaxZoom: 17,
    clusterRadius: 20,
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
    inspectCluster(e, "reported");
  });

  map.on("mouseenter", "reported-unclustered", (e) => {
    mouseEnterEventUnclustered(e, "reported");
  });
  map.on("mouseleave", "reported-unclustered", () => {
    mouseLeaveEventUnclustered("reported");
  });
  // Get info on click
  map.on("click", "reported-unclustered", async (e) => {
    await getInfoOnclickUnclustered(e);
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
    clusterMaxZoom: 17,
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
    inspectCluster(e, "selfReported");
  });

  map.on("mouseenter", "selfReported-unclustered", (e) => {
    mouseEnterEventUnclustered(e, "selfReported");
  });
  map.on("mouseleave", "selfReported-unclustered", () => {
    mouseLeaveEventUnclustered("selfReported");
  });
  // Get info on click
  map.on("click", "selfReported-unclustered", async (e) => {
    await getInfoOnclickUnclustered(e);
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

sipulatedToggle.addEventListener("change", (e) => toggleEvent(e, "sipulated"));
nonSipulatedToggle.addEventListener("change", (e) =>
  toggleEvent(e, "nonSipulated")
);
reportedToggle.addEventListener("change", (e) => toggleEvent(e, "reported"));
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
  sipulatedToggle.dispatchEvent(new Event("change"));
  nonSipulatedToggle.dispatchEvent(new Event("change"));
  reportedToggle.dispatchEvent(new Event("change"));
});

// Reverse geo-location
const locationInput = document.querySelector("#location-input");
const searchBtn = document.querySelector("#search-button");

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

  //Reset Report section
  if (isClickPoint == 1) {
    isClickPoint = 0;
  } else {
    document.querySelector("#location-report").style.display = "none";
    document.querySelector("#board-report").style.display = "none";
    selectedBoard = undefined;
    selectedLocation = undefined;
    getReportTable(e, 3, true);
  }
});

//Submit form handle
let formValidation = (data) => {
  if (!data.name || !data.email || !data.phone || !data.type || !data.content) {
    alert("Bạn chưa điền tất cả trường");
    return false;
  }
  const numFiles = document.querySelector("#form-report-images").files.length;
  if (numFiles > 2) {
    alert("Quá nhiều hình");
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    alert("Email không hợp lệ");
    return false;
  }
  const phoneRegex = /^((\+84|84|0)\d{9})$/;
  if (!phoneRegex.test(data.phone)) {
    alert("Số điện thoại không hợp lệ");
    return false;
  }
  const response = grecaptcha.getResponse();
  if (response.length == 0) {
    console.log('captcha failed');
    document.querySelector('#captchaError').innerHTML = "<span style='color:red'>Vui lòng thực hiện captcha</span>"
    return false;
  }
  return true;
};

const viewDetailButtonEvent = (e) => {
  e.preventDefault();

  const clickedRow = e.target.closest("tr");

  if (clickedRow) {
    const reportData = JSON.parse(clickedRow.dataset.report);
    const images =
      reportData.image != null ? reportData.image.split(", ") : undefined;

    const HTMLreportId = document.querySelector("#report-id");
    const HTMLreportType = document.querySelector("#report-type");
    const HTMLreportDatetime = document.querySelector("#report-datetime");
    const HTMLreportContent = document.querySelector("#report-content");
    const HTMLreportImg1 = document.querySelector("#report-img-1");
    const HTMlreportImg2 = document.querySelector("#report-img-2");
    const HTMLreporterName = document.querySelector("#reporter-name");
    const HTMLreporterEmail = document.querySelector("#reporter-email");

    HTMLreportId.innerHTML = reportData.id;
    HTMLreportType.innerHTML = `${reportData.ReportType.type}<span class="ms-2 badge bg-secondary" id="report-status"></span>`;
    document.querySelector("#report-status").innerText = reportData.status;
    HTMLreportDatetime.innerHTML = reportData.createdAt.split("T")[0];
    HTMLreportContent.innerHTML = reportData.reportContent;
    if (images == undefined) {
      HTMLreportImg1.src = "";
      HTMlreportImg2.src = "";
    } else if (images.length == 1) {
      HTMLreportImg1.src = `${serverPath}/` + images[0];
      HTMlreportImg2.src = "";
    } else {
      HTMLreportImg1.src = `${serverPath}/` + images[0];
      HTMlreportImg2.src = `${serverPath}/` + images[1];
    }
    HTMLreporterName.innerHTML = reportData.name;
    HTMLreporterEmail.innerHTML = reportData.email;
  }
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
  const content = editor.getData();

  //Validate
  if (!formValidation({ name, email, phone, type, content })) {
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

  const respond = await fetch(`${serverPath}/citizen/post-report`, {
    method: "POST",
    body: formData,
  });
  const respondJSON = await respond.json();

  const newReport = respondJSON.newReport;
  const id = newReport.id;

  // Save to local storage
  selfReportedData.push(id);
  localStorage.setItem("reportedData", JSON.stringify(selfReportedData));
  //Add new report to table
  let formattedType = "";
  if (type == "TGSP") {
    formattedType = "Tố giác sai phạm";
  } else if (type == "DKND") {
    formattedType = "Đăng ký nội dung";
  } else if (type == "DGYK") {
    formattedType = "Đóng góp ý kiến";
  } else if (type == "GDTM") {
    formattedType = "Giải đáp thắc mắc";
  }
  newReport.ReportType = { type: formattedType };

  $(document).ready(function () {
    let dataTable = $("#myTable").DataTable();

    const rowDataArr = [
      newReport.id,
      newReport.name,
      formattedType,
      newReport.createdAt.split("T")[0],
      newReport.status,
      '<a href="#" class="view-detail" rel="noopener noreferrer"><img src="./img/file.png" alt="" style="height:30px"></a>',
    ];
    const newRow = $("<tr>").attr("data-report", JSON.stringify(newReport));
    rowDataArr.forEach((data) => {
      newRow.append("<td>" + data + "</td>");
    });
    dataTable.row.add(newRow);
    dataTable.draw();
    const viewButtons = document.querySelectorAll("td a");
    viewButtons.forEach((item) => {
      item.addEventListener("click", viewDetailButtonEvent);
    });
  });
  //Re fetch data
  const {sipulated,nonSipulated,reported}=await fetchDataFromServer()
  map.getSource('sipulated').setData(JSON.parse(sipulated))
  map.getSource('nonSipulated').setData(JSON.parse(nonSipulated))
  map.getSource('reported').setData(JSON.parse(reported))
  
});

//Get table when click placement report
const reportLocationButton = document.querySelector("#location-report");
reportLocationButton.addEventListener("click", async (e) => {
  getReportTable(e, 0);
});

//Get table when click board report
const reportBoardButton = document.querySelector("#board-report");
reportBoardButton.addEventListener("click", async (e) => {
  getReportTable(e, 1);
});

//Get table when click self report
const viewSelfReportButton = document.querySelector("#view-self-report");
viewSelfReportButton.addEventListener("click", async (e) => {
  getReportTable(e, 2);
});

//Exit self report
const exitSelfReport = document.querySelector("#exit-self-report");
exitSelfReport.addEventListener("click", (e) => {
  getReportTable(e, prevReportTableState);
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

  if (selectedBoard != undefined) {
    getReportTable(e, 1);
  } else if (selectedLocation != undefined) {
    getReportTable(e, 0);
  } else {
    getReportTable(e, 3);
  }
});
