# AGV Chassis — Fusion 360 generator script
# Run inside Fusion 360: Tools > Add-ins > Scripts > + (create) > paste this file > Run
# All parameters in mm at the top — edit and re-run to tweak.
# Produces two bodies: "Chassis_Tub" and "Top_Plate" (removable top).
# Coordinates: X = length (front wall at x=0), Y = width, Z = up (floor underside = 0).
# NOTE: front/rear wall cutouts assume the YZ plane extrudes toward +X.
#       If the ultrasonic/camera/LED cutouts are missing, flip the offsets:
#       front -1 -> WALL+1, rear L-WALL-1 -> L+1.

import adsk.core, adsk.fusion

app = adsk.core.Application.get()
ui = app.userInterface
design = app.activeProduct
root = design.rootComponent

# ---------------- PARAMETERS (mm) ----------------
L, W        = 203.2, 101.6      # footprint 8" x 4"
WALL        = 2.5               # wall thickness
FLOOR_T     = 2.5               # floor thickness
INNER_H     = 45.0              # interior height above floor
TOP_T       = 2.5               # top plate thickness
H           = FLOOR_T + INNER_H # tub top (47.5)

AXLE_X      = L / 2.0           # motor axle line, centered
WHEEL_SLOT_W, WHEEL_SLOT_TOP = 30.0, 42.0

US_W, US_Z0, US_Z1    = 22.0, 8.0, 22.0    # ultrasonic window (front)
CAM_W, CAM_Z0, CAM_Z1 = 12.0, 26.0, 38.0   # camera window (front)
LED_D, LED_Z          = 5.2, 15.0
LED_Y_OFF             = 30.0

OLED_W, OLED_L, OLED_X0 = 12.0, 24.0, 14.0 # top plate OLED window

BATT_L, BATT_W, BATT_H = 58.0, 56.0, 32.0  # battery bay
BATT_X0               = 115.0
BOSS_D, PILOT_D, SCREW_D = 7.0, 2.5, 3.4
BOSS_XY               = 6.0
BOSS_H, PILOT_H       = 12.0, 10.0        # boss stand-off height / pilot depth

# ---------------- helpers ----------------
MM = 0.1
def V(mm):   return adsk.core.ValueInput.createByReal(mm * MM)
def P(u, v): return adsk.core.Point3D.create(u * MM, v * MM, 0)

def rect_sketch(plane, u0, v0, u1, v1):
    sk = root.sketches.add(plane)
    ls = sk.sketchCurves.sketchLines
    pts = [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)]
    for i in range(4):
        ls.addByTwoPoints(pts[i], pts[(i + 1) % 4])
    return sk

def circle_sketch(plane, u, v, r):
    sk = root.sketches.add(plane)
    # NOTE: the API method is addByCenterRadius, not addByRadius.
    sk.sketchCurves.sketchCircles.addByCenterRadius(P(u, v), r * MM)
    return sk

def off_plane(base, mm_off):
    return root.constructionPlanes.addByOffset(base, V(mm_off))

NEW  = adsk.fusion.FeatureOperations.NewBodyFeatureOperation
JOIN = adsk.fusion.FeatureOperations.JoinFeatureOperation
CUT  = adsk.fusion.FeatureOperations.CutFeatureOperation

def extrude(sk, mm_dist, op=NEW):
    # createInput needs a single Profile (or ObjectCollection), not the
    # whole sk.profiles container.
    prof = sk.profiles.item(0)
    inp = root.features.extrudeFeatures.createInput(prof, op)
    # ExtrudeFeatureInput has no writable .distance property — use
    # setOneSideExtent with a DistanceExtentDefinition instead.
    ext_def = adsk.fusion.DistanceExtentDefinition.create(V(mm_dist))
    inp.setOneSideExtent(ext_def, adsk.fusion.ExtentDirections.PositiveExtentDirection)
    return root.features.extrudeFeatures.add(inp).bodies[0]

def combine(target, tools, op):
    # toolBodies must be an ObjectCollection, not a plain Python list.
    tool_collection = adsk.core.ObjectCollection.create()
    for t in tools:
        tool_collection.add(t)
    inp = root.features.combineFeatures.createInput(target, tool_collection)
    inp.operation = op
    return root.features.combineFeatures.add(inp)

xy = root.xYConstructionPlane
yz = root.yZConstructionPlane

