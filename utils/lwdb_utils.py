'''=============================================================
~/src/lwdb_utils.py
Created: 10 Jun 2016 09:24:47

DESCRIPTION:

This file contains a number of helper functions used by script that
processes and appends USFWS/GLFC stocking data to the Lake Huron lake
wide stocking database.

Most of these functions are getter functions that return the
sql_alchemy objects corresponding to the supplied criteria (usually an
abbreviation or label)

A. Cottrill
=============================================================

'''

import re

from collections import OrderedDict
from django.core.exceptions import ObjectDoesNotExist

from fsdviz.stocking.models import (Condition, StockingMethod)

from fsdviz.common.models import CWT, CWTsequence, Grid10, ManagementUnit


def grid_or_None(lake, grid):
    """
    """
    mygrid = int_or_None(grid)
    if mygrid:
        try:
            grid10 = Grid10.objects.get(lake=lake, grid=mygrid)
            return grid10
        except ObjectDoesNotExist:
            if val is not None:
                msg = "Could not find Grid={} in {}."
                print(msg.format(grid, lake))
            return None
    else:
        return None


def get_condition(val, default):
    """

    Arguments:
    - `val`:
    - `default`:
    """
    try:
        condition = Condition.objects.get(condition=val)
        return condition
    except ObjectDoesNotExist:
        if val is not None:
            msg = "Could not find condition={}. Using default: '{}'."
            print(msg.format(val, default))
        return default


def get_stocking_method(val, default):
    """

    Arguments:
    - `val`:
    - `default`:
    """
    if val is None:
        return default

    try:
        item = StockingMethod.objects.get(stk_meth=val.lower())
        return item
    except ObjectDoesNotExist:
        if val is not None:
            msg = "Could not find stk_meth={}. Using default: '{}'."
            print(msg.format(val, default))
        return default


def clean_title(text):
    """
    A little helper function to process a string into Title Case and
    remove any leading or trailing whitespaces.  If text is None,
    return None.

    Arguments:
    - `text`: the value returned from database row e.g. record.get('fieldname')

    """

    if text is None:
        return None
    else:
        return text.strip().title()


def int_or_None(x):
    """
    A little helper function to return an integer from our record or
    None if it is an empty string.

    Arguments:
    - `x`: the value returned from database row e.g. record.get('x')
    """

    if x is None:
        return None
    elif x in ('', ' '):
        return None
    else:
        try:
            return int(float(x))
        except:
            return None


def float_or_None(x):
    """
    A little helper function to return an float from our record or
    None if it is an empty string.

    Arguments:
    - `x`: the value returned from database row e.g. record.get('x')
    """

    if x is None:
        return None
    elif x in ('', ' '):
        return None
    else:
        try:
            return float(x)
        except:
            return None


def get_mark_codes(mark_string, valid_marks):
    """This function takes an mark string and returns all of the
    individual, valid marks found in that string.

    The return value of this function is a dictionary. If the mark
    string can be parsed without issue, the return value includes
    nothing but a list of valid mark abbreviations.  If there is a
    problem with the mark_string, the returned dictionary will include
    a second element 'unmatched' that will incude a string the same
    length as mark string with those letters that match a known mark
    replaced with '-'.  If parts of mark string are matched more than
    once, the return string will be entirely dashes.

    'ADRP' becomes ['AD', 'RP']
    'ADRPFOO' becomes ['AD', 'RP'] and '----FOO'

    'ADOX' becomes ['AD', 'OX'] and '----' because 'DO' is matched
    twice (AD, DO and OX) and the fin clips are ambiguous

    Arguments:

    - `mark_string`: a mark string as found in the GLFC stocking
      databsae (e.g. - 'ADRP', 'RP')

    - `valid_marks`: a list of valid marks to check mark_string against

    """
    problem = False
    return_dict = {}

    if mark_string is None or mark_string == '':
        return return_dict

    matches = [
        re.search(x, mark_string) for x in valid_marks
        if re.search(x, mark_string)
    ]
    if matches:
        codes = [x.group() for x in matches]
        return_dict['codes'] = codes
        spans = [x.span() for x in matches]
        spans.sort()
        first_match = spans[0][0]
        last_match = spans[-1][1]
        problem = True if first_match is not 0 else False
        problem = True if last_match is not len(mark_string) else False
        if len(codes) > 2 and problem is False:
            for n, m in enumerate(spans[-1]):
                if problem:
                    break
                else:
                    problem = True if spans[n][1] != spans[n + 1][0] else False

    #if there is problem - try and figure out what it is:
        if problem:
            for k in valid_marks:
                mark_string = mark_string.replace(k, '-' * len(k))
            return_dict['unmatched'] = mark_string
    return return_dict


