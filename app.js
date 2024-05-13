var map;
var polygonLayers = [];
var seccion0 = [
    [-23.56403, -70.38028],
    [-23.56626, -70.39804],
    [-23.49941, -70.42847],
    [-23.4962, -70.40044]
];
var seccion1 = [
    [-23.56403, -70.38028],
    [-23.56626, -70.39804],
    [-23.59244, -70.39708],
    [-23.59301, -70.36916]
];
var seccion2 = [
    [-23.62879, -70.37258],
    [-23.62868, -70.39709],
    [-23.59244, -70.39708],
    [-23.59301, -70.36916]
];
var seccion3 = [
    [-23.66512, -70.388],
    [-23.66455, -70.40437],
    [-23.62868, -70.39709],
    [-23.62879, -70.37258]
];
var seccion4 = [
    [-23.71305, -70.42134],
    [-23.71624, -70.43383],
    [-23.66455, -70.40437],
    [-23.66512, -70.388]
];

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('clearAllBtn').addEventListener('click', limpiarTodo);
    map = L.map('map').setView([-23.65236, -70.39540], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    document.getElementById('togglePolygonBtn').addEventListener('click', togglePolygon);

    var geocoder = new L.Control.Geocoder.Photon();
    var routeLayers = [];
    var waypoints = JSON.parse(localStorage.getItem('waypoints')) || [];
    var waypointNames = JSON.parse(localStorage.getItem('waypointNames')) || [];
    var markers = []; // Array para almacenar los marcadores

    function togglePolygon() {
        var bounds = [seccion0, seccion1, seccion2, seccion3, seccion4];
        bounds.forEach(function(bound, index) {
            if (polygonLayers[index] && map.hasLayer(polygonLayers[index])) {
                map.removeLayer(polygonLayers[index]);
                polygonLayers[index] = null;
            } else {
                polygonLayers[index] = L.polygon(bound, {
                    color: 'black',
                    fillColor: '#f03',
                    fillOpacity: 0.1
                }).addTo(map);
                polygonLayers[index].bindPopup("Área " + (index) + " de emergencia marcada.");
            }
        });
    }

    window.buscarDireccion = function() {
        var comuna = document.getElementById('comuna').value;
        var direccion = document.getElementById('direccion').value;  // Dirección ingresada por el usuario
        var query = direccion + ', ' + comuna + ', Chile';
    
        geocoder.geocode(query, function(results) {
            if (results.length > 0) {
                var r = results[0];
                var waypointIndex = waypoints.length + 1;  // Número del nuevo waypoint
                var fullAddress = direccion.trim() + ", " + comuna.trim();  // Usa directamente la dirección ingresada
                var markerLabel = `${waypointIndex}: ${fullAddress}`;
                var iconUrl = `pinNumero/pin${Math.min(waypointIndex, 15)}.png`; // Limita el índice a 15 para las imágenes disponibles
    
                var customIcon = L.icon({
                    iconUrl: iconUrl,
                    iconSize: [38, 38], // Tamaño del ícono
                    iconAnchor: [22, 40], // Punto del ícono que corresponde a la ubicación del marcador
                    popupAnchor: [-3, -76] // Punto desde el que se abrirá el popup
                });
    
                var marker = L.marker([r.center.lat, r.center.lng], {title: fullAddress, icon: customIcon})
                    .bindPopup(markerLabel)
                    .addTo(map);
                markers.push(marker);
                waypoints.push([r.center.lat, r.center.lng]);
                waypointNames.push(fullAddress);  // Guarda la dirección ingresada
                localStorage.setItem('waypoints', JSON.stringify(waypoints));
                localStorage.setItem('waypointNames', JSON.stringify(waypointNames));
    
                updateAddressList();
                drawRoute();
            } else {
                alert('No se encontraron resultados para la búsqueda.');
            }
        });
    };
    
    
    
    function updateAddressList() {
        var addressList = document.getElementById('addressList');
        addressList.innerHTML = '';
    
        waypointNames.forEach((fullAddress, index) => {  // Asegúrate de que 'fullAddress' contenga la dirección completa.
            var card = document.createElement('div');
            card.className = 'address-card';
            card.draggable = true;
            card.setAttribute('data-index', index);
            card.textContent = `${index + 1}: ${fullAddress}`;  // Mostrar el índice y la dirección completa
    
            card.addEventListener('dragstart', handleDragStart);
            card.addEventListener('dragover', handleDragOver);
            card.addEventListener('drop', handleDrop);
            card.addEventListener('dragend', updateDragEnd);
    
            var removeButton = document.createElement('button');
            removeButton.textContent = 'Eliminar';
            removeButton.style.marginLeft = '10px';
            removeButton.onclick = function() { eliminarDireccion(index); };
            card.appendChild(removeButton);
    
            addressList.appendChild(card);
            markers[index].bindPopup(`${index + 1}: ${fullAddress}`).openPopup();
        });
    }
    

    function handleDragStart(e) {
        draggedItem = this;
        e.dataTransfer.setData('text', '');
        e.dataTransfer.effectAllowed = 'move';
    }
    
    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }
    
    function handleDrop(e) {
        e.preventDefault();
        if (this !== draggedItem && draggedItem) {
            var draggedIdx = parseInt(draggedItem.getAttribute('data-index'));
            var dropIdx = parseInt(this.getAttribute('data-index'));
    
            reorderArrays(draggedIdx, dropIdx);
            updateAddressList();
            drawRoute();
        }
    }
    
    function updateDragEnd(e) {
        draggedItem = null;
    }

    function reorderArrays(from, to) {
        // Mover los elementos en los arrays
        moveArrayItem(waypoints, from, to);
        moveArrayItem(waypointNames, from, to);
        moveArrayItem(markers, from, to);
        localStorage.setItem('waypoints', JSON.stringify(waypoints));
        localStorage.setItem('waypointNames', JSON.stringify(waypointNames));
    
        // Actualizar los íconos de los marcadores según su nueva posición
        markers.forEach((marker, index) => {
            var iconUrl = `pinNumero/pin${Math.min(index + 1, 15)}.png`; // Limita el índice a 15 para las imágenes disponibles
            var customIcon = L.icon({
                iconUrl: iconUrl,
                iconSize: [38, 38], // Ajusta según el tamaño de tus íconos
                iconAnchor: [22, 40],
                popupAnchor: [-3, -76]
            });
            marker.setIcon(customIcon);
        });
    
        updateAddressList(); // Llamar a updateAddressList para refrescar la interfaz de usuario si es necesario
    }
    
    function moveArrayItem(array, from, to) {
        const item = array.splice(from, 1)[0];
        array.splice(to, 0, item);
    }
    
    function eliminarDireccion(index) {
        markers[index].remove();
        markers.splice(index, 1);
        waypoints.splice(index, 1);
        waypointNames.splice(index, 1);
        localStorage.setItem('waypoints', JSON.stringify(waypoints));
        localStorage.setItem('waypointNames', JSON.stringify(waypointNames));
        
        updateAddressList();
        drawRoute();
    }

    function limpiarTodo() {
        // Remover marcadores del mapa y limpiar el array
        markers.forEach(marker => marker.remove());
        markers = [];
    
        // Remover todos los polígonos del mapa
        polygonLayers.forEach(layer => {
            if (map.hasLayer(layer)) {
                map.removeLayer(layer);
            }
        });
        polygonLayers = [];
    
        // Limpiar waypoints y nombres de waypoints
        waypoints = [];
        waypointNames = [];
        localStorage.removeItem('waypoints');
        localStorage.removeItem('waypointNames');
    
        // Limpiar la lista visual en la interfaz de usuario
        var addressList = document.getElementById('addressList');
        if (addressList) {
            addressList.innerHTML = '';
        }
    
        // Si hay capas de ruta, también limpiarlas
        routeLayers.forEach(layer => map.removeLayer(layer));
        routeLayers = [];
    }

    function drawRoute() {
        if (waypoints.length < 2) {
            console.log("No hay suficientes waypoints para trazar una ruta.");
            return;
        }
    
        routeLayers.forEach(layer => map.removeLayer(layer)); // Limpiar las capas anteriores
        routeLayers = [];
    
        // Iterar sobre los waypoints y trazar la ruta entre cada par consecutivo
        for (let i = 0; i < waypoints.length - 1; i++) {
            let start = waypoints[i];
            let end = waypoints[i + 1];
            drawSegment(start, end);
        }
    }
    
    function drawSegment(start, end) {
        const coordinates = [start, end].map(point => [point[1], point[0]]);
        const url = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';
    
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': '5b3ce3597851110001cf6248fb92c2050b27472ba542a828a1334e31'
            },
            body: JSON.stringify({coordinates: coordinates})
        }).then(response => response.json()).then(data => {
            const feature = data.features[0]; // Solo debería haber una característica para un segmento
            let distance = feature.properties.summary.distance;
            let color = getColorBasedOnDistance(distance);
            console.log(`Dibujando línea desde ${coordinates[0]} a ${coordinates[1]}: ${distance} metros, color ${color}`);
    
            let polyline = L.polyline(feature.geometry.coordinates.map(coord => [coord[1], coord[0]]), {color: color, weight: 5});
            polyline.addTo(map);
            routeLayers.push(polyline);
        }).catch(error => console.error('Error al solicitar la ruta:', error));
    }
    
    function getColorBasedOnDistance(distance) {
        if (distance > 4000) return 'red';
        else if (distance > 2000) return 'yellow';
        return 'green';
    }
    
    
    
});
