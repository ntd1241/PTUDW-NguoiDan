let table = new DataTable('#myTable', {
    scrollResize: true,
    scrollCollapse: true,
    paging: false,
});

table.on('click', 'tbody tr', (e) => {
    let classList = e.currentTarget.classList;
 
    if (classList.contains('selected')) {
        classList.remove('selected');
    }
    else {
        table.rows('.selected').nodes().each((row) => row.classList.remove('selected'));
        classList.add('selected');
    }
});
 
/*document.querySelector('#button').addEventListener('click', function () {
    table.row('.selected').remove().draw(false);
});*/

const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl))

mapboxgl.accessToken = 'pk.eyJ1IjoiYm9vbnJlYWwiLCJhIjoiY2xvOWZ0eXQ2MDljNzJybXRvaW1oaXR3NyJ9.iu4mRTZ3mUFb7ggRtyPcWw';

const nav = new mapboxgl.NavigationControl();
map.addControl(nav, 'top-right');

function onSubmit(token) {
    document.getElementById("report-form").submit();
  }