try:
    # ---------------- tub ----------------
    tub = extrude(rect_sketch(xy, 0, 0, L, W), H)
    cavity = extrude(rect_sketch(off_plane(xy, FLOOR_T), WALL, WALL, L - WALL, W - WALL), INNER_H + 1)

    # wheel slots through side walls
    wl = extrude(rect_sketch(off_plane(xy, -1), AXLE_X - WHEEL_SLOT_W/2, -1,
                             AXLE_X + WHEEL_SLOT_W/2, WALL + 0.5), WHEEL_SLOT_TOP + 1)
    wr = extrude(rect_sketch(off_plane(xy, -1), AXLE_X - WHEEL_SLOT_W/2, W - WALL - 0.5,
                             AXLE_X + WHEEL_SLOT_W/2, W + 1), WHEEL_SLOT_TOP + 1)

    # motor zip-tie strap slots through floor
    motor_y0, motor_y1 = W/2 - 35, W/2 + 35
    strap_tools = []
    for sx in (AXLE_X - 12.5, AXLE_X + 9.5):
        for sy in (motor_y0 + 6, motor_y1 - 6):
            strap_tools.append(extrude(rect_sketch(off_plane(xy, -1), sx, sy - 4, sx + 3, sy + 4), FLOOR_T + 2))

    # front wall windows
    us  = extrude(rect_sketch(off_plane(yz, -1), W/2 - US_W/2, US_Z0, W/2 + US_W/2, US_Z1), WALL + 2)
    cam = extrude(rect_sketch(off_plane(yz, -1), W/2 - CAM_W/2, CAM_Z0, W/2 + CAM_W/2, CAM_Z1), WALL + 2)

    # LED holes, front & rear
    led_tools = []
    for lx in (-1, L - WALL - 1):
        for ly in (W/2 - LED_Y_OFF, W/2 + LED_Y_OFF):
            led_tools.append(extrude(circle_sketch(off_plane(yz, lx), ly, LED_Z, LED_D/2), WALL + 2))

    # battery bay partition walls with wiring gap
    batt_tools = []
    for bx in (BATT_X0, BATT_X0 + BATT_L - 2):
        for seg in ((W/2 - BATT_W/2, W/2 - 10), (W/2 + 10, W/2 + BATT_W/2)):
            batt_tools.append(extrude(rect_sketch(off_plane(xy, FLOOR_T), bx, seg[0], bx + 2, seg[1]), BATT_H))

    # corner screw bosses (joined stand-offs) + pilot holes (cut through them)
    boss_tools, pilot_tools = [], []
    corners = [(BOSS_XY, BOSS_XY), (L - BOSS_XY, BOSS_XY), (BOSS_XY, W - BOSS_XY), (L - BOSS_XY, W - BOSS_XY)]
    for bx, by in corners:
        boss_tools.append(extrude(circle_sketch(off_plane(xy, H - BOSS_H), bx, by, BOSS_D/2), BOSS_H))
        # pilot starts at the same height as the boss but overshoots the top
        # by 1mm so the cut cleanly breaks through the boss face.
        pilot_tools.append(extrude(circle_sketch(off_plane(xy, H - PILOT_H), bx, by, PILOT_D/2), PILOT_H + 1))

    combine(tub, batt_tools + boss_tools, JOIN)
    combine(tub, [cavity, wl, wr, us, cam] + strap_tools + led_tools + pilot_tools, CUT)
    tub.name = "Chassis_Tub"

    # ---------------- removable top plate ----------------
    top = extrude(rect_sketch(off_plane(xy, H), 0, 0, L, W), TOP_T)
    oled = extrude(rect_sketch(off_plane(xy, H - 1), OLED_X0, W/2 - OLED_W/2,
                               OLED_X0 + OLED_L, W/2 + OLED_W/2), TOP_T + 2)
    hole_tools = []
    for bx, by in corners:
        hole_tools.append(extrude(circle_sketch(off_plane(xy, H - 1), bx, by, SCREW_D/2), TOP_T + 2))
    combine(top, [oled] + hole_tools, CUT)
    top.name = "Top_Plate"

    ui.messageBox("AGV chassis generated: Chassis_Tub + Top_Plate")
except Exception as e:
    ui.messageBox("AGV chassis script failed:\n" + str(e))