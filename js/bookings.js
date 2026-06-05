function renderTodayTable() {
  var t = document.getElementById('bookingDateFilter') && document.getElementById('bookingDateFilter').value || todayStr();
  var list = _bookings.filter(function(b){ return t >= b.checkin && t < b.checkout; });
  var tbody = document.getElementById('todayBody');
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty">No bookings today. Tap "+ Add Booking".</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(function(b){
    return '<tr>'+ 
      '<td><strong>'+b.name+'</strong></td>'+ 
      '<td class="mono">'+b.phone+'</td>'+ 
      '<td class="mono"><strong>'+ 
((b.rooms || [b.room]).join(', '))+ 
'</strong></td>'+ 
      '<td><span class="badge '+(b.type==='AC'?'ac':'nonac')+'">'+b.type+'</span></td>'+ 
      '<td class="mono">'+fmtDate(b.checkout)+'</td>'+ 
      '<td class="mono">₹'+numFmt(b.amount)+'</td>'+ 
      '<td><span class="badge '+b.status+'">'+cap(b.status)+'</span></td>'+ 
      '<td><div class="action-btns">'+ 
        (b.status!=='paid'?'<button class="btn-sm" onclick="markPaid(\''+b.id+'\')">✓ Paid</button>':'')+ 
        '<button class="btn-sm" onclick="downloadReceipt(\''+b.id+'\')">🧾</button>'+ 
        '<button class="btn-sm" onclick="editBooking(\''+b.id+'\')">Edit</button>'+ 
        '<button class="btn-danger-sm" onclick="delBooking(\''+b.id+'\')">Del</button>'+ 
      '</div></td>'+ 
    '</tr>';
  }).join('');
}

function renderBookingsTable() {
  var search = (document.getElementById('searchInput') ? document.getElementById('searchInput').value : '').toLowerCase();
  var list = _bookings.filter(function(b){
    var ms = !search || b.name.toLowerCase().indexOf(search)>=0 || b.room.indexOf(search)>=0;
    var mf = _payFilter==='all' || b.status===_payFilter;
    return ms && mf;
  });
  var tbody = document.getElementById('allBody');
  if (!list.length) { tbody.innerHTML='<tr><td colspan="11" class="empty">No bookings found.</td></tr>'; return; }
  tbody.innerHTML = list.map(function(b){
    var n = nights(b.checkin, b.checkout);
    return '<tr>'+ 
      '<td><strong>'+b.name+'</strong></td>'+ 
      '<td class="mono">'+b.phone+'</td>'+ 
      '<td class="mono"><strong>'+ 
((b.rooms || [b.room]).join(', '))+ 
'</strong></td>'+ 
      '<td><span class="badge '+(b.type==='AC'?'ac':'nonac')+'">'+b.type+'</span></td>'+ 
      '<td class="mono">'+fmtDate(b.checkin)+'</td>'+ 
      '<td class="mono">'+fmtDate(b.checkout)+'</td>'+ 
      '<td class="mono">'+n+'N</td>'+ 
      '<td class="mono">₹'+numFmt(b.amount)+'</td>'+ 
      '<td><span class="badge '+b.status+'">'+cap(b.status)+'</span></td>'+ 
      '<td>'+b.mode+'</td>'+ 
      '<td><div class="action-btns">'+ 
        (b.status!=='paid'?'<button class="btn-sm" onclick="markPaid(\''+b.id+'\')">✓ Paid</button>':'')+ 
        '<button class="btn-sm" onclick="downloadReceipt(\''+b.id+'\')">🧾</button>'+ 
        '<button class="btn-sm" onclick="editBooking(\''+b.id+'\')">Edit</button>'+ 
        '<button class="btn-danger-sm" onclick="delBooking(\''+b.id+'\')">Del</button>'+ 
      '</div></td>'+ 
    '</tr>';
  }).join('');
}

function renderCollections() {
  var total=0,pending=0,unpaid=0,cash=0,upi=0,card=0;
  _bookings.forEach(function(b){
    var a = Number(b.amount)||0;
    if (b.status==='paid'){ total+=a; if(b.mode==='Cash') cash+=a; else if(b.mode==='UPI') upi+=a; else card+=a; }
    else if (b.status==='pending') pending+=a;
    else unpaid+=a;
  });
  document.getElementById('c-total').textContent   = '₹'+total.toLocaleString('en-IN');
  document.getElementById('c-pending').textContent = '₹'+pending.toLocaleString('en-IN');
  document.getElementById('c-unpaid').textContent  = '₹'+unpaid.toLocaleString('en-IN');
  document.getElementById('c-cash').textContent    = '₹'+cash.toLocaleString('en-IN');
  document.getElementById('c-upi').textContent     = '₹'+upi.toLocaleString('en-IN');
  document.getElementById('c-card').textContent    = '₹'+card.toLocaleString('en-IN');

  var tbody = document.getElementById('collBody');
  if (!_bookings.length) { tbody.innerHTML='<tr><td colspan="7" class="empty">No bookings yet.</td></tr>'; return; }
  tbody.innerHTML = _bookings.map(function(b){
    return '<tr>'+ 
      '<td><strong>'+b.name+'</strong></td>'+ 
      '<td class="mono">'+ 
((b.rooms || [b.room]).join(', '))+ 
'</td>'+ 
      '<td class="mono">'+fmtDate(b.checkin)+'</td>'+ 
      '<td class="mono">₹'+numFmt(b.amount)+'</td>'+ 
      '<td>'+b.mode+'</td>'+ 
      '<td><span class="badge '+b.status+'">'+cap(b.status)+'</span></td>'+ 
      '<td><div class="action-btns">'+ 
        (b.status!=='paid'?'<button class="btn-sm" onclick="markPaid(\''+b.id+'\');renderCollections()">✓ Paid</button>':'')+ 
        '<button class="btn-sm" onclick="downloadReceipt(\''+b.id+'\')">🧾 Receipt</button>'+ 
      '</div></td>'+ 
    '</tr>';
  }).join('');
}