def pprint_dict(record):
    """
    Pretty print a dictionary (usually created from a row returned by a
    pyodbc query).  Each field is printed on a line in the form:

        <fieldname>: <value>

    Arguments:
    - `recory`: a dictionary

    """
    for col, val in record.items():
        print('{}: {}'.format(col, val))


def get_lake_abbrev(record):
    """A helper function used by get_latlon()

    Arguments:
    - `record`:
    """
    lake = record.get('lake')
    if lake:
        lake = lake.strip()
        if len(lake) > 2:
            return lake[:2].upper()
        else:
            return lake.upper()
    else:
        return None


def get_latlon(record, grid_pts=None, mu_pts=None, lake_pts=None):
    """
    Given a stocking event, generate a reasonable lat-lon using the
    following hierarchy:

    - if ddlat and ddlon are present, return them

    - otherwise use lat-lon from grid centroid

    - else use centroid of management unit

    - else use the centroid of the lake

    - else return an empty dictionary and print an error message.

    returns a dictionary with ddlat, ddlon and flag indicating how the
    point was derived.

    """

    pt = None

    if record['latitude'] and record['longitude']:
        pt = OrderedDict(
            ddlat=record['latitude'],
            ddlon=record['longitude'],
            method='reported',
            value=1)
    if record['lake'] and record['grid'] and grid_pts and pt is None:
        #lake = record['lake'].strip()
        lake = get_lake_abbrev(record)
        grid_no = int(record['grid'])
        pt = grid_pts.get(lake).get(grid_no)
        if pt:
            pt = pt._asdict()
            pt['method'] = 'grid centroid'
            pt['value'] = 4

    if record['stat_dist'] and mu_pts and pt is None:
        mu = record['stat_dist'].strip()
        pt = mu_pts.get(mu)
        if pt:
            pt = pt._asdict()
            pt['method'] = 'mu centroid'
            pt['value'] = 5

    if record['lake'] and lake_pts and pt is None:
        #lake = record['lake'].strip()
        lake = get_lake_abbrev(record)
        pt = lake_pts.get(lake)
        if pt:
            pt = pt._asdict()
            pt['method'] = 'lake centroid'
            pt['value'] = 6

    if pt is None:
        msg = "No spatial information found for record {}"
        print(msg.format(record['stock_id']))

    return pt


def associate_cwt(event,
                  cwt_number,
                  seq_start=1,
                  seq_end=1,
                  cwt_maker='nmt',
                  tag_count=0):
    """Given a stocking event, get or create an associated cwt and
    cwt_sequence object and save them to the database.

    Arguments:

    - `event`:  a django orm object representing a stocking event

    - `cwt_number`: a string representing a cwt number to associate
      with the current stocking event

    - `seq_start`: first sequential cwt number in range for this cwt
                 number.  Always 1 for regular cwts.

    - `seq_end`: last sequential cwt number in range for this cwt
                 number.  Always 1 for regular cwts.

    - `cwt_maker`: abbreviation for cwt manufacturer - nmt by default.

    - `cwt_count`: the number of indivual cwt's with this same cwt
    number Usually cwt are created in multiple of 10,000.  Not sure if we
    can populate this here or not.

    """

    if seq_start == 1 and seq_end == 1:
        tag_type = 'cwt'
    else:
        tag_type = 'sequential'

    cwt_obj, x = CWT.objects.get_or_create(
        cwt_number=cwt_number.strip(),
        tag_count=tag_count,
        manufacturer=cwt_maker,
        tag_type=tag_type)

    cwt_seq, x = CWTsequence.objects.get_or_create(
        cwt=cwt_obj, seq_start=seq_start, seq_end=seq_end)

    event.cwt_series.add(cwt_seq)


