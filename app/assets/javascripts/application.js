/*
 *= require jquery
 *= require rails
 *= require jquery-ui
 *= require bootstrap
 *= require bootstrap/sticky-popover
 *= require bootstrap/modal-form
 *= require bootstrap/modal-ajax
 *= require bootstrap/scrollspy
 *= require bootstrap/affix
 *= require wysihtml5_parser_rules/advanced
 *= require wysihtml5-0.3.0_rc2
 *= require bootstrap-wysihtml5-0.0.2
 *= require_self
 */

/* Unused?
jQuery(document).ready(function($) {
  $('.collapsible .head').click(function(e) {
      $(this).toggleClass('toggle');
      $(this).next().toggle();
      e.preventDefault();
  }).next().hide();
});*/

jQuery(document).ready(function($) {
  // TODO: Not AJAX friendly
  $('.bar[data-percentage]').each(function() {
    $(this).css({ width: $(this).data('percentage') + '%' })
  });
});

jQuery(document).ready(function($) {
  // Monitor Bootstrap Tooltips to remove the tooltip if the triggering element
  // becomes hidden or removed.
  //
  // * $currentTip needed because tooltips don't fire events until Bootstrap
  //   2.3.0 and $currentTarget.tooltip('hide') doesn't seem to work when it's
  //   not in the DOM
  // * $currentTarget.data('tooltip-monitor') is a flag to ensure only one
  //   monitor per element
  function monitorTooltip($currentTarget) {
    var monitorFn
      , monitorPeriod = 500
      , monitorTimeoutId = null
      , $currentTip;

    if (!$currentTarget.data('tooltip-monitor')) {
      $currentTip = $currentTarget.data('tooltip').$tip;

      monitorFn = function() {
        if (!$currentTarget.is(':visible')) {
          $currentTip.remove();
          $currentTarget.data('tooltip-monitor', false);
        } else if ($currentTip.is(':visible')) {
          monitorTimeoutId = setTimeout(monitorFn, monitorPeriod);
        } else {
          $currentTarget.data('tooltip-monitor', false);
        }
      };

      monitorTimeoutId = setTimeout(monitorFn, monitorPeriod);
      $currentTarget.data('tooltip-monitor', true);
    }
  };

  // Listeners for initial tooltip mouseovers
  $('body').on('mouseover', '[data-toggle="tooltip"], [rel=tooltip]', function(e) {
    var $currentTarget = $(e.currentTarget);

    if (!$currentTarget.data('tooltip')) {
      $currentTarget
        .tooltip()
        .triggerHandler(e);
    }

    monitorTooltip($currentTarget);
  });
});

// Setup for Popovers
jQuery(document).ready(function($) {
  var defaults = {
    delay: { show: 150, hide: 100 },
    placement: 'left',
    content: function(trigger) {
      var $trigger = $(trigger);

      var $el = $(new Spinner().spin().el);
      $el.css({
        width: '100px',
        height: '100px',
        left: '50px',
        top: '50px'
      });
      return $el[0];
    }
  };

  // Listeners for initial mouseovers for stick-hover
  $('body').on('mouseover', 'a[data-popover-trigger="sticky-hover"]', function(e) {
    // If popover instance doesn't exist already, create it and
    // force the 'enter' event.
    if (!$(e.currentTarget).data('sticky_popover')) {
      $(e.currentTarget)
        .sticky_popover($.extend({}, defaults, { trigger: 'sticky-hover' }))
        .triggerHandler(e);
    }
  });

  // Listeners for initial clicks for popovers
  $('body').on('click', 'a[data-popover-trigger="click"]', function(e) {
    e.preventDefault();
    if (!$(e.currentTarget).data('sticky_popover')) {
      $(e.currentTarget)
        .sticky_popover($.extend({}, defaults, { trigger: 'click' }))
        .triggerHandler(e);
    }
  });

  // Remove widgets
  $('body').on('click', '.widget .header .remove', function(e) {
    e.preventDefault();
    var $this = $(this),
        $widget = $this.closest(".widget");
    $widget.fadeOut();  
  });

  // Show/hide widget content
  $('body').on('click', '.widget .header .showhide', function(e) {
    var $this = $(this),
        $content = $this.closest(".widget").find(".content")
    
    if($this.hasClass("active")) {
      $content.slideUp();
      $this.removeClass("active");
    } else {
      $content.slideDown();
      $this.addClass("active");
    }
    
  });

  // Show/hide widget content
  /*$('body').on('mouseover', 'a.more', function(e) {
    var $this = $(this),
        $paragraph = $this.closest("p"),
        $description = $this.closest("div").find(".description");
    $description.fadeIn();
    //$this.closest('div').one('mouseout', function(e) { $description.fadeOut(); });
  });*/

  /*$('body').on('mouseover', '.tree-structure .description', function(e) {
    var $this = $(this);
    $this.removeClass("oneline");
    //$this.one('mouseout', function(e) { $this.addClass('oneline'); });
  });*/

  $('body').on('click', '.tree-structure .title, .tree-structure .description', function(e) {
    var $this = $(this)
      , $leaf = $this.closest('[class*=span]')
      , $title = $leaf.find('.oneline')
      , $description = $leaf.find('.description')
      ;

    if ($description.length > 0) {
      $description.toggleClass('in');
      $title.find('.description-inline').toggleClass('out');
      if ($title.is('.description-only')) {
        $title.toggleClass('out');
      }
    }
  });

  /*$('body').on('mouseenter', '.expand-on-hover', function(e) {
    var $this = $(this)
      , $title = $this.find('.title')
      , $description = $this.find('.description')
      ;
    if ($description.length > 0) {
      $this.on('mouseleave.tree-slide', function(e) {
          $description.hide();
          $title.show();
          $this.off('mouseleave.tree-slide');
      });
      if ($title.is('.description-only')) {
        $title.hide();
      }
      $description.show();
    }
  });*/



  
  // Open quick find
  $('body').on('focus', '.quick-search-holder input', function() {
    var $this = $(this),
    $quickFind = $this.closest(".quick-search").find(".quick-search-results");
    $quickFind.fadeIn();
  });
  
  // Remove quick find
  $('body').on('click', '.quick-search-results .remove', function(e) {
    e.preventDefault();
    var $this = $(this),
        $quickFind = $this.closest(".quick-search-results");
    $quickFind.fadeOut();
  });

  // Close other popovers when one is shown
  $('body').on('show.popover', function(e) {
    $('[data-sticky_popover]').each(function() {
      var popover = $(this).data('sticky_popover');
      popover && popover.hide();
    });
  });

  // Close all popovers on custom event
  $('body').on('kill-all-popovers', function(e) {
    // FIXME: This may be incompatible with bootstrap popover assumptions...
    // This is when the triggering element has been removed from the DOM
    // so we have to kill the popover elements themselves.
    $('.popover').remove();
  });
});

