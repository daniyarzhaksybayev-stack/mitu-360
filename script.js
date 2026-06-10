const panoramaPathMap = {
  'panoramas/approach-building-1.jpg': 'panoramas/улица 1.jpg',
  'panoramas/building-1-area.jpg': 'panoramas/улица 2.jpg',
  'panoramas/between-buildings.jpg': 'panoramas/улица 3.jpg',
  'panoramas/parking.jpg': 'panoramas/parking.jpg',
  'panoramas/building-2-entrance.jpg': 'panoramas/building-2-entrance.jpg',
  'panoramas/building-2-hall.jpg': 'panoramas/building-2-hall.jpg'
};

const locations = [
  // hotspots - массив направлений внутри панорамы
  // Каждый hotspot имеет: target (id локации), text (подпись), pitch (вертикаль), yaw (горизонталь)
  // Можно добавлять неограниченное количество hotspots в одной локации
  {
    id: 'approachBuilding1',
    title: 'Вход на территорию',
    type: 'Внешняя локация',
    description: 'Начальная точка маршрута',
    panoramaPath: 'panoramas/улица 1.jpg',
    prev: null,
    next: 'building1Area',
    hotspots: [
      { target: 'building1Area', text: 'К корпусу', pitch: 0, yaw: -8 }
    ],
    mapPosition: { x: 81, y: 19 }
  },
  {
    id: 'building1Area',
    title: 'Первый корпус',
    type: 'Внешняя локация',
    description: 'Учебный корпус',
    panoramaPath: 'panoramas/улица 2.jpg',
    prev: 'approachBuilding1',
    next: 'betweenBuildings',
    hotspots: [
      { target: 'approachBuilding1', text: 'Назад к началу', pitch: 3, yaw: -175 },
      { target: 'betweenBuildings', text: 'Между корпусами', pitch: 0, yaw: 3 },
      { target: 'корпус 1', text: 'В корпус 1', pitch: 13, yaw: 90 }
    ],
    mapPosition: { x: 68, y: 20 }
  },
  {
    id: 'betweenBuildings',
    title: 'Центральная территория',
    type: 'Территория кампуса',
    description: 'Между учебными корпусами',
    panoramaPath: 'panoramas/улица 3.jpg',
    prev: 'building1Area',
    next: 'parking',
    hotspots: [
      { target: 'building1Area', text: 'К 1 корпусу', pitch: 5, yaw: -170 },
      { target: 'parking', text: 'К парковке', pitch: 0, yaw: 2 },
      { target: 'Общежитие', text: 'Общежитие', pitch: 0, yaw: -88 }
    ],
    mapPosition: { x: 46, y: 21 }
  },
  {
    id: 'parking',
    title: 'Парковка',
    type: 'Внешняя локация',
    description: 'Парковочная зона',
    panoramaPath: 'panoramas/parking.jpg',
    prev: 'betweenBuildings',
    next: 'building2Entrance',
    hotspots: [
      { target: 'betweenBuildings', text: 'Назад', pitch: 3, yaw: -40 },
      { target: 'building2Entrance', text: 'Вход в корпус', pitch: 0, yaw: 80 }
    ],
    mapPosition: { x: 16, y: 24 }
  },
  {
    id: 'building2Entrance',
    title: 'Вход во 2 корпус',
    type: 'Входная зона',
    description: 'Основной вход',
    panoramaPath: 'panoramas/building-2-entrance.jpg',
    prev: 'parking',
    next: 'building2Hall',
    hotspots: [
      { target: 'parking', text: 'К парковке', pitch: 1, yaw: -160 },
      { target: 'building2Hall', text: 'Внутрь корпуса', pitch: 0, yaw: 40 }
    ],
    mapPosition: { x: 16, y: 36 }
  },
  {
    id: 'building2Hall',
    title: 'Холл 2 корпуса',
    type: 'Внутренняя локация',
    description: 'Внутренняя локация',
    panoramaPath: 'panoramas/building-2-hall.jpg',
    prev: 'building2Entrance',
    next: null,
    hotspots: [
      { target: 'building2Entrance', text: 'Выход', pitch: 0, yaw: -190 },
      { target: '', text: '', pitch: 0, yaw: -43 },
      { target: '', text: '', pitch: 5, yaw: 67 },
      { target: '', text: '', pitch: 3, yaw: 7 },
      { target: '', text: '', pitch: 7, yaw: 97 }
    ],
    mapPosition: { x: 16, y: 46 }
  }
];

