// Plataforma Livre de Geração Centralizada.
// Em desenvolvimento...

const TECHS = ['EOL', 'UFV', 'UTN', 'UHE', 'CGH', 'PCH', 'UTE']
const LEVELS = ['subsystem', 'state', 'point']
const STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']
const SUBSYSTEMS = ['N', 'NE', 'SE', 'S']

const DICT = {
	'EOL': 'Eólica',
	'UFV': 'Fotovoltáica',
	'UTN': 'Nuclear',
	'UHE': 'Hidrelétrica',
	'CGH': 'Hidrelétrica',
	'PCH': 'Hidrelétrica',
	'UTE': 'Termelétrica'
}

const powerPlantIcons = {
	EOL:  L.icon({
		iconUrl: 'img/points/eol.png',
		className: 'power-plant-icon eol',
		iconSize: [24, 24],
		iconAnchor: [20, 20],
		popupAnchor: [1, -34]
	}),
	UFV:  L.icon({
		iconUrl: 'img/points/ufv.png',
		className: 'power-plant-icon ufv',
		iconSize: [24, 24],
		iconAnchor: [20, 20],
		popupAnchor: [1, -34]
	}),
	UTN: L.icon({
		iconUrl: 'img/points/utn.png',
		className: 'power-plant-icon utn',
		iconSize: [24, 24],
		iconAnchor: [20, 20],
		popupAnchor: [1, -34]
	}),
	UHE: L.icon({
		iconUrl: 'img/points/uhe.png',
		className: 'power-plant-icon uhe',
		iconSize: [24, 24],
		iconAnchor: [20, 20],
		popupAnchor: [1, -34]
	}),
	CGH: L.icon({
		iconUrl: 'img/points/uhe.png',
		className: 'power-plant-icon uhe',
		iconSize: [24, 24],
		iconAnchor: [20, 20],
		popupAnchor: [1, -34]
	}),
	PCH: L.icon({
		iconUrl: 'img/points/uhe.png',
		className: 'power-plant-icon uhe',
		iconSize: [24, 24],
		iconAnchor: [20, 20],
		popupAnchor: [1, -34]
	}),
	UTE: L.icon({
		iconUrl: 'img/points/ute.png',
		className: 'power-plant-icon ute',
		iconSize: [24, 24],
		iconAnchor: [20, 20],
		popupAnchor: [1, -34]
	})
};

const maskCEG = ceg => ceg.replace(/([A-Z]{3})([A-Z]{2})([A-Z]{2})(\d{6})(\d{1})(\d{2})/, '$1.$2.$3.$4-$5.$6');
const formatCoords = point => `${Math.abs(point.lat).toFixed(1)}° ${point.lat >= 0 ? 'N' : 'S'}, ${Math.abs(point.lon).toFixed(1)}° ${point.lon >= 0 ? 'L' : 'O'}`

class Platform {

	constructor(level, techs) {
		this.level = level;
		this.techs = techs;
		this.points = {};
	}

	setLevel(level) {
		this.level = level;
	}

	loadMap() {
		this.map = L.map('map', {
			zoomControl: false
		}).setView([-14, -55], 5);

		L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(this.map);

		console.log('Map loaded.');
	}

	loadPoints() {
		this.techs.forEach(tech => {
			fetch(`data/points/${tech}.json`)
			.then((response) => response.json())
			.then((points) => {
				points.forEach(point => {
					this.points[point.ceg] = point;

					L.marker([point.lat, point.lon], {icon: powerPlantIcons[tech]})
					.addTo(this.map)
					.on('click', () => this.openPowerPlantInfo(tech, point.ceg))
					.bindPopup(`
						<h2>${point.name} (${point.state})</h2>
						<ul>
							<li><i class="fa-solid fa-map-marker"></i>${formatCoords(point)}</li>
							<li><i class="fa-solid fa-bolt-lightning"></i>${(point.capacity / 1000).toFixed(1)} MW</li>
							<li><i class="fa-solid fa-magnifying-glass"></i>SIGA (ANEEL)</li>
						</ul>`
					);
				});
			})
			.catch((error) => console.error('Error fetching or parsing the data:', error));
		});
	}

