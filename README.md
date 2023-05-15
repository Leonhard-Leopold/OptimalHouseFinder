# OptimalHouseFinder
Finding the optimal place to build a house based on regularly visited locations - using SGD

## How to use
- You need to enter your Google Maps API key. The Distance API needs to be enabled.
- Enter frequently visited locations by clicking on the Map. You can name these places and enter the number of weekly visits. 
- Save or load these locations for later usage in a JSON file.
- The center can be set manually. The time and distance to all the selected locations is calculated. 
- Stochastic Gradient Descent is used to find the optimal center that minimizes the distance to all selected locations. Three different distance measurements can be used. (Air distance, Distance when using roads, Time when using roads). The latter two options require the Google Maps Distance API. This can result in costs when used repeatably. 
 
This will find you the optimal place to build your house!

Have fun :)
