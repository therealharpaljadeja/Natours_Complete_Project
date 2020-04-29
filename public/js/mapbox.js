

export const displayMap = (locations) => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiaGoxNTA5IiwiYSI6ImNrOWNyNjB3bzA2NXQzbG5tbXJ3b2l3azEifQ.ovDjDk8HGR0ioUs131-djQ';
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/hj1509/ck9d28l8714qt1ipqy95d9ll3',
        scrollZoom: false
        // center: [-118.113491, 34.111745],
        // zoom: 10,
        // interactive: false
    });
    
    const bounds = new mapboxgl.LngLatBounds();
    
    locations.forEach(location => {
        
        const el = document.createElement('div');
        el.className = 'marker';
    
        // Add Marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom'
        }).setLngLat(location.coordinates).addTo(map);
    
        new mapboxgl.Popup({ offset: 30 }).setLngLat(location.coordinates).setHTML(`<p>Day ${location.day}: ${location.description}</p>`).addTo(map);
    
        bounds.extend(location.coordinates);
    })
    
    
    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100
        }
    });
}

