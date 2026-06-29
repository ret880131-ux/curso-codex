const form = document.getElementById("student-form");
const message = document.getElementById("message");
const studentsTableBody = document.getElementById("students-table-body");
const studentSearch = document.getElementById("student-search");
const exportCsvButton = document.getElementById("export-csv-button");
const importCsvInput = document.getElementById("import-csv-input");
const importSummary = document.getElementById("import-summary");
const submitButton = form.querySelector("button[type='submit']");
const cancelEditButton = document.getElementById("cancel-edit-button");
const storageKey = "registeredStudents";
const csvHeaders = ["Nombre completo", "Número de cédula", "Ciudad de residencia", "Correo electrónico"];

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

studentSearch.addEventListener("input", function () {
  renderStudents();
});

exportCsvButton.addEventListener("click", function () {
  exportStudentsToCsv();
});

importCsvInput.addEventListener("change", function () {
  const file = importCsvInput.files[0];

  if (!file) {
    return;
  }

  importStudentsFromCsv(file);
  importCsvInput.value = "";
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

function hasDuplicateIdNumberInList(idNumber, studentList) {
  return studentList.some(function (student) {
    return normalizeIdNumber(student.idNumber) === idNumber;
  });
}

function hasDuplicateEmailInList(email, studentList) {
  const normalizedEmail = email.toLowerCase();

  return studentList.some(function (student) {
    return student.email.toLowerCase() === normalizedEmail;
  });
}

function renderStudents() {
  studentsTableBody.innerHTML = "";
  const searchTerm = studentSearch.value.trim().toLowerCase();

  students.forEach(function (student, index) {
    if (matchesSearch(student, searchTerm)) {
      addStudentRow(student, index);
    }
  });
}

function matchesSearch(student, searchTerm) {
  if (!searchTerm) {
    return true;
  }

  return [student.fullName, student.idNumber, student.city, student.email].some(function (value) {
    return value.toLowerCase().includes(searchTerm);
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

function importStudentsFromCsv(file) {
  const reader = new FileReader();

  reader.onload = function (event) {
    try {
      const result = processCsvImport(event.target.result);

      if (result.importedStudents.length > 0) {
        students = students.concat(result.importedStudents);
        saveStudents();
        renderStudents();
        resetEditMode();
        form.reset();
      }

      showMessage("Importación CSV finalizada.", result.importedStudents.length > 0 ? "success" : "error");
      showImportSummary(result);
    } catch (error) {
      showMessage(error.message, "error");
      clearImportSummary();
    }
  };

  reader.onerror = function () {
    showMessage("No se pudo leer el archivo CSV.", "error");
    clearImportSummary();
  };

  reader.readAsText(file, "UTF-8");
}

function processCsvImport(csvText) {
  const rows = parseCsvRows(csvText.replace(/^\uFEFF/, ""));

  if (rows.length === 0 || rows.every(function (row) {
    return row.every(function (value) {
      return value.trim() === "";
    });
  })) {
    throw new Error("El archivo CSV está vacío.");
  }

  const headerMap = getHeaderMap(rows[0]);

  if (!headerMap) {
    throw new Error("El CSV debe incluir las columnas: " + csvHeaders.join("; ") + ".");
  }

  const importedStudents = [];
  const rejectedRows = [];

  rows.slice(1).forEach(function (row, rowIndex) {
    const rowNumber = rowIndex + 2;

    if (row.length === 1 && row[0].trim() === "") {
      return;
    }

    const student = {
      fullName: getCsvValue(row, headerMap.fullName),
      idNumber: normalizeIdNumber(getCsvValue(row, headerMap.idNumber)),
      city: getCsvValue(row, headerMap.city),
      email: getCsvValue(row, headerMap.email)
    };
    const rejectionReason = getCsvStudentRejectionReason(student, importedStudents);

    if (rejectionReason) {
      rejectedRows.push({
        rowNumber: rowNumber,
        reason: rejectionReason
      });
      return;
    }

    importedStudents.push(student);
  });

  return {
    importedStudents: importedStudents,
    rejectedRows: rejectedRows
  };
}

function parseCsvRows(csvText) {
  const rows = [];
  let currentRow = [];
  let currentValue = "";
  let insideQuotes = false;

  for (let index = 0; index < csvText.length; index++) {
    const character = csvText[index];
    const nextCharacter = csvText[index + 1];

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        currentValue += '"';
        index++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (character === ";" && !insideQuotes) {
      currentRow.push(currentValue);
      currentValue = "";
    } else if ((character === "\n" || character === "\r") && !insideQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index++;
      }

      currentRow.push(currentValue);
      rows.push(currentRow);
      currentRow = [];
      currentValue = "";
    } else {
      currentValue += character;
    }
  }

  if (currentValue !== "" || currentRow.length > 0) {
    currentRow.push(currentValue);
    rows.push(currentRow);
  }

  return rows;
}

function getHeaderMap(headerRow) {
  const normalizedHeaders = headerRow.map(function (header) {
    return normalizeCsvHeader(header);
  });
  const requiredHeaders = {
    fullName: "nombre completo",
    idNumber: "numero de cedula",
    city: "ciudad de residencia",
    email: "correo electronico"
  };
  const headerMap = {};

  Object.keys(requiredHeaders).forEach(function (key) {
    headerMap[key] = normalizedHeaders.indexOf(requiredHeaders[key]);
  });

  if (Object.keys(headerMap).some(function (key) {
    return headerMap[key] === -1;
  })) {
    return null;
  }

  return headerMap;
}

function normalizeCsvHeader(value) {
  return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function getCsvValue(row, index) {
  return (row[index] || "").trim();
}

function getCsvStudentRejectionReason(student, importedStudents) {
  if (!student.fullName || !student.idNumber || !student.city || !student.email) {
    return "Campos vacíos";
  }

  if (!isValidIdNumber(student.idNumber)) {
    return "Número de cédula inválido";
  }

  if (!isValidEmail(student.email)) {
    return "Correo electrónico inválido";
  }

  if (hasDuplicateIdNumberInList(student.idNumber, students) || hasDuplicateIdNumberInList(student.idNumber, importedStudents)) {
    return "Número de cédula duplicado";
  }

  if (hasDuplicateEmailInList(student.email, students) || hasDuplicateEmailInList(student.email, importedStudents)) {
    return "Correo electrónico duplicado";
  }

  return "";
}

function showImportSummary(result) {
  importSummary.innerHTML = "";
  importSummary.hidden = false;

  const title = document.createElement("p");
  title.textContent = `Registros importados: ${result.importedStudents.length}. Registros rechazados: ${result.rejectedRows.length}.`;
  importSummary.appendChild(title);

  if (result.rejectedRows.length > 0) {
    const list = document.createElement("ul");

    result.rejectedRows.forEach(function (rejectedRow) {
      const item = document.createElement("li");
      item.textContent = `Fila ${rejectedRow.rowNumber}: ${rejectedRow.reason}.`;
      list.appendChild(item);
    });

    importSummary.appendChild(list);
  }
}

function clearImportSummary() {
  importSummary.innerHTML = "";
  importSummary.hidden = true;
}

function exportStudentsToCsv() {
  if (students.length === 0) {
    showMessage("No hay estudiantes registrados para exportar.", "error");
    return;
  }

  const csvContent = createCsvContent();
  downloadCsv(csvContent);
  showMessage("Archivo CSV generado correctamente.", "success");
}

function createCsvContent() {
  const headers = csvHeaders;
  const rows = students.map(function (student) {
    return [student.fullName, student.idNumber, student.city, student.email];
  });

  return [headers].concat(rows).map(function (row) {
    return row.map(escapeCsvValue).join(";");
  }).join("\r\n");
}

function escapeCsvValue(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function downloadCsv(csvContent) {
  const blob = new Blob(["\uFEFF", csvContent], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");

  downloadLink.href = url;
  downloadLink.download = "estudiantes.csv";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}
