JSONEditor.defaults.editors.gridRow = JSONEditor.AbstractEditor.extend({
  preBuild: function() {
    this._super();

    this.editors = {};
    this.cached_editors = {};
    var self = this;
    this.valueFull = {};

    this.format = this.options.layout || this.options.object_layout || this.schema.format || this.jsoneditor.options.object_layout || "normal";

    this.minwidth = 0;
    this.maxwidth = 0;

    $each(this.schema.render, function(i, key) {
      var schema = self.schema.properties[key];
      var editor = self.jsoneditor.getEditorClass(schema);
      self.editors[key] = self.jsoneditor.createEditor(editor, {
        jsoneditor: self.jsoneditor,
        schema: schema,
        path: self.path + "." + key,
        parent: self,
        compact: true,
        required: true
      });
      self.editors[key].preBuild();

      var width = self.editors[key].options.hidden ? 0 : (self.editors[key].options.grid_columns || self.editors[key].getNumColumns());

      self.minwidth += width;
      self.maxwidth += width;
    });

    this.no_link_holder = true;
  },

  build: function() {
    var self = this;
    this.editor_holder = this.container;
    $each(this.editors, function(key, editor) {
      var holder = self.theme.getTableCell();
      self.editor_holder.appendChild(holder);

      editor.setContainer(holder);
      editor.build();
      editor.postBuild();

      if (self.editors[key].options.hidden) {
        holder.style.display = "none";
      }
      if (self.editors[key].options.input_width) {
        holder.style.width = self.editors[key].options.input_width;
      }
    });

    this.editor_holder = this.container;
    $each(this.editors, function(i, editor) {
      self.editor_holder.appendChild(editor.container);
    });
  },

  setValue: function(value, initial) {
    value = value || {};

    if (typeof value !== "object" || Array.isArray(value)) {
      value = {};
    }

    $each(this.editors, function(i, editor) {
      editor.setValue(value[i] || editor.getDefault(), initial);
    });

    this.refreshValue();
    this.onChange();
    this.valueFull = value;
  },

  onChildEditorChange: function(editor) {
    this.refreshValue();
    this._super(editor);
  },

  refreshValue: function() {
    this.value = {};
    for (var i in this.editors) {
      if (!this.editors.hasOwnProperty(i)) {
        continue;
      }
      this.valueFull[i] = this.value[i] = this.editors[i].getValue();
    }
  },

  getValue: function() {
    return this.valueFull;
  }
});
