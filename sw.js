var CurrentCacheName = "static-v5";

importScripts('js/idb.js');

OpenIDB = () =>{
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

self.addEventListener('install',function(event) {
    event.waitUntil(
        caches.open(CurrentCacheName).then(function(cache) {
            return cache.addAll([
                '/',
                'css/stylesP1.css',
                'css/stylesP2.css',
                '/restaurant.html',
                'img/1-600.jpg',
                'img/2-600.jpg',
                'img/3-600.jpg',
                'img/4-600.jpg',
                'img/5-600.jpg',
                'img/6-600.jpg',
                'img/7-600.jpg',
                'img/8-600.jpg', 
                'img/9-600.jpg',
                'img/10-600.jpg',
                'img/stock-600.jpg',
                'js/idb.js',
                'js/dbhelper.js',
                'js/main.js',
                'js/restaurant_info.js',
                'manifest.json'
            ]);
        })
    );
});

self.addEventListener('activate', function(event) {
    console.log("SW activated");
    event.waitUntil(
        caches.keys().then(function(CacheNames) {
            return Promise.all(
                CacheNames.filter(function(CacheName) {
                    return CacheName != CurrentCacheName;
                }).map(function(CacheName) {
                    return caches.delete(CacheName);
                })
            );
        })
    );
})

self.addEventListener('fetch', function(event) {
    //console.log(event);

    if(event.request.url.includes("restaurant.html")){
        console.log("yay");
        event.respondWith(caches.match('/restaurant.html'));
        return;
    }
    event.respondWith(
        caches.match(event.request).then(function(responds) {
            if (responds) return  responds;

            //console.log(event.request);
            return fetch(event.request);
        })
    )
});

self.addEventListener('sync', event => {
    console.log("sw sync event fiered: " + event.tag);
    if(event.tag == 'send-review'){
        event.waitUntil(
            getTemporarilyReviewsFromDB().then(Reviews => {
                return sendReviewsToServer(Reviews)
                .then(()=> removeTemporarilyReviewsFromDB(Reviews));
            })
        );
    }
});

getTemporarilyReviewsFromDB = () => {
    return new Promise(function(resolve, reject) {
        var Reviews = [];
        const dbPromise = OpenIDB();
        dbPromise.then(function(db) {
        return db.transaction('reviews', 'readwrite').objectStore('reviews').openCursor();
        }).then(function CursorReviews(cursor){
        if(!cursor || cursor.value.id > 0) return;

        console.log('found TemporarilyReview id:',cursor.value.id);

        var Review = cursor.value;
        delete Review.id;

        Reviews.push(Review)

        return cursor.continue().then(CursorReviews);

        })
        .catch(function(error) {
            reject (error)
        });
        resolve(Reviews);
    });
};

sendReviewsToServer = (Reviews) => {
    var SenerFunktions = [];

    for(var i = 0; i < Reviews.length; i++){
        SenerFunktions.push(sendReviewToServer(Reviews[i]))
        console.log("sendReviewToServer was pushed with review: " + Reviews[i]);
    };

    Promise.all(SenerFunktions);
};

sendReviewToServer = (Review) => {
    return fetch("http://localhost:1337/reviews/", {
        method: "POST",
        credentials: "include", // just to be shure, i have seen there is an cookie for sails or somthing like that 
        cache: "no-cache", // just to be save, because this gets send with forms nativly, and i wnt to mimike that as close as posible
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify(Review),
    });
};

removeReviewsFromDB = (Reviews) =>{
    var DellFunktions = [];

    for(var i = 0; i < Reviews.length; i++){
        DellFunktions.push(removeReviewFromDB(Reviews[i]))
        console.log("removeReviewFromDB was pushed with review: " + Reviews[i]);
    };

    Promise.all(DellFunktions);
};

removeReviewFromDB = (Review) =>{
    return new Promise(function(resolve, reject) {
        const dbPromise = OpenIDB();
        return dbPromise.then(function(db) {
        return db.transaction('reviews', 'readwrite').objectStore('reviews').openCursor();
        }).then(function CursorReviews(cursor){
        if(!cursor) return; 
        if(cursor.value.id != Review.id){
            return cursor.continue(Review.id).then(CursorReviews);
        }
        if(cursor.value.id == Review.id){
            cursor.delete();
            return
        }
        console.error('This should never run');
        })
        .catch(function(error) {
        console.error(error)
        });
    });
};