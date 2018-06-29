/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static OpenIDB(){
    return idb.open('RestaurantReviewsProject', 1, function(upgradeDb) {
      switch (upgradeDb.oldVersion) { // switch case intentionally without break !
        case 0:
            var restaurantStore = upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
            restaurantStore.createIndex('neighborhood', 'neighborhood');
            restaurantStore.createIndex('cuisine', 'cuisine_type');
      }
    }); 
  }

  static fetchAllRestaurants() {
    fetch(DBHelper.DATABASE_URL)
    .then(response => response.json())
    .then(function(restaurants) {
      const dbPromise = DBHelper.OpenIDB();
      dbPromise.then(function(db) {
          var tx = db.transaction('restaurants', 'readwrite');
          var restaurantsStore = tx.objectStore('restaurants');

          restaurants.forEach(restaurant => {
            restaurantsStore.put(restaurant);
          });

          return tx.complete;
      }).then(function() {
        console.log('AllRestaurants in DB create or updatet')
      });
    })
    .catch(e => console.log(e));
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) { ///////////////////////////////////////////////////////////////////////////////
    // fetch all restaurants with proper error handling.
    const dbPromise = DBHelper.OpenIDB();
    dbPromise.then(function(db) {
      var tx = db.transaction('restaurants');
      var restaurantsStore = tx.objectStore('restaurants');
      return restaurantsStore.get(parseInt(id));
    }).then(function(results) {
      console.log(results);
      callback(null, results);
    }).catch(function(error) {
      callback(error, null);
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    const dbPromise = DBHelper.OpenIDB();
    dbPromise.then(function(db) {
      var tx = db.transaction('restaurants');
      var restaurantsStore = tx.objectStore('restaurants');
      var cuisineIndex = restaurantsStore.index('cuisine');
      return cuisineIndex.get(cuisine);
    }).then(function(results) {
        callback(null, results);
    }).catch(function(error) {
      callback(error, null);
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    const dbPromise = DBHelper.OpenIDB();
    dbPromise.then(function(db) {
      var tx = db.transaction('restaurants');
      var restaurantsStore = tx.objectStore('restaurants');
      var neighborhoodIndex = restaurantsStore.index('neighborhood');
      return neighborhoodIndex.get(neighborhood);
    }).then(function(results) {
        callback(null, results);
    }).catch(function(error) {
      callback(error, null);
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    var results = [];
    const dbPromise = DBHelper.OpenIDB();
    dbPromise.then(function(db) {
      var tx = db.transaction('restaurants');
      var restaurantsStore = tx.objectStore('restaurants');
  
      return restaurantsStore.openCursor();
    }).then(function CursorRestaurants(cursor){
      if(!cursor) return; // in case it should be undefined (no items in list)

      if((cursor.value.neighborhood == neighborhood || neighborhood == "all") && (cursor.value.cuisine == cuisine || cuisine == "all" )){
        results.push(cursor.value);
      }
      //console.log('cursor value:',cursor.value);
      return cursor.continue().then(CursorRestaurants); // continuous loop til end of the list, because then cursor will be undefined
  
    }).then(function() {
      callback(null, results);
      //console.log('Done Cursoring');
    })
    .catch(function(error) {
      callback(error, null);
    });
    
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    var uniqueNeighborhoods = [];
    var oldNeighborhoods = "";
    const dbPromise = DBHelper.OpenIDB();
    dbPromise.then(function(db) {
      var tx = db.transaction('restaurants');
      var restaurantsStore = tx.objectStore('restaurants');
      var neighborhoodIndex = restaurantsStore.index('neighborhood');
  
      return neighborhoodIndex.openCursor();
    }).then(function CursorRestaurants(cursor){
      if(!cursor) return; // in case it should be undefined (no items in list)

      if(cursor.value.neighborhood != oldNeighborhoods){
        uniqueNeighborhoods.push(cursor.value.neighborhood);
        oldNeighborhoods = cursor.value.neighborhood;
        console.log('cursor value:',cursor.value.neighborhood);
      }
      return cursor.continue().then(CursorRestaurants); // continuous loop til end of the list, because then cursor will be undefined
  
    }).then(function() {
      callback(null, uniqueNeighborhoods);
      //console.log('Done Cursoring');
    })
    .catch(function(error) {
      callback(error, null);
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    var uniqueCuisines = [];
    var oldCuisines = "";
    const dbPromise = DBHelper.OpenIDB();
    dbPromise.then(function(db) {
      var tx = db.transaction('restaurants');
      var restaurantsStore = tx.objectStore('restaurants');
      var cuisineIndex = restaurantsStore.index('cuisine');
  
      return cuisineIndex.openCursor();
    }).then(function CursorRestaurants(cursor){
      if(!cursor) return; // in case it should be undefined (no items in list)

      if(cursor.value.cuisine_type != oldCuisines){
        uniqueCuisines.push(cursor.value.cuisine_type);
        oldCuisines = cursor.value.cuisine_type;
        console.log('cursor value:',cursor.value.cuisine_type);
      }
      return cursor.continue().then(CursorRestaurants); // continuous loop til end of the list, because then cursor will be undefined
  
    }).then(function() {
      callback(null, uniqueCuisines);
      //console.log('Done Cursoring');
    })
    .catch(function(error) {
      callback(error, null);
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}`);
  }

  static imageAltTextForRestaurant(restaurant){
    return("ImgAltText atribute missing in sails db untli now "); // """"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
  }

  static h1Id(restaurant) {
    return (`restaurantNr${restaurant.id}`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}

// i register the ServiceWorker in this js file because this file is loaded in both pages 

function RegisterServiceWorker(){
  if(!navigator.serviceWorker) return; //catch for older browsers

  navigator.serviceWorker.register('sw.js').then(function(){
    console.log("RegisterServiceWorker worked");
  }).catch(function() {
    console.log("RegisterServiceWorker faild");
  });
}

RegisterServiceWorker();