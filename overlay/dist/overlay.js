/* 
 * overlay.js v1.1.0
 * Copyright 2014 Joah Gerstenberg (www.joahg.com)
 */
(function($) { 
  $.fn.overlay = function() {
    overlay = $('.overlay');

    overlay.ready(function() {
      overlay.on('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', function(e) {
        if (!$(this).hasClass('shown')) {
          $(this).css('visibility', 'hidden');
        }
      });

      overlay.on('show', function() {
        $(this).css('visibility', 'visible');
        $(this).addClass('shown');
        return true;
      });

      overlay.on('hide', function() {
        $(this).removeClass('shown');
        return true;
      });


      $('a[data-overlay-trigger=""]').on('click', function() {
        overlay.trigger('show');
      });

      $('a[data-overlay-trigger]:not([data-overlay-trigger=""])').on('click', function() {
        console.log($('.overlay#' + $(this).attr('data-overlay-trigger')))
        $('.overlay#' + $(this).attr('data-overlay-trigger')).trigger('show');
      });
    })
  };
})(jQuery);