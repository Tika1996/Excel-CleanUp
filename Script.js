        // Excel Proceeder logic (already present in the provided file)
        let workbooks = [];
        const fileInput = document.getElementById('fileInput');
        const fileName = document.getElementById('fileName');
        const columnForm = document.getElementById('columnForm');
        const processButton = document.getElementById('processButton');
        const status = document.getElementById('status');
        const dropZone = document.getElementById('dropZone');

        fileInput.addEventListener('change', handleFileSelect);
        processButton.addEventListener('click', processFiles);
        dropZone.addEventListener('dragover', handleDragOver);
        dropZone.addEventListener('drop', handleFileDrop);

        function handleFileSelect(event) {
            const files = event.target.files;
            handleFiles(files);
        }

        function handleFileDrop(event) {
            event.preventDefault();
            const files = event.dataTransfer.files;
            handleFiles(files);
        }

        function handleDragOver(event) {
            event.preventDefault();
            dropZone.classList.add('bg-gray-100');
        }

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('bg-gray-100');
        });

        function handleFiles(files) {
            fileName.innerHTML = '';
            workbooks = [];

            for (const file of files) {
                fileName.innerHTML += `<div>Fichier sélectionné : ${file.name}</div>`;
                readExcelFile(file);
            }
        }

        function readExcelFile(file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                workbooks.push({fileName: file.name, workbook});
                createColumnForm();
            };
            reader.readAsArrayBuffer(file);
        }

        function createColumnForm() {
            if (workbooks.length > 0) {
                let formHtml = '';
                workbooks[0].workbook.SheetNames.forEach((sheetName, sheetIndex) => {
                    const worksheet = workbooks[0].workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    const headers = jsonData[0];
                    
                    formHtml += `<h2 class="text-xl font-semibold mb-4">Feuille : ${sheetName}</h2>`;
                    headers.forEach((header, index) => {
                        formHtml += `
                            <div class="mb-3">
                                <label class="inline-flex items-center">
                                    <input type="checkbox" name="column${sheetIndex}_${index}" value="${index}" class="form-checkbox h-5 w-5 text-blue-600" onchange="toggleColumnType(this, ${sheetIndex}, ${index})">
                                    <span class="ml-2">${header}</span>
                                </label>
                                <select name="type${sheetIndex}_${index}" class="ml-4 hidden" onchange="updateColumnSelection(this, ${sheetIndex}, ${index})">
                                    <option value="">Type</option>
                                    <option value="date">Date</option>
                                    <option value="texte">Texte</option>
                                    <option value="hour">Heure</option>
                                    <option value="nombre">Nombre</option>
                                </select>
                                <div id="hourOptions${sheetIndex}_${index}" class="ml-4 hidden">
                                    <label class="inline-flex items-center">
                                        <input type="radio" name="hourOption${sheetIndex}_${index}" value="remplir" checked>
                                        <span class="ml-2">Remplir</span>
                                    </label>
                                    <label class="inline-flex items-center ml-4">
                                        <input type="radio" name="hourOption${sheetIndex}_${index}" value="vide">
                                        <span class="ml-2">Vide</span>
                                    </label>
                                </div>
                            </div>
                        `;
                    });
                    formHtml += '<hr class="my-6">';
                });
                columnForm.innerHTML = formHtml;
                columnForm.classList.remove('hidden');
                processButton.disabled = false;
            }
        }

        function toggleColumnType(checkbox, sheetIndex, index) {
            const select = document.querySelector(`select[name="type${sheetIndex}_${index}"]`);
            const hourOptions = document.getElementById(`hourOptions${sheetIndex}_${index}`);
            if (checkbox.checked) {
                select.classList.remove('hidden');
                select.value = 'texte'; // Définir une valeur par défaut
                hourOptions.classList.add('hidden');
            } else {
                select.classList.add('hidden');
                select.value = '';
                hourOptions.classList.add('hidden');
            }
        }

        function updateColumnSelection(select, sheetIndex, index) {
            const checkbox = document.querySelector(`input[name="column${sheetIndex}_${index}"]`);
            const hourOptions = document.getElementById(`hourOptions${sheetIndex}_${index}`);
            checkbox.checked = select.value !== '';
            if (select.value === 'hour') {
                hourOptions.classList.remove('hidden');
            } else {
                hourOptions.classList.add('hidden');
            }
        }

        function processFiles() {
            if (workbooks.length > 1) {
                let zip = new JSZip();
                let processedFiles = 0;

                workbooks.forEach(({fileName, workbook}) => {
                    const newWorkbook = XLSX.utils.book_new();
                    workbook.SheetNames.forEach((sheetName, sheetIndex) => {
                        const worksheet = workbook.Sheets[sheetName];
                        const columnTypes = getColumnTypes(sheetIndex);
                        processColumns(worksheet, columnTypes, sheetIndex);
                        XLSX.utils.book_append_sheet(newWorkbook, worksheet, sheetName);
                    });
                    const newFileName = `processed_${fileName}`;
                    const workbookData = XLSX.write(newWorkbook, {bookType: 'xlsx', type: 'array'});
                    
                    zip.file(newFileName, workbookData);
                    processedFiles++;
                });

                zip.generateAsync({type:"blob"}).then((content) => {
                    saveAs(content, "processed_files.zip");
                    status.textContent = "Traitement terminé. Les fichiers ont été téléchargés dans un fichier ZIP.";
                });
            } else {
                const {fileName, workbook} = workbooks[0];
                const newWorkbook = XLSX.utils.book_new();
                workbook.SheetNames.forEach((sheetName, sheetIndex) => {
                    const worksheet = workbook.Sheets[sheetName];
                    const columnTypes = getColumnTypes(sheetIndex);
                    processColumns(worksheet, columnTypes, sheetIndex);
                    XLSX.utils.book_append_sheet(newWorkbook, worksheet, sheetName);
                });
                const newFileName = 

 `${fileName}`;
                XLSX.writeFile(newWorkbook, newFileName);
                status.textContent = "Traitement terminé. Le fichier a été téléchargé.";
            }
        }

        function getColumnTypes(sheetIndex) {
            const columnTypes = [];
            const formData = new FormData(columnForm);
            for (let i = 0; i < 100; i++) { // Assumons un maximum de 100 colonnes
                if (formData.get(`column${sheetIndex}_${i}`)) {
                    const type = formData.get(`type${sheetIndex}_${i}`);
                    if (type === 'hour') {
                        const hourOption = formData.get(`hourOption${sheetIndex}_${i}`);
                        columnTypes[i] = { type, hourOption };
                    } else {
                        columnTypes[i] = { type };
                    }
                }
            }
            return columnTypes;
        }

        function processColumns(worksheet, columnTypes, sheetIndex) {
            const range = XLSX.utils.decode_range(worksheet['!ref']);
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
            
            for (let col = range.s.c; col <= range.e.c; col++) {
                const typeObj = columnTypes[col];
                if (!typeObj) continue; // Skip columns that weren't selected for processing
                
                for (let row = 1; row <= range.e.r; row++) {
                    let value = jsonData[row][col];
                    if (value !== undefined || (typeObj.type === 'hour' && typeObj.hourOption === 'remplir')) {
                        switch (typeObj.type) {
                            case 'date':
                                value = processDate(value);
                                break;
                            case 'texte':
                                value = processText(value);
                                break;
                            case 'hour':
                                value = processHour(value, typeObj.hourOption);
                                break;
                            case 'nombre':
                                value = processNumber(value);
                                break;
                        }
                        const cellAddress = XLSX.utils.encode_cell({r: row, c: col});
                        worksheet[cellAddress] = { t: 's', v: value };
                    }
                }
            }
        }

        function processDate(value) {
            value = value.replace(/[,;;\-_ ]/g, '/');
            let parts = value.split('/');
            if (parts.length !== 3) return value;
            if (parts[2].length === 2) {
                const currentYear = new Date().getFullYear();
                const century = Math.floor(currentYear / 100) * 100;
                parts[2] = century + parseInt(parts[2]);
            }
            const date = new Date(parts[2], parts[1] - 1, parts[0]);
            return date.toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: 'numeric'});
        }

        function processText(value) {
            value = value.replace(/[^\p{L}\p{N}\s\u0600-\u06FF]/gu, ' ');
            value = value.replace(/\u0640/g, ' ');
            return value.replace(/\s+/g, ' ').trim();
        }

        function processHour(value, hourOption) {
            if (!value || typeof value !== 'string' || value.trim() === '') {
                return hourOption === 'remplir' ? '04:00:00' : '';
            }
            let cleanedValue = value.trim();
            if (/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/.test(cleanedValue)) {
                return cleanedValue.length === 5 ? cleanedValue + ':00' : cleanedValue;
            }
            if (/^\d+([.,]\d+)?$/.test(cleanedValue)) {
                let number = parseFloat(cleanedValue.replace(',', '.'));
                let hours = Math.floor(number);
                let minutes = Math.round((number - hours) * 60);
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
            }
            cleanedValue = cleanedValue.replace(/[^0-9]+/g, ':');
            cleanedValue = cleanedValue.replace(/^:|:$/g, '');
            let parts = cleanedValue.split(':');
            if (parts.length === 1) {
                let hours = parseInt(parts[0], 10);
                if (isNaN(hours)) {
                    return hourOption === 'remplir' ? '04:00:00' : '';
                }
                return `${hours.toString().padStart(2, '0')}:00:00`;
            } else if (parts.length === 2) {
                let hours = parseInt(parts[0], 10);
                let minutes = parseInt(parts[1], 10);
                if (isNaN(hours) || isNaN(minutes) || minutes > 59) {
                    return hourOption === 'remplir' ? '04:00:00' : '';
                }
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
            } else if (parts.length >= 3) {
                let hours = parseInt(parts[0], 10);
                let minutes = parseInt(parts[1], 10);
                let seconds = parseInt(parts[2], 10);
                if (isNaN(hours) || isNaN(minutes) || isNaN(seconds) || 
                    minutes > 59 || seconds > 59) {
                    return hourOption === 'remplir' ? '04:00:00' : '';
                }
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            return hourOption === 'remplir' ? '04:00:00' : '';
        }

        function processNumber(value) {
            if (typeof value === 'number') {
                return value.toString().replace('.', ',');
            }
            if (typeof value !== 'string') {
                return NaN;
            }
            let cleanedValue = value.trim().replace(/\s/g, '');
            cleanedValue = cleanedValue.replace('.', ',');
            cleanedValue = cleanedValue.replace(/[.,]/g, function(match) {
                return match === ',' ? '.' : ',';
            });
            let number = parseFloat(cleanedValue.replace(',', '.'));
            if (isNaN(number)) {
                return NaN;
            }
            return number.toString().replace('.', ',');
        }

        // Excel Spliter Logic
        document.getElementById('splitFile').addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const headers = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0];

                const select = document.getElementById('splitColumnSelect');
                select.innerHTML = headers.map(header => `<option value="${header}">${header}</option>`).join('');
                select.classList.remove('hidden');
            };
            reader.readAsArrayBuffer(file);
        });

