function renderRoomSelector() {
  var container = document.getElementById('roomSelection');
  var checkin = document.getElementById('f-checkin').value;
  var checkout = document.getElementById('f-checkout').value;

  container.innerHTML = ALL_ROOMS.map(function(room){
    var booked = false;

    if (checkin && checkout) {
      booked = _bookings.some(function(b){
        if (_editId && b.id === _editId) {
          return false;
        }

        var rooms = b.rooms || (b.room ? [b.room] : []);

        return rooms.includes(room) &&
               (checkin < b.checkout) &&
               (checkout > b.checkin);
      });
    }

    return `
<label style="
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:8px 0;
  border-bottom:1px solid #eee;
">

  <span>
    <input
      type="checkbox"
      class="roomCheck"
      value="${room}"
      ${booked ? 'disabled' : ''}>
    Room ${room}
  </span>

  <span style="
    color:${booked ? '#8B1A1A' : '#2D6A4F'};
    font-weight:600;
    font-size:12px;
  ">
    ${booked ? '🔴 Booked' : '🟢 Available'}
  </span>

</label>
`;
  }).join('');
}

function renderRooms() {
  renderFloor('floor1Grid', FLOOR1);
  renderFloor('floor2Grid', FLOOR2);
  renderFloor('floor3Grid', FLOOR3);
}

function renderFloor(gridId, rooms) {
  var grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = rooms.map(function(r){
    var info = _rooms[r] || { status:'available', type:'AC' };
    var lbl = info.status==='available' ? 'Free' : info.status==='occupied' ? 'Occupied' : 'Cleaning';
    return '<div class="room-tile '+info.status+'" onclick="openRoomModal(\''+r+'\')">'+
      '<span class="room-num">'+r+'</span>'+ 
      '<div class="room-type-tag">'+info.type+'</div>'+ 
      '<div class="room-status-lbl">'+lbl+'</div>'+ 
      '</div>';
  }).join('');
}

function openRoomModal(r) {
  _currentRoom = r;
  _selectedStatus = (_rooms[r] && _rooms[r].status) || 'available';
  document.getElementById('roomModalTitle').textContent = 'Room '+r+' — '+((_rooms[r]&&_rooms[r].type)||'AC');
  document.querySelectorAll('.status-opt').forEach(function(el){
    el.classList.toggle('selected', el.classList.contains(_selectedStatus));
  });
  document.getElementById('roomModal').classList.add('open');
}

function selectStatus(s) {
  _selectedStatus = s;
  document.querySelectorAll('.status-opt').forEach(function(el){
    el.classList.toggle('selected', el.classList.contains(s));
  });
}

function saveRoomStatus() {
  if (!_currentRoom || !_selectedStatus) return;
  if (_selectedStatus === 'available') {
    var activeBooking = _bookings.some(function(b){
      var t = todayStr();
      return b.room===_currentRoom && t >= b.checkin && t < b.checkout;
    });
    if (activeBooking) {
      alert('Cannot mark room available. Guest is currently checked in.');
      return;
    }
  }
  firebase.firestore().collection('rooms').doc(_currentRoom).update({ status: _selectedStatus })
    .then(function(){ toast('Room status updated!'); closeModal('roomModal'); });
}
