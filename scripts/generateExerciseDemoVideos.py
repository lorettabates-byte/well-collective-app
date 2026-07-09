#!/usr/bin/env python3
from __future__ import annotations

import argparse
import math
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


W, H = 640, 360
FPS = 12
DURATION = 3.0
FRAME_COUNT = int(FPS * DURATION)

BG = (248, 247, 242)
CARD = (255, 255, 252)
INK = (35, 43, 45)
ARM = (184, 91, 68)
LEG = (20, 92, 96)
PROP = (126, 126, 118)
BAND = (142, 79, 166)
ACCENT = (58, 151, 164)
MUTED = (203, 199, 189)


def slug(name: str) -> str:
    value = name.lower().replace("&", "and")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def pulse(t: float) -> float:
    return (1 - math.cos(2 * math.pi * t)) / 2


def alt(t: float) -> float:
    return math.sin(2 * math.pi * t)


def lerp(a: float, b: float, p: float) -> float:
    return a + (b - a) * p


def pt(a: tuple[float, float], b: tuple[float, float], p: float) -> tuple[float, float]:
    return (lerp(a[0], b[0], p), lerp(a[1], b[1], p))


def line(d: ImageDraw.ImageDraw, pts, fill=INK, width=7):
    d.line([(int(x), int(y)) for x, y in pts], fill=fill, width=width, joint="curve")


def circle(d: ImageDraw.ImageDraw, c, r=14, outline=INK, width=5, fill=BG):
    x, y = c
    d.ellipse((x - r, y - r, x + r, y + r), outline=outline, width=width, fill=fill)


def dumbbell(d: ImageDraw.ImageDraw, c, angle=0.0, size=18):
    x, y = c
    dx = math.cos(angle) * size / 2
    dy = math.sin(angle) * size / 2
    p1 = (x - dx, y - dy)
    p2 = (x + dx, y + dy)
    line(d, [p1, p2], PROP, 4)
    for px, py in (p1, p2):
        d.rounded_rectangle((px - 5, py - 7, px + 5, py + 7), radius=3, fill=PROP)


def arrow(d: ImageDraw.ImageDraw, a, b, fill=ACCENT):
    line(d, [a, b], fill, 4)
    ang = math.atan2(b[1] - a[1], b[0] - a[0])
    for off in (2.45, -2.45):
        end = (b[0] - math.cos(ang + off) * 14, b[1] - math.sin(ang + off) * 14)
        line(d, [b, end], fill, 4)


def draw_person(
    d: ImageDraw.ImageDraw,
    head,
    neck,
    hip,
    l_shoulder=None,
    r_shoulder=None,
    l_elbow=None,
    r_elbow=None,
    l_hand=None,
    r_hand=None,
    l_knee=None,
    r_knee=None,
    l_foot=None,
    r_foot=None,
):
    l_shoulder = l_shoulder or neck
    r_shoulder = r_shoulder or neck
    if l_knee and l_foot:
        line(d, [hip, l_knee, l_foot], LEG)
    if r_knee and r_foot:
        line(d, [hip, r_knee, r_foot], LEG)
    line(d, [neck, hip], INK)
    if l_shoulder != r_shoulder:
        line(d, [l_shoulder, r_shoulder], INK, 5)
    if l_hand:
        pts = [l_shoulder]
        if l_elbow:
            pts.append(l_elbow)
        pts.append(l_hand)
        line(d, pts, ARM)
    if r_hand:
        pts = [r_shoulder]
        if r_elbow:
            pts.append(r_elbow)
        pts.append(r_hand)
        line(d, pts, ARM)
    circle(d, head)


def base(d: ImageDraw.ImageDraw, name: str):
    d.rounded_rectangle((16, 16, W - 16, H - 16), radius=18, fill=CARD, outline=(231, 228, 219), width=2)
    line(d, [(84, 304), (556, 304)], MUTED, 3)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 18)
        small = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 12)
    except OSError:
        font = ImageFont.load_default()
        small = ImageFont.load_default()
    d.text((30, 28), name, fill=INK, font=font)
    d.text((30, 322), "WELL Collective demo", fill=(118, 113, 103), font=small)


def draw_standing(d, t, name):
    draw_person(
        d,
        (320, 92),
        (320, 122),
        (320, 214),
        (284, 144),
        (356, 144),
        (282, 182),
        (358, 182),
        (274, 220),
        (366, 220),
        (292, 256),
        (348, 256),
        (280, 304),
        (360, 304),
    )


def draw_squat(d, t, name, wide=0, goblet=False, chair=False):
    p = pulse(t)
    hip_y = lerp(206, 246, p)
    neck_y = lerp(120, 142, p)
    head_y = neck_y - 31
    feet = (250 - wide, 390 + wide)
    knees = (lerp(288, 260 - wide, p), lerp(352, 380 + wide, p))
    if chair:
        d.rectangle((392, 235, 470, 304), fill=(224, 220, 211), outline=PROP, width=3)
    draw_person(
        d,
        (320, head_y),
        (320, neck_y),
        (320, hip_y),
        (286, neck_y + 24),
        (354, neck_y + 24),
        (286, neck_y + 62),
        (354, neck_y + 62),
        (292, neck_y + 86),
        (348, neck_y + 86),
        (knees[0], lerp(252, 266, p)),
        (knees[1], lerp(252, 266, p)),
        (feet[0], 304),
        (feet[1], 304),
    )
    if goblet:
        dumbbell(d, (320, neck_y + 62), math.pi / 2, 22)
    arrow(d, (430, 118), (430, 186))


def draw_wall_sit(d, t, name):
    p = pulse(t)
    d.rectangle((228, 82, 238, 304), fill=(219, 216, 207))
    hip = (306, 228 + 4 * p)
    neck = (270, 142 + 4 * p)
    draw_person(
        d,
        (270, 112 + 4 * p),
        neck,
        hip,
        (270, 158 + 4 * p),
        (270, 158 + 4 * p),
        None,
        (334, 194 + 4 * p),
        (246, 204 + 4 * p),
        (356, 218 + 4 * p),
        (382, 228 + 4 * p),
        (382, 270 + 4 * p),
        (382, 270 + 4 * p),
        (382, 304),
    )
    d.arc((250, 208, 330, 268), 180, 270, fill=ACCENT, width=4)


def draw_shoulder_press(d, t, name):
    p = pulse(t)
    neck = (320, 122)
    hip = (320, 214)
    l_elbow = pt((282, 158), (292, 96), p)
    r_elbow = pt((358, 158), (348, 96), p)
    l_hand = pt((282, 118), (300, 62), p)
    r_hand = pt((358, 118), (340, 62), p)
    draw_person(
        d,
        (320, 92),
        neck,
        hip,
        (286, 144),
        (354, 144),
        l_elbow,
        r_elbow,
        l_hand,
        r_hand,
        (292, 256),
        (348, 256),
        (280, 304),
        (360, 304),
    )
    dumbbell(d, l_hand, 0)
    dumbbell(d, r_hand, 0)
    arrow(d, (404, 140), (404, 74))


