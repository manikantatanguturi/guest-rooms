var _authStarted = false;
var currentUserRole = null;
var currentUserName = '';
var currentUserId = null;
var _pendingApprovalMode = false;

function showLoginView() {
  hidePendingApprovalScreen();
  document.getElementById('loginView').classList.remove('hidden');
  document.getElementById('registerView').classList.add('hidden');
  document.getElementById('authMessage').textContent = '';
  showAuthContainer();
}

function showRegisterView() {
  hidePendingApprovalScreen();
  document.getElementById('loginView').classList.add('hidden');
  document.getElementById('registerView').classList.remove('hidden');
  document.getElementById('authMessage').textContent = '';
  showAuthContainer();
}

function showPendingApprovalScreen() {
  _pendingApprovalMode = true;
  var authContainer = document.getElementById('authContainer');
  var appContainer = document.getElementById('appContainer');
  var pending = document.getElementById('pendingContainer');
  if (authContainer) {
    authContainer.style.display = 'none';
    authContainer.classList.add('hidden');
  }
  if (appContainer) {
    appContainer.style.display = 'none';
    appContainer.classList.add('hidden');
  }
  if (pending) {
    pending.style.display = 'flex';
    pending.classList.remove('hidden');
  }
}

function hidePendingApprovalScreen() {
  _pendingApprovalMode = false;
  var pending = document.getElementById('pendingContainer');
  if (pending) {
    pending.style.display = 'none';
    pending.classList.add('hidden');
  }
}

function returnToLogin() {
  _pendingApprovalMode = false;
  hidePendingApprovalScreen();
  showLoginView();
}

function setAuthMessage(message, isError) {
  var el = document.getElementById('authMessage');
  el.textContent = message || '';
  el.style.color = isError ? 'var(--red)' : 'var(--green)';
}

function showAuthContainer() {
  var authContainer = document.getElementById('authContainer');
  var appContainer = document.getElementById('appContainer');
  if (authContainer) {
    authContainer.style.display = 'flex';
    authContainer.classList.remove('hidden');
  }
  if (appContainer) {
    appContainer.style.display = 'none';
    appContainer.classList.add('hidden');
  }
  hidePendingApprovalScreen();
  ensureStandaloneNav();
  updateUserBadge();
}

function showAppContainer() {
  var authContainer = document.getElementById('authContainer');
  var appContainer = document.getElementById('appContainer');
  var logoutBtn = document.getElementById('btn-logout');
  if (authContainer) {
    authContainer.style.display = 'none';
    authContainer.classList.add('hidden');
  }
  if (appContainer) {
    appContainer.style.display = 'block';
    appContainer.classList.remove('hidden');
  }
  if (logoutBtn) {
    logoutBtn.style.display = 'inline-flex';
  }
  hidePendingApprovalScreen();
  ensureStandaloneNav();
  updateUserBadge();
}

function toggleMobileNav() {
  var sidebar = document.querySelector('.app-sidebar');
  if (!sidebar) return;
  sidebar.classList.toggle('open');
}

function ensureStandaloneNav() {
  try {
    var sidebar = document.querySelector('.app-sidebar');
    if (sidebar && window.innerWidth >= 1024) sidebar.classList.remove('open');
  } catch (e) { /* ignore */ }
}

function updateUserBadge() {
  var userBar = document.getElementById('userBar');
  var userName = document.getElementById('currentUserName');
  var roleBadge = document.getElementById('currentUserRoleBadge');
  if (!userBar || !userName || !roleBadge) return;
  if (currentUserRole) {
    userName.textContent = currentUserName || '';
    roleBadge.textContent = currentUserRole === 'admin' ? 'ADMIN' : 'STAFF';
    userBar.classList.remove('hidden');
    userBar.style.display = 'flex';
  } else {
    userBar.classList.add('hidden');
    userBar.style.display = 'none';
  }
  // Update admin nav visibility
  updateAdminNavVisibility();
}

function updateAdminNavVisibility() {
  var adminNav = document.getElementById('btn-admin');
  if (!adminNav) return;
  if (currentUserRole === 'admin') {
    adminNav.classList.remove('hidden');
  } else {
    adminNav.classList.add('hidden');
  }
}

function clearUserState() {
  currentUserRole = null;
  currentUserName = '';
  currentUserId = null;
  // Close sidebar and hide admin nav
  var sidebar = document.querySelector('.app-sidebar');
  if (sidebar) sidebar.classList.remove('open');
  var adminNav = document.getElementById('btn-admin');
  if (adminNav) adminNav.classList.add('hidden');
  updateUserBadge();
  if (typeof stopPendingUsersListener === 'function') {
    stopPendingUsersListener();
  }
}

function isAdmin() {
  return currentUserRole === 'admin';
}

function isStaff() {
  return currentUserRole === 'staff';
}

function login() {
  var email = document.getElementById('loginEmail').value.trim();
  var password = document.getElementById('loginPassword').value;
  if (!email || !password) {
    setAuthMessage('Please enter email and password.', true);
    return;
  }
  setAuthMessage('Signing in...', false);
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(function() {
      setAuthMessage('Login successful.', false);
    })
    .catch(function(error) {
      setAuthMessage(error.message || 'Login failed.', true);
    });
}

async function register() {
  var name = document.getElementById('registerName').value.trim();
  var email = document.getElementById('registerEmail').value.trim();
  var password = document.getElementById('registerPassword').value;

  if (!name || !email || !password) {
    setAuthMessage('Name, email and password are required.', true);
    return;
  }

  if (password.length < 6) {
    setAuthMessage('Password must be at least 6 characters.', true);
    return;
  }

  try {
    setAuthMessage('Creating account...', false);

    var result = await firebase.auth().createUserWithEmailAndPassword(email, password);
    await result.user.updateProfile({ displayName: name });

    await firebase.firestore().collection('users').doc(result.user.uid).set({
      name: name,
      email: email,
      role: 'staff',
      approved: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    setAuthMessage('Registration successful. Please login.', false);
    showLoginView();
  } catch (error) {
    setAuthMessage(error.message || 'Registration failed.', true);
  }
}

function logout() {
  clearUserState();
  firebase.auth().signOut().catch(function(error) {
    toast('Logout failed: ' + (error.message || error));
  });
}

function initAuth() {
  if (_authStarted) return;
  _authStarted = true;
  showLoginView();

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      firebase.firestore().collection('users').doc(user.uid).get()
        .then(function(doc) {
          var data = doc.exists ? doc.data() : null;
          if (!doc.exists || !data.approved) {
            currentUserRole = null;
            currentUserName = (data && data.name) || user.displayName || user.email;
            setAuthMessage('Your account is pending admin approval.', true);
            showPendingApprovalScreen();
            setTimeout(function() { firebase.auth().signOut(); }, 500);
            return;
          }

          currentUserRole = data.role || 'staff';
          currentUserName = data.name || user.displayName || user.email;
          currentUserId = user.uid;
          setAuthMessage('');
          showAppContainer();

          if (typeof initAdminPanel === 'function') {
            initAdminPanel();
          }

          if (!window._appStarted && typeof startApp === 'function') {
            window._appStarted = true;
            startApp();
          }
        })
        .catch(function(error) {
          setAuthMessage(error.message || 'Login failed. Please try again.', true);
          firebase.auth().signOut();
        });
    } else {
      if (_pendingApprovalMode) {
        showPendingApprovalScreen();
      } else {
        clearUserState();
        showLoginView();
      }
    }
  });
}

window.addEventListener('load', initAuth);
