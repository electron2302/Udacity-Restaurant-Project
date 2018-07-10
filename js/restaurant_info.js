let restaurant;
var newMap;
var test;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  DBHelper.fetchAllRestaurants()
  initMap();
});

/**
 * Initialize Google map
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} 

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}
 
/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  var starType; 
  if(restaurant.is_favorite == "true"){starType = "star";}
  else{starType = "star_border";}
  const star = `<i id="is_favorite_icon" class="material-icons" onclick="change_favorite(this)" >${starType}</i>`;
  name.innerHTML = star + restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.alt = DBHelper.imageAltTextForRestaurant(restaurant);
  const ImageUrl = DBHelper.imageUrlForRestaurant(restaurant);
  image.src = ImageUrl+"-600.jpg"; /* sub optimal i know but this way it is sipler for the servicworker*/
  /*
  image.srcset = ImageUrlParts[0]+"-800."+ImageUrlParts[1]+" 800w, ";
  image.srcset = image.srcset + ImageUrlParts[0]+"-600."+ImageUrlParts[1]+" 600w, ";
  image.srcset = image.srcset + ImageUrlParts[0]+"-400."+ImageUrlParts[1]+" 400w";
  image.sizes = "somthing";*/

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = () => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);
  
  //console.log(restaurant.id);
  const dbPromise = DBHelper.OpenIDB();
  dbPromise.then(function(db) {
    var tx = db.transaction('reviews');
    var reviewsStore = tx.objectStore('reviews');
    var restaurantIdIndex = reviewsStore.index('restaurantId');
    return restaurantIdIndex.getAll(parseInt(self.restaurant.id));
  }).then(function(reviews) {
    console.log(reviews);
    if (!reviews) {
      const noReviews = document.createElement('p');
      noReviews.innerHTML = 'No reviews yet!';
      container.appendChild(noReviews);
      return;
    }
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
      ul.appendChild(createReviewHTML(review));
    });
    ul.appendChild(createReviewForm());
    container.appendChild(ul);
  }).catch(function(error) {
    console.error(error);
  });
    
}

clearReviewsHTML = () => {
  const container = document.getElementById('reviews-container');
  container.innerHTML = `<ul id="reviews-list"></ul>`;
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.classList.add('name');
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
  date.classList.add('date');
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.classList.add('rating');
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.classList.add('comments');
  li.appendChild(comments);

  return li;
}

