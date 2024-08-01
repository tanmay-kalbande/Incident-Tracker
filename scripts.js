document.addEventListener('DOMContentLoaded', function () {
    const newIncidentForm = document.getElementById('new-incident');
    const addIncidentBtn = document.getElementById('add-incident-btn');
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

    // Load existing data
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
        newIncidentForm.reset();
        renderIncidents();
    });

    clearFormBtn.addEventListener('click', function () {
        newIncidentForm.reset();
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
        renderIncidents();
    });

    prevPageBtn.addEventListener('click', function () {
        if (currentPage > 1) {
            currentPage--;
            renderIncidents();
        }
    });

    nextPageBtn.addEventListener('click', function () {
        if (currentPage * itemsPerPage < incidents.length) {
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

        let csv = `Agent Name: ${agentName}\n`;
        csv += 'INC Number,Caller Number,Status,Date,Summary\n';

        incidents.forEach(incident => {
            csv += `${incident.incNumber},${incident.callerNumber},${incident.status},${incident.date},"${incident.summary.replace(/"/g, '""')}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `incidents_${agentName}_${new Date().toISOString().split('T')[0]}.csv`);
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
                    if (index === 0 || index === 1) return; // Skip header rows
                    const [incNumber, callerNumber, status, date, summary] = row.split(',');
                    if (incNumber && callerNumber && status && date && summary) {
                        incidents.push({ incNumber, callerNumber, status, date, summary: summary.replace(/^"|"$/g, '') });
                    }
                });
                localStorage.setItem('incidents', JSON.stringify(incidents));
                renderIncidents();
            };
            reader.readAsText(file);
        }
    });

    deleteAllBtn.addEventListener('click', function () {
        if (confirm('Are you sure you want to delete all data?')) {
            incidents = [];
            localStorage.removeItem('incidents');
            renderIncidents();
        }
    });

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
            case 'Awaiting User Info':
                summaryInput.value = 'Waiting for additional information from the user.';
                break;
            case 'POS Depot':
                summaryInput.value = 'POS system sent to depot for further investigation.';
                break;
            case 'Escalation':
                summaryInput.value = 'Incident escalated to a higher support tier.';
                break;
            default:
                summaryInput.value = '';
                break;
        }
    });

    function renderIncidents() {
        const filteredIncidents = incidents.filter(incident => {
            const searchIncNumber = document.getElementById('search-inc-number').value.toLowerCase();
            const searchCallerNumber = document.getElementById('search-caller-number').value.toLowerCase();
            const searchStatus = document.getElementById('search-status').value;
            const searchDate = document.getElementById('search-date').value;

            return (!searchIncNumber || incident.incNumber.toLowerCase().includes(searchIncNumber)) &&
                (!searchCallerNumber || incident.callerNumber.toLowerCase().includes(searchCallerNumber)) &&
                (!searchStatus || incident.status === searchStatus) &&
                (!searchDate || incident.date === searchDate);
        });

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedIncidents = filteredIncidents.slice(start, end);

        incidentList.innerHTML = paginatedIncidents.map(incident => `
            <tr>
                <td>${incident.incNumber}</td>
                <td>${incident.callerNumber}</td>
                <td>${incident.status}</td>
                <td>${incident.date}</td>
                <td>${incident.summary}</td>
            </tr>
        `).join('');

        pageInfo.textContent = `Page ${currentPage} of ${Math.ceil(filteredIncidents.length / itemsPerPage)}`;
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Other initialization code...

    // Set default date to today
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    // Other event listeners and functions...
});
