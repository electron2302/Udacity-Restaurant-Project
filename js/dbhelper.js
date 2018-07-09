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
    return `http://localhost:${port}/`;
  }

  static OpenIDB(){
    return idb.open('RestaurantReviewsProject', 2, function(upgradeDb) {
      switch (upgradeDb.oldVersion) { // switch case intentionally without break !
        case 0:
            var restaurantStore = upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
            restaurantStore.createIndex('neighborhood', 'neighborhood');
            restaurantStore.createIndex('cuisine', 'cuisine_type');
        case 1:
            var reviewStore = upgradeDb.createObjectStore('reviews', {keyPath: 'id'});
            reviewStore.createIndex('restaurantId', 'restaurant_id');
      }
    }); 
  }

  static fetchAllRestaurants() {
    fetch(DBHelper.DATABASE_URL + "restaurants/")
    .then(response => response.json())
    .then(function(restaurants) {
      const dbPromise = DBHelper.OpenIDB();
      dbPromise.then(function(db) {
          var tx = db.transaction('restaurants', 'readwrite');
          var restaurantsStore = tx.objectStore('restaurants');

          restaurants.forEach(restaurant => {
            restaurantsStore.put(restaurant);
            DBHelper.fetchAllReviews(restaurant.id); //I'm assuming that this isn't the best option because This is not very scalable but in this case there is no option to add more restaurant so I think it should be fine
          });

          return tx.complete;
      }).then(function() {
        console.log('All Restaurants in DB create or updatet')
      });
    })
    .catch(e => console.log(e));
    //DBHelper.fetchAllReviews();         doesnt wor that way because of that stupid sails Limit
    DBHelper.checkForUploadableDatabaseEntries();
  }

  static fetchAllReviews(id) {
    if(id){id = "?restaurant_id=" + id}
    fetch(DBHelper.DATABASE_URL + "reviews/" +id)
    .then(response => response.json())
    .then(function(reviews) {
      const dbPromise = DBHelper.OpenIDB();
      dbPromise.then(function(db) {
          var tx = db.transaction('reviews', 'readwrite');
          var reviewsStore = tx.objectStore('reviews');

          reviews.forEach(review => {
            reviewsStore.put(review);
          });

          return tx.complete;
      }).then(function() {
        console.log('All Reviews in DB create or updatet' )
      });
    })
    .catch(e => console.log(e));
  }

  static checkForUploadableDatabaseEntries(){
    const dbPromise = DBHelper.OpenIDB();
    dbPromise.then(function(db) {
      var tx = db.transaction('reviews', 'readwrite');
      var reviewsStore = tx.objectStore('reviews');
  
      return reviewsStore.openCursor();
    }).then(function CursorReviews(cursor){
      if(!cursor || cursor.value.id > 0) return; 

      console.log('try uploading:',cursor.value.id);

      var oldData = cursor.value;

      delete oldData.id;

      DBHelper.tryUploading(oldData, (newData) =>{
        console.log("calbalck was trigert");
        if(newData){
          cursor.update(newData)
          .then(function() {
            console.log("cursor.update worked ! woohu");
            return cursor.continue().then(CursorReviews);
          })
          .catch(error => console.error("cursor.update faild" + error));
        }
        else{console.error("TryUploading Callbak Faild");}
      });
  
    }).then(function() {
      console.log('Done Cursoring the upload');
    })
    .catch(function(error) {
      console.error(error)
    });
  }

  static tryUploading(data, callback){
    fetch("http://localhost:1337/reviews/", {
      method: "POST",
      credentials: "include", // just to be shure, i have seen there is an cookie for sails or somthing like that 
      cache: "no-cache", // just to be save, because this gets send with forms nativly, and i wnt to mimike that as close as posible
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(function(jResponse) {
      console.log(jResponse);
      callback(jResponse);
    })
    .catch(function(error) {
      console.error("couldn't upload" + error)
      callback(null);
    });
  }


  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
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
    if(restaurant.photograph){
      return (`/img/${restaurant.photograph}`);
    };
    return (`/img/stock`);
  }

  

  static imageAltTextForRestaurant(restaurant){
    if(restaurant.ImgAltText){
      return(restaurant.ImgAltText);
    }
    let ImgAltText = "Picture of ";
    if(restaurant.cuisine_type){ImgAltText = ImgAltText + restaurant.cuisine_type + " ";}
    ImgAltText += "Restaurant"
    if(restaurant.neighborhood){ImgAltText = ImgAltText + " in " + restaurant.neighborhood;}
    return(ImgAltText); 
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

//RegisterServiceWorker();