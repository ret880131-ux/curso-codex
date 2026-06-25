const form = document.getElementById("student-form");
const message = document.getElementById("message");
const studentsTableBody = document.getElementById("students-table-body");
const submitButton = form.querySelector("button[type='submit']");
const cancelEditButton = document.getElementById("cancel-edit-button");
const storageKey = "registeredStudents";

let students = getStoredStudents();
let editingIndex = null;

renderStudents();

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const fullName = document.getElementById("full-name").value.trim();
  const idNumber = normalizeIdNumber(document.getElementById("id-number").value);
  const city = document.getElementById("city").value.trim();
  const email = document.getElementById("email").value.trim();

  if (!fullName || !idNumber || !city || !email) {
    showMessage("Por favor completa todos los campos.", "error");
    return;
  }

  if (!isValidIdNumber(idNumber)) {
    showMessage("El número de cédula debe contener solo números.", "error");
    return;
  }

  if (!isValidEmail(email)) {
    showMessage("Ingresa un correo electrónico válido.", "error");
    return;
  }

  if (hasDuplicateIdNumber(idNumber)) {
    showMessage("Ya existe un estudiante con ese número de cédula.", "error");
    return;
  }

  if (hasDuplicateEmail(email)) {
    showMessage("Ya existe un estudiante con ese correo electrónico.", "error");
    return;
  }

  const student = {
    fullName: fullName,
    idNumber: idNumber,
    city: city,
    email: email
  };

  if (editingIndex === null) {
    students.push(student);
    showMessage(`Estudiante ${fullName} registrado correctamente.`, "success");
  } else {
    students[editingIndex] = student;
    showMessage(`Estudiante ${fullName} actualizado correctamente.`, "success");
    resetEditMode();
  }

  saveStudents();
  renderStudents();
  form.reset();
});

cancelEditButton.addEventListener("click", function () {
  resetEditMode();
  form.reset();
  showMessage("Edición cancelada.", "success");
});

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidIdNumber(idNumber) {
  return /^\d+$/.test(idNumber);
}

function normalizeIdNumber(idNumber) {
  return idNumber.trim();
}

function hasDuplicateIdNumber(idNumber) {
  return students.some(function (student, index) {
    return index !== editingIndex && normalizeIdNumber(student.idNumber) === idNumber;
  });
}

function hasDuplicateEmail(email) {
  const normalizedEmail = email.toLowerCase();

  return students.some(function (student, index) {
    return index !== editingIndex && student.email.toLowerCase() === normalizedEmail;
  });
}

function renderStudents() {
  studentsTableBody.innerHTML = "";

  students.forEach(function (student, index) {
    addStudentRow(student, index);
  });
}

function addStudentRow(student, index) {
  const row = document.createElement("tr");
  const studentData = [student.fullName, student.idNumber, student.city, student.email];

  studentData.forEach(function (value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.appendChild(cell);
  });

  const actionsCell = document.createElement("td");
  const editButton = document.createElement("button");
  const deleteButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "edit-button";
  editButton.textContent = "Editar";
  editButton.setAttribute("aria-label", `Editar a ${student.fullName}`);

  editButton.addEventListener("click", function () {
    document.getElementById("full-name").value = student.fullName;
    document.getElementById("id-number").value = student.idNumber;
    document.getElementById("city").value = student.city;
    document.getElementById("email").value = student.email;

    editingIndex = index;
    submitButton.textContent = "Guardar cambios";
    cancelEditButton.hidden = false;
    showMessage(`Editando a ${student.fullName}.`, "success");
  });

  deleteButton.type = "button";
  deleteButton.className = "delete-button";
  deleteButton.textContent = "Eliminar";
  deleteButton.setAttribute("aria-label", `Eliminar a ${student.fullName}`);

  deleteButton.addEventListener("click", function () {
    const shouldDelete = confirm("¿Deseas eliminar este registro?");

    if (shouldDelete) {
      students.splice(index, 1);

      if (editingIndex === index) {
        resetEditMode();
        form.reset();
      } else if (editingIndex !== null && editingIndex > index) {
        editingIndex--;
      }

      saveStudents();
      renderStudents();
    }
  });

  actionsCell.className = "actions-cell";
  actionsCell.appendChild(editButton);
  actionsCell.appendChild(deleteButton);
  row.appendChild(actionsCell);

  studentsTableBody.appendChild(row);
}

function resetEditMode() {
  editingIndex = null;
  submitButton.textContent = "Registrar";
  cancelEditButton.hidden = true;
}

function getStoredStudents() {
  const storedStudents = localStorage.getItem(storageKey);

  if (!storedStudents) {
    return [];
  }

  try {
    return JSON.parse(storedStudents);
  } catch (error) {
    return [];
  }
}

function saveStudents() {
  localStorage.setItem(storageKey, JSON.stringify(students));
}

function showMessage(text, type) {
  message.textContent = text;
  message.className = `message ${type}`;
}
