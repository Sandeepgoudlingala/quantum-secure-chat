"""
Pytest configuration and PYTHONPATH setup for the testing directory.
"""

import sys
import os

# Add backend directory to PYTHONPATH so `import app` resolves correctly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

