
// STORAGE

var STORAGE_KEY = 'ipt_demo_v1';

function loadFromStorage() {
  var raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { window.db = JSON.parse(raw); return; } catch(e) {}
  }
  window.db = {
    accounts: [
      { id: 1, firstName: 'Admin', lastName: 'User', email: 'admin@example.com', password: 'Password123!', role: 'admin', verified: true }
    ],
    departments: [
      { id: 1, name: 'Engineering', description: 'Software team' },
      { id: 2, name: 'HR', description: 'Human Resources' }
    ],
    employees: [],
    requests: []
  };
  saveToStorage();
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

// ====================
// AUTH STATE
// ====================
var currentUser = null;

function setAuthState(isAuth, user) {
  currentUser = user || null;
  if (isAuth && user) {
    document.body.className = 'authenticated' + (user.role === 'admin' ? ' is-admin' : '');
    var displayName = user.firstName ? user.firstName + ' ' + user.lastName : user.username;
    document.getElementById('nav-username').textContent = displayName;
  } else {
    document.body.className = 'not-authenticated';
  }
}

// ====================
// TOAST
// ====================
function showToast(msg, type) {
  type = type || 'info';
  var c = document.getElementById('toast-container');
  var el = document.createElement('div');
  el.className = 'toast-msg toast-' + type;
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(function() { el.remove(); }, 3000);
}

function getAuthHeader() {
  const token = sessionStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ====================
// ROUTING
// ====================
var routeMap = {
  '#/':             'home-page',
  '#/register':     'register-page',
  '#/verify-email': 'verify-email-page',
  '#/login':        'login-page',
  '#/profile':      'profile-page',
  '#/employees':    'employees-page',
  '#/departments':  'departments-page',
  '#/accounts':     'accounts-page',
  '#/requests':     'requests-page'
};

function navigateTo(hash) {
  window.location.hash = hash;
}

function handleRouting() {
  var hash = window.location.hash || '#/';
  var protectedRoutes = ['#/profile', '#/requests'];
  var adminRoutes = ['#/employees', '#/accounts', '#/departments'];

  if (protectedRoutes.indexOf(hash) !== -1 && !currentUser) {
    navigateTo('#/login');
    return;
  }
  if (adminRoutes.indexOf(hash) !== -1 && (!currentUser || currentUser.role !== 'admin')) {
    navigateTo('#/');
    showToast('Access denied.', 'danger');
    return;
  }

  document.querySelectorAll('.page').forEach(function(p) {
    p.classList.remove('active');
  });

  var pageId = routeMap[hash] || 'home-page';
  var page = document.getElementById(pageId);
  if (page) page.classList.add('active');

  if (hash === '#/profile')     renderProfile();
  if (hash === '#/employees')   renderEmployeesTable();
  if (hash === '#/accounts')    renderAccountsList();
  if (hash === '#/departments') renderDepartmentsList();
  if (hash === '#/requests')    renderRequestsList();
  if (hash === '#/verify-email') {
    var em = localStorage.getItem('unverified_email') || '';
    document.getElementById('verify-sent-msg').textContent = '\u2705 A verification link has been sent to ' + em;
    document.getElementById('verify-success-msg').style.display = 'none';
  }
}

window.addEventListener('hashchange', handleRouting);

// ====================
// REGISTER
// ====================
document.getElementById('register-form').addEventListener('submit', function(e) {
  e.preventDefault();
  var first = document.getElementById('reg-first').value.trim();
  var last  = document.getElementById('reg-last').value.trim();
  var email = document.getElementById('reg-email').value.trim().toLowerCase();
  var pass  = document.getElementById('reg-password').value;
  var errEl = document.getElementById('register-error');

  if (window.db.accounts.find(function(a) { return a.email === email; })) {
    errEl.textContent = 'Email already registered.';
    errEl.style.display = 'block';
    return;
  }
  errEl.style.display = 'none';

  window.db.accounts.push({
    id: Date.now(),
    firstName: first,
    lastName: last,
    email: email,
    password: pass,
    role: 'user',
    verified: false
  });
  saveToStorage();
  localStorage.setItem('unverified_email', email);
  this.reset();
  navigateTo('#/verify-email');
});

// ====================
// VERIFY EMAIL
// ====================
document.getElementById('simulate-verify-btn').addEventListener('click', function() {
  var email = localStorage.getItem('unverified_email');
  if (!email) { showToast('No pending verification.', 'danger'); return; }
  var acc = window.db.accounts.find(function(a) { return a.email === email; });
  if (acc) { acc.verified = true; saveToStorage(); }
  localStorage.removeItem('unverified_email');
  document.getElementById('verify-success-msg').style.display = 'block';
  showToast('Email verified! Please login.', 'success');
});

// ====================
// LOGIN
// ====================
document.getElementById('login-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  var username = document.getElementById('login-email').value.trim().toLowerCase();
  var password = document.getElementById('login-password').value;
  var errEl = document.getElementById('login-error');

  try {
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      sessionStorage.setItem('authToken', data.token);
      sessionStorage.setItem('authUser', JSON.stringify(data.user));
      setAuthState(true, data.user);
      this.reset();
      showToast('Welcome, ' + data.user.username + '!', 'success');
      navigateTo('#/profile');
    } else {
      errEl.textContent = data.error || 'Login failed.';
      errEl.style.display = 'block';
    }
  } catch (err) {
    errEl.textContent = 'Network error. Is the backend running?';
    errEl.style.display = 'block';
  }
});

