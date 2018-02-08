require([
    'jquery',
    'underscore',
    'Magento_Ui/js/modal/alert',
    'jquery/jquery-storageapi'
], function($, _, alertWidget) {
  var storage = $.initNamespaceStorage('mage-cache-storage').localStorage;
  
  $(document).ajaxComplete(function (event, xhr, settings) {
    if (settings.url.match(/customer\/section\/load/i) && xhr.responseJSON && xhr.responseJSON.cart) {
      var addedItems = {};
      var newCart = xhr.responseJSON.cart;
      var oldCart = storage.get('old-cart');
      var cartLimit = storage.get('cart-limit');
      oldCart = (typeof oldCart === 'undefined') ? {'items':[]} : oldCart;
      cartLimit = (typeof cartLimit === 'undefined') ? Infinity : cartLimit;

      var oldCartItems = {};
      $.each(oldCart.items, function(){oldCartItems[this.item_id] = this;});

      cartTotal = 0
      $.each(newCart.items, function(index, item){
        cartTotal += item.product_price_value * item.qty;
        var id = this.item_id;
        if (typeof oldCartItems[id] !== 'undefined') {
          var oldQty = oldCartItems[id].qty;
          if (oldQty < this.qty) {
            this.qty -= oldQty;
            addedItems[id] = this;
          } else if (oldQty > this.qty) {
            this.qty = oldQty - this.qty;
          }
          delete oldCartItems[id];
        } else {
          addedItems[id] = this;
        }
      });
      
      if (_.size(addedItems) > 0) {
        $.each(addedItems, function(id, item) {
          alertWidget({
            title: 'Product added to cart' 
            + (cartTotal > cartLimit ? ' - Maximum cart total limit exceeded' : ''),
            content: 'Added product: ' + item.product_name
            + ' (Price: $' + item.product_price_value + ').'
            + (cartTotal > cartLimit ? (' Cart total ($' + cartTotal + ') has exceeded maximum limit set by user ($' + cartLimit + ').') : '')
          });
        });
      }
      storage.set('old-cart', newCart);
      storage.set('cart-limit', cartLimit);
    }
  });
});
