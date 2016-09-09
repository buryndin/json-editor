JSONEditor.defaults.editors.image = JSONEditor.AbstractEditor.extend({
  getNumColumns: function() {
    return 4;
  },
  build: function() {
    var self = this;
    if (!this.options.compact) {
      this.title = this.theme.getFormInputLabel(this.getTitle());
    }

    // Input that holds the base64 string
    this.input = this.theme.getFormInputField('hidden');
    this.container.appendChild(this.input);

    // Don't show uploader if this is readonly
    if (!this.schema.readOnly && !this.schema.readonly) {

      if (!this.jsoneditor.options.upload) {
        throw 'Upload handler required for upload editor';
      }

      // File uploader
      this.uploader = this.theme.getFormInputField('file');
      this.uploader.setAttribute('accept', 'image/*');
      this.uploader.style = 'position: absolute; top: 0; visibility: hidden';

      this.uploader.addEventListener('change', function(e) {
        e.preventDefault();
        e.stopPropagation();

        if (this.files && this.files.length) {
          var fr = new FileReader();
          fr.onload = function(evt) {
            self.preview_value = evt.target.result;
            self.refreshPreview();
            self.onChange(true);
            fr = null;
          };
          fr.readAsDataURL(this.files[0]);
        }
      });
    }

    this.preview = document.createElement('div');

    this.button_holder = document.createElement('div');
    this.button_holder.className = 'file_upload';
    this.button_holder.style = 'position: relative; overflow: hidden;';

    var search = this.getButton('', 'folder_open', 'Выбрать');
    search.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      self.uploader.click();
    });
    this.button_holder.appendChild(search);

    this.upload = this.getButton('', 'upload', 'upload');
    this.upload.setAttribute('disabled', 'disabled');
    this.upload.addEventListener('click', function(event) {
      event.preventDefault();

      self.upload.setAttribute('disabled', 'disabled');
      self.theme.removeInputError(self.uploader);

      if (self.theme.getProgressBar) {
        self.progressBar = self.theme.getProgressBar();
        self.preview.appendChild(self.progressBar);
      }
      var file = {
        file: self.preview_value,
        path: self.value
      };
      self.jsoneditor.options.upload(self.path, file, {
        success: function(url) {
          if (self.progressBar) {
            self.preview.removeChild(self.progressBar);
          }
          self.upload.removeAttribute('disabled');

          self.setValue(url);

          if (self.parent) {
            self.parent.onChildEditorChange(self);
          } else {
            self.jsoneditor.onChange();
          }
        },
        failure: function(error) {
          self.theme.addInputError(self.uploader, error);
          if (self.progressBar) {
            self.preview.removeChild(self.progressBar);
          }
          self.upload.removeAttribute('disabled');
        },
        updateProgress: function(progress) {
          if (self.progressBar) {
            if (progress) {
              self.theme.updateProgressBar(self.progressBar, progress);
            } else {
              self.theme.updateProgressBarUnknown(self.progressBar);
            }
          }
        }
      });
    });
    this.button_holder.appendChild(this.upload);

    this.zoom = this.getButton('', 'zoom_in', 'Zoom');
    this.zoom.setAttribute('disabled', 'disabled');
    this.zoom.addEventListener('click', function(event) {
      event.preventDefault();
      self.showInModal();
    });
    this.button_holder.appendChild(this.zoom);

    this.button_holder.appendChild(this.uploader);

    this.control = this.theme.getFormControl(this.title, this.button_holder || this.input);
    this.control.insertBefore(this.preview, this.button_holder);
    this.container.appendChild(this.control);
  },
  refreshPreview: function() {
    if (this.last_preview === this.preview_value) {
      return;
    }
    this.last_preview = this.preview_value;

    this.preview.innerHTML = '';

    if (!this.preview_value) {
      return;
    }

    var mime = this.preview_value.match(/^data:([^;,]+)[;,]/);
    mime = mime && mime[1] || 'unknown';

    if (mime.substr(0, 5) === 'image') {
      this.img = document.createElement('img');
      this.img.style.maxWidth = '100%';
      this.img.style.maxHeight = '100px';
      this.img.src = this.preview_value;
      this.preview.innerHTML = '<strong>Type:</strong> ' + mime + ', <strong>Size:</strong> ' + this.img.naturalWidth + 'x' + this.img.naturalHeight;
      this.preview.innerHTML += '<br>';
      this.preview.appendChild(this.img);
    }
    if (this.img.naturalWidth != this.schema.size[0] || this.img.naturalHeight != this.schema.size[1]) {
      this.upload.setAttribute('disabled', 'disabled');
    } else {
      this.upload.removeAttribute('disabled');
    }
  },
  enable: function() {
    if (this.uploader) {
      this.uploader.disabled = false;
    }
    this._super();
  },
  disable: function() {
    if (this.uploader) {
      this.uploader.disabled = true;
    }
    this._super();
  },
  setValue: function(val) {
    if (val && this.value !== val) {
      this.value = val;
      this.input.value = this.value;
      this.onChange();

      this.preview.innerHTML = '';
      var img = document.createElement('img');
      img.style.maxWidth = '100%';
      img.style.maxHeight = '150px';
      img.src = val;
      this.preview.appendChild(img);
      this.img = img;
      this.zoom.removeAttribute('disabled');
    }
  },
  destroy: function() {
    if (this.preview && this.preview.parentNode) this.preview.parentNode.removeChild(this.preview);
    if (this.title && this.title.parentNode) this.title.parentNode.removeChild(this.title);
    if (this.input && this.input.parentNode) this.input.parentNode.removeChild(this.input);
    if (this.uploader && this.uploader.parentNode) this.uploader.parentNode.removeChild(this.uploader);
    if (this.button_holder && this.button_holder.parentNode) this.button_holder.parentNode.removeChild(this.button_holder);
    this._super();
  },
  showInModal: function() {
    var img = this.img.cloneNode();
    img.style.maxWidth = '100%';
    img.style.maxHeight = '800px';

    var modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.setAttribute('tabindex', -1);
    modal.setAttribute('data-focus-on', "input:first");
    modal.id = 'modalImage';
    modal.innerHTML = "<div class='modal-dialog' style='width:" + img.naturalWidth + "px'>" +
        "<div class='modal-content'>" +
          "<div class='modal-body' id='modalImageBody'>" +
            "<button type='button' class='close' data-dismiss='modal'>&times;</button>" +
          "</div>" +
        "</div>" +
      "</div>";
    $('body').prepend(modal);
    $('#modalImageBody')[0].appendChild(img);
    $('#modalImage').on('hidden.bs.modal', function() {
      var el = $('#modalImage').get(0);
      el.parentNode.removeChild(el);
    });
    $('#modalImage').modal({keyboard: true});
  }
});