def draw_squat_press(d, t, name):
    p = pulse(t)
    squat_p = p
    press_p = 1 - p
    hip_y = lerp(206, 246, squat_p)
    neck_y = lerp(120, 142, squat_p)
    l_elbow = pt((282, neck_y + 38), (292, 98), press_p)
    r_elbow = pt((358, neck_y + 38), (348, 98), press_p)
    l_hand = pt((282, neck_y + 4), (300, 66), press_p)
    r_hand = pt((358, neck_y + 4), (340, 66), press_p)
    draw_person(
        d,
        (320, neck_y - 30),
        (320, neck_y),
        (320, hip_y),
        (286, neck_y + 22),
        (354, neck_y + 22),
        l_elbow,
        r_elbow,
        l_hand,
        r_hand,
        (270, lerp(252, 266, squat_p)),
        (370, lerp(252, 266, squat_p)),
        (238, 304),
        (402, 304),
    )
    dumbbell(d, l_hand, 0)
    dumbbell(d, r_hand, 0)


def draw_lunge(d, t, name, reverse=False, split=False, curtsy=False):
    p = pulse(t)
    hip = (320, lerp(196, 226, p))
    neck = (320, hip[1] - 90)
    if curtsy:
        l_knee = (288, lerp(250, 270, p))
        r_knee = (352, lerp(250, 270, p))
        l_foot = (250, 304)
        r_foot = (300, 304)
    else:
        l_knee = (260, lerp(248, 268, p))
        r_knee = (390, lerp(252, 278, p))
        l_foot = (220, 304)
        r_foot = (438, 304)
    draw_person(
        d,
        (320, neck[1] - 30),
        neck,
        hip,
        (292, neck[1] + 26),
        (348, neck[1] + 26),
        (292, neck[1] + 64),
        (348, neck[1] + 64),
        (292, neck[1] + 86),
        (348, neck[1] + 86),
        l_knee,
        r_knee,
        l_foot,
        r_foot,
    )
    arrow(d, (190, 274), (236, 274))


def draw_side_lunge(d, t, name):
    p = pulse(t)
    hip = (320, lerp(202, 235, p))
    neck = (320, hip[1] - 90)
    draw_person(
        d,
        (320, neck[1] - 30),
        neck,
        hip,
        (290, neck[1] + 26),
        (350, neck[1] + 26),
        (285, neck[1] + 62),
        (355, neck[1] + 62),
        (286, neck[1] + 86),
        (354, neck[1] + 86),
        (268, lerp(246, 272, p)),
        (405, 292),
        (238, 304),
        (466, 304),
    )
    arrow(d, (430, 250), (470, 280))


def draw_step_up(d, t, name):
    p = pulse(t)
    d.rectangle((360, 248, 470, 304), fill=(224, 220, 211), outline=PROP, width=3)
    hip = (320, lerp(214, 184, p))
    neck = (320, hip[1] - 92)
    draw_person(
        d,
        (320, neck[1] - 30),
        neck,
        hip,
        (292, neck[1] + 24),
        (348, neck[1] + 24),
        (292, neck[1] + 62),
        (348, neck[1] + 62),
        (284, neck[1] + 82),
        (356, neck[1] + 82),
        (392, 248),
        (278, 256),
        (410, 304),
        (260, 304),
    )
    arrow(d, (476, 248), (476, 196))


def draw_calf_raise(d, t, name):
    p = pulse(t)
    lift = 12 * p
    draw_person(
        d,
        (320, 92 - lift),
        (320, 122 - lift),
        (320, 214 - lift),
        (292, 144 - lift),
        (348, 144 - lift),
        (290, 184 - lift),
        (350, 184 - lift),
        (284, 222 - lift),
        (356, 222 - lift),
        (306, 256 - lift),
        (334, 256 - lift),
        (294, 304),
        (346, 304),
    )
    arrow(d, (390, 292), (390, 260))


def draw_hinge_row(d, t, name, tricep=False, reverse_fly=False, rdl=False):
    p = pulse(t)
    hip = (320, 224)
    neck = (250, 150)
    head = (226, 128)
    l_foot = (280, 304)
    r_foot = (390, 304)
    l_knee = (294, 262)
    r_knee = (356, 260)
    if tricep:
        elbow = (300, 184)
        hand = pt((302, 232), (372, 184), p)
        draw_person(d, head, neck, hip, (268, 164), (282, 166), None, elbow, (252, 230), hand, l_knee, r_knee, l_foot, r_foot)
        dumbbell(d, hand, 0, 16)
        arrow(d, (318, 220), (374, 188))
    elif reverse_fly:
        l_hand = pt((302, 240), (216, 176), p)
        r_hand = pt((302, 240), (388, 176), p)
        draw_person(d, head, neck, hip, (268, 164), (282, 166), None, None, l_hand, r_hand, l_knee, r_knee, l_foot, r_foot)
        dumbbell(d, l_hand, 0, 14)
        dumbbell(d, r_hand, 0, 14)
    elif rdl:
        neck = pt((315, 120), (255, 158), p)
        head = (neck[0] - 18, neck[1] - 28)
        hip = (320, 216)
        hand_l = (300, lerp(175, 244, p))
        hand_r = (340, lerp(175, 244, p))
        draw_person(d, head, neck, hip, (305, neck[1] + 18), (335, neck[1] + 18), None, None, hand_l, hand_r, (306, 260), (344, 260), (292, 304), (368, 304))
        dumbbell(d, hand_l, math.pi / 2, 16)
        dumbbell(d, hand_r, math.pi / 2, 16)
    else:
        elbow = pt((300, 232), (322, 188), p)
        hand = pt((300, 250), (355, 198), p)
        draw_person(d, head, neck, hip, (268, 164), (282, 166), None, elbow, (252, 230), hand, l_knee, r_knee, l_foot, r_foot)
        dumbbell(d, hand, 0, 16)
        arrow(d, (322, 232), (360, 196))


def draw_biceps(d, t, name, hammer=False):
    p = pulse(t)
    hand_y = lerp(224, 154, p)
    draw_person(
        d,
        (320, 92),
        (320, 122),
        (320, 214),
        (286, 144),
        (354, 144),
        (286, 188),
        (354, 188),
        (286, hand_y),
        (354, hand_y),
        (292, 256),
        (348, 256),
        (280, 304),
        (360, 304),
    )
    dumbbell(d, (286, hand_y), math.pi / 2 if hammer else 0, 16)
    dumbbell(d, (354, hand_y), math.pi / 2 if hammer else 0, 16)


def draw_raise(d, t, name, lateral=False, front=False):
    p = pulse(t)
    if lateral:
        l_hand = pt((284, 218), (230, 146), p)
        r_hand = pt((356, 218), (410, 146), p)
    elif front:
        l_hand = pt((304, 220), (304, 142), p)
        r_hand = pt((336, 220), (336, 142), p)
    else:
        l_hand = pt((300, 220), (240, 150), p)
        r_hand = pt((340, 220), (400, 150), p)
    draw_person(
        d,
        (320, 92),
        (320, 122),
        (320, 214),
        (286, 144),
        (354, 144),
        None,
        None,
        l_hand,
        r_hand,
        (292, 256),
        (348, 256),
        (280, 304),
        (360, 304),
    )
    dumbbell(d, l_hand, 0, 14)
    dumbbell(d, r_hand, 0, 14)


