
window.vueapp = new Vue({
    el: '#app',
    data: {
        products: [],      
        cart: [],
        search: {query: '', count: 0, brands: [], prods: []},
        showSearch: false,
        listView: false,
        gridView: true,
        sorting: 'price',
        searchTimeout: null,
        filters: {},
        availableBrands: ['LG', 'Apple', 'Asus', 'Samsung', 'Huawei', 'Sony', 'Motorola', 'Alcatel', 'HP', 'Lenovo'],
        availableFilters: {
            os: { name: 'Besturingssysteem', values: ['Android', 'IOS', 'Windows'] }, 
            color: { name: 'Kleur', values: ['Wit', 'Zwart', 'Blauw', 'Grijs', 'Rose'] },   
            storage: { name: 'Opslag', values: ['16 GB', '32 GB', '64 GB', '128 GB', '256 GB'] },
            ram: { name: 'Werkgeheugen', values: ['1 GB', '2 GB', '3 GB'] }      
        },
        brands: [],
        bookmarks: [],
        totalFilteredProducts: 0
    },

    mounted: function() {     

        // Add random products
        for(let i = 1; i < 100; i++) {        

            let hasDiscount = Math.round((Math.random() * 1) );
            let normalPrice = parseFloat(parseFloat(Math.floor((Math.random() * 900) + 199) + '.' + Math.floor((Math.random() * 99) + 1)).toFixed(2));
            let discount = (hasDiscount) ? Math.floor((Math.random() * 10) + 1) : 0;
            let price = this.priceWithDiscountRaw(discount, normalPrice); 
            let brand = this.availableBrands[Math.floor(Math.random() * this.availableBrands.length)];
            let prodProps = {};

            for( let f in this.availableFilters ) {
                let value;

                if(f == 'os') {
                    value = (brand == 'Apple') ? 'IOS' : (brand == 'HP') ? 'Windows' : 'Android';
                } else {
                    value = this.availableFilters[f].values[Math.floor(Math.random() * this.availableFilters[f].values.length)];
                }

                prodProps[f] = { 
                    name: this.availableFilters[f].name, 
                    value: value
                }                
            }

            // Register product
            this.products.push({
                id: i,
                name: brand,
                brand: brand,
                image: 'img/' + brand.toLowerCase() + '.png',
                normalPrice: normalPrice,
                normalPriceFormatted: this.formatMoney(normalPrice),
                discount: discount,
                price: price,
                priceFormatted: this.priceWithDiscount(discount, normalPrice),
                properties: prodProps          
            });
        }

        this.addBrand('Apple');
    },

    computed: {

        /**
        * Returns the last 5 items added to the shopping cart
        *
        * @returns: array
        */
        cartItemsLimited: function () {
          return this.cart.slice(0, 5).reverse();
        },

        /**
        * Returns the total price of the shopping cart
        *
        * @returns: float
        */
        cartTotal: function () {
          let total = 0;
          for( let i = 0; i < this.cart.length; i++ ) {
            total+= 0 + this.cart[i].product.price;
          }
          return total;
        },

        /**
        * Returns a list products matching the current selected brands
        *
        * @returns: array
        */
        productsWithBrand: function() {
            let products = this.products.slice();
            let brands = this.brands;
            let temp = [];

            if( !brands.length ) {
                return products;
            }

            for( let i = 0; i < products.length; i++ ) {
                if( brands.indexOf( products[i].brand ) !== -1 ) {
                     temp.push(products[i]);
                }
            }

            return temp;
        },

        /**
        * Returns all products that matches all the sorting, filter and brand criteria.
        *
        * @returns: array
        */
        filteredProducts: function() {
            let temp = this.productsWithFilter();
            this.totalFilteredProducts = temp.length;
            return temp;   
        }
    },

    filters: {

    },

    methods: {

        /**
        * Returns the closest parent element
        *
        * @param DOM element
        * @param string selector
        * @param string stopSelector 
        * @returns: DOM element
        */
        closest: function(el, selector, stopSelector) {
              var retval = null;
              while (el) {
                if (el.matches(selector)) {
                  retval = el;
                  break
                } else if (stopSelector && el.matches(stopSelector)) {
                  break
                }
                el = el.parentElement;
              }
              return retval;
        },

        /**
        * Sorting function 
        *
        * @param string property
        * @returns: function
        */
        compare: function(property) {
            var sortOrder = 1;
            if(property[0] === "-") {
                sortOrder = -1;
                property = property.substr(1);
            }
            return function ( a ,b ) {
                var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
                return result * sortOrder;
            }
        },        

        /**
        * Add a brand filter
        *
        * @param string brand
        * @param boolean toggle        
        * @returns: void
        */
        addBrand: function( brand, toggle ) {
            let index = this.brands.indexOf(brand);

            if( index === -1 ) {
                this.brands.push(brand);
            } else if( toggle ) {
                this.brands.splice(index, 1);
            }
        },

        /**
        * Deletes a brand filter
        *
        * @param string brand       
        * @returns: void
        */
        deleteBrand: function( brand ) {
            let index = this.brands.indexOf(brand);

            if( index !== -1 ) {
                this.brands.splice(index, 1);
            } 
        },

        /**
        * Return whether a filter is active
        *
        * @param string filter
        * @param string prop
        * @returns: boolean
        */
        isBrandActive: function( brand ) {
            return this.brands.indexOf(brand) !== -1;           
        },

        /**
        * Bookmark a product
        *
        * @param object product
        * @param object event        
        * @returns: void
        */
        bookmark: function( product, event ) {
            let index = this.bookmarks.indexOf(product.id);

            if( index === -1 ) {
                this.bookmarks.push(product.id);
                this.closest(event.target, 'button').classList.add('active');
            } else {
                this.bookmarks.splice(index, 1);
                this.closest(event.target, 'button').classList.remove('active');
            }
        },

        /**
        * Hide the inline search results element
        *
        * @returns: void
        */
        hideSearch: function() {
            this.showSearch = false;
        },

        /**
        * Search for a product or category
        *
        * @param object event
        * @returns: void
        */
        searchItem: function( event ) {

            clearTimeout(this.searchTimeout);

            this.searchTimeout = setTimeout(() => {               
                let key = event.key;
                let input = event.target;
                let query = input.value.trim().toLowerCase();
                let count = 0;

                let tempBrands = [];
                let tempProds = [];

                if( query.length >= 2 ) {
                    let prods = this.products.slice();
                    let brands = this.availableBrands.slice();

                    for( let i = 0; i < brands.length; i++ ) {
                        let name = brands[i].toLowerCase();
      
                        if(name.indexOf(query) !== -1) {
                            count++;
                            tempBrands.push(brands[i]);
                        }
                    }  

                    for( let i = 0; i < prods.length; i++ ) {
                        let name = (prods[i].name + ' ' + prods[i].properties.os.value).toLowerCase();

                        if(name.indexOf(query) !== -1) {
                            count++;
                            tempProds.push(prods[i]);
                        }
                    }                
                }

                this.search = {
                    query: query,
                    count: count,
                    brands: tempBrands.sort(), 
                    prods: tempProds.sort(this.compare( 'name' ))
                };

                this.showSearch = query.length >= 2 ? true : false;
            }, 100)
        },

        /**
        * Register a product filter, Vue will render the products accordingly in our shop
        *
        * @param string filter
        * @param string value
        * @param object event        
        * @returns: void
        */
        addProductFilter: function( filter, value, event ) {

            let temp = this.filters;

            this.filters = {};

            if(!temp[filter]) {
                temp[filter] = [];
                temp[filter].push(value);
            } else {
                let index = temp[filter].indexOf(value);
                if( index === -1 ) {
                    temp[filter].push(value);
                } else {
                    temp[filter].splice(index, 1);

                    if(temp[filter].length == 0) {
                        delete temp[filter];
                    }
                }
            }

            this.filters = temp;
        },

        /**
        * Returns the total number of products matching the selected brand
        *
        * @param string brand      
        * @returns: integer
        */
        countProductsWithBrand: function( brand ) {
            let products = this.products;
            let temp = 0;

            for( let i = 0; i < products.length; i++ ) {
                if( products[i].brand == brand) {
                     temp++;
                }
            }

            return temp;
        },

        /**
        * Return the number of products that matches a given filter
        *
        * @param string filter
        * @param string value
        * @returns: integer
        */
        countProductsWithFilter: function( filter, value, all ) {
            let temp = 0;
            let prods = this.productsWithFilter(filter);

            for( let i = 0; i < prods.length; i++ ) {
                if( prods[i].properties[filter].value ===  value ) {
                    temp++;
                }
            }

            return temp;            
        },

        /**
        * Returns a list products matching all the active filters, sort, brand etc.
        *
        * @param string exclude       
        * @returns: array
        */
        productsWithFilter: function( exclude ) {
            let all = this.productsWithBrand.sort( this.compare( this.sorting ) );
            let temp = [];
            let filters = this.filters;
            let filterCount = 0;

            for( let f in filters ) {
                 if( exclude !== f && filters[f].length  ) {
                    filterCount++;
                 }               
            }              

            if(!filterCount) {
                return all;
            } else {
                for( let i = 0; i < all.length; i++ ) {
                    let p = all[i];
                    let isLegit = false;

                    for( let f in filters ) {
                         if( exclude == f || filters[f].indexOf(p.properties[f].value) !== -1  ) {
                            isLegit = true;
                         }  else {
                            isLegit = false;
                            break;
                         }             
                    }  

                    if(isLegit) {
                        temp.push(p);
                    }                              
                }
            }

            return temp;   
        },      

        /**
        * Return whether a filter is active
        *
        * @param string filter
        * @param string prop
        * @returns: boolean
        */
        isFilterActive: function(filter, prop) {
            if(!prop) return this.filters[filter] ? true : false;
            return (this.filters[filter] && this.filters[filter].indexOf(prop) !== -1);           
        },

        /**
        * Display a dropdown menu
        *
        * @param object event
        * @returns: void
        */
        toggleDropdown: function( event ){
            let target = this.closest(event.target, '[data-dropdown]');
            if(target) {
                target.classList.toggle("active");
            }       
            event.preventDefault();
        },

        /**
        * Hides a dropdown menu
        *
        * @param object event
        * @returns: void
        */
        hideDropdown: function( event ) {
            let target = this.closest(event.target, '[data-dropdown]');
            if(target) {
                target.classList.remove("active");
            }       
        },

        /**
        * Display products as a list view
        *
        * @param object event
        * @returns: void
        */
        setListVIew: function( event ) {
            event.preventDefault();
            this.listView = true;
            this.gridView = false;
        },

        /**
        * Display products as a grid view
        *
        * @param object event
        * @returns: void
        */
        setGridVIew: function( event ) {
            event.preventDefault();
            this.gridView = true;
            this.listView = false;
        },

        /**
        * Display the filter dialog
        *
        * @param object event
        * @returns: void
        */
        showFilterDialog: function( event ) {
            event.preventDefault();
            document.body.classList.add('filter-dialog');
        },

        /**
        * Hide the filter dialog
        *
        * @param object event
        * @returns: void
        */
        hideFilterDialog: function( event ) {
            event.preventDefault();
            document.body.classList.remove('filter-dialog');
        },

        /**
        * Change the sorting filter
        *
        * @param object event
        * @returns: void
        */
        setSortFilter: function( event ) {
            this.sorting = event.target.value;
        },

        /**
        * Add a product to the shopping cart
        *
        * @param object product
        * @param integer quantity        
        * @returns: void
        */
        addToCart: function( product, quantity ) {
            this.cart.push({
                product: product,
                quantity: quantity
            });
        },

        /**
        * Scroll the window to top with animation (ease in and out)
        *
        * @param integer scrollDuration        
        * @returns: void
        */
        scrollToTop: function( scrollDuration ) {
            const scrollHeight = window.scrollY,
            scrollStep = Math.PI / ( scrollDuration / 15 ),
            cosParameter = scrollHeight / 2;
            var scrollCount = 0,
            scrollMargin,
            scrollInterval = setInterval( function() {
                if ( window.scrollY != 0 ) {
                    scrollCount = scrollCount + 1;  
                    scrollMargin = cosParameter - cosParameter * Math.cos( scrollCount * scrollStep );
                    window.scrollTo( 0, ( scrollHeight - scrollMargin ) );
                } else {
                    clearInterval(scrollInterval);
                } 
            }, 15 );
        },

        /**
        * Calculate the product price minus the discount, it will return a money formatted string
        *
        * @param integer discount
        * @param float price        
        * @returns: string
        */
        priceWithDiscount: function(discount, price) {
            return this.formatMoney(this.priceWithDiscountRaw(discount, price));
        },

        /**
        * Calculate the product price minus the discount
        *
        * @param integer discount
        * @param float price        
        * @returns: float
        */
        priceWithDiscountRaw: function(discount, price) {
            if(!discount) return price;

            return (price - ((price / 100) * discount));
        },

        /**
        * Returns the product price in money format
        *
        * @param float n (price)
        * @param integer c      
        * @param string d    
        * @param string t          
        * @returns: string
        */
        formatMoney: function(n, c, d, t) {
            c = isNaN(c = Math.abs(c)) ? 2 : c, 
            
            // euro
            d = d == undefined ? "," : d, 
            t = t == undefined ? "." : t, 

            // dollar
            //d = d == undefined ? "." : d, 
            //t = t == undefined ? "," : t, 

            s = n < 0 ? "-" : "", 
            i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))), 
            j = (j = i.length) > 3 ? j % 3 : 0;
           return '€' + s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
         }              
    }    
});
