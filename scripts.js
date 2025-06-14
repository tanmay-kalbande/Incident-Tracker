document.addEventListener('DOMContentLoaded', function () {
    const newIncidentForm = document.getElementById('new-incident');
    const clearFormBtn = document.getElementById('clear-form-btn');
    const searchBtn = document.getElementById('search-btn');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const incidentList = document.getElementById('incident-list');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const fileInput = document.getElementById('file-input');
    const deleteAllBtn = document.getElementById('delete-all-btn');

    let incidents = JSON.parse(localStorage.getItem('incidents')) || [];
    let currentPage = 1;
    const itemsPerPage = 10;
    let sortColumn = null;
    let sortOrder = 'asc';
    const STORAGE_THRESHOLD = 4 * 1024 * 1024; // 4MB

    function clearNewIncidentForm() {
        newIncidentForm.reset();
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
        document.getElementById('summary').value = '';
    }

    clearNewIncidentForm();
    renderIncidents();

    newIncidentForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const newIncident = {
            incNumber: document.getElementById('inc-number').value,
            callerNumber: document.getElementById('caller-number').value,
            status: document.getElementById('status').value,
            date: document.getElementById('date').value,
            summary: document.getElementById('summary').value,
        };
        incidents.push(newIncident);
        localStorage.setItem('incidents', JSON.stringify(incidents));
        checkStorageSize();
        clearNewIncidentForm();
        renderIncidents();
    });

    clearFormBtn.addEventListener('click', function () {
        clearNewIncidentForm();
    });

    searchBtn.addEventListener('click', function () {
        currentPage = 1;
        renderIncidents();
    });

    clearSearchBtn.addEventListener('click', function () {
        document.getElementById('search-inc-number').value = '';
        document.getElementById('search-caller-number').value = '';
        document.getElementById('search-status').value = '';
        document.getElementById('search-date').value = '';
        currentPage = 1;
        renderIncidents();
    });

    prevPageBtn.addEventListener('click', function () {
        if (currentPage > 1) {
            currentPage--;
            renderIncidents();
        }
    });

    nextPageBtn.addEventListener('click', function () {
        const filteredIncidents = getFilteredIncidents();
        if (currentPage * itemsPerPage < filteredIncidents.length) {
            currentPage++;
            renderIncidents();
        }
    });

    exportBtn.addEventListener('click', function() {
        const agentName = document.getElementById('agent-name').value.trim();
        if (!agentName) {
            alert('Please enter your name before exporting.');
            return;
        }
        const filteredIncidents = getFilteredIncidents();
        const statusFilter = document.getElementById('search-status').value || 'All';
        const currentDate = new Date().toISOString().split('T')[0];
        let csv = `Agent Name: ${agentName}\n`;
        csv += 'INC Number,Caller Number,Status,Date,Summary\n';
        filteredIncidents.forEach(incident => {
            csv += `${incident.incNumber},${incident.callerNumber},${incident.status},${incident.date},"${incident.summary.replace(/"/g, '""')}"\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `incidents_${statusFilter}_by_${agentName}_${currentDate}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });

    importBtn.addEventListener('click', function () {
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const text = e.target.result;
                const rows = text.split('\n');
                rows.forEach((row, index) => {
                    if (index === 0 || index === 1 || row.trim() === '') return;
                    const [incNumber, callerNumber, status, date, ...summaryParts] = row.split(',');
                    const summary = summaryParts.join(',').replace(/^"|"$/g, '').replace(/""/g, '"');
                    if (incNumber && callerNumber && status && date && summary) {
                        incidents.push({ incNumber, callerNumber, status, date, summary });
                    }
                });
                localStorage.setItem('incidents', JSON.stringify(incidents));
                checkStorageSize();
                renderIncidents();
            };
            reader.readAsText(file);
        }
    });

    deleteAllBtn.addEventListener('click', function () {
        if (confirm('Are you sure you want to delete all data?')) {
            const confirmation = prompt('Type "DELETE" to confirm:');
            if (confirmation === 'DELETE') {
                incidents = [];
                localStorage.removeItem('incidents');
                currentPage = 1;
                renderIncidents();
            }
        }
    });

    function deleteIncident(index) {
        if (confirm('Are you sure you want to delete this incident?')) {
            incidents.splice(index, 1);
            localStorage.setItem('incidents', JSON.stringify(incidents));
            renderIncidents();
        }
    }

    document.getElementById('status').addEventListener('change', function () {
        const status = this.value;
        const summaryInput = document.getElementById('summary');
        switch (status) {
            case 'Active':
                summaryInput.value = 'The issue is currently being addressed.';
                break;
            case 'Resolved':
                summaryInput.value = 'User confirmed that the issue has been resolved.';
                break;
            case 'Waiting User Info':
                summaryInput.value = 'Waiting for additional information from the user.';
                break;
            case 'Vendor':
                summaryInput.value = 'Incident assigned to external vendor for resolution.';
                break;
            case 'Internal Team':
                summaryInput.value = 'Incident escalated to internal team for further investigation.';
                break;
            default:
                summaryInput.value = '';
                break;
        }
    });

    function getFilteredIncidents() {
        return incidents.filter(incident => {
            const searchIncNumber = document.getElementById('search-inc-number').value.toLowerCase();
            const searchCallerNumber = document.getElementById('search-caller-number').value.toLowerCase();
            const searchStatus = document.getElementById('search-status').value;
            const searchDate = document.getElementById('search-date').value;
            return (!searchIncNumber || incident.incNumber.toLowerCase().includes(searchIncNumber)) &&
                (!searchCallerNumber || incident.callerNumber.toLowerCase().includes(searchCallerNumber)) &&
                (!searchStatus || incident.status === searchStatus) &&
                (!searchDate || incident.date === searchDate);
        });
    }

    function checkStorageSize() {
        const data = localStorage.getItem('incidents');
        if (data && data.length > STORAGE_THRESHOLD) {
            alert('Storage is nearing capacity. Consider exporting and clearing some data.');
        }
    }

    function getStatusClass(status) {
        switch (status) {
            case 'Active':
                return 'status-active';
            case 'Resolved':
                return 'status-resolved';
            case 'Waiting User Info':
                return 'status-waiting';
            case 'Vendor':
                return 'status-vendor';
            case 'Internal Team':
                return 'status-internal-team';
            default:
                return '';
        }
    }

    function renderIncidents() {
        let filteredIncidents = getFilteredIncidents();
        if (sortColumn) {
            filteredIncidents.sort((a, b) => {
                let valA = a[sortColumn];
                let valB = b[sortColumn];
                if (sortColumn === 'date') {
                    valA = new Date(valA);
                    valB = new Date(valB);
                    return sortOrder === 'asc' ? valA - valB : valB - valA;
                } else {
                    return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                }
            });
        }
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedIncidents = filteredIncidents.slice(start, end);
        const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage) || 1;

        if (currentPage > totalPages) {
            currentPage = totalPages;
        }

        if (filteredIncidents.length === 0) {
            incidentList.innerHTML = '<tr><td colspan="6" class="no-results">No incidents found. Add a new incident to get started.</td></tr>';
            document.getElementById('record-count').textContent = 0;
            document.getElementById('total-records').textContent = 0;
        } else {
            incidentList.innerHTML = paginatedIncidents.map((incident, index) => `
                <tr>
                    <td>${incident.incNumber}</td>
                    <td>${incident.callerNumber}</td>
                    <td><span class="status-badge ${getStatusClass(incident.status)}">${incident.status}</span></td>
                    <td>${incident.date}</td>
                    <td>${incident.summary}</td>
                    <td><button class="btn-danger btn-sm delete-incident-btn" data-index="${start + index}">
                        <i class="fas fa-trash"></i> Delete
                    </button></td>
                </tr>
            `).join('');
            document.getElementById('record-count').textContent = paginatedIncidents.length;
            document.getElementById('total-records').textContent = filteredIncidents.length;
        }

        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;

        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-incident-btn').forEach(button => {
            button.addEventListener('click', function () {
                const index = parseInt(this.getAttribute('data-index'));
                deleteIncident(index);
            });
        });
    }

    document.querySelectorAll('#incident-table th').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.dataset.column;
            if (column) {
                if (sortColumn === column) {
                    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
                    th.querySelector('i').className = `fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`;
                } else {
                    document.querySelectorAll('#incident-table th i').forEach(i => i.className = 'fas fa-sort');
                    sortColumn = column;
                    sortOrder = 'asc';
                    th.querySelector('i').className = 'fas fa-sort-up';
                }
                renderIncidents();
            }
        });
    });
});
