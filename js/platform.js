/* Classe da plataforma. */


import Utils from './utils.js';

class Platform {

	constructor() {
		this.techs = ['EOL', 'UFV'];
		this.level = 'subsystems';

		this.showPoints = true;
		this.points = {};
	}

	load() {
		fetch('data/config.json')
		.then((response) => response.json())
		.then((config) => {
			this.config = config;
			console.log('Config loaded.');

			this.loadMap();
			this.loadInfo();
		})
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

			const icon = L.icon({
				iconUrl: this.config['techs'][tech]['icon'],
				className: `power-plant-icon ${tech.toLowerCase()}`,
				iconSize: [24, 24],
				iconAnchor: [20, 20],
				popupAnchor: [1, -34]
			})

			fetch(`data/points/${tech}.json`)
			.then((response) => response.json())
			.then((points) => {
				points.forEach(point => {
					this.points[point.ceg] = point;
					capacity += point.capacity;

					if (this.showPoints) {
						L.marker([point.lat, point.lon], {icon: icon})
						.addTo(this.map)
						.bindPopup(`
							<h2>${point.name} (${point.state})</h2>
							<ul>
								<li><i class="fa-solid fa-map-marker"></i>${Utils.formatCoords(point)}</li>
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
		});
	}

	loadShapes() {
		for (const [slug, name] of Object.entries(this.config["shapes"][this.level])) {
			fetch(`data/${this.level}/shapefiles/${slug}_UF_2022.geojson`)
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

	loadInfo() {
		this.loadPoints();
		if (this.level) this.loadShapes();
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
	togglePoints() {
		this.showPoints = !this.showPoints;

		this.clearMarkers();
		if (this.showPoints) this.loadPoints();
	}

	toggleLevel(level) {
		if (level == this.level) level = null;

		this.level = level;
		this.clearShapes();

		if (level) this.loadShapes();
		return this.level;
	}
}

export default Platform;