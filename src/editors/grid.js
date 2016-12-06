JSONEditor.defaults.editors.grid = JSONEditor.defaults.editors.table.extend({
  build: function() {
    //формируем каркас таблицы
    var self = this;
    this.table = this.theme.getTable();
    this.container.appendChild(this.table);
    this.thead = this.theme.getTableHead();
    this.table.appendChild(this.thead);
    this.header_row = this.theme.getTableRow();
    this.thead.appendChild(this.header_row);
    this.row_holder = this.theme.getTableBody();
    this.table.appendChild(this.row_holder);

    if (!this.options.compact) {
      this.title = this.theme.getHeader(this.getTitle());
      this.container.appendChild(this.title);
      this.title_controls = this.theme.getHeaderButtonHolder();
      this.title.appendChild(this.title_controls);
      if (this.schema.description) {
        this.description = this.theme.getDescription(this.schema.description);
        this.container.appendChild(this.description);
      }
      this.panel = this.theme.getIndentedPanel();
      this.container.appendChild(this.panel);
      this.error_holder = document.createElement("div");
      this.panel.appendChild(this.error_holder);
    } else {
      this.panel = document.createElement("div");
      this.container.appendChild(this.panel);
    }

    this.panel.appendChild(this.table);
    this.controls = this.theme.getButtonHolder();
    this.panel.appendChild(this.controls);

    var columns = this.schema.items.render;
    for (var i = 0; i < columns.length; i++) {
      var th = self.theme.getTableHeaderCell(this.schema.items.properties[columns[i]].title || columns[i]);
      self.header_row.appendChild(th);
    }

    this.row_holder.innerHTML = "";

    // Row Controls column
    this.controls_header_cell = self.theme.getTableHeaderCell(" ");
    self.header_row.appendChild(this.controls_header_cell);

    // Add controls
    this.addControls();
  },
  getElementEditor: function(i) {
    var schema_copy = $extend({}, this.schema.items);
    var row = this.row_holder.appendChild(this.theme.getTableRow());

    var ret = this.jsoneditor.createEditor(JSONEditor.defaults.editors.gridRow, {
      jsoneditor: this.jsoneditor,
      schema: schema_copy,
      container: row,
      path: this.path + "." + i,
      parent: this
    });

    ret.preBuild();
    ret.build();
    ret.postBuild();

    ret.controls_cell = row.appendChild(this.theme.getTableCell());
    ret.table_controls = this.theme.getButtonHolder();
    ret.controls_cell.appendChild(ret.table_controls);
    ret.table_controls.style.margin = 0;
    ret.table_controls.style.padding = 0;

    return ret;
  },
  setValue: function(value, initial) {
    // Update the array"s value, adding/removing rows when necessary
    value = value || [];

    // Make sure value has between minItems and maxItems items in it
    if (this.schema.minItems) {
      while (value.length < this.schema.minItems) {
        value.push(this.getItemDefault());
      }
    }
    if (this.schema.maxItems && value.length > this.schema.maxItems) {
      value = value.slice(0, this.schema.maxItems);
    }

    var serialized = JSON.stringify(value);
    if (serialized === this.serialized) {
      return;
    }

    var numrows_changed = false;

    var self = this;
    $each(value, function(i, val) {
      if (self.rows[i]) {
        // TODO: don"t set the row"s value if it hasn"t changed
        self.rows[i].setValue(val);
      } else {
        self.addRow(val);
        numrows_changed = true;
      }
    });

    for (var j = value.length; j < self.rows.length; j++) {
      if (!self.item_has_child_editors) {
        self.rows[j].row.parentNode.removeChild(self.rows[j].row);
      }
      self.rows[j].destroy();
      self.rows[j] = null;
      numrows_changed = true;
    }
    self.rows = self.rows.slice(0, value.length);

    self.refreshValue();
    if (numrows_changed || initial) {
      self.refreshRowButtons();
    }

    self.onChange();

  },
  addRow: function(value, key) {
    this._super(value, key);
    var self = this;
    var i = key || this.rows.length - 1;
    var controls_holder = self.rows[i].table_controls;

    if (!this.hide_edit_buttons) {
      self.rows[i].edit_button = this.getButton("", "edit", this.translate("button_edit_row_title_short"));
      self.rows[i].edit_button.className += " edit";
      self.rows[i].edit_button.setAttribute("data-i", i);
      self.rows[i].edit_button.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        self.showEditDialog(self.rows[i].getValue(), i);
      });
      controls_holder.appendChild(self.rows[i].edit_button);
    }
  },
  showEditDialog: function(startVal, index) {
    var self = this;
    var editor = new JSONEditor(null, {
      schema: this.schema.items,
      startval: startVal,
      modal: true,
      disable_edit_json: this.jsoneditor.options.disable_edit_json,
      disable_properties: this.jsoneditor.options.disable_properties,
      disable_array_reorder: this.jsoneditor.options.disable_array_reorder,
      required_by_default: this.jsoneditor.options.required_by_default,
      no_additional_properties: this.jsoneditor.options.no_additional_properties
    });
    editor.showInModal(this.schema.items.title, function(defs) {
      if (startVal) {
        self.rows[index].setValue(defs);
      } else {
        self.addRow(defs);
      }
      self.refreshValue();
      self.refreshRowButtons();
      self.onChange(true);
    });
  },
  addRowEvent: function(e) {
    e.preventDefault();
    e.stopPropagation();
    this.showEditDialog();
  }
});
