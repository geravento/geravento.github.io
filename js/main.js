// Plataforma Livre de Geração Centralizada.
// Em desenvolvimento...

import Platform from './platform.js';


const platform = new Platform();

$('div#points-toggle-ctrl button').click(function(e) {
	platform.togglePoints();
	$(this).toggleClass('active');
});

$('div#level-toggle-ctrl button').click(function(e) {
	const level = platform.toggleLevel($(this).val());

	$('div#level-toggle-ctrl button').removeClass('active');
	if (level) $(this).addClass('active');
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
	$('div.controls div.middle-bar div.left-panel').fadeToggle(200);
});

$('li#main-plot-toggle-ctrl').click(() => {
	$('div.controls div.middle-bar div.main-panel').fadeToggle(200);
})


window.onload = platform.load();


/* --- EXPERIMENTING --- */

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