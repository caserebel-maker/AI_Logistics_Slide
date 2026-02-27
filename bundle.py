import os
import re
import base64

def get_base64(file_path):
    with open(file_path, "rb") as f:
        return base64.b64encode(f.read()).decode('utf-8')

def read_text(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()

# Paths
base_dir = "/Volumes/C1TB/EB-CI/Nexus-M2/EBCI-Nexus/AI_Logistics_Slide"
output_path = os.path.join(base_dir, "presentation_offline.html")

# Read core files
html = read_text(os.path.join(base_dir, "index.html"))
css = read_text(os.path.join(base_dir, "styles.css"))
js = read_text(os.path.join(base_dir, "script.js"))
chart_js = read_text(os.path.join(base_dir, "chart.umd.min.js"))

# 1. Handle Fonts in CSS
# We'll replace the @font-face blocks with our Base64 versions
font_formats = {
    "300": "fonts/kanit_300.ttf",
    "400": "fonts/kanit_400.ttf",
    "500": "fonts/kanit_500.ttf",
    "600": "fonts/kanit_600.ttf",
    "700": "fonts/kanit_700.ttf"
}

font_css = ""
for weight, path in font_formats.items():
    b64 = get_base64(os.path.join(base_dir, path))
    font_css += f"""
@font-face {{
  font-family: 'Kanit';
  font-style: normal;
  font-weight: {weight};
  font-display: swap;
  src: url(data:font/ttf;base64,{b64}) format('truetype');
}}"""

# Prepend fonts to CSS
css = font_css + "\n" + css

# 2. Handle Images in HTML
# Currently only tannop.png is used as an <img> tag in HTML
tannop_b64 = get_base64(os.path.join(base_dir, "tannop.png"))
html = html.replace('src="tannop.png?v=2"', f'src="data:image/png;base64,{tannop_b64}"')

# 3. Handle External Links/Scripts in HTML
# Remove the external Google Fonts link
html = re.sub(r'<link href="https://fonts\.googleapis\.com/css2\?family=Kanit[^"]+" rel="stylesheet">', '', html)

# Handle CSS
css_placeholder = '<link rel="stylesheet" href="styles.css?v=5">'
if css_placeholder not in html:
    # Try generic matching if specific version fails
    html = re.sub(r'<link rel="stylesheet" href="styles\.css[^"]+">', css_placeholder, html)
html = html.replace(css_placeholder, f"<style>\n{css}\n</style>")

# Handle Chart.js
chart_placeholder = '<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js"></script>'
if chart_placeholder not in html:
    html = re.sub(r'<script src="https://cdnjs\.cloudflare\.com/ajax/libs/Chart\.js/[^"]+"></script>', chart_placeholder, html)
html = html.replace(chart_placeholder, f"<script>\n{chart_js}\n</script>")

# Handle script.js
js_placeholder = '<script src="script.js?v=6"></script>'
if js_placeholder not in html:
    html = re.sub(r'<script src="script\.js[^"]+"></script>', js_placeholder, html)
html = html.replace(js_placeholder, f"<script>\n{js}\n</script>")

# 4. Final Polish
# Update the title or add a watermark if desired
html = html.replace('<title>', '<title>[Offline] ')

# Write output
with open(output_path, "w", encoding="utf-8") as f:
    f.write(html)

print(f"Bundle created successfully at: {output_path}")