//Excel Spliter
        document.getElementById('splitButton').addEventListener('click', function() {
    const selectedColumn = document.getElementById('splitColumnSelect').value;
    if (!selectedColumn) return;

    const file = document.getElementById('splitFile').files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Obtenir les en-têtes pour garantir que toutes les colonnes sont toujours présentes
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const headers = json[0];  // En-têtes des colonnes
        const dataRows = json.slice(1);  // Toutes les données sans les en-têtes
        
        const grouped = {};

        // Parcourir les lignes pour grouper les données en fonction de la colonne sélectionnée
        dataRows.forEach(row => {
            const key = row[headers.indexOf(selectedColumn)];
            if (!grouped[key]) grouped[key] = [];
            
            // S'assurer que chaque ligne a le même nombre de colonnes que les en-têtes
            const completeRow = Array(headers.length).fill("");
            row.forEach((cell, idx) => {
                completeRow[idx] = cell;
            });
            
            grouped[key].push(completeRow);  // Ajouter la ligne complète (même avec des cellules vides)
        });

        const newWorkbook = XLSX.utils.book_new();

        // Créer des feuilles pour chaque groupe et les ajouter au nouveau classeur
        Object.keys(grouped).forEach(key => {
            const newSheetData = [headers, ...grouped[key]];  // Ajouter les en-têtes en haut
            const newSheet = XLSX.utils.aoa_to_sheet(newSheetData);  // Créer une feuille
            XLSX.utils.book_append_sheet(newWorkbook, newSheet, key);  // Ajouter la feuille au classeur
        });

        XLSX.writeFile(newWorkbook, `split_${file.name}`);
        document.getElementById('splitStatus').innerText = 'Fichier divisé et téléchargé.';
    };
    reader.readAsArrayBuffer(file);
});

        // Excel Jumler Logic
        document.getElementById('jumlerFile').addEventListener('change', function(event) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = function(e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const headers = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0];

                // Populate dropdowns
                const selects = ['authorColumnSelect', 'titleColumnSelect', 'durationColumnSelect'];
                selects.forEach(selectId => {
                    const select = document.getElementById(selectId);
                    select.innerHTML = '<option value="">Sélectionnez une colonne</option>' + 
                        headers.map(header => `<option value="${header}">${header}</option>`).join('');
                });
            };
            reader.readAsArrayBuffer(file);
        });

        document.getElementById('jumlerButton').addEventListener('click', function() {
            const authorColumn = document.getElementById('authorColumnSelect').value;
            const titleColumn = document.getElementById('titleColumnSelect').value;
            const durationColumn = document.getElementById('durationColumnSelect').value;
            const startDate = new Date(document.getElementById('startDate').value);
            const endDate = new Date(document.getElementById('endDate').value);

            if (!authorColumn || !titleColumn || !durationColumn || !startDate || !endDate) {
                document.getElementById('jumlerStatus').innerText = "Veuillez sélectionner toutes les colonnes et les dates.";
                return;
            }

            const files = document.getElementById('jumlerFile').files;
            const newWorkbook = XLSX.utils.book_new();

            Array.from(files).forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    workbook.SheetNames.forEach(sheetName => {
                        const sheet = workbook.Sheets[sheetName];
                        const json = XLSX.utils.sheet_to_json(sheet);
                        const summary = {};

                        json.forEach(row => {
                            const author = row[authorColumn];
                            const title = row[titleColumn];
                            const duration = parseFloat(row[durationColumn]);

                            if (!summary[author]) summary[author] = {};
                            if (!summary[author][title]) {
                                summary[author][title] = {
                                    count: 0,
                                    duration: 0
                                };
                            }
                            summary[author][title].count++;
                            summary[author][title].duration += duration;
                        });

                        const result = [];
                        Object.keys(summary).forEach(author => {
                            Object.keys(summary[author]).forEach(title => {
                                const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
                                result.push({
                                    Date: randomDate.toISOString().split('T')[0],
                                    Auteur: author,
                                    Titre: title,
                                    "Nombre de Passage": summary[author][title].count,
                                    Durée: summary[author][title].duration
                                });
                            });
                        });

                        const resultSheet = XLSX.utils.json_to_sheet(result);
                        XLSX.utils.book_append_sheet(newWorkbook, resultSheet, `Result_${sheetName}`);
                    });

                    if (index === files.length - 1) {
                        XLSX.writeFile(newWorkbook, `jumler_result.xlsx`);
                        document.getElementById('jumlerStatus').innerText = 'Fichier résultat généré et téléchargé.';
                    }
                };
                reader.readAsArrayBuffer(file);
            });
        });
        function showApp(appName) {
            ['proceeder', 'spliter', 'jumler'].forEach(name => {
                document.getElementById(name).classList.toggle('hidden', name !== appName);
            });
        }
