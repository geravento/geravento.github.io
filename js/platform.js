/* Classe da plataforma. */


import Utils from './utils.js';

class Platform {

	constructor() {
		this.techs = ['UEE', 'UFV'];
		this.shapeLevel = 'subsystems';
		this.pointLevel = 'groups';

		this.showPoints = true;
		this.points = {};
	}

	load() {
		fetch('data/config.json')
		.then((response) => response.json())
		.then((config) => {
			this.config = config;
			console.log('Config loaded.');

			this.loadResources();
			this.loadMap();
			this.loadInfo();
		})
	}

	loadResources() {
		this.icons = {};

		for (let tech of Object.keys(this.config['techs'])) {
			this.icons[tech] = L.icon({
				iconUrl: this.config['techs'][tech]['icon'],
				className: `power-plant-icon ${tech.toLowerCase()}`,
				iconSize: [24, 24],
				iconAnchor: [20, 20],
				popupAnchor: [1, -34]
			});
		}
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

	loadPowerPlants() {
		this.tech_capacity = {};
		for (let tech of this.techs) this.tech_capacity[tech] = 0;

		fetch(`data/points/power-plants.json`)
		.then((response) => response.json())
		.then((points) => {
			self.powerPlants = points;

			points.forEach(point => {
				this.points[point.ceg] = point;
				this.tech_capacity[point.tech] += point.capacity;

				if (this.pointLevel == 'power-plants' && this.techs.includes(point.tech)) {
					L.marker([point.lat, point.lon], {icon: this.icons[point.tech]})
					.addTo(this.map)
					.bindPopup(`
						<h2>${point.name}</h2>
						<ul>
							<li><i class="fa-solid fa-map-marker"></i>${Utils.formatCoords(point)}</li>
							<li><i class="fa-solid fa-bolt-lightning"></i>${(point.capacity / 1000).toFixed(1)} MW</li>
							<li><i class="fa-solid fa-magnifying-glass"></i>SIGA (ANEEL)</li>
							<li><i class="fa-solid fa-users"></i>${point.ownership}</li>
						</ul>`
					);
				}
			});
		})
		.then(() => {
			for (let tech of this.techs) this.tech_capacity[tech] = (this.tech_capacity[tech] / 1E6).toFixed(1);

			let total = 0;
			for (let tech of this.techs) total += parseFloat(this.tech_capacity[tech]);

			$('div#overview span b').text(`${total.toFixed(1)} GWh`);

			const data = [{
				values: Object.values(this.tech_capacity),
				labels: Object.keys(this.tech_capacity),
				marker: {
					colors: Object.keys(this.tech_capacity).map(tech => this.config['techs'][tech]['color']),
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
	}

	loadONSGroups() {
		fetch(`data/points/groups.json`)
		.then((response) => response.json())
		.then((points) => {
			this.groups = points;

			points.forEach(point => {
				if (this.pointLevel == 'groups' && this.techs.includes(point.tech)) {
					L.marker([point.lat, point.lon], {icon: this.icons[point.tech]})
					.addTo(this.map)
					.bindPopup(`
						<h2>${point.name}</h2>
						<ul>
							<li><i class="fa-solid fa-map-marker"></i>${Utils.formatCoords(point)}</li>
							<li><i class="fa-solid fa-bolt-lightning"></i>${(point.capacity / 1000).toFixed(1)} MW</li>
							<li><i class="fa-solid fa-hashtag"></i>${point.point_count} usina(s).</li>
							<li><i class="fa-solid fa-magnifying-glass"></i>ONS</li>
						</ul>`
					);
				}
			});
		})
		.catch((error) => console.error('Error fetching or parsing the data:', error));
	}

	loadShapes() {
		for (const [slug, name] of Object.entries(this.config["shapes"][this.shapeLevel])) {
			fetch(`data/${this.shapeLevel}/shapefiles/${slug}_UF_2022.geojson`)
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
				.bindPopup(`<h3>${name}</h3>`)
				.addTo(this.map);
			})
			.catch((error) => console.error('Error fetching GeoJSON data:', error));
		}
	}

	loadTransmissionLines() {
		fetch('data/transmission/DataRecords.geojson')
		.then((response) => response.json())
		.then((geoJsonData) => {
			L.geoJSON(geoJsonData, {
				style: (feature) => {
					return {
						color: this.config["shapes"]["transmission_lines"][feature.properties.VN]?.["color"] || '#3388ff',
						weight: 2,
						opacity: 1,
						dashArray: new Date(feature.properties.DTENTRADA) <= Math.floor(Date.now() / 1000) ? '5, 5' : undefined
					};
				},
				onEachFeature: (feature, layer) => {
					layer.bindPopup(`
						<h3>${feature.properties.NOMELONGO}</h3>
						<p>${feature.properties.AGE_NOME}</p>
					`);
				}
			})
			.addTo(this.map);
		})
	}

	loadSubstations() {
		fetch('data/substations/DataRecords.geojson')
		.then((response) => response.json())
		.then((geoJsonData) => {
			const icon = L.DivIcon({
				className: 'substation-icon',
				html: `<i class="fa-solid fa-bolt-lightning"></i>`
			})

			L.geoJSON(geoJsonData, {
				style: {},
				onEachFeature: (feature, layer) => {
					
				},
				icon: icon
			})
			.addTo(this.map);
		})
	}

	loadInfo() {
		this.loadPowerPlants();
		this.loadONSGroups();

		if (this.shapeLevel) this.loadShapes();

		// this.loadTransmissionLines();
		// this.loadSubstations();
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

	// UI Events
	togglePointLevel(pointLevel) {
		if (pointLevel == this.pointLevel) pointLevel = null;

		this.pointLevel = pointLevel;
		this.clearMarkers();

		if (pointLevel) {
			this.loadPowerPlants();
			this.loadONSGroups();
		}

		return this.pointLevel;
	}

	toggleShapeLevel(level) {
		if (level == this.shapeLevel) level = null;

		this.shapeLevel = level;
		this.clearShapes();

		if (level) this.loadShapes();
		return this.shapeLevel;
	}
}

export default Platform;