createReviewForm = () => {
  const li = document.createElement('li'); //action="http://localhost:9999"
  li.innerHTML = `
  <form onsubmit="onReviewSubmisson(this)" action="javascript:void(0);" method="POST" id="AddReviewForm">
    <label>Name:
      <input type="text" name="name" placeholder="Your Name">
    </label>
    <br>
    <label>Rating:
      <input type="number" name="rating" min="0" max="5" step="1">
    </label>
    <br>
    <label>Comments:
      <textarea name="comments" form="AddReviewForm"></textarea>
    </label>
    <br>
    <button type="submit">Add Review</button>
  </form>`;

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

change_favorite = (data) => {

  tets = data;

  var value = data.innerText

  if(value == "star_border"){
    data.innerText = "star";
    change_favorite_DB("true");
    change_favorite_IDB("true");
  }
  else if(value == "star"){
    data.innerText = "star_border";
    change_favorite_DB("false");
    change_favorite_IDB("false");
  }
  else{console.error("star_border or star was expected")}

}

change_favorite_IDB = (Bdata) =>{
  const dbPromise = DBHelper.OpenIDB();
  dbPromise.then(function(db) {
    var tx = db.transaction('restaurants', 'readwrite');
    var restaurantsStrore = tx.objectStore('restaurants');
    return restaurantsStrore.openCursor();
  }).then(function CursorRestaurants(cursor){
    if(!cursor || cursor.value.id > parseInt(self.restaurant.id)) return;
    if(cursor.value.id < parseInt(self.restaurant.id)) return cursor.continue().then(CursorRestaurants);

    if(cursor.value.id == parseInt(self.restaurant.id)){
      var updateData = cursor.value;
      updateData.is_favorite = Bdata;
      cursor.update(updateData)
      .then(() =>{
        console.log("resturant with ID " + self.restaurant.id + " is_favorite was set to " + Bdata)
        return;
      });
    }
    else{console.error("this should never be able to run")}
  
  }).then(function() {
    console.log('Done Cursoring for changing is_favorite');
  })
  .catch(function(error) {
    console.error(error)
  });
}

change_favorite_DB = (data) =>{

  fetch(`http://localhost:1337/restaurants/${self.restaurant.id}/?is_favorite=${data}`, {
    method: "PUT",
    credentials: "include", // just to be shure, i have seen there is an cookie for sails or somthing like that 
    cache: "no-cache", // just to be save, because this gets send with forms nativly, and i wnt to mimike that as close as posible
  })
  .then(response => console.log("put request successful"))
  .catch(error => console.error(error));
}

/*////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////cut

AddReviewDierectlyToIDBandUpdateUI = (Data) =>{
  const dbPromise = DBHelper.OpenIDB();
  dbPromise.then(function(db) {
    var tx = db.transaction('reviews', 'readwrite');
    var reviewsStrore = tx.objectStore('reviews');
    
    reviewsStrore.put(Data);
    return tx.complete;
  }).then(function() {
    console.log('it worked');
    clearReviewsHTML();
    fillReviewsHTML();
  })
}

SaveAndSendLater = (Data) =>{
  
  Data.id = Math.floor(Math.random() * 101) * (-1); // i give it a negativ random int on purpose

  const dbPromise = DBHelper.OpenIDB();
  dbPromise.then(function(db) {
    var tx = db.transaction('reviews', 'readwrite');
    var reviewsStrore = tx.objectStore('reviews');
    
    reviewsStrore.put(Data);
    return tx.complete;
  }).then(function() {
    console.log('it worked for now');
    clearReviewsHTML();
    fillReviewsHTML();
  })
}

AddReview = (form) => {

  const Data = {
    "restaurant_id": parseInt(self.restaurant.id),
    "name": form["name"].value,
    "rating": parseInt(form["rating"].value),
    "comments": form["comments"].value
  };

  fetch("http://localhost:1337/reviews/", {
    method: "POST",
    credentials: "include", // just to be shure, i have seen there is an cookie for sails or somthing like that 
    cache: "no-cache", // just to be save, because this gets send with forms nativly, and i wnt to mimike that as close as posible
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(Data),
  })
  .then(response => response.json())
  .then(function(jResponse) {
    AddReviewDierectlyToIDBandUpdateUI(jResponse);
  })
  .catch(function(error) {
    console.error(error);
    SaveAndSendLater(Data)
  });

}
*/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////cut 
function onReviewSubmisson(form){
  const Data = {
      "restaurant_id": parseInt(self.restaurant.id),
      "name": form["name"].value,
      "rating": parseInt(form["rating"].value),
      "comments": form["comments"].value
  };
  addReviewToDBtemporarily(Data)
  .then(console.log("This runs"))
  .then(() => navigator.serviceWorker.ready) // like in https://youtu.be/cmGr0RszHc8?t=40m42s wy is it not working
  .then((reg) => {
    console.log('A service worker is active:'); // This never runs
    reg.sync.register('send-review');
    console.log("reg.sync.register('send-review') send :)");
  })
  .catch(error => console.error('onReviewSubmisson Faild: ' + error));
}

addReviewToDBtemporarily = (Data) =>{
  
  Data.id = Math.floor(Math.random() * 101) * (-1); // i give it a negativ random int on purpose

  const dbPromise = DBHelper.OpenIDB();
  return dbPromise.then(function(db) {
    var tx = db.transaction('reviews', 'readwrite');
    var reviewsStrore = tx.objectStore('reviews');
    
    reviewsStrore.put(Data);
    return tx.complete;
  }).then(function() {
    console.log('addToDBtemporarily ran');
    clearReviewsHTML();
    fillReviewsHTML();
  })
}