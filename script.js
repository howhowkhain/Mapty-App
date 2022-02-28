'use strict';

class Workouts {
  // prettier-ignore
  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  date = new Date();
  id = Date.now() + '';
  // clicks = 0;

  constructor(coords, distance, duration, userName) {
    this.coords = coords; // array [lat, lng]
    this.distance = distance; // km
    this.duration = duration; // min
    this.userName = userName; // user's name
  }
  _description() {
    this.description = `${this.type[0].toUpperCase() + this.type.slice(1)} on ${
      this.months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
  // click() {
  //   this.clicks++;
  // }
}

class Running extends Workouts {
  type = 'running';
  constructor(coords, distance, duration, userName, cadence) {
    super(coords, distance, duration, userName);
    this.cadence = cadence;
    this.calcPace();
    this._description();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workouts {
  type = 'cycling';
  constructor(coords, distance, duration, userName, elevation) {
    super(coords, distance, duration, userName);
    this.elevation = elevation;
    this.calcSpeed();
    this._description();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run1 = new Running([46, -20], 5.2, 24, 'Alex', 178);
// const cycling1 = new Cycling([46, -20], 27, 95, 'Alina');
// console.log(run1, cycling1);

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #mapEvent;
  #map;
  #workouts = [];
  userName = 'Alex';
  #mapZoomLevel = 13;

  constructor() {
    // Get user's location
    this._getPosition();
    // Defining listeners
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevetionField.bind(this));
    containerWorkouts.addEventListener(
      'click',
      this._moveToMapWorkout.bind(this)
    );
    // Get local storage
    this._getLocalStorage();
  }

  _getPosition() {
    //Check if our browser has Geolocation API
    if (navigator.geolocation) {
      //If our browser has Geolocation API find my location
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on('click', this._showForm.bind(this));
    this.#workouts.forEach(workout => this._renderWorkoutMarker(workout));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    // console.log(this.#mapEvent);
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    // Clear the input fields
    inputDistance.value =
      inputDuration.value =
      inputElevation.value =
      inputCadence.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevetionField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputDistance.focus();
  }

  _newWorkout(e) {
    e.preventDefault();
    const validNumbers = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const positiveNumbers = (...inputs) => inputs.every(inp => inp > 0);
    // Get data from form
    const { lat, lng } = this.#mapEvent.latlng;
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // Check if data is valid
      if (
        !validNumbers(distance, duration, cadence) ||
        !positiveNumbers(distance, duration, cadence)
      ) {
        return alert('Inputs has to be positive numbers');
      }
      // If workout is running, create running object
      workout = new Running(
        [lat, lng],
        distance,
        duration,
        this.userName,
        cadence
      );
    }
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // Check if data is valid
      if (
        !validNumbers(distance, duration, elevation) ||
        !positiveNumbers(distance, duration)
      ) {
        return alert('Inputs has to be positive numbers');
      }
      // If workout is cycling, create cycling object
      workout = new Cycling(
        [lat, lng],
        distance,
        duration,
        this.userName,
        elevation
      );
    }
    // Add new object to workout array
    this.#workouts.push(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on the UI list
    this._renderWorkout(workout);

    // Hide form and clear input fields
    this._hideForm();

    // Set the local storage for all workouts
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? ` 🏃‍♂️` : ` 🚴‍♀️`} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    const icon = workout.type === 'running' ? ` 🏃‍♂️` : ` 🚴‍♀️`;
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${icon}</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
    `;
    if (workout.type === 'running') {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>
    `;
    }
    if (workout.type === 'cycling') {
      html += `
      <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevation}</span>
        <span class="workout__unit">m</span>
      </div>
    </li>
    `;
    }
    // Render workout on UI list
    form.insertAdjacentHTML('afterend', html);
  }

  _moveToMapWorkout(e) {
    const workoutElement = e.target.closest('.workout');
    if (!workoutElement) return;
    const workout = this.#workouts.find(
      workout => workout.id === workoutElement.dataset.id
    );
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    // workout.click();
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    this.browserStorage = JSON.parse(localStorage.getItem('workouts'));
    if (!this.browserStorage) return;
    console.log(this.browserStorage);
    // console.log(this);
    this.#workouts = this.browserStorage;
    this.#workouts.forEach(workout => this._renderWorkout(workout));
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