def draw_chest_press(d, t, name):
    p = pulse(t)
    anchor = (210, 158)
    hand = pt((320, 170), (430, 170), p)
    neck = (300, 122)
    hip = (300, 214)
    line(d, [anchor, hand], BAND, 4)
    draw_person(d, (300, 92), neck, hip, (300, 144), (300, 144), None, (360, 170), (250, 220), hand, (286, 256), (344, 256), (270, 304), (360, 304))
    d.rectangle((196, 112, 206, 304), fill=(219, 216, 207))
    arrow(d, (360, 192), (426, 192))


def draw_band_row(d, t, name):
    p = pulse(t)
    hip = (300, 240)
    neck = (280, 166)
    hand = pt((410, 238), (322, 202), p)
    foot = (456, 304)
    line(d, [foot, hand], BAND, 4)
    draw_person(d, (254, 140), neck, hip, (282, 176), (292, 178), None, (350, 210), (232, 230), hand, (340, 276), (404, 288), (330, 304), foot)
    arrow(d, (398, 214), (330, 198))


def draw_lateral_band_walk(d, t, name):
    p = pulse(t)
    step = 26 * alt(t)
    hip = (320 + step, 230)
    neck = (320 + step, 132)
    l_foot = (260 + step - 18 * p, 304)
    r_foot = (380 + step + 18 * p, 304)
    l_knee = (286 + step - 10 * p, 266)
    r_knee = (354 + step + 10 * p, 266)
    line(d, [l_foot, r_foot], BAND, 4)
    draw_person(
        d,
        (320 + step, 102),
        neck,
        hip,
        (286 + step, 154),
        (354 + step, 154),
        (286 + step, 194),
        (354 + step, 194),
        (280 + step, 226),
        (360 + step, 226),
        l_knee,
        r_knee,
        l_foot,
        r_foot,
    )
    arrow(d, (240, 286), (282, 286))
    arrow(d, (400, 286), (442, 286))


def draw_plank(d, t, name, side=False, tap=False, jacks=False):
    p = pulse(t)
    hip = (340, 210)
    neck = (240, 202)
    head = (206, 188)
    foot_l = (500 - 26 * p if jacks else 500, 304)
    foot_r = (500 + 26 * p if jacks else 500, 304)
    hand_l = (250, 304)
    hand_r = (282, 304)
    if side:
        draw_person(d, head, neck, hip, (246, 212), (246, 212), None, None, (238, 304), (260, 150), (410, 260), (466, 286), (430, 304), (520, 304))
        return
    if tap:
        hand_r = pt((282, 304), (270, 210), p)
    draw_person(d, head, neck, hip, (240, 220), (270, 220), None, None, hand_l, hand_r, (412, 260), (430, 262), foot_l, foot_r)
    if jacks:
        arrow(d, (472, 296), (518, 296))
    if tap:
        arrow(d, (300, 286), (270, 214))


def draw_renegade_row(d, t, name):
    p = pulse(t)
    head = (206, 188)
    neck = (238, 202)
    hip = (348, 210)
    row_hand = pt((290, 304), (330, 222), p)
    draw_person(
        d,
        head,
        neck,
        hip,
        (240, 220),
        (270, 220),
        None,
        (310, 258),
        (240, 304),
        row_hand,
        (418, 260),
        (438, 260),
        (516, 304),
        (516, 304),
    )
    dumbbell(d, (240, 304), 0, 18)
    dumbbell(d, row_hand, 0, 18)
    arrow(d, (318, 286), (334, 226))


def draw_pushup(d, t, name, incline=False, wall=False):
    p = pulse(t)
    if wall:
        d.rectangle((430, 90, 438, 304), fill=(219, 216, 207))
        hand = (430, 178)
        hip = pt((300, 210), (324, 220), p)
        neck = pt((244, 154), (270, 166), p)
        draw_person(d, (neck[0] - 20, neck[1] - 26), neck, hip, (254, 168), (260, 172), None, (362, 178), (238, 222), hand, (324, 256), (370, 266), (300, 304), (386, 304))
        return
    if incline:
        d.rectangle((370, 230, 500, 304), fill=(224, 220, 211), outline=PROP, width=3)
        hand_y = 230
    else:
        hand_y = 304
    sag = 18 * p
    hip = (350, 222 + sag)
    neck = (236, 206 + sag)
    draw_person(d, (205, 190 + sag), neck, hip, (238, 220 + sag), (268, 222 + sag), None, None, (240, hand_y), (284, hand_y), (430, 260 + sag), (458, 270 + sag), (520, 304), (520, 304))


def draw_dip(d, t, name):
    p = pulse(t)
    d.rectangle((254, 220, 376, 244), fill=(224, 220, 211), outline=PROP, width=3)
    d.rectangle((276, 244, 288, 304), fill=(224, 220, 211), outline=PROP, width=2)
    d.rectangle((344, 244, 356, 304), fill=(224, 220, 211), outline=PROP, width=2)
    hip = (382, lerp(214, 244, p))
    neck = (376, hip[1] - 78)
    hand = (330, 222)
    elbow = pt((350, 202), (346, 242), p)
    draw_person(d, (372, neck[1] - 28), neck, hip, (366, neck[1] + 18), (372, neck[1] + 18), None, elbow, (420, hip[1] + 22), hand, (450, 274), (512, 282), (500, 304), (548, 304))
    arrow(d, (418, 218), (418, 252))


def draw_bridge(d, t, name, march=False):
    p = pulse(t)
    hip_y = lerp(258, 210, p)
    head = (160, 258)
    shoulder = (200, 250)
    hip = (330, hip_y)
    knee = (430, 256)
    foot = (486, 304)
    line(d, [shoulder, hip, knee, foot], INK, 7)
    circle(d, head)
    line(d, [(184, 268), (250, 280)], ARM, 6)
    if march:
        knee2 = (360, lerp(256, 218, p))
        foot2 = (376, lerp(304, 252, p))
        line(d, [hip, knee2, foot2], LEG)
    else:
        line(d, [hip, (250, 284), (220, 304)], LEG)
    arrow(d, (326, 260), (326, 212))


def draw_quad_floor(d, t, name, dog=False, donkey=False, hydrant=False, crawl=False):
    p = pulse(t)
    head = (206, 182)
    neck = (238, 198)
    hip = (374, 198)
    l_hand = (246, 304)
    r_hand = (280, 304)
    l_foot = (386, 304)
    r_foot = (466, 304)
    r_knee = (430, 304)
    if dog:
        l_hand = pt((246, 304), (164, 176), p)
        r_foot = pt((466, 304), (544, 180), p)
    elif donkey:
        r_knee = (420, 250)
        r_foot = pt((458, 238), (520, 154), p)
    elif hydrant:
        r_knee = pt((430, 304), (488, 240), p)
        r_foot = pt((466, 304), (516, 278), p)
    elif crawl:
        l_hand = (246 + 24 * alt(t), 304)
        r_foot = (466 - 24 * alt(t), 304)
    draw_person(d, head, neck, hip, (238, 208), (268, 208), None, None, l_hand, r_hand, (344, 304), r_knee, l_foot, r_foot)


