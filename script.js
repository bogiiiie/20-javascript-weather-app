const API_KEY = "f032684d97197832270cc8a21104e467";
let cityName = "manila";
const currentDate = new Date();

// Notification system variables
let isShowingNotification = false;
let notificationQueue = [];
let activeNotificationTimeout = null;

// Display current year for copyright footer
document.getElementById(`current-year`).textContent = currentDate.getFullYear();

const dateFormatOptions = {
    weekday: "long",   // Friday
    day: "numeric",    // 13
    month: "short",    // Jun
    year: "numeric"    // 2025
};

const formattedDate = currentDate.toLocaleDateString("en-GB", dateFormatOptions);

// Add comma after weekday
const dateParts = formattedDate.split(" ");
const displayDate = `${dateParts[0]}, ${dateParts.slice(1).join(" ")}`;

// IMPROVED NOTIFICATION SYSTEM WITH FONTAWESOME ICONS
function showNotification(message, type = 'success') {
    // Clear any existing timeout
    if (activeNotificationTimeout) {
        clearTimeout(activeNotificationTimeout);
        activeNotificationTimeout = null;
    }
    
    // Remove ALL existing notifications immediately
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });
    
    // Reset the showing flag
    isShowingNotification = false;
    
    // If we're currently showing a notification, add to queue
    if (isShowingNotification) {
        // Replace any existing queued notification of the same type with the new one
        notificationQueue = notificationQueue.filter(item => item.type !== type);
        notificationQueue.push({ message, type });
        return;
    }
    
    // Mark that we're showing a notification
    isShowingNotification = true;
    
    // Create notification container
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    // Base professional styling
    const baseStyle = `
        position: fixed;
        top: 20px;
        left: 30px;
        width: auto;
        max-width: 300px;
        padding: 16px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        line-height: 1.4;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        border: 1.5px solid;
        transition: all 0.3s ease;
        opacity: 0;
        transform: translateX(100px);
        word-wrap: break-word;
    `;
    
    // Create FontAwesome icon
    const icon = document.createElement('i');
    icon.style.cssText = 'flex-shrink: 0; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 16px;';
    icon.setAttribute('aria-hidden', 'true');
    
    // Create message
    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.style.cssText = 'flex: 1; margin: 0;';
    
    // Type-specific styling and FontAwesome icons
    if (type === 'success') {
        notification.style.cssText = baseStyle + `
            background-color: #f0fdf4;
            border-color: #bbf7d0;
            color: #166534;
        `;
        icon.className = 'fa fa-check-circle';
        icon.style.color = '#16a34a';
    } else if (type === 'error') {
        notification.style.cssText = baseStyle + `
            background-color: #fef2f2;
            border-color: #fca5a5;
            color: #991b1b;
        `;
        icon.className = 'fa fa-times-circle';
        icon.style.color = '#dc2626';
    } else if (type === 'warning') {
        notification.style.cssText = baseStyle + `
            background-color: #fffbeb;
            border-color: #fed7aa;
            color: #92400e;
        `;
        icon.className = 'fa fa-exclamation-triangle';
        icon.style.color = '#f59e0b';
    } else {
        // info type
        notification.style.cssText = baseStyle + `
            background-color: #eff6ff;
            border-color: #bfdbfe;
            color: #1e40af;
        `;
        icon.className = 'fa fa-info-circle';
        icon.style.color = '#2563eb';
    }
    
    // Assemble notification
    notification.appendChild(icon);
    notification.appendChild(messageEl);
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    });
    
    // Auto remove with improved cleanup
    activeNotificationTimeout = setTimeout(() => {
        if (notification && notification.parentNode) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            
            setTimeout(() => {
                if (notification && notification.parentNode) {
                    notification.remove();
                }
                
                // Reset flag and process queue
                isShowingNotification = false;
                activeNotificationTimeout = null;
                
                // Process next notification in queue
                if (notificationQueue.length > 0) {
                    const next = notificationQueue.shift();
                    setTimeout(() => {
                        showNotification(next.message, next.type);
                    }, 100);
                }
            }, 300);
        }
    }, 2000);
}

