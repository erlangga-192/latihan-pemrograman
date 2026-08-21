// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherInfo = document.getElementById('weather-info');
const statusMessage = document.getElementById('status-message');
const statusText = document.getElementById('status-text');

const tempEl = document.getElementById('temperature');
const descEl = document.getElementById('weather-desc');
const cityEl = document.getElementById('city-name');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind-speed');
const weatherIcon = document.getElementById('weather-icon');

// 1. Cari Koordinat Kota (Geocoding API Open-Meteo)
async function checkWeather(cityName) {
    if (!cityName) return;

    showStatus("Mencari data cuaca...");

    try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=id&format=json`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            showStatus("Kota tidak ditemukan. Coba periksa kembali nama kotanya.");
            return;
        }

        const location = geoData.results[0];
        const lat = location.latitude;
        const lon = location.longitude;
        const formattedCity = `${location.name}${location.admin1 ? ', ' + location.admin1 : ''}`;

        // 2. Ambil Data Cuaca Berdasarkan Koordinat
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature,uv_index`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();

        const current = weatherData.current;

        // Update Teks ke HTML
        tempEl.innerText = `${Math.round(current.temperature_2m)}°C`;
        cityEl.innerText = formattedCity;
        humidityEl.innerText = `${current.relative_humidity_2m}%`;
        windEl.innerText = `${Math.round(current.wind_speed_10m)} km/j`;

        // --- BARIS YANG TADI KURANG ADA DI SINI ---
        document.getElementById('feels-like').innerText = `${Math.round(current.apparent_temperature)}°C`;
        document.getElementById('uv-index').innerText = current.uv_index;

        // Update Deskripsi, Ikon, & Tema berdasarkan WMO Weather Code
        interpretWeatherCode(current.weather_code);

        statusMessage.classList.add('hidden');
        weatherInfo.classList.remove('hidden');

    } catch (error) {
        console.error("Error fetching weather:", error);
        showStatus("Gagal mengambil data. Periksa koneksi internetmu.");
    }
}

// Helper Konversi Kode Cuaca WMO ke Tema & Ikon
function interpretWeatherCode(code) {
    document.body.className = '';

    // Clear / Cerah
    if (code === 0) {
        descEl.innerText = "Cerah";
        document.body.classList.add('theme-clear');
        weatherIcon.className = 'fa-solid fa-sun';
        weatherIcon.style.color = '#fde047';
    } 
    // Clouds / Berawan
    else if (code >= 1 && code <= 3) {
        descEl.innerText = "Berawan";
        document.body.classList.add('theme-clouds');
        weatherIcon.className = 'fa-solid fa-cloud';
        weatherIcon.style.color = '#cbd5e1';
    } 
    // Rain / Hujan
    else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
        descEl.innerText = "Hujan";
        document.body.classList.add('theme-rain');
        weatherIcon.className = 'fa-solid fa-cloud-showers-heavy';
        weatherIcon.style.color = '#38bdf8';
    } 
    // Thunderstorm / Badai
    else if (code >= 95) {
        descEl.innerText = "Badai Petir";
        document.body.classList.add('theme-thunderstorm');
        weatherIcon.className = 'fa-solid fa-cloud-bolt';
        weatherIcon.style.color = '#facc15';
    } 
    // Snow / Salju
    else if (code >= 71 && code <= 77) {
        descEl.innerText = "Salju";
        document.body.classList.add('theme-snow');
        weatherIcon.className = 'fa-regular fa-snowflake';
        weatherIcon.style.color = '#f8fafc';
    } 
    // Default
    else {
        descEl.innerText = "Kabut / Berkabut";
        document.body.classList.add('theme-clouds');
        weatherIcon.className = 'fa-solid fa-smog';
        weatherIcon.style.color = '#94a3b8';
    }
}

// Helper Status
function showStatus(text) {
    statusText.innerText = text;
    statusMessage.classList.remove('hidden');
    weatherInfo.classList.add('hidden');
}

// Event Listeners
searchBtn.addEventListener('click', () => {
    checkWeather(cityInput.value.trim());
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkWeather(cityInput.value.trim());
    }
});

// Interaksi tombol chip setelah HTML siap
document.addEventListener('DOMContentLoaded', () => {
    
    const cityChips = document.querySelectorAll('.city-chip');

    cityChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const selectedCity = chip.getAttribute('data-city');
            if (selectedCity) {
                cityInput.value = selectedCity;
                checkWeather(selectedCity);
            }
        });
    });

    checkWeather('Jakarta');
});