def recode_mark(mark, mark_shouldbe, no_mark='XX'):
    """A little helper function to remap clips to standard values that can
    then be parsed.

    Replaces BP with LPRP so ADBP becomes ADLPRP.

    Arguments:
    - `mark`: A mark string returned by the glfc database.

    - `mark_shouldbe`: a dictionary mapping values that are known to
      be ambiguous to their unambiguous counterpart

    - `no_mark`: the string to be used to represent records without
    any marking information.

    """
    mark = no_mark if (mark is None or mark is '') else mark
    for key, val in mark_shouldbe.items():
        mark = mark.replace(key, val)
    tmp = mark_shouldbe.get(mark)
    if tmp:
        return tmp
    else:
        return mark


def check_null_records(field, table, cursor, record_count, report_width):
    """for for null records in the field <field> in the table <table>.
    Used by the script "check_stocking_data.py"

    Arguments:
    - `field`:
    - `table`:
    - `cursor`:
    - `record_count`:

    """

    sql = "select stock_id from [{}] where [{}] is null or [{}]='';"

    cursor.execute(sql.format(table, field, field))
    rs = cursor.fetchall()

    if len(rs):
        missing = [str(x[0]) for x in rs[:record_count]]
        msg = "Oh-oh! Found records where {} is null or empty(n={}) for example:\n\t"
        msg = msg.format(field, len(rs)) + ',\n\t'.join(missing)

    else:
        msg = "Checking for records with null or empty {}".format(field)
        msg = '{msg:.<{width}}OK'.format(width=report_width, msg=msg)
    print(msg)


def get_or_create_rawStrain(species, raw_strain):
    """The strain values that are provided to the glfc, are free-form
    text, which means that there is almost infinite number
    possibilities.  This function tries to get the associated strain,
    given the speceis and strain string. If it does not exist, it will
    get or greate an unknown/undocumented strain object and use that
    as the strain for this instance.

    Arguments:
    - `species`:
    - `rawstrain`:

    """

    raw_strain = raw_strain if raw_strain else 'UNKN'

    try:
        mystrain = StrainRaw.objects.get(
            species=species, raw_strain=raw_strain)
    except StrainRaw.DoesNotExist:
        unknown_strain, created = Strain.objects.get_or_create(
            strain_species=species, strain_code='UNKN', strain_label='Unknown')
        mystrain = StrainRaw(
            species=species, strain=unknown_strain, raw_strain=raw_strain)
        unknown_strain.save()
        mystrain.save()

    return mystrain


def get_closest_ManagementUnit(event):
    """This funtion can be used to get the closest primary management unit
    for each stocking event.  It to find the management unit, it steps
    through a heuristic - if there is a lat-long, it is used if it
    intersects a management geomemtry, if not, it uses the centriod of
    the associated 10-minute grid, finally it uses the closest
    management unit. This last case is for those event that occur
    outside of a lake shoreline (e.g. - up tributaries).  There could
    be edge cases were this is not appropriate.

    This function should be called after all of the stocking events
    have been added to the database and the shapefiles have been
    uploaded to each of the grids and management units.

    This funciton is woefully inefficient - it should only run once
    after all of the management unit geometries have been uploaded and
    the stocking events appended.

    Arguments:
    - `event`:

    """

    # find management unit for points that fall within mu geometry

    mu = ManagementUnit.objects.filter(
        geom__contains=event.geom, primary=True).first()

    if mu is None:
        mu = ManagementUnit.objects.filter(
            geom__contains=event.grid_10.centroid, primary=True).first()

    if mu is None:
        mus = ManagementUnit.objects.filter(lake=event.lake, primary=True).\
            exclude(geom__isnull=True)
        mu_dist = []
        for mu in mus:
            mu_dist.append((mu.slug, event.geom.distance(mu.geom)))
        closest = min(mu_dist, key=lambda d: d[1])
        mu = ManagementUnit.objects.filter(slug=closest[0]).first()

    return mu