def draw_clamshell(d, t, name):
    p = pulse(t)
    head = (190, 254)
    shoulder = (230, 250)
    hip = (350, 254)
    line(d, [shoulder, hip], INK)
    circle(d, head)
    line(d, [(230, 262), (300, 280)], ARM, 6)
    line(d, [hip, (425, 284), (500, 304)], LEG)
    line(d, [hip, (420, lerp(286, 230, p)), (500, lerp(304, 270, p))], LEG)
    arrow(d, (462, 286), (462, 242))


def draw_side_leg_lift(d, t, name):
    p = pulse(t)
    head = (190, 254)
    shoulder = (230, 250)
    hip = (350, 254)
    circle(d, head)
    line(d, [shoulder, hip], INK)
    line(d, [(230, 262), (300, 280)], ARM, 6)
    line(d, [hip, (425, 284), (500, 304)], LEG)
    line(d, [hip, (420, lerp(280, 196, p)), (510, lerp(302, 168, p))], LEG)
    arrow(d, (494, 274), (510, 190))


def draw_single_leg_deadlift(d, t, name):
    p = pulse(t)
    hip = (320, 218)
    neck = pt((320, 122), (248, 164), p)
    head = (neck[0], neck[1] - 30)
    back_foot = pt((342, 304), (456, 196), p)
    back_knee = pt((342, 260), (392, 214), p)
    hand = pt((300, 184), (280, 250), p)
    draw_person(d, head, neck, hip, (neck[0] - 16, neck[1] + 22), (neck[0] + 16, neck[1] + 22), None, None, hand, (hand[0] + 30, hand[1]), (306, 260), back_knee, (300, 304), back_foot)
    dumbbell(d, hand, math.pi / 2, 16)


def draw_mountain(d, t, name):
    p = pulse(t)
    head = (206, 188)
    neck = (238, 202)
    hip = (340, 210)
    foot_a = pt((500, 304), (360, 304), p)
    foot_b = pt((360, 304), (500, 304), p)
    draw_person(d, head, neck, hip, (240, 220), (270, 220), None, None, (240, 304), (284, 304), (396, 260), (430, 260), foot_a, foot_b)


def draw_superman(d, t, name):
    p = pulse(t)
    lift = 28 * p
    circle(d, (178, 258 - lift * 0.3))
    line(d, [(210, 266), (360, 270)], INK)
    line(d, [(215, 262), (150, 222 - lift)], ARM)
    line(d, [(360, 270), (500, 238 - lift)], LEG)
    arrow(d, (500, 270), (500, 238))


def draw_bicycle(d, t, name):
    p = pulse(t)
    circle(d, (176, 260))
    line(d, [(205, 268), (300, 272)], INK)
    line(d, [(210, 252), (272, 220)], ARM)
    line(d, [(300, 272), pt((388, 252), (340, 224), p), pt((492, 304), (410, 246), p)], LEG)
    line(d, [(300, 272), pt((350, 224), (420, 258), p), pt((390, 304), (500, 294), p)], LEG)
    arrow(d, (420, 230), (474, 252))


def draw_dead_bug(d, t, name):
    p = pulse(t)
    circle(d, (176, 260))
    shoulder = (210, 270)
    hip = (330, 276)
    line(d, [shoulder, hip], INK)
    line(d, [shoulder, pt((260, 188), (160, 214), p)], ARM)
    line(d, [shoulder, pt((272, 220), (300, 150), p)], ARM)
    line(d, [hip, pt((380, 224), (452, 286), p), pt((410, 164), (540, 304), p)], LEG)
    line(d, [hip, pt((402, 286), (350, 222), p), pt((514, 304), (400, 184), p)], LEG)


def draw_forward_fold(d, t, name):
    p = pulse(t)
    neck = pt((320, 122), (270, 242), p)
    hip = (320, 214)
    draw_person(d, (neck[0], neck[1] - 28), neck, hip, (neck[0], neck[1] + 20), (neck[0], neck[1] + 20), None, None, (284, 286), (356, 286), (302, 260), (338, 260), (292, 304), (348, 304))
    arrow(d, (410, 132), (396, 220))


def draw_cat_cow(d, t, name):
    p = pulse(t)
    arch = lerp(-28, 24, p)
    head = (208, lerp(182, 222, p))
    neck = (240, 206 + arch * 0.2)
    mid = (320, 194 + arch)
    hip = (400, 206 + arch * 0.2)
    circle(d, head)
    line(d, [neck, mid, hip], INK)
    line(d, [neck, (250, 304)], ARM)
    line(d, [hip, (390, 304)], LEG)
    line(d, [hip, (470, 304)], LEG)
    arrow(d, (320, 164), (320, 226))


def draw_child_pose(d, t, name):
    p = pulse(t)
    circle(d, (180, 266))
    line(d, [(210, 260), (340, 244), (420, 270)], INK)
    line(d, [(210, 262), (118, 290)], ARM)
    line(d, [(340, 246), (286, 304), (420, 304)], LEG)
    arrow(d, (170, 292), (120, 292))


def draw_thread_needle(d, t, name):
    p = pulse(t)
    head = pt((210, 184), (180, 246), p)
    neck = (240, 206)
    hip = (404, 206)
    circle(d, head)
    line(d, [neck, (320, 194), hip], INK)
    line(d, [neck, (250, 304)], ARM)
    line(d, [neck, pt((300, 252), (150, 268), p)], ARM)
    line(d, [hip, (388, 304)], LEG)
    line(d, [hip, (476, 304)], LEG)
    arrow(d, (250, 260), (166, 268))


def draw_downward_dog(d, t, name):
    p = pulse(t)
    head = (214, 238)
    neck = (240, 234)
    hip = (356, 134)
    l_foot = (456, 304)
    r_foot = (520, lerp(304, 278, p))
    circle(d, head)
    line(d, [neck, hip, (456, 304)], INK)
    line(d, [neck, (170, 304)], ARM)
    line(d, [neck, (214, 304)], ARM)
    line(d, [hip, (426, 242), l_foot], LEG)
    line(d, [hip, (486, 238), r_foot], LEG)
    arrow(d, (520, 286), (520, 304))


def draw_seated_fold(d, t, name, wide=False, butterfly=False, twist=False):
    p = pulse(t)
    hip = (320, 252)
    neck = pt((320, 150), (260, 228), p if not twist else 0.25)
    if twist:
        neck = (320, 150)
    head = (neck[0], neck[1] - 30)
    if butterfly:
        l_knee, r_knee, l_foot, r_foot = (270, 280), (370, 280), (304, 304), (336, 304)
    elif wide:
        l_knee, r_knee, l_foot, r_foot = (250, 284), (390, 284), (170, 304), (500, 304)
    else:
        l_knee, r_knee, l_foot, r_foot = (390, 286), (420, 286), (510, 304), (540, 304)
    l_hand = (240, 230) if twist else (260, 282)
    r_hand = (410, 214) if twist else (405, 286)
    draw_person(d, head, neck, hip, (298, neck[1] + 22), (342, neck[1] + 22), None, None, l_hand, r_hand, l_knee, r_knee, l_foot, r_foot)
    if twist:
        arrow(d, (396, 176), (430, 176))


