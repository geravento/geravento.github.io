// Plataforma Livre de Geração Centralizada.
// Em desenvolvimento...

const TECHS = ['EOL', 'UFV', 'UTN', 'UHE', 'CGH', 'PCH', 'UTE']
const LEVELS = ['subsystem', 'state', 'point']
const STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']
const SUBSYSTEMS = ['N', 'NE', 'SE', 'S']
const TECH_COLORS = {
	'EOL': 'gray',
	'UFV': 'orange',
	'UTN': 'limegreen',
	'UHE': 'dogerblue',
	'CGH': 'blue',
	'PCH': 'lightblue',
	'UTE': 'red'
}

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

	constructor() {
		this.techs = ['EOL', 'UFV'];

		this.level = 'subsystem';

		this.showPoints = true;
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
		this.tech_capacity = {};
		for (let tech of this.techs) this.tech_capacity[tech] = 0;

		this.techs.forEach(tech => {
			let capacity = 0;

			fetch(`data/points/${tech}.json`)
			.then((response) => response.json())
			.then((points) => {
				points.forEach(point => {
					this.points[point.ceg] = point;
					capacity += point.capacity;

					if (this.showPoints) {
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
					}
				});
			})
			.then(() => {
				this.tech_capacity[tech] = (capacity / 1E6).toFixed(1);

				let total = 0;
				for (let tech of this.techs) total += parseFloat(this.tech_capacity[tech]);

				$('div#overview span b').text(`${total.toFixed(1)} GWh`);

				const data = [{
					values: Object.values(this.tech_capacity),
					labels: Object.keys(this.tech_capacity),
					marker: {
						colors: Object.keys(this.tech_capacity).map(tech => TECH_COLORS[tech]),
					},
					type: 'pie',
					textinfo: 'value',
					unit: 'GWh',
					hole: 0.4,
				}];
		
				Plotly.newPlot('overview-pie', data, {
					height: 100,
					margin: {
						t: 20, b: 20, l: 0, r: 0
					},
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
		this.loadPoints();

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

	clearMarkers() {
		this.map.eachLayer(function(layer) {
			if (layer instanceof L.Marker) layer.remove();
		});
	}

	clearShapes() {
		this.map.eachLayer(function(layer) {
			if (layer instanceof L.LayerGroup) layer.remove();
		});
	}

	clearMap() {
		this.points = {};
		this.map.eachLayer(function(layer) {
			if (layer instanceof L.Marker) layer.remove();
			if (layer instanceof L.LayerGroup) layer.remove();
		});
	}
}

const platform = new Platform()

window.onload = function() {
	platform.loadMap();
	platform.loadInfo();
}

$('div#points-toggle-ctrl button').click(function(e) {
	platform.showPoints = !platform.showPoints;

	platform.clearMarkers();
	if (platform.showPoints) platform.loadPoints();

	$(this).toggleClass('active');
});

$('div#level-toggle-ctrl button').click(function(e) {
	let level = $(this).val();
	if (level == platform.level) level = '';

	platform.setLevel(level);
	platform.clearShapes();
	if (level == 'state') platform.loadStates();
	if (level == 'subsystem') platform.loadSubsystems();

	$('div#level-toggle-ctrl button').removeClass('active');
	if (level != '') $(this).addClass('active');
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


$('li#left-menu-toggle-ctrl').click(() => {
	$('div.controls div.middle-bar div.left-panel').slideToggle('linear');
});

$('div#select-view').on('click', () => alert('asd'));




fetch(`data/subsystems/series/ONS_202411.json`)
.then((response) => response.json())
.then((response) => {
	Plotly.newPlot(
		'select-plot',
		[{
			x: response['x'],
			y: response['data']['SE']['UHE'],
			name: 'UHE'
		},{
			x: response['x'],
			y: response['data']['SE']['UTE'],
			name: 'UTE'
		},{
			x: response['x'],
			y: response['data']['SE']['UTN'],
			name: 'UTN'
		}],
		{
			yaxis: {title: {text: `Geração (${response['unit']})`}}
		}
	)
})
.catch((error) => console.error('Error fetching data:', error));