document.addEventListener('DOMContentLoaded', () => {
    let allDebatersData = [];
    let allMatchesData = [];
    let currentLeaderboardSort = { column: 'rank', order: 'asc' }; // Default sort for leaderboard
    let comparisonChartInstance = null; // To store Chart.js instance for destruction
    let overallStatsChartInstance = null; // To store Chart.js instance for overall stats chart

    // --- Utility Functions ---

    /**
     * Shows a Bootstrap Toast notification.
     * @param {string} message - The message to display.
     * @param {string} type - The type of toast (e.g., 'success', 'error', 'warning', 'info').
     */
    function showToast(message, type = 'info') {
        const toastEl = document.getElementById('liveToast');
        if (!toastEl) {
            console.error('Toast element not found!');
            return;
        }
        const toastBody = document.getElementById('toastBody');
        if (toastBody) {
            toastBody.textContent = message;
        }

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
    window.onImageError = function(imgElement) { // Made global to be accessible from inline onerror
        imgElement.onerror = null; // Prevent infinite loop if fallback also fails
        imgElement.src = 'assets/default_avatar.png'; // Path to a default avatar image
        imgElement.alt = 'Default Avatar';
    };

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
                <div class="profile-metric d-flex align-items-center mb-2">
                    <span class="me-2 text-capitalize">${metricName.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <div class="progress flex-grow-1" role="progressbar" aria-label="${metricName} score" aria-valuenow="${metricScore}" aria-valuemin="0" aria-valuemax="10">
                        <div class="progress-bar bg-info" style="width: ${widthPercentage}%;"></div>
                    </div>
                    <span class="metric-value ms-2">${metricScore}/10</span>
                </div>
            `;
            metricLabels.push(metricName.replace(/([A-Z])/g, ' $1').trim()); // Make labels more readable
            metricScores.push(parseFloat(metricScore));
        }

        const totalWinsLosses = debater.wins + debater.losses;
        const winRate = totalWinsLosses > 0 ? ((debater.wins / totalWinsLosses) * 100).toFixed(2) : '0.00';
        const averageMetric = metricScores.length > 0 ? (metricScores.reduce((sum, score) => sum + score, 0) / metricScores.length).toFixed(2) : 'N/A';

        const profilePageHtml = `
            <section class="container my-5">
                <div class="row justify-content-center">
                    <div class="col-lg-8">
                        <div class="card shadow p-4 animate__animated animate__fadeIn">
                            <div class="text-center">
                                <img src="${debater.photo}" class="profile-avatar mb-3 animate__animated animate__zoomIn" alt="${debater.name} Profile Photo" onerror="onImageError(this)">
                                <h2 class="profile-name animate__animated animate__fadeInDown">${debater.name} <img src="${debater.flag}" width="30" class="ms-2" alt="${debater.country_code} flag"/></h2>
                                <p class="profile-record animate__animated animate__fadeIn">Record: <span class="badge ${debater.wins > debater.losses ? 'bg-success' : 'bg-danger'}">${debater.record}</span></p>
                                <p class="text-muted"><i class="fas fa-percentage me-1"></i> Win Rate: ${winRate}% | <i class="fas fa-gamepad me-1"></i> Total Matches: ${totalWinsLosses}</p>
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
        const radarChartCtx = document.getElementById('radarChart');
        if (radarChartCtx) {
            new Chart(radarChartCtx, {
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
        }


        // Render full match history for the specific debater
        const individualFullMatchHistorySection = document.getElementById('individualFullMatchHistory');
        if (individualFullMatchHistorySection) {
            const debaterMatches = matches.filter(match =>
                match.debater1.id === debater.id || match.debater2.id === debater.id
            ).sort((a, b) => {
                const dateA = a.date ? new Date(a.date) : new Date(0); // Use epoch for missing dates
                const dateB = b.date ? new Date(b.date) : new Date(0);
                // If dates are valid, sort by date (newest first). Otherwise, fall back to ID.
                if (dateA.getTime() !== new Date(0).getTime() && dateB.getTime() !== new Date(0).getTime()) {
                    return dateB.getTime() - dateA.getTime();
                }
                return b.id.localeCompare(a.id); // Fallback if dates are missing
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
                                <img src="${debater.photo}" width="50" height="50" class="rounded-circle me-3 object-fit-cover" alt="${debater.name}" onerror="onImageError(this)">
                                <div class="flex-grow-1">
                                    <h6 class="mb-1 fw-bold">${debater.name} <span class="badge ${statusBadgeClass}">${statusText}</span> vs <a href="#profile/${opponent.id}" class="text-decoration-none">${opponent.name}</a></h6>
                                    <small class="text-muted">Method: ${match.method} - Character: ${debater.character} vs ${opponent.character}</small><br>
                                    <small class="text-muted"><i class="fas fa-calendar-alt me-1"></i> Date: ${matchDate} ${match.event ? `(Event: ${match.event})` : ''}</small>
                                </div>
                                <img src="${opponentPhoto}" width="50" height="50" class="rounded-circle ms-3 object-fit-cover" alt="${opponent.name}" onerror="onImageError(this)">
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
        document.title = 'DBA - Compare Debaters';
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
                        <i class="fas fa-times vs-icon fs-3 text-secondary"></i>
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
            const totalMatchesA = (a.wins + a.losses);
            const totalMatchesB = (b.wins + b.losses);

            const winRateA = totalMatchesA > 0 ? a.wins / totalMatchesA : 0;
            const winRateB = totalMatchesB > 0 ? b.wins / totalMatchesB : 0;

            if (winRateA !== winRateB) return winRateB - winRateA; // Sort by win rate descending
            return totalMatchesB - totalMatchesA; // Then by total matches descending
        });

        const top3 = sortedDebaters.slice(0, 3);
        // Ensure low3 are distinct from top3 and truly represent the lowest performers
        const low3Candidates = [...sortedDebaters].sort((a, b) => {
            const totalMatchesA = (a.wins + a.losses);
            const totalMatchesB = (b.wins + b.losses);

            const winRateA = totalMatchesA > 0 ? a.wins / totalMatchesA : 0;
            const winRateB = totalMatchesB > 0 ? b.wins / totalMatchesB : 0;

            if (winRateA !== winRateB) return winRateA - winRateB; // Sort by win rate ascending
            return totalMatchesA - totalMatchesB; // Then by total matches ascending
        });

        const low3 = low3Candidates.filter(d => !top3.some(t => t.id === d.id)).slice(0, 3);

        let html = `
            <div class="col-md-6">
                <h3 class="mb-3 text-success">Top Record Debaters DBA <i class="fas fa-crown ms-2"></i></h3>
                <div class="row g-3">
        `;
        top3.forEach(debater => {
            html += `
                <div class="col-md-4">
                    <div class="card shadow h-100 animate__animated animate__fadeInUp card-hover-effect" role="button" aria-label="View ${debater.name}'s profile" onclick="window.location.hash='#profile/${debater.id}'">
                        <img src="${debater.photo}" class="card-img-top card-img-fixed-height" alt="${debater.name} photo" loading="lazy" onerror="onImageError(this)"/>
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
                    <div class="card shadow h-100 animate__animated animate__fadeInUp card-hover-effect" role="button" aria-label="View ${debater.name}'s profile" onclick="window.location.hash='#profile/${debater.id}'">
                        <img src="${debater.photo}" class="card-img-top card-img-fixed-height" alt="${debater.name} photo" loading="lazy" onerror="onImageError(this)"/>
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
        // Display a representative sample, e.g., the first 3
        debaters.slice(0, 3).forEach(debater => {
            html += `
                <div class="col-md-4">
                    <div class="card shadow h-100 text-center animate__animated animate__fadeInUp card-hover-effect" aria-label="Quick summary for ${debater.name}">
                        <img src="${debater.photo}" class="card-img-top card-img-fixed-height" alt="${debater.name} photo" loading="lazy" onerror="onImageError(this)"/>
                        <div class="card-body">
                            <h3 class="clickable-name" data-debater-id="${debater.id}" tabindex="0" role="button" aria-expanded="false" aria-controls="${debater.id}-desc">
                                ${debater.name} <img src="${debater.flag}" width="24" class="ms-2" alt="${debater.country_code} flag"/>
                            </h3>
                            <p class="card-text">Record: <span class="badge ${debater.wins > debater.losses ? 'bg-success' : 'bg-danger'}">${debater.record}</span></p>
                            <div id="${debater.id}-desc" class="debater-desc collapse">
                                <p><strong>Character:</strong> ${debater.character}</p>
                                <p><strong>Summary:</strong> ${debater.summary}</p>
                            </div>
                            <a href="#profile/${debater.id}" class="btn btn-sm btn-outline-primary mt-2">View Profile</a>
                        </div>
                    </div>
                </div>
            `;
        });
        quickViewProfilesSection.innerHTML = html;

        // Attach event listeners for clickable names
        quickViewProfilesSection.querySelectorAll('.clickable-name').forEach(element => {
            element.addEventListener('click', (event) => {
                event.preventDefault(); // Prevent default link behavior if it were an <a>
                const debaterId = element.dataset.debaterId;
                const descElement = document.getElementById(`${debaterId}-desc`);
                if (descElement) {
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
     * Renders detailed debater profiles based on search input.
     * @param {Array<Object>} debaters - Array of debater data.
     * @param {string} searchTerm - The search term to filter debaters.
     */
    function renderDetailedProfiles(debaters, searchTerm) {
        const detailedProfilesSection = document.getElementById('detailedProfilesSection');
        if (!detailedProfilesSection) return;

        const filteredDebaters = debaters.filter(debater =>
            debater.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        let html = '';
        if (filteredDebaters.length > 0) {
            filteredDebaters.forEach(debater => {
                let metricsHtml = '';
                for (const [metricName, metricScore] of Object.entries(debater.metrics)) {
                    const widthPercentage = (parseFloat(metricScore) / 10) * 100;
                    metricsHtml += `
                        <div class="profile-metric d-flex align-items-center mb-1">
                            <span class="me-2 text-capitalize">${metricName.replace(/([A-Z])/g, ' $1').trim()}:</span>
                            <div class="progress flex-grow-1" role="progressbar" aria-label="${metricName} score" aria-valuenow="${metricScore}" aria-valuemin="0" aria-valuemax="10">
                                <div class="progress-bar bg-info" style="width: ${widthPercentage}%;"></div>
                            </div>
                            <span class="metric-value ms-2">${metricScore}/10</span>
                        </div>
                    `;
                }

                html += `
                    <div class="col-md-6 col-lg-4 animate__animated animate__fadeInUp">
                        <div class="card shadow h-100 debater-profile-card card-hover-effect">
                            <img src="${debater.photo}" class="card-img-top debater-profile-img" alt="${debater.name} Profile Photo" loading="lazy" onerror="onImageError(this)">
                            <div class="card-body text-center">
                                <h4 class="card-title">${debater.name} <img src="${debater.flag}" width="24" class="ms-2" alt="${debater.country_code} flag"/></h4>
                                <p class="card-text">Record: <span class="badge ${debater.wins > debater.losses ? 'bg-success' : 'bg-danger'}">${debater.record}</span></p>
                                <div class="mt-3 text-start">
                                    ${metricsHtml}
                                </div>
                                <a href="#profile/${debater.id}" class="btn btn-primary btn-sm mt-3">View Full Profile <i class="fas fa-arrow-right ms-1"></i></a>
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            html = `
                <div class="col-12 text-center text-muted animate__animated animate__fadeIn">
                    <p><i class="fas fa-info-circle me-2"></i> Tidak ada debater yang ditemukan dengan nama tersebut.</p>
                </div>
            `;
        }
        detailedProfilesSection.innerHTML = html;
    }


    /**
     * Renders the leaderboard table for all tiers.
     * @param {Array<Object>} debaters - Array of debater data.
     */
    function renderLeaderboard(debaters) {
        const highTierBody = document.getElementById('highTierBody');
        const midTierBody = document.getElementById('midTierBody');
        const lowTierBody = document.getElementById('lowTierBody');

        if (!highTierBody || !midTierBody || !lowTierBody) return;

        // Apply filters
        const searchTerm = document.getElementById('leaderboardSearch')?.value.toLowerCase() || '';
        const tierFilter = document.getElementById('tierFilter')?.value || '';
        const countryFilter = document.getElementById('countryFilter')?.value || '';

        let filteredDebaters = debaters.filter(debater => {
            const matchesSearch = debater.name.toLowerCase().includes(searchTerm);
            const matchesTier = tierFilter === '' || debater.tier === tierFilter;
            const matchesCountry = countryFilter === '' || debater.country === countryFilter;
            return matchesSearch && matchesTier && matchesCountry;
        });

        // Sort debaters for leaderboard
        filteredDebaters.sort((a, b) => {
            const sortColumn = currentLeaderboardSort.column;
            const sortOrder = currentLeaderboardSort.order;

            let valA, valB;

            switch (sortColumn) {
                case 'rank': // This would require pre-calculating ranks based on filtered data if rank isn't a direct property
                    // For now, let's sort by wins as a proxy for rank if 'rank' isn't explicitly calculated.
                    valA = a.wins;
                    valB = b.wins;
                    break;
                case 'name':
                    valA = a.name.toLowerCase();
                    valB = b.name.toLowerCase();
                    break;
                case 'country':
                    valA = a.country.toLowerCase();
                    valB = b.country.toLowerCase();
                    break;
                case 'wins':
                    valA = a.wins;
                    valB = b.wins;
                    break;
                default:
                    valA = a.id; // Fallback to ID
                    valB = b.id;
            }

            if (typeof valA === 'string') {
                return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            } else {
                return sortOrder === 'asc' ? valA - valB : valB - valA;
            }
        });

        // Clear previous content
        highTierBody.innerHTML = '';
        midTierBody.innerHTML = '';
        lowTierBody.innerHTML = '';

        let highTierRank = 1, midTierRank = 1, lowTierRank = 1;

        filteredDebaters.forEach(debater => {
            const row = document.createElement('tr');
            let rankDisplay = '';

            // Calculate win rate for record display
            const totalMatches = debater.wins + debater.losses;
            const winRate = totalMatches > 0 ? ((debater.wins / totalMatches) * 100).toFixed(0) : '0';
            const recordText = `${debater.wins}-${debater.losses} (${winRate}%)`;

            switch (debater.tier) {
                case 'High Tier':
                    rankDisplay = highTierRank++;
                    break;
                case 'Mid Tier':
                    rankDisplay = midTierRank++;
                    break;
                case 'Low Tier':
                    rankDisplay = lowTierRank++;
                    break;
                default:
                    rankDisplay = '-';
            }

            row.innerHTML = `
                <td>${rankDisplay}</td>
                <td><img src="${debater.photo}" width="50" height="50" class="rounded-circle object-fit-cover leaderboard-avatar" alt="${debater.name}" onerror="onImageError(this)"></td>
                <td><a href="#profile/${debater.id}" class="text-decoration-none">${debater.name}</a></td>
                <td><img src="${debater.flag}" width="24" class="me-2" alt="${debater.country_code} flag"/> ${debater.country}</td>
                <td><span class="badge ${debater.wins > debater.losses ? 'bg-success' : 'bg-danger'}">${recordText}</span></td>
            `;

            if (debater.tier === 'High Tier') {
                highTierBody.appendChild(row);
            } else if (debater.tier === 'Mid Tier') {
                midTierBody.appendChild(row);
            } else if (debater.tier === 'Low Tier') {
                lowTierBody.appendChild(row);
            }
        });

        // Add "no data" rows if a section is empty
        if (highTierBody.children.length === 0) {
            highTierBody.innerHTML = '<tr><td colspan="5" class="text-muted">No High Tier debaters found for current filters.</td></tr>';
        }
        if (midTierBody.children.length === 0) {
            midTierBody.innerHTML = '<tr><td colspan="5" class="text-muted">No Mid Tier debaters found for current filters.</td></tr>';
        }
        if (lowTierBody.children.length === 0) {
            lowTierBody.innerHTML = '<tr><td colspan="5" class="text-muted">No Low Tier debaters found for current filters.</td></tr>';
        }

        // Update sort icons
        document.querySelectorAll('#leaderboard table thead th[data-sort]').forEach(th => {
            th.classList.remove('sorted-asc', 'sorted-desc');
            th.setAttribute('aria-sort', 'none');
            if (th.dataset.sort === currentLeaderboardSort.column) {
                th.classList.add(`sorted-${currentLeaderboardSort.order}`);
                th.setAttribute('aria-sort', currentLeaderboardSort.order);
            }
        });
    }


    /**
     * Renders the overall statistics chart for debaters.
     * @param {Array<Object>} debaters - Array of debater data.
     */
    function renderOverallStatsChart(debaters) {
        const ctx = document.getElementById('overallStatsChart');
        if (!ctx) return;

        // Destroy existing chart instance if it exists
        if (overallStatsChartInstance) {
            overallStatsChartInstance.destroy();
        }

        const tierCounts = debaters.reduce((acc, debater) => {
            acc[debater.tier] = (acc[debater.tier] || 0) + 1;
            return acc;
        }, { 'High Tier': 0, 'Mid Tier': 0, 'Low Tier': 0 }); // Initialize to ensure all tiers appear

        const labels = Object.keys(tierCounts);
        const data = Object.values(tierCounts);

        overallStatsChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Number of Debaters',
                    data: data,
                    backgroundColor: [
                        'rgba(255, 193, 7, 0.7)',  // Warning (Yellow)
                        'rgba(108, 117, 125, 0.7)', // Secondary (Grey)
                        'rgba(33, 37, 41, 0.7)'    // Dark (Black)
                    ],
                    borderColor: [
                        'rgba(255, 193, 7, 1)',
                        'rgba(108, 117, 125, 1)',
                        'rgba(33, 37, 41, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Debaters Distribution by Tier',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += context.raw;
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) { if (Number.isInteger(value)) { return value; } }, // Show whole numbers only
                            color: '#6c757d'
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#212529'
                        },
                        grid: {
                            display: false
                        }
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

        // Sort matches by date (newest first) and take the latest 6
        const sortedMatches = [...matches].sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : new Date(0);
            const dateB = b.date ? new Date(b.date) : new Date(0);
            return dateB.getTime() - dateA.getTime();
        }).slice(0, 6);

        let html = '';
        if (sortedMatches.length > 0) {
            sortedMatches.forEach(match => {
                const debater1 = allDebatersData.find(d => d.id === match.debater1.id) || match.debater1;
                const debater2 = allDebatersData.find(d => d.id === match.debater2.id) || match.debater2;

                const winnerName = match.winner;
                const winnerBadgeClass = winnerName === debater1.name ? 'bg-primary' : 'bg-danger'; // Assuming primary for D1, danger for D2 winner
                const winnerPhoto = winnerName === debater1.name ? debater1.photo : debater2.photo;

                const matchDate = match.date ? new Date(match.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

                html += `
                    <div class="col-md-6 col-lg-4">
                        <div class="card shadow match-card h-100 animate__animated animate__fadeInUp">
                            <div class="card-header text-center bg-primary text-white">
                                <h5 class="mb-0">Match ID: ${match.id}</h5>
                            </div>
                            <div class="card-body text-center">
                                <div class="d-flex justify-content-around align-items-center mb-3">
                                    <div class="debater-info">
                                        <a href="#profile/${debater1.id}" class="text-decoration-none text-dark">
                                            <img src="${debater1.photo}" class="rounded-circle match-avatar" alt="${debater1.name}" onerror="onImageError(this)">
                                            <p class="mb-0 fw-bold">${debater1.name}</p>
                                        </a>
                                        <small class="text-muted">${debater1.character}</small>
                                    </div>
                                    <span class="vs-text fw-bold mx-2">VS</span>
                                    <div class="debater-info">
                                        <a href="#profile/${debater2.id}" class="text-decoration-none text-dark">
                                            <img src="${debater2.photo}" class="rounded-circle match-avatar" alt="${debater2.name}" onerror="onImageError(this)">
                                            <p class="mb-0 fw-bold">${debater2.name}</p>
                                        </a>
                                        <small class="text-muted">${debater2.character}</small>
                                    </div>
                                </div>
                                <p class="card-text mb-1">
                                    <i class="fas fa-trophy me-1"></i> Winner: <span class="badge ${winnerBadgeClass}">${winnerName}</span>
                                </p>
                                <p class="card-text mb-1"><i class="fas fa-gavel me-1"></i> Method: ${match.method}</p>
                                <p class="card-text"><i class="fas fa-calendar-alt me-1"></i> Date: ${matchDate}</p>
                                ${match.event ? `<p class="card-text"><i class="fas fa-calendar-check me-1"></i> Event: ${match.event}</p>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            html = `
                <div class="col-12 text-center text-muted animate__animated animate__fadeIn">
                    <p><i class="fas fa-info-circle me-2"></i> No recent matches available.</p>
                </div>
            `;
        }
        recentMatchesSection.innerHTML = html;
    }

    /**
     * Renders a simplified individual match history section on the homepage.
     * @param {Array<Object>} debaters - Array of debater data.
     * @param {Array<Object>} matches - Array of match data.
     */
    function renderIndividualMatchHistory(debaters, matches) {
        const individualMatchHistorySection = document.getElementById('individualMatchHistory');
        if (!individualMatchHistorySection) return;

        let html = '';
        // Display a few latest matches for 3-5 random debaters for demonstration
        const debatersToShow = debaters.sort(() => 0.5 - Math.random()).slice(0, 5); // Pick 5 random debaters

        if (debatersToShow.length === 0) {
            individualMatchHistorySection.innerHTML = `<div class="col-12 text-center text-muted"><p>No debaters to display match history for.</p></div>`;
            return;
        }

        debatersToShow.forEach(debater => {
            const debaterMatches = matches.filter(match =>
                match.debater1.id === debater.id || match.debater2.id === debater.id
            ).sort((a, b) => {
                const dateA = a.date ? new Date(a.date) : new Date(0);
                const dateB = b.date ? new Date(b.date) : new Date(0);
                return dateB.getTime() - dateA.getTime();
            }).slice(0, 2); // Show only the 2 latest matches per debater

            if (debaterMatches.length > 0) {
                html += `
                    <div class="col-md-6 col-lg-4">
                        <div class="card shadow h-100 animate__animated animate__fadeInUp">
                            <div class="card-header bg-dark text-white d-flex align-items-center">
                                <img src="${debater.photo}" width="40" height="40" class="rounded-circle me-2 object-fit-cover" alt="${debater.name}" onerror="onImageError(this)">
                                <h5 class="mb-0 flex-grow-1">${debater.name}'s Latest Matches</h5>
                                <a href="#profile/${debater.id}" class="btn btn-sm btn-outline-light ms-auto">View All</a>
                            </div>
                            <ul class="list-group list-group-flush">
                `;
                debaterMatches.forEach(match => {
                    const isWinner = match.winner === debater.name;
                    const opponent = match.debater1.id === debater.id ? match.debater2 : match.debater1;
                    const statusBadgeClass = isWinner ? 'bg-success' : 'bg-danger';
                    const statusText = isWinner ? 'WIN' : 'LOSS';
                    const matchDate = match.date ? new Date(match.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A';

                    html += `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <span class="badge ${statusBadgeClass}">${statusText}</span> vs <a href="#profile/${opponent.id}" class="text-decoration-none">${opponent.name}</a>
                                <br><small class="text-muted">${match.method} - ${matchDate}</small>
                            </div>
                            <img src="${(allDebatersData.find(d => d.id === opponent.id) || {}).photo || 'assets/default_avatar.png'}" width="30" height="30" class="rounded-circle object-fit-cover" alt="${opponent.name}" onerror="onImageError(this)">
                        </li>
                    `;
                });
                html += `
                            </ul>
                        </div>
                    </div>
                `;
            }
        });
        individualMatchHistorySection.innerHTML = html;
    }


    // --- Event Listeners and Routing ---

    /**
     * Attaches event listeners for elements on the home page.
     * @param {Array<Object>} debaters - Array of debater data.
     * @param {Array<Object>} matches - Array of match data.
     */
    function attachHomePageEventListeners(debaters, matches) {
        // Debater Profile Search
        const debaterProfileSearch = document.getElementById('debaterProfileSearch');
        if (debaterProfileSearch) {
            debaterProfileSearch.addEventListener('input', (event) => {
                renderDetailedProfiles(debaters, event.target.value);
            });
        }

        // Leaderboard Filters & Search
        const leaderboardSearch = document.getElementById('leaderboardSearch');
        const tierFilter = document.getElementById('tierFilter');
        const countryFilter = document.getElementById('countryFilter');

        if (leaderboardSearch) {
            leaderboardSearch.addEventListener('input', () => renderLeaderboard(debaters));
        }
        if (tierFilter) {
            tierFilter.addEventListener('change', () => renderLeaderboard(debaters));
        }
        if (countryFilter) {
            countryFilter.addEventListener('change', () => renderLeaderboard(debaters));
        }

        // Leaderboard Sorting
        document.querySelectorAll('#leaderboard table thead th[data-sort]').forEach(header => {
            header.addEventListener('click', () => {
                const column = header.dataset.sort;
                let order = 'asc';
                if (currentLeaderboardSort.column === column) {
                    order = currentLeaderboardSort.order === 'asc' ? 'desc' : 'asc';
                }
                currentLeaderboardSort = { column, order };
                renderLeaderboard(debaters);
            });
        });

        // Ensure Chart.js instances are destroyed before re-rendering new ones
        if (overallStatsChartInstance) {
            overallStatsChartInstance.destroy();
            overallStatsChartInstance = null;
        }
    }


    /**
     * Attaches event listeners for elements on the compare page.
     * @param {Array<Object>} debaters - Array of debater data.
     */
    function attachComparePageEventListeners(debaters) {
        const debaterSelect1 = document.getElementById('debaterSelect1');
        const debaterSelect2 = document.getElementById('debaterSelect2');

        const updateComparison = () => {
            const id1 = debaterSelect1?.value;
            const id2 = debaterSelect2?.value;
            compareDebaters(id1, id2, debaters);
        };

        if (debaterSelect1) {
            debaterSelect1.addEventListener('change', updateComparison);
        }
        if (debaterSelect2) {
            debaterSelect2.addEventListener('change', updateComparison);
        }
    }


    /**
     * Compares two debaters and renders their metrics.
     * @param {string} id1 - ID of the first debater.
     * @param {string} id2 - ID of the second debater.
     * @param {Array<Object>} debaters - Array of debater data.
     */
    function compareDebaters(id1, id2, debaters) {
        const comparisonResults = document.getElementById('comparisonResults');
        if (!comparisonResults) return;

        // Destroy previous chart instance if it exists
        if (comparisonChartInstance) {
            comparisonChartInstance.destroy();
            comparisonChartInstance = null;
        }

        if (!id1 || !id2) {
            comparisonResults.innerHTML = `
                <div class="col-12 text-center text-muted">
                    <p><i class="fas fa-info-circle me-2"></i> Select two debaters above to compare their profiles.</p>
                </div>
            `;
            return;
        }

        const debater1 = debaters.find(d => d.id === id1);
        const debater2 = debaters.find(d => d.id === id2);

        if (!debater1 || !debater2) {
            comparisonResults.innerHTML = `
                <div class="col-12 text-center text-danger">
                    <p><i class="fas fa-exclamation-triangle me-2"></i> One or both selected debaters not found.</p>
                </div>
            `;
            return;
        }

        const metrics1 = debater1.metrics;
        const metrics2 = debater2.metrics;

        const labels = Object.keys(metrics1); // Assuming both have same metric keys
        const data1 = Object.values(metrics1).map(Number);
        const data2 = Object.values(metrics2).map(Number);

        // Calculate Win Rates and Total Matches
        const totalMatches1 = debater1.wins + debater1.losses;
        const winRate1 = totalMatches1 > 0 ? ((debater1.wins / totalMatches1) * 100).toFixed(2) : '0.00';
        const totalMatches2 = debater2.wins + debater2.losses;
        const winRate2 = totalMatches2 > 0 ? ((debater2.wins / totalMatches2) * 100).toFixed(2) : '0.00';

        const compareHtml = `
            <div class="col-md-6 text-center animate__animated animate__fadeInLeft">
                <div class="card shadow p-3 h-100">
                    <img src="${debater1.photo}" class="compare-avatar mb-3" alt="${debater1.name}" onerror="onImageError(this)">
                    <h5>${debater1.name} <img src="${debater1.flag}" width="24" class="ms-2" alt="${debater1.country_code} flag"/></h5>
                    <p>Record: <span class="badge ${debater1.wins > debater1.losses ? 'bg-success' : 'bg-danger'}">${debater1.record}</span></p>
                    <p>Win Rate: ${winRate1}% | Total Matches: ${totalMatches1}</p>
                    <p>Character: ${debater1.character}</p>
                </div>
            </div>
            <div class="col-md-6 text-center animate__animated animate__fadeInRight">
                <div class="card shadow p-3 h-100">
                    <img src="${debater2.photo}" class="compare-avatar mb-3" alt="${debater2.name}" onerror="onImageError(this)">
                    <h5>${debater2.name} <img src="${debater2.flag}" width="24" class="ms-2" alt="${debater2.country_code} flag"/></h5>
                    <p>Record: <span class="badge ${debater2.wins > debater2.losses ? 'bg-success' : 'bg-danger'}">${debater2.record}</span></p>
                    <p>Win Rate: ${winRate2}% | Total Matches: ${totalMatches2}</p>
                    <p>Character: ${debater2.character}</p>
                </div>
            </div>
            <div class="col-12 mt-4 animate__animated animate__fadeInUp">
                <div class="card shadow p-4">
                    <h4 class="text-center mb-3">Metric Comparison</h4>
                    <canvas id="comparisonChart" height="300"></canvas>
                </div>
            </div>
        `;
        comparisonResults.innerHTML = compareHtml;

        const ctx = document.getElementById('comparisonChart');
        if (ctx) {
            comparisonChartInstance = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: labels.map(label => label.replace(/([A-Z])/g, ' $1').trim()), // Make labels readable
                    datasets: [
                        {
                            label: debater1.name,
                            data: data1,
                            backgroundColor: 'rgba(13, 110, 253, 0.2)',
                            borderColor: 'rgba(13, 110, 253, 1)',
                            borderWidth: 1
                        },
                        {
                            label: debater2.name,
                            data: data2,
                            backgroundColor: 'rgba(220, 53, 69, 0.2)', // Bootstrap danger red with alpha
                            borderColor: 'rgba(220, 53, 69, 1)',
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
                        legend: {
                            display: true,
                            position: 'bottom',
                            labels: {
                                color: '#333'
                            }
                        },
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
    }

    /**
     * Handles URL hash changes for routing.
     */
    async function handleLocationHash() {
        const hash = window.location.hash;
        if (hash.startsWith('#profile/')) {
            const debaterId = hash.substring(9); // Get ID after '#profile/'
            if (allDebatersData.length === 0 || allMatchesData.length === 0) {
                const data = await fetchData();
                if (!data) return; // Stop if data fetching failed
            }
            renderProfilePage(debaterId, allDebatersData, allMatchesData);
        } else if (hash === '#compare') {
            if (allDebatersData.length === 0) {
                const data = await fetchData();
                if (!data) return;
            }
            renderComparePage(allDebatersData);
        }
        else { // Default to home
            if (allDebatersData.length === 0 || allMatchesData.length === 0) {
                const data = await fetchData();
                if (!data) return;
            }
            renderHomePage(allDebatersData, allMatchesData);
        }
    }

    // --- Initial Load ---

    // Load data and render initial page based on hash
    fetchData().then(() => {
        handleLocationHash();
        window.addEventListener('hashchange', handleLocationHash);

        // Add event listener for navigation links
        document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const targetHash = event.target.getAttribute('href');
                if (targetHash) {
                    window.location.hash = targetHash;
                }
            });
        });
    });

});