function openAddBooking() {
  _editId = null;

  document.getElementById('modalTitle').textContent = 'New Booking';
  document.getElementById('f-name').value = '';
  document.getElementById('f-phone').value = '';
  document.getElementById('f-idProof').value = '';
  document.getElementById('f-address').value = '';

  document.getElementById('f-roomCount').value = 1;

  document.getElementById('f-type').value = 'AC';
  document.getElementById('f-checkin').value = todayStr();
  document.getElementById('f-checkout').value = '';
  document.getElementById('f-checkin').onchange = renderRoomSelector;
  document.getElementById('f-checkout').onchange = renderRoomSelector;
  document.getElementById('f-amount').value = '';
  document.getElementById('f-mode').value = 'Cash';
  document.getElementById('f-status').value = 'paid';

  renderRoomSelector();

  document.getElementById('bookingModal').classList.add('open');
}

function editBooking(id) {
  var b = _bookings.find(function(x){ return x.id === id; });
  if (!b) return;

  _editId = id;

  document.getElementById('modalTitle').textContent = 'Edit Booking';
  document.getElementById('f-name').value = b.name;
  document.getElementById('f-phone').value = b.phone;
  document.getElementById('f-idProof').value = b.idProof || '';
  document.getElementById('f-address').value = b.address || '';
  document.getElementById('f-type').value = b.type;
  document.getElementById('f-checkin').value = b.checkin;
  document.getElementById('f-checkout').value = b.checkout;
  document.getElementById('f-amount').value = b.amount;
  document.getElementById('f-mode').value = b.mode;
  document.getElementById('f-status').value = b.status;

  renderRoomSelector();

  var rooms = b.rooms || (b.room ? [b.room] : []);

  setTimeout(function(){
    document.querySelectorAll('.roomCheck').forEach(function(cb){
      if (rooms.includes(cb.value)) {
        cb.checked = true;
      }
    });
    document.getElementById('f-roomCount').value = rooms.length;
  }, 100);

  document.getElementById('bookingModal').classList.add('open');
}

function saveBooking() {
  var name     = document.getElementById('f-name').value.trim();
  var phone    = document.getElementById('f-phone').value.trim();
  var idProof  = document.getElementById('f-idProof').value.trim();
  var address  = document.getElementById('f-address').value.trim();

  var selectedRooms = Array.from(
    document.querySelectorAll('.roomCheck:checked')
  ).map(function(x){ return x.value; });

  var type     = document.getElementById('f-type').value;
  var checkin  = document.getElementById('f-checkin').value;
  var checkout = document.getElementById('f-checkout').value;
  var amount   = document.getElementById('f-amount').value;
  var mode     = document.getElementById('f-mode').value;
  var status   = document.getElementById('f-status').value;

  if (!name || !phone || !idProof || !address || !checkin || !checkout || !amount) {
    alert('Please fill all fields.');
    return;
  }

  if (selectedRooms.length === 0) {
    alert('Select at least one room.');
    return;
  }

  if (checkout <= checkin) {
    alert('Check-out must be after check-in.');
    return;
  }

  var conflict = _bookings.some(function(b){
    if (_editId && b.id === _editId) return false;
    var bookedRooms = [];
    if (b.rooms) {
      bookedRooms = b.rooms;
    } else if (b.room) {
      bookedRooms = [b.room];
    }
    return selectedRooms.some(function(room){
      return bookedRooms.includes(room);
    }) &&
    (checkin < b.checkout) &&
    (checkout > b.checkin);
  });

  if (conflict) {
    alert('One or more selected rooms are already booked for these dates.');
    return;
  }

  var data = {
    name:name,
    phone:phone,
    idProof:idProof,
    address:address,
    rooms:selectedRooms,
    type:type,
    checkin:checkin,
    checkout:checkout,
    amount:amount,
    mode:mode,
    status:status,
    updatedAt:new Date().toISOString()
  };

  if (_editId) {
    firebase.firestore()
      .collection('bookings')
      .doc(_editId)
      .update(data)
      .then(function(){
        toast('Booking updated!');
        closeModal('bookingModal');
      });
  } else {
    var id = Date.now().toString();
    data.createdAt = new Date().toISOString();

    firebase.firestore()
      .collection('bookings')
      .doc(id)
      .set(data)
      .then(function(){
        if (checkin === todayStr()) {
          selectedRooms.forEach(function(room){
            firebase.firestore()
              .collection('rooms')
              .doc(room)
              .update({ status:'occupied', type:type });
          });
        }
        toast('Booking saved!');
        closeModal('bookingModal');
      });
  }
}

