function get_total_direct_distance(center, locations) {
        let total_distance = [0, 0];
        for (let j = 0; j < locations.length; j++) {
            total_distance[0] += locations[j].visits * ((center["lat"] - locations[j]["lat"])**2);
            total_distance[1] += locations[j].visits * ((center["lng"] - locations[j]["lng"])**2);
        }
        return total_distance;
}


function get_distance_promise(metric, visits, origin, destination) {
    var request = {
        origin: origin,
        destination: destination,
        travelMode: google.maps.DirectionsTravelMode.DRIVING
    };
    return new Promise((resolve, reject) => {
        directionsService.route(request, function(response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
               if (metric == "time"){
                  let x =  visits * response.routes[0].legs[0].duration.value;
                  resolve(x);
               }
               else if (metric == "distance"){
                  let x =  visits * response.routes[0].legs[0].distance.value;
                  resolve(x);
               }
            }else{
                reject(0);
            }
        });
    });
}

async function get_total_map_distance(center, locations, metric) {
        let promises = [];
        for (let j = 0; j < locations.length; j++) {
            promises.push(get_distance_promise(metric, locations[j].visits, {lat:center["lat"], lng: center["lng"]}, {lat:locations[j]["lat"], lng: locations[j]["lng"]}));
        }
        return Promise.all(promises);
}


async function get_distance(metric, center, locations){
    if (metric == "direct"){
        return get_total_direct_distance(center, locations);
    }
    else if (metric == "time"){
        const results = await get_total_map_distance(center, locations, metric);
        return results.reduce((a, b) => a + b, 0);
    }
    else if (metric == "distance"){
        const results = await get_total_map_distance(center, locations, metric);
        return results.reduce((a, b) => a + b, 0);
    }
}