	loadStates() {
		const map = this.map;

		// Fetch and add new GeoJSON data
		STATES.forEach(state => {
			fetch(`data/states/shapefiles/${state}_UF_2022.geojson`)
			.then((response) => response.json())
			.then((geoJsonData) => {
				L.geoJSON(geoJsonData, {
					style: function(feature) {
						return {
							color: feature.properties.color || '#3388ff',
							weight: 2,
							opacity: 1
						};
					},
					onEachFeature: function (feature, layer) {
						if (feature.properties && feature.properties.name) {
							layer.bindPopup(`Name: ${feature.properties.name}`);
						}
					}
				})
				.bindPopup(`<h3>${state}</h3>`)
				.addTo(map);
			})
			.catch((error) => console.error('Error fetching GeoJSON data:', error));
		})
	}

	loadSubsystems() {
		const map = this.map;

		// Fetch and add new GeoJSON data
		SUBSYSTEMS.forEach(subsystem => {
			fetch(`data/subsystems/shapefiles/${subsystem}.geojson`)
			.then((response) => response.json())
			.then((geoJsonData) => {
				L.geoJSON(geoJsonData, {
					style: function(feature) {
						return {
							color: feature.properties.color || '#3388ff',
							weight: 2,
							opacity: 1
						};
					},
					onEachFeature: function (feature, layer) {
                        if (feature.properties && feature.properties.name) {
                            layer.bindPopup(`Name: ${feature.properties.name}`);
                        }
                    }
				})
				.bindPopup(`<h3>${subsystem}</h3>`)
				.addTo(map);
			})
			.catch((error) => console.error('Error fetching GeoJSON data:', error));
		})
	}

	loadInfo() {
		if (this.level == 'point') this.loadPoints();
		if (this.level == 'state') this.loadStates();
		if (this.level == 'subsystem') this.loadSubsystems();
	}

	openPowerPlantInfo(tech, ceg) {
		const point = this.points[ceg];

		$('div#power-plant-info p').text(`USINA ${DICT[tech]}`);
		$('div#power-plant-info h1').text(point.name);
		$('div#power-plant-info li#ceg span').text(maskCEG(ceg));
		$('div#power-plant-info li#coords span').text(formatCoords(point));
		$('div#power-plant-info li#capacity span').text(`${(point.capacity / 1000).toFixed(1)} MW`);

		$('div#power-plant-info').show();
		$('div.left-menu div.content').show();
	}

	clearMap() {
		this.points = {};
		this.map.eachLayer(function(layer) {
			if (layer instanceof L.Marker) layer.remove();
			if (layer instanceof L.LayerGroup) layer.remove();
		});
	}
}

const platform = new Platform('point', ['EOL'])

window.onload = function() {
	platform.loadMap();
	platform.loadInfo();
}

$('div#level-toggle-ctrl button').click(function(e) {
	let level = $(this).val();

	if (level != platform.level) {
		platform.clearMap();
		platform.setLevel(level);
		platform.loadInfo(level);

		console.log('Changed level to', level);
		
		$('div#level-toggle-ctrl button').removeClass('active');
		$(this).addClass('active');
	}
});

$('div#tech-toggle-ctrl button').click(function(e) {
	let tech = $(this).val();

	if (platform.techs.includes(tech)) {
		platform.techs = platform.techs.filter(item => item !== tech);
		$(this).removeClass('active');
	} else {
		platform.techs.push(tech);
		$(this).addClass('active');
	}

	platform.clearMap();
	platform.loadInfo();
});


$('li#toggle-left-menu').click(() => {
	$('div.left-menu div.content').slideToggle();
});