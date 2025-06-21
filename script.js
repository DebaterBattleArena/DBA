document.addEventListener('DOMContentLoaded', () => {
    let allDebatersData = []; // Store fetched debaters globally
    let allMatchesData = [];   // Store fetched matches globally
    let currentLeaderboardSort = { column: 'rank', order: 'asc' }; // Default sort for leaderboard
    let overallStatsChartInstance = null; // To store overall chart instance for destruction
    let comparisonChartInstance = null; // To store Chart.js instance for destruction

    // --- Utility Functions ---

    // Function to show a Bootstrap Toast notification
    function showToast(message, type = 'info') {
        const toastEl = document.getElementById('liveToast');
        const toastBody = document.getElementById('toastBody');
        if (!toastEl || !toastBody) return; // Guard against missing elements

        toastBody.textContent = message;

        toastEl.classList.remove('text-bg-primary', 'text-bg-success', 'text-bg-danger', 'text-bg-warning', 'text-bg-info');
        if (type === 'success') toastEl.classList.add('text-bg-success');
        else if (type === 'error') toastEl.classList.add('text-bg-danger');
        else if (type === 'warning') toastEl.classList.add('text-bg-warning');
        else if (type === 'info') toastEl.classList.add('text-bg-info');
        else toastEl.classList.add('text-bg-primary');

        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    }

    // Function to set content of the app-root div
    function setAppContent(contentHtml) {
        const appRoot = document.getElementById('app-root');
        if (appRoot) {
            appRoot.innerHTML = contentHtml;
        }
    }

    // --- Fetch Data Function (Now fetching data.json) ---
    async function fetchData() {
        try {
            // Adjust this path if data.json is in a subfolder (e.g., './data/data.json')
            const response = await fetch('data.json'); 
            if (!response.ok) {
                // Check for HTTP errors like 404
                const errorText = response.statusText ? response.statusText : `HTTP error! Status: ${response.status}`;
                throw new Error(`Failed to fetch data.json: ${errorText}`);
            }
            const data = await response.json();
            allDebatersData = data.debaters;
            allMatchesData = data.matches;
            showToast('Data loaded successfully!', 'success');
            return data;
        } catch (error) {
            console.error("Error fetching or parsing data.json:", error);
            showToast('Failed to load data! Please check data.json and local server.', 'error');
            setAppContent(`
                <div class="container my-5 text-center text-danger animate__animated animate__fadeIn" role="alert">
                    <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                    <h2>Failed to load data!</h2>
                    <p>Error: ${error.message}. Please ensure 'data.json' exists in the same folder and is valid JSON. You must run a local server (e.g., Live Server in VS Code) for this to work.</p>
                </div>
            `);
            return null; // Return null to indicate failure
        }
    }

    // --- Rendering Functions for various pages/sections ---

    function renderHomePage(debaters, matches) {
        const homePageHtml = `
            <div class="hero-image-container animate__animated animate__fadeIn">
              <img src="7745A053-1315-4B4D-AB24-9BFB05370A20.jpeg" alt="Debater Battle Arena Hero" loading="lazy">
            </div>

            <section class="container my-5">
              <h2 class="text-center mb-4 fw-bold text-uppercase animate__animated animate__fadeInDown">Top & Low Record Debaters <i class="fas fa-chart-line ms-2"></i></h2>
              <div class="row g-4" id="topLowRecordsSection">
                </div>
            </section>

            <hr class="my-5">

            <section class="container my-5">
              <h2 class="mb-4 text-center fw-bold text-uppercase animate__animated animate__fadeInDown">Debater Profiles (Quick View) <i class="fas fa-users ms-2"></i></h2>
              <div class="row g-4 justify-content-center" id="quickViewProfiles">
                </div>
            </section>

            <hr class="my-5">

            <section class="container my-5 debater-profile">
              <h2 class="text-center fw-bold text-uppercase mb-4 animate__animated animate__fadeInDown">Debater Profile Metrics <i class="fas fa-clipboard-list ms-2"></i></h2>
              
              <div class="mb-4 animate__animated animate__fadeIn">
                <input type="text" class="form-control" id="debaterProfileSearch" placeholder="Cari profil debater berdasarkan nama...">
              </div>

              <div class="row g-4" id="detailedProfilesSection">
                <div class="col-12 text-center text-muted animate__animated animate__fadeIn">
                  <p><i class="fas fa-search me-2"></i> Ketik nama debater di atas untuk melihat metrik profil lengkap mereka.</p>
                </div>
              </div>
            </section>

            <hr class="my-5">

            <section class="container my-5">
              <h2 class="text-center fw-bold text-uppercase mb-4 animate__animated animate__fadeInDown">Leaderboard Per Tier (DBA) <i class="fas fa-trophy ms-2"></i></h2>

              <div class="leaderboard-filters row mb-3 animate__animated animate__fadeIn">
                <div class="col-md-6 mb-2">
                  <input type="text" class="form-control" id="leaderboardSearch" placeholder="Cari debater di leaderboard...">
                </div>
                <div class="col-md-6 mb-2">
                  <select class="form-select" id="tierFilter">
                    <option value="">Filter by Tier</option>
                    <option value="High Tier">High Tier</option>
                    <option value="Mid Tier">Mid Tier</option>
                    <option value="Low Tier">Low Tier</option>
                  </select>
                </div>
                <div class="col-md-6 mb-2">
                  <select class="form-select" id="countryFilter">
                    <option value="">Filter by Country</option>
                    ${[...new Set(debaters.map(d => d.country))].map(country => `<option value="${country}">${country}</option>`).join('')}
                  </select>
                </div>
                <div class="col-md-6 mb-2">
                    <canvas id="overallStatsChart" height="100" aria-label="Overall Debater Statistics Chart"></canvas>
                </div>
              </div>

              <div class="mb-5">
                <h3 class="text-white bg-warning text-center py-2 rounded-top animate__animated animate__fadeInLeft">High Tier <i class="fas fa-star ms-2"></i></h3>
                <div class="table-responsive animate__animated animate__fadeInUp">
                  <table class="table table-bordered table-striped text-center align-middle" aria-label="High Tier Leaderboard">
                    <thead class="table-dark">
                      <tr>
                        <th data-sort="rank" role="columnheader" aria-sort="none">Rank <i class="fas fa-sort sort-icon"></i></th>
                        <th role="columnheader">Photo</th>
                        <th data-sort="name" role="columnheader">Name <i class="fas fa-sort sort-icon"></i></th>
                        <th data-sort="country" role="columnheader">Country <i class="fas fa-sort sort-icon"></i></th>
                        <th data-sort="wins" role="columnheader">Record <i class="fas fa-sort sort-icon"></i></th>
                      </tr>
                    </thead>
                    <tbody id="highTierBody">
                      </tbody>
                  </table>
                </div>
              </div>

              <div class="mb-5">
                <h3 class="text-white bg-secondary text-center py-2 rounded-top animate__animated animate__fadeInLeft">Mid Tier <i class="fas fa-trophy ms-2"></i></h3>
                <div class="table-responsive animate__animated animate__fadeInUp">
                  <table class="table table-bordered table-striped text-center align-middle" aria-label="Mid Tier Leaderboard">
                    <thead class="table-dark">
                      <tr>
                        <th data-sort="rank" role="columnheader">Rank <i class="fas fa-sort sort-icon"></i></th>
                        <th role="columnheader">Photo</th>
                        <th data-sort="name" role="columnheader">Name <i class="fas fa-sort sort-icon"></i></th>
                        <th data-sort="country" role="columnheader">Country <i class="fas fa-sort sort-icon"></i></th>
                        <th data-sort="wins" role="columnheader">Record <i class="fas fa-sort sort-icon"></i></th>
                      </tr>
                    </thead>
                    <tbody id="midTierBody">
                          </tbody>
                      </table>
                    </div>
                  </div>

                  <div class="mb-5">
                    <h3 class="text-white bg-dark text-center py-2 rounded-top animate__animated animate__fadeInLeft">Low Tier <i class="fas fa-medal ms-2"></i></h3>
                    <div class="table-responsive animate__animated animate__fadeInUp">
                      <table class="table table-bordered table-striped text-center align-middle" aria-label="Low Tier Leaderboard">
                        <thead class="table-dark">
                          <tr>
                            <th data-sort="rank" role="columnheader">Rank <i class="fas fa-sort sort-icon"></i></th>
                            <th role="columnheader">Photo</th>
                            <th data-sort="name" role="columnheader">Name <i class="fas fa-sort sort-icon"></i></th>
                            <th data-sort="country" role="columnheader">Country <i class="fas fa-sort sort-icon"></i></i></th>
                            <th data-sort="wins" role="columnheader">Record <i class="fas fa-sort sort-icon"></i></th>
                          </tr>
                        </thead>
                        <tbody id="lowTierBody">
                          </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                <hr class="my-5">

                <section class="container my-5 recent-matches-section rounded shadow">
                  <h2 class="text-center mb-5 fw-bold text-uppercase animate__animated animate__fadeInDown">Recent Matches <i class="fas fa-fire ms-2"></i></h2>
                  <div class="row g-4 justify-content-center" id="recentMatchesSection">
                    </div>
                </section>

                <hr class="my-5">

                <section class="container my-5 individual-match-history">
                  <h2 class="text-center mb-4 fw-bold text-uppercase animate__animated animate__fadeInDown">Individual Match History <i class="fas fa-history ms-2"></i></h2>
                  <div class="row g-3" id="individualMatchHistory">
                    </div>
                </section>
            `;
            setAppContent(homePageHtml);

            renderTopLowRecords(debaters);
            renderQuickViewProfiles(debaters);
            renderDetailedProfiles(debaters, ''); // Initialize empty
            renderLeaderboard(debaters, '', '', '', currentLeaderboardSort.column, currentLeaderboardSort.order); // Initial call
            renderOverallStatsChart(debaters); // Render chart
            renderRecentMatches(matches);
            renderIndividualMatchHistory(debaters, matches);

            // Re-attach event listeners as DOM elements are newly created
            attachHomePageEventListeners(debaters, matches);
        }

        function renderProfilePage(debaterId, debaters, matches) {
            const debater = debaters.find(d => d.id === debaterId);

            if (!debater) {
                setAppContent(`
                    <div class="container my-5 text-center text-danger animate__animated animate__fadeIn" role="alert">
                        <i class="fas fa-user-times fa-3x mb-3"></i>
                        <h2>Debater Not Found!</h2>
                        <p>The profile you are looking for does not exist.</p>
                        <a href="#home" class="btn btn-primary mt-3" aria-label="Back to Home page"><i class="fas fa-arrow-left me-2"></i> Back to Home</a>
                    </div>
                `);
                document.title = 'DBA - Not Found';
                showToast('Debater profile not found!', 'error');
                return;
            }

            document.title = `DBA - ${debater.name}'s Profile`;

            let metricsHtml = '';
            const metricLabels = [];
            const metricScores = [];
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
                metricLabels.push(metricName);
                metricScores.push(parseFloat(metricScore));
            }

            const winRate = ((debater.wins / (debater.wins + debater.losses)) * 100).toFixed(2);
            const totalMatches = debater.wins + debater.losses;
            const averageMetric = (metricScores.reduce((sum, score) => sum + score, 0) / metricScores.length).toFixed(2);

            const profilePageHtml = `
                <section class="container my-5">
                    <div class="row justify-content-center">
                        <div class="col-lg-8">
                            <div class="card shadow p-4 animate__animated animate__fadeIn">
                                <div class="text-center">
                                    <img src="${debater.photo}" class="profile-avatar mb-3 animate__animated animate__zoomIn" alt="${debater.name} Profile" loading="lazy">
                                    <h2 class="profile-name animate__animated animate__fadeInDown">${debater.name} <img src="${debater.flag}" width="30" class="ms-2" alt="${debater.country_code}"/></h2>
                                    <p class="profile-record animate__animated animate__fadeIn">Record: <span class="badge ${debater.wins > debater.losses ? 'bg-success' : 'bg-danger'}">${debater.record}</span></p>
                                    <p class="text-muted"><i class="fas fa-percentage me-1"></i> Win Rate: ${winRate}% | <i class="fas fa-gamepad me-1"></i> Total Matches: ${totalMatches}</p>
                                    <p class="text-muted"><i class="fas fa-star-half-alt me-1"></i> Average Metric Score: ${averageMetric}/10</p>
                                </div>
                                <hr class="my-4">
                                <div class="profile-metrics mb-4 animate__animated animate__fadeInUp">
                                    <h4 class="text-center mb-3">Key Metrics <i class="fas fa-chart-bar ms-2"></i></h4>
                                    <div class="row">
                                        <div class="col-md-8 mx-auto">
                                            ${metricsHtml}
                                            <canvas id="radarChart" height="250" aria-label="${debater.name} Metrics Radar Chart"></canvas>
                                        </div>
                                    </div>
                                </div>
                                <hr class="my-4">
                                <div class="profile-detail animate__animated animate__fadeInUp">
                                    <h4 class="text-center mb-3">About ${debater.name} <i class="fas fa-info-circle ms-2"></i></h4>
                                    <p><strong>Country:</strong> ${debater.country}</p>
                                    <p><strong>Favorite Character:</strong> ${debater.character}</p>
                                    <p><strong>Bio:</strong> ${debater.bio}</p>
                                </div>
                                <hr class="my-4">
                                <h4 class="text-center mb-3 animate__animated animate__fadeInUp">Match History <i class="fas fa-fist-raised ms-2"></i></h4>
                                <div class="row g-3 profile-match-history" id="individualFullMatchHistory">
                                    </div>
                                <div class="text-center mt-4">
                                    <a href="#home" class="btn btn-outline-primary" aria-label="Back to Home page"><i class="fas fa-arrow-left me-2"></i> Back to Home</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            `;
            setAppContent(profilePageHtml);

            // Render Radar Chart
            const ctxRadar = document.getElementById('radarChart');
            if (ctxRadar) {
                new Chart(ctxRadar, {
                    type: 'radar',
                    data: {
                        labels: metricLabels,
                        datasets: [{
                            label: 'Debater Metrics',
                            data: metricScores,
                            backgroundColor: 'rgba(13, 110, 253, 0.2)',
                            borderColor: 'rgba(13, 110, 253, 1)',
                            borderWidth: 1,
                            pointBackgroundColor: 'rgba(13, 110, 253, 1)',
                            pointBorderColor: '#fff',
                            pointHoverBackgroundColor: '#fff',
                            pointHoverBorderColor: 'rgba(13, 110, 253, 1)'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            r: {
                                angleLines: { display: false },
                                suggestedMin: 0,
                                suggestedMax: 10,
                                ticks: {
                                    stepSize: 2,
                                    backdropColor: 'transparent',
                                    color: '#6c757d'
                                },
                                pointLabels: {
                                    color: '#212529',
                                    font: { size: 12 }
                                },
                                grid: { color: 'rgba(0,0,0,0.1)' }
                            }
                        },
                        plugins: {
                            legend: { display: false },
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


            // Render full match history for the specific debater
            const individualFullMatchHistorySection = document.getElementById('individualFullMatchHistory');
            if (individualFullMatchHistorySection) {
                const debaterMatches = matches.filter(match =>
                    match.debater1.id === debater.id || match.debater2.id === debater.id
                ).sort((a, b) => {
                    const dateA = a.date ? new Date(a.date) : 0;
                    const dateB = b.date ? new Date(b.date) : 0;
                    if (dateA && dateB) return dateB - dateA;
                    return b.id.localeCompare(a.id);
                });

                let matchesHtml = '';
                if (debaterMatches.length > 0) {
                    debaterMatches.forEach(match => {
                        const isWinner = match.winner === debater.name;
                        const opponent = match.debater1.id === debater.id ? match.debater2 : match.debater1;
                        const statusBadgeClass = isWinner ? 'bg-success' : 'bg-danger';
                        const statusText = isWinner ? 'WIN' : 'LOSS';
                        const cardBackgroundClass = isWinner ? 'win-card' : 'loss-card';
                        
                        const opponentDebater = debaters.find(d => d.id === opponent.id);
                        const opponentPhoto = opponentDebater ? opponentDebater.photo : 'default_avatar.png';
                        const matchDate = match.date ? new Date(match.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown Date';

                        matchesHtml += `
                            <div class="col-md-12">
                                <div class="card shadow p-3 mb-2 d-flex flex-row align-items-center ${cardBackgroundClass} animate__animated animate__fadeIn">
                                    <img src="${debater.photo}" width="50" class="rounded-circle me-3" alt="${debater.name}" loading="lazy">
                                    <div class="flex-grow-1">
                                        <h6 class="mb-1 fw-bold">${debater.name} <span class="badge ${statusBadgeClass}">${statusText}</span> vs ${opponent.name}</h6>
                                        <small class="text-muted">Method: ${match.method} - Character: ${debater.character} vs ${opponent.character}</small><br>
                                        <small class="text-muted"><i class="fas fa-calendar-alt me-1"></i> Date: ${matchDate} ${match.event ? `(Event: ${match.event})` : ''}</small>
                                    </div>
                                    <img src="${opponentPhoto}" width="50" class="rounded-circle ms-3" alt="${opponent.name}" loading="lazy">
                                </div>
                            </div>
                        `;
                    });
                } else {
                    matchesHtml = `<div class="col-12"><p class="text-center text-muted">No match history available for this debater.</p></div>`;
                }
                individualFullMatchHistorySection.innerHTML = matchesHtml;
            }
        }

        function renderComparePage(debaters) {
            const comparePageHtml = `
                <section class="container my-5 animate__animated animate__fadeIn">
                    <h2 class="text-center mb-4 fw-bold text-uppercase">Compare Debaters <i class="fas fa-balance-scale-right ms-2"></i></h2>
                    <div class="row justify-content-center mb-4">
                        <div class="col-md-5">
                            <select class="form-select mb-2" id="debaterSelect1" aria-label="Select first debater">
                                <option value="">Select Debater 1</option>
                                ${debaters.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="col-md-1 d-flex align-items-center justify-content-center">
                            <i class="fas fa-times vs-icon"></i>
                        </div>
                        <div class="col-md-5">
                            <select class="form-select mb-2" id="debaterSelect2" aria-label="Select second debater">
                                <option value="">Select Debater 2</option>
                                ${debaters.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="row" id="comparisonResults">
                        <div class="col-12 text-center text-muted animate__animated animate__fadeIn">
                            <p><i class="fas fa-info-circle me-2"></i> Select two debaters above to compare their profiles.</p>
                        </div>
                    </div>
                </section>
            `;
            setAppContent(comparePageHtml);
            attachComparePageEventListeners(debaters);
        }

        // --- Specific Section Renderers (used by renderHomePage) ---

        function renderTopLowRecords(debaters) {
            const topLowRecordsSection = document.getElementById('topLowRecordsSection');
            if (!topLowRecordsSection) return;

            const sortedDebaters = [...debaters].sort((a, b) => {
                const winRateA = (a.wins + a.losses) > 0 ? a.wins / (a.wins + a.losses) : 0;
                const winRateB = (b.wins + b.losses) > 0 ? b.wins / (b.wins + b.losses) : 0;
                if (winRateA !== winRateB) return winRateB - winRateA;
                return (b.wins + b.losses) - (a.wins + a.losses);
            });

            const top3 = sortedDebaters.slice(0, 3);
            const low3StartIndex = Math.max(0, sortedDebaters.length - 3);
            // Filter out any debaters from low3 that are also in top3 (edge case with few debaters)
            const low3 = sortedDebaters.slice(low3StartIndex).filter(d => !top3.some(t => t.id === d.id)).reverse();

            let html = `
                <div class="col-md-6">
                    <h3 class="mb-3 text-success">Top Record Debaters DBA <i class="fas fa-crown ms-2"></i></h3>
                    <div class="row g-3">
            `;
            top3.forEach(debater => {
                html += `
                    <div class="col-md-4">
                        <div class="card shadow h-100 animate__animated animate__fadeInUp" role="button" aria-label="View ${debater.name}'s profile" onclick="window.location.hash='#profile/${debater.id}'">
                            <div class="card-body">
                                <h4 class="card-title">${debater.name} <img src="${debater.flag}" width="24" class="ms-2" alt="${debater.country_code}"/></h4>
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
                        <div class="card shadow h-100 animate__animated animate__fadeInUp" role="button" aria-label="View ${debater.name}'s profile" onclick="window.location.hash='#profile/${debater.id}'">
                            <div class="card-body">
                                <h4 class="card-title">${debater.name} <img src="${debater.flag}" width="24" class="ms-2" alt="${debater.country_code}"/></h4>
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

        // --- Event Listener Attachments ---

        function attachHomePageEventListeners(debaters, matches) {
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

            // Debater Profile Search
            const debaterProfileSearchInput = document.getElementById('debaterProfileSearch');
            if (debaterProfileSearchInput) {
                debaterProfileSearchInput.addEventListener('keyup', (event) => {
                    renderDetailedProfiles(debaters, event.target.value);
                });
            }

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

        function attachComparePageEventListeners(debaters) {
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


        // --- Router Logic ---
        function router() {
            const path = window.location.hash.slice(1) || 'home';
            const [route, id] = path.split('/');

            // Show spinner while loading content, only if we are changing "pages"
            const appRoot = document.getElementById('app-root');
            if (appRoot) {
                appRoot.innerHTML = `
                    <div class="container d-flex justify-content-center align-items-center" style="min-height: 80vh;">
                        <div class="text-center">
                            <div class="spinner-border text-primary" role="status" aria-hidden="true">
                                <span class="visually-hidden">Loading content...</span>
                            </div>
                            <p class="mt-3" role="status">Loading content...</p>
                        </div>
                    </div>
                `;
            }
        
            // This is where we fetch the data.
            fetchData().then(data => {
                if (!data) { // If fetchData failed, it already displayed an error. Just return.
                    return;
                }

                // Render based on route
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
            });
        }

        // Listen for hash changes (e.g., when clicking #links)
        window.addEventListener('hashchange', router);

        // Initial route load
        router();
    });
    ```

---

**4. `data.json` (File terpisah yang akan dibaca oleh `fetch`, `Newbie One` sudah dihapus)**

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
