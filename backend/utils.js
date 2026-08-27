/**
 * Calculate distance between two GPS coordinates using Haversine formula.
 * Returns distance in meters.
 * Tradus din pontaj_digital/backend/app/api/clockin.py
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Raza Pământului în metri
    const toRad = Math.PI / 180;
    
    const dLat = (lat2 - lat1) * toRad;
    const dLon = (lon2 - lon1) * toRad;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
              
    const c = 2 * Math.asin(Math.sqrt(a));
    
    return R * c;
}

/**
 * Verify if employee is within the allowed geofence radius.
 * @param {number} employeeLat 
 * @param {number} employeeLon 
 * @param {number} siteLat 
 * @param {number} siteLon 
 * @param {number} allowedRadiusMeters 
 * @returns {object} { isValid: boolean, distance: number }
 */
function verifyGeofence(employeeLat, employeeLon, siteLat, siteLon, allowedRadiusMeters) {
    const distance = calculateDistance(employeeLat, employeeLon, siteLat, siteLon);
    return {
        isValid: distance <= allowedRadiusMeters,
        distance: distance
    };
}

module.exports = {
    calculateDistance,
    verifyGeofence
};
