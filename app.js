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

ClassicEditor.defaultConfig = {
  toolbar: {
    items: [
      "undo",
      "redo",
      "|",
      "heading",
      "|",
      "bold",
      "italic",
      "|",
      "bulletedList",
      "numberedList",
      "blockQuote",
      "|",
      "insertTable",
    ],
  },
  image: {
    toolbar: [
      "imageStyle:full",
      "imageStyle:side",
      "|",
      "imageTextAlternative",
    ],
  },
  table: {
    contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
  },
  language: "en",
};

let editor;
ClassicEditor.create(document.querySelector("#editor"))
  .then((neweditor) => {
    editor = neweditor;
  })
  .catch((error) => {
    console.error(error);
  });

const checkValidateForm = (e, first, sec) => {
  e.preventDefault();
  var thisModal = bootstrap.Modal.getOrCreateInstance(
    document.getElementById(first)
  );
  thisModal.hide();
  var nextModal = bootstrap.Modal.getOrCreateInstance(
    document.getElementById(sec)
  );
  nextModal.show();
};

document.querySelector('#first-form').addEventListener('submit',(e)=>{
  checkValidateForm(e,'reportModal-reporterInfo','reportModal-details')
})
document.querySelector('#second-form').addEventListener('submit',(e)=>{
  checkValidateForm(e,'reportModal-details','reportModal-captcha')
})
