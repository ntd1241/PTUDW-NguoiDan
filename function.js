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

const mouseEnterEventUncluster = (e, layer) => {
  let popup;
  if (layer == "sipulated") {
    popup = sipulatedPopup;
  } else if (layer == "non-sipulated") {
    popup = nonSipulatedPopup;
  }
  map.getCanvas().style.cursor = "pointer";
  const coordinates = e.features[0].geometry.coordinates.slice();
  const { id, address, adsType, area, locationType, status } =
    e.features[0].properties;

  while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
  }

  const popupDesc = `<b>${adsType}</b><p>${locationType}</p><p>${address}</p><h5>${status}</h5>`;
  popup.setLngLat(coordinates).setHTML(popupDesc).addTo(map);
};

const mouseLeaveEvent = () => {
  map.getCanvas().style.cursor = "";
  sipulatedPopup.remove();
};

const getInfoOnclick = async (e) => {
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
};