def draw_lunge_stretch(d, t, name, quad=False, half=False, world=False):
    p = pulse(t)
    hip = (320, 226)
    neck = (302, 136)
    l_foot = (210, 304)
    r_foot = (470, 304)
    if half:
        l_knee = (250, 290)
        r_knee = (400, 260)
        neck = pt((306, 136), (260, 214), p)
    else:
        l_knee = (266, 272)
        r_knee = (394, 286)
    l_hand = (276, 268)
    r_hand = (338, 208)
    if quad:
        r_foot = (410, 248)
        r_hand = (410, 248)
    if world:
        r_hand = pt((330, 260), (388, 112), p)
    draw_person(d, (neck[0], neck[1] - 30), neck, hip, (292, neck[1] + 24), (334, neck[1] + 24), None, None, l_hand, r_hand, l_knee, r_knee, l_foot, r_foot)


def draw_kneeling_adductor(d, t, name):
    p = pulse(t)
    hip = (320, 234)
    neck = (310, 146)
    draw_person(
        d,
        (310, 116),
        neck,
        hip,
        (286, 168),
        (334, 168),
        (282, 208),
        (338, 208),
        (274, 238),
        (346, 238),
        (296, 294),
        (430, 286),
        (294, 304),
        (520, 304),
    )
    arrow(d, (440, 268), (505, 292))


def draw_frog(d, t, name):
    p = pulse(t)
    hip = (342, lerp(220, 242, p))
    neck = (258, 208)
    circle(d, (218, 194))
    line(d, [neck, (306, 204), hip], INK)
    line(d, [neck, (220, 304)], ARM)
    line(d, [neck, (280, 304)], ARM)
    line(d, [hip, (260, 278), (210, 304)], LEG)
    line(d, [hip, (430, 278), (500, 304)], LEG)
    arrow(d, (342, 230), (342, 260))


def draw_pigeon(d, t, name):
    p = pulse(t)
    hip = (320, 246)
    neck = pt((306, 150), (246, 220), p * 0.5)
    circle(d, (neck[0], neck[1] - 30))
    line(d, [neck, hip], INK)
    line(d, [hip, (260, 278), (210, 304)], LEG)
    line(d, [hip, (420, 280), (540, 304)], LEG)
    line(d, [(neck[0] - 10, neck[1] + 20), (250, 292)], ARM)
    line(d, [(neck[0] + 16, neck[1] + 20), (302, 292)], ARM)
    arrow(d, (275, 222), (238, 260))


def draw_supine(d, t, name, twist=False, figure=False, happy=False, reclined=False, hamstring=False, scorpion=False):
    p = pulse(t)
    head = (176, 260)
    shoulder = (210, 270)
    hip = (330, 276)
    circle(d, head)
    line(d, [shoulder, hip], INK)
    line(d, [(220, 260), (170, 226)], ARM)
    if hamstring:
        line(d, [hip, (400, 286), (500, 304)], LEG)
        line(d, [hip, (380, lerp(246, 120, p)), (420, lerp(216, 80, p))], LEG)
    elif happy:
        line(d, [hip, (285, 220), (260, 156)], LEG)
        line(d, [hip, (375, 220), (400, 156)], LEG)
        line(d, [(220, 260), (260, 156)], ARM)
        line(d, [(240, 260), (400, 156)], ARM)
    elif reclined:
        line(d, [hip, (280, 300), (220, 304)], LEG)
        line(d, [hip, (380, 300), (440, 304)], LEG)
        line(d, [(220, 260), (180, 304)], ARM)
        line(d, [(240, 260), (300, 304)], ARM)
    elif twist:
        line(d, [hip, (380, 246), (450, 214)], LEG)
        line(d, [hip, (400, 292), (510, 304)], LEG)
        arrow(d, (405, 246), (455, 220))
    elif figure:
        line(d, [hip, (410, 252), (500, 304)], LEG)
        line(d, [hip, (380, 222), (450, 246)], LEG)
    elif scorpion:
        line(d, [hip, (430, 274), (480, 226)], LEG)
        line(d, [hip, (400, 294), (500, 304)], LEG)
        line(d, [(220, 260), (150, 230)], ARM)
    else:
        line(d, [hip, (420, 284), (520, 304)], LEG)
        line(d, [hip, (380, 240), (460, 278)], LEG)


def draw_upper_body_stretch(d, t, name, mode):
    p = pulse(t)
    head = (320, 92)
    neck = (320, 122)
    hip = (320, 214)
    l_sh = (286, 144)
    r_sh = (354, 144)
    l_el = (286, 184)
    r_el = (354, 184)
    l_hand = (284, 224)
    r_hand = (356, 224)
    if mode == "cross":
        l_el, l_hand = (340, 150), (410, 150)
        r_el, r_hand = (350, 150), (300, 150)
    elif mode == "tricep":
        r_el, r_hand = (350, 72), (330, 132)
        l_el, l_hand = (300, 118), (330, 132)
    elif mode == "cowface":
        r_el, r_hand = (352, 80), (326, 126)
        l_el, l_hand = (292, 202), (326, 154)
    elif mode == "eagle":
        l_el, l_hand = (340, 150), (350, 112)
        r_el, r_hand = (300, 150), (310, 112)
    elif mode == "chest":
        l_el, l_hand = (260, 194), (230, 244)
        r_el, r_hand = (380, 194), (410, 244)
        arrow(d, (288, 236), (238, 250))
        arrow(d, (352, 236), (402, 250))
    elif mode == "lat":
        l_el, l_hand = (288, 82), (254, 74)
        r_el, r_hand = (352, 82), (386, 74)
        head = (320, 98)
        arrow(d, (408, 76), (442, 76))
    elif mode == "wrist_flex":
        r_el, r_hand = (382, 154), (438, 174)
        l_el, l_hand = (370, 170), (438, 190)
    elif mode == "wrist_ext":
        r_el, r_hand = (382, 154), (438, 174)
        l_el, l_hand = (370, 190), (438, 174)
    elif mode == "doorway":
        d.rectangle((432, 92, 440, 304), fill=(219, 216, 207))
        r_el, r_hand = (402, 144), (436, 144)
        l_el, l_hand = (286, 184), (274, 224)
        arrow(d, (358, 156), (322, 156))
    draw_person(d, head, neck, hip, l_sh, r_sh, l_el, r_el, l_hand, r_hand, (292, 256), (348, 256), (280, 304), (360, 304))