let currentId = locations[0].id;
let viewer = null;
let loaderTimeout = null;
let sceneLoaded = false;

const $ = selector => document.querySelector(selector);

function showLoader() {
  const loader = $('#loader');
  if (loader) {
    loader.style.display = 'block';
    loader.setAttribute('aria-hidden', 'false');
  }
}

function hideLoader() {
  const loader = $('#loader');
  if (loader) {
    loader.style.display = 'none';
    loader.setAttribute('aria-hidden', 'true');
  }
}

function showPlaceholder(title, desc) {
  hideLoader();
  const placeholder = $('#placeholder');
  if (!placeholder) return;
  $('#ph-title').textContent = title || 'Панорама недоступна';
  $('#ph-desc').textContent = desc || 'Панорама для данной локации будет добавлена после съёмки.';
  placeholder.style.display = 'block';
}

function hidePlaceholder() {
  const placeholder = $('#placeholder');
  if (placeholder) {
    placeholder.style.display = 'none';
  }
}

function findLocation(id) {
  return locations.find(location => location.id === id);
}

function mapPanoramaPath(path) {
  return panoramaPathMap[path] || path;
}

function saveAppState() {
  try {
    localStorage.setItem('mituTourState', JSON.stringify({
      currentId,
      view: document.querySelector('#tourPage').classList.contains('hidden') ? 'home' : 'tour'
    }));
  } catch (error) {
    console.warn('Не удалось сохранить состояние тура', error);
  }
}

function restoreAppState() {
  try {
    const raw = localStorage.getItem('mituTourState');
    if (!raw) return false;
    const state = JSON.parse(raw);
    if (!state) return false;
    const savedLocation = findLocation(state.currentId);
    if (!savedLocation) return false;
    currentId = state.currentId;
    if (state.view === 'tour') {
      loadScene(currentId);
    } else {
      showHome();
    }
    return true;
  } catch (error) {
    console.warn('Не удалось восстановить состояние тура', error);
    return false;
  }
}

function createHotspot(hotSpotDiv, args) {
  hotSpotDiv.classList.add('panorama-hotspot');
  const label = args.text || args.targetTitle || 'Перейти дальше';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'panorama-hotspot-button';
  button.setAttribute('aria-label', label);
  button.innerHTML = `
    <span class="hotspot-circle">→</span>
    <span class="hotspot-tip">${label}</span>
  `;
  button.addEventListener('click', event => {
    event.stopPropagation();
    loadScene(args.targetId);
  });
  hotSpotDiv.appendChild(button);
}

function getHotspots(location) {
  const hotSpots = [];
  if (!location.hotspots || !Array.isArray(location.hotspots)) {
    return hotSpots;
  }
  location.hotspots.forEach(hotspot => {
    const targetLocation = findLocation(hotspot.target);
    hotSpots.push({
      pitch: hotspot.pitch,
      yaw: hotspot.yaw,
      type: 'custom',
      createTooltipFunc: createHotspot,
      createTooltipArgs: {
        text: hotspot.text,
        targetId: hotspot.target,
        targetTitle: targetLocation ? targetLocation.title : 'Переход'
      }
    });
  });
  return hotSpots;
}

function showHome() {
  document.body.classList.remove('tour-mode');
  document.querySelector('#tourPage').classList.add('hidden');
  document.querySelector('main').classList.remove('hidden');
  const header = document.querySelector('.app-header');
  if (header) header.classList.remove('hidden');
  saveAppState();
}

