document.addEventListener('DOMContentLoaded', () => {
    // Fungsi untuk memuat data dari data.json
    async function fetchData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Error fetching data:", error);
            // Mengembalikan data kosong atau default jika gagal untuk menghindari error crash
            return { debaters: [], matches: [] };
        }
    }

    // Fungsi untuk merender Top & Low Record Debaters
    function renderTopLowRecords(debaters) {
        const topLowRecordsSection = document.getElementById('topLowRecordsSection');
        if (!topLowRecordsSection) return; // Keluar jika elemen tidak ada

        const sortedDebaters = [...debaters].sort((a, b) => {
            // Urutkan berdasarkan kemenangan terbanyak, lalu total pertandingan terbanyak
            const winsA = a.wins || 0;
            const lossesA = a.losses || 0;
            const winsB = b.wins || 0;
            const lossesB = b.losses || 0;

            const winRateA = (winsA + lossesA) > 0 ? winsA / (winsA + lossesA) : 0;
            const winRateB = (winsB + lossesB) > 0 ? winsB / (winsB + lossesB) : 0;

            if (winRateA !== winRateB) return winRateB - winRateA; // Urutkan berdasarkan rasio menang
            return (winsB + lossesB) - (winsA + lossesA); // Jika rasio sama, urutkan berdasarkan total pertandingan
        });

        const top3 = sortedDebaters.slice(0, 3);
        // Pastikan low3 tidak tumpang tindih dengan top3 jika jumlah debater sedikit
        const low3 = sortedDebaters.slice(-3).filter(d => !top3.some(t => t.id === d.id)).reverse();

        let html = `
            <div class="col-md-6">
                <h3 class="mb-3 text-success">Top Record Debaters DBA</h3>
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
                <h3 class="mb-3 text-danger">Low Record Debaters DBA</h3>
                <div class="row g-3">
        `;
        low3.forEach(debater => {
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
        `;
        topLowRecordsSection.innerHTML = html;
    }

    // Fungsi untuk merender Quick View Profiles
    function renderQuickViewProfiles(debaters) {
        const quickViewProfilesSection = document.getElementById('quickViewProfiles');
        if (!quickViewProfilesSection) return;

        let html = '';
        // Filter debaters yang ingin ditampilkan di quick view, atau tampilkan beberapa secara default
        // Saya akan tampilkan 3 debater pertama dari data.json sebagai contoh
        debaters.slice(0, 3).forEach(debater => {
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

        // Tambahkan event listener untuk toggleDesc (fade-in/slide-down)
        document.querySelectorAll('.clickable-name').forEach(element => {
            element.addEventListener('click', (event) => {
                const debaterId = element.dataset.debaterId;
                const descElement = document.getElementById(`${debaterId}-desc`);
                if (descElement) {
                    descElement.classList.toggle('show'); // Toggle class 'show'
                }
            });
        });
    }

    // Fungsi untuk merender Detailed Profiles (Metrik Profil Debater)
    function renderDetailedProfiles(debaters) {
        const detailedProfilesSection = document.getElementById('detailedProfilesSection');
        if (!detailedProfilesSection) return;

        let html = '';
        debaters.forEach(debater => {
            const score = debater.wins > debater.losses ? '8/10' : '5/10'; // Menentukan skor berdasarkan rekor

            let metricsHtml = '';
            // Iterasi melalui objek metrics di data.json
            for (const [metricName, metricScore] of Object.entries(debater.metrics)) {
                metricsHtml += `
                    <div class="profile-metric">
                        <span>${metricName}:</span> <span class="metric-value">${metricScore}/10</span>
                    </div>
                `;
            }

            html += `
                <div class="col-lg-4 col-md-6">
                    <div class="card h-100 animate__animated animate__fadeInUp">
                        <img src="${debater.photo}" class="card-img-top profile-avatar" alt="${debater.name} Profile">
                        <div class="card-body">
                            <h3 class="profile-name">
                                <a href="profile.html?id=${debater.id}" class="text-decoration-none">${debater.name}</a>
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

    // Fungsi untuk merender Leaderboard
    function renderLeaderboard(debaters, query = '') {
        const highTierBody = document.getElementById('highTierBody');
        const midTierBody = document.getElementById('midTierBody');
        const lowTierBody = document.getElementById('lowTierBody');

        if (!highTierBody || !midTierBody || !lowTierBody) return;

        // Clear existing content
        highTierBody.innerHTML = '';
        midTierBody.innerHTML = '';
        lowTierBody.innerHTML = '';

        const filteredDebaters = debaters.filter(debater =>
            debater.name.toLowerCase().includes(query.toLowerCase()) ||
            debater.country.toLowerCase().includes(query.toLowerCase()) ||
            debater.country_code.toLowerCase().includes(query.toLowerCase())
        );

        // Sorting by wins for leaderboard within tiers
        const highTier = filteredDebaters.filter(d => d.tier === 'High Tier').sort((a, b) => b.wins - a.wins);
        const midTier = filteredDebaters.filter(d => d.tier === 'Mid Tier').sort((a, b) => b.wins - a.wins);
        const lowTier = filteredDebaters.filter(d => d.tier === 'Low Tier').sort((a, b) => b.wins - a.wins);

        function populateTier(tbody, tierList) {
            if (tierList.length === 0 && query !== '') {
                tbody.innerHTML = `<tr><td colspan="5" class="text-muted">No debaters found in this tier matching your search.</td></tr>`;
                return;
            }
            // Populate up to 20 rows, fill with empty if less
            for (let i = 0; i < Math.max(tierList.length, 5); i++) { // Minimal 5 baris kosong
                const debater = tierList[i];
                if (debater) {
                    tbody.innerHTML += `
                        <tr>
                            <td>${i + 1}</td>
                            <td><img src="${debater.photo}" width="40" class="rounded-circle" alt="${debater.name}"></td>
                            <td><a href="profile.html?id=${debater.id}" class="text-decoration-none">${debater.name}</a></td>
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
    }

    // Fungsi untuk merender Recent Matches
    function renderRecentMatches(matches) {
        const recentMatchesSection = document.getElementById('recentMatchesSection');
        if (!recentMatchesSection) return;

        let html = '';
        // Urutkan pertandingan berdasarkan ID (asumsi ID lebih tinggi berarti lebih baru)
        const sortedMatches = [...matches].sort((a, b) => b.id.localeCompare(a.id));

        // Hanya tampilkan 3 pertandingan terbaru
        sortedMatches.slice(0, 3).forEach(match => {
            html += `
                <div class="col-lg-4 col-md-6 col-sm-12">
                    <div class="card match-card animate__animated animate__fadeInUp">
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

    // Fungsi untuk merender Individual Match History
    function renderIndividualMatchHistory(debaters, matches) {
        const individualMatchHistorySection = document.getElementById('individualMatchHistory');
        if (!individualMatchHistorySection) return;

        let html = '';
        // Batasi untuk beberapa debater saja atau tampilkan semua
        debaters.forEach(debater => {
            const debaterMatches = matches.filter(match =>
                match.debater1.id === debater.id || match.debater2.id === debater.id
            ).sort((a, b) => b.id.localeCompare(a.id)); // Urutkan dari yang terbaru

            if (debaterMatches.length > 0) { // Hanya tampilkan jika ada pertandingan
                // Hanya ambil 1 pertandingan terbaru dari setiap debater untuk ringkasan di halaman utama
                const latestMatch = debaterMatches[0];
                const isWinner = latestMatch.winner === debater.name;
                const opponent = latestMatch.debater1.id === debater.id ? latestMatch.debater2 : latestMatch.debater1;
                const statusText = isWinner ? 'Win' : 'Loss';
                const cardClass = isWinner ? 'win-card' : 'loss-card';
                
                // Dapatkan objek debater lawan untuk mengakses foto
                const opponentDebater = debaters.find(d => d.id === opponent.id);
                const opponentPhoto = opponentDebater ? opponentDebater.photo : ''; // Fallback jika foto lawan tidak ditemukan

                html += `
                    <div class="col-md-6">
                        <div class="card shadow ${cardClass} animate__animated animate__fadeInUp">
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

    // Fungsi untuk merender halaman profil individual (profile.html)
    async function renderIndividualProfilePage() {
        const urlParams = new URLSearchParams(window.location.search);
        const debaterId = urlParams.get('id');
        const debaterProfileDetail = document.getElementById('debaterProfileDetail');

        if (!debaterId || !debaterProfileDetail) {
            if (debaterProfileDetail) {
                debaterProfileDetail.innerHTML = '<p class="text-center text-danger">Debater ID not found in URL.</p>';
            }
            document.getElementById('profilePageTitle').textContent = 'Debater Not Found';
            return;
        }

        const data = await fetchData();
        const debater = data.debaters.find(d => d.id === debaterId);

        if (!debater) {
            if (debaterProfileDetail) {
                debaterProfileDetail.innerHTML = '<p class="text-center text-danger">Debater not found.</p>';
            }
            document.getElementById('profilePageTitle').textContent = 'Debater Not Found';
            return;
        }

        // Update judul halaman
        document.getElementById('profilePageTitle').textContent = `DBA - ${debater.name}'s Profile`;

        let metricsHtml = '';
        for (const [metricName, metricScore] of Object.entries(debater.metrics)) {
            metricsHtml += `
                <div class="profile-metric">
                    <span>${metricName}:</span> <span class="metric-value">${metricScore}/10</span>
                </div>
            `;
        }

        let profileHtml = `
            <div class="text-center">
                <img src="${debater.photo}" class="profile-avatar mb-3 animate__animated animate__zoomIn" alt="${debater.name} Profile">
                <h2 class="profile-name animate__animated animate__fadeInDown">${debater.name} <img src="${debater.flag}" width="30" class="ms-2" alt="${debater.country_code}"/></h2>
                <p class="profile-record animate__animated animate__fadeIn">Record: <span class="badge ${debater.wins > debater.losses ? 'bg-success' : 'bg-danger'}">${debater.record}</span></p>
            </div>
            <hr class="my-4">
            <div class="profile-metrics mb-4 animate__animated animate__fadeInUp">
                <h4 class="text-center mb-3">Key Metrics</h4>
                <div class="row">
                    <div class="col-md-6 mx-auto"> ${metricsHtml}
                    </div>
                </div>
            </div>
            <hr class="my-4">
            <div class="profile-detail animate__animated animate__fadeInUp">
                <h4 class="text-center mb-3">About ${debater.name}</h4>
                <p><strong>Country:</strong> ${debater.country}</p>
                <p><strong>Favorite Character:</strong> ${debater.character}</p>
                <p><strong>Bio:</strong> ${debater.bio}</p>
            </div>
            <hr class="my-4">
            <h4 class="text-center mb-3 animate__animated animate__fadeInUp">Match History</h4>
            <div class="row g-3" id="individualFullMatchHistory">
                </div>
        `;
        debaterProfileDetail.innerHTML = profileHtml;

        // Render all matches for this specific debater on their profile page
        const individualFullMatchHistorySection = document.getElementById('individualFullMatchHistory');
        if (individualFullMatchHistorySection) {
            const debaterMatches = data.matches.filter(match =>
                match.debater1.id === debater.id || match.debater2.id === debater.id
            ).sort((a, b) => b.id.localeCompare(a.id)); // Urutkan dari yang terbaru

            let matchesHtml = '';
            if (debaterMatches.length > 0) {
                debaterMatches.forEach(match => {
                    const isWinner = match.winner === debater.name;
                    const opponent = match.debater1.id === debater.id ? match.debater2 : match.debater1;
                    const statusBadgeClass = isWinner ? 'bg-success' : 'bg-danger';
                    const statusText = isWinner ? 'WIN' : 'LOSS';
                    const cardBackgroundClass = isWinner ? 'win-card' : 'loss-card';
                    
                    const opponentDebater = data.debaters.find(d => d.id === opponent.id);
                    const opponentPhoto = opponentDebater ? opponentDebater.photo : '';

                    matchesHtml += `
                        <div class="col-md-12">
                            <div class="card shadow p-3 mb-2 d-flex flex-row align-items-center ${cardBackgroundClass} animate__animated animate__fadeIn">
                                <img src="${debater.photo}" width="50" class="rounded-circle me-3" alt="${debater.name}">
                                <div class="flex-grow-1">
                                    <h6 class="mb-1 fw-bold">${debater.name} <span class="badge ${statusBadgeClass}">${statusText}</span> vs ${opponent.name}</h6>
                                    <small class="text-muted">${match.method} - Character: ${debater.character} vs ${opponent.character}</small>
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


    // Logic utama untuk memuat data dan merender
    // Ini akan memeriksa URL untuk menentukan apakah ini halaman profil individual atau halaman utama.
    if (window.location.pathname.endsWith('profile.html')) {
        renderIndividualProfilePage();
    } else {
        fetchData().then(data => {
            renderTopLowRecords(data.debaters);
            renderQuickViewProfiles(data.debaters);
            renderDetailedProfiles(data.debaters);
            renderLeaderboard(data.debaters);
            renderRecentMatches(data.matches);
            renderIndividualMatchHistory(data.debaters, data.matches);

            // Event listener untuk pencarian Leaderboard
            document.getElementById('leaderboardSearch').addEventListener('keyup', (event) => {
                renderLeaderboard(data.debaters, event.target.value);
            });
        });
    }
});