async function get_optimal_center(locations, metric, debug=false, iterations=5, learning_rate=1, learning_rate_change=0.97, termination_distance = 0.000001) {
    console.log("locations", locations);
    console.log("settings", iterations, learning_rate, learning_rate_change, termination_distance)
    var previous_distance = metric=="direct" ? [9999, 9999] : 9999;
    //var center = { lat: 0.0, lng: 0.0 };
    var center;
    var best_center;
    var best_center_distance = previous_distance = metric=="direct" ? [9999999, 9999999] : 9999999;

    var random_distance = 0.1;
    var random_distance_decay = 0.95;

    var avg_lat = 0;
    var avg_lng = 0;
    for (let j = 0; j < locations.length; j++) {
        avg_lat += locations[j]["lat"];
        avg_lng += locations[j]["lng"];
    }
    console.log("Lat Average:", avg_lat/locations.length);
    console.log("Lng Average:",avg_lng/locations.length);

    // add_debug_tooltip((avg_lat/locations.length), (avg_lng/locations.length), "Geographical Center", bounce=true);

    if(debug == true){
        locations = [
            { id: 0, lat: 0, lng: 0 },
            { id: 1, lat: 1, lng: 1 },
            { id: 2, lat: 0, lng: 1 },
            { id: 3, lat: 1, lng: 0 }
        ]
        center = JSON.parse(JSON.stringify(locations[0]));
        var scaling = 250;
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        var avg_lat = 0;
        var avg_lng = 0;
        for (let j = 0; j < locations.length; j++) {
            ctx.fillRect(locations[j]["lat"]*scaling, locations[j]["lng"]*scaling,3,3);
            avg_lat += locations[j]["lat"];
            avg_lng += locations[j]["lng"];
        }
        ctx.strokeStyle = "#00FF00";
        console.log("Lat Average:", avg_lat/locations.length);
        ctx.beginPath(avg_lat/locations.length);
        ctx.moveTo(avg_lat/locations.length * scaling , 0);
        ctx.lineTo(avg_lat/locations.length * scaling, 500);
        ctx.stroke();

        console.log("Lng Average:",avg_lng/locations.length);
        ctx.beginPath(avg_lng/locations.length);
        ctx.moveTo(0, avg_lng/locations.length * scaling);
        ctx.lineTo(500, avg_lng/locations.length * scaling);
        ctx.stroke();

        ctx.fillStyle = "#FF0000";
        ctx.strokeStyle = "#FF0000";
    }

    center = JSON.parse(JSON.stringify(locations[0]));

    console.log("start", center, locations)

    for (let i = 0; i < iterations; i++) {

        const current_distance = await get_distance(metric, center, locations);

        console.log((metric == "direct" ? Math.sqrt(current_distance[0]**2+current_distance[1]**2) : current_distance) , "<" , (metric == "direct" ? Math.sqrt(best_center_distance[0]**2+best_center_distance[1]**2) : best_center_distance),
        (metric == "direct" ? Math.sqrt(current_distance[0]**2+current_distance[1]**2) : current_distance)  < (metric == "direct" ? Math.sqrt(best_center_distance[0]**2+best_center_distance[1]**2) : best_center_distance));
        if( (metric == "direct" ? Math.sqrt(current_distance[0]**2+current_distance[1]**2) : current_distance) <  (metric == "direct" ? Math.sqrt(best_center_distance[0]**2+best_center_distance[1]**2) : best_center_distance)){
            console.log("NEW BEST CENTER - iteration",i, " - distance: ", (metric == "direct" ? Math.sqrt(current_distance[0]**2+current_distance[1]**2) : current_distance) );
            best_center = JSON.parse(JSON.stringify(center));
            best_center_distance = current_distance;
        }

        // add_debug_tooltip(center["lat"], center["lng"], "Iteration: "+i+" \n Distance: " + current_distance);

        console.log(current_distance, previous_distance);
        distance_change = metric=="direct" ? Math.abs(previous_distance[0] - current_distance[0]) + Math.abs(previous_distance[1] - current_distance[1]) : Math.abs(previous_distance - current_distance) ;
        console.log("Iteration", i, "- Distance Change:", distance_change)
        if(distance_change < termination_distance || (i == iterations-1)){
            console.log("Algorithm terminated!");
            return best_center;
        }

        if(debug == true){
            ctx.beginPath();
            ctx.moveTo(center["lat"] * scaling, center["lng"] * scaling);
        }

        test_center = JSON.parse(JSON.stringify(center));
        let rand_dif = (Math.random()-0.5) * random_distance;
        test_center["lat"] += rand_dif
        let rand_dif_lng = (Math.random()-0.5) * random_distance;
        test_center["lng"] += rand_dif_lng
        const test_distance = await get_distance(metric, test_center, locations);

       //add_debug_tooltip(test_center["lat"], test_center["lng"], "TEST - Iteration: "+i+" \n Distance: " + test_distance);

        console.log("center:", center, "- current_distance", current_distance);
        console.log("rand_dif:", rand_dif);
        console.log("test_center:", test_center["lat"], "- test_distance:", test_distance);
        console.log("sign:",(Math.sign(test_center["lat"] - center["lat"])))
        console.log("Random distance change:", (current_distance - test_distance))

        center["lat"] = center["lat"] + (Math.sign(test_center["lat"] - center["lat"]) * learning_rate * (metric=="direct" ? (current_distance[0] - test_distance[0]) : current_distance - test_distance))
        center["lng"] = center["lng"] + (Math.sign(test_center["lng"] - center["lng"]) * learning_rate * (metric=="direct" ? (current_distance[1] - test_distance[1]) : current_distance - test_distance))



        console.log("center after change!", center);

        if(debug == true){
            ctx.lineTo(center["lat"] * scaling, center["lng"] * scaling);
            ctx.stroke();
        }

        previous_distance = current_distance;
        learning_rate = learning_rate * learning_rate_change;
        random_distance = random_distance * random_distance_decay;

    }

}