// ====================
// LOGOUT
// ====================
document.getElementById('logout-btn').addEventListener('click', function(e) {
  e.preventDefault();
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('authUser');
  setAuthState(false, null);
  showToast('Logged out.', 'info');
  navigateTo('#/');
});
// ====================
// PROFILE
// ====================
function renderProfile() {
  if (!currentUser) return;
  var u = currentUser;
  var displayName = u.firstName ? u.firstName + ' ' + u.lastName : u.username;
  var displayEmail = u.email ? u.email : u.username;
  document.getElementById('profile-content').innerHTML =
    '<p><strong>' + displayName + '</strong></p>' +
    '<p><strong>Email:</strong> ' + displayEmail + '</p>' +
    '<p><strong>Role:</strong> ' + (u.role.charAt(0).toUpperCase() + u.role.slice(1)) + '</p>' +
    '<button class="btn btn-outline-secondary btn-sm" onclick="alert(\'Edit Profile - coming soon!\')">Edit Profile</button>';
}

// ====================
// ACCOUNTS (admin)
// ====================
var accEditingEmail = null;

document.getElementById('toggle-acc-form-btn').addEventListener('click', function() {
  accEditingEmail = null;
  document.getElementById('acc-form-title').textContent = 'Add/Edit Account';
  document.getElementById('acc-edit-email').value = '';
  document.getElementById('acc-first').value = '';
  document.getElementById('acc-last').value = '';
  document.getElementById('acc-email').value = '';
  document.getElementById('acc-password').value = '';
  document.getElementById('acc-role').value = 'user';
  document.getElementById('acc-verified').checked = false;
  document.getElementById('acc-email-group').style.display = '';
  document.getElementById('acc-form-panel').style.display = 'block';
});

document.getElementById('cancel-acc-btn').addEventListener('click', function() {
  document.getElementById('acc-form-panel').style.display = 'none';
});

document.getElementById('save-account-btn').addEventListener('click', function() {
  var first    = document.getElementById('acc-first').value.trim();
  var last     = document.getElementById('acc-last').value.trim();
  var email    = document.getElementById('acc-email').value.trim().toLowerCase();
  var pass     = document.getElementById('acc-password').value;
  var role     = document.getElementById('acc-role').value;
  var verified = document.getElementById('acc-verified').checked;

  if (!first || !last) { showToast('First and Last name required.', 'danger'); return; }

  if (accEditingEmail) {
    var acc = window.db.accounts.find(function(a) { return a.email === accEditingEmail; });
    if (acc) {
      acc.firstName = first;
      acc.lastName  = last;
      acc.role      = role;
      acc.verified  = verified;
      if (pass) acc.password = pass;
      if (currentUser && currentUser.email === accEditingEmail) setAuthState(true, acc);
    }
    showToast('Account updated.', 'success');
  } else {
    if (!email || !pass) { showToast('Email and password required.', 'danger'); return; }
    if (window.db.accounts.find(function(a) { return a.email === email; })) {
      showToast('Email already exists.', 'danger'); return;
    }
    window.db.accounts.push({
      id: Date.now(),
      firstName: first,
      lastName: last,
      email: email,
      password: pass,
      role: role,
      verified: verified
    });
    showToast('Account created.', 'success');
  }
  saveToStorage();
  document.getElementById('acc-form-panel').style.display = 'none';
  renderAccountsList();
});

