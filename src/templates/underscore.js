JSONEditor.defaults.templates.underscore = function() {
  if(!window._) return false;

  return {
    compile: function(template) {
      var compiled = window._.template(template);
      return function(context) {
        if (Object.keys(context).length > 1) {
          return compiled(context);
        }
      };
    }
  };
};
