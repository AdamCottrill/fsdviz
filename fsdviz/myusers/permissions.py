"""
=============================================================
 c:/1work/fsdviz/fsdviz/myusers/permissions.py
 Created: 17 Nov 2020 16:48:20

 DESCRIPTION:



 A. Cottrill
=============================================================
"""


def user_can_create_edit_delete(user, obj):
    """A simple function to see if a user is authorized to create, edit,
    or update events or upload event objects.  Great Lakes stocking
    Coordinator (based at USWFS Green Bay Office) can create, edit, or
    delete anyone's event (True).  Agency Stocking Corrdinaors are only able
    to create, edit, or delete there own events (True),  Other users cannot (False).

    Arguments:
    - `user`: a django user object

    - `obj`: either a stocking event or stocking event uploads object

    """

    if not hasattr(user, "role"):
        return False

    if type(obj) is dict:
        lake = obj.get("lake", "")
        agency = obj.get("agency", "")
    else:
        lake = obj.lake
        agency = obj.agency

    if user.role == "glsc":
        return True
    elif user.role == "asc" and agency == user.agency and lake in user.lakes.all():
        return True
    else:
        return False
