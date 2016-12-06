JSONEditor.defaults.editors.hash = JSONEditor.defaults.editors.grid.extend({
  preBuild: function() {
    this._super();
    this.rows = {};
    this.hide_move_buttons = true;
  },
  setValue: function(value, initial) {
    // Update the array"s value, adding/removing rows when necessary
    if (initial) {
      return;
    }
    value = value || {};

    var serialized = JSON.stringify(value);
    if (serialized === this.serialized) {
      return;
    }

    var numrows_changed = false;

    var self = this;
    $each(value, function(i, val) {
      val.$index = i;
      if (self.rows[i]) {
        // TODO: don"t set the row"s value if it hasn"t changed
        self.rows[i].setValue(val);
      } else {
        self.addRow(val, i);
        numrows_changed = true;
      }
    });
    for (var j in this.rows) {
      if (!value.hasOwnProperty(j)) {
        self.rows[j].destroy();
        delete self.rows[j];
        numrows_changed = true;
      }
    }

    self.refreshValue();
    if (numrows_changed || initial) {
      self.refreshRowButtons();
    }

    self.onChange();

  },
  showEditDialog: function(startVal, index) {
    var self = this;
    //TODO: spike for disabling index field
    this.schema.items.properties.$index.readonly = !!startVal;
    var editor = new JSONEditor(null, {
      schema: this.schema.items,
      startval: startVal,
      modal: true,
      disable_edit_json: this.jsoneditor.options.disable_edit_json,
      disable_properties: this.jsoneditor.options.disable_properties,
      required_by_default: this.jsoneditor.options.required_by_default,
      no_additional_properties: this.jsoneditor.options.no_additional_properties
    });
    editor.showInModal(this.schema.items.title, function(defs) {
      self.schema.items.properties.$index.readonly = true;
      if (startVal) {
        self.rows[index].setValue(defs);
      } else {
        if (self.rows[defs.$index]) {
          //already exist
          return;
        }
        self.addRow(defs, defs.$index);
      }
      self.refreshValue();
      self.refreshRowButtons();
      self.onChange(true);
    });
  },
  refreshValue: function() {
    var self = this;
    this.value = {};

    $each(this.rows,function(i,editor) {
      // Get the value for this editor
      var val = JSON.parse(JSON.stringify(editor.getValue()));
      var index = val.$index;
      delete val.$index;
      self.value[index] = val;
    });
    this.serialized = JSON.stringify(this.value);
  }
});
