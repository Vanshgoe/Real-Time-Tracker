const socket = io();
// MAP
const map = L.map("map").setView([20.5937, 78.9629],20);
L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "OpenStreetMap"
    }
).addTo(map);
// VARIABLES
const markers = {};

let mapInitialized = false;

let lastEmitTime = 0;

let watchId = null;
// SOCKET EVENTS
socket.on("connect", () => {

    console.log("Connected:", socket.id);

});

socket.on("disconnect", () => {

    console.log("Disconnected From Server");

});

socket.io.on("reconnect", () => {

    console.log("Reconnected");

});
// GEOLOCATION
if (navigator.geolocation) {

    watchId = navigator.geolocation.watchPosition(

        (position) => {

            const { latitude, longitude } = position.coords;

            console.log("Location:", latitude, longitude);
            // THROTTLE LOCATION EVENTS
            const now = Date.now();

            if (now - lastEmitTime > 2000) {

                socket.emit("send-location", {
                    latitude,
                    longitude
                });

                lastEmitTime = now;

            }

        },

        (error) => {

            console.error(error);

            socket.disconnect();

            switch (error.code) {

                case error.PERMISSION_DENIED:
                    alert("Location permission denied");
                    break;

                case error.POSITION_UNAVAILABLE:
                    alert("Location unavailable");
                    break;

                case error.TIMEOUT:
                    alert("Location request timeout");
                    break;

                default:
                    alert("Unknown geolocation error");
                    break;

            }

        },

        {
            enableHighAccuracy: false,
            maximumAge: 0,
            timeout: 30000,
        }

    );

} else {

    alert("Geolocation not supported");

}
// RECEIVE LOCATION
socket.on("receive-location", (data) => {
    const { id, latitude, longitude } = data;

    // INITIAL MAP CENTER
    if (!mapInitialized) {

        map.setView([latitude, longitude], 16);

        mapInitialized = true;

    }
    // UPDATE EXISTING MARKER
    if (markers[id]) {

        markers[id].setLatLng([latitude, longitude]);

    }
    // CREATE NEW MARKER
    else {

        markers[id] = L.marker([latitude, longitude])
            .addTo(map)
            .bindPopup(`User: ${id}`);

    }

});
// REMOVE DISCONNECTED USER
socket.on("user-disconnected", (id) => {

    console.log("User Disconnected:", id);

    if (markers[id]) {

        map.removeLayer(markers[id]);

        delete markers[id];

    }

});
// INTERNET OFFLINE
window.addEventListener("offline", () => {

    console.log("Internet Disconnected");

});
// CLEANUP
window.addEventListener("beforeunload", () => {

    if (watchId !== null) {

        navigator.geolocation.clearWatch(watchId);

    }

});