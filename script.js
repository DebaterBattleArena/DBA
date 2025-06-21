document.addEventListener('DOMContentLoaded', async () => {
    let allDebatersData = [];
    let allMatchesData = [];
    let currentLeaderboardSort = { column: 'wins', order: 'desc' }; // Default sort for leaderboard
    let overallStatsChartInstance = null; // Chart.js instance for overall stats
    let comparisonRadarChartInstance = null; // Chart.js instance for comparison radar chart

    // --- Utility Functions ---

    function showToast(message, type = 'info') {
        const toastEl = document.getElementById('liveToast');
        const toastBody = document.getElementById('toastBody');
        if (!toastEl || !toastBody) return;

        toastBody.textContent = message;
        toastEl.className = 'toast hide'; // Reset classes
        toastEl.classList.add('text-bg-' + type);
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    }

    function getSafeImagePath(path) {
        return path && path !== '' ? path : 'default_avatar.png';
    }

    // --- Data Loading ---
    async function fetchData() {
        try {
            console.log("Attempting to fetch data.json...");
            const response = await fetch('data.json');
            if (!response.ok) {
                const errorDetail = response.statusText || `HTTP status ${response.status}`;
                throw new Error(`Failed to load data.json: ${errorDetail}.`);
            }
            const data = await response.json();
            allDebatersData = data.debaters;
            allMatchesData = data.matches;
            console.log("Data loaded successfully:", allDebatersData, allMatchesData);
            showToast('Data loaded successfully!', 'success');
            return data;
        } catch (error) {
            console.error("Critical error loading data:", error);
            showToast('Failed to load application data! Check console for details.', 'error');
            // Provide visual feedback for data loading failure
            document.body.innerHTML = `
                <div class="container my-5 text-center text-danger animate__animated animate__fadeIn" role="alert">
                    <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                    <h2>Failed to Load Application Data!</h2>
                    <p>Error: ${error.message}</p>
                    <p>Please ensure 'data.json' exists in the same folder and is valid JSON. You must run a local web server (e.g., Live Server in VS Code) for this to work.</p>
                </div>
            `;
            return null;
        }
    }

    // --- Section Rendering Functions ---

    function renderTopLowRecords(debaters) {
        const topLowSection = document.getElementById('topLowRecordsSection');
        if (!topLowSection) return;

        const sorted = [...debaters].sort((a,b) => b.wins - a.wins || (b.wins+b.losses) - (a.wins+a.losses));
        const top3 = sorted.slice(0,3);
        const low3 = sorted.slice(-3).reverse().filter(d => !top3.some(t => t.id === d.id)); // Ensure distinct

        let html = `
            <div class="col-md-6">
                <h3 class="mb-3 text-success">Top Record Debaters DBA <i class="fas fa-crown ms-2"></i></h3>
                <div class="row g-3">
        `;
        top3.forEach(d => html += `
            <div class="col-md-4">
                <div class="card shadow h-100">
                    <div class="card-body">
                        <h4>${d.name} <img src="${getSafeImagePath(d.flag)}" width="24" class="ms-2" alt="${d.country_code}"/></h4>
                        <p>Record: <span class="badge bg-success">${d.record}</span></p>
                    </div>
                </div>
            </div>
        `);
        html += `</div></div><div class="col-md-6">
                <h3 class="mb-3 text-danger">Low Record Debaters DBA <i class="fas fa-arrow-down ms-2"></i></h3>
                <div class="row g-3">
        `;
        low3.forEach(d => html += `
            <div class="col-md-4">
                <div class="card shadow h-100">
                    <div class="card-body">
                        <h4>${d.name} <img src="${getSafeImagePath(d.flag)}" width="24" class="ms-2" alt="${d.country_code}"/></h4>
                        <p>Record: <span class="badge bg-danger">${d.record}</span></p>
                    </div>
                </div>
            </div>
        `);
        html += `</div></div>`;
        topLowSection.innerHTML = html;
    }

    function renderQuickViewProfiles(debaters) {
        const quickViewSection = document.getElementById('quickViewProfiles');
        if (!quickViewSection) return;

        let html = '';
        debaters.slice(0, 3).forEach(debater => {
            html += `
                <div class="col-md-4">
                    <div class="card shadow h-100 text-center">
                        <img src="${getSafeImagePath(debater.photo)}" class="card-img-top" alt="${debater.name}"/>
                        <div class="card-body">
                            <h3 class="clickable-name" data-debater-id="${debater.id}">
                                ${debater.name} <img src="${getSafeImagePath(debater.flag)}" width="24" class="ms-2" alt="${debater.country_code}"/>
                            </h3>
                            <p>Record: <span class="badge bg-success">${debater.record}</span></p>
                            <div id="${debater.id}-desc" class="debater-desc">
                                <p><strong>Character:</strong> ${debater.character}</p>
                                <p><strong>Summary:</strong> ${debater.summary}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        quickViewSection.innerHTML = html;

        quickViewSection.querySelectorAll('.clickable-name').forEach(element => {
            element.addEventListener('click', () => {
                const descElement = document.getElementById(`${element.dataset.debaterId}-desc`);
                if (descElement) {
                    descElement.style.display = (descElement.style.display === "block") ? "none" : "block";
                }
            });
        });
    }

    function renderLeaderboard(debaters, query = '', tierFilter = '', countryFilter = '', sortColumn = 'wins', sortOrder = 'desc') {
        const highTierBody = document.getElementById('highTierBody');
        const midTierBody = document.getElementById('midTierBody');
        const lowTierBody = document.getElementById('lowTierBody');
        const countryFilterSelect = document.getElementById('countryFilter');

        if (!highTierBody || !midTierBody || !lowTierBody || !countryFilterSelect) return;

        // Populate Country Filter on first render or data change
        if (countryFilterSelect.options.length <= 1) { // Check if only default option exists
            const uniqueCountries = [...new Set(debaters.map(d => d.country))].sort();
            uniqueCountries.forEach(country => {
                const option = document.createElement('option');
                option.value = country;
                option.textContent = country;
                countryFilterSelect.appendChild(option);
            });
        }
        countryFilterSelect.value = countryFilter; // Set current selection


        let filteredDebaters = debaters.filter(d =>
            (query === '' || d.name.toLowerCase().includes(query.toLowerCase()) || d.country.toLowerCase().includes(query.toLowerCase())) &&
            (tierFilter === '' || d.tier === tierFilter) &&
            (countryFilter === '' || d.country === countryFilter)
        );

        const sortFunction = (a, b) => {
            let valA, valB;
            if (sortColumn === 'name' || sortColumn === 'country') {
                valA = a[sortColumn]; valB = b[sortColumn];
                return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            } else if (sortColumn === 'wins') {
                valA = a.wins; valB = b.wins;
            } else { // Default to rank (wins)
                valA = a.wins; valB = b.wins;
            }
            return sortOrder === 'asc' ? valA - valB : valB - valA;
        };

        const highTier = filteredDebaters.filter(d => d.tier === 'High Tier').sort(sortFunction);
        const midTier = filteredDebaters.filter(d => d.tier === 'Mid Tier').sort(sortFunction);
        const lowTier = filteredDebaters.filter(d => d.tier === 'Low Tier').sort(sortFunction);

        function populateTable(tbody, list) {
            tbody.innerHTML = ''; // Clear previous content
            list.forEach((d, i) => {
                tbody.innerHTML += `
                    <tr>
                        <td>${i + 1}</td>
                        <td><img src="${getSafeImagePath(d.photo)}" width="40" class="rounded-circle" alt="${d.name}"></td>
                        <td>${d.name}</td>
                        <td><img src="${getSafeImagePath(d.flag)}" width="20" class="me-1" alt="${d.country_code}"> ${d.country_code}</td>
                        <td><span class="badge ${d.wins > d.losses ? 'bg-success' : 'bg-danger'}">${d.record}</span></td>
                    </tr>
                `;
            });
            // Add empty rows if less than 5
            for (let i = list.length; i < 5; i++) {
                tbody.innerHTML += `<tr><td>${i + 1}</td><td></td><td></td><td></td><td></td></tr>`;
            }
        }

        populateTable(highTierBody, highTier);
        populateTable(midTierBody, midTier);
        populateTable(lowTierBody, lowTier);

        // Update sort icons
        document.querySelectorAll('.table thead th[data-sort]').forEach(th => {
            const icon = th.querySelector('.sort-icon');
            if (icon) {
                icon.classList.remove('fa-sort-up', 'fa-sort-down', 'fa-sort');
                if (th.dataset.sort === sortColumn) {
                    icon.classList.add(sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down');
                } else {
                    icon.classList.add('fa-sort');
                }
            }
        });
    }

    function renderRecentMatches(matches) {
        const recentMatchesSection = document.getElementById('recentMatchesSection');
        if (!recentMatchesSection) return;

        let html = '';
        const sortedMatches = [...matches].sort((a,b) => (new Date(b.date || 0)) - (new Date(a.date || 0))); // Sort by date
        
        sortedMatches.slice(0, 3).forEach(match => {
            html += `
                <div class="col-lg-4 col-md-6 col-sm-12">
                    <div class="card match-card">
                        <img src="${getSafeImagePath(match.image)}" class="match-img-16by9 card-img-top" alt="${match.debater1.name} vs ${match.debater2.name}">
                        <div class="card-body text-center">
                            <h5 class="card-title fw-bold">Indonesia 🇮🇩 vs Malaysia 🇲🇾</h5>
                            <p class="mb-1"><strong>${match.debater1.name} (${match.debater1.character})</strong> <span class="badge ${match.winner === match.debater1.name ? 'bg-success' : 'bg-danger'}">WIN</span></p> 
                            <p class="mb-0"><strong>${match.debater2.name} (${match.debater2.character})</strong> <span class="badge ${match.winner === match.debater2.name ? 'bg-danger' : 'bg-success'}">LOSS</span></p>
                        </div>
                    </div>
                </div>
            `;
        });
        recentMatchesSection.innerHTML = html;
    }

    function renderIndividualMatchHistory(debaters, matches) {
        const individualMatchHistorySection = document.getElementById('individualMatchHistory');
        if (!individualMatchHistorySection) return;

        let html = '';
        const relevantDebaters = debaters.filter(d => matches.some(m => m.debater1.id === d.id || m.debater2.id === d.id)).slice(0,3);

        relevantDebaters.forEach(debater => {
            const latestMatch = matches.find(m => m.debater1.id === debater.id || m.debater2.id === debater.id);
            if (!latestMatch) return;

            const isWinner = latestMatch.winner === debater.name;
            const opponent = latestMatch.debater1.id === debater.id ? latestMatch.debater2 : latestMatch.debater1;
            const cardClass = isWinner ? 'bg-success' : 'bg-danger';

            html += `
                <div class="col-md-4">
                    <div class="card mb-3 shadow" style="background-color: ${cardClass === 'bg-success' ? '#e6ffe6' : '#ffe6e6'};">
                        <div class="card-body d-flex align-items-center">
                            <img src="${getSafeImagePath(debater.photo)}" width="60" class="me-3 rounded debater-thumbnail" alt="${debater.name}">
                            <div>
                                <h5 class="mb-1 fw-bold">${debater.name} <img src="${getSafeImagePath(debater.flag)}" width="20" class="ms-1 flag-icon" alt="${debater.country_code}"></h5>
                                <p class="mb-1">Record: <span class="badge ${cardClass}">${debater.record}</span></p>
                                <p class="mb-0">${isWinner ? 'Win' : 'Loss'} vs ${opponent.name} [${latestMatch.method}]</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        individualMatchHistorySection.innerHTML = html;
    }

    function renderCompareDebatersSection(debaters) {
        const compareSection = document.getElementById('compare-section-id');
        if (!compareSection) return;

        let debaterOptionsHtml = debaters.map(d => `<option value="${d.id}">${d.name}</option>`).join('');

        // Re-construct the entire section dynamically to ensure fresh event listeners
        compareSection.innerHTML = `
            <h2 class="text-center fw-bold text-uppercase mb-4">Compare Debaters</h2>
            <div class="row justify-content-center mb-4">
                <div class="col-md-5">
                    <select class="form-select mb-2" id="debaterSelect1" aria-label="Select first debater">
                        <option value="">Select Debater 1</option>
                        ${debaterOptionsHtml}
                    </select>
                </div>
                <div class="col-md-1 d-flex align-items-center justify-content-center">
                    <span class="vs-text">VS</span>
                </div>
                <div class="col-md-5">
                    <select class="form-select mb-2" id="debaterSelect2" aria-label="Select second debater">
                        <option value="">Select Debater 2</option>
                        ${debaterOptionsHtml}
                    </select>
                </div>
            </div>
            <div class="row" id="comparisonResults">
                <div class="col-12 text-center text-muted">
                    <p>Select two debaters above to compare their profiles.</p>
                </div>
            </div>
        `;

        const debaterSelect1 = document.getElementById('debaterSelect1');
        const debaterSelect2 = document.getElementById('debaterSelect2');

        const updateComparison = () => {
            const id1 = debaterSelect1.value;
            const id2 = debaterSelect2.value;

            const debater1 = debaters.find(d => d.id === id1);
            const debater2 = debaters.find(d => d.id === id2);

            const comparisonResultsDiv = document.getElementById('comparisonResults');
            if (!comparisonResultsDiv) return;

            if (!debater1 || !debater2) {
                comparisonResultsDiv.innerHTML = `<div class="col-12 text-center text-muted"><p>Select two debaters above to compare their profiles.</p></div>`;
                return;
            }
            if (id1 === id2) {
                showToast('Please select two different debaters for comparison.', 'warning');
                comparisonResultsDiv.innerHTML = `<div class="col-12 text-center text-muted"><p>Select two DIFFERENT debaters to compare their profiles.</p></div>`;
                return;
            }

            // Generate comparison table dynamically
            let comparisonTableHtml = `
                <div class="col-12 mt-4">
                    <table class="table table-bordered table-striped metric-table">
                        <thead>
                            <tr>
                                <th>Metric</th>
                                <th>${debater1.name}</th>
                                <th>${debater2.name}</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            for (const metricName of Object.keys(debater1.metrics)) {
                const score1 = debater1.metrics[metricName];
                const score2 = debater2.metrics[metricName];
                const badgeClass1 = parseFloat(score1) >= 7 ? 'bg-primary' : (parseFloat(score1) >= 4 ? 'bg-warning' : 'bg-secondary');
                const badgeClass2 = parseFloat(score2) >= 7 ? 'bg-primary' : (parseFloat(score2) >= 4 ? 'bg-warning' : 'bg-secondary');

                comparisonTableHtml += `
                    <tr>
                        <td class="metric-name">${metricName}</td>
                        <td><span class="badge ${badgeClass1} score-badge">${score1}/10</span></td>
                        <td><span class="badge ${badgeClass2} score-badge">${score2}/10</span></td>
                    </tr>
                `;
            }
            comparisonTableHtml += `</tbody></table></div>`;
            comparisonResultsDiv.innerHTML = comparisonTableHtml;
        };

        debaterSelect1.addEventListener('change', updateComparison);
        debaterSelect2.addEventListener('change', updateComparison);
    }

    // --- Initial Load & Event Attachments ---

    async function initializePage() {
        console.log("Initializing page...");
        const data = await fetchData(); // Fetch data once
        if (!data) return; // If data fetch failed, stop.

        // Render all static-like sections immediately
        renderTopLowRecords(data.debaters);
        renderQuickViewProfiles(data.debaters);
        renderRecentMatches(data.matches);
        renderIndividualMatchHistory(data.debaters, data.matches);
        renderCompareDebatersSection(data.debaters); // Render comparison section

        // Render Leaderboard (which includes its own filtering/sorting)
        renderLeaderboard(data.debaters);

        // Render overall stats chart
        renderOverallStatsChart(data.debaters);

        // Attach all event listeners after everything is rendered
        attachAllEventListeners(data.debaters, data.matches);

        console.log("Page initialization complete.");
    }

    function attachAllEventListeners(debaters, matches) {
        // Leaderboard Search & Filters
        const leaderboardSearchInput = document.getElementById('leaderboardSearch');
        const tierFilterSelect = document.getElementById('tierFilter');
        const countryFilterSelect = document.getElementById('countryFilter');

        const applyLeaderboardFilters = () => {
            const query = leaderboardSearchInput ? leaderboardSearchInput.value : '';
            const tier = tierFilterSelect ? tierFilterSelect.value : '';
            const country = countryFilterSelect ? countryFilterSelect.value : '';
            renderLeaderboard(debaters, query, tier, country, currentLeaderboardSort.column, currentLeaderboardSort.order);
        };

        if (leaderboardSearchInput) leaderboardSearchInput.addEventListener('keyup', applyLeaderboardFilters);
        if (tierFilterSelect) tierFilterSelect.addEventListener('change', applyLeaderboardFilters);
        if (countryFilterSelect) countryFilterSelect.addEventListener('change', applyLeaderboardFilters);

        // Leaderboard Sorting (attached to thead, but handled by renderLeaderboard)
        document.querySelectorAll('.table thead th[data-sort]').forEach(header => {
            header.addEventListener('click', () => {
                const sortColumn = header.dataset.sort;
                if (currentLeaderboardSort.column === sortColumn) {
                    currentLeaderboardSort.order = currentLeaderboardSort.order === 'asc' ? 'desc' : 'asc';
                } else {
                    currentLeaderboardSort.column = sortColumn;
                    currentLeaderboardSort.order = 'asc';
                }
                applyLeaderboardFilters();
            });
        });

        // Debater Profile Search (for "Debater Profile Metrics" section)
        const debaterProfileSearchInput = document.getElementById('debaterProfileSearch');
        if (debaterProfileSearchInput) {
            debaterProfileSearchInput.addEventListener('keyup', (event) => {
                renderDetailedProfiles(debaters, event.target.value);
            });
        }
    }

    // Call initializePage when the DOM is fully loaded
    initializePage();
});
