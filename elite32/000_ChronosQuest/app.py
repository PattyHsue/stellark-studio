import webview
import os
import sys

def get_resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)

if __name__ == '__main__':
    # Get the path to index.html
    html_path = get_resource_path('index.html')
    
    # Create the window
    window = webview.create_window(
        'Chronos Quest: Adventure Brick Breaker', 
        html_path,
        width=1200,
        height=800,
        resizable=True,
        background_color='#000000'
    )
    
    # Start the application
    webview.start()
