var _pendingUsersListener = null;

function initAdminPanel() {
  var panel = document.getElementById('adminPanel');
  if (!panel) return;

  if (!isAdmin()) {
    panel.classList.add('hidden');
    stopPendingUsersListener();
    return;
  }

  panel.classList.remove('hidden');
  if (_pendingUsersListener) return;

  _pendingUsersListener = db.collection('users')
    .where('role', '==', 'staff')
    .where('approved', '==', false)
    .onSnapshot(function(snap) {
      renderPendingRequests(snap.docs);
    });
}

function stopPendingUsersListener() {
  if (_pendingUsersListener) {
    _pendingUsersListener();
    _pendingUsersListener = null;
  }
}

function renderPendingRequests(docs) {
  var tbody = document.getElementById('pendingUsersBody');
  var empty = document.getElementById('adminPanelEmpty');
  if (!tbody || !empty) return;

  if (!docs.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  tbody.innerHTML = docs.map(function(doc) {
    var data = doc.data();
    return '<tr>' +
      '<td>' + escapeHtml(data.name || 'Unnamed') + '</td>' +
      '<td>' + escapeHtml(data.email || 'No email') + '</td>' +
      '<td>' + formatRequestDate(data.createdAt) + '</td>' +
      '<td>' +
        '<button class="btn btn-sm btn-primary" onclick="approveStaff(\'' + doc.id + '\')">Approve</button> ' +
        '<button class="btn btn-sm btn-danger" onclick="rejectStaff(\'' + doc.id + '\')">Reject</button>' +
      '</td>' +
    '</tr>';
  }).join('');
}

function approveStaff(uid) {
  if (!isAdmin()) return;
  db.collection('users').doc(uid).update({ approved: true })
    .then(function() {
      toast('Staff approved successfully.');
    })
    .catch(function(error) {
      toast('Approve failed: ' + (error.message || error));
    });
}

function rejectStaff(uid) {
  if (!isAdmin()) return;
  db.collection('users').doc(uid).delete()
    .then(function() {
      toast('Staff request rejected.');
    })
    .catch(function(error) {
      toast('Reject failed: ' + (error.message || error));
    });
}

function formatRequestDate(value) {
  if (!value) return '-';
  var date = value.toDate ? value.toDate() : new Date(value);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