def draw_side_bend(d, t, name, seated=False):
    p = pulse(t)
    lean = 42 * p
    hip = (320, 214)
    neck = (320 + lean, 122)
    head = (neck[0] + 6, neck[1] - 30)
    l_sh = (neck[0] - 32, neck[1] + 24)
    r_sh = (neck[0] + 32, neck[1] + 24)
    l_hand = (300, 224)
    r_el = (neck[0] + 6, 82)
    r_hand = (neck[0] - 44, 72)
    if seated:
        draw_person(d, head, neck, hip, l_sh, r_sh, None, r_el, l_hand, r_hand, (280, 286), (370, 286), (230, 304), (420, 304))
    else:
        draw_person(d, head, neck, hip, l_sh, r_sh, None, r_el, l_hand, r_hand, (292, 256), (348, 256), (280, 304), (360, 304))
    arrow(d, (406, 92), (448, 130))


def draw_neck(d, t, name, mode):
    p = pulse(t)
    hip = (320, 214)
    neck = (320, 122)
    head = (320, 92)
    l_el, r_el = (286, 184), (354, 184)
    l_hand, r_hand = (284, 224), (356, 224)
    if mode == "roll":
        head = (320 + 22 * math.sin(2 * math.pi * t), 94 + 14 * math.sin(4 * math.pi * t))
        arrow(d, (360, 76), (382, 100))
    elif mode == "upper_trap":
        head = (lerp(320, 292, p), lerp(92, 104, p))
        r_el, r_hand = (338, 76), head
    elif mode == "levator":
        head = (lerp(320, 292, p), lerp(92, 112, p))
        r_el, r_hand = (342, 78), (head[0] + 4, head[1] - 6)
        arrow(d, (354, 92), (300, 126))
    elif mode == "jaw":
        arrow(d, (320, 112), (320, 132))
    draw_person(d, head, neck, hip, (286, 144), (354, 144), l_el, r_el, l_hand, r_hand, (292, 256), (348, 256), (280, 304), (360, 304))


def draw_wall_or_door_stretch(d, t, name, calf=False, pec=False):
    d.rectangle((432, 92, 440, 304), fill=(219, 216, 207))
    neck = (300, 122)
    hip = (300, 214)
    if calf:
        draw_person(d, (300, 92), neck, hip, (300, 144), (300, 144), None, None, (250, 222), (434, 144), (286, 256), (370, 268), (270, 304), (438, 304))
    else:
        draw_person(d, (300, 92), neck, hip, (300, 144), (300, 144), None, (410, 144), (250, 222), (434, 144), (286, 256), (344, 256), (270, 304), (360, 304))
    arrow(d, (358, 154), (322, 154))


def draw_prone_quad(d, t, name):
    p = pulse(t)
    circle(d, (178, 258))
    line(d, [(210, 266), (344, 270)], INK)
    line(d, [(344, 270), (420, 304)], LEG)
    foot = pt((430, 304), (382, 220), p)
    line(d, [(344, 270), foot], LEG)
    line(d, [(226, 260), foot], ARM)


def draw_kneeling_chest(d, t, name):
    p = pulse(t)
    hip = (320, 238)
    neck = (320, 132)
    l_hand = pt((292, 226), (250, 258), p)
    r_hand = pt((348, 226), (390, 258), p)
    draw_person(
        d,
        (320, 102),
        neck,
        hip,
        (286, 154),
        (354, 154),
        (276, 206),
        (364, 206),
        l_hand,
        r_hand,
        (286, 278),
        (354, 278),
        (254, 304),
        (386, 304),
    )
    arrow(d, (286, 246), (246, 266))
    arrow(d, (354, 246), (394, 266))


def draw_cobra(d, t, name, sphinx=False):
    p = pulse(t)
    lift = lerp(10, 44 if not sphinx else 24, p)
    head = (190, 260 - lift)
    shoulder = (230, 274 - lift)
    hip = (350, 282)
    circle(d, head)
    line(d, [shoulder, hip, (510, 304)], INK)
    if sphinx:
        line(d, [shoulder, (260, 304), (320, 304)], ARM)
    else:
        line(d, [shoulder, (260, 304)], ARM)
        line(d, [shoulder, (310, 304)], ARM)
    arrow(d, (210, 274), (210, 218))


def draw_standing_quad(d, t, name):
    p = pulse(t)
    foot = pt((350, 304), (386, 210), p)
    draw_person(d, (320, 92), (320, 122), (320, 214), (286, 144), (354, 144), (282, 184), (370, 188), (280, 224), foot, (306, 256), (352, 256), (300, 304), foot)


def draw_band_kickback(d, t, name):
    p = pulse(t)
    d.rectangle((438, 104, 446, 304), fill=(219, 216, 207))
    hip = (320, 214)
    neck = (320, 122)
    moving_foot = pt((340, 304), (220, 272), p)
    line(d, [(300, 304), moving_foot], BAND, 4)
    draw_person(d, (320, 92), neck, hip, (286, 144), (354, 144), (370, 144), (410, 144), (286, 220), (440, 144), (306, 256), (332, 256), (300, 304), moving_foot)
    arrow(d, (284, 286), (226, 270))


def draw_it_band(d, t, name):
    p = pulse(t)
    lean = 24 * p
    draw_person(
        d,
        (320 + lean, 92),
        (320 + lean, 122),
        (320, 214),
        (288 + lean, 144),
        (352 + lean, 144),
        None,
        (368 + lean, 86),
        (280, 222),
        (340 + lean, 78),
        (306, 256),
        (356, 256),
        (286, 304),
        (372, 304),
    )
    arrow(d, (400, 92), (430, 132))


def draw_ankle(d, t, name):
    p = pulse(t)
    foot = (360 + 16 * math.sin(2 * math.pi * t), 304 - 10 * math.cos(2 * math.pi * t))
    d.rectangle((432, 104, 440, 304), fill=(219, 216, 207))
    draw_person(d, (320, 92), (320, 122), (320, 214), (286, 144), (354, 144), None, (412, 144), (280, 222), (438, 144), (304, 256), (342, 262), (294, 304), foot)
    arrow(d, (376, 288), (386, 304))


def draw_diaph(d, t, name):
    p = pulse(t)
    draw_person(d, (320, 92), (320, 122), (320, 214), (286, 144), (354, 144), (300, 178), (340, 178), (292, 188), (348, 188), (292, 256), (348, 256), (280, 304), (360, 304))
    d.arc((278 - 8 * p, 150 - 8 * p, 362 + 8 * p, 220 + 8 * p), 20, 160, fill=ACCENT, width=4)
    d.arc((278 - 8 * p, 150 - 8 * p, 362 + 8 * p, 220 + 8 * p), 200, 340, fill=ACCENT, width=4)


