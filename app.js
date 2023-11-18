let table = new DataTable("#myTable", {
  scrollResize: true,
  scrollCollapse: true,
  paging: true,
});

// table.on('click', 'tbody tr', (e) => {
//     let classList = e.currentTarget.classList;

//     if (classList.contains('selected')) {
//         classList.remove('selected');
//     }
//     else {
//         table.rows('.selected').nodes().each((row) => row.classList.remove('selected'));
//         classList.add('selected');
//     }
// });

document.querySelectorAll(".toBCVP").forEach((item) => {
  item.addEventListener("click", () => {
    var triggerEl = document.querySelector("#myTab #report-tab");
    bootstrap.Tab.getOrCreateInstance(triggerEl).show();

    //Cap nhat du lieu
  });
});

/*document.querySelector('#button').addEventListener('click', function () {
    table.row('.selected').remove().draw(false);
});*/

const popoverTriggerList = document.querySelectorAll(
  '[data-bs-toggle="popover"]'
);
const popoverList = [...popoverTriggerList].map(
  (popoverTriggerEl) => new bootstrap.Popover(popoverTriggerEl)
);

function onSubmit(token) {
  document.getElementById("report-form").submit();
}