// Fetch city coordinates
async function getCityCoordinates(city, apiKey) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`
        );

        if (!response.ok) {
            throw new Error("Failed to connect to weather service");
        }

        const data = await response.json();
        
        // Check if data array is empty or undefined
        if (!data || data.length === 0) {
            throw new Error("City not found");
        }

        const cityData = data[0];
        
        // Validate that required properties exist
        if (!cityData.name || !cityData.country || cityData.lat === undefined || cityData.lon === undefined) {
            throw new Error("Invalid city data received");
        }

        return {
            cityName: cityData.name,
            countryCode: cityData.country,
            lat: cityData.lat,
            lon: cityData.lon,
        };
    } catch (error) {
        if (error.message === "City not found") {
            showNotification(`Unable to find "${city}". Please check the city name and try again.`, 'error');
        } else if (error.message === "Failed to connect to weather service") {
            showNotification("Unable to connect to weather service. Please check your internet connection.", 'error');
        } else {
            showNotification("An error occurred while searching for the city. Please try again.", 'error');
        }
        throw error;
    }
}

// Fetch weather data
async function getWeather(lat, lon) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`
        );

        if (!response.ok) {
            throw new Error("Weather data not found");
        }

        const data = await response.json();

        return {
            temperature: (data.main.temp - 273.15).toFixed(2),        // °C
            humidity: data.main.humidity,                             // %
            clouds: data.clouds.all,                                  // %
            wind_speed: (data.wind.speed * 3.6).toFixed(1),           // km/h
            weather_status: data.weather[0].main,                     // e.g. "clear sky -> Clear Sky"
            weather_description: data.weather[0].description
                .split(" ")
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" "),
            weather_icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`
        };
    } catch (error) {
        showNotification("Failed to retrieve weather data. Please try again later.", 'error');
        throw error;
    }
}

// Main function
async function displayWeather(city_name, api_key) {
    const weatherLocationName = document.getElementById(`weather-location__name`);
    const weatherLocationTime = document.getElementById(`weather-location__time`);
    const weatherIcon = document.getElementById(`weather-icon`);
    const weatherTemperature = document.getElementById(`weather-temperature`);
    const weatherDescription = document.getElementById(`weather-description__text`);
    const weatherWindValue = document.getElementById(`weather-wind__value`);
    const weatherHumidityValue = document.getElementById(`weather-humidity__value`);
    const weatherCloudValue = document.getElementById(`weather-cloud__value`);
    
    // Show loading notification
    showNotification("Loading weather data...", 'info');
    
    try {
        const city = await getCityCoordinates(city_name, api_key);
        const weather = await getWeather(city.lat, city.lon);

        // Update UI elements
        weatherLocationName.textContent = `${city.cityName}, ${city.countryCode}`;
        weatherLocationTime.textContent = displayDate;
        weatherIcon.src = weather.weather_icon;
        weatherIcon.alt = `Weather condition: ${weather.weather_description}`;
        
        // Update temperature with dynamic aria-label
        weatherTemperature.textContent = `${weather.temperature}°C`;
        weatherTemperature.setAttribute('aria-label', `Current temperature is ${weather.temperature} degrees Celsius`);
        
        weatherDescription.textContent = weather.weather_description;
        
        // Update wind with dynamic aria-label
        weatherWindValue.textContent = `${weather.wind_speed} km/h`;
        weatherWindValue.setAttribute('aria-label', `Wind speed is ${weather.wind_speed} kilometers per hour`);
        
        // Update humidity with dynamic aria-label
        weatherHumidityValue.textContent = `${weather.humidity}%`;
        weatherHumidityValue.setAttribute('aria-label', `Humidity is ${weather.humidity} percent`);
        
        // Update cloud coverage with dynamic aria-label
        weatherCloudValue.textContent = `${weather.clouds}%`;
        weatherCloudValue.setAttribute('aria-label', `Cloud coverage is ${weather.clouds} percent`);
        
        // Show success notification
        showNotification(`Weather updated for ${city.cityName}, ${city.countryCode}`, 'success');
        
        console.log(weather);
    } catch (error) {
        console.error(error.message);
        // Error notifications are already handled in the individual functions
    }
}

// Initial display for "Manila"
displayWeather(cityName, API_KEY);

const weatherSearchForm = document.getElementById(`weather-search-form`);

weatherSearchForm.addEventListener(`submit`, (event) => {
    event.preventDefault();
    const inputValue = document.getElementById(`weather-search__input`).value.trim();
    
    if (!inputValue) {
        showNotification("Please enter a city name to search for weather.", 'warning');
        return;
    }
    
    if (inputValue.length < 2) {
        showNotification("City name must be at least 2 characters long.", 'warning');
        return;
    }
    
    cityName = inputValue.toLowerCase();
    displayWeather(cityName, API_KEY);
    
    // Clear the input field after successful submission
    document.getElementById(`weather-search__input`).value = '';
});

// Add input validation on keyup for better UX
document.getElementById(`weather-search__input`).addEventListener('keyup', (event) => {
    const inputValue = event.target.value.trim();
    
    // Remove any existing validation styling
    event.target.style.borderColor = '';
    
    if (inputValue.length > 0 && inputValue.length < 2) {
        event.target.style.borderColor = '#f59e0b'; // Warning color
    }
});