def render_frame(name: str, t: float) -> Image.Image:
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    base(d, name)
    kind = VIDEO_KINDS.get(name, "standing")
    if kind == "squat":
        draw_squat(d, t, name)
    elif kind == "wall_sit":
        draw_wall_sit(d, t, name)
    elif kind == "sumo":
        draw_squat(d, t, name, wide=34)
    elif kind == "chair_squat":
        draw_squat(d, t, name, chair=True)
    elif kind == "goblet":
        draw_squat(d, t, name, wide=20, goblet=True)
    elif kind == "shoulder_press":
        draw_shoulder_press(d, t, name)
    elif kind == "squat_press":
        draw_squat_press(d, t, name)
    elif kind in {"lunge", "reverse_lunge", "split", "curtsy"}:
        draw_lunge(d, t, name, curtsy=kind == "curtsy", split=kind == "split")
    elif kind == "side_lunge":
        draw_side_lunge(d, t, name)
    elif kind == "step":
        draw_step_up(d, t, name)
    elif kind == "calf":
        draw_calf_raise(d, t, name)
    elif kind == "row":
        draw_hinge_row(d, t, name)
    elif kind == "band_row":
        draw_band_row(d, t, name)
    elif kind == "band_walk":
        draw_lateral_band_walk(d, t, name)
    elif kind == "tricep_kickback":
        draw_hinge_row(d, t, name, tricep=True)
    elif kind == "reverse_fly":
        draw_hinge_row(d, t, name, reverse_fly=True)
    elif kind == "rdl":
        draw_hinge_row(d, t, name, rdl=True)
    elif kind == "biceps":
        draw_biceps(d, t, name)
    elif kind == "hammer":
        draw_biceps(d, t, name, hammer=True)
    elif kind == "front_raise":
        draw_raise(d, t, name, front=True)
    elif kind == "lateral_raise":
        draw_raise(d, t, name, lateral=True)
    elif kind == "overhead_tricep":
        draw_upper_body_stretch(d, t, name, "tricep")
    elif kind == "chest_press":
        draw_chest_press(d, t, name)
    elif kind == "pushup":
        draw_pushup(d, t, name)
    elif kind == "incline_pushup":
        draw_pushup(d, t, name, incline=True)
    elif kind == "wall_pushup":
        draw_pushup(d, t, name, wall=True)
    elif kind == "plank":
        draw_plank(d, t, name)
    elif kind == "side_plank":
        draw_plank(d, t, name, side=True)
    elif kind == "tap":
        draw_plank(d, t, name, tap=True)
    elif kind == "renegade":
        draw_renegade_row(d, t, name)
    elif kind == "jacks":
        draw_plank(d, t, name, jacks=True)
    elif kind == "mountain":
        draw_mountain(d, t, name)
    elif kind == "bridge":
        draw_bridge(d, t, name)
    elif kind == "bridge_march":
        draw_bridge(d, t, name, march=True)
    elif kind == "quad":
        draw_quad_floor(d, t, name)
    elif kind == "bird_dog":
        draw_quad_floor(d, t, name, dog=True)
    elif kind == "donkey":
        draw_quad_floor(d, t, name, donkey=True)
    elif kind == "hydrant":
        draw_quad_floor(d, t, name, hydrant=True)
    elif kind == "crawl":
        draw_quad_floor(d, t, name, crawl=True)
    elif kind == "clamshell":
        draw_clamshell(d, t, name)
    elif kind == "side_leg_lift":
        draw_side_leg_lift(d, t, name)
    elif kind == "single_deadlift":
        draw_single_leg_deadlift(d, t, name)
    elif kind == "dip":
        draw_dip(d, t, name)
    elif kind == "superman":
        draw_superman(d, t, name)
    elif kind == "bicycle":
        draw_bicycle(d, t, name)
    elif kind == "dead_bug":
        draw_dead_bug(d, t, name)
    elif kind == "forward_fold":
        draw_forward_fold(d, t, name)
    elif kind == "cat_cow":
        draw_cat_cow(d, t, name)
    elif kind == "child":
        draw_child_pose(d, t, name)
    elif kind == "thread":
        draw_thread_needle(d, t, name)
    elif kind == "downward_dog":
        draw_downward_dog(d, t, name)
    elif kind == "seated_twist":
        draw_seated_fold(d, t, name, twist=True)
    elif kind == "butterfly":
        draw_seated_fold(d, t, name, butterfly=True)
    elif kind == "seated_fold":
        draw_seated_fold(d, t, name)
    elif kind == "wide_fold":
        draw_seated_fold(d, t, name, wide=True)
    elif kind == "lunge_stretch":
        draw_lunge_stretch(d, t, name)
    elif kind == "quad_lunge":
        draw_lunge_stretch(d, t, name, quad=True)
    elif kind == "half_split":
        draw_lunge_stretch(d, t, name, half=True)
    elif kind == "world":
        draw_lunge_stretch(d, t, name, world=True)
    elif kind == "kneeling_adductor":
        draw_kneeling_adductor(d, t, name)
    elif kind == "frog":
        draw_frog(d, t, name)
    elif kind == "pigeon":
        draw_pigeon(d, t, name)
    elif kind == "supine":
        draw_supine(d, t, name)
    elif kind == "supine_twist":
        draw_supine(d, t, name, twist=True)
    elif kind == "figure_four":
        draw_supine(d, t, name, figure=True)
    elif kind == "happy":
        draw_supine(d, t, name, happy=True)
    elif kind == "reclined":
        draw_supine(d, t, name, reclined=True)
    elif kind == "hamstring_floor":
        draw_supine(d, t, name, hamstring=True)
    elif kind == "scorpion":
        draw_supine(d, t, name, scorpion=True)
    elif kind == "upper_cross":
        draw_upper_body_stretch(d, t, name, "cross")
    elif kind == "tricep_stretch":
        draw_upper_body_stretch(d, t, name, "tricep")
    elif kind == "cowface":
        draw_upper_body_stretch(d, t, name, "cowface")
    elif kind == "eagle":
        draw_upper_body_stretch(d, t, name, "eagle")
    elif kind == "chest_open":
        draw_upper_body_stretch(d, t, name, "chest")
    elif kind == "kneeling_chest":
        draw_kneeling_chest(d, t, name)
    elif kind == "lat":
        draw_upper_body_stretch(d, t, name, "lat")
    elif kind == "wrist_flex":
        draw_upper_body_stretch(d, t, name, "wrist_flex")
    elif kind == "wrist_ext":
        draw_upper_body_stretch(d, t, name, "wrist_ext")
    elif kind == "doorway":
        draw_wall_or_door_stretch(d, t, name, pec=True)
    elif kind == "calf_door":
        draw_wall_or_door_stretch(d, t, name, calf=True)
    elif kind == "side_bend":
        draw_side_bend(d, t, name)
    elif kind == "seated_side":
        draw_side_bend(d, t, name, seated=True)
    elif kind == "neck_roll":
        draw_neck(d, t, name, "roll")
    elif kind == "upper_trap":
        draw_neck(d, t, name, "upper_trap")
    elif kind == "levator":
        draw_neck(d, t, name, "levator")
    elif kind == "jaw":
        draw_neck(d, t, name, "jaw")
    elif kind == "standing_quad":
        draw_standing_quad(d, t, name)
    elif kind == "prone_quad":
        draw_prone_quad(d, t, name)
    elif kind == "cobra":
        draw_cobra(d, t, name)
    elif kind == "sphinx":
        draw_cobra(d, t, name, sphinx=True)
    elif kind == "it_band":
        draw_it_band(d, t, name)
    elif kind == "ankle":
        draw_ankle(d, t, name)
    elif kind == "band_kickback":
        draw_band_kickback(d, t, name)
    elif kind == "diaphragm":
        draw_diaph(d, t, name)
    else:
        draw_standing(d, t, name)
    return img