$(document).ajaxComplete(function(event, request){
  var flash = $.parseJSON(request.getResponseHeader('X-Flash-Messages'));
  if (!flash) return;
  $(['notice', 'error', 'warning']).each(function(i, prop) {
    $('.flash > .' + prop).html(flash[prop] || '');
  });
});

$(window).load(function(){

  // tree
  
  $('body').on('click', 'ul.tree .item-title', function(e) {
    var $this = $(this),
        $content = $this.closest('li').find('.item-content');
    
    if($this.hasClass("active")) {
      $content.slideUp('fast');
      $this.removeClass("active");
    } else {
      $content.slideDown('fast');
      $this.addClass("active");
    }
    
  });


  // tree-structure
  
  $('body').on('click', 'ul.tree-structure .item-main .code, ul.tree-structure .item-main .openclose', function(e) {
    var $this = $(this)
      , $main = $this.closest('.item-main')
      , $code = $main.find('.code')
      , $li = $main.closest('li')
      , $content = $li.find('> .item-content')
      //, $content = $this.closest('.item-main').closest('li').find('.item-content:first')
      , $icon = $this.closest('.item-main').find('.openclose');

    if ($icon.hasClass('active')) {
    //if($this.hasClass("active")) {
      $content.slideUp('fast');
      $icon.removeClass('active');
      //$this.removeClass("active");
    } else {
      $content.slideDown('fast');
      $icon.addClass('active');
      //$this.addClass("active");
    }
    
  });



  $('.widget-area').sortable({
    connectWith: '.widget-area'
    , placeholder: 'drop-placeholder'
    , handle : "header, .header"
  }).disableSelection();

});

jQuery(document).ready(function($) {
  var containerSize = $('.container-fluid').width(),
      containerWide = 1200,
      containerNarrow = 960,
      containerDelta = $(window).width() - containerSize;

  $('.container-fluid').css('width', containerSize);

  $(window).on('resize', function(e) {
    var width = $(window).width();
    // Only auto-resize when in 100% mode
    if ($('body').find('.menu').find('.screen-size span').text().trim() == '100%') {
      $('.container-fluid').addClass('resizable').css('width', width - containerDelta);
      $(this).closest('.menu').find('.screen-size span').text('100%');
    }
  });

  $('body').on('click', '.full-view', function(e) {
    var width = $(window).width();
    e.preventDefault();
    $('.container-fluid').addClass('resizable').css('width', width - containerDelta);
    $(this).closest('.menu').find('.screen-size span').text('100%');
  });

  $('body').on('click', '.wide-view', function(e) {
    e.preventDefault();
    $('.container-fluid').addClass('resizable').css('width', containerWide);
    $(this).closest('.menu').find('.screen-size span').text('Wide');
  });

  $('body').on('click', '.narrow-view', function(e) {
    e.preventDefault();
    $('.container-fluid').addClass('resizable').css('width', containerNarrow);
    $(this).closest('.menu').find('.screen-size span').text('Narrow');
  });
});
