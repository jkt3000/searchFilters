/* 
 * searchfilters
 * by John Tajima, 2011
*/

(function($) {
  READY_EVENT         = 'sf.ready';
  BEFORE_UPDATE_EVENT = 'sf.before_update';
  AFTER_UPDATE_EVENT  = 'sf.after_update';
  UPDATE_EVENT        = 'sf.update';
  
  $.fn.searchFilters = function(options) {
    var opts = $.extend({}, $.fn.searchFilters.defaults, options);     // create defaults  
    $.fn.searchFilters.url = opts.url || $(this).attr('action');

    
    // initialize update observer
    if (opts.ajax === true) {
      $.fn.searchFilters.paramParser   = windowHashParser;
      $.fn.searchFilters.updateHandler = windowHashHandler;
    } else {
      $.fn.searchFilters.paramParser   = queryParser;
      $.fn.searchFilters.updateHandler = queryHandler;
    }

    // initialize pageless handler
    if (opts.pageless === true) { alert('not implemented'); }
    
    initTextListeners(opts);
    initListListeners(opts);
    initButtonListeners(opts);
    //initCheckboxListeners(opts);
    //initRadioListeners(opts);
    
    disableForm(this, opts);
    cacheDefaultValues(this, opts);
    $(document).bind(UPDATE_EVENT, $.fn.searchFilters.updateHandler);
    $(document).bind(READY_EVENT, $.fn.searchFilters.updateHandler);
    
    $(this).trigger(READY_EVENT);
    return this;
  };
  
  //
  // publicly accessible methods and settings
  //
  $.fn.searchFilters.defaults = {
    url: null,            // by default, use the form action
    pageless: null,       // domid of the pageless url
    pageless_url: null,   // url of pageless
    pageless_options: {}, // hash of pageless options
    ajax: true,           // true if use windowHash change
    beforeUpdate: noop, 
    afterUpdate: noop,
    indicator: '#spinner'
  };
  $.fn.searchFilters.url           = null;
  $.fn.searchFilters.beforeUpdate  = null;
  $.fn.searchFilters.afterUpdate   = null;
  $.fn.searchFilters.updateHandler = null;
  
  $.fn.searchFilters.currentParams = {};
  $.fn.searchFilters.defaultValues = {};


  // private functions
  // -------------------------------------------------
  
  function queryParser() {
    var search = window.location.search !== "" ? window.location.search.slice(1) : window.location.search;
    return $.deparam(search);
  };

  function windowHashParser() {
    return $.deparam($.param.fragment()) || {};
  };

  function windowHashHandler(e, data) {
    console.log("Got event ");
    console.log(e);
    console.log(data);
    if (e.namespace === 'ready') {
      // handle the ready event
      // 
    } else {
    }
    // get default values
    // get current values
    // get newest changes
    // create updated params
    // request new results - callback populates table
    // with newest change, update labels
    // if event is ready, initialize all views


  }


  function disableForm(el) {
    $(el).bind('submit', function(e){e.preventDefault(); }); // disable the default submit
  }
  
  function cacheDefaultValues(el) {
    $.each($(el).find("[data-sf-default]"), function(i, el){ 
      var key = $(el).attr('name');
      var val = $(el).attr('data-sf-default');
      $.fn.searchFilters.defaultValues[key] = val;
    });
    console.log("default values are");
    console.log($.fn.searchFilters.defaultValues);    
  }

  // act on UPDATE_EVENTs.
  function updateWatcher(el, opts) {
    $(document).bind(UPDATE_EVENT, function(e){
      
    });
  }

  function ajaxUpdateWatcher(el, opts) {
    
  }


  // text filter
  //------------------------------------------------

  function initTextListeners(opts) { 
    // $('.sftext').bind('focus', textFieldFocusHandler);
    $('.sftext').bind('blur', textFieldBlurHandler);
  }

  function textFieldFocusHandler(e) {
    // noop
  }

  function textFieldBlurHandler(e) {
    var el = $(e.currentTarget);
    var field = el.attr('name');
    var value = el.val();
    el.trigger(UPDATE_EVENT, {field:field, value:value});
  }

  // button filters
  // -----------------------------------------------
  function initButtonListeners(opts) { 
    $('.sfbutton').bind('click', updateButtonHandler);
  }

  // button classes can be selected0 selected1 ... selectedN  
  function updateButtonHandler(e) {
    var $target    = $(e.currentTarget);
    var field      = $target.attr('data-sf-field');
    var $all_els   = $('.sfbutton[data-sf-field="' + field + '"]');
    var values     = $target.attr('data-sf-values') === undefined ? $.makeArray($target.attr('data-sf-value')) : $.parseJSON($target.attr('data-sf-values'));  
    var classNames = $.map(values, function(val, i){ return i == 0 ? 'selected' : 'selected'+i; });  // [selected, selected1, selected2, ...]

    // get next index
    var nextIndex = 0;
    for (var i=0, len=classNames.length; i < len; i++) {
      if ($target.hasClass(classNames[i])) {
        nextIndex = classNames[i+1] === undefined ? 0 : i+1;
        break;
      }
    }
    var nextValue = values[nextIndex];
    var label     = $target.html();

    // clear old classnames
    $.each($all_els, function(i, el){
      $.each(classNames, function(j, val){ $(el).removeClass(val); });
    });
    $target.addClass(classNames[nextIndex]); // set new class
    $target.trigger(UPDATE_EVENT, {field:field, value:nextValue, label:label})
  }


  // List filters
  // 
  // listener for all .sflist & .sflist-item elements
  // when click .sflabel, show list items
  // when click on .sflistitem, update values
  //------------------------------------------------
  function initListListeners(opts) {
    var $listEls     = $('.sflist');
    var $labelEls    = $('.sflabel');
    var $listItemEls = $('.sflistitem');
    var fields       = $.map($listEls, function(el,i) { return $(el).attr('data-sf-field') });
    
    // listeners on label
    $.each($labelEls, function(i, el){
      var currfield  = $(el).attr('data-sf-label');
      if (fields.indexOf(currfield) >= 0) {
        $(el).bind('click', listToggleHandler);
        $(document).bind(UPDATE_EVENT, updateLabelHandler);
      }
    });
    
    // listeners on list items
    $('.sflistitem').bind('click', listItemHandler);
  }

  function listToggleHandler(e) {
    var value = $(e.currentTarget).attr('data-sf-label');
    $('.sflist').each(function(i, el){
      $(el).attr('data-sf-field') === value ? $(el).slideToggle() : $(el).slideUp();
    });
  }

  function updateLabelHandler(e, data) {
    $('.sflabel[data-sf-label="'+data.field+'"]').html(data.label);
  }

  function listItemHandler(e) {
    //console.log("listItemHandler ");
    var el         = $(e.currentTarget);
    var value      = el.attr('data-sf-value');
    var label      = el.html();
    var field      = el.parents('.sflist').attr('data-sf-field');
    
    el.parents('.sflist').slideUp();
    el.trigger(UPDATE_EVENT, {field:field, label:label, value:value} );
  }


  function initHashChangeListener(el, opts) {

  }


  function noop() { return; }

  function log(msg) {
    if (window.console && window.console.log && window['debug'] === true) {
      console.log(msg);
    }
  }
  
})(jQuery);