function delBooking(id) {
  if (!confirm('Delete this booking?')) return;
  firebase.firestore().collection('bookings').doc(id).delete()
    .then(function(){ toast('Booking deleted.'); });
}

function markPaid(id) {
  firebase.firestore().collection('bookings').doc(id).update({ status:'paid' })
    .then(function(){ toast('Marked as paid!'); });
}

function downloadReceipt(id) {
  var b = _bookings.find(function(x){ return x.id===id; });
  if (!b) return;
  var jsPDF = window.jspdf.jsPDF;
  var pdf = new jsPDF({ unit:'mm', format:'a5' });
  var W=148, pad=14, y=16;

  pdf.setFillColor(45,74,62);
  pdf.rect(0,0,W,30,'F');
  pdf.setTextColor(255,255,255);
  pdf.setFontSize(17); pdf.setFont('helvetica','bold');
  pdf.text('TS GUEST ROOMS', W/2, 12, {align:'center'});
  pdf.setFontSize(8); pdf.setFont('helvetica','normal');
  pdf.text('Allagadda, Nandyal District, Andhra Pradesh', W/2, 19, {align:'center'});
  pdf.setFontSize(7);
  pdf.setFontSize(8); pdf.text('Ph: 9030905166 | 9440092874', W/2, 25, {align:'center'});

  y=42;
  var rno = 'RCP-'+id.slice(-6).toUpperCase();
  pdf.setTextColor(100,100,100); pdf.setFontSize(8); pdf.setFont('helvetica','normal');
  pdf.text('Receipt No: '+rno, pad, y);
  pdf.text('Date: '+fmtDateFull(new Date().toISOString().split('T')[0]), W-pad, y, {align:'right'});
  y+=7;

  pdf.setDrawColor(220,220,215); pdf.setLineWidth(0.3);
  pdf.line(pad,y,W-pad,y); y+=8;

  pdf.setTextColor(30,30,30); pdf.setFontSize(11); pdf.setFont('helvetica','bold');
  pdf.text('Guest Details', pad, y); y+=6;

  var rows = [
    ['Guest Name', b.name],
    ['Phone', b.phone],
    ['ID Proof', b.idProof || '-'],
    ['Address', b.address || '-'],
    [
      'Rooms',
      (b.rooms || [b.room]).join(', ') + ' (' + b.type + ')'
    ],
    ['Check-in', fmtDateFull(b.checkin)],
    ['Check-out', fmtDateFull(b.checkout)],
    ['No. of Nights', nights(b.checkin,b.checkout)+' Night(s)'],
  ];
  pdf.setFontSize(8.5); pdf.setFont('helvetica','normal');
  rows.forEach(function(r){
    pdf.setTextColor(120,120,120); pdf.text(r[0]+':', pad, y);
    pdf.setTextColor(30,30,30);
    var valueLines = pdf.splitTextToSize(String(r[1] || '-'), W - pad - (pad+45));
    pdf.text(valueLines, pad+45, y);
    y += Math.max(6, valueLines.length * 5);
  });

  y+=3; pdf.setDrawColor(220,220,215); pdf.line(pad,y,W-pad,y); y+=8;

  pdf.setTextColor(30,30,30); pdf.setFontSize(11); pdf.setFont('helvetica','bold');
  pdf.text('Payment Details', pad, y); y+=6;
  pdf.setFontSize(8.5); pdf.setFont('helvetica','normal');
  [['Payment Mode',b.mode],['Payment Status',cap(b.status)]].forEach(function(r){
    pdf.setTextColor(120,120,120); pdf.text(r[0]+':', pad, y);
    pdf.setTextColor(30,30,30); pdf.text(r[1], pad+45, y);
    y+=6;
  });

  y+=3;
  pdf.setFillColor(232,240,237);
  pdf.rect(pad,y,W-pad*2,15,'F');
  pdf.setTextColor(45,74,62); pdf.setFontSize(10); pdf.setFont('helvetica','bold');
  pdf.text('Total Amount', pad+4, y+7);
  pdf.setFontSize(14);
  pdf.text('Rs. '+Number(b.amount).toLocaleString('en-IN'), W-pad-4, y+10, {align:'right'});
  y+=22;

  pdf.setDrawColor(220,220,215); pdf.line(pad,y,W-pad,y); y+=6;
  pdf.setTextColor(140,140,140); pdf.setFontSize(7); pdf.setFont('helvetica','italic');
  pdf.text('Thank you for staying at TS Guest Rooms!', W/2, y, {align:'center'}); y+=4;
  pdf.text('This is a computer generated receipt.', W/2, y, {align:'center'});

  pdf.save(
    'Receipt_' +
    b.name.replace(/\s+/g,'_') +
    '.pdf'
  );
  toast('Receipt downloaded!');
}