#  #=====================================================
#
#  # functions below this points were originally written to work with the
#  # lake mich-huron cwt project - are not needed in our application.
#
#
#
#
#  #get_mark_codes('AD', clips)
#  #get_mark_codes('RPAD', clips)
#
#
#
#  def clip_to_mark(clipc, clip_dict):
#      """A helper function to map OMNR fin Clips to US Mark eqivalents takes
#      an omnr fin clip and returns a string containing the equivalent US
#      marks.
#
#      15 becomes RPAD
#      23 becomes LPRV
#
#      Arguments:
#      - `clipc`:
#      - `clip_dict`:
#
#      """
#      if clipc is None:
#          return None
#      marks = []
#      for x in clipc:
#          marks.append(clip_dict.get(x))
#      marks = [x for x in marks if x is not None]
#      return ''.join(marks)
#
#
#
#
#
#
#
#
#
#
#
#
#
#
#
#  def sanitize_sql(sql):
#      """A little helper function to take sqlite/sqlalchemy table
#      definitions and convert them to sql statements that access
#      understands.
#
#      Arguments:
#      - `sql`: the sql string that needs to be sanitized
#
#      """
#
#      import re
#
#      #  'sqlite':'ms_access'
#      sanitize_dict = {
#          '\tdate': '\t[date]',
#          'BOOLEAN': 'YESNO',
#          #',( )\n\tCHECK (.)*':'',
#          '\n\tCHECK\s*(.)*': '',
#          'value': '[value]',
#          '\),\s*\n\)': ')\n)' #trailing comma
#      }
#
#      for k,v in sanitize_dict.items():
#          sql = re.sub(k,v, sql)
#
#      #removing the trailing comma's doesn't seem to work when we
#      #include it in the dictionary:
#      sql = re.sub('\),\s*\n\)', ')\n)', sql)
#
#      #access has a limit of 255 for varchar fields.
#      pattern = r'VARCHAR\((\d+)\)'
#      for m in re.finditer(pattern,sql):
#          if int(m.groups()[0]) > 255:
#              sql = sql.replace(m.group(), 'VARCHAR(255)')
#
#      return sql
#
#
#  def pretty_cwt(cwt_num):
#      """Take a cwt number 635901 and return "63-59-01"
#
#      Arguments:
#      - `cwt_num`:
#      """
#      x = [cwt_num[i:i+2] for i in range(0, len(cwt_num), 2)]
#      return '-'.join(x)
#
#
#
#
#  def get_one_or_create(session,
#                        model,
#                        create_method='',
#                        defaults=None,
#                        **kwargs):
#      """A little helper for sqlalchemy
#      from:http://stackoverflow.com/questions/2546207
#
#      Given the session, model and kwargs, get the matching object, or
#      create one if it does not exist.
#      """
#
#      try:
#          return session.query(model).filter_by(**kwargs).one(), True
#      except NoResultFound:
#          kwargs.update(defaults or {})
#          created = getattr(model, create_method, model)(**kwargs)
#          try:
#              session.add(created)
#              session.flush()
#              return created, False
#          except IntegrityError:
#              session.rollback()
#              return session.query(model).filter_by(**kwargs).one(), True
#
#
#
#  def associate_cwt(session, event, cwt_number, seq_start=1, seq_end=1,
#                    cwt_maker='NMT', commit=False):
#      """Given a stocking event, get or create an associated cwt and
#      cwt_sequence object and save them to the database.
#
#      Arguments:
#      - `sesson`: a sqlalchemy session
#
#      - `event`:  a sqlalchemy object representing a stocking event
#
#      - `cwt_number`: a string representing a cwt number to associate
#        with the current stocking event
#
#      - `seq_start`: first sequential cwt number in range for this cwt
#                   number.  Always 1 for regular cwts.
#
#      - `seq_end`: last sequential cwt number in range for this cwt
#                   number.  Always 1 for regular cwts.
#
#      - `cwt_maker`: abbreviation for cwt manufacturer - NWT by default.
#
#      """
#
#      maker = session.query(TagManufacturer).filter_by(abbrev='NMT').one()
#      if seq_start==1 and seq_end==1:
#          tag_type = 'cwt'
#      else:
#          tag_type = 'sequential'
#
#      cwt_defaults = {'maker': maker,
#                      'tag_type': tag_type,
#                      'tag_reused':False}
#      cwt_obj,x = get_one_or_create(session, CWT, defaults=cwt_defaults,
#                                    cwt_number=cwt_number.strip(),
#                                    agency=event.agency)
#      cwt_seq,x = get_one_or_create(session, CWT_sequence, cwt=cwt_obj,
#                                        seq_start=seq_start, seq_end=seq_end)
#      event.cwt_sequences.append(cwt_seq)
#      session.add_all([event, cwt_obj, cwt_seq])
#      if commit:
#          session.commit()
#      return session
#
#
#
#
#
#  def get_stockingmethod(stk_meth, session):
#      """ a little helper function to get the appropriate stocking_method.
#
#      Arguments:
#      - `abbrev`: abbreviation for the stocking_method ('b', 't', 's')
#      - `session` - sqlalchemy session used to connect to target database
#      """
#      stk_meth = 'u' if (stk_meth == '' or stk_meth is None) else stk_meth
#      #make it lower case and remove any leading or trailing whitespace
#      stk_meth = stk_meth.lower().strip()
#      try:
#          stocking_method = session.query(StockingMethod). \
#                            filter_by(stk_meth=stk_meth).one()
#          return stocking_method
#      except (MultipleResultsFound, NoResultFound) as e:
#          msg = "StockingMethod: {} with abbrev='{}'".format(e, stk_meth)
#          print(msg)
#
#
#  def get_condition(condition, session):
#      """ a little helper function to get the appropriate condition.
#
#      Arguments:
#      - `condition`: abbreviation for the condition ('e', 'ff')
#      - `session` - sqlalchemy session used to connect to target database
#      """
#      if condition is None or condition=='':
#          return None
#
#      condition = str(condition)
#      condition = condition.strip()
#      try:
#          _condition = session.query(Condition).filter_by(
#              condition=condition).one()
#          return _condition
#      except (MultipleResultsFound, NoResultFound) as e:
#          msg = "Condition: {} with abbrev='{}'".format(e, condition)
#          print(msg)
#
#
#  def get_lifestage(abbrev, session):
#      """ a little helper function to get the appropriate lifestage.
#
#      Arguments:
#      - `abbrev`: abbreviation for the lifestage ('e', 'ff')
#      - `session` - sqlalchemy session used to connect to target database
#      """
#      if abbrev == '':
#          return None
#      abbrev = abbrev.lower()
#      try:
#          lifestage = session.query(LifeStage).filter_by(abbrev=abbrev).one()
#          return lifestage
#      except (MultipleResultsFound, NoResultFound) as e:
#          msg = "LifeStage: {} with abbrev='{}'".format(e, abbrev)
#          print(msg)
#
#
#  def get_statdist(mu, lake_id, session):
#      """a little helper function to get the appropriate management
#      unit/statistical district.
#
#      Arguments:
#      - `abbrev`: abbreviation for management unit ('MM4', 'OH3')
#      - `session` - sqlalchemy session used to connect to target database
#
#      """
#      if mu in ('', None):
#          return None
#      else:
#          try:
#              statdist = session.query(StatDistrict).join(Lake).\
#                         filter(StatDistrict.stat_dist==mu).\
#                         filter(Lake.id==lake_id).one()
#              return statdist
#          except (MultipleResultsFound, NoResultFound) as e:
#              msg = "StatDistrict: {} for management unit ='{}' on {}"
#              print(msg.format(e, mu, lake))
#
#
#  def get_stateprov(abbrev, session):
#      """ a little helper function to get the appropriate state/province.
#
#      Arguments:
#      - `abbrev`: abbreviation for juristiction ('ON', 'MI')
#      - `session` - sqlalchemy session used to connect to target database
#      """
#      abbrev = abbrev.strip()
#      try:
#          stateprov = session.query(StateProvince).filter_by(abbrev=abbrev).one()
#          return stateprov
#      except (MultipleResultsFound, NoResultFound) as e:
#          msg = "StateProvince: {} with abbrev='{}'".format(e, abbrev)
#          print(msg)
#
#
#
#  def get_finclip(clip_label, session):
#      """ a little helper function to get the appropriate FinClip object.
#
#      Arguments:
#      - `clip_label`: US fin clip label ('LP', 'RP', 'LPAD')
#      - `session` - sqlalchemy session used to connect to target database
#      """
#      try:
#          clip = session.query(FinClip).filter_by(clip_label=clip_label).one()
#          return clip
#      except (MultipleResultsFound, NoResultFound) as e:
#          msg = "FinClip: {} with abbrev='{}'".format(e, clip_label)
#          print(msg)
#
#
#  #def get_lake(x, session):
#  #    """ a little helper function to get the appropriate lake object.
#  #
#  #    Arguments:
#  #    - `x`: lake abbreviation ('HU', 'MI', 'SU') or label ('Huron', 'Michigan')
#  #    - `session` - sqlalchemy session used to connect to target database
#  #    """
#  #    try:
#  #        lake = session.query(Lake).filter(or_(Lake.abbrev==x,
#  #                                              Lake.label==x)).one()
#  #        return lake
#  #    except (MultipleResultsFound, NoResultFound) as e:
#  #        msg = "Lake: {} with abbrev='{}'".format(e, abbrev)
#  #        print(msg)
#
#
#  def get_agency(abbrev, session):
#      """ a little helper function to get the appropriate agency object.
#
#      Arguments:
#      - `abbrev`: agency abbreviation (eg - 'OMNR')
#      - `session` - sqlalchemy session used to connect to target database
#      """
#      try:
#          agency = session.query(Agency).filter_by(abbrev=abbrev).one()
#          return agency
#      except (MultipleResultsFound, NoResultFound) as e:
#          msg = "Agency: {} with abbrev='{}'".format(e, abbrev)
#          print(msg)
#
#
#  def get_spc(abbrev, session):
#      """ a little helper function to get the appropriate species from a record
#      return from the US stocking database.
#
#      Arguments:
#      - `abbrev`: species abbreviation (eg - 'LAT')
#      - `session` - sqlalchemy session used to connect to target database
#      """
#      abbrev = abbrev.strip()
#      try:
#          species = session.query(Species).filter_by(abbrev=abbrev).one()
#          return species
#      except (MultipleResultsFound, NoResultFound) as e:
#          msg = "Species: {} with abbrev='{}'".format(e, abbrev)
#          print(msg)
#
#
#  def get_spc_from_code(species_code, session):
#      """ a little helper function to get the appropriate species from a record
#      return from the US stocking database given an (Ontario) species code.
#
#      Arguments:
#      - `abbrev`: species abbreviation (eg - 'LAT')
#      - `session` - sqlalchemy session used to connect to target database
#      """
#      spc_code = int(species_code)
#      try:
#          species = session.query(Species).filter_by(species_code=spc_code).one()
#          return species
#      except (MultipleResultsFound, NoResultFound) as e:
#          msg = "Species: {} with species_code='{}'".format(e, spc_code)
#          print(msg)
#
#
#
#  def get_spc_from_common(speciescommon, session):
#      """a little helper function to get the appropriate species from a
#      record return from the US stocking database given an GLFC/USFWS
#      common species code.
#
#      Arguments:
#      - `abbrev`: species abbreviation (eg - 'LAT')
#      - `session` - sqlalchemy session used to connect to target database
#
#      """
#      try:
#          species = session.query(Species).filter_by(speciescommon=speciescommon)\
#                                          .one()
#          return species
#      except (MultipleResultsFound, NoResultFound) as e:
#          msg = "Species: {} with species common='{}'".format(e, spc_code)
#          print(msg)
#
#
#
#
#
#  def get_rawstrain(raw_strain_code, species_id, session):
#      """ a little helper function to get the raw strain from a record
#      returned from the US stocking database.
#
#      Arguments:
#      - `raw_strain_code`: the strain code provided in the glfc stocking data
#      - `species` - a species object returned by get_spc()
#      - `session` - sqlalchemy session used to connect to target database
#      """
#      strain_code = '' if raw_strain_code is None else raw_strain_code.strip()
#      try:
#          rawstrain = session.query(StrainRaw).join(Species).\
#                      filter(StrainRaw.raw_strain_code==strain_code.upper()).\
#                      filter(Species.id==species_id).one()
#          return rawstrain
#      except (MultipleResultsFound, NoResultFound) as e:
#          species = session.query(Species).filter(Species.id==species_id).one()
#          msg = "StrainRaw: {} for {} with raw_strain_code='{}'"
#          print(msg.format(e, species, strain_code))
#
#
#
#  # def get_lifestage(abbrev, session):
#  #     """a little helper function to get the appropriate lifestage for a
#  #     stocking event returned from the US stocking database.
#  #
#  #     Arguments:
#  #     - `abbrev`: lifestage abbreviation (eg - 'y', 'ff', 'fry', 'e')
#  #     - `session` - sqlalchemy session used to connect to target database
#  #     """
#  #     try:
#  #         stage = session.query(LifeStage).filter_by(abbrev=abbrev).one()
#  #         return stage
#  #     except (MultipleResultsFound, NoResultFound) as e:
#  #         msg = "{} with abbrev='{}'".format(e, abbrev)
#  #         print(msg)
#  #
#
#
#
#
#
#  def get_recovery_effort(liftid, agency_id, session):
#      """a little helper function to get the appropriate recovery effort
#
#      Arguments:
#
#      - `liftid`: the unique lift identifier for a net/sampling effort
#      associated with a cwt recovery.
#
#      - `agency` - the sqlalchemy representation of an agecy object.
#
#      - `session` -  sqlalchemy session used to connect to target database
#
#      """
#      try:
#          recovery_effort = session.query(RecoveryEffort).filter_by(
#              lift_identifier=liftid).filter(Agency.id==agency_id).one()
#          return recovery_effort
#      except (MultipleResultsFound, NoResultFound) as e:
#          msg = "Recovery_Effort: {} for lift_identifier={} by agency {}"
#          print(msg.format(e, liftid, agency))
#
#
#  #================================================
#  #   Variable Lookup maps:
#
#  def get_lake_map(session):
#      """Queries the database(session) and returns a dictionary of lake
#      abbreviations and labels and the associated primary key from the
#      Lake table.  Used to populate foreign keys to lake table when
#      records are created.  Saves repeated calls to database.  The
#      returned dictionary is of the form:
#
#      {'HU': 1,
#      'Huron': 1,
#      'MI': 3,
#      'Michigan': 3}
#
#      Arguments:
#      - `session`:
#
#      """
#      lakes = session.query(Lake).all()
#      lake_map = {x.abbrev:x.id for x in lakes}
#      tmp = {x.label:x.id for x in lakes}
#      lake_map.update(tmp)
#
#      return lake_map
#
#  def get_lifestage_map(session):
#      """Queries the database(session) and returns a dictionary of lifestage
#      abbreviations and id numbers.  Used to populate
#      foreign keys to lifestage table when records are created.  Saves
#      repeated calls to database.  The returned dictionary is of the
#      form:
#
#      {'a': 1, 'e': 2, 'f': 3, 'ff': 4}
#
#      Arguments:
#      - `session`:
#
#      """
#      lifestages = session.query(LifeStage).all()
#      lifestage_map = {x.abbrev:x.id for x in lifestages}
#      return lifestage_map
#
#
#  def get_latlonflag_map(session):
#      """Queries the database(session) and returns a dictionary of latlong flag
#      values and associated primary keys.  Used to populate
#      foreign keys to latlongflag table when records are created.  Saves
#      repeated calls to database.  The returned dictionary is of the
#      form:
#
#      {1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6}
#
#      NOTE: in the example above, the flag is identical ti the primary
#      key value. This may not always be the case.
#
#      Arguments:
#      - `session`:
#
#      """
#      latlonflags = session.query(LatLonFlag).all()
#      latlonflag_map = {x.value:x.id for x in latlonflags}
#      return latlonflag_map
#
#
#
#  def get_stateprov_map(session):
#      """Queries the database(session) and returns a dictionary of state
#      and province abbreviations and id numbers.  Used to populate
#      foreign keys to state_province table when records are created.
#      Saves repeated calls to database.  The returned dictionary is of
#      the form:
#
#      {'IL': 1,
#      'IN': 2,
#      'MI': 3,
#      'MN': 4}
#
#      Arguments:
#      - `session`:
#      """
#
#      stateprovs = session.query(StateProvince).all()
#      stateprov_map = {x.abbrev:x.id for x in stateprovs}
#      return stateprov_map
#
#
#  def get_condition_map(session):
#      """Queries the database(session) and returns a dictionary of
#      condition values and their associated id numbers.  Used to
#      populate foreign keys to condition table when records are
#      created.  Saves repeated calls to database.  The returned
#      dictionary is of the form:
#
#      {0: 1, 1: 2, 2: 3}
#
#      (by coincidence, the ID are exactly 1 more than the condition
#      value in the current database - this may not always be the case).
#
#      Arguments:
#      - `session`:
#
#      """
#      conditions = session.query(Condition).all()
#      condition_map = {x.condition:x.id for x in conditions}
#      return condition_map
#
#
#  def get_stocking_method_map(session):
#      """Queries the database(session) and returns a dictionary of
#      stocking methods and their associated id numbers.  Used to
#      populate foreign keys to stocking_method table when records are
#      created.  Saves repeated calls to the database.  The returned
#      dictionary is of the form:
#
#      {'a': 1,
#      'atv': 10,
#      'b': 2,
#      'bp': 3,
#      'i': 4}
#
#      Arguments:
#      - `session`:
#      """
#      stockingmethods = session.query(StockingMethod).all()
#      stockingmethod_map = {x.stk_meth:x.id for x in stockingmethods}
#      return stockingmethod_map
#
#
#  def get_agency_map(session):
#      """Queries the database(session) and returns a dictionary of
#      agency abbreviations and their associated id numbers.  Used to
#      populate foreign keys to agency table when records are
#      created.  Saves repeated calls to the database.  The returned
#      dictionary is of the form:
#
#      {
#      'CORA': 1,
#      'GLIFWC': 2,
#      'GTB': 25,
#      'ILDNR': 3,
#      'INDNR': 4,
#      'KBB': 5,
#      'LRB': 21,}
#
#      Arguments:
#      - `session`:
#      """
#
#      agencies = session.query(Agency).all()
#      agency_map = {x.abbrev:x.id for x in agencies}
#      return agency_map
#
#
#  def get_statdist_map(session):
#      """Queries the database(session) and returns a dictionary of
#      statistical district/management unit abbreviations and their
#      associated id numbers.  Used to populate foreign keys to statdistrict
#      table when records are created.  Saves repeated calls to the
#      database.  The returned dictionary is of the form:
#
#      {
#      'IND': 6,
#      'M1': 7,
#      'M2': 8,
#      'M3': 9,
#      'MH1': 10,
#      'MH2': 11,
#      'MH3': 12,
#      'MH4': 13,
#      'MH5': 14,
#      }
#
#      Arguments:
#      - `session`:
#      """
#
#      statdistricts = session.query(StatDistrict).all()
#      statdist_map = {x.stat_dist:x.id for x in statdistricts}
#      return statdist_map
#
#
#  def get_species_map(session):
#      """Queries the database(session) and returns a dictionary of
#      species codes, abbrebiations and common numbers, and their
#      associated id numbers.  Used to populate foreign keys to species
#      table when records are created.  Saves repeated calls to the
#      database.  The returned dictionary is of the form:
#
#      {
#      271: 29,
#      'LWF': 15,
#      '1701400202': 24,
#      '1231202102': 28,
#      'HSF': 21,
#      30: 2,
#      }
#
#      Note  - three different sets of keys are included in the returned
#      dictionary.  querying 'LAT', 81 or 1230101098 will all return the
#      primary_key for lake trout in the species table.
#
#      Arguments:
#      - `session`:
#
#      """
#      #species_map includes both US and Canadian Keys pointing to same
#      #species record:
#      species = session.query(Species).all()
#      species_map = {x.species_code:x.id for x in species}
#      tmp = {x.speciescommon:x.id for x in species}
#      species_map.update(tmp)
#      tmp = {x.abbrev:x.id for x in species}
#      species_map.update(tmp)
#      return species_map
#
#
#
#  def check_for_DB(db):
#      """
#
#      Arguments:
#      - `db`:
#      """
#      import os
#      import sys
#
#      if not os.path.isfile(db):
#          msg = ("Unable to find sqlite database. " +
#                 " Have you run 'build_and_fill_lookups.py?'")
#          sys.exit(msg)
