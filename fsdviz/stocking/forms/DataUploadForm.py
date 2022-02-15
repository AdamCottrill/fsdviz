from django import forms


class DataUploadForm(forms.Form):
    """A simple little form for uploading our tempalte databases one at a time."""

    upload_comment = forms.CharField(
        widget=forms.Textarea, label="Comment (optional):", required=False
    )
    data_file = forms.FileField(label="File:", required=True)

    def __init__(self, *args, **kwargs):

        super(DataUploadForm, self).__init__(*args, **kwargs)
        self.fields["data_file"].widget.attrs["accept"] = ".xlsx, .xls"
        self.fields["data_file"].widget.attrs["id"] = "data_file"
        self.fields["data_file"].widget.attrs["name"] = "data_file"

        self.fields["upload_comment"].widget.attrs["rows"] = "4"
