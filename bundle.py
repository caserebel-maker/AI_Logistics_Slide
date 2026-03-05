import os
import re
import base64

def get_base64_data_uri(file_path, mime_type):
    with open(file_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode('utf-8')
        return f"data:{mime_type};base64,{b64}"

def read_text(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()

base_dir = "/Volumes/C1TB/EB-CI/Nexus-M2/EBCI-Nexus/AI_Logistics_Slide"
output_path = os.path.join(base_dir, "presentation_offline.html")

html = read_text(os.path.join(base_dir, "index.html"))
css = read_text(os.path.join(base_dir, "styles.css"))
js = read_text(os.path.join(base_dir, "script.js"))
chart_js = read_text(os.path.join(base_dir, "chart.umd.min.js"))

# 1. Fonts
font_formats = {
    "300": "fonts/kanit_300.ttf",
    "400": "fonts/kanit_400.ttf",
    "500": "fonts/kanit_500.ttf",
    "600": "fonts/kanit_600.ttf",
    "700": "fonts/kanit_700.ttf"
}

font_css = ""
for weight, path in font_formats.items():
    uri = get_base64_data_uri(os.path.join(base_dir, path), "font/ttf")
    font_css += f"""
@font-face {{
  font-family: 'Kanit';
  font-style: normal;
  font-weight: {weight};
  font-display: swap;
  src: url({uri}) format('truetype');
}}"""

css = font_css + "\n" + css

# 2. Images in CSS
def css_image_replacer(match):
    img_name = match.group(1)
    img_path = os.path.join(base_dir, img_name)
    if os.path.exists(img_path):
        mime = "image/png" if img_name.endswith(".png") else "image/jpeg"
        uri = get_base64_data_uri(img_path, mime)
        return f"url('{uri}')"
    return match.group(0)

css = re.sub(r"url\(['\"]?([^'\")]+\.(?:png|jpg|jpeg))['\"]?\)", css_image_replacer, css)

# 3. Images in HTML
def html_image_replacer(match):
    attr = match.group(1)
    img_name = match.group(2)
    suffix = match.group(3) or ""
    
    img_path = os.path.join(base_dir, img_name)
    if os.path.exists(img_path):
        mime = "image/png" if img_name.endswith(".png") else "image/jpeg"
        uri = get_base64_data_uri(img_path, mime)
        return f'{attr}="{uri}"'
    return match.group(0)

# match src="filename.png" or src="filename.png?v=2"
html = re.sub(r'(src)=(?:[\'"])([^"\'?]+(?:png|jpg|jpeg))(\?v=\d+)?(?:[\'"])', html_image_replacer, html)

# 4. Remove external Google fonts
html = re.sub(r'<link href="https://fonts\.googleapis\.com/css2\?[^"]+" rel="stylesheet">', '', html)

# 5. Handle CSS, JS
html = re.sub(r'<link rel="stylesheet" href="styles\.css[^"]*">', lambda _: f"<style>\n{css}\n</style>", html)
html = re.sub(r'<script src="https://cdnjs\.cloudflare\.com/ajax/libs/Chart\.js/[^"]+"></script>', lambda _: f"<script>\n{chart_js}\n</script>", html)
html = re.sub(r'<script src="script\.js[^"]*"></script>', lambda _: f"<script>\n{js}\n</script>", html)

# Offline Title
html = html.replace('<title>', '<title>[Offline] ')

with open(output_path, "w", encoding="utf-8") as f:
    f.write(html)

print(f"Bundle created successfully at: {output_path}")
