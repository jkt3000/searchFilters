/* 
 * searchfilters
 * by John Tajima, 2011
*/

window.debug = true;

(function($) {
  READY_EVENT         = 'sf.ready';
  BEFORE_UPDATE_EVENT = 'sf.before_update';
  AFTER_UPDATE_EVENT  = 'sf.after_update';
  UPDATE_EVENT        = 'sf.update';
  
  $.fn.searchFilters = function(options) {
    var opts = $.extend({}, $.fn.searchFilters.defaults, options);     // create defaults  
    $.fn.searchFilters.url = opts.url || $(this).attr('action');

    var paramParser   = null;
    var updateHandler = null;
    
    // initialize update observer
    if (opts.ajax === true) {
      paramParser = windowHashParser;
      updateHandler = windowHashHandler;
    } else {
      paramParser = queryParser;
      updateHandler = queryHandler;
    }

    // initialize pageless handler
    if (opts.pageless === true) { alert('not implemented'); }
    
    textFilters   = new TextSearchFilter({updateEvent: UPDATE_EVENT, readyEvent: READY_EVENT});
    buttonFilters = new ButtonFilter({updateEvent: UPDATE_EVENT, readyEvent: READY_EVENT});
    ListFilters   = new ListFilter({updateEvent: UPDATE_EVENT, readyEvent: READY_EVENT});

    var initial_params = $.extend({}, defaultParamParser(this), paramParser());
    
    // disableForm(this, opts);
    // cacheDefaultValues(this, opts);
    // $(document).bind(UPDATE_EVENT, $.fn.searchFilters.updateHandler);
    // $(document).bind(READY_EVENT, $.fn.searchFilters.updateHandler);
    
    $(document).trigger(READY_EVENT, initial_params);
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

  // -------------------------------------------------
  // private functions
  // -------------------------------------------------
  
  //
  // textField Filter 
  //
  var TextSearchFilter = Class.extend({
    init: function(events) {
      this.readyEvent  = events.readyEvent;
      this.updateEvent = events.updateEvent;
      this.selector    = '.sftext';
      this.$elements   = $(this.selector);
      log('this.$elements')
      this.$elements.bind('blur', this.changeHandler.bind(this));
      $(document).bind(this.readyEvent, this.initState.bind(this));
    },
    
    initState: function(event, data) {
      // set initial value and label
      $.each(this.$elements, function(i, el){
        var name  = $(el).attr('name'); 
        var value = data[name];
        if (value !== undefined) { $(el).val(value); }
      });
    },
    
    changeHandler: function(event){
      var el = $(event.currentTarget);
      var field = el.attr('name');
      var value = el.val();
      el.trigger(this.updateEvent, {field:field, value:value});
    }
  });
  
  //
  // Button Filters
  //
  var ButtonFilter = Class.extend({
    init: function(events) {
      this.readyEvent  = events.readyEvent;
      this.updateEvent = events.updateEvent;
      this.selector    = '.sfbutton';
      this.$elements   = $(this.selector);
      this.$elements.bind('click', this.changeHandler.bind(this));
      $(document).bind(this.readyEvent, this.initState.bind(this));
    },
    
    initState: function(event, data) {

      $.each(this.$elements, function(i, el){
        var field = $(el).attr('data-sf-field');
        $.each(data, function(key,value){
          if (key == field) {
            var values = $(el).attr('data-sf-values') === undefined ? $.makeArray($(el).attr('data-sf-value')) : $.parseJSON($(el).attr('data-sf-values'));  
            var index = values.indexOf(value);
            if (index >= 0) { 
              var klass = index > 0 ? 'selected'+index : 'selected';
              $(el).addClass(klass); // init button
              // set hidden value
            }
          }
        });
      });
    },
    
    changeHandler: function(event) {
      var $target    = $(event.currentTarget);
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
      $target.trigger(UPDATE_EVENT, {field:field, value:nextValue, label:label});
    }
    
  });
  
  //
  // ListFilter
  //
  ListFilter = Class.extend({
    init: function(events) {
      this.readyEvent    = events.readyEvent;
      this.updateEvent   = events.updateEvent;
      this.listselector  = '.sflist';
      this.labelselector = '.sflabel';
      this.itemselector  = '.sflistitem';
      this.$listEls      = $(this.listselector);
      this.$labelEls     = $(this.labelselector);
      this.$listItemEls  = $(this.itemselector);
      this.fields        = $.map(this.$listEls, function(el,i) { return $(el).attr('data-sf-field') });
      
      $.each(this.$labelEls, function(i, el){
        var currfield  = $(el).attr('data-sf-label');
        if (this.fields.indexOf(currfield) >= 0) {
          $(el).bind('click', this.listToggleHandler.bind(this));
        }
      }.bind(this));
      this.$listItemEls.bind('click', this.updateListItemHandler.bind(this));
      $(document).bind(this.readyEvent, this.initState.bind(this)); 
      $(document).bind(this.updateEvent, this.updateLabelHandler.bind(this));     
    },
    
    initState: function(event, data){},
    
    listToggleHandler: function(event, data) {
      var value = $(event.currentTarget).attr('data-sf-label');
      this.$listEls.each(function(i, el){
        $(el).attr('data-sf-field') === value ? $(el).slideToggle() : $(el).slideUp();
      });
    },
    
    updateListItemHandler: function(event, data) {
      log('updateListItemHandler ');
      var el         = $(event.currentTarget);
      var value      = el.attr('data-sf-value');
      var label      = el.html();
      var field      = el.parents('.sflist').attr('data-sf-field');

      el.parents('.sflist').slideUp();
      el.trigger(UPDATE_EVENT, {field:field, label:label, value:value} );
    },
    
    updateLabelHandler: function(event, data) {
      $('.sflabel[data-sf-label="'+data.field+'"]').html(data.label);
    }
  });
  
  
  // parses the default values for search filters from HTML
  function defaultParamParser(el) {
    var params = {}
    $.each($(el).find("[data-sf-default]"), function(i, el){ 
      var key = $(el).attr('name');
      var val = $(el).attr('data-sf-default');
      params[key] = val;
    });
    return params;
  }
  
  //
  // non-ajax parser & handler
  //-------------------------------------------------
  
  // parses values in the query of the URL
  function queryParser() {
    log('queryParser')
    return $.deparam.querystring();
  };
  
  function queryHandler(e, data){
    log('query handler got an event ' + e.type);
    log(['data was', data]);
  }

  //
  // ajax parser & handler
  //-------------------------------------------------

  // parses values in the hash of the URL
  function windowHashParser() {
    log('windowHashpareser')
    return $.deparam.fragment();
  };

  function windowHashHandler(e, data) {
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
  function noop() { return; }
  function log(msg) {
    if (window.console && window.console.log && window['debug'] === true) {
      console.log(msg);
    }
  }
  
})(jQuery);