function showTour() {
  document.body.classList.add('tour-mode');
  document.querySelector('main').classList.add('hidden');
  document.querySelector('#tourPage').classList.remove('hidden');
  const header = document.querySelector('.app-header');
  if (header) header.classList.remove('hidden');
  showTourMapHint();
}

function startTour() {
  currentId = locations[0].id;
  showTour();
  loadScene(currentId);
}

function focusTour() {
  const tourPage = document.querySelector('#tourPage');
  if (tourPage && !tourPage.classList.contains('hidden')) {
    tourPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    startTour();
  }
}

function goHome() {
  closeModal();
  showHome();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showTourMapHint() {
  const hint = document.querySelector('#tourMapHint');
  if (!hint) return;
  try {
    if (localStorage.getItem('mituTourMapHintClosed') === 'true') return;
  } catch (error) {
    console.warn('Не удалось проверить состояние подсказки карты', error);
  }
  hint.classList.remove('hidden');
}

function closeTourMapHint() {
  const hint = document.querySelector('#tourMapHint');
  if (hint) hint.classList.add('hidden');
  try {
    localStorage.setItem('mituTourMapHintClosed', 'true');
  } catch (error) {
    console.warn('Не удалось сохранить состояние подсказки карты', error);
  }
}

function loadScene(locationId) {
  const location = findLocation(locationId);
  if (!location) return;

  currentId = locationId;
  if (document.getElementById('mapModal') && !document.getElementById('mapModal').classList.contains('hidden')) {
    buildMapMarkers();
  }
  buildMapMarkers('mainMapMarkers', 'mainLocationList');
  showTour();
  saveAppState();
  hidePlaceholder();
  showLoader();
  sceneLoaded = false;
  $('#tourTitle').textContent = location.title;
  $('#locationIndicator').textContent = location.title;

  if (viewer && typeof viewer.destroy === 'function') {
    try { viewer.destroy(); } catch (error) { console.warn(error); }
    viewer = null;
  }

  const actualPath = mapPanoramaPath(location.panoramaPath);
  const loadPath = actualPath;
  const fallbackPath = actualPath !== location.panoramaPath ? location.panoramaPath : null;
  const placeholderSVG = `<svg xmlns='http://www.w3.org/2000/svg' width='2048' height='1024'><rect width='100%' height='100%' fill='%23f0f4ff'/><text x='50%' y='48%' dominant-baseline='middle' text-anchor='middle' fill='%23163b6d' font-family='Arial,sans-serif' font-size='64'>Панорама не найдена</text><text x='50%' y='58%' dominant-baseline='middle' text-anchor='middle' fill='%237a8aa6' font-family='Arial,sans-serif' font-size='36'>Проверьте файл на сервере и попробуйте другую точку.</text></svg>`;
  const placeholderDataUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(placeholderSVG);

  const createViewer = path => {
    const panoramaElement = document.getElementById('panorama');
    if (panoramaElement) panoramaElement.innerHTML = '';
    if (viewer && typeof viewer.destroy === 'function') {
      try { viewer.destroy(); } catch (error) { console.warn(error); }
      viewer = null;
    }
    const panoramaUrl = (typeof path === 'string' && path.startsWith('data:')) ? path : encodeURI(path);
    console.log('Создаю viewer для:', path, '->', panoramaUrl);
    viewer = pannellum.viewer('panorama', {
      type: 'equirectangular',
      panorama: panoramaUrl,
      autoLoad: true,
      showControls: true,
      hotSpots: getHotspots(location)
    });
    if (viewer && typeof viewer.on === 'function') {
      viewer.on('load', () => {
        sceneLoaded = true;
        hideLoader();
        hidePlaceholder();
      });
      viewer.on('error', () => {
        sceneLoaded = false;
        hideLoader();
        showPlaceholder('Ошибка загрузки панорамы', 'Не удалось загрузить: ' + path);
      });
    }
  };

  const testAndCreate = (path, fallback) => {
    const tryPaths = [];
    tryPaths.push(path);
    const encoded = encodeURI(path);
    if (encoded !== path) tryPaths.push(encoded);
    if (fallback) {
      tryPaths.push(fallback);
      const fbEnc = encodeURI(fallback);
      if (fbEnc !== fallback) tryPaths.push(fbEnc);
    }

    let tried = 0;
    const tryNext = () => {
      if (tried >= tryPaths.length) {
        console.warn('Все попытки загрузки не удались для', path);
        createViewer(placeholderDataUri);
        showPlaceholder('Не найден файл', 'Не найден файл: ' + path);
        return;
      }
      const p = tryPaths[tried++];
      console.log('Пробую загрузить панораму:', p);
      const img = new Image();
      img.onload = () => {
        console.log('Успешно загружено (изображение):', p, 'размер:', img.naturalWidth + 'x' + img.naturalHeight);
        createViewer(p);
      };
      img.onerror = () => {
        console.warn('Не найден файл (попытка):', p);
        setTimeout(tryNext, 50);
      };
      img.src = p;
    };
    tryNext();
  };

  console.log('Загрузка панорамы:', location.panoramaPath, '->', loadPath);
  testAndCreate(loadPath, fallbackPath);

  clearTimeout(loaderTimeout);
  loaderTimeout = setTimeout(() => {
    if (!sceneLoaded) {
      hideLoader();
      showPlaceholder('Ошибка загрузки панорамы', 'Не удалось загрузить файл за 5 секунд: ' + location.panoramaPath);
    }
  }, 5000);
}

function openMap() {
  closeTourMapHint();
  openModal('mapModal');
}

function scrollToCampusMap() {
  const wasTourOpen = !document.querySelector('#tourPage').classList.contains('hidden');
  if (wasTourOpen) showHome();
  const section = document.querySelector('#campusMapSection');
  if (section) {
    requestAnimationFrame(() => {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

function closeMap() {
  closeModal('mapModal');
}

function openInfo() {
  const location = findLocation(currentId);
  if (!location) return;
  $('#infoTitle').textContent = location.title;
  $('#infoType').textContent = location.type;
  $('#infoDesc').textContent = location.description;
  openModal('infoModal');
}

function closeInfo() {
  closeModal('infoModal');
}

function openModal(id) {
  closeModal();
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('hidden');
  if (id === 'mapModal') {
    buildMapMarkers();
    requestAnimationFrame(syncAllMapMarkerLayers);
  }
}

function closeModal(id) {
  if (id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('hidden');
  } else {
    document.querySelectorAll('.modal').forEach(modal => modal.classList.add('hidden'));
  }
}

function navigate(direction) {
  const location = findLocation(currentId);
  if (!location) return;
  const nextId = direction === 'next' ? location.next : location.prev;
  if (nextId) loadScene(nextId);
}

function syncMapMarkerLayer(markerContainerId) {
  const markers = document.getElementById(markerContainerId);
  if (!markers) return;

  // Маркеры больше не пересчитываются через размеры картинки.
  // И главная карта, и карта в модальном окне используют один и тот же
  // контейнер .campus-map-shell, поэтому проценты x/y работают одинаково.
  markers.style.left = '0';
  markers.style.top = '0';
  markers.style.width = '100%';
  markers.style.height = '100%';
}

function syncAllMapMarkerLayers() {
  syncMapMarkerLayer('mainMapMarkers');
  syncMapMarkerLayer('mapMarkers');
}

function buildMapMarkers(markerContainerId = 'mapMarkers', listContainerId = 'locationList') {
  const markers = document.getElementById(markerContainerId);
  const list = document.getElementById(listContainerId);
  if (!markers || !list) return;
  markers.innerHTML = '';
  list.innerHTML = '';

  locations.forEach(location => {
    const marker = document.createElement('div');
    marker.className = 'map-marker';
    marker.style.left = `${location.mapPosition.x}%`;
    marker.style.top = `${location.mapPosition.y}%`;
    marker.dataset.id = location.id;
    if (location.id === currentId) marker.classList.add('active');
    marker.addEventListener('click', () => {
      closeMap();
      loadScene(location.id);
    });
    marker.addEventListener('mouseenter', () => highlightListItem(location.id, true, listContainerId));
    marker.addEventListener('mouseleave', () => highlightListItem(location.id, false, listContainerId));
    markers.appendChild(marker);

    const item = document.createElement('div');
    item.className = 'location-item';
    item.dataset.id = location.id;
    item.innerHTML = `<div><strong>${location.title}</strong><div class='muted' style='font-size:12px'>${location.type}</div></div><div><button class='btn secondary'>Перейти</button></div>`;
    item.addEventListener('mouseenter', () => highlightMapMarker(location.id, true, markerContainerId));
    item.addEventListener('mouseleave', () => highlightMapMarker(location.id, false, markerContainerId));
    item.querySelector('button').addEventListener('click', () => {
      closeMap();
      loadScene(location.id);
    });
    list.appendChild(item);
  });

  requestAnimationFrame(() => syncMapMarkerLayer(markerContainerId));
}

function highlightMapMarker(locationId, isHover, markerContainerId = 'mapMarkers') {
  const marker = document.querySelector(`#${markerContainerId} .map-marker[data-id='${locationId}']`);
  if (!marker) return;
  if (isHover) {
    marker.classList.add('hovered');
  } else {
    marker.classList.remove('hovered');
  }
}

function highlightListItem(locationId, isHover, listContainerId = 'locationList') {
  const item = document.querySelector(`#${listContainerId} .location-item[data-id='${locationId}']`);
  if (!item) return;
  if (isHover) {
    item.classList.add('hovered');
  } else {
    item.classList.remove('hovered');
  }
}

function renderMapPreview() {
  const container = document.querySelector('.map-markers');
  if (!container) return;
  container.innerHTML = '';
  locations.forEach(location => {
    const preview = document.createElement('div');
    preview.className = 'map-marker';
    preview.style.left = `${location.mapPosition.x}%`;
    preview.style.top = `${location.mapPosition.y}%`;
    preview.title = location.title;
    container.appendChild(preview);
  });
}

function safeBind(selector, handler) {
  const el = $(selector);
  if (el) el.addEventListener('click', handler);
}

const assistantAnswers = {
  start: {
    question: 'Как начать тур?',
    answer: 'Нажмите кнопку «Начать тур» на главной странице. После этого откроется панорамный режим, где можно переходить между локациями с помощью стрелок и горячих точек.'
  },
  map: {
    question: 'Как пользоваться картой?',
    answer: 'Откройте кнопку «Карта» в режиме тура. На карте можно выбрать нужную точку и сразу перейти к соответствующей панораме.'
  },
  locations: {
    question: 'Какие есть локации?',
    answer: 'В тур входят несколько точек: вход на территорию, первый корпус, центральная территория, парковка, вход во второй корпус и холл второго корпуса.'
  },
  rector: {
    question: 'Кто ректор университета?',
    answer: 'Ректором Международного инженерно-технологического университета является Акпанбетов Дархан Берикович. Актуальную информацию рекомендуется уточнять на официальном сайте METU.'
  },
  openDay: {
    question: 'Когда день открытых дверей?',
    answer: 'Дату Дня открытых дверей лучше уточнять на официальном сайте METU или в новостях университета. Обычно такие мероприятия помогают абитуриентам познакомиться с программами, инфраструктурой и приёмной комиссией.'
  },
  programs: {
    question: 'Какие есть направления обучения?',
    answer: 'В METU представлены направления, связанные с инженерией, IT, smart-технологиями, пищевым производством, биохимической инженерией, экономикой и бизнесом.'
  },
  news: {
    question: 'Где смотреть новости?',
    answer: 'Новости университета можно смотреть на официальном сайте METU. На этой странице также можно добавить краткий блок новостей для абитуриентов.'
  }
};

function setAssistantOpen(isOpen) {
  const widget = document.querySelector('#metuAssistant');
  const panel = document.querySelector('#assistantPanel');
  const toggle = document.querySelector('#assistantToggle');
  if (!panel || !toggle) return;
  [widget, panel, toggle].forEach(element => {
    if (!element) return;
    element.style.removeProperty('top');
    element.style.removeProperty('bottom');
    element.style.removeProperty('left');
    element.style.removeProperty('right');
    element.style.removeProperty('transform');
  });
  if (widget) widget.classList.toggle('is-open', isOpen);
  panel.classList.toggle('hidden', !isOpen);
  toggle.setAttribute('aria-expanded', String(isOpen));
}

function addAssistantMessage(text, type = 'bot') {
  const messages = document.querySelector('#assistantMessages');
  if (!messages) return;
  const message = document.createElement('div');
  message.className = `assistant-message assistant-${type}`;
  message.textContent = text;
  messages.appendChild(message);
  messages.scrollTop = messages.scrollHeight;
}

function answerAssistantQuestion(key) {
  const item = assistantAnswers[key];
  if (!item) return;
  addAssistantMessage(item.question, 'user');
  addAssistantMessage(item.answer, 'bot');
}

function clearAssistantChat() {
  const messages = document.querySelector('#assistantMessages');
  if (!messages) return;
  messages.innerHTML = '';
  addAssistantMessage('Здравствуйте! Выберите вопрос ниже, и я подскажу по виртуальному туру METU.', 'bot');
}

function initUI() {
  $('#year').textContent = new Date().getFullYear();
  safeBind('#brandHome', goHome);
  safeBind('#startTourHero', startTour);
  safeBind('#tourPreview', startTour);
  safeBind('#nav-home', goHome);
  safeBind('#nav-about', () => {
    const wasTourOpen = !document.querySelector('#tourPage').classList.contains('hidden');
    if (wasTourOpen) showHome();
    const section = document.querySelector('#aboutSection');
    if (section) {
      requestAnimationFrame(() => {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  });

  safeBind('#btn-home', goHome);
  safeBind('#btn-info', openInfo);
  safeBind('#btn-map', openMap);
  safeBind('#closeTourHint', closeTourMapHint);
  safeBind('#prevBtn', () => navigate('prev'));
  safeBind('#nextBtn', () => navigate('next'));

  safeBind('#ph-map', openMap);
  safeBind('#ph-home', showHome);

  safeBind('#closeMap', closeMap);
  safeBind('#infoClose', closeInfo);
  safeBind('#infoOpenMap', () => {
    closeInfo();
    openMap();
  });
  safeBind('#assistantToggle', () => {
    const panel = document.querySelector('#assistantPanel');
    setAssistantOpen(panel ? panel.classList.contains('hidden') : true);
  });
  safeBind('#assistantClose', () => setAssistantOpen(false));
  safeBind('#assistantClear', clearAssistantChat);

  document.querySelectorAll('#assistantQuestions [data-question]').forEach(button => {
    button.addEventListener('click', () => answerAssistantQuestion(button.dataset.question));
  });

  buildMapMarkers('mainMapMarkers', 'mainLocationList');

  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', event => {
      if (event.target === modal) closeModal();
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' || event.key === 'Esc') closeModal();
  });

  document.querySelectorAll('.campus-map__image, .campus-map, #interactiveMap').forEach(image => {
    if (image.complete) {
      requestAnimationFrame(syncAllMapMarkerLayers);
    } else {
      image.addEventListener('load', syncAllMapMarkerLayers, { once: true });
    }
  });

  window.addEventListener('resize', syncAllMapMarkerLayers);

  if (!restoreAppState()) {
    showHome();
  }
  closeModal();
}

document.addEventListener('DOMContentLoaded', initUI);
