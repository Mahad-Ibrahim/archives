# Project Information
project = 'mahad@archives'  # <--- This fixes the top-left text
copyright = '2026, Mahad Ibrahim'
author = 'Mahad Ibrahim'

# 1. Set the Theme
html_theme = "shibuya"

# 2. Extensions (Cleaned)
# REMOVED: 'sphinx_rtd_theme' and 'sphinx_rtd_dark_mode'
# They conflict with Shibuya.
extensions = [
    # Add any standard extensions you need here, e.g., 'sphinx.ext.autodoc'
]

# 3. Configure Shibuya (The Modern Way)
html_theme_options = {
    "color_mode": "dark",       # Forces Dark Mode (No toggle needed)
    "accent_color": "cyan",     # Gives you that "Tron/Hacker" glow
    "github_url": "https://github.com/Mahad-Ibrahim",
    "nav_links": [
        { "title": "Kernel", "url": "kernel/index" },
        { "title": "Projects", "url": "projects/index" },
    ]
}

# 4. Static Paths
html_static_path = ['_static']

# 5. CSS Overrides
# Keep this included so we load your 'Cascadia Code' font settings!
html_css_files = [
    'css/custom.css',
]

html_js_files = [
    # 1. Load Lenis (The Physics Engine) - Version Pinned for Stability
    # We use a tuple (url, options) to add the "defer" attribute
    ('https://cdn.jsdelivr.net/gh/studio-freight/lenis@1.0.29/bundled/lenis.min.js', {'defer': 'defer'}),
    
    # 2. Load your Controller - Also deferred so it waits for Lenis to load
    ('js/smooth_scroll.js', {'defer': 'defer'}), 
]
