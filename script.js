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
            // Basic validation for debaters and matches arrays
            if (!Array.isArray(data.debaters) || !Array.isArray(data.matches)) {
                throw new Error("Invalid data structure: 'debaters' or 'matches' is not an array.");
            }
            allDebatersData = data.debaters;
            allMatchesData = data.matches;
            showToast('Data loaded successfully!', 'success');
            return data;
        } catch (error) {
            console.error("Error fetching data:", error);
            showToast('Failed to load data! Check console for details and ensure data.json is valid.', 'error');
            // Clear data if fetching failed to prevent using incomplete/invalid data
            allDebatersData = [];
            allMatchesData = [];
            setAppContent(`
                <div class="container my-5 text-center text-danger animate__animated animate__fadeIn">
                    <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                    <h2>Failed to load data!</h2>
                    <p>Please check if 'data.json' exists and is valid. See console for error details.</p>
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
        console.warn(`Image failed to load: ${imgElement.src}, replacing with default.`); // For debugging
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

              <div class="row g-4" id="detailedProfilesSection">
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
                    ${[...new Set(debaters.map(d => d.country).filter(Boolean))].map(country => `<option value="${country}">${country}</option>`).join('')}
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

            <section class="container my-5 individual-match-history">
              <h2 class="text-center mb-4 fw-bold text-uppercase animate__animated animate__fadeInDown">Individual Match History (Latest) <i class="fas fa-history ms-2"></i></h2>
              <div class="row g-3" id="individualMatchHistory">
              </div>
            </section>
        `;
        setAppContent(homePageHtml);

        renderTopLowRecords(debaters);
        renderQuickViewProfiles(debaters);
        renderDetailedProfiles(debaters); // Call to render all detailed profiles
        renderLeaderboard(debaters); // Initial call
        renderOverallStatsChart(debaters); // Render chart
        // renderRecentMatches(matches); // Removed as per request
        renderIndividualMatchHistory(debaters, matches); // Re-added

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

        document.title = `DBA - ${debater.name || 'Unknown Debater'}'s Profile`;

        let metricsHtml = '';
        const metricLabels = [];
        const metricScores = [];
        // Ensure debater.metrics exists and is an object
        if (debater.metrics && typeof debater.metrics === 'object') {
            for (const [metricName, metricScore] of Object.entries(debater.metrics)) {
                const scoreValue = parseFloat(metricScore);
                const widthPercentage = (isNaN(scoreValue) || scoreValue < 0) ? 0 : (scoreValue / 10) * 100;
                metricsHtml += `
                    <div class="profile-metric d-flex align-items-center mb-2">
                        <span class="me-2 text-capitalize">${metricName.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <div class="progress flex-grow-1" role="progressbar" aria-label="${metricName} score" aria-valuenow="${scoreValue}" aria-valuemin="0" aria-valuemax="10">
                            <div class="progress-bar bg-info" style="width: ${widthPercentage}%;"></div>
                        </div>
                        <span class="metric-value ms-2">${isNaN(scoreValue) ? 'N/A' : `${scoreValue}/10`}</span>
                    </div>
                `;
                if (!isNaN(scoreValue)) {
                    metricLabels.push(metricName.replace(/([A-Z])/g, ' $1').trim());
                    metricScores.push(scoreValue);
                }
            }
        } else {
            metricsHtml = `<p class="text-muted text-center">No metric data available for this debater.</p>`;
        }

        const totalWinsLosses = (debater.wins || 0) + (debater.losses || 0);
        const winRate = totalWinsLosses > 0 ? (((debater.wins || 0) / totalWinsLosses) * 100).toFixed(2) : '0.00';
        const averageMetric = metricScores.length > 0 ? (metricScores.reduce((sum, score) => sum + score, 0) / metricScores.length).toFixed(2) : 'N/A';

        // Provide default values for potentially missing properties using optional chaining and nullish coalescing
        const debaterPhoto = debater.photo || 'assets/default_avatar.png';
        const debaterFlag = debater.flag || '';
        const debaterCountryCode = debater.country_code || 'XX';
        const debaterName = debater.name || 'Unknown Debater';
        const debaterRecord = debater.record || '0-0';
        const debaterCountry = debater.country || 'Unknown';
        const debaterCharacter = debater.character || 'Unknown';
        const debaterBio = debater.bio || 'No biography available.';


        const profilePageHtml = `
            <section class="container my-5">
                <div class="row justify-content-center">
                    <div class="col-lg-8">
                        <div class="card shadow p-4 animate__animated animate__fadeIn">
                            <div class="text-center">
                                <img src="${debaterPhoto}" class="profile-avatar mb-3 animate__animated animate__zoomIn" alt="${debaterName} Profile Photo" onerror="onImageError(this)">
                                <h2 class="profile-name animate__animated animate__fadeInDown">${debaterName} ${debaterFlag ? `<img src="${debaterFlag}" width="30" class="ms-2" alt="${debaterCountryCode} flag"/>` : ''}</h2>
                                <p class="profile-record animate__animated animate__fadeIn">Record: <span class="badge ${debater.wins > debater.losses ? 'bg-success' : 'bg-danger'}">${debaterRecord}</span></p>
                                <p class="text-muted"><i class="fas fa-percentage me-1"></i> Win Rate: ${winRate}% | <i class="fas fa-gamepad me-1"></i> Total Matches: ${totalWinsLosses}</p>
                                <p class="text-muted"><i class="fas fa-star-half-alt me-1"></i> Average Metric Score: ${averageMetric}/10</p>
                            </div>
                            <hr class="my-4">
                            <div class="profile-metrics mb-4 animate__animated animate__fadeInUp">
                                <h4 class="text-center mb-3">Key Metrics <i class="fas fa-chart-bar ms-2"></i></h4>
                                <div class="row">
                                    <div class="col-md-8 mx-auto">
                                        ${metricsHtml}
                                        ${metricScores.length > 0 ? `<canvas id="radarChart" height="250"></canvas>` : `<p class="text-muted text-center mt-3">No data to display radar chart.</p>`}
                                    </div>
                                </div>
                            </div>
                            <hr class="my-4">
                            <div class="profile-detail animate__animated animate__fadeInUp">
                                <h4 class="text-center mb-3">About ${debaterName} <i class="fas fa-info-circle ms-2"></i></h4>
                                <p><strong>Country:</strong> ${debaterCountry}</p>
                                <p><strong>Favorite Character:</strong> ${debaterCharacter}</p>
                                <p><strong>Bio:</strong> ${debaterBio}</p>
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
        if (radarChartCtx && metricScores.length > 0) { // Only render if there's data
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
                match.debater1?.id === debater.id || match.debater2?.id === debater.id
            ).sort((a, b) => {
                const dateA = a.date ? new Date(a.date) : new Date(0); // Use epoch for missing dates
                const dateB = b.date ? new Date(b.date) : new Date(0);
                // If dates are valid, sort by date (newest first). Otherwise, fall back to ID.
                if (dateA.getTime() !== new Date(0).getTime() && dateB.getTime() !== new Date(0).getTime()) {
                    return dateB.getTime() - dateA.getTime();
                }
                return (b.id || '').localeCompare(a.id || ''); // Fallback if dates are missing, safely handle missing IDs
            });

            let matchesHtml = '';
            if (debaterMatches.length > 0) {
                debaterMatches.forEach(match => {
                    // Safely get debater and opponent data, with fallbacks
                    const currentDebaterMatchData = match.debater1?.id === debater.id ? match.debater1 : match.debater2;
                    const opponentMatchData = match.debater1?.id === debater.id ? match.debater2 : match.debater1;

                    // Get full data from allDebatersData for opponent, if available
                    const opponentFullData = allDebatersData.find(d => d.id === opponentMatchData?.id);

                    const isWinner = match.winner === debater.name;
                    const statusBadgeClass = isWinner ? 'bg-success' : 'bg-danger';
                    const statusText = isWinner ? 'WIN' : 'LOSS';
                    const cardBackgroundClass = isWinner ? 'win-card' : 'loss-card';

                    // Use photo and name from full data if available, else from match data, else default
                    const opponentPhoto = (opponentFullData?.photo || opponentMatchData?.photo) || 'assets/default_avatar.png';
                    const opponentName = (opponentFullData?.name || opponentMatchData?.name) || 'Unknown Opponent';
                    const debaterCharacterDisplay = currentDebaterMatchData?.character || debater.character || 'Unknown';
                    const opponentCharacterDisplay = opponentMatchData?.character || opponentFullData?.character || 'Unknown';

                    const matchDate = match.date ? new Date(match.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown Date';

                    matchesHtml += `
                        <div class="col-12">
                            <div class="card shadow p-3 mb-2 d-flex flex-row align-items-center ${cardBackgroundClass} animate__animated animate__fadeIn">
                                <img src="${debaterPhoto}" width="50" height="50" class="rounded-circle me-3 object-fit-cover" alt="${debaterName}" onerror="onImageError(this)">
                                <div class="flex-grow-1">
                                    <h6 class="mb-1 fw-bold">${debaterName} <span class="badge ${statusBadgeClass}">${statusText}</span> vs <a href="#profile/${opponentMatchData?.id || ''}" class="text-decoration-none">${opponentName}</a></h6>
                                    <small class="text-muted">Method: ${match.method || 'N/A'} - Character: ${debaterCharacterDisplay} vs ${opponentCharacterDisplay}</small><br>
                                    <small class="text-muted"><i class="fas fa-calendar-alt me-1"></i> Date: ${matchDate} ${match.event ? `(Event: ${match.event})` : ''}</small>
                                </div>
                                <img src="${opponentPhoto}" width="50" height="50" class="rounded-circle ms-3 object-fit-cover" alt="${opponentName}" onerror="onImageError(this)">
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
                            ${debaters.map(d => `<option value="${d.id}">${d.name || 'Unknown Debater'}</option>`).join('')}
                        </select>
                    </div>
                    <div class="col-md-1 d-flex align-items-center justify-content-center">
                        <i class="fas fa-times vs-icon fs-3 text-secondary"></i>
                    </div>
                    <div class="col-md-5">
                        <select class="form-select mb-2" id="debaterSelect2" aria-label="Select second debater">
                            <option value="">Select Debater 2</option>
                            ${debaters.map(d => `<option value="${d.id}">${d.name || 'Unknown Debater'}</option>`).join('')}
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
            const totalMatchesA = (a.wins || 0) + (a.losses || 0);
            const totalMatchesB = (b.wins || 0) + (b.losses || 0);

            const winRateA = totalMatchesA > 0 ? (a.wins || 0) / totalMatchesA : 0;
            const winRateB = totalMatchesB > 0 ? (b.wins || 0) / totalMatchesB : 0;

            if (winRateA !== winRateB) return winRateB - winRateA; // Sort by win rate descending
            return totalMatchesB - totalMatchesA; // Then by total matches descending
        });

        const top3 = sortedDebaters.slice(0, 3);
        // Ensure low3 are distinct from top3 and truly represent the lowest performers
        // Filter out debaters with 0 total matches from the low record calculation unless explicitly desired
        const low3Candidates = [...debaters]
            .filter(d => ((d.wins || 0) + (d.losses || 0)) > 0 && !top3.some(t => t.id === d.id)) // Ensure some matches and not already in top3
            .sort((a, b) => {
                const totalMatchesA = (a.wins || 0) + (a.losses || 0);
                const totalMatchesB = (b.wins || 0) + (b.losses || 0);

                const winRateA = totalMatchesA > 0 ? (a.wins || 0) / totalMatchesA : 0;
                const winRateB = totalMatchesB > 0 ? (b.wins || 0) / totalMatchesB : 0;

                if (winRateA !== winRateB) return winRateA - winRateB; // Sort by win rate ascending
                return totalMatchesA - totalMatchesB; // Then by total matches ascending
            });

        const low3 = low3Candidates.slice(0, 3);

        let html = `
            <div class="col-md-6">
                <h3 class="mb-3 text-success">Top Record Debaters DBA <i class="fas fa-crown ms-2"></i></h3>
                <div class="row g-3" id="topDebatersCards">
        `;
        top3.forEach(debater => {
            const debaterPhoto = debater.photo || 'assets/default_avatar.png';
            const debaterFlag = debater.flag || '';
            const debaterCountryCode = debater.country_code || 'XX';
            const debaterName = debater.name || 'Unknown';
            const debaterRecord = debater.record || '0-0';
            const recordClass = (debater.wins || 0) > (debater.losses || 0) ? 'bg-success' : 'bg-danger';

            html += `
                <div class="col-md-4">
                    <div class="card shadow h-100 animate__animated animate__fadeInUp card-hover-effect debater-card-link" data-debater-id="${debater.id}" role="button" aria-label="View ${debaterName}'s profile">
                        <img src="${debaterPhoto}" class="card-img-top card-img-fixed-height" alt="${debaterName} photo" loading="lazy" onerror="onImageError(this)"/>
                        <div class="card-body">
                            <h4 class="card-title">${debaterName} ${debaterFlag ? `<img src="${debaterFlag}" width="24" class="ms-2" alt="${debaterCountryCode} flag"/>` : ''}</h4>
                            <p class="card-text">Record: <span class="badge ${recordClass}">${debaterRecord}</span></p>
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
                <div class="row g-3" id="lowDebatersCards">
        `;
        low3.forEach(debater => {
            const debaterPhoto = debater.photo || 'assets/default_avatar.png';
            const debaterFlag = debater.flag || '';
            const debaterCountryCode = debater.country_code || 'XX';
            const debaterName = debater.name || 'Unknown';
            const debaterRecord = debater.record || '0-0';
            const recordClass = (debater.wins || 0) > (debater.losses || 0) ? 'bg-success' : 'bg-danger';
            html += `
                <div class="col-md-4">
                    <div class="card shadow h-100 animate__animated animate__fadeInUp card-hover-effect debater-card-link" data-debater-id="${debater.id}" role="button" aria-label="View ${debaterName}'s profile">
                        <img src="${debaterPhoto}" class="card-img-top card-img-fixed-height" alt="${debaterName} photo" loading="lazy" onerror="onImageError(this)"/>
                        <div class="card-body">
                            <h4 class="card-title">${debaterName} ${debaterFlag ? `<img src="${debaterFlag}" width="24" class="ms-2" alt="${debaterCountryCode} flag"/>` : ''}</h4>
                            <p class="card-text">Record: <span class="badge ${recordClass}">${debaterRecord}</span></p>
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

        // Attach event listeners for the new debater cards
        document.querySelectorAll('.debater-card-link').forEach(card => {
            card.addEventListener('click', () => {
                const debaterId = card.dataset.debaterId;
                if (debaterId) {
                    // Navigate to profile page for full details
                    window.location.hash = `#profile/${debaterId}`;
                }
            });
        });
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
            const debaterPhoto = debater.photo || 'assets/default_avatar.png';
            const debaterFlag = debater.flag || '';
            const debaterCountryCode = debater.country_code || 'XX';
            const debaterName = debater.name || 'Unknown';
            const debaterRecord = debater.record || '0-0';
            const recordClass = (debater.wins || 0) > (debater.losses || 0) ? 'bg-success' : 'bg-danger';
            const debaterCharacter = debater.character || 'Unknown';
            const debaterSummary = debater.summary || 'No summary available.';

            html += `
                <div class="col-md-4">
                    <div class="card shadow h-100 text-center animate__animated animate__fadeInUp card-hover-effect" aria-label="Quick summary for ${debaterName}">
                        <img src="${debaterPhoto}" class="card-img-top card-img-fixed-height" alt="${debaterName} photo" loading="lazy" onerror="onImageError(this)"/>
                        <div class="card-body">
                            <h3 class="clickable-name" data-debater-id="${debater.id}" tabindex="0" role="button" aria-expanded="false" aria-controls="${debater.id}-desc">
                                ${debaterName} ${debaterFlag ? `<img src="${debaterFlag}" width="24" class="ms-2" alt="${debaterCountryCode} flag"/>` : ''}
                            </h3>
                            <p class="card-text">Record: <span class="badge ${recordClass}">${debaterRecord}</span></p>
                            <div id="${debater.id}-desc" class="debater-desc collapse">
                                <p><strong>Character:</strong> ${debaterCharacter}</p>
                                <p><strong>Summary:</strong> ${debaterSummary}</p>
                            </div>
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
     * Renders detailed debater profiles (all of them since search is removed).
     * @param {Array<Object>} debaters - Array of debater data.
     */
    function renderDetailedProfiles(debaters) {
        const detailedProfilesSection = document.getElementById('detailedProfilesSection');
        if (!detailedProfilesSection) return;

        // No filtering needed as search is removed, display all debaters
        const debatersToDisplay = debaters;

        let html = '';
        if (debatersToDisplay.length > 0) {
            debatersToDisplay.forEach(debater => {
                let metricsHtml = '';
                // Ensure debater.metrics exists and is an object
                if (debater.metrics && typeof debater.metrics === 'object') {
                    for (const [metricName, metricScore] of Object.entries(debater.metrics)) {
                        const scoreValue = parseFloat(metricScore);
                        const widthPercentage = (isNaN(scoreValue) || scoreValue < 0) ? 0 : (scoreValue / 10) * 100;
                        metricsHtml += `
                            <div class="profile-metric d-flex align-items-center mb-1">
                                <span class="me-2 text-capitalize">${metricName.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                <div class="progress flex-grow-1" role="progressbar" aria-label="${metricName} score" aria-valuenow="${scoreValue}" aria-valuemin="0" aria-valuemax="10">
                                    <div class="progress-bar bg-info" style="width: ${widthPercentage}%;"></div>
                                </div>
                                <span class="metric-value ms-2">${isNaN(scoreValue) ? 'N/A' : `${scoreValue}/10`}</span>
                            </div>
                        `;
                    }
                } else {
                    metricsHtml = `<p class="text-muted text-center">No metric data available.</p>`;
                }

                const debaterPhoto = debater.photo || 'assets/default_avatar.png';
                const debaterFlag = debater.flag || '';
                const debaterCountryCode = debater.country_code || 'XX';
                const debaterName = debater.name || 'Unknown';
                const debaterRecord = debater.record || '0-0';
                const recordClass = (debater.wins || 0) > (debater.losses || 0) ? 'bg-success' : 'bg-danger';

                html += `
                    <div class="col-md-6 col-lg-4 animate__animated animate__fadeInUp">
                        <div class="card shadow h-100 debater-profile-card card-hover-effect">
                            <img src="${debaterPhoto}" class="card-img-top debater-profile-img" alt="${debaterName} Profile Photo" loading="lazy" onerror="onImageError(this)">
                            <div class="card-body text-center">
                                <h4 class="card-title">${debaterName} ${debaterFlag ? `<img src="${debaterFlag}" width="24" class="ms-2" alt="${debaterCountryCode} flag"/>` : ''}</h4>
                                <p class="card-text">Record: <span class="badge ${recordClass}">${debaterRecord}</span></p>
                                <div class="mt-3 text-start">
                                    ${metricsHtml}
                                </div>
                                </div>
                        </div>
                    </div>
                `;
            });
        } else {
            html = `
                <div class="col-12 text-center text-muted animate__animated animate__fadeIn">
                    <p><i class="fas fa-info-circle me-2"></i> Tidak ada debater yang ditemukan.</p>
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
        const leaderboardSearch = document.getElementById('leaderboardSearch');
        const tierFilter = document.getElementById('tierFilter');
        const countryFilter = document.getElementById('countryFilter');

        const searchTerm = leaderboardSearch?.value.toLowerCase() || '';
        const tierValue = tierFilter?.value || '';
        const countryValue = countryFilter?.value || '';

        let filteredDebaters = debaters.filter(debater => {
            const matchesSearch = (debater.name || '').toLowerCase().includes(searchTerm);
            const matchesTier = tierValue === '' || debater.tier === tierValue;
            const matchesCountry = countryValue === '' || debater.country === countryValue;
            return matchesSearch && matchesTier && matchesCountry;
        });

        // Sort debaters for leaderboard
        filteredDebaters.sort((a, b) => {
            const sortColumn = currentLeaderboardSort.column;
            const sortOrder = currentLeaderboardSort.order;

            let valA, valB;

            switch (sortColumn) {
                case 'rank':
                    // Default sorting for 'rank' is by wins (descending for ascending rank)
                    // If rank is not explicitly defined in data, use wins as a proxy.
                    valA = a.wins || 0;
                    valB = b.wins || 0;
                    // For rank, higher wins means higher rank (lower numerical rank)
                    return sortOrder === 'asc' ? valB - valA : valA - valB;
                case 'name':
                    valA = (a.name || '').toLowerCase();
                    valB = (b.name || '').toLowerCase();
                    break;
                case 'country':
                    valA = (a.country || '').toLowerCase();
                    valB = (b.country || '').toLowerCase();
                    break;
                case 'wins':
                    valA = a.wins || 0;
                    valB = b.wins || 0;
                    break;
                default:
                    valA = a.id || ''; // Fallback to ID for consistent sorting
                    valB = b.id || '';
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
            const debaterWins = debater.wins || 0;
            const debaterLosses = debater.losses || 0;
            const totalMatches = debaterWins + debaterLosses;
            const winRate = totalMatches > 0 ? ((debaterWins / totalMatches) * 100).toFixed(0) : '0';
            const recordText = `${debaterWins}-${debaterLosses} (${winRate}%)`;
            const recordClass = debaterWins > debaterLosses ? 'bg-success' : 'bg-danger';

            const debaterPhoto = debater.photo || 'assets/default_avatar.png';
            const debaterFlag = debater.flag || '';
            const debaterCountryCode = debater.country_code || 'XX';
            const debaterName = debater.name || 'Unknown';
            const debaterCountry = debater.country || 'Unknown';


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
                    rankDisplay = '-'; // If tier is missing or invalid
            }

            row.innerHTML = `
                <td>${rankDisplay}</td>
                <td><img src="${debaterPhoto}" width="50" height="50" class="rounded-circle object-fit-cover leaderboard-avatar" alt="${debaterName}" onerror="onImageError(this)"></td>
                <td><a href="#profile/${debater.id}" class="text-decoration-none">${debaterName}</a></td>
                <td>${debaterFlag ? `<img src="${debaterFlag}" width="24" class="me-2" alt="${debaterCountryCode} flag"/>` : ''} ${debaterCountry}</td>
                <td><span class="badge ${recordClass}">${recordText}</span></td>
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
            overallStatsChartInstance = null;
        }

        const tierCounts = debaters.reduce((acc, debater) => {
            const tier = debater.tier || 'Unknown Tier'; // Handle missing tier
            acc[tier] = (acc[tier] || 0) + 1;
            return acc;
        }, { 'High Tier': 0, 'Mid Tier': 0, 'Low Tier': 0 }); // Initialize to ensure all primary tiers appear

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
                        'rgba(33, 37, 41, 0.7)',    // Dark (Black)
                        'rgba(200, 200, 200, 0.7)' // For 'Unknown Tier'
                    ],
                    borderColor: [
                        'rgba(255, 193, 7, 1)',
                        'rgba(108, 117, 125, 1)',
                        'rgba(33, 37, 41, 1)',
                        'rgba(200, 200, 200, 1)'
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
     * Renders a simplified individual match history section on the homepage.
     * @param {Array<Object>} debaters - Array of debater data.
     * @param {Array<Object>} matches - Array of match data.
     */
    function renderIndividualMatchHistory(debaters, matches) {
        const individualMatchHistorySection = document.getElementById('individualMatchHistory');
        if (!individualMatchHistorySection) return;

        let html = '';
        // Display 5 random debaters and their 3 latest matches
        const validDebaters = debaters.filter(d => d.id);
        const debatersToShow = validDebaters.sort(() => 0.5 - Math.random()).slice(0, 5); // Pick 5 random debaters

        if (debatersToShow.length === 0) {
            individualMatchHistorySection.innerHTML = `<div class="col-12 text-center text-muted"><p>No debaters to display match history for.</p></div>`;
            return;
        }

        debatersToShow.forEach(debater => {
            if (!debater.id) return; // Skip if debater somehow has no ID

            const debaterMatches = matches.filter(match =>
                match.debater1?.id === debater.id || match.debater2?.id === debater.id
            ).sort((a, b) => {
                const dateA = a.date ? new Date(a.date) : new Date(0);
                const dateB = b.date ? new Date(b.date) : new Date(0);
                return dateB.getTime() - dateA.getTime();
            }).slice(0, 3); // Show only the 3 latest matches per debater

            if (debaterMatches.length > 0) {
                const debaterPhoto = debater.photo || 'assets/default_avatar.png';
                const debaterName = debater.name || 'Unknown Debater';

                html += `
                    <div class="col-md-6 col-lg-4">
                        <div class="card shadow h-100 animate__animated animate__fadeInUp">
                            <div class="card-header bg-dark text-white d-flex align-items-center">
                                <img src="${debaterPhoto}" width="40" height="40" class="rounded-circle me-2 object-fit-cover" alt="${debaterName}" onerror="onImageError(this)">
                                <h5 class="mb-0 flex-grow-1">${debaterName}'s Latest Matches</h5>
                                <a href="#profile/${debater.id}" class="btn btn-sm btn-outline-light ms-auto">View All</a>
                            </div>
                            <ul class="list-group list-group-flush">
                `;
                debaterMatches.forEach(match => {
                    const opponentMatchData = match.debater1?.id === debater.id ? match.debater2 : match.debater1;
                    const opponentId = opponentMatchData?.id;
                    const opponentFullData = allDebatersData.find(d => d.id === opponentId);

                    const isWinner = match.winner === debater.name;
                    const statusBadgeClass = isWinner ? 'bg-success' : 'bg-danger';
                    const statusText = isWinner ? 'WIN' : 'LOSS';
                    const matchDate = match.date ? new Date(match.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A';
                    const matchMethod = match.method || 'N/A';

                    const opponentName = (opponentFullData?.name || opponentMatchData?.name) || 'Unknown Opponent';
                    const opponentPhoto = (opponentFullData?.photo || opponentMatchData?.photo) || 'assets/default_avatar.png';

                    html += `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <span class="badge ${statusBadgeClass}">${statusText}</span> vs <a href="#profile/${opponentId || ''}" class="text-decoration-none">${opponentName}</a>
                                <br><small class="text-muted">${matchMethod} - ${matchDate}</small>
                            </div>
                            <img src="${opponentPhoto}" width="30" height="30" class="rounded-circle object-fit-cover" alt="${opponentName}" onerror="onImageError(this)">
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
        // Debater Profile Search input is removed, so no listener needed here.

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

        // Leaderboard Sorting - delegated event listener for future-proof
        document.querySelectorAll('#leaderboard table thead').forEach(thead => {
            thead.removeEventListener('click', handleLeaderboardSort); // Remove old listener to prevent duplicates
            thead.addEventListener('click', handleLeaderboardSort);
        });

        function handleLeaderboardSort(event) {
            const header = event.target.closest('th[data-sort]');
            if (header) {
                const column = header.dataset.sort;
                let order = 'asc';
                if (currentLeaderboardSort.column === column) {
                    order = currentLeaderboardSort.order === 'asc' ? 'desc' : 'asc';
                }
                currentLeaderboardSort = { column, order };
                renderLeaderboard(debaters);
            }
        }

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

        if (!id1 || !id2 || id1 === id2) { // Added id1 === id2 check to prevent comparing same debater
            comparisonResults.innerHTML = `
                <div class="col-12 text-center text-muted">
                    <p><i class="fas fa-info-circle me-2"></i> Select two <strong>different</strong> debaters above to compare their profiles.</p>
                </div>
            `;
            return;
        }

        const debater1 = debaters.find(d => d.id === id1);
        const debater2 = debaters.find(d => d.id === id2);

        if (!debater1 || !debater2) {
            comparisonResults.innerHTML = `
                <div class="col-12 text-center text-danger">
                    <p><i class="fas fa-exclamation-triangle me-2"></i> One or both selected debaters not found in data.</p>
                </div>
            `;
            return;
        }

        // Safely access metrics, provide empty object if missing
        const metrics1 = debater1.metrics && typeof debater1.metrics === 'object' ? debater1.metrics : {};
        const metrics2 = debater2.metrics && typeof debater2.metrics === 'object' ? debater2.metrics : {};

        // Use all unique metric labels to ensure all metrics are displayed if one debater has more
        const allMetricLabels = [...new Set([...Object.keys(metrics1), ...Object.keys(metrics2)])];
        const labels = allMetricLabels;

        // Ensure data is numeric, use 0 if missing
        const data1 = labels.map(label => parseFloat(metrics1[label]) || 0);
        const data2 = labels.map(label => parseFloat(metrics2[label]) || 0);

        // Calculate Win Rates and Total Matches, with fallbacks for missing properties
        const totalMatches1 = (debater1.wins || 0) + (debater1.losses || 0);
        const winRate1 = totalMatches1 > 0 ? (((debater1.wins || 0) / totalMatches1) * 100).toFixed(2) : '0.00';
        const totalMatches2 = (debater2.wins || 0) + (debater2.losses || 0);
        const winRate2 = totalMatches2 > 0 ? (((debater2.wins || 0) / totalMatches2) * 100).toFixed(2) : '0.00';

        // Provide default values for potentially missing properties for display
        const debater1Photo = debater1.photo || 'assets/default_avatar.png';
        const debater2Photo = debater2.photo || 'assets/default_avatar.png';
        const debater1Name = debater1.name || 'Unknown Debater';
        const debater2Name = debater2.name || 'Unknown Debater';
        const debater1Flag = debater1.flag || '';
        const debater2Flag = debater2.flag || '';
        const debater1CountryCode = debater1.country_code || 'XX';
        const debater2CountryCode = debater2.country_code || 'XX';
        const debater1Record = debater1.record || '0-0';
        const debater2Record = debater2.record || '0-0';
        const debater1Character = debater1.character || 'N/A';
        const debater2Character = debater2.character || 'N/A';
        const recordClass1 = (debater1.wins || 0) > (debater1.losses || 0) ? 'bg-success' : 'bg-danger';
        const recordClass2 = (debater2.wins || 0) > (debater2.losses || 0) ? 'bg-success' : 'bg-danger';


        const compareHtml = `
            <div class="col-md-6 text-center animate__animated animate__fadeInLeft">
                <div class="card shadow p-3 h-100">
                    <img src="${debater1Photo}" class="compare-avatar mb-3" alt="${debater1Name}" onerror="onImageError(this)">
                    <h5>${debater1Name} ${debater1Flag ? `<img src="${debater1Flag}" width="24" class="ms-2" alt="${debater1CountryCode} flag"/>` : ''}</h5>
                    <p>Record: <span class="badge ${recordClass1}">${debater1Record}</span></p>
                    <p>Win Rate: ${winRate1}% | Total Matches: ${totalMatches1}</p>
                    <p>Character: ${debater1Character}</p>
                </div>
            </div>
            <div class="col-md-6 text-center animate__animated animate__fadeInRight">
                <div class="card shadow p-3 h-100">
                    <img src="${debater2Photo}" class="compare-avatar mb-3" alt="${debater2Name}" onerror="onImageError(this)">
                    <h5>${debater2Name} ${debater2Flag ? `<img src="${debater2Flag}" width="24" class="ms-2" alt="${debater2CountryCode} flag"/>` : ''}</h5>
                    <p>Record: <span class="badge ${recordClass2}">${debater2Record}</span></p>
                    <p>Win Rate: ${winRate2}% | Total Matches: ${totalMatches2}</p>
                    <p>Character: ${debater2Character}</p>
                </div>
            </div>
            <div class="col-12 mt-4 animate__animated animate__fadeInUp">
                <div class="card shadow p-4">
                    <h4 class="text-center mb-3">Metric Comparison</h4>
                    ${labels.length > 0 ? `<canvas id="comparisonChart" height="300"></canvas>` : `<p class="text-muted text-center">No comparable metric data available.</p>`}
                </div>
            </div>
        `;
        comparisonResults.innerHTML = compareHtml;

        const ctx = document.getElementById('comparisonChart');
        if (ctx && labels.length > 0) { // Only render if there's data to compare
            comparisonChartInstance = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: labels.map(label => label.replace(/([A-Z])/g, ' $1').trim()), // Make labels readable
                    datasets: [
                        {
                            label: debater1Name,
                            data: data1,
                            backgroundColor: 'rgba(13, 110, 253, 0.2)',
                            borderColor: 'rgba(13, 110, 253, 1)',
                            borderWidth: 1
                        },
                        {
                            label: debater2Name,
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
        // Ensure nav links are correctly highlighted
        document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
            link.classList.remove('active');
            const linkHref = link.getAttribute('href');
            if (linkHref === hash || (hash.startsWith('#profile/') && linkHref === '#home')) {
                link.classList.add('active');
            }
        });
    }

    // --- Initial Load ---

    // Show a loading message while data is being fetched
    setAppContent(`
        <div class="container my-5 text-center animate__animated animate__fadeIn">
            <i class="fas fa-spinner fa-spin fa-3x mb-3 text-primary"></i>
            <h2>Memuat data...</h2>
            <p>Mohon tunggu sebentar.</p>
        </div>
    `);

    // Load data and render initial page based on hash
    fetchData().then(() => {
        handleLocationHash();
        window.addEventListener('hashchange', handleLocationHash);

        // Add event listener for navigation links
        document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
            link.addEventListener('click', (event) => {
                const targetHash = event.target.getAttribute('href');
                if (targetHash) {
                    window.location.hash = targetHash;
                }
            });
        });
    });

});