function renderAccountsList() {
  var tbody = document.getElementById('accounts-tbody');
  tbody.innerHTML = '';
  window.db.accounts.forEach(function(acc) {
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + acc.firstName + ' ' + acc.lastName + '</td>' +
      '<td>' + acc.email + '</td>' +
      '<td>' + acc.role + '</td>' +
      '<td>' + (acc.verified ? '\u2705' : '\u2014') + '</td>' +
      '<td>' +
        '<button class="btn btn-outline-secondary btn-sm me-1" onclick="editAccount(\'' + acc.email + '\')">Edit</button>' +
        '<button class="btn btn-warning btn-sm me-1" onclick="resetPassword(\'' + acc.email + '\')">Reset Password</button>' +
        '<button class="btn btn-danger btn-sm" onclick="deleteAccount(\'' + acc.email + '\')">Delete</button>' +
      '</td>';
    tbody.appendChild(tr);
  });
}

function editAccount(email) {
  var acc = window.db.accounts.find(function(a) { return a.email === email; });
  if (!acc) return;
  accEditingEmail = email;
  document.getElementById('acc-form-title').textContent       = 'Add/Edit Account';
  document.getElementById('acc-edit-email').value             = email;
  document.getElementById('acc-first').value                  = acc.firstName;
  document.getElementById('acc-last').value                   = acc.lastName;
  document.getElementById('acc-email').value                  = acc.email;
  document.getElementById('acc-password').value               = '';
  document.getElementById('acc-role').value                   = acc.role;
  document.getElementById('acc-verified').checked             = acc.verified;
  document.getElementById('acc-email-group').style.display    = 'none';
  document.getElementById('acc-form-panel').style.display     = 'block';
}

function resetPassword(email) {
  var newPw = prompt('Enter new password (min 6 chars):');
  if (!newPw || newPw.length < 6) { showToast('Password too short.', 'danger'); return; }
  var acc = window.db.accounts.find(function(a) { return a.email === email; });
  if (acc) { acc.password = newPw; saveToStorage(); showToast('Password reset.', 'success'); }
}

function deleteAccount(email) {
  if (currentUser && currentUser.email === email) {
    showToast('Cannot delete your own account.', 'danger'); return;
  }
  if (!confirm('Delete this account?')) return;
  window.db.accounts = window.db.accounts.filter(function(a) { return a.email !== email; });
  saveToStorage();
  renderAccountsList();
  showToast('Account deleted.', 'success');
}

// ====================
// DEPARTMENTS (admin)
// ====================
document.getElementById('toggle-dept-form-btn').addEventListener('click', function() {
  document.getElementById('dept-edit-id').value = '';
  document.getElementById('dept-name').value    = '';
  document.getElementById('dept-desc').value    = '';
  document.getElementById('dept-form-panel').style.display = 'block';
});

document.getElementById('cancel-dept-btn').addEventListener('click', function() {
  document.getElementById('dept-form-panel').style.display = 'none';
});

document.getElementById('save-dept-btn').addEventListener('click', function() {
  var name   = document.getElementById('dept-name').value.trim();
  var desc   = document.getElementById('dept-desc').value.trim();
  var editId = document.getElementById('dept-edit-id').value;

  if (!name) { showToast('Name required.', 'danger'); return; }

  if (editId) {
    var dept = window.db.departments.find(function(d) { return String(d.id) === String(editId); });
    if (dept) { dept.name = name; dept.description = desc; }
    showToast('Department updated.', 'success');
  } else {
    window.db.departments.push({ id: Date.now(), name: name, description: desc });
    showToast('Department created.', 'success');
  }
  saveToStorage();
  document.getElementById('dept-form-panel').style.display = 'none';
  renderDepartmentsList();
});

function renderDepartmentsList() {
  var tbody = document.getElementById('departments-tbody');
  tbody.innerHTML = '';
  window.db.departments.forEach(function(dept) {
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + dept.name + '</td>' +
      '<td>' + (dept.description || '\u2014') + '</td>' +
      '<td>' +
        '<button class="btn btn-outline-secondary btn-sm me-1" onclick="editDept(' + dept.id + ')">Edit</button>' +
        '<button class="btn btn-danger btn-sm" onclick="deleteDept(' + dept.id + ')">Delete</button>' +
      '</td>';
    tbody.appendChild(tr);
  });
}