VIDEO_KINDS = {
    "Bodyweight Squats": "squat",
    "Push-Ups (knee or full)": "pushup",
    "Glute Bridges": "bridge",
    "Walking Lunges": "lunge",
    "Dumbbell Rows": "row",
    "Plank Hold": "plank",
    "Wall Sit": "wall_sit",
    "Standing Calf Raises": "calf",
    "Resistance Band Rows": "band_row",
    "Bicycle Crunches": "bicycle",
    "Sumo Squats": "sumo",
    "Reverse Lunges": "reverse_lunge",
    "Tricep Dips": "dip",
    "Side-Lying Leg Lifts": "side_leg_lift",
    "Donkey Kicks": "donkey",
    "Dead Bug": "dead_bug",
    "Lateral Band Walks": "band_walk",
    "Single-Leg Deadlift": "single_deadlift",
    "Shoulder Press": "shoulder_press",
    "Dumbbell Bicep Curls": "biceps",
    "Superman Hold": "superman",
    "Step-Ups": "step",
    "Squat to Overhead Press": "squat_press",
    "Renegade Rows": "renegade",
    "Hip Thrusts": "bridge",
    "Side Plank": "side_plank",
    "Resistance Band Chest Press": "chest_press",
    "Goblet Squat": "goblet",
    "Tricep Kickbacks": "tricep_kickback",
    "Mountain Climbers": "mountain",
    "Bear Crawls": "crawl",
    "Bird Dogs": "bird_dog",
    "Incline Push-Ups": "incline_pushup",
    "Chair Squats": "chair_squat",
    "Curtsy Lunges": "curtsy",
    "Split Squats": "split",
    "Calf Raise Pulses": "calf",
    "Dumbbell Romanian Deadlifts": "rdl",
    "Bent-Over Reverse Fly": "reverse_fly",
    "Front Raises": "front_raise",
    "Lateral Raises": "lateral_raise",
    "Hammer Curls": "hammer",
    "Overhead Tricep Extension": "overhead_tricep",
    "Glute Bridge March": "bridge_march",
    "Fire Hydrants": "hydrant",
    "Clamshells": "clamshell",
    "High Plank Shoulder Taps": "tap",
    "Plank Jacks": "jacks",
    "Standing Resistance Band Kickbacks": "band_kickback",
    "Wall Push-Ups": "wall_pushup",
    "Standing Forward Fold": "forward_fold",
    "Cat-Cow Stretch": "cat_cow",
    "Seated Spinal Twist": "seated_twist",
    "Hip Flexor Lunge Stretch": "lunge_stretch",
    "Child's Pose": "child",
    "Shoulder & Chest Opener": "chest_open",
    "Hamstring Stretch": "hamstring_floor",
    "Figure-Four Glute Stretch": "figure_four",
    "Neck Rolls": "neck_roll",
    "Supine Twist": "supine_twist",
    "Doorway Chest Stretch": "doorway",
    "Seated Butterfly": "butterfly",
    "Thread the Needle": "thread",
    "Low Lunge Quad Stretch": "quad_lunge",
    "Wide-Leg Seated Fold": "wide_fold",
    "Cow Face Arms": "cowface",
    "Standing Quad Stretch": "standing_quad",
    "Lying Piriformis Stretch": "figure_four",
    "Doorway Calf Stretch": "calf_door",
    "Upper Trapezius Stretch": "upper_trap",
    "Wrist Flexor Stretch": "wrist_flex",
    "Wrist Extensor Stretch": "wrist_ext",
    "Cross-Body Shoulder Stretch": "upper_cross",
    "Overhead Tricep Stretch": "tricep_stretch",
    "Lat Stretch": "lat",
    "Side Bend Stretch": "side_bend",
    "Standing IT Band Stretch": "it_band",
    "Kneeling Adductor Stretch": "kneeling_adductor",
    "Frog Stretch": "frog",
    "Happy Baby": "happy",
    "Pigeon Pose": "pigeon",
    "Half Split Stretch": "half_split",
    "Seated Hamstring Fold": "seated_fold",
    "Standing Side Lunge Stretch": "side_lunge",
    "Ankle Circles": "ankle",
    "Toe Touch Reach": "forward_fold",
    "Downward Dog Calf Pedal": "downward_dog",
    "Cobra Stretch": "cobra",
    "Sphinx Pose": "sphinx",
    "Kneeling Chest Opener": "kneeling_chest",
    "Wall Pec Stretch": "doorway",
    "Scorpion Stretch": "scorpion",
    "World's Greatest Stretch": "world",
    "Prone Quad Stretch": "prone_quad",
    "Reclined Bound Angle": "reclined",
    "Eagle Arms": "eagle",
    "Levator Scapulae Stretch": "levator",
    "Jaw Release Stretch": "jaw",
    "Seated Side Reach": "seated_side",
    "Diaphragm Rib Stretch": "diaphragm",
}


def read_names(workout_library: Path) -> list[str]:
    text = workout_library.read_text()
    start = text.index("export const RESISTANCE_EXERCISES")
    mid = text.index("export const STRETCHES", start)
    end = text.index("export const BREATHWORK", mid)
    return re.findall(r'name: "([^"]+)"', text[start:mid]) + re.findall(r'name: "([^"]+)"', text[mid:end])


def make_video(name: str, output: Path, ffmpeg: str):
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        for i in range(FRAME_COUNT):
            t = i / FRAME_COUNT
            img = render_frame(name, t)
            img.save(tmp_path / f"{i:04d}.png")
        subprocess.run(
            [
                ffmpeg,
                "-y",
                "-hide_banner",
                "-loglevel",
                "error",
                "-framerate",
                str(FPS),
                "-i",
                str(tmp_path / "%04d.png"),
                "-c:v",
                "libx264",
                "-pix_fmt",
                "yuv420p",
                "-movflags",
                "+faststart",
                "-crf",
                "28",
                "-preset",
                "veryfast",
                str(output),
            ],
            check=True,
        )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--app-root", type=Path, required=True)
    parser.add_argument("--server-root", type=Path)
    parser.add_argument(
        "--ffmpeg",
        default="/Applications/Wondershare UniConverter 17.app/Contents/MacOS/ffmpeg",
    )
    parser.add_argument("--only", nargs="*", default=None)
    args = parser.parse_args()

    names = read_names(args.app_root / "src/data/workoutLibrary.ts")
    if args.only:
        wanted = set(args.only)
        names = [name for name in names if name in wanted or slug(name) in wanted]

    app_public = args.app_root / "public/exercise-videos"
    for name in names:
        make_video(name, app_public / f"{slug(name)}.mp4", args.ffmpeg)

    if args.server_root:
        server_public = args.server_root / "public/exercise-videos"
        server_public.mkdir(parents=True, exist_ok=True)
        for name in names:
            shutil.copy2(app_public / f"{slug(name)}.mp4", server_public / f"{slug(name)}.mp4")

    print(f"generated {len(names)} videos")


if __name__ == "__main__":
    main()
