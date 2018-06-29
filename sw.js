var CurrentCacheName = "static-v4";

self.addEventListener('install',function(event) {
    event.waitUntil(
        caches.open(CurrentCacheName).then(function(cache) {
            return cache.addAll([
                '/',
                'css/styles.css',
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
    eval.waitUntil(
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

//