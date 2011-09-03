/* 
 * searchfilters
 * a jquery plugin to handle creating search filters
*/

/*
Looks for any classes of the following type:

.sftext  - text field
.sflist  - dropdown list
.sfbtn   - button, groups of buttons (on/off or tri-state)
.sfcheck - checkboxes
.sfradio - radio buttons

functionality:
- listen to filters
  - .sftext:onchange => trigger hash change
           :onfocus  => clear placeholder text/default value  
           :onblur   => ?
    
    .sflist:onclick      => show dropdownlist
    .sflist-item:onclick => update associate hidden input field
    
    .sfbtn:onclick       => set as active/next state, clear existing related buttons, update hidden value

    .sfselect: onchange
    .sfcheck: onclick
    .sfradio: onclick

- listen on hidden fields: onchange => trigger a update action
- Updater: listen on 'update' event to 

events:
  - sf:params_changed => called when any button,list,selector,field is changed
  - sf:before_update => called before updating is called
  - sf:after_update  => called after new updating is done

lifecyle:
0. on init, trigger 'sf:ready' event 
0.1 listener on sf:ready event triggers initialization (to init values, get updated values if ajax)

1. User clicks button, updates field, etc.
2. Listener callback:
   - updates display value
   - updates hidden field (?)
   - triggers "params_changed" event
3. params_changed event listener 
   - if ajaxed, then 
       run any before_update callbacks
       fire before_update event
       update window hash

   - if normal,
       run any before_update callbacks
       fire before_update event
       update window href with new params
4. if ajax, after window_hash callback is fired, run any
    after_update callbacks
    - trigger after_update event

Options:
  beforeUpdateCallback: 
  afterUpdateCallback:
  ajax: true


*/


(function($) {
  READY_EVENT         = 'sf.ready';
  BEFORE_UPDATE_EVENT = 'sf.before_update';
  AFTER_UPDATE_EVENT  = 'sf.after_update';
  UPDATE_EVENT        = 'sf.update';
  var FormFields = [];

  $.fn.searchFilters = function(options) {
    var opts = $.extend({}, $.fn.searchFilters.defaults, options);     // create defaults  
    $.fn.searchFilters.url = opts.url || $(this).attr('action');

    // initialize window_hash observer
    if (opts.ajax === true) { 
      initHashChangeListener(this, opts);
    } else {
      // init non ajax update handlers
    }
    // initialize pageless handler
    if (opts.pageless === true) { alert('not implemented'); }
    
    cacheFormFields(this, opts); // cache get all watched input fields
    initTextListeners(opts);
    initListListeners(opts);
    initButtonListeners(opts);
    //initCheckboxListeners(opts);
    //initRadioListeners(opts);

    $(this).bind('submit', function(e){e.preventDefault(); }); // disable the default submit
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
  $.fn.searchFilters.url          = null;
  $.fn.searchFilters.beforeUpdate = null;
  $.fn.searchFilters.afterUpdate  = null;

  // private functions
  // -------------------------------------------------
  
  function cacheFormFields(el, opts) {
    FormFields = $.map(el.find("[data-sf-default]"), function(e, i){ return e; });
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

    // add listener to all btns
    // 

  }

  // button classes can be selected0 selected1 ... selectedN  
  function updateButtonHandler(e) {
    var $target    = $(e.currentTarget);
    var field      = $target.attr('data-sf-field');
    var $all_els   = $('.sfbutton[data-sf-field="' + field + '"]');
    var values     = null;

    if ($target.attr('data-sf-values') === undefined) {
      values = $.makeArray($target.attr('data-sf-value'));      
    } else {
      try {
        values = $.parseJSON($target.attr('data-sf-values'));        
      } catch(e) {
        alert("Error parsing json. " + e);
      }
    }
  
    var classNames = $.map(values, function(val, i){ return i == 0 ? 'selected' : 'selected'+i; });  // [selected, selected1, selected2, ...]

    // get next index
    var nextIndex = 0;
    for (var i=0, len=classNames.length; i < len; i++) {
      if ($target.hasClass(classNames[i])) {
        nextIndex = classNames[i+1] === undefined ? 0 : i+1;
        break;
      }
    }

    // clear old classnames
    $.each($all_els, function(i, el){
      $.each(classNames, function(j, val){ $(el).removeClass(val); });
    });
    // set new class
    $target.addClass(classNames[nextIndex]); 
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

