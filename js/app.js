var _rooms = {};
var _bookings = [];
var _editId = null;
var _currentRoom = null;
var _selectedStatus = null;
var _payFilter = 'all';
var FLOOR1 = ['101','102','103','104'];
var FLOOR2 = ['201','202','203'];
var FLOOR3 = ['301'];
var ALL_ROOMS = ['101','102','103','104','201','202','203','301'];

function showView(name) {
  document.querySelectorAll('.view').forEach(function(v){ v.classList.remove('active'); });
  document.getElementById('view-'+name).classList.add('active');
  ['dashboard','bookings','collections'].forEach(function(n){
    document.getElementById('btn-'+n).classList.toggle('active', n===name);
  });
  if (name==='bookings') renderBookingsTable();
  if (name==='collections') renderCollections();
}

function closeModal(id){ document.getElementById(id).classList.remove('open'); }

function setFilter(el, f) {
  _payFilter = f;
  document.querySelectorAll('.filter-pills .pill').forEach(function(p){
    p.classList.toggle('active', p.dataset.f===f);
  });
  renderBookingsTable();
}

function initApp() {
  document.getElementById('btn-dashboard').classList.add('active');
  var el = document.getElementById('bookingDateFilter');
  if (el) el.value = todayStr();

  initRooms();
  setupListeners();
}

function initRooms() {
  ALL_ROOMS.forEach(function(r){
    _db.collection('rooms').doc(r).get().then(function(snap){
      if (!snap.exists) _db.collection('rooms').doc(r).set({ status:'available', type:'AC' });
    });
  });
}

function setupListeners() {
  _db.collection('rooms').onSnapshot(function(snap){
    snap.forEach(function(d){ _rooms[d.id] = d.data(); });
    renderRooms();
    renderMetrics();
  });

  _db.collection('bookings').onSnapshot(function(snap){
    _bookings = [];
    snap.forEach(function(d){ _bookings.push(Object.assign({ id:d.id }, d.data())); });
    _bookings.sort(function(a,b){ return (b.checkin||'').localeCompare(a.checkin||''); });
    renderTodayTable();
    renderBookingsTable();
    renderCollections();
    document.getElementById('todayLoading').style.display = 'none';
    document.getElementById('todayTableWrap').style.display = 'block';
    document.getElementById('bookingsLoading').style.display = 'none';
    document.getElementById('bookingsTableWrap').style.display = 'block';
  });
}

window.addEventListener('load', initApp);
