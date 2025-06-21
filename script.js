document.addEventListener('DOMContentLoaded', () => {
    let allDebatersData = []; // Global variable to store debater data
    let allMatchesData = [];   // Global variable to store match data
    let currentLeaderboardSort = { column: 'rank', order: 'asc' }; // Sort state for leaderboard
    let overallStatsChartInstance = null; // Chart.js instance for overall stats on homepage
    let radarChartInstance = null; // Chart.js instance for radar chart on profile page
    let comparisonChartInstance = null; // Chart.js instance for comparison chart


    // --- Utility Functions ---

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

    function setAppRootContent(contentHtml) {
        const appRoot = document.getElementById('app-root');
        if (appRoot) {
            appRoot.innerHTML = contentHtml;
        }
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
                throw new Error(`Failed to fetch data.json: ${errorDetail}.`);
            }
            const data = await response.json();
            allDebatersData = data.debaters;
            allMatchesData = data.matches;
            console.log("Data loaded successfully:", allDebatersData, allMatchesData);
            showToast('Data loaded successfully!', 'success');
            return data;
        } catch (error) {
            console.error("Critical error loading data:", error);
            showToast('Failed to load application data! Please check console and data.json.', 'error');
            setAppRootContent(`
                <div class="container my-5 text-center text-danger animate__animated animate__fadeIn" role="alert">
                    <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                    <h2>Failed to Load Application Data!</h2>
                    <p>Error: ${error.message}</p>
                    <p>Please ensure 'data.json' exists in the same folder and is valid JSON. Also, verify you are running a local web server (e.g., Live Server in VS Code).</p>
                </div>
            `);
            return null;
        }
    }

    // --- Page Rendering Functions ---

    function renderHomePageContent(debaters, matches) {
        console.log("Rendering Home Page Content...");
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
        setAppRootContent(contentHtml); // Set content to app-root

        // Now that elements are in DOM, call specific renderers
        renderTopLowRecords(debaters);
        renderQuickViewProfiles(debaters);
        renderDetailedProfiles(debaters, ''); // Initialize empty search
        renderLeaderboard(debaters, '', '', '', currentLeaderboardSort.column, currentLeaderboardSort.order);
        renderOverallStatsChart(debaters);
        renderRecentMatches(matches);
        renderIndividualMatchHistory(debaters, matches);

        // Attach all event listeners for Home Page elements
        attachHomePageEventListeners(debaters, matches);
        console.log("Home Page Rendered and Event Listeners Attached.");
    }

    // This function renders the content for a PROFILE page
    function renderProfilePageContent(debaterId, debaters, matches) {
        console.log(`Rendering Profile Page Content for ID: ${debaterId}`); // Debugging
        const debater = debaters.find(d => d.id === debaterId);

        if (!debater) {
            setAppRootContent(`
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
                                <img src="${getSafeImagePath(debater.photo)}" class="profile-avatar mb-3 animate__animated animate__zoomIn" alt="${debater.name} Profile" loading="lazy">
                                <h2 class="profile-name animate__animated animate__fadeInDown">${debater.name} <img src="${getSafeImagePath(debater.flag)}" width="30" class="ms-2" alt="${debater.country_code}"/></h2>
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
                </section>
            `;
            setAppRootContent(profilePageHtml);

            // Destroy existing chart instances from other pages/sections
            if (overallStatsChartInstance) {
                overallStatsChartInstance.destroy();
                overallStatsChartInstance = null;
            }
            if (radarChartInstance) { // Destroy previous radar chart instance if it exists
                radarChartInstance.destroy();
                radarChartInstance = null;
            }
            if (comparisonChartInstance) {
                comparisonChartInstance.destroy();
                comparisonChartInstance = null;
            }
            
            // Render Radar Chart
            const ctxRadar = document.getElementById('radarChart');
            if (ctxRadar) {
                radarChartInstance = new Chart(ctxRadar, { // Store instance in radarChartInstance
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
                    matchesHtml = '<div class="col-12"><p class="text-center text-muted">Loading matches...</p></div>'; // Temp message
                    // Using a small timeout to ensure canvas rendering has started if needed
                    setTimeout(() => { 
                        matchesHtml = ''; // Clear temp message
                        debaterMatches.forEach(match => {
                            const isWinner = match.winner === debater.name;
                            const opponent = match.debater1.id === debater.id ? match.debater2 : match.debater1;
                            const statusBadgeClass = isWinner ? 'bg-success' : 'bg-danger';
                            const statusText = isWinner ? 'WIN' : 'LOSS';
                            const cardBackgroundClass = isWinner ? 'win-card' : 'loss-card';
                            
                            const opponentDebater = debaters.find(d => d.id === opponent.id);
                            const opponentPhoto = getSafeImagePath(opponentDebater ? opponentDebater.photo : '');
                            const matchDate = match.date ? new Date(match.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown Date';

                            matchesHtml += `
                                <div class="col-md-12">
                                    <div class="card shadow p-3 mb-2 d-flex flex-row align-items-center ${cardBackgroundClass} animate__animated animate__fadeIn">
                                        <img src="${getSafeImagePath(debater.photo)}" width="50" class="rounded-circle me-3" alt="${debater.name}" loading="lazy">
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
                        individualFullMatchHistorySection.innerHTML = matchesHtml;
                    }, 50); // Small delay to allow initial render
                } else {
                    matchesHtml = `<div class="col-12"><p class="text-center text-muted">No match history available for this debater.</p></div>`;
                    individualFullMatchHistorySection.innerHTML = matchesHtml;
                }
            }
        }

        function renderComparePageContent(debaters) {
            console.log("Rendering Compare Page Content..."); // Debugging
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
            setAppRootContent(comparePageHtml);
            attachComparePageEventListeners(debaters);
            // Destroy existing chart instances from other pages/sections
            if (overallStatsChartInstance) {
                overallStatsChartInstance.destroy();
                overallStatsChartInstance = null;
            }
            if (radarChartInstance) {
                radarChartInstance.destroy();
                radarChartInstance = null;
            }
        }

        // --- Specific Section Renderers (for homepage sections) ---

        function renderTopLowRecords(debaters) {
            console.log("Rendering Top & Low Records section..."); // Debugging
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
                        <div class="card shadow h-100 animate__animated animate__fadeInUp" role="button" aria-label="View ${debater.name}'s profile" onclick="window.location.hash='#profile/${debater.id}'">
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

        function renderQuickViewProfiles(debaters) {
            console.log("Rendering Quick View Profiles section..."); // Debugging
            const quickViewProfilesSection = document.getElementById('quickViewProfiles');
            if (!quickViewProfilesSection) return;

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
        }

        function renderDetailedProfiles(allDebaters, filterQuery = '') {
            console.log("Rendering Detailed Profiles section with query:", filterQuery); // Debugging
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
                                    <a href="#profile/${debater.id}" class="text-decoration-none">${debater.name}</a>
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

        function renderLeaderboard(debaters, query = '', filterTier = '', filterCountry = '', sortColumn = 'rank', sortOrder = 'asc') {
            console.log("Rendering Leaderboard section with query:", query, "tier:", filterTier, "country:", filterCountry, "sort:", sortColumn, sortOrder); // Debugging
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
                                <td><a href="#profile/${debater.id}" class="text-decoration-none">${debater.name}</a></td>
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
                        th.classList.add('sortable'); // Add a class for sortable headers
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
                overallStatsChartInstance = null;
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
            console.log("Rendering Recent Matches section...");
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
            console.log("Rendering Individual Match History section..."); // Debugging
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
                                        <h5 class="fw-bold">${debater.name} <img src="${getSafeImagePath(debater.flag)}" width="20" class="ms-1" alt="${debater.country_code}"></h5>
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

        // --- Event Listener Attachments (for homepage sections) ---

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
            console.log("Attaching Profile Page Event Listeners...");
            // No specific event listeners needed here other than chart rendering done directly in renderProfilePage
            // And back button handled by basic HTML link.
        }

        function attachComparePageEventListeners(debaters) {
            console.log("Attaching Compare Page Event Listeners...");
            const debaterSelect1 = document.getElementById('debaterSelect1');
            const debaterSelect2 = document.getElementById('debaterSelect2');

            const updateComparison = () => {
                const id1 = debaterSelect1.value;
                const id2 = debater2.value; // Corrected ID variable
                
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

            // Destroy previous chart instance if exists
            if (comparisonChartInstance) {
                comparisonChartInstance.destroy();
                comparisonChartInstance = null;
            }

            if (!debater1 || !debater2) {
                comparisonResultsDiv.innerHTML = `
                    <div class="col-12 text-center text-muted animate__animated animate__fadeIn">
                        <p><i class="fas fa-info-circle me-2"></i> Select two debaters above to compare their profiles.</p>
                    </div>
                `;
                return;
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
                        const winnerDebater = allDebatersData.find(d => d.name === match.winner); // Get full debater object
                        const loserDebaterId = match.winner === match.debater1.name ? match.debater2.id : match.debater1.id;
                        const loserDebater = allDebatersData.find(d => d.id === loserDebaterId);

                        const winnerPhoto = getSafeImagePath(winnerDebater ? winnerDebater.photo : '');
                        const loserPhoto = getSafeImagePath(loserDebater ? loserDebater.photo : '');

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

            // Clear any previous chart instances when routing changes
            if (overallStatsChartInstance) {
                overallStatsChartInstance.destroy();
                overallStatsChartInstance = null;
            }
            if (radarChartInstance) {
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
                    renderHomePageContent(data.debaters, data.matches);
                    showToast('Welcome to Debater Battle Arena!', 'info');
                } else if (route === 'profile' && id) {
                    renderProfilePageContent(id, data.debaters, data.matches);
                } else if (route === 'compare') {
                    renderComparePageContent(data.debaters);
                    showToast('Compare two debaters side-by-side!', 'info');
                }
                else {
                    setAppRootContent(`
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
