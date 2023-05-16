

function delete_location(id){
    for(let i = 0; i < locations.length; i ++){
      if(locations[i]["id"] == id){
        locations.splice(i, 1);
        tooltips[i].setMap(null);
        tooltips.splice(i, 1);
        routes[i].setMap(null);
        routes.splice(i, 1);
      }
    }
    displayTable();
}

function add_debug_tooltip(lat, lng, text, bounce=false){
       if (bounce == true){
            var mk_new = new google.maps.Marker({position: {lat:lat, lng: lng}, map: map, animation:google.maps.Animation.BOUNCE});
       }
       else{
            var mk_new = new google.maps.Marker({position: {lat:lat, lng: lng}, map: map});
       }
       var infowindow = new google.maps.InfoWindow({content: text});
        infowindow.open(map,mk_new);
}


function changeSetCenter(checkbox){
    setCenter = checkbox.checked;
}

function distance_to_string(distance){
    return (distance > 1000 ? (distance / 1000).toFixed(2) + " km" :  distance + " m");
}
function time_to_string(time){
  var date = new Date(0);
  date.setSeconds(time);
  if (date.getHours()==1){
    return date.getMinutes() + " min";
  }
  else{
    return  (date.getHours()-1) + " h " + date.getMinutes() + " min";
  }
}

function reset(){
     for (let i = locations.length-1; i >= 0; i--){
        delete_location(locations[i].id);
     }
    displayTable();
}

function update_value(event, id, type){
    for(let i = 0; i < locations.length; i ++){
      if(locations[i]["id"] == id){
        locations[i][type] = event.value;
      }
    }
    if(type=="visits"){
        displaySummary();
    }
}

function displayTable(){
  if (locations.length == 0){
    html = "<div>--- No Locations ---</div>";
    document.getElementById("dash_table").innerHTML = html;
  }
  else{
      var html = "<table><tr><th>Name</th><th>Time</th><th>Distance</th><th>Visits per week</th><th>Actions</th></tr>";
      for (let i = 0; i < locations.length; i++){
      html += "<tr><td><input onkeyup='update_value(this, "+locations[i].id+", \"name\")' value='"+locations[i].name+"'/></td><td><label>"+time_to_string(locations[i].time)+"</label></td><td><label>"
      +distance_to_string(locations[i].distance)+"</label></td><td><input onkeyup='update_value(this, "+locations[i].id+", \"visits\")' value='"+locations[i].visits+
      "'/></td><td><button onclick='delete_location("+locations[i].id+")'>x</button></td></tr>";
      }
      html = html + "</table><span class='summary'></span>";
      document.getElementById("dash_table").innerHTML = html;
      displaySummary();
  }
}

function addToast(text, time){
    var toast_wrapper = document.getElementById("toast_wrapper");
    const toast = document.createElement("div");
    const newContent = document.createTextNode(text);
    toast.appendChild(newContent);
    toast_wrapper.appendChild(toast);


    setTimeout(function(){
        toast.style.right = 0;
        setTimeout(function(){
            toast.style.right = "-400px";
            setTimeout(function(){
                toast.remove();
            }, 500);
        }, time);
    }, 0);
}


function displaySummary(){

      var total_time = 0;
      var total_distance = 0;
      var weekly_total_time = 0;
      var weekly_total_distance = 0;
      for (let i = 0; i < locations.length; i++){
          total_time += locations[i].time;
          total_distance += locations[i].distance;
          weekly_total_time += (locations[i].visits * locations[i].time);
          weekly_total_distance += (locations[i].visits * locations[i].distance);
      }
    document.getElementsByClassName("summary")[0].innerHTML = "Total Time: "+ time_to_string(total_time)
    + " - Total Distance: " + distance_to_string(total_distance) + "<br/> Total Time: "+ time_to_string(weekly_total_time)
    + " - Total Distance: " + distance_to_string(weekly_total_distance)+" (Weekly Sum)";
}


async function save(){
  const handle = await showSaveFilePicker({suggestedName: "locations.json", types: [
                                                {
                                                  accept: { "application/json": [".json"] },
                                                },
                                              ],
                                            });
  const writer = await handle.createWritable()
  await writer.write(JSON.stringify(locations))
  await writer.close()
  addToast("Locations saved...", 1000);
}

async function load(){
const pickerOpts = {
    types: [
      {
        description: "Json Location File",
        accept: {
          "application/json": [".json"],
        },
      },
    ],
    excludeAcceptAllOption: true,
    multiple: false,
  };
  const [fileHandle] = await window.showOpenFilePicker(pickerOpts);
  const fileData = await fileHandle.getFile();
  let read = new FileReader();
  read.readAsText(fileData);
  read.onloadend = function(){
      reset();
      let loaded_locations = JSON.parse(""+read.result);
      for (let i = 0; i < loaded_locations.length; i++){
        add_location(loaded_locations[i].lat, loaded_locations[i].lng, name=loaded_locations[i].name, visits=loaded_locations[i].visits );
      }
      displayTable();
      addToast("Locations loaded...", 1000);
  }
}

async function getNewFileHandle() {
   const opts = {
     types: [
       {
         description: "Locations Json File",
         accept: { "text/plain": [".json"] },
       },
     ],
   };
   return await window.showSaveFilePicker(opts);
 }

