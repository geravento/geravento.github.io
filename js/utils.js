/* Utilidades. */

const Utils = {
    maskCEG: ceg => ceg.replace(/([A-Z]{3})([A-Z]{2})([A-Z]{2})(\d{6})(\d{1})(\d{2})/, '$1.$2.$3.$4-$5.$6'),
    formatCoords: point => `${Math.abs(point.lat).toFixed(1)}° ${point.lat >= 0 ? 'N' : 'S'}, ${Math.abs(point.lon).toFixed(1)}° ${point.lon >= 0 ? 'L' : 'O'}`
}

export default Utils;