function editDept(id) {
  var dept = window.db.departments.find(function(d) { return d.id === id; });
  if (!dept) return;
  document.getElementById('dept-edit-id').value           = dept.id;
  document.getElementById('dept-name').value              = dept.name;
  document.getElementById('dept-desc').value              = dept.description || '';
  document.getElementById('dept-form-panel').style.display = 'block';
}

function deleteDept(id) {
  if (!confirm('Delete department?')) return;
  window.db.departments = window.db.departments.filter(function(d) { return d.id !== id; });
  saveToStorage();
  renderDepartmentsList();
  showToast('Department deleted.', 'success');
}

// ====================
// EMPLOYEES (admin)
// ====================
document.getElementById('toggle-emp-form-btn').addEventListener('click', function() {
  document.getElementById('emp-edit-id').value          = '';
  document.getElementById('emp-form-title').textContent = 'Add/Edit Employee';
  document.getElementById('emp-id').value               = '';
  document.getElementById('emp-email').value            = '';
  document.getElementById('emp-position').value         = '';
  document.getElementById('emp-hire').value             = '';
  populateDeptDropdown();
  document.getElementById('emp-form-panel').style.display = 'block';
});

document.getElementById('cancel-emp-btn').addEventListener('click', function() {
  document.getElementById('emp-form-panel').style.display = 'none';
});

function populateDeptDropdown() {
  var sel = document.getElementById('emp-dept');
  sel.innerHTML = '';
  window.db.departments.forEach(function(d) {
    var opt = document.createElement('option');
    opt.value = d.id;
    opt.textContent = d.name;
    sel.appendChild(opt);
  });
}

document.getElementById('save-employee-btn').addEventListener('click', function() {
  var empId    = document.getElementById('emp-id').value.trim();
  var email    = document.getElementById('emp-email').value.trim().toLowerCase();
  var position = document.getElementById('emp-position').value.trim();
  var deptId   = document.getElementById('emp-dept').value;
  var hire     = document.getElementById('emp-hire').value;
  var editId   = document.getElementById('emp-edit-id').value;

  if (!empId || !email || !position || !deptId || !hire) {
    showToast('Fill all fields.', 'danger'); return;
  }
  var userAcc = window.db.accounts.find(function(a) { return a.email === email; });
  if (!userAcc) { showToast('No account found for that email.', 'danger'); return; }

  if (editId) {
    var emp = window.db.employees.find(function(e) { return e.empId === editId; });
    if (emp) {
      emp.email    = email;
      emp.position = position;
      emp.deptId   = Number(deptId);
      emp.hireDate = hire;
    }
    showToast('Employee updated.', 'success');
  } else {
    if (window.db.employees.find(function(e) { return e.empId === empId; })) {
      showToast('Employee ID exists.', 'danger'); return;
    }
    window.db.employees.push({
      empId:    empId,
      email:    email,
      userId:   userAcc.id,
      position: position,
      deptId:   Number(deptId),
      hireDate: hire
    });
    showToast('Employee added.', 'success');
  }
  saveToStorage();
  document.getElementById('emp-form-panel').style.display = 'none';
  renderEmployeesTable();
});

function renderEmployeesTable() {
  var tbody = document.getElementById('employees-tbody');
  tbody.innerHTML = '';
  if (window.db.employees.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-muted text-center">No employees.</td></tr>';
    return;
  }
  window.db.employees.forEach(function(emp) {
    var dept = window.db.departments.find(function(d) { return d.id === emp.deptId; });
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + emp.empId + '</td>' +
      '<td>' + emp.email + '</td>' +
      '<td>' + emp.position + '</td>' +
      '<td>' + (dept ? dept.name : '\u2014') + '</td>' +
      '<td>' +
        '<button class="btn btn-outline-secondary btn-sm me-1" onclick="editEmployee(\'' + emp.empId + '\')">Edit</button>' +
        '<button class="btn btn-danger btn-sm" onclick="deleteEmployee(\'' + emp.empId + '\')">Delete</button>' +
      '</td>';
    tbody.appendChild(tr);
  });
}

