require([
    'jquery',
    'underscore',
    'jquery/jquery-storageapi'
], function($, _) {
    var storage = $.initNamespaceStorage('mage-cache-storage').localStorage;

    $(document).on('ajaxComplete', function (event, xhr, settings) {
        if (settings.url.match(/customer\/section\/load/i) && xhr.responseJSON && xhr.responseJSON.cart) {
            var addedItems = {};
            var removedItems = {};

            var newCart = xhr.responseJSON.cart;
            var oldCart = storage.get('iwd-old-cart');
            oldCart = (typeof oldCart === 'undefined') ? {'items':[]} : oldCart;

            var oldCartItems = {};
            $.each(oldCart.items, function(){oldCartItems[this.item_id] = this;});

            $.each(newCart.items, function(item){
                var id = this.item_id;
                if (typeof oldCartItems[id] !== 'undefined') {
                    var oldQty = oldCartItems[id].qty;
                    if (oldQty < this.qty) {
                        this.qty -= oldQty;
                        addedItems[id] = this;
                    } else if (oldQty > this.qty) {
                        this.qty = oldQty - this.qty;
                        removedItems[id] = this;
                    }
                    delete oldCartItems[id];
                } else {
                    addedItems[id] = this;
                }
            });

            $.each(oldCartItems, function(id, item){removedItems[id] = item;});

            if (_.size(addedItems) > 0) {
                //$('body').trigger('productAdded', [{items:addedItems}]);
                console.log('item added');
            }
            /*if (_.size(removedItems) > 0) {
                $('body').trigger('productRemoved', [{items:removedItems}]);
            }*/

            storage.set('iwd-old-cart', newCart);
        }
    });
});
