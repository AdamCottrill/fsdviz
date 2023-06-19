from datetime import datetime
from drf_renderer_xlsx.renderers import XLSXRenderer, get_style_from_dict, get_attribute
from openpyxl import Workbook
from openpyxl.drawing.image import Image
from openpyxl.utils import get_column_letter
from openpyxl.writer.excel import save_virtual_workbook

from rest_framework.utils.serializer_helpers import ReturnDict, ReturnList


class MetaXLSXRenderer(XLSXRenderer):

    """Renderer for Excel spreadsheet open data format (xlsx) that
    over-rides the render provided by the drf_xl library to include a
    meta sheet with the date the data was downloaded as well as the
    url with query parameters that were used to generate it.

    """

    def render(self, data, accepted_media_type=None, renderer_context=None):
        """
        Render `data` into XLSX workbook, returning a workbook.
        """
        if not self._check_validatation_data(data):
            return self._json_format_response(data)

        if data is None:
            return bytes()

        wb = Workbook()
        self.ws = wb.active

        results = data["results"] if "results" in data else data

        # Take header and column_header params from view
        header = get_attribute(renderer_context["view"], "header", {})
        self.ws.title = header.get("tab_title", "Report")
        header_title = header.get("header_title", "Report")
        img_addr = header.get("img")
        if img_addr:
            img = Image(img_addr)
            self.ws.add_image(img, "A1")
        header_style = get_style_from_dict(header.get("style"), "header_style")

        column_header = get_attribute(renderer_context["view"], "column_header", {})
        column_header_style = get_style_from_dict(
            column_header.get("style"), "column_header_style"
        )

        column_count = 0
        row_count = 1
        if header:
            row_count += 1
        # Make column headers
        column_titles = column_header.get("titles", [])

        # If we have results, pull the columns names from the keys of the first row
        if len(results):
            if isinstance(results, ReturnDict):
                column_names_first_row = results
            elif isinstance(results, ReturnList) or type(results) is list:
                column_names_first_row = self._flatten(results[0])
            elif type(results) is dict:
                column_names_first_row = results

            for column_name in column_names_first_row.keys():
                if column_name == "row_color":
                    continue
                column_count += 1
                if column_count > len(column_titles):
                    column_name_display = column_name
                else:
                    column_name_display = column_titles[column_count - 1]

                self.ws.cell(
                    row=row_count, column=column_count, value=column_name_display
                ).style = column_header_style
            self.ws.row_dimensions[row_count].height = column_header.get("height", 45)

        # Set the header row
        if header:
            last_col_letter = "G"
            if column_count:
                last_col_letter = get_column_letter(column_count)
            self.ws.merge_cells("A1:{}1".format(last_col_letter))

            cell = self.ws.cell(row=1, column=1, value=header_title)
            cell.style = header_style
            self.ws.row_dimensions[1].height = header.get("height", 45)

        # Set column width
        column_width = column_header.get("column_width", 20)
        if isinstance(column_width, list):
            for i, width in enumerate(column_width):
                col_letter = get_column_letter(i + 1)
                self.ws.column_dimensions[col_letter].width = width
        else:
            for self.ws_column in range(1, column_count + 1):
                col_letter = get_column_letter(self.ws_column)
                self.ws.column_dimensions[col_letter].width = column_width

        # Make body
        self.body = get_attribute(renderer_context["view"], "body", {})
        self.body_style = get_style_from_dict(self.body.get("style"), "body_style")
        if isinstance(results, ReturnDict):
            self._make_body(results, row_count)
        elif isinstance(results, ReturnList) or type(results) is list:
            for row in results:
                self._make_body(row, row_count)
                row_count += 1

        if renderer_context:
            request = renderer_context["request"]
            meta = wb.create_sheet("Metadata")
            meta["A1"] = "Downloaded on:"
            meta["B1"] = datetime.today().strftime("%Y-%m-%d %H:%M:%S")
            meta["A2"] = "url:"
            meta["B2"] = request.build_absolute_uri()

        return save_virtual_workbook(wb)
