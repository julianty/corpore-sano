"""Generates the app icon sources (icon.svg, mark.svg) plus HTML wrappers for rendering.

Render to PNG with headless Chrome. It needs network access to load the Rajdhani font:
  python3 generate.py
  for n in icon mark; do
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars \
      --force-device-scale-factor=1 --window-size=1024,1024 --default-background-color=00000000 \
      --virtual-time-budget=5000 --screenshot=final-$n.png "file://$PWD/final-$n.html"
  done
  sips -s format png final-icon.png --out final-icon.png   # flattens alpha; iOS rejects icons with transparency
Then copy final-icon.png -> ../icon.png, and final-mark.png -> ../splash-icon.png and ../adaptive-icon.png.

The barbell is loaded correctly, from the centre outwards: grip, sleeve shoulder,
heaviest plate, lighter plate, clip collar, then bare sleeve.
"""
MINT="#3de8a0"; MINT_D="#27b97c"; STEEL="#d9dedc"; BG="#0b0b0c"
CY=712  # barbell centre line
def bar():
    p=[]
    def r(x,w,h,f,rx): p.append(f'<rect x="{x}" y="{CY-h/2}" width="{w}" height="{h}" rx="{rx}" fill="{f}"/>')
    r(350,324,22,STEEL,11)                 # grip (centre), runs under both shoulders
    # left side, centre -> outside; mirrored to the right
    for x,w,h,f,rx in [
        (166,190,40,STEEL,10),             # sleeve (drawn first; plates sit on it)
        (338,22,86,STEEL,6),               # sleeve shoulder / inner stop
        (286,52,256,MINT,16),              # heaviest plate, innermost against the shoulder
        (246,38,176,MINT_D,12),            # lighter plate, outside it
        (228,16,66,STEEL,5),               # clip collar locking the plates
    ]:
        r(x,w,h,f,rx); r(1024-x-w,w,h,f,rx)
    return "".join(p)
def text(): return f'<text x="512" y="488" text-anchor="middle" font-family="Rajdhani" font-weight="700" font-size="400" letter-spacing="-6" fill="{MINT}">CS</text>'
def svg(bg, scale=1.0):
    back=f'<rect width="1024" height="1024" fill="{BG}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">'
            f'<!-- Source for mobile/assets icons. Text needs the Rajdhani 700 font (Google Fonts) to render. -->{back}'
            f'<g transform="translate(512 512) scale({scale}) translate(-512 -512)">{text()}{bar()}</g></svg>')
page=lambda s: f'<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@700&display=block" rel="stylesheet"><style>html,body{{margin:0;background:transparent;overflow:hidden}}svg{{display:block}}</style></head><body>{s}</body></html>'
for n,s in (("icon",svg(True)),("mark",svg(False,0.70))):
    open(f"{n}.svg","w").write(s); open(f"final-{n}.html","w").write(page(s))
