from django.contrib.gis import admin

from .Agency import AgencyModelAdmin
from .CompositeFinClip import CompositeFinClipModelAdmin
from .CWT import CWTModelAdmin
from .FinClip import FinClipModelAdmin
from .FishTag import FishTagModelAdmin
from .Grid10 import Grid10Admin
from .Image import ImageModelAdmin
from .Jurisdiction import JurisdictionModelAdmin
from .Lake import LakeModelAdmin
from .LatLonFlag import LatLonFlagModelAdmin
from .ManagementUnit import ManagementUnitModelAdmin
from .Mark import MarkModelAdmin
from .PhysChemMark import PhysChemMarkModelAdmin
from .Species import SpeciesModelAdmin
from .StateProvince import StateProvinceModelAdmin
from .Strain import StrainModelAdmin
from .StrainRaw import StrainRawModelAdmin

admin.site.empty_value_display = "(None)"
