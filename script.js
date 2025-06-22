document.addEventListener('DOMContentLoaded', () => {
    let allDebatersData = [];
    let allMatchesData = [];
    let currentLeaderboardSort = { column: 'rank', order: 'asc' }; // Default sort for leaderboard
    let overallStatsChartInstance = null; // To store Chart.js instance for overall stats chart

    // Data pertandingan terbaru yang diminta pengguna
    // Perhatikan: UUID gambar ini perlu diganti dengan URL gambar asli Anda.
    // Saat ini, saya menggunakan placehold.co sebagai placeholder.
    const recentMatchData = [
        {
            id: 'recent-match-1',
            image: '4ba98405-9174-4806-86b0-48db675ff249.jpeg',
            debater1: { name: 'Hiroo', country: 'Indonesia', status: 'Winner', id: 'debater-hiroo' },
            debater2: { name: 'Renji', country: 'Malaysia', status: 'Loss', id: 'debater-renji' }
        },
        {
            id: 'recent-match-2',
            image: '5c6e6c7b-dc86-4ca3-a496-6b0d34eefa77.jpeg',
            debater1: { name: 'Zogratis', country: 'Indonesia', status: 'Winner', id: 'debater-zogratis' },
            debater2: { name: 'Muchibei', country: 'Malaysia', status: 'Loss', id: 'debater-muchibei' }
        },
        {
            id: 'recent-match-3',
            image: '16f4edc9-df34-4106-aa40-cecc9f3ad6e8.jpeg',
            debater1: { name: 'Aryanwt', country: 'Indonesia', status: 'Winner', id: 'debater-aryanwt' },
            debater2: { name: 'Rim', country: 'Malaysia', status: 'Loss', id: 'debater-rim' }
        }
    ];

    // Peta nama negara ke emoji bendera
    const countryFlags = {
        'Indonesia': '🇮🇩',
        'Malaysia': '🇲🇾'
    };

    // --- Fungsi Utilitas ---

    function showToast(message, type = 'info') {
        const toastEl = document.getElementById('liveToast');
        if (!toastEl) return;
        const toastBody = document.getElementById('toastBody');
        if (toastBody) toastBody.textContent = message;

        toastEl.classList.remove('text-bg-primary', 'text-bg-success', 'text-bg-danger', 'text-bg-warning', 'text-bg-info');
        switch (type) {
            case 'success': toastEl.classList.add('text-bg-success'); break;
            case 'error': toastEl.classList.add('text-bg-danger'); break;
            case 'warning': toastEl.classList.add('text-bg-warning'); break;
            case 'info': toastEl.classList.add('text-bg-info'); break;
            default: toastEl.classList.add('text-bg-primary'); break;
        }
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    }

    async function fetchData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (!Array.isArray(data.debaters) || !Array.isArray(data.matches)) {
                throw new Error("Invalid data structure: 'debaters' or 'matches' is not an array.");
            }
            allDebatersData = data.debaters;
            allMatchesData = data.matches;
            showToast('Data loaded successfully!', 'success');
            return data;
        } catch (error) {
            console.error("Error fetching data:", error);
            showToast('Failed to load data! Check console for details.', 'error');
            allDebatersData = [];
            allMatchesData = [];
            setAppContent(`
                <div class="container my-5 text-center text-danger animate__animated animate__fadeIn">
                    <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                    <h2>Gagal memuat data!</h2>
                    <p>Pastikan 'data.json' ada dan valid.</p>
                </div>
            `);
            return null;
        }
    }

    function setAppContent(contentHtml) {
        const appRoot = document.getElementById('app-root');
        if (appRoot) appRoot.innerHTML = contentHtml;
    }

    window.onImageError = function(imgElement) {
        imgElement.onerror = null;
        imgElement.src = 'https://placehold.co/1280x720/CCCCCC/000000?text=Image+Not+Available';
        imgElement.alt = 'Default Image';
    };

    // --- Fungsi Rendering Halaman ---

    function renderHomePage(debaters, matches) {
        const homePageHtml = `
            <div class="hero-image-container animate__animated animate__fadeIn">
              <img src="7745A053-1315-4B4D-AB24-9BFB05370A20.jpeg" alt="Debater Battle Arena Hero Image" loading="lazy" onerror="onImageError(this)">
            </div>

            <section class="container my-5">
              <h2 class="text-center mb-4 fw-bold text-uppercase animate__animated animate__fadeInDown">Recent Matches <i class="fas fa-history ms-2"></i></h2>
              <div id="recentMatchesSection" class="row g-4"></div>
            </section>

            <hr class="my-5">

            <section class="container my-5">
              <h2 class="text-center mb-4 fw-bold text-uppercase animate__animated animate__fadeInDown">Top & Low Record Debaters <i class="fas fa-chart-line ms-2"></i></h2>
              <div class="row g-4" id="topLowRecordsSection"></div>
            </section>

            <hr class="my-5">

            <section class="container my-5">
              <h2 class="mb-4 text-center fw-bold text-uppercase animate__animated animate__fadeInDown">Debater Profiles (Quick View) <i class="fas fa-users ms-2"></i></h2>
              <div class="row g-4 justify-content-center" id="quickViewProfiles"></div>
            </section>

            <hr class="my-5">

            <section class="container my-5 debater-profile">
              <h2 class="text-center fw-bold text-uppercase mb-4 animate__animated animate__fadeInDown">Debater Profile Metrics (Sample) <i class="fas fa-clipboard-list ms-2"></i></h2>
              <div class="row g-4" id="detailedProfilesSection"></div>
            </section>

            <hr class="my-5">

            <section class="container my-5">
              <h2 class="text-center fw-bold text-uppercase mb-4 animate__animated animate__fadeInDown">Leaderboard Per Tier (DBA) <i class="fas fa-trophy ms-2"></i></h2>

              <div class="leaderboard-filters row mb-3 animate__animated animate__fadeIn">
                <div class="col-md-6 mb-2">
                  <input type="text" class="form-control" id="leaderboardSearch" placeholder="Cari debater...">
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

              ${['High Tier', 'Mid Tier', 'Low Tier'].map(tier => `
                <div class="mb-5">
                  <h3 class="text-white ${tier === 'High Tier' ? 'bg-warning' : tier === 'Mid Tier' ? 'bg-secondary' : 'bg-dark'} text-center py-2 rounded-top animate__animated animate__fadeInLeft">${tier} <i class="fas fa-star ms-2"></i></h3>
                  <div class="table-responsive animate__animated animate__fadeInUp">
                    <table class="table table-bordered table-striped text-center align-middle" aria-label="${tier} Leaderboard">
                      <thead class="table-dark">
                        <tr>
                          <th data-sort="rank" role="columnheader">Rank <i class="fas fa-sort sort-icon"></i></th>
                          <th role="columnheader">Photo</th>
                          <th data-sort="name" role="columnheader">Name <i class="fas fa-sort sort-icon"></i></th>
                          <th data-sort="country" role="columnheader">Country <i class="fas fa-sort sort-icon"></i></th>
                          <th data-sort="wins" role="columnheader">Record <i class="fas fa-sort sort-icon"></i></th>
                        </tr>
                      </thead>
                      <tbody id="${tier.toLowerCase().replace(' ', '')}TierBody"></tbody>
                    </table>
                  </div>
                </div>
              `).join('')}
            </section>

            <hr class="my-5">

            <section class="container my-5 individual-match-history">
              <h2 class="text-center mb-4 fw-bold text-uppercase animate__animated animate__fadeInDown">Individual Match History (Latest) <i class="fas fa-history ms-2"></i></h2>
              <div class="row g-3" id="individualMatchHistory"></div>
            </section>
        `;
        setAppContent(homePageHtml);

        renderRecentMatches(recentMatchData);
        renderTopLowRecords(debaters);
        renderQuickViewProfiles(debaters);
        renderDetailedProfiles(debaters); // Hanya contoh, bukan semua
        renderLeaderboard(debaters);
        renderOverallStatsChart(debaters);
        renderIndividualMatchHistory(debaters, matches);

        attachHomePageEventListeners(debaters); // matches tidak diperlukan di sini
    }

    // Fungsi renderProfilePage dan renderComparePage Dihilangkan
    // Atau bisa juga dikosongkan jika Anda ingin menjaga strukturnya.
    /*
    function renderProfilePage(debaterId, debaters, matches) {
        // Konten dikosongkan karena fitur dihilangkan
        setAppContent(`
            <div class="container my-5 text-center text-info animate__animated animate__fadeIn">
                <i class="fas fa-ban fa-3x mb-3"></i>
                <h2>Fitur Detail Profil Dinonaktifkan</h2>
                <a href="#home" class="btn btn-primary mt-3"><i class="fas fa-arrow-left me-2"></i> Kembali ke Beranda</a>
            </div>
        `);
        document.title = 'DBA - Fitur Dinonaktifkan';
    }

    function renderComparePage(debaters) {
        // Konten dikosongkan karena fitur dihilangkan
        document.title = 'DBA - Fitur Dinonaktifkan';
        setAppContent(`
            <section class="container my-5 animate__animated animate__fadeIn">
                <h2 class="text-center mb-4 fw-bold text-uppercase">Bandingkan Debater <i class="fas fa-balance-scale-right ms-2"></i></h2>
                <div class="row justify-content-center">
                    <div class="col-12 text-center text-info">
                        <p><i class="fas fa-ban me-2"></i> Fitur perbandingan debater dinonaktifkan.</p>
                        <a href="#home" class="btn btn-primary mt-3"><i class="fas fa-arrow-left me-2"></i> Kembali ke Beranda</a>
                    </div>
                </div>
            </section>
        `);
    }
    */

    // --- Renderer Bagian Spesifik ---

    function renderRecentMatches(matches) {
        const recentMatchesSection = document.getElementById('recentMatchesSection');
        if (!recentMatchesSection) return;

        let html = '';
        if (matches.length > 0) {
            matches.forEach(match => {
                const imageUrl = `https://placehold.co/1280x720/000000/FFFFFF?text=${encodeURIComponent(match.image.split('.')[0])}`;
                html += `
                    <div class="col-12 col-md-6 col-lg-4 animate__animated animate__fadeInUp">
                        <div class="card shadow h-100 recent-match-card">
                            <img src="${imageUrl}" class="card-img-top recent-match-img" alt="Match between ${match.debater1.name} and ${match.debater2.name}" loading="lazy" onerror="onImageError(this)">
                            <div class="card-body text-center">
                                <h5 class="card-title fw-bold">
                                    <span class="${match.debater1.status === 'Winner' ? 'text-success' : 'text-danger'}">${match.debater1.name} ${countryFlags[match.debater1.country] || ''} ${match.debater1.status}</span> vs
                                    <span class="${match.debater2.status === 'Winner' ? 'text-success' : 'text-danger'}">${match.debater2.name} ${countryFlags[match.debater2.country] || ''} ${match.debater2.status}</span>
                                </h5>
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            html = `<div class="col-12 text-center text-muted"><p>Tidak ada pertandingan terbaru.</p></div>`;
        }
        recentMatchesSection.innerHTML = html;
    }

    function renderTopLowRecords(debaters) {
        const topLowRecordsSection = document.getElementById('topLowRecordsSection');
        if (!topLowRecordsSection) return;

        const validDebaters = debaters.filter(d => (d.wins !== undefined && d.losses !== undefined && ((d.wins || 0) + (d.losses || 0)) > 0));
        const sortedDebaters = [...validDebaters].sort((a, b) => {
            const winRateA = ((a.wins || 0) + (a.losses || 0)) > 0 ? (a.wins || 0) / ((a.wins || 0) + (a.losses || 0)) : 0;
            const winRateB = ((b.wins || 0) + (b.losses || 0)) > 0 ? (b.wins || 0) / ((b.wins || 0) + (b.losses || 0)) : 0;
            return winRateB - winRateA; // Sort descending for top
        });

        const top3 = sortedDebaters.slice(0, 3);
        const low3 = [...validDebaters]
            .filter(d => !top3.some(t => t.id === d.id))
            .sort((a, b) => {
                const winRateA = ((a.wins || 0) + (a.losses || 0)) > 0 ? (a.wins || 0) / ((a.wins || 0) + (a.losses || 0)) : 0;
                const winRateB = ((b.wins || 0) + (b.losses || 0)) > 0 ? (b.wins || 0) / ((b.wins || 0) + (b.losses || 0)) : 0;
                return winRateA - winRateB; // Sort ascending for low
            }).slice(0, 3);

        let html = `
            <div class="col-md-6">
                <h3 class="mb-3 text-success">Top Record Debaters DBA <i class="fas fa-crown ms-2"></i></h3>
                <div class="row g-3">
        `;
        top3.forEach(debater => {
            html += `
                <div class="col-md-4">
                    <div class="card shadow h-100 animate__animated animate__fadeInUp card-hover-effect">
                        <img src="${debater.photo || 'assets/default_avatar.png'}" class="card-img-top card-img-fixed-height" alt="${debater.name} photo" onerror="onImageError(this)"/>
                        <div class="card-body">
                            <h4 class="card-title">${debater.name || 'Unknown'} ${debater.flag ? `<img src="${debater.flag}" width="24" class="ms-2" alt="${debater.country_code || 'XX'} flag"/>` : ''}</h4>
                            <p class="card-text">Record: <span class="badge ${debater.wins > debater.losses ? 'bg-success' : 'bg-danger'}">${debater.record || '0-0'}</span></p>
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
                    <div class="card shadow h-100 animate__animated animate__fadeInUp card-hover-effect">
                        <img src="${debater.photo || 'assets/default_avatar.png'}" class="card-img-top card-img-fixed-height" alt="${debater.name} photo" onerror="onImageError(this)"/>
                        <div class="card-body">
                            <h4 class="card-title">${debater.name || 'Unknown'} ${debater.flag ? `<img src="${debater.flag}" width="24" class="ms-2" alt="${debater.country_code || 'XX'} flag"/>` : ''}</h4>
                            <p class="card-text">Record: <span class="badge ${debater.wins > debater.losses ? 'bg-success' : 'bg-danger'}">${debater.record || '0-0'}</span></p>
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

        // Menghapus listener yang mengarah ke halaman detail profil
        // document.querySelectorAll('.debater-card-link').forEach(card => {
        //     card.addEventListener('click', () => {
        //         const debaterId = card.dataset.debaterId;
        //         if (debaterId) window.location.hash = `#profile/${debaterId}`;
        //     });
        // });
    }

    function renderQuickViewProfiles(debaters) {
        const quickViewProfilesSection = document.getElementById('quickViewProfiles');
        if (!quickViewProfilesSection) return;

        let html = '';
        debaters.slice(0, 3).forEach(debater => { // Hanya menampilkan 3 debater pertama
            html += `
                <div class="col-md-4">
                    <div class="card shadow h-100 text-center animate__animated animate__fadeInUp card-hover-effect">
                        <img src="${debater.photo || 'assets/default_avatar.png'}" class="card-img-top card-img-fixed-height" alt="${debater.name} photo" onerror="onImageError(this)"/>
                        <div class="card-body">
                            <h3 data-debater-id="${debater.id}">${debater.name || 'Unknown'} ${debater.flag ? `<img src="${debater.flag}" width="24" class="ms-2" alt="${debater.country_code || 'XX'} flag"/>` : ''}</h3>
                            <p class="card-text">Record: <span class="badge ${debater.wins > debater.losses ? 'bg-success' : 'bg-danger'}">${debater.record || '0-0'}</span></p>
                            <p><strong>Karakter:</strong> ${debater.character || 'Unknown'}</p>
                            <p><strong>Ringkasan:</strong> ${debater.summary || 'Tidak ada ringkasan.'}</p>
                        </div>
                    </div>
                </div>
            `;
        });
        quickViewProfilesSection.innerHTML = html;

        // Listener untuk navigasi ke halaman profil penuh DIHILANGKAN
        // quickViewProfilesSection.querySelectorAll('.clickable-name').forEach(element => {
        //     element.addEventListener('click', () => {
        //         const debaterId = element.dataset.debaterId;
        //         if (debaterId) window.location.hash = `#profile/${debaterId}`;
        //     });
        // });
    }


    function renderDetailedProfiles(debaters) {
        const detailedProfilesSection = document.getElementById('detailedProfilesSection');
        if (!detailedProfilesSection) return;

        // Ambil 3 debater secara acak untuk ditampilkan di bagian ini
        const debatersToDisplay = [...debaters].sort(() => 0.5 - Math.random()).slice(0, 3);

        let html = '';
        if (debatersToDisplay.length > 0) {
            debatersToDisplay.forEach(debater => {
                let metricsHtml = '';
                if (debater.metrics && typeof debater.metrics === 'object') {
                    for (const [metricName, metricScore] of Object.entries(debater.metrics)) {
                        const scoreValue = parseFloat(metricScore);
                        const widthPercentage = (isNaN(scoreValue) || scoreValue < 0) ? 0 : (scoreValue / 10) * 100;
                        metricsHtml += `
                            <div class="profile-metric d-flex align-items-center mb-1">
                                <span class="me-2 text-capitalize">${metricName.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                <div class="progress flex-grow-1">
                                    <div class="progress-bar bg-info" style="width: ${widthPercentage}%;"></div>
                                </div>
                                <span class="metric-value ms-2">${isNaN(scoreValue) ? 'N/A' : `${scoreValue}/10`}</span>
                            </div>
                        `;
                    }
                } else {
                    metricsHtml = `<p class="text-muted text-center">Tidak ada data metrik.</p>`;
                }

                html += `
                    <div class="col-md-6 col-lg-4 animate__animated animate__fadeInUp">
                        <div class="card shadow h-100 debater-profile-card card-hover-effect">
                            <img src="${debater.photo || 'assets/default_avatar.png'}" class="card-img-top debater-profile-img" alt="${debater.name} Profile Photo" onerror="onImageError(this)">
                            <div class="card-body text-center">
                                <h4 class="card-title">${debater.name || 'Unknown'} ${debater.flag ? `<img src="${debater.flag}" width="24" class="ms-2" alt="${debater.country_code || 'XX'} flag"/>` : ''}</h4>
                                <p class="card-text">Record: <span class="badge ${debater.wins > debater.losses ? 'bg-success' : 'bg-danger'}">${debater.record || '0-0'}</span></p>
                                <div class="mt-3 text-start">${metricsHtml}</div>
                                </div>
                        </div>
                    </div>
                `;
            });
        } else {
            html = `<div class="col-12 text-center text-muted"><p>Tidak ada debater yang ditemukan.</p></div>`;
        }
        detailedProfilesSection.innerHTML = html;
    }

    function renderLeaderboard(debaters) {
        const highTierBody = document.getElementById('hightierbody');
        const midTierBody = document.getElementById('midtierbody');
        const lowTierBody = document.getElementById('lowtierbody');

        if (!highTierBody || !midTierBody || !lowTierBody) return;

        const searchTerm = (document.getElementById('leaderboardSearch')?.value || '').toLowerCase();
        const tierValue = document.getElementById('tierFilter')?.value || '';
        const countryValue = document.getElementById('countryFilter')?.value || '';

        let filteredDebaters = debaters.filter(debater => {
            const matchesSearch = (debater.name || '').toLowerCase().includes(searchTerm);
            const matchesTier = tierValue === '' || debater.tier === tierValue;
            const matchesCountry = countryValue === '' || debater.country === countryValue;
            return matchesSearch && matchesTier && matchesCountry;
        });

        filteredDebaters.sort((a, b) => {
            const sortColumn = currentLeaderboardSort.column;
            const sortOrder = currentLeaderboardSort.order;
            let valA, valB;

            switch (sortColumn) {
                case 'rank': valA = a.wins || 0; valB = b.wins || 0; break;
                case 'name': valA = (a.name || '').toLowerCase(); valB = (b.name || '').toLowerCase(); break;
                case 'country': valA = (a.country || '').toLowerCase(); valB = (b.country || '').toLowerCase(); break;
                case 'wins': valA = a.wins || 0; valB = b.wins || 0; break;
                default: valA = a.id || ''; valB = b.id || '';
            }

            if (typeof valA === 'string') return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            return sortOrder === 'asc' ? valA - valB : valB - valA;
        });

        highTierBody.innerHTML = '';
        midTierBody.innerHTML = '';
        lowTierBody.innerHTML = '';

        let highTierRank = 1, midTierRank = 1, lowTierRank = 1;

        filteredDebaters.forEach(debater => {
            const row = document.createElement('tr');
            const debaterWins = debater.wins || 0;
            const debaterLosses = debater.losses || 0;
            const totalMatches = debaterWins + debaterLosses;
            const winRate = totalMatches > 0 ? ((debaterWins / totalMatches) * 100).toFixed(0) : '0';
            const recordClass = debaterWins > debaterLosses ? 'bg-success' : 'bg-danger';

            let rankDisplay = '';
            let targetBody;
            switch (debater.tier) {
                case 'High Tier': rankDisplay = highTierRank++; targetBody = highTierBody; break;
                case 'Mid Tier': rankDisplay = midTierRank++; targetBody = midTierBody; break;
                case 'Low Tier': rankDisplay = lowTierRank++; targetBody = lowTierBody; break;
                default: rankDisplay = '-'; targetBody = null;
            }

            if (targetBody) {
                row.innerHTML = `
                    <td>${rankDisplay}</td>
                    <td><img src="${debater.photo || 'assets/default_avatar.png'}" width="50" height="50" class="rounded-circle object-fit-cover" alt="${debater.name}" onerror="onImageError(this)"></td>
                    <td>${debater.name || 'Unknown'}</td> <td>${debater.flag ? `<img src="${debater.flag}" width="24" class="me-2" alt="${debater.country_code || 'XX'} flag"/>` : ''} ${debater.country || 'Unknown'}</td>
                    <td><span class="badge ${recordClass}">${debaterWins}-${debaterLosses} (${winRate}%)</span></td>
                `;
                targetBody.appendChild(row);
            }
        });

        if (highTierBody.children.length === 0) highTierBody.innerHTML = '<tr><td colspan="5" class="text-muted">Tidak ada debater High Tier.</td></tr>';
        if (midTierBody.children.length === 0) midTierBody.innerHTML = '<tr><td colspan="5" class="text-muted">Tidak ada debater Mid Tier.</td></tr>';
        if (lowTierBody.children.length === 0) lowTierBody.innerHTML = '<tr><td colspan="5" class="text-muted">Tidak ada debater Low Tier.</td></tr>';
    }

    function renderOverallStatsChart(debaters) {
        const ctx = document.getElementById('overallStatsChart');
        if (!ctx) return;
        if (overallStatsChartInstance) overallStatsChartInstance.destroy();

        const tierCounts = debaters.reduce((acc, debater) => {
            const tier = debater.tier || 'Unknown Tier';
            acc[tier] = (acc[tier] || 0) + 1;
            return acc;
        }, { 'High Tier': 0, 'Mid Tier': 0, 'Low Tier': 0 });

        const labels = Object.keys(tierCounts);
        const data = Object.values(tierCounts);

        overallStatsChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Jumlah Debater',
                    data: data,
                    backgroundColor: ['rgba(255, 193, 7, 0.7)', 'rgba(108, 117, 125, 0.7)', 'rgba(33, 37, 41, 0.7)', 'rgba(200, 200, 200, 0.7)'],
                    borderColor: ['rgba(255, 193, 7, 1)', 'rgba(108, 117, 125, 1)', 'rgba(33, 37, 41, 1)', 'rgba(200, 200, 200, 1)'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { title: { display: true, text: 'Distribusi Debater berdasarkan Tier' }, legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { callback: function(value) { return Number.isInteger(value) ? value : null; } } } }
            }
        });
    }

    function renderIndividualMatchHistory(debaters, matches) {
        const individualMatchHistorySection = document.getElementById('individualMatchHistory');
        if (!individualMatchHistorySection) return;

        const debatersToShow = [...debaters].sort(() => 0.5 - Math.random()).slice(0, 5); // 5 debater acak
        let html = '';

        if (debatersToShow.length === 0) {
            individualMatchHistorySection.innerHTML = `<div class="col-12 text-center text-muted"><p>Tidak ada debater untuk menampilkan riwayat pertandingan.</p></div>`;
            return;
        }

        debatersToShow.forEach(debater => {
            const debaterMatches = matches.filter(match =>
                match.debater1?.id === debater.id || match.debater2?.id === debater.id
            ).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 3); // 3 pertandingan terbaru

            if (debaterMatches.length > 0) {
                html += `
                    <div class="col-md-6 col-lg-4">
                        <div class="card shadow h-100 animate__animated animate__fadeInUp">
                            <div class="card-header bg-dark text-white d-flex align-items-center">
                                <img src="${debater.photo || 'assets/default_avatar.png'}" width="40" height="40" class="rounded-circle me-2 object-fit-cover" alt="${debater.name}" onerror="onImageError(this)">
                                <h5 class="mb-0 flex-grow-1">${debater.name || 'Unknown'}'s Pertandingan Terbaru</h5>
                            </div>
                            <ul class="list-group list-group-flush">
                `;
                debaterMatches.forEach(match => {
                    const opponentMatchData = match.debater1?.id === debater.id ? match.debater2 : match.debater1;
                    const opponentFullData = allDebatersData.find(d => d.id === opponentMatchData?.id);
                    const isWinner = match.winner === debater.name;
                    const statusBadgeClass = isWinner ? 'bg-success' : 'bg-danger';
                    const statusText = isWinner ? 'MENANG' : 'KALAH';

                    html += `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <span class="badge ${statusBadgeClass}">${statusText}</span> vs ${opponentFullData?.name || 'Unknown Opponent'}
                                <br><small class="text-muted">${match.method || 'N/A'} - ${new Date(match.date || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</small>
                            </div>
                            <img src="${opponentFullData?.photo || 'assets/default_avatar.png'}" width="30" height="30" class="rounded-circle object-fit-cover" alt="${opponentFullData?.name || 'Unknown Opponent'}" onerror="onImageError(this)">
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

    // --- Event Listeners dan Routing ---

    function handleLeaderboardSort(event) {
        const header = event.target.closest('th[data-sort]');
        if (header) {
            const column = header.dataset.sort;
            let order = 'asc';
            if (currentLeaderboardSort.column === column) {
                order = currentLeaderboardSort.order === 'asc' ? 'desc' : 'asc';
            }
            currentLeaderboardSort = { column, order };
            renderLeaderboard(allDebatersData);
        }
    }

    function attachHomePageEventListeners(debaters) {
        const leaderboardSearch = document.getElementById('leaderboardSearch');
        const tierFilter = document.getElementById('tierFilter');
        const countryFilter = document.getElementById('countryFilter');

        // Hapus listener lama jika ada
        if (leaderboardSearch) leaderboardSearch.removeEventListener('input', () => renderLeaderboard(debaters));
        if (tierFilter) tierFilter.removeEventListener('change', () => renderLeaderboard(debaters));
        if (countryFilter) countryFilter.removeEventListener('change', () => renderLeaderboard(debaters));

        // Tambah listener baru
        if (leaderboardSearch) leaderboardSearch.addEventListener('input', () => renderLeaderboard(debaters));
        if (tierFilter) tierFilter.addEventListener('change', () => renderLeaderboard(debaters));
        if (countryFilter) countryFilter.addEventListener('change', () => renderLeaderboard(debaters));

        document.querySelectorAll('#leaderboard table thead').forEach(thead => {
            thead.removeEventListener('click', handleLeaderboardSort);
            thead.addEventListener('click', handleLeaderboardSort);
        });

        if (overallStatsChartInstance) {
            overallStatsChartInstance.destroy();
            overallStatsChartInstance = null;
        }
    }

    // Fungsi attachComparePageEventListeners dan compareDebaters Dihilangkan
    /*
    function attachComparePageEventListeners(debaters) {
        // Logika event listener perbandingan dihapus
    }

    function compareDebaters(id1, id2, debaters) {
        // Logika perbandingan dihapus
    }
    */

    async function handleLocationHash() {
        const hash = window.location.hash;
        if (allDebatersData.length === 0 || allMatchesData.length === 0) {
            const data = await fetchData();
            if (!data) return;
        }

        // Hanya render halaman beranda, abaikan hash lainnya
        renderHomePage(allDebatersData, allMatchesData);

        // Highlight link navigasi yang aktif
        document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
            link.classList.remove('active');
            const linkHref = link.getAttribute('href');
            // Hanya 'home' yang akan dianggap aktif
            if (linkHref === '#home') {
                link.classList.add('active');
            }
        });
    }

    // --- Pemuatan Awal ---

    setAppContent(`
        <div class="container my-5 text-center animate__animated animate__fadeIn">
            <i class="fas fa-spinner fa-spin fa-3x mb-3 text-primary"></i>
            <h2>Memuat data...</h2>
            <p>Mohon tunggu sebentar.</p>
        </div>
    `);

    fetchData().then(() => {
        handleLocationHash();
        window.addEventListener('hashchange', handleLocationHash);

        document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault(); // Mencegah perilaku default anchor link
                const targetHash = event.target.getAttribute('href');
                if (targetHash && targetHash === '#home') { // Hanya izinkan navigasi ke #home
                    window.location.hash = targetHash;
                } else {
                    // Jika mencoba navigasi ke hash lain (misal #compare), tetap di home
                    window.location.hash = '#home';
                }
            });
        });
    });

});
