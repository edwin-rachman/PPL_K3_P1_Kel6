require([
    'jquery',
    'underscore',
    'Magento_Ui/js/modal/alert',
    'Magento_Ui/js/modal/prompt',
    'jquery/jquery-storageapi'
], function($, _, alertWidget, promptWidget) {
  var storage = $.initNamespaceStorage('mage-cache-storage').localStorage;
  var cartLimit = storage.get('cart-limit');
  cartLimit = (typeof cartLimit === 'undefined' || cartLimit === null) ? Infinity : cartLimit;
  
  $('.showcart').before($('<button/>').text(cartLimit === Infinity ? 'No max limit' : ('Max limit: $' + cartLimit)).click(function() {
    var $this = $(this);
    promptWidget({
      title: 'Set maximum cart total limit',
      content: 'Enter new maximum cart total limit below (in $): ',
      value: cartLimit,
      actions: {
        confirm: function(newValue) {
          cartLimit = parseInt(newValue, 10);
          cartLimit = isNaN(cartLimit) ? Infinity : cartLimit;
          storage.set('cart-limit', cartLimit);
          $this.text(cartLimit === Infinity ? 'No max limit' : ('Max limit: $' + cartLimit));
        }
      }
    });
  }));
  
  $(document).ajaxComplete(function (event, xhr, settings) {
    if (settings.url.match(/customer\/section\/load/i) && xhr.responseJSON && xhr.responseJSON.cart) {
      var addedItems = {};
      var newCart = xhr.responseJSON.cart;
      var oldCart = storage.get('old-cart');
      oldCart = (typeof oldCart === 'undefined') ? {'items':[]} : oldCart;
      
      var oldCartItems = {};
      $.each(oldCart.items, function(){oldCartItems[this.item_id] = this;});

      productAdded = null;
      productPrice = null;
      cartTotal = 0;
      $.each(newCart.items, function(index, item){
        cartTotal += item.product_price_value * item.qty;
        var id = this.item_id;
        if (typeof oldCartItems[id] !== 'undefined') {
          var oldQty = oldCartItems[id].qty;
          if (oldQty < this.qty && productAdded === null) {
            productAdded = item.product_name;
            productPrice = item.product_price_value;
          }
          delete oldCartItems[id];
        } 
        else if (productAdded === null) {
          productAdded = item.product_name;
          productPrice = item.product_price_value;
        }
      });
      
      if (productAdded !== null) {
        if (cartTotal > cartLimit) {
          alertWidget({
            title: 'Add to Cart - Maximum cart total limit exceeded',
            content: productAdded + ' successfully added to cart (Price: $' + productPrice + '). Cart total ($' + cartTotal + ') has exceeded maximum limit set by user ($' + cartLimit + ').'
          });
        }
        else {
          alertWidget({
            title: 'Add to Cart',
            content: productAdded + ' successfully added to cart (Price: $' + productPrice + ').'
          });
        }
      }
      storage.set('old-cart', newCart);
    }
  });
});
