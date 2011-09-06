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
    var form = this;

    // initialize pageless handler
    if (opts.pageless === true) { 
      alert('not implemented'); 
    }
    var initial_params = $.extend({}, defaultParamParser(this), $.deparam.fragment());
    
    textFilters   = new TextSearchFilter();
    buttonFilters = new ButtonFilter();
    listFilters   = new ListFilter();

    $(window).bind('hashchange', function(event){
      var changes = $.deparam.fragment();
      var params = $.extend({},defaultParamParser(form), changes);
      buttonFilters.setState(params);
      textFilters.setState(params);
      listFilters.setState(params);
      
      // update current settings for list, button, order selectors
      $.each(params, function(key, value){
        form.find("input[name='"+ key + "']").val(value);
      });
      // get new results
    });

    $(window).trigger('hashchange');
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
  
  function submitChange(field, value) {
    var params = $.deparam.fragment();
    params[field] = value;
    console.log("field "+field + " value: "+value)
    $.bbq.pushState(params);
  };
  
  //
  // textField Filter 
  //
  var TextSearchFilter = Class.extend({
    init: function(events) {
      this.selector    = '.sftext';
      this.$elements   = $(this.selector);
      this.$elements.bind('blur', this.changeHandler.bind(this));
    },
    
    // update/set the contents for { field => value }
    setState: function(params) {
      $.each(this.$elements, function(i, el){
        var value = params[$(el).attr('name')];
        if (value !== undefined) { $(el).val(value); }
      });
    },
    
    changeHandler: function(event){
      var $el = $(event.currentTarget);
      submitChange($el.attr('name'), $el.val());
      return false;
    }
  });
  
  //
  // Button Filters - groups of related buttons on same field
  //
  var ButtonFilter = Class.extend({
    init: function(events) {
      this.selector    = '.sfbutton[data-sf-value]';
      this.$elements   = $(this.selector);
      this.$elements.bind('click', this.changeHandler.bind(this));
    },
    
    setState: function(params) {
      var self = this;
      $.each(this.$elements, function(i, el){
        var field = $(el).attr('data-sf-field');
        var value = params[field];
        if (value !== undefined) {
          if ($(el).attr('data-sf-value') === value) {
            $(el).addClass('selected');
            $("input[name='" + field + "']").val(value); // set hidden vlaue
          } else {
            $(el).removeClass('selected');
          }
        }
      });
    },
    
    changeHandler: function(event) {
      var $el = $(event.currentTarget);
      submitChange($el.attr('data-sf-field'), $el.attr('data-sf-value'));
      return false;
    }
  });
  
  //
  // OrderButton Filter - button with multiple states 
  //
  
  
  //
  // ListFilter
  //
  ListFilter = Class.extend({
    init: function(events) {
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
      this.$listItemEls.bind('click', this.changeHandler.bind(this));  
    },
    
    setState: function(params){
      var self = this
      $.each(this.$labelEls, function(i, el){
        var field = $(el).attr('data-sf-label');
        var value = params[field];
        if (value !== undefined) {
          var list = $(".sflist[data-sf-field='"+ field + "']"); // find the associated list
          var label = list.find(".sflistitem[data-sf-value='" + value + "']").html(); // find list item within this list
          $(el).html(label);
        }
      });
    },
    
    listToggleHandler: function(event, data) {
      var value = $(event.currentTarget).attr('data-sf-label');
      this.$listEls.each(function(i, el){
        $(el).attr('data-sf-field') === value ? $(el).slideToggle() : $(el).slideUp();
      });
      return false;
    },
    
    changeHandler: function(event, data) {
      var el    = $(event.currentTarget);
      var value = el.attr('data-sf-value');
      var field = el.parents('.sflist').attr('data-sf-field');
      el.parents('.sflist').slideUp();
      submitChange(field, value);
      return false;
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