function editEmployee(empId) {
  var emp = window.db.employees.find(function(e) { return e.empId === empId; });
  if (!emp) return;
  document.getElementById('emp-edit-id').value          = emp.empId;
  document.getElementById('emp-id').value               = emp.empId;
  document.getElementById('emp-email').value            = emp.email;
  document.getElementById('emp-position').value         = emp.position;
  document.getElementById('emp-hire').value             = emp.hireDate;
  populateDeptDropdown();
  document.getElementById('emp-dept').value             = emp.deptId;
  document.getElementById('emp-form-panel').style.display = 'block';
}

function deleteEmployee(empId) {
  if (!confirm('Delete employee record?')) return;
  window.db.employees = window.db.employees.filter(function(e) { return e.empId !== empId; });
  saveToStorage();
  renderEmployeesTable();
  showToast('Employee deleted.', 'success');
}

// ====================
// REQUESTS
// ====================
function showReqForm() {
  document.getElementById('req-items-container').innerHTML = '';
  addItemRow();
  document.getElementById('req-form-panel').style.display = 'block';
}

document.getElementById('toggle-req-form-btn').addEventListener('click', showReqForm);
document.getElementById('create-one-btn').addEventListener('click', showReqForm);

document.getElementById('cancel-req-btn').addEventListener('click', function() {
  document.getElementById('req-form-panel').style.display = 'none';
});

document.getElementById('add-item-btn').addEventListener('click', addItemRow);

function addItemRow() {
  var container = document.getElementById('req-items-container');
  var row = document.createElement('div');
  row.className = 'item-row';
  row.innerHTML =
    '<input type="text" class="form-control item-name" placeholder="Item name" />' +
    '<input type="number" class="form-control item-qty qty" min="1" value="1" />' +
    '<button class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">\u00D7</button>';
  container.appendChild(row);
}

document.getElementById('submit-request-btn').addEventListener('click', function() {
  var type  = document.getElementById('req-type').value;
  var rows  = document.querySelectorAll('#req-items-container .item-row');
  var items = [];

  rows.forEach(function(r) {
    var name = r.querySelector('.item-name').value.trim();
    var qty  = parseInt(r.querySelector('.item-qty').value) || 1;
    if (name) items.push({ name: name, qty: qty });
  });

  if (items.length === 0) { showToast('Add at least one item.', 'danger'); return; }

  window.db.requests.push({
    id:            Date.now(),
    employeeEmail: currentUser.email,
    type:          type,
    items:         items,
    status:        'Pending',
    date:          new Date().toISOString().split('T')[0]
  });
  saveToStorage();
  document.getElementById('req-form-panel').style.display = 'none';
  renderRequestsList();
  showToast('Request submitted.', 'success');
});

function renderRequestsList() {
  if (!currentUser) return;
  var myReqs    = window.db.requests.filter(function(r) { return r.employeeEmail === currentUser.email; });
  var noMsg     = document.getElementById('no-requests-msg');
  var createBtn = document.getElementById('create-one-btn');
  var wrapper   = document.getElementById('requests-table-wrapper');

  if (myReqs.length === 0) {
    noMsg.style.display     = 'block';
    createBtn.style.display = 'inline-block';
    wrapper.style.display   = 'none';
    return;
  }
  noMsg.style.display     = 'none';
  createBtn.style.display = 'none';
  wrapper.style.display   = 'block';

  var tbody = document.getElementById('requests-tbody');
  tbody.innerHTML = '';
  myReqs.forEach(function(req) {
    var badgeClass = req.status === 'Approved' ? 'badge-approved'
                   : req.status === 'Rejected' ? 'badge-rejected'
                   : 'badge-pending';
    var itemsStr = req.items.map(function(i) {
      return i.name + ' (\u00D7' + i.qty + ')';
    }).join(', ');
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + req.date + '</td>' +
      '<td>' + req.type + '</td>' +
      '<td style="font-size:0.82rem">' + itemsStr + '</td>' +
      '<td><span class="' + badgeClass + '">' + req.status + '</span></td>';
    tbody.appendChild(tr);
  });
}

// ====================
// INIT
// ====================
loadFromStorage();

var token = sessionStorage.getItem('authToken');
if (token) {
  var savedUser = JSON.parse(sessionStorage.getItem('authUser'));
  if (savedUser) setAuthState(true, savedUser);
}
