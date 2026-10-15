# AGV Chassis — Fusion 360 generator script
# Run inside Fusion 360: Tools > Add-ins > Scripts > + (create) > paste this file > Run
# All parameters in mm at the top — edit and re-run to tweak.
# Produces two bodies: "Chassis_Tub" and "Top_Plate" (removable top).
# Coordinates: X = length (front wall at x=0), Y = width, Z = up (floor underside = 0).

import adsk.core, adsk.fusion
import traceback

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
BOSS_XY               = 5.0     # FIX: was 6.0 (tangent); now overlaps walls 1 mm/side

# ---------------- helpers ----------------
MM = 0.1  # database units are cm
def V(mm):   return adsk.core.ValueInput.createByReal(mm * MM)
def P(u, v): return adsk.core.Point3D.create(u * MM, v * MM, 0)

def rect_sketch(plane, u0, v0, u1, v1):
    sk = root.sketches.add(plane)
    # guaranteed closed profile, no micro-gaps
    sk.sketchCurves.sketchLines.addTwoPointRectangle(P(u0, v0), P(u1, v1))
    return sk

def circle_sketch(plane, u, v, r):
    sk = root.sketches.add(plane)
    sk.sketchCurves.sketchCircles.addByCenterRadius(P(u, v), r * MM)
    return sk

def off_plane(base, mm_off):
    inp = root.constructionPlanes.createInput()
    inp.setByOffset(base, V(mm_off))
    return root.constructionPlanes.add(inp)

NEW  = adsk.fusion.FeatureOperations.NewBodyFeatureOperation
JOIN = adsk.fusion.FeatureOperations.JoinFeatureOperation
CUT  = adsk.fusion.FeatureOperations.CutFeatureOperation

def extrude(sk, mm_dist, op=NEW):
    profs = adsk.core.ObjectCollection.create()
    for p in sk.profiles:
        profs.add(p)

    if profs.count == 0:
        return None

    inp = root.features.extrudeFeatures.createInput(profs, op)
    # setOneSideExtent requires (extent, direction)
    extent = adsk.fusion.DistanceExtentDefinition.create(V(mm_dist))
    inp.setOneSideExtent(extent, adsk.fusion.ExtentDirections.PositiveExtentDirection)

    feat = root.features.extrudeFeatures.add(inp)
    if feat.bodies.count > 0:
        return feat.bodies.item(0)
    return None

def combine(target, tools, op):
    tool_oc = adsk.core.ObjectCollection.create()
    for t in tools:
        if t:  # skip None
            tool_oc.add(t)

    if tool_oc.count == 0:
        return None

    inp = root.features.combineFeatures.createInput(target, tool_oc)
    inp.operation = op
    inp.isKeepTools = False  # keep the timeline clean
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

    # battery bay partition walls with wiring gap (embedded 0.5 mm into floor)
    batt_tools = []
    for bx in (BATT_X0, BATT_X0 + BATT_L - 2):
        for seg in ((W/2 - BATT_W/2, W/2 - 10), (W/2 + 10, W/2 + BATT_W/2)):
            batt_tools.append(extrude(rect_sketch(off_plane(xy, FLOOR_T - 0.5), bx, seg[0], bx + 2, seg[1]), BATT_H + 0.5))

    # corner screw bosses (full-height posts overlapping walls) + pilots
    boss_tools, pilot_tools = [], []
    corners = [(BOSS_XY, BOSS_XY), (L - BOSS_XY, BOSS_XY), (BOSS_XY, W - BOSS_XY), (L - BOSS_XY, W - BOSS_XY)]
    for bx, by in corners:
        boss_tools.append(extrude(circle_sketch(off_plane(xy, FLOOR_T), bx, by, BOSS_D/2), INNER_H))
        pilot_tools.append(extrude(circle_sketch(off_plane(xy, H - 10), bx, by, PILOT_D/2), 12))

    # FIX: order matters — cut the shell FIRST, then join internals, then drill pilots
    combine(tub, [cavity, wl, wr, us, cam] + strap_tools + led_tools, CUT)
    combine(tub, batt_tools + boss_tools, JOIN)
    combine(tub, pilot_tools, CUT)
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
except Exception:
    ui.messageBox("AGV chassis script failed:\n" + traceback.format_exc())