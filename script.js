document.addEventListener('DOMContentLoaded', () => {
    let allDebatersData = [];
    let allMatchesData = [];
    let currentLeaderboardSort = { column: 'rank', order: 'asc' }; // Sort state for leaderboard
    let overallStatsChartInstance = null; // Chart.js instance for overall stats on homepage
    let radarChartInstance = null; // Chart.js instance for radar chart on profile page
    let comparisonChartInstance = null; // Chart.js instance for comparison chart (removed from this version)


    // --- Utility Functions ---

    function showToast(message, type = 'info') {
        const toastEl = document.getElementById('liveToast');
        const toastBody = document.getElementById('toastBody');
        if (!toastEl || !toastBody) {
            console.warn("Toast elements not found. Message:", message);
            return; // Exit if elements are not found
        }
        toastBody.textContent = message;
        toastEl.className = 'toast hide'; // Reset classes
        toastEl.classList.add('text-bg-' + type);
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    }

    function getSafeImagePath(path) {
        return path && path !== '' ? path : 'default_avatar.png';
    }

    // --- Fetch Data Function ---
    async function fetchData() {
        try {
            console.log("Attempting to fetch data.json...");
            const response = await fetch('data.json');
            if (!response.ok) {
                const errorDetail = response.statusText || `HTTP status ${response.status}`;
                throw new Error(`Failed to load data.json: ${errorDetail}`);
            }
            const data = await response.json();
            allDebatersData = data.debaters;
            allMatchesData = data.matches;
            console.log("Data loaded successfully.");
            showToast('Data loaded successfully!', 'success');
            return data;
        } catch (error) {
            console.error("Critical error loading data:", error);
            showToast('Failed to load application data! Please check console.', 'error');
            // This global error display is only for index.html if it's the root problem
            const appRoot = document.getElementById('app-root');
            if(appRoot) {
                appRoot.innerHTML = `
                    <div class="container my-5 text-center text-danger animate__animated animate__fadeIn" role="alert">
                        <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                        <h2>Failed to Load Application!</h2>
                        <p>Error: ${error.message}</p>
                        <p>Please ensure 'data.json' exists in the same folder and is valid. You might need to run a local web server (e.g., Live Server in VS Code).</p>
                    </div>
                `;
            } else { // Fallback for profile.html if it cannot load data
                const profileAppRoot = document.getElementById('profile-app-root');
                if(profileAppRoot) {
                    profileAppRoot.innerHTML = `
                        <div class="container my-5 text-center text-danger animate__animated animate__fadeIn" role="alert">
                            <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                            <h2>Failed to Load Profile Data!</h2>
                            <p>Error: ${error.message}</p>
                            <p>Please ensure 'data.json' is accessible.</p>
                            <a href="index.html" class="btn btn-primary mt-3"><i class="fas fa-arrow-left me-2"></i> Back to Home</a>
                        </div>
                    `;
                }
            }
            return null;
        }
    }

    // --- Rendering Functions for index.html sections ---

    function renderHomePageSections(debaters, matches) {
        console.log("Starting renderHomePageSections...");

        // Render Top & Low Records
        const topLowRecordsSection = document.getElementById('topLowRecordsSection');
        if (topLowRecordsSection) {
            const sortedDebaters = [...debaters].sort((a, b) => {
                const winRateA = (a.wins + a.losses) > 0 ? a.wins / (a.wins + a.losses) : 0;
                const winRateB = (b.wins + b.losses) > 0 ? b.wins / (b.wins + b.losses) : 0;
                if (winRateA !== winRateB) return winRateB - winRateA;
                return (b.wins + b.losses) - (a.wins + a.losses);
            });
            const top3 = sortedDebaters.slice(0, 3);
            const low3StartIndex = Math.max(0, sortedDebaters.length - 3);
            const low3 = sortedDebaters.slice(low3StartIndex).filter(d => !top3.some(t => t.id === d.id)).reverse();

            let html = `
                <div class="col-md-6">
                    <h3 class="mb-3 text-success">Top Record Debaters DBA <i class="fas fa-crown ms-2"></i></h3>
                    <div class="row g-3">
            `;
            top3.forEach(debater => {
                html += `
                    <div class="col-md-4">
                        <div class="card shadow h-100 animate__animated animate__fadeInUp" role="button" aria-label="View ${debater.name}'s profile" onclick="window.location.href='profile.html?id=${debater.id}'">
                            <div class="card-body">
                                <h4 class="card-title">${debater.name} <img src="${getSafeImagePath(debater.flag)}" width="24" class="ms-2" alt="${debater.country_code}"/></h4>
                                <p class="card-text">Record: <span class="badge ${debater.wins > debater.losses ? 'bg-success' : 'bg-danger'}">${debater.record}</span></p>
                            </div>
                        </div>
                    </div>
                `;
            });
            html += `
                    </div>
                </div>
                <div class="col-md-6">
                    <h3 class="mb-3 text-danger">Low Record Debaters DBA <i class="fas fa-arrow-down ms-2"></i></h3>
                    <div class="row g-3">
            `;
            low3.forEach(debater => {
                html += `
                    <div class="col-md-4">
                        <div class="card shadow h-100 animate__animated animate__fadeInUp" role="button" aria-label="View ${debater.name}'s profile" onclick="window.location.href='profile.html?id=${debater.id}'">
                            <div class="card-body">
                                <h4 class="card-title">${debater.name} <img src="${getSafeImagePath(debater.flag)}" width="24" class="ms-2" alt="${debater.country_code}"/></h4>
                                <p class="card-text">Record: <span class="badge ${debater.wins > debater.losses ? 'bg-danger' : 'bg-success'}">${debater.record}</span></p>
                            </div>
                        </div>
                    </div>
                `;
            });
            html += `
                    </div>
                </div>
            `;
            topLowRecordsSection.innerHTML = html;
        }

        // Render Quick View Profiles
        const quickViewProfilesSection = document.getElementById('quickViewProfiles');
        if (quickViewProfilesSection) {
            let html = '';
            debaters.slice(0, 3).forEach(debater => { // Showing first 3 for quick view
                html += `
                    <div class="col-md-4">
                        <div class="card shadow h-100 text-center animate__animated animate__fadeInUp" aria-label="View quick summary of ${debater.name}">
                            <img src="${getSafeImagePath(debater.photo)}" class="card-img-top" alt="${debater.name}" loading="lazy"/>
                            <div class="card-body">
                                <h3 class="clickable-name" data-debater-id="${debater.id}" tabindex="0" role="button">
                                    ${debater.name} <img src="${getSafeImagePath(debater.flag)}" width="24" class="ms-2" alt="${debater.country_code}"/>
                                </h3>
                                <p class="card-text">Record: <span class="badge ${debater.wins > debater.losses ? 'bg-success' : 'bg-danger'}">${debater.record}</span></p>
                                <div id="${debater.id}-desc" class="debater-desc">
                                    <p><strong>Character:</strong> ${debater.character}</p>
                                    <p><strong>Summary:</strong> ${debater.summary}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            quickViewProfilesSection.innerHTML = html;

            quickViewProfilesSection.querySelectorAll('.clickable-name').forEach(element => {
                element.addEventListener('click', () => {
                    const debaterId = element.dataset.debaterId;
                    const descElement = document.getElementById(`${debaterId}-desc`);
                    if (descElement) {
                        descElement.classList.toggle('show');
                        if (descElement.classList.contains('show')) {
                            element.setAttribute('aria-expanded', 'true');
                        } else {
                            element.setAttribute('aria-expanded', 'false');
                        }
                    }
                });
                element.addEventListener('keypress', (e) => { // For keyboard accessibility
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        element.click();
                    }
                });
            });
        }

        // Render Leaderboard (initial call on page load)
        let leaderboardSearchInput = document.getElementById('leaderboardSearch');
        let tierFilterSelect = document.getElementById('tierFilter');
        let countryFilterSelect = document.getElementById('countryFilter');

        // Populate country filter options (must be done after element exists)
        if(countryFilterSelect) {
            const uniqueCountries = [...new Set(debaters.map(d => d.country))].sort();
            uniqueCountries.forEach(country => {
                const option = document.createElement('option');
                option.value = country;
                option.textContent = country;
                countryFilterSelect.appendChild(option);
            });
        }


        // Render Detailed Profiles (with search)
        function renderDetailedProfiles(allDebaters, filterQuery = '') {
            console.log("Rendering Detailed Profiles with query:", filterQuery);
            const detailedProfilesSection = document.getElementById('detailedProfilesSection');
            if (!detailedProfilesSection) return;

            const query = filterQuery.trim().toLowerCase();

            if (query === '') {
                detailedProfilesSection.innerHTML = `
                    <div class="col-12 text-center text-muted animate__animated animate__fadeIn">
                        <p><i class="fas fa-search me-2"></i> Ketik nama debater di atas untuk melihat metrik profil lengkap mereka.</p>
                    </div>
                `;
                return;
            }

            const filteredDebaters = allDebaters.filter(debater =>
                debater.name.toLowerCase().includes(query)
            );

            if (filteredDebaters.length === 0) {
                detailedProfilesSection.innerHTML = `
                    <div class="col-12 text-center text-muted animate__animated animate__fadeIn">
                        <p><i class="fas fa-exclamation-circle me-2"></i> Tidak ada debater yang ditemukan dengan nama "${filterQuery}".</p>
                    </div>
                `;
                return;
            }

            let html = '';
            filteredDebaters.forEach(debater => {
                let metricsHtml = '';
                for (const [metricName, metricScore] of Object.entries(debater.metrics)) {
                    const widthPercentage = (parseFloat(metricScore) / 10) * 100;
                    metricsHtml += `
                        <div class="profile-metric">
                            <span>${metricName}:</span>
                            <div class="progress flex-grow-1" role="progressbar" aria-label="${metricName} score" aria-valuenow="${metricScore}" aria-valuemin="0" aria-valuemax="10">
                                <div class="progress-bar" style="width: ${widthPercentage}%;"></div>
                            </div>
                            <span class="metric-value">${metricScore}/10</span>
                        </div>
                    `;
                }

                html += `
                    <div class="col-lg-4 col-md-6 animate__animated animate__fadeInUp">
                        <div class="card h-100">
                            <img src="${getSafeImagePath(debater.photo)}" class="card-img-top profile-avatar" alt="${debater.name} Profile" loading="lazy">
                            <div class="card-body">
                                <h3 class="profile-name">
                                    <a href="profile.html?id=${debater.id}" class="text-decoration-none">${debater.name}</a>
                                    <img src="${getSafeImagePath(debater.flag)}" width="24" class="ms-2" alt="${debater.country_code}"/>
                                </h3>
                                <p class="profile-record">Record: <span class="badge ${debater.wins > debater.losses ? 'bg-success' : 'bg-danger'}">${debater.record}</span></p>
                                <div class="profile-metrics">
                                    ${metricsHtml}
                                </div>
                                <div class="profile-detail mt-3">
                                    <p><strong>Favorite Character:</strong> ${debater.character}</p>
                                    <p><strong>Bio:</strong> ${debater.bio}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            detailedProfilesSection.innerHTML = html;
        }

        // Render Leaderboard
        function renderLeaderboard(debaters, query = '', filterTier = '', filterCountry = '', sortColumn = 'rank', sortOrder = 'asc') {
            console.log("Rendering Leaderboard with query:", query, "tier:", filterTier, "country:", filterCountry, "sort:", sortColumn, sortOrder);
            const highTierBody = document.getElementById('highTierBody');
            const midTierBody = document.getElementById('midTierBody');
            const lowTierBody = document.getElementById('lowTierBody');

            if (!highTierBody || !midTierBody || !lowTierBody) return;

            highTierBody.innerHTML = '';
            midTierBody.innerHTML = '';
            lowTierBody.innerHTML = '';

            let filteredDebaters = debaters.filter(debater =>
                (query === '' || debater.name.toLowerCase().includes(query.toLowerCase()) || debater.country.toLowerCase().includes(query.toLowerCase()) || debater.country_code.toLowerCase().includes(query.toLowerCase())) &&
                (filterTier === '' || debater.tier === filterTier) &&
                (filterCountry === '' || debater.country === filterCountry)
            );

            function sortTier(tierList) {
                return tierList.sort((a, b) => {
                    let valA, valB;
                    if (sortColumn === 'rank' || sortColumn === 'wins') { 
                        valA = a.wins;
                        valB = b.wins;
                    } else if (sortColumn === 'name' || sortColumn === 'country') {
                        valA = a[sortColumn];
                        valB = b[sortColumn];
                    } else { // Fallback to sorting by name if column is unknown
                        valA = a.name;
                        valB = b.name;
                    }

                    if (typeof valA === 'string') {
                        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                    } else {
                        return sortOrder === 'asc' ? valA - valB : valB - valA;
                    }
                });
            }

            const highTier = sortTier(filteredDebaters.filter(d => d.tier === 'High Tier'));
            const midTier = sortTier(filteredDebaters.filter(d => d.tier === 'Mid Tier'));
            const lowTier = sortTier(filteredDebaters.filter(d => d.tier === 'Low Tier'));

            function populateTier(tbody, tierList) {
                if (tierList.length === 0 && (query !== '' || filterTier !== '' || filterCountry !== '')) {
                    tbody.innerHTML = `<tr><td colspan="5" class="text-muted">No debaters found in this tier matching your filters.</td></tr>`;
                    return;
                }
                const minRows = Math.max(tierList.length, 5); // Ensure at least 5 rows for appearance
                for (let i = 0; i < minRows; i++) {
                    const debater = tierList[i];
                    if (debater) {
                        tbody.innerHTML += `
                            <tr>
                                <td>${i + 1}</td>
                                <td><img src="${getSafeImagePath(debater.photo)}" width="40" class="rounded-circle" alt="${debater.name}" loading="lazy"></td>
                                <td><a href="profile.html?id=${debater.id}" class="text-decoration-none">${debater.name}</a></td>
                                <td><img src="${getSafeImagePath(debater.flag)}" width="20" class="me-1" alt="${debater.country_code}"> ${debater.country_code}</td>
                                <td><span class="badge ${debater.wins > debater.losses ? 'bg-success' : 'bg-danger'}">${debater.record}</span></td>
                            </tr>
                        `;
                    } else {
                        tbody.innerHTML += `<tr><td>${i + 1}</td><td></td><td></td><td></td><td></td></tr>`;
                    }
                }
            }

            populateTier(highTierBody, highTier);
            populateTier(midTierBody, midTier);
            populateTier(lowTierBody, lowTier);

            // Update sort icons and aria-sort attributes
            document.querySelectorAll('.table thead th[data-sort]').forEach(th => {
                const icon = th.querySelector('.sort-icon');
                if (icon) {
                    icon.classList.remove('fa-sort-up', 'fa-sort-down', 'fa-sort');
                    if (th.dataset.sort === sortColumn) {
                        icon.classList.add(sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down');
                        th.setAttribute('aria-sort', sortOrder === 'asc' ? 'ascending' : 'descending');
                    } else {
                        icon.classList.add('fa-sort');
                        th.setAttribute('aria-sort', 'none');
                    }
                }
            });
        }

        // Render Overall Stats Chart (Bar Chart for homepage)
        function renderOverallStatsChart(debaters) {
            console.log("Rendering Overall Stats Chart...");
            const ctx = document.getElementById('overallStatsChart');
            if (!ctx) return;

            if (overallStatsChartInstance) { // Destroy previous chart instance if it exists
                overallStatsChartInstance.destroy();
            }

            const tierCounts = debaters.reduce((acc, debater) => {
                acc[debater.tier] = (acc[debater.tier] || 0) + 1;
                return acc;
            }, {});

            overallStatsChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: Object.keys(tierCounts),
                    datasets: [
                        {
                            label: 'Debaters per Tier',
                            data: Object.values(tierCounts),
                            backgroundColor: ['#ffc107', '#6c757d', '#343a40'],
                            borderColor: ['#e0a800', '#5a6268', '#23272b'],
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Debaters Distribution by Tier',
                            font: { size: 16, family: 'Poppins' }
                        },
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1 },
                            grid: { display: false }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }

        function renderRecentMatches(matches) {
            console.log("Rendering Recent Matches...");
            const recentMatchesSection = document.getElementById('recentMatchesSection');
            if (!recentMatchesSection) return;

            let html = '';
            const sortedMatches = [...matches].sort((a, b) => {
                const dateA = a.date ? new Date(a.date) : 0;
                const dateB = b.date ? new Date(b.date) : 0;
                if (dateA && dateB) return dateB - dateA;
                return b.id.localeCompare(a.id);
            });

            sortedMatches.slice(0, 3).forEach(match => {
                html += `
                    <div class="col-lg-4 col-md-6 col-sm-12 animate__animated animate__fadeInUp">
                        <div class="card match-card">
                            <img src="${getSafeImagePath(match.image)}" class="match-img-16by9 card-img-top" alt="${match.debater1.name} vs ${match.debater2.name}" loading="lazy">
                            <div class="card-body text-center">
                                <h5 class="card-title fw-bold">
                                    ${match.country1_flag} <i class="fas fa-fist-raised mx-2" style="color:#FFD700;"></i> ${match.country2_flag}
                                </h5>
                                <div class="debater-info">
                                    <strong>${match.debater1.name} (${match.debater1.character})</strong> <span class="badge ${match.winner === match.debater1.name ? 'bg-success' : 'bg-danger'}">${match.winner === match.debater1.name ? 'WIN' : 'LOSS'}</span>
                                </div>
                                <div class="debater-info">
                                    <strong>${match.debater2.name} (${match.debater2.character})</strong> <span class="badge ${match.winner === match.debater2.name ? 'bg-success' : 'bg-danger'}">${match.winner === match.debater2.name ? 'WIN' : 'LOSS'}</span>
                                </div>
                                <small class="text-muted mt-2 d-block">Method: ${match.method} ${match.event ? `(Event: ${match.event})` : ''}</small>
                            </div>
                        </div>
                    </div>
                `;
            });
            recentMatchesSection.innerHTML = html;
        }

        function renderIndividualMatchHistory(debaters, matches) {
            console.log("Rendering Individual Match History...");
            const individualMatchHistorySection = document.getElementById('individualMatchHistory');
            if (!individualMatchHistorySection) return;

            let html = '';
            const debatersWithMatches = debaters.filter(d => matches.some(m => m.debater1.id === d.id || m.debater2.id === d.id)).slice(0,3);

            debatersWithMatches.forEach(debater => {
                const debaterMatches = matches.filter(match =>
                    match.debater1.id === debater.id || match.debater2.id === debater.id
                ).sort((a, b) => {
                    const dateA = a.date ? new Date(a.date) : 0;
                    const dateB = b.date ? new Date(b.date) : 0;
                    if (dateA && dateB) return dateB - dateA;
                    return b.id.localeCompare(a.id);
                });

                if (debaterMatches.length > 0) {
                    const latestMatch = debaterMatches[0];
                    const isWinner = latestMatch.winner === debater.name;
                    const opponent = latestMatch.debater1.id === debater.id ? latestMatch.debater2 : latestMatch.debater1;
                    const statusText = isWinner ? 'Win' : 'Loss';
                    const cardClass = isWinner ? 'win-card' : 'loss-card';
                    
                    const opponentDebater = debaters.find(d => d.id === opponent.id);
                    const opponentPhoto = getSafeImagePath(opponentDebater ? opponentDebater.photo : '');

                    html += `
                        <div class="col-md-6 animate__animated animate__fadeInUp">
                            <div class="card shadow ${cardClass}">
                                <div class="card-body d-flex align-items-center">
                                    <img src="${getSafeImagePath(debater.photo)}" class="me-3 rounded debater-thumbnail" alt="${debater.name}" loading="lazy">
                                    <div class="flex-grow-1">
                                        <h5 class="fw-bold">${debater.name} <img src="${getSafeImagePath(debater.flag)}" width="20" class="ms-1 flag-icon" alt="${debater.country_code}"></h5>
                                        <p class="mb-1">Record: <span class="badge ${debater.wins > debater.losses ? 'bg-success' : 'bg-danger'}">${debater.record}</span></p>
                                        <p class="mb-0">${statusText} vs ${opponent.name} [${latestMatch.method}]</p>
                                    </div>
                                    <img src="${opponentPhoto}" width="40" class="ms-3 rounded-circle" alt="${opponent.name}" loading="lazy">
                                </div>
                            </div>
                        </div>
                    `;
                }
            });
            individualMatchHistorySection.innerHTML = html;
        }

        // --- Event Listener Attachments ---

        function attachHomePageEventListeners(debaters, matches) {
            console.log("Attaching Home Page Event Listeners...");
            // Leaderboard Search & Filters
            const leaderboardSearchInput = document.getElementById('leaderboardSearch');
            const tierFilterSelect = document.getElementById('tierFilter');
            const countryFilterSelect = document.getElementById('countryFilter');

            const applyLeaderboardFilters = () => {
                console.log("Applying Leaderboard Filters via Event Listener.");
                const query = leaderboardSearchInput ? leaderboardSearchInput.value : '';
                const tier = tierFilterSelect ? tierFilterSelect.value : '';
                const country = countryFilterSelect ? countryFilterSelect.value : '';
                renderLeaderboard(debaters, query, tier, country, currentLeaderboardSort.column, currentLeaderboardSort.order);
            };

            if (leaderboardSearchInput) leaderboardSearchInput.addEventListener('keyup', applyLeaderboardFilters);
            if (tierFilterSelect) tierFilterSelect.addEventListener('change', applyLeaderboardFilters);
            if (countryFilterSelect) countryFilterSelect.addEventListener('change', applyLeaderboardFilters);

            // Debater Profile Search
            const debaterProfileSearchInput = document.getElementById('debaterProfileSearch');
            if (debaterProfileSearchInput) {
                debaterProfileSearchInput.addEventListener('keyup', (event) => {
                    renderDetailedProfiles(debaters, event.target.value);
                });
            }

            // Quick View Profile toggle description (re-attach because HTML is re-rendered)
            document.querySelectorAll('#quickViewProfiles .clickable-name').forEach(element => {
                element.addEventListener('click', () => {
                    const debaterId = element.dataset.debaterId;
                    const descElement = document.getElementById(`${debaterId}-desc`);
                    if (descElement) {
                        descElement.classList.toggle('show');
                        element.setAttribute('aria-expanded', descElement.classList.contains('show'));
                    }
                });
                element.addEventListener('keypress', (e) => { // For keyboard accessibility
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        element.click();
                    }
                });
            });

            // Leaderboard Sorting
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
        }

        // Attach event listeners for profile.html specific elements
        function attachProfilePageEventListeners(debaters, matches) {
            // No specific event listeners needed here other than chart rendering done directly in renderProfilePage
            // And back button handled by basic HTML link.
        }

        function attachComparePageEventListeners(debaters) {
            console.log("Attaching Compare Page Event Listeners...");
            const debaterSelect1 = document.getElementById('debaterSelect1');
            const debaterSelect2 = document.getElementById('debaterSelect2');

            const updateComparison = () => {
                const id1 = debaterSelect1.value;
                const id2 = debaterSelect2.value;

                const debater1 = debaters.find(d => d.id === id1);
                const debater2 = debaters.find(d => d.id === id2);

                if (id1 && id2 && id1 === id2) {
                    showToast('Please select two different debaters for comparison.', 'warning');
                    if (comparisonChartInstance) { // Destroy existing chart if same debaters chosen
                        comparisonChartInstance.destroy();
                        comparisonChartInstance = null;
                    }
                    document.getElementById('comparisonResults').innerHTML = `
                        <div class="col-12 text-center text-muted animate__animated animate__fadeIn">
                            <p><i class="fas fa-info-circle me-2"></i> Select two DIFFERENT debaters to compare their profiles.</p>
                        </div>
                    `;
                    return;
                }
                renderComparisonChart(debater1, debater2);
            };

            if (debaterSelect1) debaterSelect1.addEventListener('change', updateComparison);
            if (debaterSelect2) debaterSelect2.addEventListener('change', updateComparison);
        }

        function renderComparisonChart(debater1, debater2) {
            const comparisonResultsDiv = document.getElementById('comparisonResults');
            if (!comparisonResultsDiv) return;

            if (!debater1 || !debater2) {
                comparisonResultsDiv.innerHTML = `
                    <div class="col-12 text-center text-muted animate__animated animate__fadeIn">
                        <p><i class="fas fa-info-circle me-2"></i> Select two debaters above to compare their profiles.</p>
                    </div>
                `;
                return;
            }

            // Destroy previous chart instance if exists
            if (comparisonChartInstance) {
                comparisonChartInstance.destroy();
                comparisonChartInstance = null;
            }

            const labels = Object.keys(debater1.metrics);
            const data1 = Object.values(debater1.metrics).map(score => parseFloat(score));
            const data2 = Object.values(debater2.metrics).map(score => parseFloat(score));

            const comparisonHtml = `
                <div class="col-12 text-center animate__animated animate__fadeIn">
                    <h4 class="mb-4">Metrics Comparison</h4>
                    <div class="comparison-chart-container">
                        <canvas id="comparisonRadarChart" height="300"></canvas>
                    </div>
                </div>
                <div class="col-md-6 mt-4 debater-compare-card animate__animated animate__fadeInLeft">
                    <div class="card shadow p-3 h-100">
                        <img src="${getSafeImagePath(debater1.photo)}" class="profile-avatar mb-2" alt="${debater1.name}">
                        <h5>${debater1.name} <img src="${getSafeImagePath(debater1.flag)}" width="20" class="ms-1" alt="${debater1.country_code}"></h5>
                        <p class="mb-1">Record: <span class="badge ${debater1.wins > debater1.losses ? 'bg-success' : 'bg-danger'}">${debater1.record}</span></p>
                        <p class="text-muted"><i class="fas fa-percentage me-1"></i> Win Rate: ${((debater1.wins / (debater1.wins + debater1.losses)) * 100).toFixed(2)}%</p>
                        <hr>
                        <small><strong>Favorite Character:</strong> ${debater1.character}</small>
                    </div>
                </div>
                <div class="col-md-6 mt-4 debater-compare-card animate__animated animate__fadeInRight">
                    <div class="card shadow p-3 h-100">
                        <img src="${getSafeImagePath(debater2.photo)}" class="profile-avatar mb-2" alt="${debater2.name}">
                        <h5>${debater2.name} <img src="${getSafeImagePath(debater2.flag)}" width="20" class="ms-1" alt="${debater2.country_code}"></h5>
                        <p class="mb-1">Record: <span class="badge ${debater2.wins > debater2.losses ? 'bg-success' : 'bg-danger'}">${debater2.record}</span></p>
                        <p class="text-muted"><i class="fas fa-percentage me-1"></i> Win Rate: ${((debater2.wins / (debater2.wins + debater2.losses)) * 100).toFixed(2)}%</p>
                        <hr>
                        <small><strong>Favorite Character:</strong> ${debater2.character}</small>
                    </div>
                </div>
                <div class="col-12 mt-4 animate__animated animate__fadeInUp">
                    <h4 class="text-center mb-3">Head-to-Head Matches <i class="fas fa-handshake ms-2"></i></h4>
                    <div class="row g-3 profile-match-history" id="headToHeadMatches">
                        </div>
                </div>
            `;
            comparisonResultsDiv.innerHTML = comparisonHtml;

            // Render the radar chart
            const ctx = document.getElementById('comparisonRadarChart');
            if (ctx) {
                comparisonChartInstance = new Chart(ctx, {
                    type: 'radar',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: debater1.name,
                                data: data1,
                                backgroundColor: 'rgba(13, 110, 253, 0.2)', // Blue
                                borderColor: 'rgba(13, 110, 253, 1)',
                                borderWidth: 1,
                                pointBackgroundColor: 'rgba(13, 110, 253, 1)',
                                pointBorderColor: '#fff',
                                pointHoverBackgroundColor: '#fff',
                                pointHoverBorderColor: 'rgba(13, 110, 253, 1)'
                            },
                            {
                                label: debater2.name,
                                data: data2,
                                backgroundColor: 'rgba(255, 99, 132, 0.2)', // Red
                                borderColor: 'rgba(255, 99, 132, 1)',
                                borderWidth: 1,
                                pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                                pointBorderColor: '#fff',
                                pointHoverBackgroundColor: '#fff',
                                pointHoverBorderColor: 'rgba(255, 99, 132, 1)'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            r: {
                                angleLines: { display: false },
                                suggestedMin: 0,
                                suggestedMax: 10,
                                ticks: { stepSize: 2, backdropColor: 'transparent', color: '#6c757d' },
                                pointLabels: { color: '#212529', font: { size: 12 } },
                                grid: { color: 'rgba(0,0,0,0.1)' }
                            }
                        },
                        plugins: {
                            legend: { position: 'top' },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return context.dataset.label + ': ' + context.raw + '/10';
                                    }
                                }
                            }
                        },
                        elements: {
                            line: { tension: 0.2 }
                        }
                    }
                });
            }

            // Render head-to-head matches
            const headToHeadMatchesDiv = document.getElementById('headToHeadMatches');
            if (headToHeadMatchesDiv) {
                const h2hMatches = allMatchesData.filter(match =>
                    (match.debater1.id === debater1.id && match.debater2.id === debater2.id) ||
                    (match.debater1.id === debater2.id && match.debater2.id === debater1.id)
                ).sort((a, b) => {
                    const dateA = a.date ? new Date(a.date) : 0;
                    const dateB = b.date ? new Date(b.date) : 0;
                    if (dateA && dateB) return dateB - dateA;
                    return b.id.localeCompare(a.id);
                });

                let h2hHtml = '';
                if (h2hMatches.length > 0) {
                    h2hMatches.forEach(match => {
                        const winnerDebater = match.winner === debater1.name ? debater1 : debater2;
                        const loserDebater = match.winner === debater1.name ? debater2 : debater1;
                        
                        const winnerPhoto = getSafeImagePath(winnerDebater.photo);
                        const loserPhoto = getSafeImagePath(loserDebater.photo);

                        const matchDate = match.date ? new Date(match.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown Date';

                        h2hHtml += `
                            <div class="col-12">
                                <div class="card shadow p-3 mb-2 d-flex flex-row align-items-center animate__animated animate__fadeIn">
                                    <img src="${winnerPhoto}" width="50" class="rounded-circle me-3" alt="${winnerDebater.name}" loading="lazy">
                                    <div class="flex-grow-1">
                                        <h6 class="mb-1 fw-bold">${winnerDebater.name} <span class="badge bg-success">WIN</span> vs ${loserDebater.name}</h6>
                                        <small class="text-muted">Method: ${match.method} - Character: ${winnerDebater.character} vs ${loserDebater.character}</small><br>
                                        <small class="text-muted"><i class="fas fa-calendar-alt me-1"></i> Date: ${matchDate} ${match.event ? `(Event: ${match.event})` : ''}</small>
                                    </div>
                                    <img src="${loserPhoto}" width="50" class="rounded-circle ms-3" alt="${loserDebater.name}" loading="lazy">
                                </div>
                            </div>
                        `;
                    });
                } else {
                    h2hHtml = `<div class="col-12"><p class="text-center text-muted">No head-to-head matches found between ${debater1.name} and ${debater2.name}.</p></div>`;
                }
                headToHeadMatchesDiv.innerHTML = h2hHtml;
            }
        }

        // --- Router Logic (Initial Page Load and Hash Changes) ---
        function router() {
            console.log("Router activated. Current hash:", window.location.hash);
            const path = window.location.hash.slice(1) || 'home'; // Get path after # or default to 'home'
            const [route, id] = path.split('/');

            // Initial spinner is directly in index.html, no need to set here unless changing pages
            // Clear any previous chart instances
            if (overallStatsChartInstance) {
                overallStatsChartInstance.destroy();
                overallStatsChartInstance = null;
            }
            if (radarChartInstance) { // Destroy radar chart if it exists from profile page
                radarChartInstance.destroy();
                radarChartInstance = null;
            }
            if (comparisonChartInstance) {
                comparisonChartInstance.destroy();
                comparisonChartInstance = null;
            }
        
            // Fetch data (this is the only async part)
            fetchData().then(data => {
                if (!data) { // If fetchData failed, it already displayed an error. Just return.
                    console.error("Data not available, cannot render page.");
                    return;
                }

                // Determine which page to render
                if (route === 'home' || route === '') {
                    renderHomePage(data.debaters, data.matches);
                    showToast('Welcome to Debater Battle Arena!', 'info');
                } else if (route === 'profile' && id) {
                    renderProfilePage(id, data.debaters, data.matches);
                } else if (route === 'compare') {
                    renderComparePage(data.debaters);
                    showToast('Compare two debaters side-by-side!', 'info');
                }
                else {
                    setAppContent(`
                        <div class="container my-5 text-center text-danger animate__animated animate__fadeIn" role="alert">
                            <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                            <h2>Page Not Found!</h2>
                            <p>The page you are looking for does not exist.</p>
                            <a href="#home" class="btn btn-primary mt-3" aria-label="Back to Home page"><i class="fas fa-arrow-left me-2"></i> Back to Home</a>
                        </div>
                    `);
                    document.title = 'DBA - 404';
                    showToast('Page not found!', 'error');
                }
                console.log("Routing completed for route:", route);
            });
        }

        // Listen for hash changes (e.g., when clicking #links)
        window.addEventListener('hashchange', router);

        // Initial route load (called once when DOM is ready)
        router();
    });
    ```

---

### 4. `data.json` (File terpisah, sama persis seperti yang terakhir Anda berikan)

```json
{
  "debaters": [
    {
      "id": "hiroo",
      "name": "Hiroo",
      "country": "Indonesia",
      "country_code": "ID",
      "flag": "IMG_0417.png",
      "photo": "IMG_0385.jpeg",
      "record": "1 - 0",
      "wins": 1,
      "losses": 0,
      "tier": "Mid Tier",
      "character": "Jaehwan",
      "summary": "Hiroo is a great debater, known for his sharp arguments and quick retorts.",
      "bio": "Hiroo is known as a debater capable of turning the tide with unexpected arguments and profound analysis. This Jaehwan user is always ready to face any challenge in the arena.",
      "metrics": {
        "Rhetoric": 9,
        "Typing Structure": 9,
        "Critical Thinking": 10,
        "Logical Fallacies": 0,
        "Typing Strength": 9,
        "Tiering System": 8,
        "Calculations": 8,
        "Philosophy": 9,
        "General Knowledge": 10
      }
    },
    {
      "id": "zogratis",
      "name": "Zogratis",
      "country": "Indonesia",
      "country_code": "ID",
      "flag": "IMG_0417.png",
      "photo": "IMG_0402.jpeg",
      "record": "1 - 0",
      "wins": 1,
      "losses": 0,
      "tier": "High Tier",
      "character": "Ohmazio",
      "summary": "Zogratis is a tough debater, master of solid strategies and strong defense.",
      "bio": "Zogratis is a debater with a careful strategic approach. With Ohmazio as his character, he often dominates matches with thorough preparation and perfect argument execution.",
      "metrics": {
        "Rhetoric": 6,
        "Typing Structure": 5,
        "Critical Thinking": 7,
        "Logical Fallacies": 3,
        "Typing Strength": 5,
        "Tiering System": 6,
        "Calculations": 2,
        "Philosophy": 0,
        "General Knowledge": 7
      }
    },
    {
      "id": "aryanwt",
      "name": "Aryanwt",
      "country": "Indonesia",
      "country_code": "ID",
      "flag": "IMG_0417.png",
      "photo": "IMG_0388.jpeg",
      "record": "1 - 0",
      "wins": 1,
      "losses": 0,
      "tier": "Low Tier",
      "character": "Ha Dowan",
      "summary": "Aryanwt is a smart debater, known for sharp logic and creative solutions.",
      "bio": "Aryanwt brings a fresh perspective to every debate. Using Ha Dowan, he is known for his ability to present innovative solutions and attack opponents' arguments with undeniable logic.",
      "metrics": {
        "Rhetoric": 8,
        "Typing Structure": 7,
        "Critical Thinking": 9,
        "Logical Fallacies": 1,
        "Typing Strength": 7,
        "Tiering System": 9,
        "Calculations": 0,
        "Philosophy": 7,
        "General Knowledge": 10
      }
    },
    {
      "id": "renji",
      "name": "Renji",
      "country": "Malaysia",
      "country_code": "MY",
      "flag": "IMG_0418.png",
      "photo": "IMG_0462.jpeg",
      "record": "0 - 1",
      "wins": 0,
      "losses": 1,
      "tier": "Mid Tier",
      "character": "Sukuna",
      "summary": "Renji is a powerful debater, known for his persuasive and aggressive style.",
      "bio": "Renji shows potential in rhetoric, but still needs to improve several other technical aspects.",
      "metrics": {
        "Rhetoric": 3,
        "Typing Structure": 2,
        "Critical Thinking": 1,
        "Logical Fallacies": 0,
        "Typing Strength": 1,
        "Tiering System": 1,
        "Calculations": 0,
        "Philosophy": 0,
        "General Knowledge": 1
      }
    },
    {
      "id": "muchibei",
      "name": "Muchibei",
      "country": "Malaysia",
      "country_code": "MY",
      "flag": "IMG_0418.png",
      "photo": "IMG_0460.jpeg",
      "record": "0 - 1",
      "wins": 0,
      "losses": 1,
      "tier": "High Tier",
      "character": "Unicron",
      "summary": "Muchibei focuses on detail, but needs to hone his critical thinking.",
      "bio": "Muchibei is known for his attention to detail in every argument. As a Unicron user, he tries to leave no room for opponents, although sometimes opponent speed can be a challenge.",
      "metrics": {
        "Rhetoric": 5,
        "Typing Structure": 5,
        "Critical Thinking": 7,
        "Logical Fallacies": 2,
        "Typing Strength": 7,
        "Tiering System": 4,
        "Calculations": 4,
        "Philosophy": 0,
        "General Knowledge": 8
      }
    },
    {
      "id": "rim",
      "name": "Rim",
      "country": "Malaysia",
      "country_code": "MY",
      "flag": "IMG_0418.png",
      "photo": "IMG_0461.jpeg",
      "record": "0 - 1",
      "wins": 0,
      "losses": 1,
      "tier": "Low Tier",
      "character": "Izuru",
      "summary": "Rim shows flexibility, but needs to strengthen his understanding of Logical Fallacies and Calculations.",
      "bio": "Rim is an adaptive debater, capable of changing strategies in the middle of a battle. With Izuru as his character, he always looks for ways to find opponents' weaknesses, making him an unpredictable opponent.",
      "metrics": {
        "Rhetoric": 4,
        "Typing Structure": 5,
        "Critical Thinking": 4.5,
        "Logical Fallacies": 2,
        "Typing Strength": 3.5,
        "Tiering System": 4.3,
        "Calculations": 3.6,
        "Philosophy": 3,
        "General Knowledge": 7
      }
    }
  ],
  "matches": [
    {
      "id": "match1",
      "image": "5c6e6c7b-dc86-4ca3-a496-6b0d34eefa77.jpeg",
      "country1_flag": "🇮🇩",
      "country2_flag": "🇲🇾",
      "debater1": { "id": "zogratis", "name": "Zogratis", "character": "Ohmazio" },
      "debater2": { "id": "muchibei", "name": "Muchibei", "character": "Unicron" },
      "winner": "Zogratis",
      "method": "Decision Point",
      "date": "2025-06-15",
      "event": "Weekly Showdown"
    },
    {
      "id": "match2",
      "image": "16f4edc9-df34-4106-aa40-cecc9f3ad6e8.jpeg",
      "country1_flag": "🇮🇩",
      "country2_flag": "🇲🇾",
      "debater1": { "id": "aryanwt", "name": "Aryanwt", "character": "Ha Dowan" },
      "debater2": { "id": "rim", "name": "Rim", "character": "Izuru" },
      "winner": "Aryanwt",
      "method": "Decision Point",
      "date": "2025-06-10",
      "event": "Mid-Season Clash"
    },
    {
      "id": "match3",
      "image": "4ba98405-9174-4806-86b0-48db675ff249.jpeg",
      "country1_flag": "🇮🇩",
      "country2_flag": "🇲🇾",
      "debater1": { "id": "hiroo", "name": "Hiroo", "character": "Jaehwan" },
      "debater2": { "id": "renji", "name": "Renji", "character": "Sukuna" },
      "winner": "Hiroo",
      "method": "Limit Turn",
      "date": "2025-06-05",
      "event": "Opening Battle"
    }
  ]
}
