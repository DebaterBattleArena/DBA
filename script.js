document.addEventListener('DOMContentLoaded', () => {
    let allDebatersData = [];
    let allMatchesData = [];
    let currentLeaderboardSort = { column: 'rank', order: 'asc' }; // Default sort for leaderboard
    let comparisonChartInstance = null; // To store Chart.js instance for destruction

    // --- Utility Functions ---

    /**
     * Shows a Bootstrap Toast notification.
     * @param {string} message - The message to display.
     * @param {string} type - The type of toast (e.g., 'success', 'error', 'warning', 'info').
     */
    function showToast(message, type = 'info') {
        const toastEl = document.getElementById('liveToast');
        const toastBody = document.getElementById('toastBody');
        toastBody.textContent = message;

        // Remove all existing text-bg classes to ensure only one is applied
        toastEl.classList.remove('text-bg-primary', 'text-bg-success', 'text-bg-danger', 'text-bg-warning', 'text-bg-info');

        // Set toast background color based on type
        switch (type) {
            case 'success': toastEl.classList.add('text-bg-success'); break;
            case 'error': toastEl.classList.add('text-bg-danger'); break;
            case 'warning': toastEl.classList.add('text-bg-warning'); break;
            case 'info': toastEl.classList.add('text-bg-info'); break;
            default: toastEl.classList.add('text-bg-primary'); break; // Default
        }

        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    }

    /**
     * Fetches data from data.json.
     * @returns {Promise<Object|null>} The fetched data or null if an error occurred.
     */
    async function fetchData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            allDebatersData = data.debaters;
            allMatchesData = data.matches;
            showToast('Data loaded successfully!', 'success');
            return data;
        } catch (error) {
            console.error("Error fetching data:", error);
            showToast('Failed to load data! Check console for details.', 'error');
            setAppContent(`
                <div class="container my-5 text-center text-danger animate__animated animate__fadeIn">
                    <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                    <h2>Failed to load data!</h2>
                    <p>Please check if 'data.json' exists and is valid.</p>
                </div>
            `);
            return null;
        }
    }

    /**
     * Sets the content of the app-root div.
     * @param {string} contentHtml - The HTML string to set as content.
     */
    function setAppContent(contentHtml) {
        const appRoot = document.getElementById('app-root');
        if (appRoot) {
            appRoot.innerHTML = contentHtml;
        }
    }

    /**
     * Fallback for broken images.
     * @param {HTMLElement} imgElement - The image element that failed to load.
     */
    function onImageError(imgElement) {
        imgElement.onerror = null; // Prevent infinite loop if fallback also fails
        imgElement.src = 'assets/default_avatar.png'; // Path to a default avatar image
        imgElement.alt = 'Default Avatar';
    }

    // --- Rendering Functions for various pages/sections ---

    /**
     * Renders the home page with various sections.
     * @param {Array<Object>} debaters - Array of debater data.
     * @param {Array<Object>} matches - Array of match data.
     */
    function renderHomePage(debaters, matches) {
        const homePageHtml = `
            <div class="hero-image-container animate__animated animate__fadeIn">
              <img src="7745A053-1315-4B4D-AB24-9BFB05370A20.jpeg" alt="Debater Battle Arena Hero Image" loading="lazy" onerror="onImageError(this)">
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
                    <canvas id="overallStatsChart" height="100"></canvas>
                </div>
              </div>

              <div class="mb-5">
                <h3 class="text-white bg-warning text-center py-2 rounded-top animate__animated animate__fadeInLeft">High Tier <i class="fas fa-star ms-2"></i></h3>
                <div class="table-responsive animate__animated animate__fadeInUp">
                  <table class="table table-bordered table-striped text-center align-middle" aria-label="High Tier Leaderboard">
                    <thead class="table-dark">
                      <tr>
                        <th data-sort="rank" role="columnheader" aria-sort="${currentLeaderboardSort.column === 'rank' ? currentLeaderboardSort.order : 'none'}">Rank <i class="fas fa-sort sort-icon"></i></th>
                        <th role="columnheader">Photo</th>
                        <th data-sort="name" role="columnheader" aria-sort="${currentLeaderboardSort.column === 'name' ? currentLeaderboardSort.order : 'none'}">Name <i class="fas fa-sort sort-icon"></i></th>
                        <th data-sort="country" role="columnheader" aria-sort="${currentLeaderboardSort.column === 'country' ? currentLeaderboardSort.order : 'none'}">Country <i class="fas fa-sort sort-icon"></i></th>
                        <th data-sort="wins" role="columnheader" aria-sort="${currentLeaderboardSort.column === 'wins' ? currentLeaderboardSort.order : 'none'}">Record <i class="fas fa-sort sort-icon"></i></th>
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
                        <th data-sort="rank" role="columnheader" aria-sort="${currentLeaderboardSort.column === 'rank' ? currentLeaderboardSort.order : 'none'}">Rank <i class="fas fa-sort sort-icon"></i></th>
                        <th role="columnheader">Photo</th>
                        <th data-sort="name" role="columnheader" aria-sort="${currentLeaderboardSort.column === 'name' ? currentLeaderboardSort.order : 'none'}">Name <i class="fas fa-sort sort-icon"></i></th>
                        <th data-sort="country" role="columnheader" aria-sort="${currentLeaderboardSort.column === 'country' ? currentLeaderboardSort.order : 'none'}">Country <i class="fas fa-sort sort-icon"></i></th>
                        <th data-sort="wins" role="columnheader" aria-sort="${currentLeaderboardSort.column === 'wins' ? currentLeaderboardSort.order : 'none'}">Record <i class="fas fa-sort sort-icon"></i></th>
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
                        <th data-sort="rank" role="columnheader" aria-sort="${currentLeaderboardSort.column === 'rank' ? currentLeaderboardSort.order : 'none'}">Rank <i class="fas fa-sort sort-icon"></i></th>
                        <th role="columnheader">Photo</th>
                        <th data-sort="name" role="columnheader" aria-sort="${currentLeaderboardSort.column === 'name' ? currentLeaderboardSort.order : 'none'}">Name <i class="fas fa-sort sort-icon"></i></th>
                        <th data-sort="country" role="columnheader" aria-sort="${currentLeaderboardSort.column === 'country' ? currentLeaderboardSort.order : 'none'}">Country <i class="fas fa-sort sort-icon"></i></th>
                        <th data-sort="wins" role="columnheader" aria-sort="${currentLeaderboardSort.column === 'wins' ? currentLeaderboardSort.order : 'none'}">Record <i class="fas fa-sort sort-icon"></i></th>
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
              <h2 class="text-center mb-4 fw-bold text-uppercase animate__animated animate__fadeInDown">Individual Match History (Latest) <i class="fas fa-history ms-2"></i></h2>
              <div class="row g-3" id="individualMatchHistory">
              </div>
            </section>
        `;
        setAppContent(homePageHtml);

        renderTopLowRecords(debaters);
        renderQuickViewProfiles(debaters);
        renderDetailedProfiles(debaters, ''); // Initialize with empty search
        renderLeaderboard(debaters); // Initial call
        renderOverallStatsChart(debaters); // Render chart
        renderRecentMatches(matches);
        renderIndividualMatchHistory(debaters, matches);

        // Re-attach event listeners as DOM elements are newly created
        attachHomePageEventListeners(debaters, matches);
    }

    /**
     * Renders a debater's profile page.
     * @param {string} debaterId - The ID of the debater to render.
     * @param {Array<Object>} debaters - Array of debater data.
     * @param {Array<Object>} matches - Array of match data.
     */
    function renderProfilePage(debaterId, debaters, matches) {
        const debater = debaters.find(d => d.id === debaterId);

        if (!debater) {
            setAppContent(`
                <div class="container my-5 text-center text-danger animate__animated animate__fadeIn">
                    <i class="fas fa-user-times fa-3x mb-3"></i>
                    <h2>Debater Not Found!</h2>
                    <p>The profile you are looking for does not exist.</p>
                    <a href="#home" class="btn btn-primary mt-3" aria-label="Back to Home page"><i class="fas fa-arrow-left me-2"></i> Back to Home</a>
                </div>
            `);
            document.title = 'DBA - Not Found';
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
                                <img src="${debater.photo}" class="profile-avatar mb-3 animate__animated animate__zoomIn" alt="${debater.name} Profile Photo" onerror="onImageError(this)">
                                <h2 class="profile-name animate__animated animate__fadeInDown">${debater.name} <img src="${debater.flag}" width="30" class="ms-2" alt="${debater.country_code} flag"/></h2>
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
                                        <canvas id="radarChart" height="250"></canvas>
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
        new Chart(document.getElementById('radarChart'), {
            type: 'radar',
            data: {
                labels: metricLabels,
                datasets: [{
                    label: 'Debater Metrics',
                    data: metricScores,
                    backgroundColor: 'rgba(13, 110, 253, 0.2)', // Bootstrap primary blue with alpha
                    borderColor: 'rgba(13, 110, 253, 1)',
                    borderWidth: 1
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
                            backdropColor: 'transparent', // Make tick labels background transparent
                            color: '#6c757d'
                        },
                        pointLabels: {
                            color: '#212529', // Label color
                            font: { size: 12 }
                        },
                        grid: { color: 'rgba(0,0,0,0.1)' } // Grid line color
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
                }
            }
        });

        // Render full match history for the specific debater
        const individualFullMatchHistorySection = document.getElementById('individualFullMatchHistory');
        if (individualFullMatchHistorySection) {
            const debaterMatches = matches.filter(match =>
                match.debater1.id === debater.id || match.debater2.id === debater.id
            ).sort((a, b) => {
                 // Sort by date (if available) or by ID
                const dateA = a.date ? new Date(a.date) : 0;
                const dateB = b.date ? new Date(b.date) : 0;
                if (dateA && dateB) return dateB - dateA; // Newest first
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
                    const opponentPhoto = opponentDebater ? opponentDebater.photo : 'assets/default_avatar.png';
                    const matchDate = match.date ? new Date(match.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown Date';

                    matchesHtml += `
                        <div class="col-12">
                            <div class="card shadow p-3 mb-2 d-flex flex-row align-items-center ${cardBackgroundClass} animate__animated animate__fadeIn">
                                <img src="${debater.photo}" width="50" class="rounded-circle me-3" alt="${debater.name}" onerror="onImageError(this)">
                                <div class="flex-grow-1">
                                    <h6 class="mb-1 fw-bold">${debater.name} <span class="badge ${statusBadgeClass}">${statusText}</span> vs ${opponent.name}</h6>
                                    <small class="text-muted">Method: ${match.method} - Character: ${debater.character} vs ${opponent.character}</small><br>
                                    <small class="text-muted"><i class="fas fa-calendar-alt me-1"></i> Date: ${matchDate} ${match.event ? `(Event: ${match.event})` : ''}</small>
                                </div>
                                <img src="${opponentPhoto}" width="50" class="rounded-circle ms-3" alt="${opponent.name}" onerror="onImageError(this)">
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

    /**
     * Renders the debater comparison page.
     * @param {Array<Object>} debaters - Array of debater data.
     */
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
                    <div class="col-12 text-center text-muted">
                        <p><i class="fas fa-info-circle me-2"></i> Select two debaters above to compare their profiles.</p>
                    </div>
                </div>
            </section>
        `;
        setAppContent(comparePageHtml);
        attachComparePageEventListeners(debaters);
    }

    // --- Specific Section Renderers (used by renderHomePage) ---

    /**
     * Renders the top and low record debaters section.
     * @param {Array<Object>} debaters - Array of debater data.
     */
    function renderTopLowRecords(debaters) {
        const topLowRecordsSection = document.getElementById('topLowRecordsSection');
        if (!topLowRecordsSection) return;

        // Sort debaters by win rate, then by total matches (descending)
        const sortedDebaters = [...debaters].sort((a, b) => {
            const winRateA = (a.wins + a.losses) > 0 ? a.wins / (a.wins + a.losses) : 0;
            const winRateB = (b.wins + b.losses) > 0 ? b.wins / (b.wins + b.losses) : 0;
            if (winRateA !== winRateB) return winRateB - winRateA;
            return (b.wins + b.losses) - (a.wins + a.losses);
        });

        const top3 = sortedDebaters.slice(0, 3);
        // Calculate the starting index for the bottom 3, ensuring it's not less than 0
        const low3StartIndex = Math.max(0, sortedDebaters.length - 3);
        // Get the last 3 debaters, then filter out any that are also in the top 3 (unlikely but good practice)
        const low3 = sortedDebaters.slice(low3StartIndex).filter(d => !top3.some(t => t.id === d.id)).reverse(); // Reverse to show lowest first

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
                            <h4 class="card-title">${debater.name} <img src="${debater.flag}" width="24" class="ms-2" alt="${debater.country_code} flag"/></h4>
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
                            <h4 class="card-title">${debater.name} <img src="${debater.flag}" width="24" class="ms-2" alt="${debater.country_code} flag"/></h4>
                            <p class="card-text">Record: <span class="badge ${debater.wins > debater.losses ? 'bg-success' : 'bg-danger'}">${debater.record}</span></p>
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

    /**
     * Renders a quick view of debater profiles, showing a few with basic info.
     * @param {Array<Object>} debaters - Array of debater data.
     */
    function renderQuickViewProfiles(debaters) {
        const quickViewProfilesSection = document.getElementById('quickViewProfiles');
        if (!quickViewProfilesSection) return;

        let html = '';
        debaters.slice(0, 3).forEach(debater => {
            html += `
                <div class="col-md-4">
                    <div class="card shadow h-100 text-center animate__animated animate__fadeInUp" aria-label="Quick summary for ${debater.name}">
                        <img src="${debater.photo}" class="card-img-top" alt="${debater.name} photo" loading="lazy" onerror="onImageError(this)"/>
                        <div class="card-body">
                            <h3 class="clickable-name" data-debater-id="${debater.id}" tabindex="0" role="button" aria-expanded="false" aria-controls="${debater.id}-desc">
                                ${debater.name} <img src="${debater.flag}" width="24" class="ms-2" alt="${debater.country_code} flag"/>
                            </h3>
                            <p class="card-text">Record: <span class="badge ${debater.wins > debater.losses ? 'bg-success' : 'bg-danger'}">${debater.record}</span></p>
                            <div id="${debater.id}-desc" class="debater-desc collapse">
                                <p><strong>Character:</strong> ${debater.character}</p>
                                <p><strong>Summary:</strong> ${debater.summary}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        quickViewProfilesSection.innerHTML = html;

        // Attach event listeners for clickable names
        quickViewProfilesSection.querySelectorAll('.clickable-name').forEach(element => {
            element.addEventListener('click', () => {
                const debaterId = element.dataset.debaterId;
                const descElement = document.getElementById(`${debaterId}-desc`);
                if (descElement) {
                    // Using Bootstrap's collapse functionality
                    const bsCollapse = new bootstrap.Collapse(descElement, { toggle: false });
                    if (descElement.classList.contains('show')) {
                        bsCollapse.hide();
                        element.setAttribute('aria-expanded', 'false');
                    } else {
                        bsCollapse.show();
                        element.setAttribute('aria-expanded', 'true');
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

    /**
     * Renders detailed debater profiles based on a search query.
     * @param {Array<Object>} debaters - Array of debater data.
     * @param {string} query - The search query.
     */
    function renderDetailedProfiles(debaters, query) {
        const detailedProfilesSection = document.getElementById('detailedProfilesSection');
        if (!detailedProfilesSection) return;

        detailedProfilesSection.innerHTML = ''; // Clear previous content

        const filteredDebaters = debaters.filter(debater =>
            debater.name.toLowerCase().includes(query.toLowerCase())
        );

        if (filteredDebaters.length === 0 && query !== '') {
            detailedProfilesSection.innerHTML = `
                <div class="col-12 text-center text-muted animate__animated animate__fadeIn">
                    <p><i class="fas fa-info-circle me-2"></i> No debaters found matching "${query}".</p>
                </div>
            `;
            return;
        } else if (query === '') {
             detailedProfilesSection.innerHTML = `
                <div class="col-12 text-center text-muted animate__animated animate__fadeIn">
                  <p><i class="fas fa-search me-2"></i> Ketik nama debater di atas untuk melihat metrik profil lengkap mereka.</p>
                </div>
            `;
            return;
        }

        filteredDebaters.forEach(debater => {
            const averageMetric = (Object.values(debater.metrics).reduce((sum, score) => sum + parseFloat(score), 0) / Object.values(debater.metrics).length).toFixed(2);
            detailedProfilesSection.innerHTML += `
                <div class="col-md-6 col-lg-4 animate__animated animate__fadeInUp">
                    <div class="card shadow h-100 profile-card-hover" role="button" aria-label="View full profile of ${debater.name}" onclick="window.location.hash='#profile/${debater.id}'">
                        <div class="card-body text-center">
                            <img src="${debater.photo}" class="profile-avatar-small mb-3" alt="${debater.name} photo" onerror="onImageError(this)">
                            <h5 class="card-title">${debater.name} <img src="${debater.flag}" width="20" class="ms-1" alt="${debater.country_code} flag"/></h5>
                            <p class="card-text">Record: <span class="badge ${debater.wins > debater.losses ? 'bg-success' : 'bg-danger'}">${debater.record}</span></p>
                            <p class="card-text text-muted">Avg. Metric: ${averageMetric}/10</p>
                            <a href="#profile/${debater.id}" class="btn btn-sm btn-outline-primary mt-2">View Full Profile</a>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    /**
     * Renders the leaderboard section with filters and sorting.
     * @param {Array<Object>} debaters - Array of debater data.
     * @param {string} query - Search query for debater name/country.
     * @param {string} filterTier - Filter by tier (e.g., 'High Tier').
     * @param {string} filterCountry - Filter by country.
     * @param {string} sortColumn - Column to sort by (e.g., 'rank', 'name', 'wins').
     * @param {string} sortOrder - Sort order ('asc' or 'desc').
     */
    function renderLeaderboard(debaters, query = '', filterTier = '', filterCountry = '', sortColumn = 'rank', sortOrder = 'asc') {
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
            return [...tierList].sort((a, b) => { // Use spread to avoid modifying original array
                let valA, valB;
                if (sortColumn === 'rank' || sortColumn === 'wins') {
                    // For rank/wins, sort by number of wins
                    valA = a.wins;
                    valB = b.wins;
                    return sortOrder === 'asc' ? valA - valB : valB - valA;
                } else if (sortColumn === 'name') {
                    valA = a.name;
                    valB = b.name;
                    return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                } else if (sortColumn === 'country') {
                    valA = a.country;
                    valB = b.country;
                    return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                }
                return 0; // No sorting if column not recognized
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
            const minRows = Math.max(tierList.length, 5); // Ensure at least 5 rows for consistent table height
            for (let i = 0; i < minRows; i++) {
                const debater = tierList[i];
                if (debater) {
                    tbody.innerHTML += `
                        <tr>
                            <td>${i + 1}</td>
                            <td><img src="${debater.photo}" width="40" class="rounded-circle" alt="${debater.name} photo" loading="lazy" onerror="onImageError(this)"></td>
                            <td><a href="#profile/${debater.id}" class="text-decoration-none">${debater.name}</a></td>
                            <td><img src="${debater.flag}" width="20" class="me-1" alt="${debater.country_code} flag"> ${debater.country_code}</td>
                            <td><span class="badge ${debater.wins > debater.losses ? 'bg-success' : 'bg-danger'}">${debater.record}</span></td>
                        </tr>
                    `;
                } else {
                    // Populate empty rows if there are fewer than minRows debaters
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
                    th.setAttribute('aria-sort', sortOrder);
                } else {
                    icon.classList.add('fa-sort');
                    th.setAttribute('aria-sort', 'none');
                }
            }
        });
    }

    /**
     * Renders a bar chart showing debater distribution by tier.
     * @param {Array<Object>} debaters - Array of debater data.
     */
    function renderOverallStatsChart(debaters) {
        const ctx = document.getElementById('overallStatsChart');
        if (!ctx) return;

        // Destroy previous chart instance if exists
        if (Chart.getChart(ctx)) {
            Chart.getChart(ctx).destroy();
        }

        const tierCounts = debaters.reduce((acc, debater) => {
            acc[debater.tier] = (acc[debater.tier] || 0) + 1;
            return acc;
        }, {});

        // You could also generate a pie chart for country distribution if desired
        // const countryCounts = debaters.reduce((acc, debater) => {
        //     acc[debater.country] = (acc[debater.country] || 0) + 1;
        //     return acc;
        // }, {});

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(tierCounts),
                datasets: [
                    {
                        label: 'Debaters per Tier',
                        data: Object.values(tierCounts),
                        backgroundColor: ['#ffc107', '#6c757d', '#343a40'], // Warning (High), Secondary (Mid), Dark (Low)
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

    /**
     * Renders the recent matches section.
     * @param {Array<Object>} matches - Array of match data.
     */
    function renderRecentMatches(matches) {
        const recentMatchesSection = document.getElementById('recentMatchesSection');
        if (!recentMatchesSection) return;

        let html = '';
        const sortedMatches = [...matches].sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : 0;
            const dateB = b.date ? new Date(b.date) : 0;
            if (dateA && dateB) return dateB - dateA; // Newest first
            return b.id.localeCompare(a.id);
        });

        // Display only the 3 most recent matches
        sortedMatches.slice(0, 3).forEach(match => {
            // Find full debater objects for more complete data like photos
            const debater1Full = allDebatersData.find(d => d.id === match.debater1.id) || match.debater1;
            const debater2Full = allDebatersData.find(d => d.id === match.debater2.id) || match.debater2;

            html += `
                <div class="col-lg-4 col-md-6 col-sm-12 animate__animated animate__fadeInUp">
                    <div class="card match-card h-100">
                        <img src="${match.image}" class="match-img-16by9 card-img-top" alt="${debater1Full.name} vs ${debater2Full.name} Match Image" loading="lazy" onerror="onImageError(this)">
                        <div class="card-body text-center d-flex flex-column">
                            <h5 class="card-title fw-bold">
                                <img src="${debater1Full.flag}" width="20" alt="${debater1Full.country_code} flag"> <i class="fas fa-fist-raised mx-2" style="color:#FFD700;"></i> <img src="${debater2Full.flag}" width="20" alt="${debater2Full.country_code} flag">
                            </h5>
                            <div class="debater-info mb-1">
                                <strong>${debater1Full.name} (${match.debater1.character})</strong> <span class="badge ${match.winner === debater1Full.name ? 'bg-success' : 'bg-danger'}">${match.winner === debater1Full.name ? 'WIN' : 'LOSS'}</span>
                            </div>
                            <div class="debater-info">
                                <strong>${debater2Full.name} (${match.debater2.character})</strong> <span class="badge ${match.winner === debater2Full.name ? 'bg-success' : 'bg-danger'}">${match.winner === debater2Full.name ? 'WIN' : 'LOSS'}</span>
                            </div>
                            <small class="text-muted mt-2 d-block">Method: ${match.method} ${match.event ? `(Event: ${match.event})` : ''}</small>
                            <a href="#profile/${debater1Full.id}" class="btn btn-sm btn-outline-info mt-auto mx-auto" style="width: fit-content;" aria-label="View ${debater1Full.name}'s profile">View ${debater1Full.name} Profile</a>
                             <a href="#profile/${debater2Full.id}" class="btn btn-sm btn-outline-info mt-2 mx-auto" style="width: fit-content;" aria-label="View ${debater2Full.name}'s profile">View ${debater2Full.name} Profile</a>
                        </div>
                    </div>
                </div>
            `;
        });
        recentMatchesSection.innerHTML = html;
    }

    /**
     * Renders the latest match history for each debater.
     * @param {Array<Object>} debaters - Array of debater data.
     * @param {Array<Object>} matches - Array of match data.
     */
    function renderIndividualMatchHistory(debaters, matches) {
        const individualMatchHistorySection = document.getElementById('individualMatchHistory');
        if (!individualMatchHistorySection) return;

        let html = '';
        debaters.forEach(debater => {
            const debaterMatches = matches.filter(match =>
                match.debater1.id === debater.id || match.debater2.id === debater.id
            ).sort((a, b) => {
                const dateA = a.date ? new Date(a.date) : 0;
                const dateB = b.date ? new Date(b.date) : 0;
                if (dateA && dateB) return dateB - dateA; // Newest first
                return b.id.localeCompare(a.id);
            });

            if (debaterMatches.length > 0) {
                const latestMatch = debaterMatches[0];
                const isWinner = latestMatch.winner === debater.name;
                const opponent = latestMatch.debater1.id === debater.id ? latestMatch.debater2 : latestMatch.debater1;
                const statusText = isWinner ? 'Win' : 'Loss';
                const cardClass = isWinner ? 'win-card' : 'loss-card';

                const opponentDebater = debaters.find(d => d.id === opponent.id);
                const opponentPhoto = opponentDebater ? opponentDebater.photo : 'assets/default_avatar.png';

                html += `
                    <div class="col-md-6 animate__animated animate__fadeInUp">
                        <div class="card shadow ${cardClass} h-100">
                            <div class="card-body d-flex align-items-center">
                                <img src="${debater.photo}" class="me-3 rounded debater-thumbnail" alt="${debater.name} photo" loading="lazy" onerror="onImageError(this)">
                                <div class="flex-grow-1">
                                    <h5 class="fw-bold">${debater.name} <img src="${debater.flag}" width="20" class="ms-1 flag-icon" alt="${debater.country_code} flag"></h5>
                                    <p class="mb-1">Record: <span class="badge ${debater.wins > debater.losses ? 'bg-success' : 'bg-danger'}">${debater.record}</span></p>
                                    <p class="mb-0">${statusText} vs ${opponent.name} [${latestMatch.method}]</p>
                                </div>
                                <img src="${opponentPhoto}" width="40" class="ms-3 rounded-circle" alt="${opponent.name} photo" loading="lazy" onerror="onImageError(this)">
                            </div>
                        </div>
                    </div>
                `;
            }
        });
        individualMatchHistorySection.innerHTML = html;
    }

    // --- Event Listener Attachments (for HomePage) ---

    /**
     * Attaches event listeners for elements on the home page.
     * @param {Array<Object>} debaters - Array of debater data.
     * @param {Array<Object>} matches - Array of match data.
     */
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
                // Toggle sort order based on current column and order
                if (currentLeaderboardSort.column === sortColumn) {
                    currentLeaderboardSort.order = currentLeaderboardSort.order === 'asc' ? 'desc' : 'asc';
                } else {
                    currentLeaderboardSort.column = sortColumn;
                    currentLeaderboardSort.order = 'asc'; // Default to ascending when changing column
                }
                applyLeaderboardFilters(); // Re-render with new sort
            });
        });
    }

    // --- Comparison Page Logic ---

    /**
     * Renders the comparison chart and debater comparison cards.
     * @param {Object|null} debater1 - The first debater object.
     * @param {Object|null} debater2 - The second debater object.
     */
    function renderComparisonChart(debater1, debater2) {
        const comparisonResultsDiv = document.getElementById('comparisonResults');
        if (!comparisonResultsDiv) return;

        if (!debater1 || !debater2) {
            comparisonResultsDiv.innerHTML = `
                <div class="col-12 text-center text-muted animate__animated animate__fadeIn">
                    <p><i class="fas fa-info-circle me-2"></i> Select two debaters above to compare their profiles.</p>
                </div>
            `;
            // Destroy previous chart instance if it exists when no debaters are selected
            if (comparisonChartInstance) {
                comparisonChartInstance.destroy();
                comparisonChartInstance = null;
            }
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
                    <img src="${debater1.photo}" class="profile-avatar mb-2" alt="${debater1.name} photo" onerror="onImageError(this)">
                    <h5>${debater1.name} <img src="${debater1.flag}" width="20" class="ms-1" alt="${debater1.country_code} flag"></h5>
                    <p class="mb-1">Record: <span class="badge ${debater1.wins > debater1.losses ? 'bg-success' : 'bg-danger'}">${debater1.record}</span></p>
                    <p class="text-muted"><i class="fas fa-percentage me-1"></i> Win Rate: ${((debater1.wins / (debater1.wins + debater1.losses)) * 100).toFixed(2)}%</p>
                    <hr>
                    <small><strong>Favorite Character:</strong> ${debater1.character}</small>
                </div>
            </div>
            <div class="col-md-6 mt-4 debater-compare-card animate__animated animate__fadeInRight">
                <div class="card shadow p-3 h-100">
                    <img src="${debater2.photo}" class="profile-avatar mb-2" alt="${debater2.name} photo" onerror="onImageError(this)">
                    <h5>${debater2.name} <img src="${debater2.flag}" width="20" class="ms-1" alt="${debater2.country_code} flag"></h5>
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
                            borderWidth: 1
                        },
                        {
                            label: debater2.name,
                            data: data2,
                            backgroundColor: 'rgba(255, 99, 132, 0.2)', // Red
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
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
                    const winnerDebater = (match.winner === debater1.name) ? debater1 : debater2;
                    const loserDebater = (match.winner === debater1.name) ? debater2 : debater1;

                    // Ensure opponent photos are correctly retrieved from allDebatersData
                    const winnerPhoto = allDebatersData.find(d => d.name === winnerDebater.name)?.photo || 'assets/default_avatar.png';
                    const loserPhoto = allDebatersData.find(d => d.name === loserDebater.name)?.photo || 'assets/default_avatar.png';

                    const matchDate = match.date ? new Date(match.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown Date';

                    h2hHtml += `
                        <div class="col-12">
                            <div class="card shadow p-3 mb-2 d-flex flex-row align-items-center animate__animated animate__fadeIn">
                                <img src="${winnerPhoto}" width="50" class="rounded-circle me-3" alt="${winnerDebater.name} photo" onerror="onImageError(this)">
                                <div class="flex-grow-1">
                                    <h6 class="mb-1 fw-bold">${winnerDebater.name} <span class="badge bg-success">WIN</span> vs ${loserDebater.name}</h6>
                                    <small class="text-muted">Method: ${match.method} - Character: ${winnerDebater.character} vs ${loserDebater.character}</small><br>
                                    <small class="text-muted"><i class="fas fa-calendar-alt me-1"></i> Date: ${matchDate} ${match.event ? `(Event: ${match.event})` : ''}</small>
                                </div>
                                <img src="${loserPhoto}" width="50" class="rounded-circle ms-3" alt="${loserDebater.name} photo" onerror="onImageError(this)">
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

    /**
     * Attaches event listeners for elements on the comparison page.
     * @param {Array<Object>} debaters - Array of debater data.
     */
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
                renderComparisonChart(null, null); // Clear chart and message
                return;
            }
            renderComparisonChart(debater1, debater2);
        };

        if (debaterSelect1) debaterSelect1.addEventListener('change', updateComparison);
        if (debaterSelect2) debaterSelect2.addEventListener('change', updateComparison);
    }


    // --- Router Logic ---

    /**
     * Handles routing based on the URL hash.
     */
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

        fetchData().then(data => {
            if (!data) return; // Exit if data fetching failed

            if (route === 'home' || route === '') {
                renderHomePage(data.debaters, data.matches);
                document.title = 'DBA - Home';
            } else if (route === 'profile' && id) {
                renderProfilePage(id, data.debaters, data.matches);
            } else if (route === 'compare') {
                renderComparePage(data.debaters);
                document.title = 'DBA - Compare Debaters';
            }
            else {
                // 404 Not Found
                setAppContent(`
                    <div class="container my-5 text-center text-danger animate__animated animate__fadeIn">
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
