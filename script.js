document.addEventListener('DOMContentLoaded', () => {
    let allDebatersData = []; // Store fetched debaters globally
    let allMatchesData = [];   // Store fetched matches globally

    // --- Core Functions ---

    // Function to fetch data from data.json
    async function fetchData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            allDebatersData = data.debaters; // Store for global use
            allMatchesData = data.matches;   // Store for global use
            return data;
        } catch (error) {
            console.error("Error fetching data:", error);
            document.getElementById('app-root').innerHTML = `
                <div class="container my-5 text-center text-danger">
                    <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                    <h2>Failed to load data!</h2>
                    <p>Please check if 'data.json' exists and is valid.</p>
                </div>
            `;
            return null; // Return null to indicate failure
        }
    }

    // Function to set content of the app-root div
    function setAppContent(contentHtml) {
        const appRoot = document.getElementById('app-root');
        if (appRoot) {
            appRoot.innerHTML = contentHtml;
        }
    }

    // --- Rendering Functions for various sections ---

    function renderHomePage(debaters, matches) {
        const homePageHtml = `
            <div class="hero-image-container">
              <img src="7745A053-1315-4B4D-AB24-9BFB05370A20.jpeg" alt="Debater Battle Arena Hero">
            </div>

            <section class="container my-5">
              <h2 class="text-center mb-4 fw-bold text-uppercase animate__animated animate__fadeInDown">Top & Low Record Debaters</h2>
              <div class="row g-4" id="topLowRecordsSection">
                </div>
            </section>

            <hr class="my-5">

            <section class="container my-5">
              <h2 class="mb-4 text-center fw-bold text-uppercase animate__animated animate__fadeInDown">Debater Profiles (Quick View)</h2>
              <div class="row g-4 justify-content-center" id="quickViewProfiles">
                </div>
            </section>

            <hr class="my-5">

            <section class="container my-5 debater-profile">
              <h2 class="text-center fw-bold text-uppercase mb-4 animate__animated animate__fadeInDown">Debater Profile Metrics</h2>
              
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
              <h2 class="text-center fw-bold text-uppercase mb-4 animate__animated animate__fadeInDown">Leaderboard Per Tier (DBA)</h2>

              <div class="mb-3 animate__animated animate__fadeIn">
                <input type="text" class="form-control" id="leaderboardSearch" placeholder="Cari debater di leaderboard...">
              </div>

              <div class="mb-5">
                <h3 class="text-white bg-warning text-center py-2 rounded-top animate__animated animate__fadeInLeft">High Tier <i class="fas fa-star ms-2"></i></h3>
                <div class="table-responsive animate__animated animate__fadeInUp">
                  <table class="table table-bordered table-striped text-center align-middle">
                    <thead class="table-dark" id="highTierHeader">
                      <tr>
                        <th data-sort="rank">Rank <i class="fas fa-sort sort-icon"></i></th>
                        <th>Photo</th>
                        <th>Name</th>
                        <th>Country</th>
                        <th data-sort="record">Record <i class="fas fa-sort sort-icon"></i></th>
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
                  <table class="table table-bordered table-striped text-center align-middle">
                    <thead class="table-dark" id="midTierHeader">
                      <tr>
                        <th data-sort="rank">Rank <i class="fas fa-sort sort-icon"></i></th>
                        <th>Photo</th>
                        <th>Name</th>
                        <th>Country</th>
                        <th data-sort="record">Record <i class="fas fa-sort sort-icon"></i></th>
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
                  <table class="table table-bordered table-striped text-center align-middle">
                    <thead class="table-dark" id="lowTierHeader">
                      <tr>
                        <th data-sort="rank">Rank <i class="fas fa-sort sort-icon"></i></th>
                        <th>Photo</th>
                        <th>Name</th>
                        <th>Country</th>
                        <th data-sort="record">Record <i class="fas fa-sort sort-icon"></i></th>
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

        // Setelah HTML di-set, panggil fungsi render untuk setiap bagian
        renderTopLowRecords(debaters);
        renderQuickViewProfiles(debaters);
        renderDetailedProfiles(debaters, ''); // Initialize empty
        renderLeaderboard(debaters);
        renderRecentMatches(matches);
        renderIndividualMatchHistory(debaters, matches);

        // Re-attach event listeners as DOM elements are newly created
        attachHomePageEventListeners(debaters, matches);
    }

    function renderProfilePage(debaterId, debaters, matches) {
        const debater = debaters.find(d => d.id === debaterId);

        if (!debater) {
            setAppContent(`
                <div class="container my-5 text-center text-danger animate__animated animate__fadeIn">
                    <i class="fas fa-user-times fa-3x mb-3"></i>
                    <h2>Debater Not Found!</h2>
                    <p>The profile you are looking for does not exist.</p>
                    <a href="#home" class="btn btn-primary mt-3"><i class="fas fa-arrow-left me-2"></i> Back to Home</a>
                </div>
            `);
            document.title = 'DBA - Not Found';
            return;
        }

        document.title = `DBA - ${debater.name}'s Profile`;

        let metricsHtml = '';
        for (const [metricName, metricScore] of Object.entries(debater.metrics)) {
            const widthPercentage = (parseFloat(metricScore) / 10) * 100; // Calculate percentage for progress bar
            metricsHtml += `
                <div class="profile-metric">
                    <span>${metricName}:</span>
                    <div class="progress flex-grow-1">
                        <div class="progress-bar" role="progressbar" style="width: ${widthPercentage}%;" aria-valuenow="${metricScore}" aria-valuemin="0" aria-valuemax="10"></div>
                    </div>
                    <span class="metric-value">${metricScore}/10</span>
                </div>
            `;
        }

        const profilePageHtml = `
            <section class="container my-5">
                <div class="row justify-content-center">
                    <div class="col-lg-8">
                        <div class="card shadow p-4 animate__animated animate__fadeIn">
                            <div class="text-center">
                                <img src="${debater.photo}" class="profile-avatar mb-3 animate__animated animate__zoomIn" alt="${debater.name} Profile">
                                <h2 class="profile-name animate__animated animate__fadeInDown">${debater.name} <img src="${debater.flag}" width="30" class="ms-2" alt="${debater.country_code}"/></h2>
                                <p class="profile-record animate__animated animate__fadeIn">Record: <span class="badge ${debater.wins > debater.losses ? 'bg-success' : 'bg-danger'}">${debater.record}</span></p>
                            </div>
                            <hr class="my-4">
                            <div class="profile-metrics mb-4 animate__animated animate__fadeInUp">
                                <h4 class="text-center mb-3">Key Metrics <i class="fas fa-chart-bar ms-2"></i></h4>
                                <div class="row">
                                    <div class="col-md-10 mx-auto">
                                        ${metricsHtml}
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
                                <a href="#home" class="btn btn-outline-primary"><i class="fas fa-arrow-left me-2"></i> Back to Home</a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;
        setAppContent(profilePageHtml);

        // Render full match history for the specific debater
        const individualFullMatchHistorySection = document.getElementById('individualFullMatchHistory');
        if (individualFullMatchHistorySection) {
            const debaterMatches = matches.filter(match =>
                match.debater1.id === debater.id || match.debater2.id === debater.id
            ).sort((a, b) => b.id.localeCompare(a.id));

            let matchesHtml = '';
            if (debaterMatches.length > 0) {
                debaterMatches.forEach(match => {
                    const isWinner = match.winner === debater.name;
                    const opponent = match.debater1.id === debater.id ? match.debater2 : match.debater1;
                    const statusBadgeClass = isWinner ? 'bg-success' : 'bg-danger';
                    const statusText = isWinner ? 'WIN' : 'LOSS';
                    const cardBackgroundClass = isWinner ? 'win-card' : 'loss-card';
                    
                    const opponentDebater = debaters.find(d => d.id === opponent.id);
                    const opponentPhoto = opponentDebater ? opponentDebater.photo : '';

                    matchesHtml += `
                        <div class="col-md-12">
                            <div class="card shadow p-3 mb-2 d-flex flex-row align-items-center ${cardBackgroundClass} animate__animated animate__fadeIn">
                                <img src="${debater.photo}" width="50" class="rounded-circle me-3" alt="${debater.name}">
                                <div class="flex-grow-1">
                                    <h6 class="mb-1 fw-bold">${debater.name} <span class="badge ${statusBadgeClass}">${statusText}</span> vs ${opponent.name}</h6>
                                    <small class="text-muted">Method: ${match.method} - Character: ${debater.character} vs ${opponent.character}</small>
                                </div>
                                <img src="${opponentPhoto}" width="50" class="rounded-circle ms-3" alt="${opponent.name}">
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

    // --- Specific Section Renderers (used by renderHomePage) ---

    function renderTopLowRecords(debaters) {
        const topLowRecordsSection = document.getElementById('topLowRecordsSection');
        if (!topLowRecordsSection) return;

        const sortedDebaters = [...debaters].sort((a, b) => {
            const winsA = a.wins || 0;
            const lossesA = a.losses || 0;
            const winsB = b.wins || 0;
            const lossesB = b.losses || 0;

            const winRateA = (winsA + lossesA) > 0 ? winsA / (winsA + lossesA) : 0;
            const winRateB = (winsB + lossesB) > 0 ? winsB / (winsB + lossesB) : 0;

            if (winRateA !== winRateB) return winRateB - winRateA;
            return (winsB + lossesB) - (winsA + lossesA);
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
                    <div class="card shadow h-100 animate__animated animate__fadeInUp">
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
                    <div class="card shadow h-100 animate__animated animate__fadeInUp">
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

    function renderQuickViewProfiles(debaters) {
        const quickViewProfilesSection = document.getElementById('quickViewProfiles');
        if (!quickViewProfilesSection) return;

        let html = '';
        debaters.slice(0, 3).forEach(debater => { // Showing first 3 for quick view
            html += `
                <div class="col-md-4">
                    <div class="card shadow h-100 text-center animate__animated animate__fadeInUp">
                        <img src="${debater.photo}" class="card-img-top" alt="${debater.name}"/>
                        <div class="card-body">
                            <h3 class="clickable-name" data-debater-id="${debater.id}">
                                ${debater.name} <img src="${debater.flag}" width="24" class="ms-2" alt="${debater.country_code}"/>
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

        // Attach event listeners for toggleDesc
        quickViewProfilesSection.querySelectorAll('.clickable-name').forEach(element => {
            element.addEventListener('click', () => {
                const debaterId = element.dataset.debaterId;
                const descElement = document.getElementById(`${debaterId}-desc`);
                if (descElement) {
                    descElement.classList.toggle('show');
                }
            });
        });
    }

    function renderDetailedProfiles(allDebaters, filterQuery = '') {
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
                        <div class="progress flex-grow-1">
                            <div class="progress-bar" role="progressbar" style="width: ${widthPercentage}%;" aria-valuenow="${metricScore}" aria-valuemin="0" aria-valuemax="10"></div>
                        </div>
                        <span class="metric-value">${metricScore}/10</span>
                    </div>
                `;
            }

            html += `
                <div class="col-lg-4 col-md-6 animate__animated animate__fadeInUp">
                    <div class="card h-100">
                        <img src="${debater.photo}" class="card-img-top profile-avatar" alt="${debater.name} Profile">
                        <div class="card-body">
                            <h3 class="profile-name">
                                <a href="#profile/${debater.id}" class="text-decoration-none">${debater.name}</a>
                                <img src="${debater.flag}" width="24" class="ms-2" alt="${debater.country_code}"/>
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

    function renderLeaderboard(debaters, query = '', sortColumn = 'rank', sortOrder = 'asc') {
        const highTierBody = document.getElementById('highTierBody');
        const midTierBody = document.getElementById('midTierBody');
        const lowTierBody = document.getElementById('lowTierBody');

        if (!highTierBody || !midTierBody || !lowTierBody) return;

        highTierBody.innerHTML = '';
        midTierBody.innerHTML = '';
        lowTierBody.innerHTML = '';

        let filteredDebaters = debaters.filter(debater =>
            debater.name.toLowerCase().includes(query.toLowerCase()) ||
            debater.country.toLowerCase().includes(query.toLowerCase()) ||
            debater.country_code.toLowerCase().includes(query.toLowerCase())
        );

        function sortTier(tierList) {
            return tierList.sort((a, b) => {
                let valA, valB;
                if (sortColumn === 'rank' || sortColumn === 'record') { // Default sort by wins for 'rank' and 'record'
                    valA = a.wins;
                    valB = b.wins;
                } else {
                    valA = a[sortColumn];
                    valB = b[sortColumn];
                }

                if (sortOrder === 'asc') {
                    return valA - valB;
                } else {
                    return valB - valA;
                }
            });
        }

        const highTier = sortTier(filteredDebaters.filter(d => d.tier === 'High Tier'));
        const midTier = sortTier(filteredDebaters.filter(d => d.tier === 'Mid Tier'));
        const lowTier = sortTier(filteredDebaters.filter(d => d.tier === 'Low Tier'));

        function populateTier(tbody, tierList) {
            if (tierList.length === 0 && query !== '') {
                tbody.innerHTML = `<tr><td colspan="5" class="text-muted">No debaters found in this tier matching your search.</td></tr>`;
                return;
            }
            const minRows = Math.max(tierList.length, 5); // Ensure at least 5 rows
            for (let i = 0; i < minRows; i++) {
                const debater = tierList[i];
                if (debater) {
                    tbody.innerHTML += `
                        <tr>
                            <td>${i + 1}</td>
                            <td><img src="${debater.photo}" width="40" class="rounded-circle" alt="${debater.name}"></td>
                            <td><a href="#profile/${debater.id}" class="text-decoration-none">${debater.name}</a></td>
                            <td><img src="${debater.flag}" width="20" class="me-1" alt="${debater.country_code}"> ${debater.country_code}</td>
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
        const sortedMatches = [...matches].sort((a, b) => b.id.localeCompare(a.id));

        sortedMatches.slice(0, 3).forEach(match => {
            html += `
                <div class="col-lg-4 col-md-6 col-sm-12 animate__animated animate__fadeInUp">
                    <div class="card match-card">
                        <img src="${match.image}" class="match-img-16by9 card-img-top" alt="${match.debater1.name} vs ${match.debater2.name}">
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
                            <small class="text-muted mt-2 d-block">Method: ${match.method}</small>
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
        debaters.forEach(debater => {
            const debaterMatches = matches.filter(match =>
                match.debater1.id === debater.id || match.debater2.id === debater.id
            ).sort((a, b) => b.id.localeCompare(a.id));

            if (debaterMatches.length > 0) {
                const latestMatch = debaterMatches[0];
                const isWinner = latestMatch.winner === debater.name;
                const opponent = latestMatch.debater1.id === debater.id ? latestMatch.debater2 : latestMatch.debater1;
                const statusText = isWinner ? 'Win' : 'Loss';
                const cardClass = isWinner ? 'win-card' : 'loss-card';
                
                const opponentDebater = debaters.find(d => d.id === opponent.id);
                const opponentPhoto = opponentDebater ? opponentDebater.photo : '';

                html += `
                    <div class="col-md-6 animate__animated animate__fadeInUp">
                        <div class="card shadow ${cardClass}">
                            <div class="card-body d-flex align-items-center">
                                <img src="${debater.photo}" class="me-3 rounded debater-thumbnail" alt="${debater.name}">
                                <div class="flex-grow-1">
                                    <h5 class="fw-bold">${debater.name} <img src="${debater.flag}" width="20" class="ms-1 flag-icon" alt="${debater.country_code}"></h5>
                                    <p class="mb-1">Record: <span class="badge ${debater.wins > debater.losses ? 'bg-success' : 'bg-danger'}">${debater.record}</span></p>
                                    <p class="mb-0">${statusText} vs ${opponent.name} [${latestMatch.method}]</p>
                                </div>
                                <img src="${opponentPhoto}" width="40" class="ms-3 rounded-circle" alt="${opponent.name}'s Photo">
                            </div>
                        </div>
                    </div>
                `;
            }
        });
        individualMatchHistorySection.innerHTML = html;
    }

    // --- Event Listener Attachments (called after content is rendered) ---

    function attachHomePageEventListeners(debaters, matches) {
        // Leaderboard Search
        const leaderboardSearchInput = document.getElementById('leaderboardSearch');
        if (leaderboardSearchInput) {
            leaderboardSearchInput.addEventListener('keyup', (event) => {
                renderLeaderboard(debaters, event.target.value);
            });
        }

        // Debater Profile Search
        const debaterProfileSearchInput = document.getElementById('debaterProfileSearch');
        if (debaterProfileSearchInput) {
            debaterProfileSearchInput.addEventListener('keyup', (event) => {
                renderDetailedProfiles(debaters, event.target.value);
            });
        }

        // Leaderboard Sorting
        document.querySelectorAll('.table thead th[data-sort]').forEach(header => {
            let currentSortOrder = 'asc'; // Initial sort order for this header
            header.addEventListener('click', () => {
                const sortColumn = header.dataset.sort;
                currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
                renderLeaderboard(debaters, leaderboardSearchInput ? leaderboardSearchInput.value : '', sortColumn, currentSortOrder);
            });
        });
    }


    // --- Router Logic ---
    function router() {
        const path = window.location.hash.slice(1) || 'home'; // Get path after # or default to 'home'
        const [route, id] = path.split('/');

        // Show spinner while loading content
        setAppContent(`
            <div class="container d-flex justify-content-center align-items-center" style="min-height: 80vh;">
                <div class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-3">Loading content...</p>
                </div>
            </div>
        `);

        fetchData().then(data => {
            if (!data) return; // Exit if data fetching failed

            if (route === 'home' || route === '') {
                renderHomePage(data.debaters, data.matches);
            } else if (route === 'profile' && id) {
                renderProfilePage(id, data.debaters, data.matches);
            } else {
                // 404 Not Found
                setAppContent(`
                    <div class="container my-5 text-center text-danger animate__animated animate__fadeIn">
                        <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                        <h2>Page Not Found!</h2>
                        <p>The page you are looking for does not exist.</p>
                        <a href="#home" class="btn btn-primary mt-3"><i class="fas fa-arrow-left me-2"></i> Back to Home</a>
                    </div>
                `);
                document.title = 'DBA - 404';
            }
        });
    }

    // Listen for hash changes (e.g., when clicking #links)
    window.addEventListener('hashchange', router);

    // Initial route load
    router();
});
